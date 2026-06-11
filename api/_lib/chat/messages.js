import { kv } from "@vercel/kv";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.status(200).end();

  const { sessionId } = req.query;
  if (!sessionId) return res.status(400).json({ error: "Missing sessionId" });

  try {
    const raw = await kv.lrange(`chat:messages:${sessionId}`, 0, -1) || [];
    const messages = raw.map(m => typeof m === "string" ? JSON.parse(m) : m);

    // Admin okuma: unread sıfırla
    const auth = req.headers.authorization;
    if (auth === `Bearer ${process.env.ADMIN_SECRET || "frenciniz-admin-2026"}`) {
      const session = await kv.get(`chat:session:${sessionId}`);
      if (session) {
        await kv.set(`chat:session:${sessionId}`, { ...session, unread: 0 });
      }
    }

    return res.status(200).json({ messages });
  } catch (err) {
    console.error("Messages error:", err);
    return res.status(500).json({ error: "Server error" });
  }
}
