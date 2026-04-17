import { kv } from "@vercel/kv";
import {
  hashPassword, signJWT, setSessionCookie, isAdminEmail,
  normalizeEmail, normalizePhone, findUserByEmail, findUserByPhone,
  writeUser, publicUser, newUserId, logActivity,
} from "../_lib/auth.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const { name, email, phone, password } = req.body || {};
    if (!name || !password) return res.status(400).json({ error: "Ad ve şifre zorunlu" });
    if (!email && !phone) return res.status(400).json({ error: "E-posta veya telefon zorunlu" });
    if (String(password).length < 6) return res.status(400).json({ error: "Şifre en az 6 karakter olmalı" });

    const emailNorm = normalizeEmail(email);
    const phoneNorm = normalizePhone(phone);

    if (emailNorm && await findUserByEmail(emailNorm)) return res.status(409).json({ error: "Bu e-posta zaten kayıtlı" });
    if (phoneNorm && await findUserByPhone(phoneNorm)) return res.status(409).json({ error: "Bu telefon zaten kayıtlı" });

    const id = newUserId();
    const role = isAdminEmail(emailNorm) ? "admin" : "customer";
    const user = {
      id,
      name: String(name).trim(),
      email: emailNorm || "",
      phone: phoneNorm || "",
      passwordHash: hashPassword(password),
      role,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      orderCount: 0,
      totalSpent: 0,
    };
    await writeUser(user);
    await kv.lpush("users:index", id);
    await logActivity("user.signup", { userId: id, name: user.name, email: user.email, role });

    const token = signJWT({ userId: id, role, email: user.email });
    setSessionCookie(res, token);
    return res.status(200).json({ success: true, user: publicUser(user) });
  } catch (err) {
    return res.status(500).json({ error: "Sunucu hatası", detail: err.message });
  }
}
