import { kv } from "@vercel/kv";
import {
  hashPassword, verifyPassword, signJWT, setSessionCookie, clearSessionCookie,
  getSession, readUser, publicUser, newUserId, writeUser,
  normalizeEmail, normalizePhone, findUserByEmail, findUserByPhone,
  isAdminEmail, logActivity,
} from "./_lib/auth.js";

export default async function handler(req, res) {
  const action = String(req.query.action || "").toLowerCase();

  try {
    if (action === "signup" && req.method === "POST") {
      const { name, email, phone, password } = req.body || {};
      if (!name || !password) return res.status(400).json({ error: "Ad ve şifre zorunlu" });
      if (!email && !phone) return res.status(400).json({ error: "E-posta veya telefon zorunlu" });
      if (String(password).length < 6) return res.status(400).json({ error: "Şifre en az 6 karakter olmalı" });

      const emailNorm = normalizeEmail(email);
      const phoneNorm = normalizePhone(phone);
      if (emailNorm && await findUserByEmail(emailNorm)) return res.status(409).json({ error: "Bu e-posta zaten kayıtlı" });
      if (phoneNorm && await findUserByPhone(phoneNorm)) return res.status(409).json({ error: "Bu telefon zaten kayıtlı" });

      const id = newUserId();
      // Ana sayfa signup her zaman "customer" — admin hesapları sadece seed endpoint'i ile oluşturulur
      const user = {
        id, name: String(name).trim(),
        email: emailNorm || "", phone: phoneNorm || "",
        passwordHash: hashPassword(password),
        role: "customer",
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        orderCount: 0, totalSpent: 0,
      };
      await writeUser(user);
      await kv.lpush("users:index", id);
      await logActivity("user.signup", { userId: id, name: user.name, email: user.email, role: "customer" });
      setSessionCookie(res, signJWT({ userId: id, role: "customer", email: user.email }));
      return res.status(200).json({ success: true, user: publicUser(user) });
    }

    // Admin seed — sadece ADMIN_SECRET bearer ile çağrılabilir, tek seferlik admin hesabı oluşturur.
    // Daha önce aynı e-posta ile kullanıcı varsa şifresini yeniler ve rolünü admin yapar.
    if (action === "seed-admin" && req.method === "POST") {
      const auth = req.headers.authorization || "";
      const expected = `Bearer ${process.env.ADMIN_SECRET || "frenciniz-admin-2026"}`;
      if (auth !== expected) return res.status(403).json({ error: "Yetkisiz" });
      const { email, password, name } = req.body || {};
      if (!email || !password) return res.status(400).json({ error: "email ve password zorunlu" });
      if (String(password).length < 6) return res.status(400).json({ error: "Şifre en az 6 karakter olmalı" });
      const emailNorm = normalizeEmail(email);
      let user = await findUserByEmail(emailNorm);
      if (user) {
        user.passwordHash = hashPassword(password);
        user.role = "admin";
        if (name) user.name = String(name).trim();
        await writeUser(user);
        await logActivity("admin.seed", { userId: user.id, email: user.email, action: "update" });
        return res.status(200).json({ success: true, user: publicUser(user), action: "updated" });
      }
      const id = newUserId();
      user = {
        id, name: (name || "Admin").trim(),
        email: emailNorm, phone: "",
        passwordHash: hashPassword(password),
        role: "admin",
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        orderCount: 0, totalSpent: 0,
      };
      await writeUser(user);
      await kv.lpush("users:index", id);
      await logActivity("admin.seed", { userId: id, email: user.email, action: "create" });
      return res.status(200).json({ success: true, user: publicUser(user), action: "created" });
    }

    if (action === "login" && req.method === "POST") {
      const { emailOrPhone, password } = req.body || {};
      if (!emailOrPhone || !password) return res.status(400).json({ error: "Kimlik ve şifre zorunlu" });
      const looksEmail = String(emailOrPhone).includes("@");
      let user = looksEmail ? await findUserByEmail(emailOrPhone) : await findUserByPhone(emailOrPhone);
      if (!user) user = looksEmail ? await findUserByPhone(emailOrPhone) : await findUserByEmail(emailOrPhone);
      if (!user || !verifyPassword(password, user.passwordHash)) {
        return res.status(401).json({ error: "E-posta/telefon veya şifre yanlış" });
      }
      user.lastLogin = new Date().toISOString();
      await writeUser(user);
      await logActivity("user.login", { userId: user.id, name: user.name });
      setSessionCookie(res, signJWT({ userId: user.id, role: user.role, email: user.email }));
      return res.status(200).json({ success: true, user: publicUser(user) });
    }

    if (action === "logout") {
      clearSessionCookie(res);
      return res.status(200).json({ success: true });
    }

    if (action === "me") {
      const s = getSession(req);
      if (!s || !s.userId || s.userId === "admin-bearer") return res.status(200).json({ user: null });
      const u = await readUser(s.userId);
      if (!u) return res.status(200).json({ user: null });
      return res.status(200).json({ user: publicUser(u) });
    }

    return res.status(404).json({ error: "Bilinmeyen action: " + action });
  } catch (err) {
    return res.status(500).json({ error: "Sunucu hatası", detail: err.message });
  }
}
