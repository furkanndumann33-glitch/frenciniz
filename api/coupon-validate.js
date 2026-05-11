import { kv } from "@vercel/kv";

export default async function handler(req, res) {
  try {
    const code = String(req.query.code || (req.body && req.body.code) || "").toUpperCase().trim();
    if (!code) return res.status(400).json({ valid: false, error: "Kupon kodu gerekli" });

    const raw = await kv.get(`coupon:${code}`);
    if (!raw) return res.status(404).json({ valid: false, error: "Kupon bulunamadı" });
    const co = typeof raw === "string" ? JSON.parse(raw) : raw;

    if (co.active === false) return res.status(400).json({ valid: false, error: "Kupon pasif" });

    return res.status(200).json({
      valid: true,
      code: co.code,
      discount: Number(co.discount) || 0,
      type: co.type === "₺" ? "₺" : "%",
      minOrder: Number(co.minOrder) || 0,
    });
  } catch (e) {
    return res.status(500).json({ valid: false, error: "Sunucu hatası" });
  }
}
