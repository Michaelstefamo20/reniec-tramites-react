import { authRepository } from "../repositories/authRepository.js";
import { hashToken } from "../utils/crypto.js";
import { cookieOptions } from "../utils/http.js";

export async function requireSession(req, res, next) {
  const token = req.cookies?.reniec_session;
  if (!token) return res.status(401).json({ error: "Inicia sesión para continuar." });
  try {
    const session = await authRepository.findSession(hashToken(token), Date.now());
    if (!session) {
      res.clearCookie("reniec_session", cookieOptions(0));
      return res.status(401).json({ error: "La sesión venció. Inicia sesión otra vez." });
    }
    req.accountId = session.account_id;
    next();
  } catch (error) { next(error); }
}
