import { kv } from "@vercel/kv";
import { tamiConfig, authHash, verifyCallbackHash } from "../_lib/tami-auth.js";

async function parseBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const raw = Buffer.concat(chunks).toString("utf8");
  const ct = (req.headers["content-type"] || "").toLowerCase();
  if (ct.includes("application/json")) {
    try { return JSON.parse(raw); } catch { return {}; }
  }
  const params = new URLSearchParams(raw);
  const obj = {};
  for (const [k, v] of params.entries()) obj[k] = v;
  return obj;
}

function redirect(res, url) {
  res.statusCode = 303;
  res.setHeader("Location", url);
  res.end();
}

export default async function handler(req, res) {
  if (req.method !== "POST" && req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const cfg = tamiConfig();

  try {
    const body = await parseBody(req);
    const {
      orderId, success, mdStatus, txnAmount, currencyCode,
      installmentCount, maskedNumber, cardBrand, cardOrganization, cardType,
      systemTime, hashedData,
    } = body;

    if (!orderId) return redirect(res, "/odeme-basarisiz?reason=missing-order");

    const data = `${cardOrganization||""}${cardBrand||""}${cardType||""}${maskedNumber||""}${installmentCount||""}${currencyCode||""}${txnAmount||""}${orderId}${systemTime||""}${success||""}`;
    const hashOk = hashedData ? verifyCallbackHash(cfg, data, hashedData) : false;

    if (!hashOk) {
      try { await kv.set(`order:${orderId}:fail`, JSON.stringify({ reason: "hash-mismatch", body, at: new Date().toISOString() }), { ex: 86400 }); } catch {}
      return redirect(res, `/odeme-basarisiz?orderId=${encodeURIComponent(orderId)}&reason=hash`);
    }

    const is3dOk = String(success).toLowerCase() === "true" && String(mdStatus) === "1";
    if (!is3dOk) {
      try { await kv.set(`order:${orderId}:fail`, JSON.stringify({ reason: "3ds-fail", mdStatus, body, at: new Date().toISOString() }), { ex: 86400 }); } catch {}
      return redirect(res, `/odeme-basarisiz?orderId=${encodeURIComponent(orderId)}&reason=3ds&md=${encodeURIComponent(mdStatus||"")}`);
    }

    const hash = authHash(cfg);
    const correlationId = `FRN${Date.now()}${Math.random().toString(36).slice(2, 6)}`;
    const completeRes = await fetch(cfg.completeUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "PG-Api-Version": "v3",
        "CorrelationId": correlationId,
        "PG-Auth-Token": `${cfg.merchantId}:${cfg.terminalId}:${hash}`,
      },
      body: JSON.stringify({ orderId, securityHash: hash }),
    });
    const completeData = await completeRes.json().catch(() => ({}));

    if (!completeRes.ok || !completeData.success) {
      try { await kv.set(`order:${orderId}:fail`, JSON.stringify({ reason: "complete-fail", completeData, at: new Date().toISOString() }), { ex: 86400 }); } catch {}
      return redirect(res, `/odeme-basarisiz?orderId=${encodeURIComponent(orderId)}&reason=complete`);
    }

    try {
      const existingRaw = await kv.get(`order:${orderId}`);
      const existing = existingRaw ? (typeof existingRaw === "string" ? JSON.parse(existingRaw) : existingRaw) : {};
      await kv.set(`order:${orderId}`, JSON.stringify({
        ...existing,
        status: "paid",
        paidAt: new Date().toISOString(),
        bankAuthCode: completeData.bankAuthCode,
        bankReferenceNumber: completeData.bankReferenceNumber,
        card: completeData.card,
      }), { ex: 60 * 60 * 24 * 90 });
    } catch {}

    return redirect(res, `/odeme-basarili?orderId=${encodeURIComponent(orderId)}`);
  } catch (err) {
    return redirect(res, `/odeme-basarisiz?reason=server`);
  }
}
