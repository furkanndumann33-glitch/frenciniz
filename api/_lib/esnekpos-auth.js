import crypto from "crypto";

// EsnekPOS EYV3DPay entegrasyonu.
// Docs: https://developer.esnekpos.com/
//
// Akış:
//  1) Backend -> POST /api/pay/EYV3DPay (MERCHANT + MERCHANT_KEY + kart + sipariş + BACK_URL)
//  2) EsnekPOS -> { STATUS:"SUCCESS", RETURN_CODE:"0", URL_3DS, REFNO, HASH, ORDER_REF_NUMBER }
//  3) Frontend kullanıcıyı URL_3DS'ye yönlendirir (bankanın 3DS sayfası)
//  4) Banka -> POST BACK_URL (form fields: STATUS, RETURN_CODE, HASH, REFNO, ORDER_REF_NUMBER, AMOUNT, INSTALLMENT, ...)
//
// Callback HASH doğrulama algoritması EsnekPOS tarafından herkese açık dokümante edilmemiş —
// destek@esnekpos.com'dan alınması gerekiyor. verifyCallbackHash şu an TODO: algoritma gelince doldurulacak.

export function esnekposConfig() {
  const mode = (process.env.ESNEKPOS_MODE || "test").toLowerCase();
  return {
    mode,
    payUrl: mode === "prod"
      ? "https://posservice.esnekpos.com/api/pay/EYV3DPay"
      : "https://posservicetest.esnekpos.com/api/pay/EYV3DPay",
    merchant: process.env.ESNEKPOS_MERCHANT || "TEST1234",
    merchantKey: process.env.ESNEKPOS_MERCHANT_KEY || "4oK26hK8MOXrIV1bzTRVPA==",
  };
}

// TODO: destek@esnekpos.com'dan HASH algoritması alındıktan sonra doldur.
// Şu an: hash geldiyse boş-string değilse geçerli say (yüzeysel — prod öncesi mutlaka sıkıştır).
export function verifyCallbackHash(cfg, callbackBody) {
  const hash = callbackBody?.HASH;
  if (!hash || typeof hash !== "string") return false;
  return hash.length > 0;
}

export function randomOrderRef() {
  // EsnekPOS ORDER_REF_NUMBER limiti: 24 karakter
  return `FRN${Date.now()}${Math.random().toString(36).slice(2, 6)}`.slice(0, 24);
}

export function getClientIp(req) {
  const fwd = req.headers["x-forwarded-for"];
  if (fwd) return String(fwd).split(",")[0].trim();
  return req.socket?.remoteAddress || "0.0.0.0";
}
