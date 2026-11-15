import { randomBytes } from "node:crypto";
import { mailer } from "../config/mailer.js";
import { emailProvider, env } from "../config/env.js";
import { authRepository } from "../repositories/authRepository.js";
import { hashToken } from "../utils/crypto.js";
import { appBaseUrl, requireValue } from "../utils/http.js";

export async function sendActionEmail(account, purpose) {
  if (!emailProvider) throw new Error("EMAIL_PROVIDER_NOT_CONFIGURED");
  const token = randomBytes(32).toString("base64url");
  await authRepository.createToken({ accountId: account.id, tokenHash: hashToken(token), purpose, expiresAt: Date.now() + 30 * 60 * 1000 });
  const url = new URL("/", appBaseUrl());
  url.searchParams.set("token", token);
  if (purpose === "setup-password") url.searchParams.set("setup", "1");
  const activation = purpose === "setup-password";
  const subject = activation ? "Activa tu cuenta y crea tu contraseña" : purpose === "verify-email" ? "Confirma tu correo" : "Restablece tu contraseña";
  const intro = activation ? "Tu registro está casi listo. Abre el enlace para crear tu contraseña y activar la cuenta." : purpose === "verify-email" ? "Confirma que este correo te pertenece." : "Solicitaste cambiar la contraseña de tu cuenta.";
  const message = {
    from: requireValue(env.mailFrom, "MAIL_FROM"),
    to: account.email,
    subject,
    text: `${intro}\n\nAbre este enlace, válido por 30 minutos y de un solo uso:\n${url}\n\nSi no lo solicitaste, ignora este correo. No compartas este enlace.`,
    html: `<p>${intro}</p><p><a href="${url}">Continuar de forma segura</a></p><p>El enlace vence en 30 minutos y se usa una sola vez. No compartas este enlace.</p>`,
  };
  try {
    await mailer.sendMail(message);
  } catch (error) {
    console.error("SMTP delivery failed:", error.code || "UNKNOWN", error.command || "no-command", error.responseCode || "no-response-code");
    const failure = new Error("Gmail SMTP rechazó o no pudo entregar el mensaje. Revisa SMTP_PASS, MAIL_FROM y los permisos SMTP del remitente.");
    failure.code = "SMTP_DELIVERY_FAILED";
    throw failure;
  }
}
