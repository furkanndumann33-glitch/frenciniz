import crypto from "crypto";
import { kv } from "@vercel/kv";

const AUTH_SECRET = process.env.AUTH_SECRET || "frenciniz-dev-secret-change-in-prod-2026";
const COOKIE_NAME = "frenciniz_session";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 gün

// ── Password hashing (Node stdlib scrypt) ──────────────────────────────
export function hashPassword(plain) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(plain, salt, 64);
  return `scrypt$${salt.toString("hex")}$${hash.toString("hex")}`;
}
export function verifyPassword(plain, stored) {
  if (!stored || typeof stored !== "string" || !stored.startsWith("scrypt$")) return false;
  const [, saltHex, hashHex] = stored.split("$");
  const salt = Buffer.from(saltHex, "hex");
  const expected = Buffer.from(hashHex, "hex");
  const actual = crypto.scryptSync(plain, salt, expected.length);
  try { return crypto.timingSafeEqual(expected, actual); } catch { return false; }
}

// ── JWT (HMAC-SHA256) ──────────────────────────────────────────────────
function b64url(buf) {
  return Buffer.from(buf).toString("base64").replace(/=+$/,"").replace(/\+/g,"-").replace(/\//g,"_");
}
function b64urlDecode(str) {
  str = str.replace(/-/g,"+").replace(/_/g,"/");
  while (str.length % 4) str += "=";
  return Buffer.from(str, "base64").toString("utf8");
}
export function signJWT(payload, ttlSec = COOKIE_MAX_AGE) {
  const header = { alg: "HS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const body = { ...payload, iat: now, exp: now + ttlSec };
  const eh = b64url(JSON.stringify(header));
  const ep = b64url(JSON.stringify(body));
  const sig = crypto.createHmac("sha256", AUTH_SECRET).update(`${eh}.${ep}`).digest();
  return `${eh}.${ep}.${b64url(sig)}`;
}
export function verifyJWT(token) {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [eh, ep, sig] = parts;
  const expected = b64url(crypto.createHmac("sha256", AUTH_SECRET).update(`${eh}.${ep}`).digest());
  if (expected !== sig) return null;
  try {
    const payload = JSON.parse(b64urlDecode(ep));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch { return null; }
}

// ── Cookie helpers ─────────────────────────────────────────────────────
export function setSessionCookie(res, token) {
  const attrs = [
    `${COOKIE_NAME}=${token}`,
    "Path=/",
    `Max-Age=${COOKIE_MAX_AGE}`,
    "HttpOnly",
    "SameSite=Lax",
    "Secure",
  ];
  res.setHeader("Set-Cookie", attrs.join("; "));
}
export function clearSessionCookie(res) {
  res.setHeader("Set-Cookie", `${COOKIE_NAME}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax; Secure`);
}
export function parseCookies(req) {
  const h = req.headers.cookie || "";
  const out = {};
  h.split(";").forEach(p => {
    const i = p.indexOf("=");
    if (i > -1) out[p.slice(0,i).trim()] = decodeURIComponent(p.slice(i+1).trim());
  });
  return out;
}
export function getSession(req) {
  // 1) Cookie
  const cookies = parseCookies(req);
  const fromCookie = verifyJWT(cookies[COOKIE_NAME]);
  if (fromCookie) return fromCookie;
  // 2) Bearer token (Bearer <ADMIN_SECRET> — kolayca script/test için)
  const auth = req.headers.authorization || "";
  if (auth.startsWith("Bearer ")) {
    const t = auth.slice(7).trim();
    const adminSecret = process.env.ADMIN_SECRET || "frenciniz-admin-2026";
    if (t === adminSecret) return { userId: "admin-bearer", role: "admin", email: "bearer@admin" };
    const payload = verifyJWT(t);
    if (payload) return payload;
  }
  return null;
}
export function isAdminEmail(email) {
  const list = (process.env.ADMIN_EMAILS || "").split(",").map(s => s.trim().toLowerCase()).filter(Boolean);
  if (list.length === 0) return false;
  return list.includes(String(email || "").toLowerCase());
}
export async function requireUser(req, res) {
  const s = getSession(req);
  if (!s || !s.userId) {
    res.status(401).json({ error: "Giriş yapılmamış" });
    return null;
  }
  return s;
}
export async function requireAdmin(req, res) {
  const s = getSession(req);
  if (!s || s.role !== "admin") {
    res.status(403).json({ error: "Yetki yok" });
    return null;
  }
  return s;
}

// ── User KV helpers ────────────────────────────────────────────────────
export function normalizeEmail(e) { return String(e || "").trim().toLowerCase(); }
export function normalizePhone(p) { return String(p || "").replace(/\D/g, ""); }

export async function findUserByEmail(email) {
  const e = normalizeEmail(email);
  if (!e) return null;
  const id = await kv.get(`user:email:${e}`);
  if (!id) return null;
  return await readUser(id);
}
export async function findUserByPhone(phone) {
  const p = normalizePhone(phone);
  if (!p) return null;
  const id = await kv.get(`user:phone:${p}`);
  if (!id) return null;
  return await readUser(id);
}
export async function readUser(id) {
  if (!id) return null;
  const raw = await kv.get(`user:${id}`);
  if (!raw) return null;
  return typeof raw === "string" ? JSON.parse(raw) : raw;
}
export async function writeUser(u) {
  await kv.set(`user:${u.id}`, JSON.stringify(u));
  if (u.email) await kv.set(`user:email:${normalizeEmail(u.email)}`, u.id);
  if (u.phone) await kv.set(`user:phone:${normalizePhone(u.phone)}`, u.id);
}
export function publicUser(u) {
  if (!u) return null;
  const { passwordHash, ...safe } = u;
  return safe;
}
export function newUserId() {
  return `usr_${Date.now().toString(36)}${crypto.randomBytes(4).toString("hex")}`;
}

// ── Activity log ───────────────────────────────────────────────────────
export async function logActivity(event, data = {}) {
  try {
    const entry = { event, ...data, at: new Date().toISOString() };
    await kv.lpush("activity:log", JSON.stringify(entry));
    await kv.ltrim("activity:log", 0, 499);
  } catch {}
}
