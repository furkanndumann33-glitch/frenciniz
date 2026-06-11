import { kv } from "@vercel/kv";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  // Auth kontrolü
  const auth = req.headers.authorization;
  if (auth !== `Bearer ${process.env.ADMIN_SECRET || "frenciniz-admin-2026"}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const { sessionId, message } = req.body;
    if (!sessionId || !message) return res.status(400).json({ error: "Missing fields" });

    const messagesKey = `chat:messages:${sessionId}`;
    const sessionKey = `chat:session:${sessionId}`;

    const msg = { from: "admin", text: message, time: new Date().toISOString() };
    await kv.rpush(messagesKey, JSON.stringify(msg));

    const session = await kv.get(sessionKey) || {};
    await kv.set(sessionKey, {
      ...session,
      lastMessage: `[Admin] ${message.slice(0, 80)}`,
      lastTime: msg.time,
      messageCount: (session.messageCount || 0) + 1,
      unread: 0,
    });

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Reply error:", err);
    return res.status(500).json({ error: "Server error" });
  }
}
