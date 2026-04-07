import { kv } from "@vercel/kv";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.status(200).end();

  // Basit auth kontrolü
  const auth = req.headers.authorization;
  if (auth !== `Bearer ${process.env.ADMIN_SECRET || "frenciniz-admin-2026"}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const sessionIds = await kv.lrange("chat:sessions", 0, 99) || [];
    const sessions = [];

    for (const id of sessionIds) {
      const session = await kv.get(`chat:session:${id}`);
      if (session) sessions.push(session);
    }

    // En son mesaja göre sırala
    sessions.sort((a, b) => new Date(b.lastTime) - new Date(a.lastTime));

    return res.status(200).json({ sessions });
  } catch (err) {
    console.error("Sessions error:", err);
    return res.status(500).json({ error: "Server error" });
  }
}
