import crypto from "crypto";
import { kv } from "@vercel/kv";
import { recordSupportEvent, sanitizePresence } from "./events.js";

const BOT_UA = /bot|crawler|spider|preview|facebookexternalhit|whatsapp|headless|lighthouse|google-inspectiontool/i;

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (BOT_UA.test(String(req.headers["user-agent"] || ""))) return res.status(204).end();

  try {
    const meta = sanitizePresence(req.body || {});
    if (!/^s_[a-z0-9_\-]{6,120}$/i.test(meta.sessionId)) {
      return res.status(400).json({ error: "Geçersiz oturum" });
    }

    const forwarded = String(req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "unknown").split(",")[0].trim();
    const rateHash = crypto.createHash("sha256").update(forwarded).digest("hex").slice(0, 20);
    const rateKey = `support:presence-rate:${rateHash}:${Math.floor(Date.now() / 60000)}`;
    const rate = Number(await kv.incr(rateKey)) || 0;
    if (rate === 1) await kv.expire(rateKey, 120);
    if (rate > 20) return res.status(429).json({ error: "Çok fazla istek" });

    const pathHash = crypto.createHash("sha1").update(meta.path).digest("hex").slice(0, 16);
    const dedupeKey = `support:presence:${meta.sessionId}:${pathHash}`;
    if (await kv.get(dedupeKey)) return res.status(200).json({ ok: true, duplicate: true });
    await kv.set(dedupeKey, "1");
    await kv.expire(dedupeKey, 900);

    const sessionKey = `chat:session:${meta.sessionId}`;
    const existing = await kv.get(sessionKey) || {};
    const now = new Date().toISOString();
    await kv.set(sessionKey, {
      ...existing,
      ...meta,
      id: meta.sessionId,
      status: existing.status === "chatting" ? "chatting" : "browsing",
      firstSeen: existing.firstSeen || now,
      lastSeen: now,
      lastTime: existing.lastTime || now,
      messageCount: Number(existing.messageCount || 0),
      unread: Number(existing.unread || 0),
    });
    await kv.expire(sessionKey, 2592000);

    const sessions = (await kv.lrange("chat:sessions", 0, 499)) || [];
    if (!sessions.includes(meta.sessionId)) await kv.lpush("chat:sessions", meta.sessionId);

    await recordSupportEvent({ type: "presence", ...meta });
    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("Chat presence error:", error);
    return res.status(500).json({ error: "Sunucu hatası" });
  }
}
