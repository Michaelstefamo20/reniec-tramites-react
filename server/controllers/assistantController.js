import rateLimit from "express-rate-limit";
import { env } from "../config/env.js";
import { askAssistant } from "../services/assistantService.js";

export const assistantRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 20,
  keyGenerator: (req) => req.ip,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Llegaste al límite de consultas del asistente por ahora. Inténtalo más tarde." },
});

export async function assistantController(req, res) {
  if (!env.anthropicApiKey) {
    return res.status(503).json({ error: "Claude no está configurado. Añade ANTHROPIC_API_KEY en las variables de entorno de Vercel." });
  }
  try {
    const answer = await askAssistant(req.body || {});
    res.json({ answer });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ error: error.message });
    console.error("Assistant request failed", error.name || "Error");
    res.status(502).json({ error: "Claude no pudo responder ahora. Intenta de nuevo o consulta la ayuda rápida." });
  }
}
