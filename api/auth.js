import { kv } from "@vercel/kv";
import crypto from "crypto";
import {
  hashPassword, verifyPassword, signJWT, setSessionCookie, clearSessionCookie,
  getSession, readUser, publicUser, newUserId, writeUser,
  normalizeEmail, normalizePhone, findUserByEmail, findUserByPhone,
  isAdminEmail, logActivity, requireUser,
} from "./_lib/auth.js";
import { sendEmail, emailLayout } from "./_lib/email.js";
import { sendSms } from "./_lib/netgsm.js";

function maskContact(s) {
  if (!s) return "";
  if (s.includes("@")) {
    const [u, d] = s.split("@");
    return (u.slice(0, 2) + "***@" + d);
  }
  const t = String(s).replace(/\D/g, "");
  if (t.length < 4) return "***";
  return t.slice(0, 3) + "****" + t.slice(-2);
}

export default async function handler(req, res) {
  const action = String(req.query.action || "").toLowerCase();

  try {
    if (action === "signup" && req.method === "POST") {
      const { name, email, phone, password } = req.body || {};
      if (!name || !password) return res.status(400).json({ error: "Ad ve şifre zorunlu" });
      if (!email && !phone) return res.status(400).json({ error: "E-posta veya telefon zorunlu" });
      if (String(password).length < 6) return res.status(400).json({ error: "Şifre en az 6 karakter olmalı" });

      const emailNorm = normalizeEmail(email);
      const phoneNorm = normalizePhone(phone);
      if (emailNorm && await findUserByEmail(emailNorm)) return res.status(409).json({ error: "Bu e-posta zaten kayıtlı" });
      if (phoneNorm && await findUserByPhone(phoneNorm)) return res.status(409).json({ error: "Bu telefon zaten kayıtlı" });

      const id = newUserId();
      // Ana sayfa signup her zaman "customer" — admin hesapları sadece seed endpoint'i ile oluşturulur
      const user = {
        id, name: String(name).trim(),
        email: emailNorm || "", phone: phoneNorm || "",
        passwordHash: hashPassword(password),
        role: "customer",
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        orderCount: 0, totalSpent: 0,
      };
      await writeUser(user);
      await kv.lpush("users:index", id);
      await logActivity("user.signup", { userId: id, name: user.name, email: user.email, role: "customer" });
      setSessionCookie(res, signJWT({ userId: id, role: "customer", email: user.email }));

      // Hoşgeldin bildirimleri (failsafe — başarısız olsa da signup'ı bozmaz)
      if (user.email) {
        sendEmail({
          to: user.email,
          subject: "Hoşgeldiniz — Frenciniz",
          html: emailLayout({
            heading: `Hoşgeldiniz, ${user.name}!`,
            lines: [
              "Frenciniz ailesine katıldığınız için teşekkür ederiz.",
              "Hesabınız başarıyla oluşturuldu. Artık siparişlerinizi takip edebilir, favori ürünlerinizi kaydedebilir ve özel kampanyalardan faydalanabilirsiniz.",
            ],
            cta: { url: "https://frenciniz.com/", label: "Alışverişe Başla" },
          }),
          text: `Hoşgeldiniz ${user.name}, Frenciniz hesabınız oluşturuldu.`,
        }).catch(()=>{});
      }
      if (user.phone) {
        sendSms(user.phone, `Frenciniz: Hosgeldiniz ${user.name}! Hesabiniz olusturuldu. Iyi alisverisler.`).catch(()=>{});
      }
      return res.status(200).json({ success: true, user: publicUser(user) });
    }

    // Admin seed — sadece ADMIN_SECRET bearer ile çağrılabilir, tek seferlik admin hesabı oluşturur.
    // Daha önce aynı e-posta ile kullanıcı varsa şifresini yeniler ve rolünü admin yapar.
    if (action === "seed-admin" && req.method === "POST") {
      const auth = req.headers.authorization || "";
      const expected = `Bearer ${process.env.ADMIN_SECRET || "frenciniz-admin-2026"}`;
      if (auth !== expected) return res.status(403).json({ error: "Yetkisiz" });
      const { email, password, name } = req.body || {};
      if (!email || !password) return res.status(400).json({ error: "email ve password zorunlu" });
      if (String(password).length < 6) return res.status(400).json({ error: "Şifre en az 6 karakter olmalı" });
      const emailNorm = normalizeEmail(email);
      let user = await findUserByEmail(emailNorm);
      if (user) {
        user.passwordHash = hashPassword(password);
        user.role = "admin";
        if (name) user.name = String(name).trim();
        await writeUser(user);
        await logActivity("admin.seed", { userId: user.id, email: user.email, action: "update" });
        return res.status(200).json({ success: true, user: publicUser(user), action: "updated" });
      }
      const id = newUserId();
      user = {
        id, name: (name || "Admin").trim(),
        email: emailNorm, phone: "",
        passwordHash: hashPassword(password),
        role: "admin",
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        orderCount: 0, totalSpent: 0,
      };
      await writeUser(user);
      await kv.lpush("users:index", id);
      await logActivity("admin.seed", { userId: id, email: user.email, action: "create" });
      return res.status(200).json({ success: true, user: publicUser(user), action: "created" });
    }

    if (action === "login" && req.method === "POST") {
      const { emailOrPhone, password } = req.body || {};
      if (!emailOrPhone || !password) return res.status(400).json({ error: "Kimlik ve şifre zorunlu" });
      const looksEmail = String(emailOrPhone).includes("@");
      let user = looksEmail ? await findUserByEmail(emailOrPhone) : await findUserByPhone(emailOrPhone);
      if (!user) user = looksEmail ? await findUserByPhone(emailOrPhone) : await findUserByEmail(emailOrPhone);
      if (!user || !verifyPassword(password, user.passwordHash)) {
        return res.status(401).json({ error: "E-posta/telefon veya şifre yanlış" });
      }
      user.lastLogin = new Date().toISOString();
      await writeUser(user);
      await logActivity("user.login", { userId: user.id, name: user.name });
      setSessionCookie(res, signJWT({ userId: user.id, role: user.role, email: user.email }));
      return res.status(200).json({ success: true, user: publicUser(user) });
    }

    if (action === "logout") {
      clearSessionCookie(res);
      return res.status(200).json({ success: true });
    }

    // ── Şifre sıfırlama: OTP gönder ─────────────────
    if (action === "forgot-password" && req.method === "POST") {
      const { emailOrPhone } = req.body || {};
      if (!emailOrPhone) return res.status(400).json({ error: "E-posta veya telefon gerekli" });

      const looksEmail = String(emailOrPhone).includes("@");
      let user = looksEmail ? await findUserByEmail(emailOrPhone) : await findUserByPhone(emailOrPhone);
      if (!user) user = looksEmail ? await findUserByPhone(emailOrPhone) : await findUserByEmail(emailOrPhone);
      // Güvenlik: kullanıcı bulunmasa bile aynı yanıt — enumeration önleme
      if (!user) {
        return res.status(200).json({ success: true, channel: looksEmail ? "email" : "sms", masked: maskContact(emailOrPhone) });
      }

      const code = String(Math.floor(100000 + Math.random() * 900000));
      const otpKey = `otp:reset:${user.id}`;
      await kv.set(otpKey, JSON.stringify({ code, attempts: 0, createdAt: Date.now() }), { ex: 600 }); // 10 dk

      // Önce SMS, telefon yoksa mail
      let channel = "none";
      if (user.phone) {
        await sendSms(user.phone, `Frenciniz sifre sifirlama kodunuz: ${code}. 10 dakika gecerli. Bu kodu kimseyle paylasmayin.`);
        channel = "sms";
      } else if (user.email) {
        await sendEmail({
          to: user.email,
          subject: "Şifre sıfırlama kodu — Frenciniz",
          html: emailLayout({
            heading: "Şifre Sıfırlama Kodunuz",
            lines: [
              `Şifre sıfırlama kodunuz: <strong style="font-size:24px;letter-spacing:4px;color:#ff6000">${code}</strong>`,
              "Bu kod 10 dakika boyunca geçerlidir.",
              "Eğer bu talebi siz oluşturmadıysanız bu mesajı yok sayın.",
            ],
          }),
          text: `Sifre sifirlama kodunuz: ${code} (10 dakika gecerli)`,
        });
        channel = "email";
      } else {
        return res.status(400).json({ error: "Hesabınızda iletişim bilgisi yok" });
      }
      await logActivity("user.forgot", { userId: user.id, channel });
      return res.status(200).json({ success: true, channel, masked: maskContact(channel === "sms" ? user.phone : user.email) });
    }

    // ── Şifre sıfırlama: OTP doğrula + yeni şifre ──
    if (action === "reset-password" && req.method === "POST") {
      const { emailOrPhone, otp, newPassword } = req.body || {};
      if (!emailOrPhone || !otp || !newPassword) return res.status(400).json({ error: "Eksik alan" });
      if (String(newPassword).length < 6) return res.status(400).json({ error: "Şifre en az 6 karakter olmalı" });

      const looksEmail = String(emailOrPhone).includes("@");
      let user = looksEmail ? await findUserByEmail(emailOrPhone) : await findUserByPhone(emailOrPhone);
      if (!user) user = looksEmail ? await findUserByPhone(emailOrPhone) : await findUserByEmail(emailOrPhone);
      if (!user) return res.status(400).json({ error: "Kod geçersiz veya süresi doldu" });

      const otpKey = `otp:reset:${user.id}`;
      const raw = await kv.get(otpKey);
      if (!raw) return res.status(400).json({ error: "Kod geçersiz veya süresi doldu" });
      const data = typeof raw === "string" ? JSON.parse(raw) : raw;

      if ((data.attempts || 0) >= 5) {
        await kv.del(otpKey);
        return res.status(429).json({ error: "Çok fazla yanlış deneme — yeni kod isteyin" });
      }
      if (String(otp).trim() !== String(data.code)) {
        data.attempts = (data.attempts || 0) + 1;
        await kv.set(otpKey, JSON.stringify(data), { ex: 600 });
        return res.status(400).json({ error: "Kod yanlış" });
      }

      user.passwordHash = hashPassword(newPassword);
      await writeUser(user);
      await kv.del(otpKey);
      await logActivity("user.reset", { userId: user.id });
      setSessionCookie(res, signJWT({ userId: user.id, role: user.role, email: user.email }));
      return res.status(200).json({ success: true, user: publicUser(user) });
    }

    // ── Kullanıcının siparişleri ─────────────────
    if (action === "my-orders" && req.method === "GET") {
      const session = await requireUser(req, res);
      if (!session) return;
      const refs = (await kv.lrange(`user:${session.userId}:orders`, 0, 49)) || [];
      const orders = [];
      for (const ref of refs) {
        const raw = await kv.get(`order:${ref}`);
        if (!raw) continue;
        const o = typeof raw === "string" ? JSON.parse(raw) : raw;
        if (o.status !== "paid") continue;
        const items = (o.basket?.basketItems || []).map((it) => ({
          name: it.name, sku: it.sku || "", brand: it.brand || "",
          price: Number(it.unitPrice || 0), qty: Number(it.numberOfProducts || 1), img: it.img || null,
        }));
        orders.push({
          orderRef: o.orderRef, status: o.status,
          fulfillmentStatus: o.fulfillmentStatus || "Hazırlanıyor",
          amount: o.amount, installment: o.installment || 1,
          paidAt: o.paidAt, createdAt: o.createdAt, items,
        });
      }
      return res.status(200).json({ ok: true, orders });
    }

    // ── Trafik takibi (public, auth gerekmez) ──────
    if (action === "track" && req.method === "POST") {
      try {
        const { path = "/", ref = "" } = req.body || {};
        const ip = (req.headers["x-forwarded-for"] || "").split(",")[0].trim() || req.headers["x-real-ip"] || "unknown";
        const ua = String(req.headers["user-agent"] || "").slice(0, 200);
        const day = new Date().toISOString().slice(0, 10);
        const visitorKey = crypto.createHash("sha256").update(`${ip}|${ua}|${day}`).digest("hex").slice(0, 16);
        const pathClean = String(path).slice(0, 100).replace(/[?#].*$/, "");

        // Vercel geo headers (her runtime'da otomatik gelir)
        const city = decodeURIComponent(String(req.headers["x-vercel-ip-city"] || "")).replace(/\+/g, " ");
        const country = String(req.headers["x-vercel-ip-country"] || "");
        const region = String(req.headers["x-vercel-ip-country-region"] || "");

        // Page view counters
        await Promise.all([
          kv.incr(`traffic:views:${day}`),
          kv.incr(`traffic:path:${day}:${pathClean}`),
        ]);
        await kv.expire(`traffic:views:${day}`, 60 * 60 * 24 * 90);
        await kv.expire(`traffic:path:${day}:${pathClean}`, 60 * 60 * 24 * 90);

        // Unique visitor (sadece bu cihaz/IP bugün ilk kez geldiyse counter artır)
        const seenKey = `traffic:seen:${day}:${visitorKey}`;
        const isNew = await kv.set(seenKey, "1", { nx: true, ex: 60 * 60 * 24 * 2 });
        if (isNew) {
          await kv.incr(`traffic:unique:${day}`);
          await kv.expire(`traffic:unique:${day}`, 60 * 60 * 24 * 90);
        }

        // Referrer (only domain part)
        let refDomain = "";
        if (ref) {
          try {
            refDomain = new URL(ref).hostname.replace(/^www\./, "").slice(0, 50);
            if (refDomain && refDomain !== "frenciniz.com") {
              await kv.incr(`traffic:ref:${day}:${refDomain}`);
              await kv.expire(`traffic:ref:${day}:${refDomain}`, 60 * 60 * 24 * 90);
            }
          } catch {}
        }

        // Tracked paths/refs index for daily aggregation
        await kv.sadd(`traffic:paths:${day}`, pathClean);
        await kv.expire(`traffic:paths:${day}`, 60 * 60 * 24 * 90);

        // Son ziyaretçiler log (ring buffer, son 500 kayıt) — admin panel için
        const logEntry = {
          ip, city, country, region,
          path: pathClean,
          ref: refDomain || "",
          ua: ua.slice(0, 100),
          at: new Date().toISOString(),
        };
        await kv.lpush("traffic:visitors:log", JSON.stringify(logEntry));
        await kv.ltrim("traffic:visitors:log", 0, 499);
      } catch {}
      return res.status(200).json({ ok: true });
    }

    if (action === "me") {
      const s = getSession(req);
      if (!s || !s.userId || s.userId === "admin-bearer") return res.status(200).json({ user: null });
      const u = await readUser(s.userId);
      if (!u) return res.status(200).json({ user: null });
      return res.status(200).json({ user: publicUser(u) });
    }

    // ── Profil güncelleme: name, email, phone, birth ────────────────────
    if (action === "update-profile" && req.method === "POST") {
      const session = await requireUser(req, res);
      if (!session) return;
      const u = await readUser(session.userId);
      if (!u) return res.status(404).json({ error: "Kullanıcı bulunamadı" });

      const { name, email, phone, birth } = req.body || {};
      const updates = {};

      if (typeof name === "string") {
        const n = name.trim();
        if (!n) return res.status(400).json({ error: "Ad boş olamaz" });
        updates.name = n;
      }

      if (typeof email === "string") {
        const e = normalizeEmail(email);
        if (e && e !== u.email) {
          const existing = await findUserByEmail(e);
          if (existing && existing.id !== u.id) return res.status(409).json({ error: "Bu e-posta zaten kayıtlı" });
          if (u.email) await kv.del(`user:email:${u.email}`);
          updates.email = e;
        } else if (!e && u.email) {
          // boş gönderildiyse mevcut e-postayı silme — login'i kırmamak için yoksay
        }
      }

      if (typeof phone === "string") {
        const p = normalizePhone(phone);
        if (p && p !== u.phone) {
          const existing = await findUserByPhone(p);
          if (existing && existing.id !== u.id) return res.status(409).json({ error: "Bu telefon zaten kayıtlı" });
          if (u.phone) await kv.del(`user:phone:${u.phone}`);
          updates.phone = p;
        } else if (!p && u.phone) {
          await kv.del(`user:phone:${u.phone}`);
          updates.phone = "";
        }
      }

      if (typeof birth === "string") {
        const b = birth.trim();
        if (b && !/^\d{4}-\d{2}-\d{2}$/.test(b)) return res.status(400).json({ error: "Doğum tarihi YYYY-MM-DD formatında olmalı" });
        updates.birth = b;
      }

      const updated = { ...u, ...updates, updatedAt: new Date().toISOString() };
      await writeUser(updated);
      await logActivity("user.update", { userId: u.id, fields: Object.keys(updates) });
      return res.status(200).json({ success: true, user: publicUser(updated) });
    }

    return res.status(404).json({ error: "Bilinmeyen action: " + action });
  } catch (err) {
    return res.status(500).json({ error: "Sunucu hatası", detail: err.message });
  }
}
