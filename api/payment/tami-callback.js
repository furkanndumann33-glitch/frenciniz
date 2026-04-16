import crypto from "crypto";
import { kv } from "@vercel/kv";

// Tami 3D Secure callback
// Banka, kullanıcı 3DS kimlik doğrulamasını tamamlayınca bu URL'e POST atar.
// Hash doğrulanır → /payment/complete-3ds çağırılır → kullanıcı başarı/başarısız sayfasına yönlendirilir.

const SANDBOX_COMPLETE = "https://sandbox-paymentapi.tami.com.tr/payment/complete-3ds";
const PROD_COMPLETE = "https://paymentapi.tami.com.tr/payment/complete-3ds";

function tamiConfig() {
  const mode = (process.env.TAMI_MODE || "sandbox").toLowerCase();
  return {
    mode,
    completeEndpoint: mode === "prod" ? PROD_COMPLETE : SANDBOX_COMPLETE,
    merchantId: process.env.TAMI_MERCHANT_ID || "77006950",
    terminalId: process.env.TAMI_TERMINAL_ID || "84006953",
    secretKey: process.env.TAMI_SECRET_KEY || "0edad05a-7ea7-40f1-a80c-d600121ca51b",
  };
}

function authHash({merchantId, terminalId, secretKey}) {
  return crypto.createHash("sha256").update(`${merchantId}${terminalId}${secretKey}`, "utf8").digest("base64");
}

// HMAC-SHA256(secretKey, data) → base64 (callback hashedData doğrulaması)
function verifyHash(secretKey, data, expected) {
  const calc = crypto.createHmac("sha256", secretKey).update(data, "utf8").digest("base64");
  // constant-time compare
  try {
    return crypto.timingSafeEqual(Buffer.from(calc), Buffer.from(expected));
  } catch { return false; }
}

// body parse — Tami callback x-www-form-urlencoded POST'u yapar
async function parseBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const raw = Buffer.concat(chunks).toString("utf8");
  const ct = (req.headers["content-type"] || "").toLowerCase();
  if (ct.includes("application/json")) {
    try { return JSON.parse(raw); } catch { return {}; }
  }
  // urlencoded
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
  if (req.method !== "POST" && req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const cfg = tamiConfig();

  try {
    const body = await parseBody(req);
    const {
      orderId, success, mdStatus, txnAmount, currencyCode,
      installmentCount, maskedNumber, cardBrand, cardOrganization, cardType,
      systemTime, hashedData,
    } = body;

    if (!orderId) return redirect(res, "/odeme-basarisiz?reason=missing-order");

    // Hash doğrula
    const data = `${cardOrganization||""}${cardBrand||""}${cardType||""}${maskedNumber||""}${installmentCount||""}${currencyCode||""}${txnAmount||""}${orderId}${systemTime||""}${success||""}`;
    const hashOk = hashedData ? verifyHash(cfg.secretKey, data, hashedData) : false;

    if (!hashOk) {
      try { await kv.set(`order:${orderId}:fail`, JSON.stringify({ reason: "hash-mismatch", body, at: new Date().toISOString() }), { ex: 86400 }); } catch {}
      return redirect(res, `/odeme-basarisiz?orderId=${encodeURIComponent(orderId)}&reason=hash`);
    }

    const is3dOk = String(success).toLowerCase() === "true" && String(mdStatus) === "1";
    if (!is3dOk) {
      try { await kv.set(`order:${orderId}:fail`, JSON.stringify({ reason: "3ds-fail", mdStatus, body, at: new Date().toISOString() }), { ex: 86400 }); } catch {}
      return redirect(res, `/odeme-basarisiz?orderId=${encodeURIComponent(orderId)}&reason=3ds&md=${encodeURIComponent(mdStatus||"")}`);
    }

    // 3DS OK → complete-3ds çağır
    const hash = authHash(cfg);
    const correlationId = `FRN${Date.now()}${Math.random().toString(36).slice(2, 6)}`;
    const completeRes = await fetch(cfg.completeEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
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

    // Başarılı — sipariş DB'ye yazılsın
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
      }), { ex: 60 * 60 * 24 * 90 }); // 90 gün sakla
    } catch {}

    return redirect(res, `/odeme-basarili?orderId=${encodeURIComponent(orderId)}`);
  } catch (err) {
    return redirect(res, `/odeme-basarisiz?reason=server`);
  }
}
