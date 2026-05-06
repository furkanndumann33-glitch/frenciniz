import { kv } from "@vercel/kv";
import { requireUser } from "./_lib/auth.js";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const session = await requireUser(req, res);
  if (!session) return;

  try {
    const refs = (await kv.lrange(`user:${session.userId}:orders`, 0, 49)) || [];
    const orders = [];
    for (const ref of refs) {
      const raw = await kv.get(`order:${ref}`);
      if (!raw) continue;
      const o = typeof raw === "string" ? JSON.parse(raw) : raw;
      if (o.status !== "paid") continue;
      const items = (o.basket?.basketItems || []).map((it) => ({
        name: it.name,
        sku: it.sku || "",
        brand: it.brand || "",
        price: Number(it.unitPrice || 0),
        qty: Number(it.numberOfProducts || 1),
        img: it.img || null,
      }));
      orders.push({
        orderRef: o.orderRef,
        status: o.status,
        fulfillmentStatus: o.fulfillmentStatus || "Hazırlanıyor",
        amount: o.amount,
        installment: o.installment || 1,
        paidAt: o.paidAt,
        createdAt: o.createdAt,
        items,
      });
    }
    return res.status(200).json({ ok: true, orders });
  } catch (err) {
    return res.status(500).json({ error: "Sunucu hatası" });
  }
}
