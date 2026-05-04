import { kv } from "@vercel/kv";
import { paytrConfig, verifyCallbackHash } from "../_lib/paytr.js";
import { logActivity, readUser, writeUser } from "../_lib/auth.js";

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
          const u = await readUser(userId);
          if (u) {
            u.orderCount = (u.orderCount || 0) + 1;
            u.totalSpent = (u.totalSpent || 0) + merged.amount;
            u.lastOrderAt = new Date().toISOString();
            await writeUser(u);
          }
        }
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
