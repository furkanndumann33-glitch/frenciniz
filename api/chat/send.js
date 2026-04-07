import { kv } from "@vercel/kv";
import { getSmartReply } from "./smart-reply.js";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { sessionId, message, from } = req.body;
    if (!sessionId || !message) return res.status(400).json({ error: "Missing fields" });

    const sessionKey = `chat:session:${sessionId}`;
    const messagesKey = `chat:messages:${sessionId}`;

    // Mesajı kaydet
    const msg = { from: from || "user", text: message, time: new Date().toISOString() };
    await kv.rpush(messagesKey, JSON.stringify(msg));

    // Session bilgisini güncelle
    const session = await kv.get(sessionKey) || {};
    await kv.set(sessionKey, {
      ...session,
      id: sessionId,
      lastMessage: message.slice(0, 100),
      lastTime: msg.time,
      messageCount: (session.messageCount || 0) + 1,
      unread: from === "user" ? (session.unread || 0) + 1 : session.unread || 0,
    });

    // Session ID'yi listeye ekle (eğer yoksa)
    const sessions = await kv.lrange("chat:sessions", 0, -1) || [];
    if (!sessions.includes(sessionId)) {
      await kv.lpush("chat:sessions", sessionId);
    }

    // TTL: 30 gün
    await kv.expire(sessionKey, 2592000);
    await kv.expire(messagesKey, 2592000);

    // Otomatik bot cevabı (sadece kullanıcı mesajında)
    let botReply = null;
    if (from !== "admin") {
      const replyText = getSmartReply(message);
      botReply = { from: "bot", text: replyText, time: new Date().toISOString() };
      await kv.rpush(messagesKey, JSON.stringify(botReply));

      // Session güncelle
      const updatedSession = await kv.get(sessionKey);
      await kv.set(sessionKey, {
        ...updatedSession,
        messageCount: (updatedSession.messageCount || 0) + 1,
      });
    }

    return res.status(200).json({ ok: true, botReply });
  } catch (err) {
    console.error("Chat send error:", err);
    return res.status(500).json({ error: "Server error" });
  }
}
