import {
  verifyPassword, signJWT, setSessionCookie,
  findUserByEmail, findUserByPhone, writeUser, publicUser, logActivity,
} from "../_lib/auth.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
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

    const token = signJWT({ userId: user.id, role: user.role, email: user.email });
    setSessionCookie(res, token);
    return res.status(200).json({ success: true, user: publicUser(user) });
  } catch (err) {
    return res.status(500).json({ error: "Sunucu hatası", detail: err.message });
  }
}
