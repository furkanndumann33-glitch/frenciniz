import { getSession, readUser, publicUser } from "../_lib/auth.js";

export default async function handler(req, res) {
  const s = getSession(req);
  if (!s || !s.userId || s.userId === "admin-bearer") {
    return res.status(200).json({ user: null });
  }
  const u = await readUser(s.userId);
  if (!u) return res.status(200).json({ user: null });
  return res.status(200).json({ user: publicUser(u) });
}
