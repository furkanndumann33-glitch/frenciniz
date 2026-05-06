import { kv } from "@vercel/kv";
import { paytrConfig, verifyCallbackHash } from "../_lib/paytr.js";
import { logActivity, readUser, writeUser } from "../_lib/auth.js";
import { sendEmail, emailLayout } from "../_lib/email.js";
import { sendSms, getSmsConfig } from "../_lib/netgsm.js";

export const config = { api: { bodyParser: false } };

async function readForm(req) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const raw = Buffer.concat(chunks).toString("utf8");
  const params = new URLSearchParams(raw);
  const obj = {};
  for (const [k, v] of params.entries()) obj[k] = v;
  return obj;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).send("Method not allowed");

  const cfg = paytrConfig();
  try {
    const body = await readForm(req);
    const { merchant_oid, status, total_amount, hash, failed_reason_code, failed_reason_msg, payment_type, installment_count } = body;

    if (!verifyCallbackHash(cfg, body)) {
      try { await kv.set(`order:${merchant_oid}:fail`, JSON.stringify({ reason: "hash-mismatch", body, at: new Date().toISOString() }), { ex: 86400 }); } catch {}
      return res.status(200).send("OK");
    }

    if (status === "success") {
      const paidAmount = Number(total_amount || 0) / 100;
      try {
        const existingRaw = await kv.get(`order:${merchant_oid}`);
        const existing = existingRaw ? (typeof existingRaw === "string" ? JSON.parse(existingRaw) : existingRaw) : {};
        if (existing.status === "paid") {
          return res.status(200).send("OK");
        }
        const merged = {
          ...existing,
          orderRef: merchant_oid,
          status: "paid",
          fulfillmentStatus: existing.fulfillmentStatus || "Hazırlanıyor",
          paidAt: new Date().toISOString(),
          amount: paidAmount || Number(existing.amount || 0),
          installment: Number(installment_count || 1),
          paymentType: payment_type || "card",
          provider: "paytr",
          customerName: existing?.buyer?.name || "",
          customerMail: existing?.buyer?.emailAddress || "",
          customerPhone: existing?.buyer?.phoneNumber || "",
        };
        await kv.set(`order:${merchant_oid}`, JSON.stringify(merged), { ex: 60 * 60 * 24 * 365 });
        await kv.lpush("orders:index", merchant_oid);
        await logActivity("order.paid", {
          orderRef: merchant_oid, amount: merged.amount, customer: merged.customerName, mail: merged.customerMail, provider: "paytr",
        });

        const userId = existing?.buyer?.userId;
        if (userId && userId.startsWith("usr_")) {
          // Per-user sipariş listesi — hesabımdaki "Siparişlerim" sayfası buradan okur
          try { await kv.lpush(`user:${userId}:orders`, merchant_oid); } catch {}
          const u = await readUser(userId);
          if (u) {
            u.orderCount = (u.orderCount || 0) + 1;
            u.totalSpent = (u.totalSpent || 0) + merged.amount;
            u.lastOrderAt = new Date().toISOString();
            await writeUser(u);
          }
        }

        // Sipariş onay bildirimleri (failsafe)
        const buyerEmail = existing?.buyer?.emailAddress;
        const buyerPhone = existing?.buyer?.phoneNumber;
        const buyerName = existing?.buyer?.name || existing?.buyer?.fullName || "";
        const items = (existing?.basket?.basketItems || []).slice(0, 20);
        const itemsHtml = items.map(it =>
          `<tr><td style="padding:6px 0;color:#444">${(it.name||"").slice(0,60)}</td>` +
          `<td style="padding:6px 0;color:#666;text-align:right;white-space:nowrap">${it.numberOfProducts}× ₺${Number(it.unitPrice||0).toLocaleString("tr-TR")}</td></tr>`
        ).join("");

        if (buyerEmail) {
          sendEmail({
            to: buyerEmail,
            subject: `Siparişiniz alındı — ${merchant_oid}`,
            html: emailLayout({
              heading: `Siparişiniz alındı, ${buyerName || "değerli müşterimiz"}!`,
              lines: [
                `Sipariş No: <strong>${merchant_oid}</strong>`,
                `Toplam: <strong>₺${Number(merged.amount).toLocaleString("tr-TR",{minimumFractionDigits:2,maximumFractionDigits:2})}</strong>`,
                items.length ? `<table style="width:100%;border-top:1px solid #eee;border-bottom:1px solid #eee;margin:12px 0">${itemsHtml}</table>` : "",
                "Siparişiniz hazırlanmaya başlandı. Kargoya verildiğinde tarafınıza ayrıca bildirim göndereceğiz.",
              ].filter(Boolean),
              cta: { url: "https://frenciniz.com/orders", label: "Siparişlerimi Gör" },
            }),
            text: `Siparişiniz alındı. Sipariş No: ${merchant_oid}. Toplam: ${merged.amount} TL.`,
          }).catch(()=>{});
        }
        if (buyerPhone) {
          sendSms(buyerPhone, `Frenciniz: Siparisiniz alindi. No: ${merchant_oid} Tutar: ${Number(merged.amount).toFixed(2)} TL. Hazirlandiginda bilgi verilecektir.`).catch(()=>{});
        }

        // Yöneticiye yeni sipariş bildirimi
        try {
          const smsCfg = await getSmsConfig();
          if (smsCfg.notifyAdminOrder !== false && smsCfg.adminPhone) {
            const itemCount = items.reduce((s, it) => s + Number(it.numberOfProducts || 0), 0);
            const customerLabel = (buyerName || buyerEmail || "Musteri").slice(0, 30);
            const adminMsg = `Frenciniz YENI SIPARIS! No:${merchant_oid} Musteri:${customerLabel} Adet:${itemCount} Tutar:${Number(merged.amount).toFixed(2)}TL`;
            sendSms(smsCfg.adminPhone, adminMsg.slice(0, 155)).catch(()=>{});
          }
        } catch {}
      } catch {}
    } else {
      try {
        await kv.set(
          `order:${merchant_oid}:fail`,
          JSON.stringify({
            reason: "payment-fail",
            failed_reason_code, failed_reason_msg,
            at: new Date().toISOString(),
          }),
          { ex: 86400 }
        );
      } catch {}
    }

    return res.status(200).send("OK");
  } catch (err) {
    return res.status(200).send("OK");
  }
}
