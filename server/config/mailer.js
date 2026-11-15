import nodemailer from "nodemailer";
import { emailProvider, env } from "./env.js";

export const mailer = emailProvider === "smtp"
  ? nodemailer.createTransport({
      host: env.smtpHost,
      port: env.smtpPort,
      secure: env.smtpSecure,
      ...(env.smtpUser && env.smtpPass ? { auth: { user: env.smtpUser, pass: env.smtpPass } } : {}),
    })
  : null;

export function emailConfigurationError() {
  if (env.smtpHost) {
    const missing = [!env.smtpUser && "SMTP_USER", !env.smtpPass && "SMTP_PASS", !env.mailFrom && "MAIL_FROM"].filter(Boolean);
    if (missing.length) return `Faltan ${missing.join(", ")} en .env. Para Gmail, SMTP_PASS debe ser una contraseña de aplicación.`;
    return "SMTP está configurado, pero no se pudo enviar. Verifica el acceso SMTP y el remitente.";
  }
  return "El envío no está configurado en este despliegue. En Vercel > Project Settings > Environment Variables, completa SMTP_HOST, SMTP_USER, SMTP_PASS y MAIL_FROM para Production y haz un redeploy.";
}
