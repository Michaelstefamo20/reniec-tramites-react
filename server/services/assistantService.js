import { env } from "../config/env.js";

const MAX_MESSAGES = 8;
const MAX_MESSAGE_CHARS = 1200;
const MAX_RESPONSE_TOKENS = 350;

const SYSTEM_PROMPT = `Eres el asistente virtual de un prototipo universitario de orientación para trámites de identidad en Perú. Responde en español sencillo, amable y conciso. Ayuda con navegación, requisitos generales, fotos, pasos del prototipo, pagos de demostración y citas. No afirmes representar oficialmente a RENIEC ni consultar bases oficiales. Nunca pidas ni repitas DNI, contraseñas, códigos, datos bancarios o información personal. No hagas cambios de diseño ni acciones en la cuenta: solo da orientación. Si preguntan por validar identidad o estado real de trámites, explica que esta versión no tiene integración oficial.`;

export async function askAssistant({ message, history = [], region }) {
  if (typeof message !== "string" || !message.trim()) {
    const error = new Error("Escribe una consulta para el asistente.");
    error.status = 400;
    throw error;
  }
  if (message.length > MAX_MESSAGE_CHARS) {
    const error = new Error(`La consulta debe tener menos de ${MAX_MESSAGE_CHARS} caracteres.`);
    error.status = 400;
    throw error;
  }
  if (!env.anthropicApiKey) {
    const error = new Error("El asistente Claude no está configurado todavía.");
    error.status = 503;
    throw error;
  }
  const recent = Array.isArray(history) ? history.slice(-MAX_MESSAGES) : [];
  const messages = recent
    .filter(item => item && ["user", "assistant"].includes(item.role) && typeof item.content === "string")
    .map(item => ({ role: item.role, content: item.content.slice(0, MAX_MESSAGE_CHARS) }));
  messages.push({ role: "user", content: `${message.trim()}${region ? `\n(La persona indicó que está en ${String(region).slice(0, 80)}.)` : ""}` });
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": env.anthropicApiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({ model: env.anthropicModel, max_tokens: MAX_RESPONSE_TOKENS, system: SYSTEM_PROMPT, messages }),
    signal: AbortSignal.timeout(20000),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    console.error("Claude API error", response.status, result.error?.type || "unknown");
    const error = new Error("Claude no pudo responder ahora. Intenta de nuevo o consulta la ayuda rápida.");
    error.status = 502;
    throw error;
  }
  const answer = result.content?.filter(part => part.type === "text").map(part => part.text).join("\n").trim();
  if (!answer) {
    const error = new Error("Claude no devolvió una respuesta. Intenta de nuevo.");
    error.status = 502;
    throw error;
  }
  return answer;
}
