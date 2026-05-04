import { kv } from "@vercel/kv";
import { paytrConfig, buildPaytrToken, randomOrderRef, getClientIp, encodeBasket } from "../_lib/paytr.js";
import { getSession } from "../_lib/auth.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const cfg = paytrConfig();
    if (!cfg.merchantId || !cfg.merchantKey || !cfg.merchantSalt) {
      return res.status(500).json({ error: "PayTR yapılandırması eksik" });
    }

    const body = req.body || {};
    const { amount, installmentCount, billingAddress, buyer, basket } = body;

    if (!amount || amount <= 0) return res.status(400).json({ error: "Geçersiz tutar" });
    if (!buyer || !buyer.emailAddress) return res.status(400).json({ error: "Alıcı bilgileri eksik" });

    const orderRef = randomOrderRef();
    const baseUrl = (process.env.PUBLIC_BASE_URL || "https://frenciniz.com").replace(/\/+$/, "");
    const okUrl = `${baseUrl}/odeme-basarili?orderRef=${encodeURIComponent(orderRef)}`;
    const failUrl = `${baseUrl}/odeme-basarisiz?orderRef=${encodeURIComponent(orderRef)}`;

    const items = (basket?.basketItems || []).slice(0, 50).map((it) => ({
      name: it.name,
      unitPrice: it.unitPrice,
      qty: it.numberOfProducts,
    }));
    if (items.length === 0) {
      items.push({ name: "Frenciniz siparişi", unitPrice: Number(amount), qty: 1 });
    }
    const userBasket = encodeBasket(items);

    const inst = Number(installmentCount);
    const noInstallment = inst === 1 ? "1" : "0";
    const maxInstallment = inst >= 2 && inst <= 12 ? String(inst) : "0";

    const fullName = `${buyer.name || ""} ${buyer.surName || ""}`.trim() || "Frenciniz Müşteri";
    const userPhone = String(buyer.phoneNumber || "").replace(/\D/g, "").slice(0, 20) || "0000000000";
    const userAddress = (billingAddress?.address || buyer.registrationAddress || "Belirtilmedi").slice(0, 400);

    const fields = {
      merchant_oid: orderRef,
      email: String(buyer.emailAddress).trim(),
      payment_amount: String(Math.round(Number(amount) * 100)),
      user_basket: userBasket,
      no_installment: noInstallment,
      max_installment: maxInstallment,
      currency: "TL",
      test_mode: cfg.testMode,
      user_ip: getClientIp(req),
    };

    const paytrToken = buildPaytrToken(cfg, fields);

    const formBody = new URLSearchParams({
      merchant_id: cfg.merchantId,
      user_ip: fields.user_ip,
      merchant_oid: fields.merchant_oid,
      email: fields.email,
      payment_amount: fields.payment_amount,
      paytr_token: paytrToken,
      user_basket: fields.user_basket,
      debug_on: "1",
      no_installment: fields.no_installment,
      max_installment: fields.max_installment,
      user_name: fullName,
      user_address: userAddress,
      user_phone: userPhone,
      merchant_ok_url: okUrl,
      merchant_fail_url: failUrl,
      timeout_limit: "30",
      currency: fields.currency,
      test_mode: fields.test_mode,
      lang: "tr",
    }).toString();

    const r = await fetch(cfg.tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formBody,
    });
    const data = await r.json().catch(() => ({}));

    if (data.status !== "success" || !data.token) {
      return res.status(400).json({
        error: data.reason || "PayTR token alınamadı",
        debug: process.env.PAYTR_DEBUG === "1" ? { sent: { ...fields, merchant_id: cfg.merchantId }, got: data, status: r.status } : undefined,
      });
    }

    const session = getSession(req);
    try {
      await kv.set(
        `order:${orderRef}`,
        JSON.stringify({
          orderRef,
          amount: Number(amount),
          createdAt: new Date().toISOString(),
          buyer: { ...buyer, userId: session?.userId && session.userId.startsWith("usr_") ? session.userId : null },
          billingAddress,
          basket,
          status: "paytr-pending",
          provider: "paytr",
        }),
        { ex: 3600 }
      );
    } catch {}

    return res.status(200).json({
      success: true,
      orderRef,
      iframeUrl: cfg.iframeUrl(data.token),
      token: data.token,
    });
  } catch (err) {
    return res.status(500).json({ error: "Sunucu hatası", detail: err.message });
  }
}
