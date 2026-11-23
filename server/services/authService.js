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
    return { message: "Cuenta activada.", email: account.email, accountId: account.account_id };
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

export async function changePassword(accountId,{currentPassword,newPassword}){
  if(typeof newPassword!=="string"||!validPassword(newPassword))throw new AuthError(400,"La contraseña nueva debe tener 12 caracteres, mayúscula, minúscula, número y símbolo.");
  const client=await pool.connect();
  try{
    await client.query("BEGIN");
    const {rows}=await client.query("SELECT password_hash FROM accounts WHERE id=$1 AND verified_at IS NOT NULL FOR UPDATE",[accountId]);
    const existing=rows[0]?.password_hash;
    if(!existing||!(await verifyPassword(String(currentPassword||""),existing)))throw new AuthError(401,"La contraseña actual no es correcta.");
    await client.query("UPDATE accounts SET password_hash=$1 WHERE id=$2",[await passwordHash(newPassword),accountId]);
    await client.query("DELETE FROM sessions WHERE account_id=$1",[accountId]);
    await client.query("COMMIT");
    return{message:"Contraseña actualizada. Inicia sesión de nuevo en tus dispositivos."};
  }catch(error){await client.query("ROLLBACK").catch(()=>{});throw error}finally{client.release()}
}

export async function requestEmailChange(accountId,{currentPassword,newEmail}){
  const cleanEmail=typeof newEmail==="string"?normalizeEmail(newEmail):"";
  if(!validEmail(cleanEmail))throw new AuthError(400,"Ingresa un correo electrónico válido.");
  const client=await pool.connect();
  const token=randomBytes(32).toString("base64url");
  try{
    await client.query("BEGIN");
    const {rows}=await client.query("SELECT id,email,password_hash,pending_email FROM accounts WHERE id=$1 AND verified_at IS NOT NULL FOR UPDATE",[accountId]);
    const account=rows[0];
    if(!account||!(await verifyPassword(String(currentPassword||""),account.password_hash)))throw new AuthError(401,"La contraseña actual no es correcta.");
    if(cleanEmail===account.email)throw new AuthError(400,"El correo nuevo debe ser distinto del actual.");
    const duplicate=await client.query("SELECT id FROM accounts WHERE email=$1 AND id<>$2",[cleanEmail,accountId]);
    if(account.pending_email&&account.pending_email!==cleanEmail)throw new AuthError(409,"Ya hay un cambio de correo pendiente. Confírmalo o cancélalo primero.");
    if(duplicate.rows.length)throw new AuthError(409,"Ese correo ya está asociado a otra cuenta.");
    await client.query("UPDATE accounts SET pending_email=$1,pending_email_confirmed_at=NULL WHERE id=$2",[cleanEmail,accountId]);
    await client.query("DELETE FROM tokens WHERE account_id=$1 AND purpose IN ('change-email-authorize','change-email')",[accountId]);
    await client.query("INSERT INTO tokens(token_hash,account_id,purpose,expires_at,created_at) VALUES($1,$2,'change-email-authorize',$3,$4)",[hashToken(token),accountId,Date.now()+30*60*1000,Date.now()]);
    await client.query("COMMIT");
  }catch(error){await client.query("ROLLBACK").catch(()=>{});throw error}finally{client.release()}
  try{await sendActionEmail({id:accountId,email:account.email},"change-email-authorize",token)}catch(error){await authRepository.clearPendingEmail(accountId).catch(()=>{});await authRepository.deleteTokensForPurpose(accountId,"change-email-authorize").catch(()=>{});throw error}
  return{message:"Enviamos un enlace de autorización a tu correo actual. Después enviaremos una segunda confirmación a la nueva dirección."};
}

export async function confirmEmailChange(token,sendEmail=sendActionEmail){
  const client=await pool.connect();
  try{
    await client.query("BEGIN");
    const hash=hashToken(String(token||""));
    const pending=await authRepository.findPendingEmailToken(client,hash,Date.now());
    if(!pending)throw new AuthError(400,"El enlace para cambiar el correo no es válido o venció.");
    const tokenRow=await client.query("SELECT purpose FROM tokens WHERE token_hash=$1",[hash]);
    const purpose=tokenRow.rows[0]?.purpose;
    if(purpose==="change-email-authorize"){
      await client.query("UPDATE accounts SET pending_email_confirmed_at=NOW() WHERE id=$1",[pending.account_id]);
      await authRepository.consumeToken(client,hash);
      await client.query("COMMIT");
      try{
        const newToken=randomBytes(32).toString("base64url");
        await authRepository.createToken({accountId:pending.account_id,tokenHash:hashToken(newToken),purpose:"change-email",expiresAt:Date.now()+30*60*1000});
        await sendEmail({id:pending.account_id,email:pending.pending_email},"change-email",newToken);
      }catch(error){
        await authRepository.clearPendingEmail(pending.account_id).catch(()=>{});
        await authRepository.deleteTokensForPurpose(pending.account_id,"change-email").catch(()=>{});
        console.error("New email confirmation delivery failed:",error.code||error.message);
        throw new AuthError(502,"Autorizamos la solicitud, pero no pudimos enviar el enlace al correo nuevo. Inicia sesión y vuelve a solicitar el cambio.");
      }
      return{message:"Correo actual confirmado. Enviamos la segunda confirmación al correo nuevo; el cambio aún no se aplica."};
    }
    if(purpose!=="change-email"||!pending.pending_email_confirmed_at)throw new AuthError(400,"Primero debe autorizarse el cambio desde el correo actual.");
    const duplicate=await client.query("SELECT id FROM accounts WHERE email=$1 AND id<>$2 FOR UPDATE",[pending.pending_email,pending.account_id]);
    if(duplicate.rows.length)throw new AuthError(409,"Ese correo ya está asociado a otra cuenta.");
    await authRepository.applyPendingEmail(client,pending.account_id,pending.pending_email);
    await authRepository.consumeToken(client,hash);
    await authRepository.clearSessions(client,pending.account_id);
    await client.query("COMMIT");
    return{message:"Correo actualizado y confirmado. Inicia sesión con tu nuevo correo.",email:pending.pending_email};
  }catch(error){await client.query("ROLLBACK").catch(()=>{});throw error}
  finally{client.release()}
}

export async function cancelPendingEmailChange(accountId){
  await authRepository.clearPendingEmail(accountId);
  await authRepository.deleteTokensForPurpose(accountId,"change-email-authorize");
  await authRepository.deleteTokensForPurpose(accountId,"change-email");
  return{message:"El cambio de correo pendiente fue cancelado."};
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
  return user ? { name: unseal(user.name_cipher), dni: unseal(user.dni_cipher), email: user.email, pendingEmail:user.pending_email||null } : null;
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
