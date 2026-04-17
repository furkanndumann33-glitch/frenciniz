import { kv } from "@vercel/kv";
import { requireAdmin } from "../_lib/auth.js";

export default async function handler(req, res) {
  const admin = await requireAdmin(req, res);
  if (!admin) return;
  try {
    const raw = (await kv.lrange("activity:log", 0, 199)) || [];
    const items = raw.map(r => {
      try { return typeof r === "string" ? JSON.parse(r) : r; } catch { return null; }
    }).filter(Boolean);
    return res.status(200).json({ activity: items });
  } catch (err) {
    return res.status(500).json({ error: "Sunucu hatası", detail: err.message });
  }
}
