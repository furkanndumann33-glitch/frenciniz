import { kv } from "@vercel/kv";
import { requireAdmin, readUser, publicUser, logActivity } from "./_lib/auth.js";

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
        const { orderRef, status } = req.body || {};
        if (!orderRef || !status) return res.status(400).json({ error: "orderRef ve status zorunlu" });
        const o = await readOrder(orderRef);
        if (!o) return res.status(404).json({ error: "Sipariş bulunamadı" });
        o.fulfillmentStatus = status;
        o.updatedAt = new Date().toISOString();
        await kv.set(`order:${orderRef}`, JSON.stringify(o));
        await logActivity("order.status", { orderRef, status, by: admin.userId });
        return res.status(200).json({ success: true, order: o });
      }
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

    return res.status(404).json({ error: "Bilinmeyen action: " + action });
  } catch (err) {
    return res.status(500).json({ error: "Sunucu hatası", detail: err.message });
  }
}
