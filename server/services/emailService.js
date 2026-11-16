import { randomBytes } from "node:crypto";
import { mailer } from "../config/mailer.js";
import { sendWithGmailApi } from "./gmailApiService.js";
import { emailProvider, env } from "../config/env.js";
import { authRepository } from "../repositories/authRepository.js";
import { hashToken } from "../utils/crypto.js";
import { appBaseUrl, requireValue } from "../utils/http.js";

function normalizeResendSender(sender) {
  const clean = sender.trim().replace(/^['"]|['"]$/g, "");
  const addressOnly = clean.match(/<([^<>]+)>$/)?.[1] || clean;
  if (!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(addressOnly)) {
    throw new Error("MAIL_FROM debe ser una dirección válida, por ejemplo Reniec <avisos@dominio-verificado.com>.");
  }
  return clean.includes("<") ? clean : addressOnly;
}

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
    from: emailProvider === "resend" ? normalizeResendSender(requireValue(env.mailFrom, "MAIL_FROM")) : requireValue(env.mailFrom, "MAIL_FROM"),
    to: account.email,
    subject,
    text: `${intro}\n\nAbre este enlace, válido por 30 minutos y de un solo uso:\n${url}\n\nSi no lo solicitaste, ignora este correo. No compartas este enlace.`,
    html: `<p>${intro}</p><p><a href="${url}">Continuar de forma segura</a></p><p>El enlace vence en 30 minutos y se usa una sola vez. No compartas este enlace.</p>`,
  };
  if (emailProvider === "gmail-api") {
    await sendWithGmailApi(message);
    return;
  }
  if (emailProvider === "resend") {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${env.resendApiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(message),
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) {
      const result = await response.json().catch(() => ({}));
      console.error("Resend delivery failed:", response.status, result.name || result.error || "unknown_error");
      const failure = new Error(response.status === 403 || response.status === 422
        ? "Resend rechazó el remitente. Verifica que MAIL_FROM use un dominio verificado en Resend."
        : "Resend no pudo aceptar el correo. Revisa la API key y el estado del servicio.");
      failure.code = "EMAIL_PROVIDER_DELIVERY_FAILED";
      throw failure;
    }
    return;
  }

  try {
    await mailer.sendMail(message);
  } catch (error) {
    console.error("SMTP delivery failed:", error.code || "UNKNOWN", error.command || "no-command", error.responseCode || "no-response-code");
    const failure = new Error("El servidor SMTP no pudo enviar el correo. Verifica SMTP_HOST, el remitente y las credenciales del servidor.");
    failure.code = "EMAIL_PROVIDER_DELIVERY_FAILED";
    throw failure;
  }
}
