import { kv } from "@vercel/kv";
import { esnekposConfig, verifyCallbackHash } from "../_lib/esnekpos-auth.js";

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

    try {
      const existingRaw = await kv.get(`order:${orderRef}`);
      const existing = existingRaw ? (typeof existingRaw === "string" ? JSON.parse(existingRaw) : existingRaw) : {};
      await kv.set(`order:${orderRef}`, JSON.stringify({
        ...existing,
        status: "paid",
        paidAt: new Date().toISOString(),
        amount: Number(AMOUNT ?? existing.amount ?? 0),
        installment: Number(INSTALLMENT || 1),
        bankAuthCode: BANK_AUTH_CODE || "",
        refno: REFNO || existing.refno,
        maskedCc: CUSTOMER_CC_NUMBER || "",
        customerName: CUSTOMER_NAME || "",
        customerMail: CUSTOMER_MAIL || "",
        bankDate: DATE || "",
      }), { ex: 60 * 60 * 24 * 90 });
    } catch {}

    return redirect(res, `/odeme-basarili?orderRef=${encodeURIComponent(orderRef)}`);
  } catch (err) {
    return redirect(res, `/odeme-basarisiz?reason=server`);
  }
}
