import { kv } from "@vercel/kv";
import { requireAdmin, logActivity } from "../_lib/auth.js";

async function readCoupon(code) {
  const raw = await kv.get(`coupon:${code}`);
  if (!raw) return null;
  return typeof raw === "string" ? JSON.parse(raw) : raw;
}

export default async function handler(req, res) {
  const admin = await requireAdmin(req, res);
  if (!admin) return;

  if (req.method === "GET") {
    try {
      const codes = (await kv.lrange("coupons:index", 0, 499)) || [];
      const items = [];
      for (const c of codes) {
        const co = await readCoupon(c);
        if (co) items.push(co);
      }
      return res.status(200).json({ coupons: items });
    } catch (err) {
      return res.status(500).json({ error: "Sunucu hatası", detail: err.message });
    }
  }

  if (req.method === "POST") {
    try {
      const { code, discount, type, minOrder, active } = req.body || {};
      if (!code || !discount) return res.status(400).json({ error: "code ve discount zorunlu" });
      const key = String(code).toUpperCase().trim();
      const existing = await readCoupon(key);
      const coupon = {
        code: key,
        discount: Number(discount),
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
    } catch (err) {
      return res.status(500).json({ error: "Sunucu hatası", detail: err.message });
    }
  }

  if (req.method === "DELETE") {
    try {
      const code = String(req.query.code || "").toUpperCase().trim();
      if (!code) return res.status(400).json({ error: "code zorunlu" });
      await kv.del(`coupon:${code}`);
      await kv.lrem("coupons:index", 0, code);
      await logActivity("coupon.delete", { code, by: admin.userId });
      return res.status(200).json({ success: true });
    } catch (err) {
      return res.status(500).json({ error: "Sunucu hatası", detail: err.message });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
