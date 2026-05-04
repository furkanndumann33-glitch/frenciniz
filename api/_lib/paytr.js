import crypto from "crypto";

export function paytrConfig() {
  return {
    merchantId: process.env.PAYTR_MERCHANT_ID || "",
    merchantKey: process.env.PAYTR_MERCHANT_KEY || "",
    merchantSalt: process.env.PAYTR_MERCHANT_SALT || "",
    testMode: process.env.PAYTR_TEST_MODE === "1" ? "1" : "0",
    tokenUrl: "https://www.paytr.com/odeme/api/get-token",
    iframeUrl: (token) => `https://www.paytr.com/odeme/guvenli/${token}`,
  };
}

export function buildPaytrToken(cfg, fields) {
  const hashStr =
    cfg.merchantId +
    fields.user_ip +
    fields.merchant_oid +
    fields.email +
    fields.payment_amount +
    fields.user_basket +
    fields.no_installment +
    fields.max_installment +
    fields.currency +
    fields.test_mode;
  return crypto
    .createHmac("sha256", cfg.merchantKey)
    .update(hashStr + cfg.merchantSalt)
    .digest("base64");
}

export function verifyCallbackHash(cfg, body) {
  const { merchant_oid, status, total_amount, hash } = body;
  if (!merchant_oid || !status || !total_amount || !hash) return false;
  const expected = crypto
    .createHmac("sha256", cfg.merchantKey)
    .update(merchant_oid + cfg.merchantSalt + status + total_amount)
    .digest("base64");
  return expected === hash;
}

export function randomOrderRef() {
  const ts = Date.now().toString();
  const rnd = Math.random().toString(36).slice(2, 8);
  return `FRN${ts}${rnd}`.replace(/[^A-Za-z0-9]/g, "").slice(0, 64);
}

export function getClientIp(req) {
  const fwd = req.headers["x-forwarded-for"];
  if (fwd) return String(fwd).split(",")[0].trim();
  return req.socket?.remoteAddress || "0.0.0.0";
}

export function encodeBasket(items) {
  const arr = items.map((it) => [
    String(it.name || "Ürün").slice(0, 60),
    Number(it.unitPrice ?? it.price ?? 0).toFixed(2),
    Number(it.qty || it.numberOfProducts || 1),
  ]);
  return Buffer.from(JSON.stringify(arr), "utf8").toString("base64");
}
