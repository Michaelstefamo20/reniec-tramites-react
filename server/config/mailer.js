import nodemailer from "nodemailer";
import { appsScriptMailConfigured, emailProvider, env, gmailOAuthConfigured } from "./env.js";

export const mailer = emailProvider === "smtp"
  ? nodemailer.createTransport({
      host: env.smtpHost,
      port: env.smtpPort,
      secure: env.smtpSecure,
      ...(env.smtpUser && env.smtpPass ? { auth: { user: env.smtpUser, pass: env.smtpPass } } : {}),
    })
  : null;

export function emailConfigurationError() {
  if (appsScriptMailConfigured) return "Google Apps Script rechazó el envío. Revisa la URL publicada, el secreto compartido y la autorización de MailApp.";
  if (gmailOAuthConfigured) return "Gmail API OAuth está configurado, pero no pudo enviar. Revisa el consentimiento OAuth, el remitente autorizado y el permiso gmail.send.";
  if (env.resendApiKey) return "Resend está configurado pero no puede enviar. Revisa API key, remitente verificado y Logs de Functions.";
  if (process.env.NODE_ENV === "production") return "En Vercel Production configura Gmail OAuth (GMAIL_OAUTH_CLIENT_ID, GMAIL_OAUTH_CLIENT_SECRET y GMAIL_OAUTH_REFRESH_TOKEN) o RESEND_API_KEY.";
  if (env.smtpHost) {
    const missing = [!env.smtpUser && "SMTP_USER", !env.smtpPass && "SMTP_PASS", !env.mailFrom && "MAIL_FROM"].filter(Boolean);
    if (missing.length) return `Faltan ${missing.join(", ")} en .env. Para Gmail, SMTP_PASS debe ser una contraseña de aplicación.`;
    return "SMTP está configurado, pero no se pudo enviar. Verifica el acceso SMTP y el remitente.";
  }
  return "El envío no está configurado en este despliegue. En Vercel > Project Settings > Environment Variables, completa SMTP_HOST, SMTP_USER, SMTP_PASS y MAIL_FROM para Production y haz un redeploy.";
}
