import { kv } from "@vercel/kv";
import { getSmartReply } from "./smart-reply.js";
import { recordSupportEvent, sanitizePresence } from "./events.js";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { sessionId, message } = req.body;
    if (!sessionId || !message) return res.status(400).json({ error: "Missing fields" });
    if (!/^s_[a-z0-9_\-]{6,120}$/i.test(String(sessionId))) return res.status(400).json({ error: "Invalid session" });
    const rateKey = `chat:message-rate:${sessionId}:${Math.floor(Date.now() / 60000)}`;
    const rate = Number(await kv.incr(rateKey)) || 0;
    if (rate === 1) await kv.expire(rateKey, 120);
    if (rate > 20) return res.status(429).json({ error: "Too many messages" });

    const sessionKey = `chat:session:${sessionId}`;
    const messagesKey = `chat:messages:${sessionId}`;

    // Mesajı kaydet
    const msg = { from: "user", text: String(message).trim().slice(0, 2000), time: new Date().toISOString() };
    await kv.rpush(messagesKey, JSON.stringify(msg));

    // Session bilgisini güncelle
    const session = await kv.get(sessionKey) || {};
    const meta = sanitizePresence({ ...req.body, sessionId });
    await kv.set(sessionKey, {
      ...session,
      ...meta,
      id: sessionId,
      status: "chatting",
      lastMessage: msg.text.slice(0, 100),
      lastTime: msg.time,
      messageCount: (session.messageCount || 0) + 1,
      unread: (session.unread || 0) + 1,
    });

    // Session ID'yi listeye ekle (eğer yoksa)
    const sessions = await kv.lrange("chat:sessions", 0, -1) || [];
    if (!sessions.includes(sessionId)) {
      await kv.lpush("chat:sessions", sessionId);
    }

    // TTL: 30 gün
    await kv.expire(sessionKey, 2592000);
    await kv.expire(messagesKey, 2592000);

    try { await recordSupportEvent({ type: "message", ...meta, message: msg.text }); } catch {}

    // Otomatik bot cevabı (sadece kullanıcı mesajında)
    let botReply = null;
    {
      const replyText = getSmartReply(msg.text);
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
    if (err?.statusCode === 400 && String(err?.message || "").includes("Invalid JSON")) {
      return res.status(400).json({ error: "Invalid JSON" });
    }
    console.error("Chat send error:", err);
    return res.status(500).json({ error: "Server error" });
  }
}
