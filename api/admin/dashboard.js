import { kv } from "@vercel/kv";
import { requireAdmin, readUser } from "../_lib/auth.js";

export default async function handler(req, res) {
  const admin = await requireAdmin(req, res);
  if (!admin) return;

  try {
    const userIds = (await kv.lrange("users:index", 0, 9999)) || [];
    const orderRefs = (await kv.lrange("orders:index", 0, 9999)) || [];

    let totalRevenue = 0;
    let paidOrders = 0;
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
  } catch (err) {
    return res.status(500).json({ error: "Sunucu hatası", detail: err.message });
  }
}
