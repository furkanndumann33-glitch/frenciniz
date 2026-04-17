import { kv } from "@vercel/kv";
import { esnekposConfig, verifyCallbackHash } from "../_lib/esnekpos-auth.js";
import { logActivity, readUser, writeUser } from "../_lib/auth.js";

async function parseBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const raw = Buffer.concat(chunks).toString("utf8");
  const ct = (req.headers["content-type"] || "").toLowerCase();
  if (ct.includes("application/json")) {
    try { return JSON.parse(raw); } catch { return {}; }
  }
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
  if (req.method !== "POST" && req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const cfg = esnekposConfig();

  try {
    const body = await parseBody(req);
    const {
      STATUS, RETURN_CODE, RETURN_MESSAGE, ERROR_CODE,
      ORDER_REF_NUMBER, REFNO, AMOUNT, INSTALLMENT,
      BANK_AUTH_CODE, CUSTOMER_NAME, CUSTOMER_MAIL, CUSTOMER_CC_NUMBER,
      DATE, HASH,
    } = body;

    const orderRef = ORDER_REF_NUMBER;
    if (!orderRef) return redirect(res, "/odeme-basarisiz?reason=missing-order");

    const hashOk = verifyCallbackHash(cfg, body);
    if (!hashOk) {
      try { await kv.set(`order:${orderRef}:fail`, JSON.stringify({ reason: "hash-mismatch", body, at: new Date().toISOString() }), { ex: 86400 }); } catch {}
      return redirect(res, `/odeme-basarisiz?orderRef=${encodeURIComponent(orderRef)}&reason=hash`);
    }

    const paid = String(STATUS).toUpperCase() === "SUCCESS" && String(RETURN_CODE) === "0";
    if (!paid) {
      try {
        await kv.set(`order:${orderRef}:fail`, JSON.stringify({
          reason: "payment-fail",
          status: STATUS, returnCode: RETURN_CODE, returnMessage: RETURN_MESSAGE, errorCode: ERROR_CODE,
          at: new Date().toISOString(),
        }), { ex: 86400 });
      } catch {}
      const msg = encodeURIComponent(RETURN_MESSAGE || "Ödeme reddedildi");
      return redirect(res, `/odeme-basarisiz?orderRef=${encodeURIComponent(orderRef)}&reason=declined&msg=${msg}`);
    }

    const paidAmount = Number(AMOUNT ?? 0);
    try {
      const existingRaw = await kv.get(`order:${orderRef}`);
      const existing = existingRaw ? (typeof existingRaw === "string" ? JSON.parse(existingRaw) : existingRaw) : {};
      const merged = {
        ...existing,
        orderRef,
        status: "paid",
        fulfillmentStatus: existing.fulfillmentStatus || "Hazırlanıyor",
        paidAt: new Date().toISOString(),
        amount: paidAmount || Number(existing.amount || 0),
        installment: Number(INSTALLMENT || 1),
        bankAuthCode: BANK_AUTH_CODE || "",
        refno: REFNO || existing.refno,
        maskedCc: CUSTOMER_CC_NUMBER || "",
        customerName: CUSTOMER_NAME || existing?.buyer?.name || "",
        customerMail: CUSTOMER_MAIL || existing?.buyer?.emailAddress || "",
        customerPhone: existing?.buyer?.phoneNumber || "",
        bankDate: DATE || "",
      };
      await kv.set(`order:${orderRef}`, JSON.stringify(merged), { ex: 60 * 60 * 24 * 365 });
      await kv.lpush("orders:index", orderRef);
      await logActivity("order.paid", {
        orderRef, amount: merged.amount, customer: merged.customerName, mail: merged.customerMail,
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

    return redirect(res, `/odeme-basarili?orderRef=${encodeURIComponent(orderRef)}`);
  } catch (err) {
    return redirect(res, `/odeme-basarisiz?reason=server`);
  }
}
