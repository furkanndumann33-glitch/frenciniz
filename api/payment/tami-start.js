import { kv } from "@vercel/kv";
import { tamiConfig, authHash, jwsSignatureHS512 } from "../_lib/tami-auth.js";

function randomOrderId() {
  return `FRN${Date.now()}${Math.random().toString(36).slice(2, 8)}`.slice(0, 34);
}
function getClientIp(req) {
  const fwd = req.headers["x-forwarded-for"];
  if (fwd) return String(fwd).split(",")[0].trim();
  return req.socket?.remoteAddress || "0.0.0.0";
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const cfg = tamiConfig();
    const body = req.body || {};
    const { amount, installmentCount, card, billingAddress, shippingAddress, buyer, basket } = body;

    if (!amount || amount <= 0) return res.status(400).json({ error: "Geçersiz tutar" });
    if (!card || !card.number || !card.holderName || !card.cvv) return res.status(400).json({ error: "Kart bilgileri eksik" });
    if (!billingAddress || !buyer) return res.status(400).json({ error: "Fatura/alıcı bilgileri eksik" });

    const orderId = randomOrderId();
    const correlationId = `FRN${Date.now()}${Math.random().toString(36).slice(2, 6)}`;

    const proto = req.headers["x-forwarded-proto"] || "https";
    const host = req.headers["x-forwarded-host"] || req.headers.host;
    const callbackUrl = `${proto}://${host}/api/payment/tami-callback`;

    // securityHash HARİÇ payload — bunu JWS ile imzalayıp securityHash alanına koyacağız
    const payload = {
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
    };

    let securityHash;
    try {
      securityHash = jwsSignatureHS512(payload, cfg);
    } catch (e) {
      return res.status(500).json({ error: "Güvenlik imzası oluşturulamadı", detail: e.message });
    }

    const tamiBody = { ...payload, securityHash };
    const authTokenHash = authHash(cfg);

    const tamiRes = await fetch(cfg.authUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "PG-Api-Version": "v3",
        "CorrelationId": correlationId,
        "PG-Auth-Token": `${cfg.merchantId}:${cfg.terminalId}:${authTokenHash}`,
      },
      body: JSON.stringify(tamiBody),
    });
    const tamiData = await tamiRes.json().catch(() => ({}));

    if (!tamiRes.ok || !tamiData.success) {
      return res.status(400).json({
        error: tamiData.errorMessage || "Ödeme başlatılamadı",
        code: tamiData.errorCode,
        raw: cfg.mode === "sandbox" ? tamiData : undefined,
      });
    }

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
