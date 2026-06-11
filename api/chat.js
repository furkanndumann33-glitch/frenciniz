import messagesHandler from "./_lib/chat/messages.js";
import replyHandler from "./_lib/chat/reply.js";
import sendHandler from "./_lib/chat/send.js";
import sessionsHandler from "./_lib/chat/sessions.js";
import { getSmartReply } from "./_lib/chat/smart-reply.js";

const HANDLERS = {
  messages: messagesHandler,
  reply: replyHandler,
  send: sendHandler,
  sessions: sessionsHandler,
};

function normalizeAction(value) {
  return String(value || "").replace(/^\/+|\/+$/g, "").split("/")[0].toLowerCase();
}

export default async function handler(req, res) {
  const action = normalizeAction(req.query.action || req.query.route || "");

  if (action === "smart-reply") {
    if (req.method === "OPTIONS") return res.status(200).end();
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
    const message = req.body?.message || req.query.message || "";
    return res.status(200).json({ reply: getSmartReply(message) });
  }

  const routed = HANDLERS[action];
  if (!routed) return res.status(404).json({ error: "Chat endpoint not found" });
  return routed(req, res);
}
