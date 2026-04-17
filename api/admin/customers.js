import { kv } from "@vercel/kv";
import { requireAdmin, readUser, publicUser } from "../_lib/auth.js";

export default async function handler(req, res) {
  const admin = await requireAdmin(req, res);
  if (!admin) return;
  try {
    const ids = (await kv.lrange("users:index", 0, 499)) || [];
    const users = [];
    for (const id of ids) {
      const u = await readUser(id);
      if (u) users.push(publicUser(u));
    }
    users.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
    return res.status(200).json({ users, total: users.length });
  } catch (err) {
    return res.status(500).json({ error: "Sunucu hatası", detail: err.message });
  }
}
