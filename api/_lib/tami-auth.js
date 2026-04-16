import crypto from "crypto";

// Tami v3 auth yardımcıları.
// 1) PG-Auth-Token header: Base64(SHA256(merchantNumber + terminalNumber + secretKey))
// 2) Request body içindeki securityHash: JWS (HS512) imza — body (securityHash hariç)
//    HMAC-SHA512(base64url_decode(k), base64url(header)+"."+base64url(payload))
// Tami portal > Üye İşyeri Ayarları > POS Yönetimi ekranından k, kid, secret alınır.

function base64url(buf) {
  return Buffer.from(buf).toString("base64").replace(/=+$/,"").replace(/\+/g,"-").replace(/\//g,"_");
}
function base64urlDecode(str) {
  str = str.replace(/-/g,"+").replace(/_/g,"/");
  while (str.length % 4) str += "=";
  return Buffer.from(str, "base64");
}

export function tamiConfig() {
  const mode = (process.env.TAMI_MODE || "sandbox").toLowerCase();
  return {
    mode,
    authUrl: mode === "prod"
      ? "https://paymentapi.tami.com.tr/payment/auth"
      : "https://sandbox-paymentapi.tami.com.tr/payment/auth",
    completeUrl: mode === "prod"
      ? "https://paymentapi.tami.com.tr/payment/complete-3ds"
      : "https://sandbox-paymentapi.tami.com.tr/payment/complete-3ds",
    merchantId: process.env.TAMI_MERCHANT_ID || "77006950",
    terminalId: process.env.TAMI_TERMINAL_ID || "84006953",
    secretKey: process.env.TAMI_SECRET_KEY || "0edad05a-7ea7-40f1-a80c-d600121ca51b",
    kid: process.env.TAMI_KID || "",
    k: process.env.TAMI_K || "",
  };
}

// PG-Auth-Token hash: Base64(SHA256(merchant + terminal + secret))
export function authHash(cfg) {
  const raw = `${cfg.merchantId}${cfg.terminalId}${cfg.secretKey}`;
  return crypto.createHash("sha256").update(raw, "utf8").digest("base64");
}

// JWS HS512 imzası — Tami v3 body signature
// payload: request body (securityHash alanı dahil EDİLMEMELİ)
export function jwsSignatureHS512(payload, cfg) {
  if (!cfg.kid || !cfg.k) {
    throw new Error("TAMI_KID ve TAMI_K env vars tanımlanmalı (Tami portal > POS Yönetimi)");
  }
  const header = { alg: "HS512", kid: cfg.kid, typ: "JWT" };
  const eh = base64url(JSON.stringify(header));
  const ep = base64url(JSON.stringify(payload));
  const signingInput = `${eh}.${ep}`;
  const keyBytes = base64urlDecode(cfg.k);
  const sig = crypto.createHmac("sha512", keyBytes).update(signingInput, "utf8").digest();
  return `${signingInput}.${base64url(sig)}`;
}

// Callback hashedData doğrulama: HMAC-SHA256(secretKey, data) -> base64
export function verifyCallbackHash(cfg, data, expected) {
  const calc = crypto.createHmac("sha256", cfg.secretKey).update(data, "utf8").digest("base64");
  try {
    return crypto.timingSafeEqual(Buffer.from(calc), Buffer.from(expected));
  } catch { return false; }
}
