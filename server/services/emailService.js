import { randomBytes } from "node:crypto";
import { mailer } from "../config/mailer.js";
import { sendWithGmailApi } from "./gmailApiService.js";
import { sendWithAppsScript } from "./appsScriptMailService.js";
import { emailProvider, env } from "../config/env.js";
import { authRepository } from "../repositories/authRepository.js";
import { hashToken } from "../utils/crypto.js";
import { appBaseUrl, requireValue } from "../utils/http.js";

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" })[character]);
}

function normalizeResendSender(sender) {
  const clean = sender.trim().replace(/^['"]|['"]$/g, "");
  const addressOnly = clean.match(/<([^<>]+)>$/)?.[1] || clean;
  if (!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(addressOnly)) {
    throw new Error("MAIL_FROM debe ser una dirección válida, por ejemplo Reniec <avisos@dominio-verificado.com>.");
  }
  return clean.includes("<") ? clean : addressOnly;
}

export async function sendActionEmail(account, purpose, suppliedToken) {
  if (!emailProvider) throw new Error("EMAIL_PROVIDER_NOT_CONFIGURED");
  const token = suppliedToken || randomBytes(32).toString("base64url");
  await authRepository.createToken({ accountId: account.id, tokenHash: hashToken(token), purpose, expiresAt: Date.now() + 30 * 60 * 1000 });
  const url = new URL("/", appBaseUrl());
  url.searchParams.set("token", token);
  url.searchParams.set("action", purpose === "reset-password" ? "reset-password" : purpose === "setup-password" ? "setup-password" : purpose === "change-email" ? "change-email" : "verify-email");
  const activation = purpose === "setup-password";
  const emailChange=purpose==="change-email";
  const subject = activation ? "Activa tu cuenta y crea tu contraseña" : purpose === "verify-email" ? "Confirma tu correo" : emailChange ? "Confirma tu nuevo correo" : "Restablece tu contraseña";
  const intro = activation ? "Tu registro está casi listo. Abre el enlace para crear tu contraseña y activar tu cuenta." : purpose === "verify-email" ? "Confirma que este correo te pertenece." : emailChange ? "Solicitaste cambiar el correo de tu cuenta. Abre este enlace para confirmar la nueva dirección." : "Solicitaste cambiar la contraseña de tu cuenta.";
  const safeIntro=escapeHtml(intro);
  const actionLabel=activation?"Crear mi contraseña":purpose==="verify-email"?"Confirmar mi correo":emailChange?"Confirmar nuevo correo":"Restablecer contraseña";
  const safeAction=escapeHtml(actionLabel);
  const text=`${intro}\n\nContinúa desde el sitio de Trámites+ (prototipo independiente):\n${url}\n\nEste enlace vence en 30 minutos y solo se usa una vez. Si no solicitaste este mensaje, ignóralo. Nunca compartas este enlace.`;
  const html=`<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;color:#29232a"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f3f4f6;padding:28px 12px"><tr><td align="center"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border:1px solid #e1dce0;border-radius:16px;overflow:hidden"><tr><td style="background:#7a1b3f;padding:22px 28px;color:#ffffff"><table role="presentation" cellspacing="0" cellpadding="0"><tr><td style="width:42px;height:42px;border-radius:10px;background:#ffffff;color:#7a1b3f;text-align:center;vertical-align:middle;font-size:20px;font-weight:bold">R</td><td style="padding-left:12px"><div style="font-size:17px;font-weight:bold;letter-spacing:.2px">Mi DNI en línea</div><div style="margin-top:4px;color:#f6dce5;font-size:12px">Trámites+ · prototipo independiente</div></td></tr></table></td></tr><tr><td style="height:5px;background:#f1b022;font-size:0;line-height:0">&nbsp;</td></tr><tr><td style="padding:30px 28px 18px"><div style="display:inline-block;padding:6px 10px;border-radius:20px;background:#f8edf1;color:#7a1b3f;font-size:11px;font-weight:bold;letter-spacing:.7px">SEGURIDAD DE TU CUENTA</div><h1 style="margin:16px 0 10px;color:#5a1230;font-size:24px;line-height:1.25">${safeAction}</h1><p style="margin:0;color:#55515a;font-size:15px;line-height:1.65">${safeIntro}</p><table role="presentation" cellspacing="0" cellpadding="0" style="margin:24px 0"><tr><td align="center" bgcolor="#7a1b3f" style="border-radius:9px"><a href="${url.toString()}" style="display:inline-block;padding:14px 24px;border:1px solid #7a1b3f;border-radius:9px;color:#ffffff;font-size:15px;font-weight:bold;text-decoration:none">${safeAction}</a></td></tr></table><p style="margin:0;color:#716b73;font-size:13px;line-height:1.6">El enlace vence en <strong>30 minutos</strong> y solo puede utilizarse una vez. Si el botón no abre, copia este enlace en tu navegador:</p><p style="margin:10px 0 0;word-break:break-all;font-size:12px;line-height:1.5"><a href="${url.toString()}" style="color:#7a1b3f">${escapeHtml(url.toString())}</a></p></td></tr><tr><td style="padding:0 28px"><div style="height:1px;background:#ece8eb"></div></td></tr><tr><td style="padding:18px 28px 25px"><p style="margin:0 0 8px;color:#5a1230;font-size:13px;font-weight:bold">Cuida tu cuenta</p><p style="margin:0;color:#716b73;font-size:12px;line-height:1.6">Nunca compartas este enlace ni tu contraseña. Este sitio es un prototipo independiente y no representa un canal oficial de RENIEC. Si no solicitaste este correo, puedes ignorarlo.</p></td></tr></table><p style="margin:14px 0 0;color:#77717a;font-size:11px;text-align:center">Mensaje automático de Mi DNI en línea · Trámites+</p></td></tr></table></body></html>`;
  const message = {
    from: emailProvider === "resend" ? normalizeResendSender(requireValue(env.mailFrom, "MAIL_FROM")) : requireValue(env.mailFrom, "MAIL_FROM"),
    to: account.email,
    subject,
    text,
    html,
  };
  if (emailProvider === "apps-script") {
    await sendWithAppsScript(message);
    return;
  }
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
