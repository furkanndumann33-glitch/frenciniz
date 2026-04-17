import { kv } from "@vercel/kv";
import { requireAdmin, logActivity } from "../_lib/auth.js";

async function readOrder(ref) {
  const raw = await kv.get(`order:${ref}`);
  if (!raw) return null;
  return typeof raw === "string" ? JSON.parse(raw) : raw;
}

export default async function handler(req, res) {
  const admin = await requireAdmin(req, res);
  if (!admin) return;

  if (req.method === "GET") {
    try {
      const refs = (await kv.lrange("orders:index", 0, 499)) || [];
      const orders = [];
      for (const ref of refs) {
        const o = await readOrder(ref);
        if (o) orders.push(o);
      }
      orders.sort((a,b) => new Date(b.paidAt || b.createdAt || 0) - new Date(a.paidAt || a.createdAt || 0));
      return res.status(200).json({ orders, total: orders.length });
    } catch (err) {
      return res.status(500).json({ error: "Sunucu hatası", detail: err.message });
    }
  }

  if (req.method === "PATCH") {
    try {
      const { orderRef, status } = req.body || {};
      if (!orderRef || !status) return res.status(400).json({ error: "orderRef ve status zorunlu" });
      const o = await readOrder(orderRef);
      if (!o) return res.status(404).json({ error: "Sipariş bulunamadı" });
      o.fulfillmentStatus = status;
      o.updatedAt = new Date().toISOString();
      await kv.set(`order:${orderRef}`, JSON.stringify(o));
      await logActivity("order.status", { orderRef, status, by: admin.userId });
      return res.status(200).json({ success: true, order: o });
    } catch (err) {
      return res.status(500).json({ error: "Sunucu hatası", detail: err.message });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
