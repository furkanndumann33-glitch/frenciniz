import { kv } from "@vercel/kv";
import { requireAdmin, readUser, publicUser, logActivity } from "./_lib/auth.js";
import { sendSms, clearSmsCache } from "./_lib/netgsm.js";
import { sendEmail, emailLayout, clearEmailCache } from "./_lib/email.js";

async function readOrder(ref) {
  const raw = await kv.get(`order:${ref}`);
  if (!raw) return null;
  return typeof raw === "string" ? JSON.parse(raw) : raw;
}
async function readCoupon(code) {
  const raw = await kv.get(`coupon:${code}`);
  if (!raw) return null;
  return typeof raw === "string" ? JSON.parse(raw) : raw;
}

export default async function handler(req, res) {
  const admin = await requireAdmin(req, res);
  if (!admin) return;
  const action = String(req.query.action || "").toLowerCase();

  try {
    if (action === "customers") {
      const ids = (await kv.lrange("users:index", 0, 499)) || [];
      const users = [];
      for (const id of ids) {
        const u = await readUser(id);
        if (u) users.push(publicUser(u));
      }
      users.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
      return res.status(200).json({ users, total: users.length });
    }

    if (action === "orders") {
      if (req.method === "GET") {
        const refs = (await kv.lrange("orders:index", 0, 499)) || [];
        const orders = [];
        for (const ref of refs) {
          const o = await readOrder(ref);
          if (o) orders.push(o);
        }
        orders.sort((a,b) => new Date(b.paidAt || b.createdAt || 0) - new Date(a.paidAt || a.createdAt || 0));
        return res.status(200).json({ orders, total: orders.length });
      }
      if (req.method === "PATCH") {
        const { orderRef, status, trackingNo, cargoFirma } = req.body || {};
        if (!orderRef || !status) return res.status(400).json({ error: "orderRef ve status zorunlu" });
        const o = await readOrder(orderRef);
        if (!o) return res.status(404).json({ error: "Sipariş bulunamadı" });
        const oldStatus = o.fulfillmentStatus;
        o.fulfillmentStatus = status;
        if (trackingNo) o.trackingNo = trackingNo;
        if (cargoFirma) o.cargoFirma = cargoFirma;
        o.updatedAt = new Date().toISOString();
        await kv.set(`order:${orderRef}`, JSON.stringify(o));
        await logActivity("order.status", { orderRef, status, by: admin.userId });

        // Kargoya verildi bildirimleri (failsafe — başarısız olsa flow'u bozmaz)
        const statusNorm = String(status).toLowerCase();
        const isShipped = oldStatus !== status && (statusNorm.includes("kargo") || statusNorm.includes("shipped") || statusNorm.includes("yola"));
        if (isShipped) {
          const buyerEmail = o?.buyer?.emailAddress;
          const buyerPhone = o?.buyer?.phoneNumber;
          const buyerName = o?.buyer?.name || "değerli müşterimiz";
          const trackInfo = (o.cargoFirma || o.trackingNo) ? `Kargo: ${o.cargoFirma || ""}${o.trackingNo ? ` — Takip: ${o.trackingNo}` : ""}` : "";

          if (buyerEmail) {
            sendEmail({
              to: buyerEmail,
              subject: `Siparişiniz kargoya verildi — ${orderRef}`,
              html: emailLayout({
                heading: `Siparişiniz kargoya verildi, ${buyerName}!`,
                lines: [
                  `Sipariş No: <strong>${orderRef}</strong>`,
                  trackInfo ? `${trackInfo}` : "Kargo takip bilgisi en kısa sürede iletilecektir.",
                  "Yolda iyi haberler!",
                ],
                cta: { url: "https://frenciniz.com/orders", label: "Siparişlerimi Gör" },
              }),
              text: `Siparisiniz kargoya verildi. No: ${orderRef}. ${trackInfo}`,
            }).catch(()=>{});
          }
          if (buyerPhone) {
            const smsMsg = `Frenciniz: Siparisiniz kargoya verildi. No: ${orderRef}.${trackInfo ? " " + trackInfo.replace("—","-") : ""}`;
            sendSms(buyerPhone, smsMsg.slice(0, 155)).catch(()=>{});
          }
        }

        return res.status(200).json({ success: true, order: o });
      }
    }

    // ── Trafik istatistikleri (son 30 gün) ────────
    if (action === "traffic") {
      const today = new Date();
      const days = [];
      for (let i = 29; i >= 0; i--) {
        const d = new Date(today); d.setDate(d.getDate() - i);
        days.push(d.toISOString().slice(0, 10));
      }
      const dailyViews = {};
      const dailyUnique = {};
      let totalViews = 0;
      let totalUnique = 0;

      // Daily counters
      for (const day of days) {
        const [v, u] = await Promise.all([
          kv.get(`traffic:views:${day}`),
          kv.get(`traffic:unique:${day}`),
        ]);
        dailyViews[day] = Number(v) || 0;
        dailyUnique[day] = Number(u) || 0;
        totalViews += dailyViews[day];
        totalUnique += dailyUnique[day];
      }

      // Top paths (son 7 gün)
      const last7 = days.slice(-7);
      const pathCounts = {};
      for (const day of last7) {
        const paths = (await kv.smembers(`traffic:paths:${day}`)) || [];
        for (const p of paths) {
          const c = await kv.get(`traffic:path:${day}:${p}`);
          pathCounts[p] = (pathCounts[p] || 0) + (Number(c) || 0);
        }
      }
      const topPaths = Object.entries(pathCounts)
        .sort((a, b) => b[1] - a[1]).slice(0, 10)
        .map(([path, count]) => ({ path, count }));

      // Top referrers (son 7 gün) — SCAN gerekli ama hobby plan'da KV scan kısıtlı, basit yaklaşım: tahmini domain'leri tara
      // Şu an boş döndürüyoruz; ileride detaylı agregasyon eklenir
      const topReferrers = [];

      const chart = days.map(d => ({
        date: d,
        views: dailyViews[d],
        unique: dailyUnique[d],
      }));

      return res.status(200).json({
        success: true,
        totalViews, totalUnique,
        chart, topPaths, topReferrers,
      });
    }

    if (action === "dashboard") {
      const userIds = (await kv.lrange("users:index", 0, 9999)) || [];
      const orderRefs = (await kv.lrange("orders:index", 0, 9999)) || [];

      let totalRevenue = 0, paidOrders = 0;
      const dailyRevenue = {};
      for (const ref of orderRefs) {
        const raw = await kv.get(`order:${ref}`);
        if (!raw) continue;
        const o = typeof raw === "string" ? JSON.parse(raw) : raw;
        if (o.status === "paid") {
          paidOrders += 1;
          totalRevenue += Number(o.amount || 0);
          const day = (o.paidAt || o.createdAt || "").slice(0, 10);
          if (day) dailyRevenue[day] = (dailyRevenue[day] || 0) + Number(o.amount || 0);
        }
      }

      let productsCount = 0;
      try {
        const cached = await kv.get("products:cache");
        if (cached) {
          const list = typeof cached === "string" ? JSON.parse(cached) : cached;
          productsCount = Array.isArray(list) ? list.length : (list?.products?.length || 0);
        }
      } catch {}

      const today = new Date();
      const last30 = [];
      for (let i = 29; i >= 0; i--) {
        const d = new Date(today); d.setDate(d.getDate() - i);
        const key = d.toISOString().slice(0,10);
        last30.push({ date: key, amount: Math.round(dailyRevenue[key] || 0) });
      }

      return res.status(200).json({
        stats: {
          totalRevenue: Math.round(totalRevenue),
          totalOrders: orderRefs.length,
          paidOrders,
          totalCustomers: userIds.length,
          productsCount,
        },
        chart: last30,
      });
    }

    if (action === "coupons") {
      if (req.method === "GET") {
        const codes = (await kv.lrange("coupons:index", 0, 499)) || [];
        const items = [];
        for (const c of codes) {
          const co = await readCoupon(c);
          if (co) items.push(co);
        }
        return res.status(200).json({ coupons: items });
      }
      if (req.method === "POST") {
        const { code, discount, type, minOrder, active } = req.body || {};
        if (!code || !discount) return res.status(400).json({ error: "code ve discount zorunlu" });
        const key = String(code).toUpperCase().trim();
        const existing = await readCoupon(key);
        const coupon = {
          code: key, discount: Number(discount),
          type: type === "₺" || type === "fixed" ? "₺" : "%",
          minOrder: Number(minOrder || 0),
          used: existing?.used || 0,
          active: active !== false,
          createdAt: existing?.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await kv.set(`coupon:${key}`, JSON.stringify(coupon));
        if (!existing) await kv.lpush("coupons:index", key);
        await logActivity("coupon.upsert", { code: key, by: admin.userId });
        return res.status(200).json({ success: true, coupon });
      }
      if (req.method === "DELETE") {
        const code = String(req.query.code || "").toUpperCase().trim();
        if (!code) return res.status(400).json({ error: "code zorunlu" });
        await kv.del(`coupon:${code}`);
        await kv.lrem("coupons:index", 0, code);
        await logActivity("coupon.delete", { code, by: admin.userId });
        return res.status(200).json({ success: true });
      }
    }

    if (action === "returns") {
      if (req.method === "GET") {
        const ids = (await kv.lrange("returns:index", 0, 199)) || [];
        const items = [];
        for (const id of ids) {
          const raw = await kv.get(`return:${id}`);
          if (raw) items.push(typeof raw === "string" ? JSON.parse(raw) : raw);
        }
        return res.status(200).json({ returns: items });
      }
      if (req.method === "PATCH") {
        const { id, status } = req.body || {};
        if (!id || !status) return res.status(400).json({ error: "id ve status zorunlu" });
        const raw = await kv.get(`return:${id}`);
        if (!raw) return res.status(404).json({ error: "İade kaydı bulunamadı" });
        const r = typeof raw === "string" ? JSON.parse(raw) : raw;
        r.status = status;
        r.updatedAt = new Date().toISOString();
        await kv.set(`return:${id}`, JSON.stringify(r));
        await logActivity("return.status", { id, status, by: admin.userId });
        return res.status(200).json({ success: true, return: r });
      }
    }

    if (action === "activity") {
      const raw = (await kv.lrange("activity:log", 0, 199)) || [];
      const items = raw.map(r => {
        try { return typeof r === "string" ? JSON.parse(r) : r; } catch { return null; }
      }).filter(Boolean);
      return res.status(200).json({ activity: items });
    }

    // ── Site Ayarları ─────────────────────────────
    if (action === "settings") {
      if (req.method === "GET") {
        const raw = await kv.get("settings:site");
        const settings = raw ? (typeof raw === "string" ? JSON.parse(raw) : raw) : {
          siteName: "Frenciniz", phone: "0850 888 7881",
          email: "info@frenciniz.com", address: "Hızırbey Mah. 1509 Sok. No:24, Isparta",
          freeShippingLimit: 500,
          social: { facebook: "", instagram: "", twitter: "", youtube: "" },
        };
        return res.status(200).json({ settings });
      }
      if (req.method === "POST") {
        const s = req.body || {};
        await kv.set("settings:site", JSON.stringify(s));
        await logActivity("settings.update", { by: admin.userId });
        return res.status(200).json({ success: true, settings: s });
      }
    }

    // ── SEO ────────────────────────────────────────
    if (action === "seo") {
      if (req.method === "GET") {
        const ids = (await kv.lrange("seo:index", 0, 99)) || [];
        const out = {};
        for (const id of ids) {
          const raw = await kv.get(`seo:${id}`);
          if (raw) out[id] = typeof raw === "string" ? JSON.parse(raw) : raw;
        }
        return res.status(200).json({ seo: out });
      }
      if (req.method === "POST") {
        const { id, title, description, keywords } = req.body || {};
        if (!id) return res.status(400).json({ error: "id zorunlu" });
        const existing = await kv.get(`seo:${id}`);
        const rec = { id, title: title || "", description: description || "", keywords: keywords || "", updatedAt: new Date().toISOString() };
        await kv.set(`seo:${id}`, JSON.stringify(rec));
        if (!existing) await kv.lpush("seo:index", id);
        await logActivity("seo.update", { id, by: admin.userId });
        return res.status(200).json({ success: true });
      }
    }

    // ── Bannerlar ─────────────────────────────────
    if (action === "banners") {
      if (req.method === "GET") {
        const ids = (await kv.lrange("banners:index", 0, 49)) || [];
        const items = [];
        for (const id of ids) {
          const raw = await kv.get(`banner:${id}`);
          if (raw) items.push(typeof raw === "string" ? JSON.parse(raw) : raw);
        }
        return res.status(200).json({ banners: items });
      }
      if (req.method === "POST") {
        const { id, title, image, link, active } = req.body || {};
        const bid = id || `bnr_${Date.now()}`;
        const existing = id ? await kv.get(`banner:${id}`) : null;
        const banner = { id: bid, title: title || "", image: image || "", link: link || "", active: active !== false, createdAt: existing ? (typeof existing === "string" ? JSON.parse(existing) : existing).createdAt : new Date().toISOString() };
        await kv.set(`banner:${bid}`, JSON.stringify(banner));
        if (!existing) await kv.lpush("banners:index", bid);
        await logActivity("banner.upsert", { id: bid, by: admin.userId });
        return res.status(200).json({ success: true, banner });
      }
      if (req.method === "DELETE") {
        const id = String(req.query.id || "");
        if (!id) return res.status(400).json({ error: "id zorunlu" });
        await kv.del(`banner:${id}`);
        await kv.lrem("banners:index", 0, id);
        await logActivity("banner.delete", { id, by: admin.userId });
        return res.status(200).json({ success: true });
      }
    }

    // ── Sayfalar (Hakkımızda vb. özel içerik) ─────
    if (action === "pages") {
      if (req.method === "GET") {
        const slugs = (await kv.lrange("pages:index", 0, 99)) || [];
        const items = [];
        for (const s of slugs) {
          const raw = await kv.get(`page:${s}`);
          if (raw) items.push(typeof raw === "string" ? JSON.parse(raw) : raw);
        }
        return res.status(200).json({ pages: items });
      }
      if (req.method === "POST") {
        const { slug, title, content } = req.body || {};
        if (!slug) return res.status(400).json({ error: "slug zorunlu" });
        const existing = await kv.get(`page:${slug}`);
        const page = { slug, title: title || "", content: content || "", updatedAt: new Date().toISOString() };
        await kv.set(`page:${slug}`, JSON.stringify(page));
        if (!existing) await kv.lpush("pages:index", slug);
        await logActivity("page.update", { slug, by: admin.userId });
        return res.status(200).json({ success: true });
      }
      if (req.method === "DELETE") {
        const slug = String(req.query.slug || "");
        if (!slug) return res.status(400).json({ error: "slug zorunlu" });
        await kv.del(`page:${slug}`);
        await kv.lrem("pages:index", 0, slug);
        return res.status(200).json({ success: true });
      }
    }

    // ── Sepet hatırlatma cron (Vercel cron veya manuel admin tetikleme) ──
    if (action === "cron-cart-reminder" && req.method === "POST") {
      const refs = (await kv.lrange("orders:index", 0, 199)) || [];
      const now = Date.now();
      const minAge = 24 * 60 * 60 * 1000;
      const maxAge = 72 * 60 * 60 * 1000;
      let sent = 0, skipped = 0, errors = 0;
      for (const ref of refs) {
        try {
          const raw = await kv.get(`order:${ref}`);
          if (!raw) continue;
          const o = typeof raw === "string" ? JSON.parse(raw) : raw;
          if (o.status === "paid") continue;
          if (o.reminderSent) { skipped++; continue; }
          const created = o.createdAt ? new Date(o.createdAt).getTime() : 0;
          const age = now - created;
          if (age < minAge || age > maxAge) { skipped++; continue; }
          const phone = o?.buyer?.phoneNumber;
          if (!phone) { skipped++; continue; }
          const name = o?.buyer?.name || "değerli müşterimiz";
          const itemCount = (o?.basket?.basketItems || []).reduce((s, it) => s + Number(it.numberOfProducts || 0), 0);
          const amount = Number(o.amount || 0);
          const msg = `Frenciniz: Merhaba ${name}, sepetinizde ${itemCount} urun ve ${amount.toFixed(2)}TL'lik siparis tamamlanmadi. Tamamlayin: frenciniz.com`;
          const r = await sendSms(phone, msg.slice(0, 155));
          o.reminderSent = true;
          o.reminderAt = new Date().toISOString();
          await kv.set(`order:${ref}`, JSON.stringify(o), { ex: 60 * 60 * 24 * 30 });
          if (r.ok) sent++; else errors++;
        } catch { errors++; }
      }
      await logActivity("cron.cart-reminder", { sent, skipped, errors, by: admin.userId });
      return res.status(200).json({ success: true, sent, skipped, errors, total: refs.length });
    }

    // ── Kampanya SMS gönderimi (toplu) ─────────────
    if (action === "campaign-send" && req.method === "POST") {
      const { message, target = "with-phone", limit = 500 } = req.body || {};
      if (!message || String(message).trim().length < 10) return res.status(400).json({ error: "Mesaj en az 10 karakter olmalı" });
      const ids = (await kv.lrange("users:index", 0, Number(limit) - 1)) || [];
      const recipients = [];
      for (const id of ids) {
        const u = await readUser(id);
        if (!u) continue;
        if (u.smsOptOut === true) continue; // İYS opt-out
        if (target === "with-phone" && !u.phone) continue;
        if (target === "with-email" && !u.email) continue;
        recipients.push(u);
      }

      let sent = 0, failed = 0;
      const errors = [];
      // 5'er paralel batch
      for (let i = 0; i < recipients.length; i += 5) {
        const batch = recipients.slice(i, i + 5);
        await Promise.all(batch.map(async u => {
          try {
            if (u.phone) {
              const r = await sendSms(u.phone, String(message));
              if (r.ok) sent++; else { failed++; if (errors.length < 10) errors.push({ phone: u.phone, code: r.code, desc: r.description }); }
            }
          } catch (e) { failed++; }
        }));
      }
      await logActivity("campaign.sms", { sent, failed, total: recipients.length, by: admin.userId, msg: String(message).slice(0, 80) });
      return res.status(200).json({ success: true, sent, failed, total: recipients.length, errors });
    }

    // ── Test bildirim gönderimi (admin panelinden test) ──
    if (action === "test-notify" && req.method === "POST") {
      const { channel, to, message, subject } = req.body || {};
      if (!channel || !to) return res.status(400).json({ error: "channel ve to zorunlu" });
      if (channel === "sms") {
        const r = await sendSms(to, message || "Frenciniz test SMS — sistem entegrasyonu calisiyor.");
        await logActivity("notify.test.sms", { to, code: r.code, by: admin.userId });
        return res.status(r.ok ? 200 : 400).json(r);
      }
      if (channel === "email") {
        const r = await sendEmail({
          to,
          subject: subject || "Frenciniz test e-posta",
          html: emailLayout({ heading: "Test E-posta", lines: [message || "Bu, e-posta entegrasyonunun test mesajıdır."] }),
        });
        await logActivity("notify.test.email", { to, ok: r.ok, by: admin.userId });
        return res.status(r.ok ? 200 : 400).json(r);
      }
      return res.status(400).json({ error: "channel 'sms' veya 'email' olmalı" });
    }

    // ── E-posta ve SMS config ─────────────────────
    if (action === "email-config" || action === "sms-config") {
      const key = action === "email-config" ? "cfg:email" : "cfg:sms";
      if (req.method === "GET") {
        const raw = await kv.get(key);
        return res.status(200).json({ config: raw ? (typeof raw === "string" ? JSON.parse(raw) : raw) : {} });
      }
      if (req.method === "POST") {
        await kv.set(key, JSON.stringify(req.body || {}));
        // Cache temizle ki yeni config sıradaki gönderimde kullanılsın
        if (action === "email-config") clearEmailCache(); else clearSmsCache();
        await logActivity(`${action}.update`, { by: admin.userId });
        return res.status(200).json({ success: true });
      }
    }

    // ── E-posta Şablonları ────────────────────────
    if (action === "email-templates") {
      if (req.method === "GET") {
        const ids = (await kv.lrange("templates:index", 0, 49)) || [];
        const seeded = ids.length > 0 ? ids : ["welcome", "order-confirm", "shipped", "delivered", "stock-notify"];
        const items = [];
        for (const id of seeded) {
          const raw = await kv.get(`template:${id}`);
          if (raw) items.push(typeof raw === "string" ? JSON.parse(raw) : raw);
          else items.push({ id, subject: "", body: "", name: id });
        }
        return res.status(200).json({ templates: items });
      }
      if (req.method === "POST") {
        const { id, subject, body, name } = req.body || {};
        if (!id) return res.status(400).json({ error: "id zorunlu" });
        const existing = await kv.get(`template:${id}`);
        await kv.set(`template:${id}`, JSON.stringify({ id, name: name || id, subject: subject || "", body: body || "", updatedAt: new Date().toISOString() }));
        if (!existing) await kv.lpush("templates:index", id);
        await logActivity("template.update", { id, by: admin.userId });
        return res.status(200).json({ success: true });
      }
    }

    // ── Yedekleme (KV export) ─────────────────────
    if (action === "backup") {
      const dump = { exportedAt: new Date().toISOString(), by: admin.userId };
      const [userIds, orderRefs, couponCodes, returnIds, bannerIds, pageSlugs, seoIds] = await Promise.all([
        kv.lrange("users:index", 0, 9999), kv.lrange("orders:index", 0, 9999),
        kv.lrange("coupons:index", 0, 999), kv.lrange("returns:index", 0, 999),
        kv.lrange("banners:index", 0, 99), kv.lrange("pages:index", 0, 99),
        kv.lrange("seo:index", 0, 99),
      ]);
      async function collect(ids, prefix) {
        const out = [];
        for (const id of (ids || [])) {
          const raw = await kv.get(`${prefix}:${id}`);
          if (raw) out.push(typeof raw === "string" ? JSON.parse(raw) : raw);
        }
        return out;
      }
      dump.users = await collect(userIds, "user");
      dump.orders = await collect(orderRefs, "order");
      dump.coupons = await collect(couponCodes, "coupon");
      dump.returns = await collect(returnIds, "return");
      dump.banners = await collect(bannerIds, "banner");
      dump.pages = await collect(pageSlugs, "page");
      dump.seo = await collect(seoIds, "seo");
      dump.settings = await kv.get("settings:site");
      res.setHeader("Content-Disposition", `attachment; filename=frenciniz-backup-${Date.now()}.json`);
      return res.status(200).json(dump);
    }

    // ── Chat history ──────────────────────────────
    if (action === "chat-sessions") {
      const sessionIds = (await kv.lrange("chat:sessions", 0, 99)) || [];
      const sessions = [];
      for (const id of sessionIds) {
        const s = await kv.get(`chat:session:${id}`);
        if (s) sessions.push(typeof s === "string" ? JSON.parse(s) : s);
      }
      sessions.sort((a, b) => new Date(b.lastTime || 0) - new Date(a.lastTime || 0));
      return res.status(200).json({ sessions });
    }
    if (action === "chat-messages") {
      const sid = String(req.query.sid || "");
      if (!sid) return res.status(400).json({ error: "sid zorunlu" });
      const raw = (await kv.lrange(`chat:messages:${sid}`, 0, 499)) || [];
      const messages = raw.map(r => { try { return typeof r === "string" ? JSON.parse(r) : r; } catch { return null; }}).filter(Boolean);
      return res.status(200).json({ messages });
    }

    return res.status(404).json({ error: "Bilinmeyen action: " + action });
  } catch (err) {
    return res.status(500).json({ error: "Sunucu hatası", detail: err.message });
  }
}
