import { env } from "../config/env.js";

export async function sendWithAppsScript({ to, subject, text, html }) {
  const endpoint = env.appsScriptMailUrl;
  const secret = env.appsScriptMailSecret;
  if (!endpoint || !secret) {
    const error = new Error("Configura APPS_SCRIPT_MAIL_URL y APPS_SCRIPT_MAIL_SECRET en Vercel.");
    error.code = "APPS_SCRIPT_MAIL_NOT_CONFIGURED";
    throw error;
  }
  let response;
  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret, to, subject, text, html }),
      signal: AbortSignal.timeout(15_000),
      redirect: "follow",
    });
  } catch (cause) {
    console.error("Apps Script mail gateway request failed:", cause.name || "network_error");
    const error = new Error("No se pudo conectar con el servicio de correo de Google Apps Script.");
    error.code = "APPS_SCRIPT_MAIL_UNAVAILABLE";
    throw error;
  }
  const result = await response.json().catch(() => ({}));
  if (!response.ok || result.ok !== true) {
    console.error("Apps Script mail gateway rejected request:", response.status, result.code || "unknown_error");
    const details = typeof result.code === "string" ? result.code : "respuesta inválida";
    const error = new Error(`Google Apps Script rechazó el envío (${details}). Verifica el secreto compartido, la implementación /exec y la cuota de MailApp.`);
    error.code = "APPS_SCRIPT_MAIL_FAILED";
    throw error;
  }
}
