import { AuthError, getSessionUser, login, logout, register, requestPasswordReset, resetPassword, setupPassword, verifyEmail } from "../services/authService.js";
import { authRepository } from "../repositories/authRepository.js";
import { emailConfigurationError } from "../config/mailer.js";
import { cookieOptions } from "../utils/http.js";
import { env } from "../config/env.js";
import { notifyAccount } from "../services/notificationService.js";

const asyncHandler = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
const emailDeliveryErrorCodes = new Set([
  "EMAIL_PROVIDER_DELIVERY_FAILED",
  "GMAIL_OAUTH_FAILED",
  "GMAIL_API_SEND_FAILED",
  "APPS_SCRIPT_MAIL_FAILED",
  "APPS_SCRIPT_MAIL_UNAVAILABLE",
  "APPS_SCRIPT_MAIL_NOT_CONFIGURED",
]);
const isEmailDeliveryError = error => emailDeliveryErrorCodes.has(error.code);
const respond = (res, callback) => callback().then((data) => res.json(data)).catch((error) => {
  if (error instanceof AuthError) return res.status(error.status).json({ error: error.message });
  throw error;
});

export const registerController = asyncHandler(async (req, res) => {
  try { res.status(202).json(await register(req.body || {})); }
  catch (error) {
    if (error instanceof AuthError) return res.status(error.status).json({ error: error.message });
    console.error("Registration failure", error.code || error.message);
    if (isEmailDeliveryError(error)) return res.status(502).json({ error: error.message });
    return res.status(503).json({ error: emailConfigurationError() });
  }
});

export const setupPasswordController = asyncHandler(async(req,res)=>{
  try{const result=await setupPassword(req.body||{});if(result.accountId)await notifyAccount(result.accountId,{kind:"account_activated",title:"Cuenta activada",message:"Tu cuenta quedó activada. Ya puedes explorar el portal de orientación.",destination:"inicio"});return res.json(result)}catch(error){if(error instanceof AuthError)return res.status(error.status).json({error:error.message});throw error}
});
export const verifyEmailController = asyncHandler((req, res) => respond(res, () => verifyEmail(req.body?.token)));
export const loginController = asyncHandler((req, res) => respond(res, () => login(req.body || {}, res, cookieOptions)));
export const forgotPasswordController = asyncHandler(async (req, res) => {
  try { res.json(await requestPasswordReset(req.body?.email)); }
  catch (error) {
    console.error("Password reset mail failure", error.code || error.message);
    res.status(isEmailDeliveryError(error) ? 502 : 503).json({ error: isEmailDeliveryError(error) ? error.message : emailConfigurationError() });
  }
});
export const resetPasswordController = asyncHandler((req, res) => respond(res, () => resetPassword(req.body || {}, () => res.clearCookie("reniec_session", cookieOptions(0)))));
export const meController = asyncHandler(async (req, res) => {
  const user = await getSessionUser(req.cookies?.reniec_session);
  if (!user) { res.clearCookie("reniec_session", cookieOptions(0)); return res.status(401).json({ error: "La sesión venció. Inicia sesión otra vez." }); }
  const adminEmails = String(env.supportAdminEmails || "").split(",").map(value => value.trim().toLowerCase()).filter(Boolean);
  if(!adminEmails.includes(user.email.toLowerCase())){
    const accountId=await authRepository.findAccountIdByEmail(user.email);
    if(accountId)await notifyAccount(accountId,{kind:"welcome",title:"Bienvenido",message:"Tu bandeja está lista. Aquí aparecerán avisos de tu cuenta y de tus consultas de soporte.",destination:"inicio",entityKey:"welcome"});
  }
  res.json({ user: { ...user, isAdmin: adminEmails.includes(user.email.toLowerCase()) } });
});
export const logoutController = asyncHandler(async (req, res) => {
  await logout(req.cookies?.reniec_session);
  res.clearCookie("reniec_session", cookieOptions(0));
  res.status(204).end();
});
