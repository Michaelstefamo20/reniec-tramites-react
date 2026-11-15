import { randomBytes } from "node:crypto";
import { pool } from "../config/database.js";
import { authRepository } from "../repositories/authRepository.js";
import { sendActionEmail } from "./emailService.js";
import { seal, unseal, dniDigest, hashToken, passwordHash, verifyPassword } from "../utils/crypto.js";
import { validDni, validEmail, validName, validPassword, normalizeEmail, normalizeName } from "../utils/validation.js";

export class AuthError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

export async function register({ name, dni, email }) {
  const cleanName = typeof name === "string" ? normalizeName(name) : "";
  const cleanEmail = typeof email === "string" ? normalizeEmail(email) : "";
  if (!validName(cleanName) || !validDni(dni) || !validEmail(cleanEmail)) throw new AuthError(400, "Revisa tus nombres, el DNI de 8 dígitos y el correo Gmail.");
  const identityHash = dniDigest(dni);
  let accountId;
  try {
    await assertDatabaseReady();
    const account = await authRepository.createPendingAccount({ nameCipher: seal(cleanName), dniCipher: seal(dni), dniHash: identityHash, email: cleanEmail });
    accountId = account.id;
    await sendActionEmail(account, "setup-password");
    return { message: "Te enviamos el enlace de activación. Revisa tu correo." };
  } catch (error) {
    if (error.code === "23505") {
      const pendingAccount = await authRepository.findPendingAccountByIdentity(identityHash, cleanEmail);
      if (pendingAccount) {
        await sendActionEmail(pendingAccount, "setup-password");
        return { message: "Tu registro ya estaba pendiente. Reenviamos el enlace de activación a tu correo." };
      }
      if (error.constraint === "accounts_dni_hash_key") {
        throw new AuthError(409, "Este DNI ya tiene un registro asociado a otro correo. Usa el correo original con el que iniciaste el registro.");
      }
      if (error.constraint === "accounts_email_key") {
        throw new AuthError(409, "Este correo ya está asociado a una cuenta. Inicia sesión o usa «Olvidé mi contraseña».");
      }
      const existingAccount = await authRepository.findActivatedAccountByIdentity(identityHash, cleanEmail);
      if (existingAccount) throw new AuthError(409, "Ya existe una cuenta con esos datos. Inicia sesión o usa «Olvidé mi contraseña».");
    }
    if (accountId) await authRepository.deleteUnverifiedAccount(accountId).catch(() => {});
    throw error;
  }
}

export async function setupPassword({ token, password }) {
  if (!validPassword(password)) throw new AuthError(400, "La contraseña debe tener 12 caracteres, mayúscula, minúscula, número y símbolo.");
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const account = await authRepository.findActivationToken(client, hashToken(String(token || "")), Date.now());
    if (!account) throw new AuthError(400, "El enlace de activación no es válido, ya se utilizó o venció.");
    await authRepository.activateAccount(client, account.account_id, await passwordHash(password));
    await authRepository.consumeToken(client, hashToken(String(token)));
    await client.query("COMMIT");
    return { message: "Cuenta activada.", email: account.email };
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    throw error;
  } finally { client.release(); }
}

export async function login({ email, password }, res, cookieOptions) {
  const account = await authRepository.findVerifiedAccountByEmail(typeof email === "string" ? normalizeEmail(email) : "");
  if (!account?.password_hash || !(await verifyPassword(String(password || ""), account.password_hash))) throw new AuthError(401, "Correo o contraseña incorrectos.");
  if (!account.verified_at) throw new AuthError(403, "Confirma tu correo antes de iniciar sesión.");
  const token = cryptoRandomToken();
  await authRepository.createSession(hashToken(token), account.id, Date.now() + 8 * 60 * 60 * 1000);
  res.cookie("reniec_session", token, cookieOptions(8 * 60 * 60 * 1000));
  return { user: { name: unseal(account.name_cipher), email: account.email } };
}

export async function requestPasswordReset(email, sendEmail = sendActionEmail) {
  const account = await authRepository.findAccountForReset(typeof email === "string" ? normalizeEmail(email) : "");
  if (account) await sendEmail(account, "reset-password");
  return { message: "Si existe una cuenta verificada para ese correo, enviaremos un enlace." };
}

export async function resetPassword({ token, password }, clearSession) {
  if (!validPassword(password)) throw new AuthError(400, "La contraseña no cumple los requisitos de seguridad.");
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const row = await authRepository.findResetToken(client, hashToken(String(token || "")), Date.now());
    if (!row) throw new AuthError(400, "El enlace para cambiar la contraseña no es válido o venció.");
    await authRepository.updatePassword(client, row.account_id, await passwordHash(password));
    await authRepository.clearRecoveryTokens(client, row.account_id);
    await authRepository.clearSessions(client, row.account_id);
    await client.query("COMMIT");
    clearSession();
    return { message: "Contraseña actualizada." };
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    throw error;
  } finally { client.release(); }
}

export async function verifyEmail(token) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const row = await authRepository.verifyEmailToken(client, hashToken(String(token || "")), Date.now());
    if (!row) throw new AuthError(400, "El enlace de verificación no es válido o venció.");
    await authRepository.markEmailVerified(client, row.account_id);
    await authRepository.consumeToken(client, hashToken(String(token)));
    await client.query("COMMIT");
    return { message: "Correo verificado." };
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    throw error;
  } finally { client.release(); }
}

export async function getSessionUser(token) {
  const session = await authRepository.findSession(hashToken(token), Date.now());
  if (!session) return null;
  const user = await authRepository.findUser(session.account_id);
  return user ? { name: unseal(user.name_cipher), email: user.email } : null;
}

export async function logout(token) {
  if (token) await authRepository.deleteSession(hashToken(token));
}

async function assertDatabaseReady() {
  try {
    if (!pool) throw new Error("DATABASE_URL missing");
    await pool.query("SELECT 1");
  } catch (error) {
    console.error("Registration database check failed:", error.code || error.message);
    throw new AuthError(503, "La base de datos no responde. Revisa DATABASE_URL y el estado del proveedor PostgreSQL en Vercel.");
  }
}

function cryptoRandomToken() {
  return randomBytes(32).toString("base64url");
}
