import crypto from "crypto";
import { kv } from "@vercel/kv";

function clean(value, max = 240) {
  return String(value || "").replace(/[\u0000-\u001f]+/g, " ").trim().slice(0, max);
}

export async function recordSupportEvent(input = {}) {
  const event = {
    id: `support_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`,
    type: input.type === "message" ? "message" : "presence",
    sessionId: clean(input.sessionId, 120),
    at: new Date().toISOString(),
    path: clean(input.path || "/", 500),
    pageTitle: clean(input.pageTitle, 180),
    productName: clean(input.productName, 180),
    message: clean(input.message, 500),
    source: clean(input.source, 180),
  };
  await kv.lpush("support:events", JSON.stringify(event));
  await kv.ltrim("support:events", 0, 499);
  return event;
}

export function sanitizePresence(input = {}) {
  return {
    sessionId: clean(input.sessionId, 120),
    path: clean(input.path || "/", 500),
    pageTitle: clean(input.pageTitle, 180),
    productId: clean(input.productId, 100),
    productName: clean(input.productName, 180),
    source: clean(input.source, 180),
  };
}
