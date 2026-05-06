// Vercel cron: günde 1 kez (vercel.json crons), tamamlanmamış ödemeleri tarar.
// 24-72 saat önce başlatılmış ama ödenmemiş siparişlere SMS hatırlatma gönderir.
// Tek sefer hatırlatma — ikinci kez gönderilmez (reminderSent bayrağı).

import { kv } from "@vercel/kv";
import { sendSms } from "../_lib/netgsm.js";
import { logActivity } from "../_lib/auth.js";

export default async function handler(req, res) {
  // Cron auth: Vercel "x-vercel-cron: 1" başlığı ekler. Manuel test için ADMIN_SECRET bearer.
  const isCron = req.headers["x-vercel-cron"] === "1";
  const auth = req.headers.authorization || "";
  const adminBearer = `Bearer ${process.env.ADMIN_SECRET || "frenciniz-admin-2026"}`;
  if (!isCron && auth !== adminBearer) return res.status(401).json({ error: "Unauthorized" });

  const refs = (await kv.lrange("orders:index", 0, 199)) || [];
  const now = Date.now();
  const minAge = 24 * 60 * 60 * 1000;
  const maxAge = 72 * 60 * 60 * 1000;

  let sent = 0, skipped = 0, errors = 0;
  const detail = [];

  for (const ref of refs) {
    try {
      const raw = await kv.get(`order:${ref}`);
      if (!raw) continue;
      const o = typeof raw === "string" ? JSON.parse(raw) : raw;
      if (o.status === "paid") continue;
      if (o.reminderSent) { skipped++; continue; }

      const created = o.createdAt ? new Date(o.createdAt).getTime() : 0;
      const age = now - created;
      if (age < minAge || age > maxAge) { skipped++; continue; }

      const phone = o?.buyer?.phoneNumber;
      const name = o?.buyer?.name || "değerli müşterimiz";
      const itemCount = (o?.basket?.basketItems || []).reduce((s, it) => s + Number(it.numberOfProducts || 0), 0);
      const amount = Number(o.amount || 0);

      if (!phone) { skipped++; continue; }

      const msg = `Frenciniz: Merhaba ${name}, sepetinizde ${itemCount} urun ve ${amount.toFixed(2)}TL'lik siparis tamamlanmadi. Avantajli fiyatlar tukenmeden tamamlayin: frenciniz.com`;
      const r = await sendSms(phone, msg.slice(0, 155));

      o.reminderSent = true;
      o.reminderAt = new Date().toISOString();
      await kv.set(`order:${ref}`, JSON.stringify(o), { ex: 60 * 60 * 24 * 30 });

      if (r.ok) { sent++; detail.push({ ref, phone, ok: true }); }
      else { errors++; detail.push({ ref, phone, ok: false, code: r.code }); }
    } catch (e) { errors++; }
  }

  await logActivity("cron.cart-reminder", { sent, skipped, errors, total: refs.length });
  return res.status(200).json({ success: true, sent, skipped, errors, total: refs.length });
}
