import crypto from "crypto";
import { kv } from "@vercel/kv";

// Tami 3D Secure ödeme başlatma
// Frontend'den cart + address + card bilgilerini alır, Tami /payment/auth
// endpoint'ine istek atar, dönen threeDSHtmlContent'i frontend'e iletir.

const SANDBOX_URL = "https://sandbox-paymentapi.tami.com.tr/payment/auth";
const PROD_URL = "https://paymentapi.tami.com.tr/payment/auth";

function tamiConfig() {
  const mode = (process.env.TAMI_MODE || "sandbox").toLowerCase();
  return {
    mode,
    endpoint: mode === "prod" ? PROD_URL : SANDBOX_URL,
    merchantId: process.env.TAMI_MERCHANT_ID || "77006950",
    terminalId: process.env.TAMI_TERMINAL_ID || "84006953",
    secretKey: process.env.TAMI_SECRET_KEY || "0edad05a-7ea7-40f1-a80c-d600121ca51b",
  };
}

// SHA256(merchantId + terminalId + secretKey) → base64
function securityHash({merchantId, terminalId, secretKey}) {
  const raw = `${merchantId}${terminalId}${secretKey}`;
  return crypto.createHash("sha256").update(raw, "utf8").digest("base64");
}

function randomOrderId() {
  // 2-36 char, alphanumeric + tek -/_. Timestamp+random
  return `FRN${Date.now()}${Math.random().toString(36).slice(2, 8)}`.slice(0, 34);
}

function getClientIp(req) {
  const fwd = req.headers["x-forwarded-for"];
  if (fwd) return String(fwd).split(",")[0].trim();
  return req.socket?.remoteAddress || "0.0.0.0";
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const cfg = tamiConfig();
    const body = req.body || {};
    const { amount, installmentCount, card, billingAddress, shippingAddress, buyer, basket } = body;

    if (!amount || amount <= 0) return res.status(400).json({ error: "Geçersiz tutar" });
    if (!card || !card.number || !card.holderName || !card.cvv) return res.status(400).json({ error: "Kart bilgileri eksik" });
    if (!billingAddress || !buyer) return res.status(400).json({ error: "Fatura/alıcı bilgileri eksik" });

    const orderId = randomOrderId();
    const hash = securityHash(cfg);
    const correlationId = `FRN${Date.now()}${Math.random().toString(36).slice(2, 6)}`;

    // Callback URL — bank bu URL'e POST atacak
    const proto = req.headers["x-forwarded-proto"] || "https";
    const host = req.headers["x-forwarded-host"] || req.headers.host;
    const callbackUrl = `${proto}://${host}/api/payment/tami-callback`;

    const tamiPayload = {
      orderId,
      amount: Number(amount),
      currency: "TRY",
      installmentCount: Number(installmentCount || 1),
      paymentGroup: "PRODUCT",
      paymentChannel: "WEB",
      callbackUrl,
      card: {
        number: String(card.number).replace(/\s/g, ""),
        holderName: card.holderName,
        expireMonth: Number(card.expireMonth),
        expireYear: Number(card.expireYear),
        cvv: String(card.cvv),
      },
      billingAddress,
      shippingAddress: shippingAddress || billingAddress,
      buyer: {
        ...buyer,
        ipAddress: buyer.ipAddress || getClientIp(req),
      },
      ...(basket && basket.basketItems && basket.basketItems.length > 0 ? { basket } : {}),
      securityHash: hash,
    };

    const tamiRes = await fetch(cfg.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "CorrelationId": correlationId,
        "PG-Auth-Token": `${cfg.merchantId}:${cfg.terminalId}:${hash}`,
      },
      body: JSON.stringify(tamiPayload),
    });

    const tamiData = await tamiRes.json().catch(() => ({}));

    if (!tamiRes.ok || !tamiData.success) {
      return res.status(400).json({
        error: tamiData.errorMessage || "Ödeme başlatılamadı",
        code: tamiData.errorCode,
        raw: process.env.TAMI_MODE === "sandbox" ? tamiData : undefined,
      });
    }

    // Sipariş bilgilerini KV'ye yaz — callback'te kullanılacak
    try {
      await kv.set(`order:${orderId}`, JSON.stringify({
        orderId,
        amount: Number(amount),
        createdAt: new Date().toISOString(),
        buyer, billingAddress, shippingAddress,
        basket, correlationId,
        status: "3ds-pending",
      }), { ex: 3600 });
    } catch {}

    return res.status(200).json({
      success: true,
      orderId,
      threeDSHtmlContent: tamiData.threeDSHtmlContent,
    });
  } catch (err) {
    return res.status(500).json({ error: "Sunucu hatası", detail: err.message });
  }
}
