import { kv } from "@vercel/kv";
import { requireAdmin, logActivity } from "../_lib/auth.js";

export default async function handler(req, res) {
  const admin = await requireAdmin(req, res);
  if (!admin) return;

  if (req.method === "GET") {
    try {
      const ids = (await kv.lrange("returns:index", 0, 199)) || [];
      const items = [];
      for (const id of ids) {
        const raw = await kv.get(`return:${id}`);
        if (raw) items.push(typeof raw === "string" ? JSON.parse(raw) : raw);
      }
      return res.status(200).json({ returns: items });
    } catch (err) {
      return res.status(500).json({ error: "Sunucu hatası", detail: err.message });
    }
  }

  if (req.method === "PATCH") {
    try {
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
    } catch (err) {
      return res.status(500).json({ error: "Sunucu hatası", detail: err.message });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
