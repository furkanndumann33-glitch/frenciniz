import { kv } from "@vercel/kv";
import { esnekposConfig, randomOrderRef, getClientIp } from "../_lib/esnekpos-auth.js";
import { getSession } from "../_lib/auth.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const cfg = esnekposConfig();
    const body = req.body || {};
    const { amount, installmentCount, card, billingAddress, buyer, basket } = body;

    if (!amount || amount <= 0) return res.status(400).json({ error: "Geçersiz tutar" });
    if (!card || !card.number || !card.holderName || !card.cvv) return res.status(400).json({ error: "Kart bilgileri eksik" });
    if (!buyer) return res.status(400).json({ error: "Alıcı bilgileri eksik" });

    const orderRef = randomOrderRef();

    const baseUrl = (process.env.PUBLIC_BASE_URL || "https://frenciniz.com").replace(/\/+$/, "");
    const backUrl = `${baseUrl}/api/payment/esnekpos-callback`;

    const mm = String(card.expireMonth).padStart(2, "0");
    const yyyy = String(card.expireYear).length === 2 ? `20${card.expireYear}` : String(card.expireYear);

    const products = (basket?.basketItems || []).slice(0, 20).map(it => ({
      PRODUCT_ID: String(it.itemId || ""),
      PRODUCT_NAME: String(it.name || "Ürün").slice(0, 60),
      PRODUCT_CATEGORY: "Fren Aksamı",
      PRODUCT_DESCRIPTION: String(it.name || "").slice(0, 120),
      PRODUCT_AMOUNT: Number(it.totalPrice ?? it.unitPrice ?? 0).toFixed(2),
    }));

    if (products.length === 0) {
      products.push({
        PRODUCT_ID: orderRef,
        PRODUCT_NAME: "Sipariş",
        PRODUCT_CATEGORY: "Fren Aksamı",
        PRODUCT_DESCRIPTION: "Frenciniz siparişi",
        PRODUCT_AMOUNT: Number(amount).toFixed(2),
      });
    }

    const esnekBody = {
      MERCHANT: cfg.merchant,
      MERCHANT_KEY: cfg.merchantKey,
      BACK_URL: backUrl,
      ORDER_REF_NUMBER: orderRef,
      ORDER_AMOUNT: Number(amount).toFixed(2),
      PRICES_CURRENCY: "TRY",
      INSTALLMENT_NUMBER: String(Number(installmentCount || 1)),

      CC_NUMBER: String(card.number).replace(/\s/g, ""),
      EXP_MONTH: mm,
      EXP_YEAR: yyyy,
      CC_CVV: String(card.cvv),
      CC_OWNER: card.holderName,

      FIRST_NAME: buyer.name || "",
      LAST_NAME: buyer.surName || "",
      MAIL: buyer.emailAddress || "",
      PHONE: buyer.phoneNumber || "",
      CITY: (billingAddress?.city) || buyer.city || "İstanbul",
      STATE: (billingAddress?.district) || "-",
      ADDRESS: (billingAddress?.address) || buyer.registrationAddress || "",
      CLIENT_IP: getClientIp(req),

      PRODUCTS: products,
    };

    const esnekRes = await fetch(cfg.payUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(esnekBody),
    });
    const data = await esnekRes.json().catch(() => ({}));

    const ok = String(data.STATUS).toUpperCase() === "SUCCESS" && String(data.RETURN_CODE) === "0";
    if (!esnekRes.ok || !ok || !data.URL_3DS) {
      return res.status(400).json({
        error: data.RETURN_MESSAGE || data.ERROR_MESSAGE || "Ödeme başlatılamadı",
        code: data.ERROR_CODE || data.RETURN_CODE,
        raw: cfg.mode === "test" ? data : undefined,
      });
    }

    const session = getSession(req);
    try {
      await kv.set(`order:${orderRef}`, JSON.stringify({
        orderRef,
        amount: Number(amount),
        createdAt: new Date().toISOString(),
        buyer: { ...buyer, userId: session?.userId && session.userId.startsWith("usr_") ? session.userId : null },
        billingAddress,
        basket,
        refno: data.REFNO,
        status: "3ds-pending",
      }), { ex: 3600 });
    } catch {}

    return res.status(200).json({
      success: true,
      orderRef,
      url3ds: data.URL_3DS,
      refno: data.REFNO,
    });
  } catch (err) {
    return res.status(500).json({ error: "Sunucu hatası", detail: err.message });
  }
}
