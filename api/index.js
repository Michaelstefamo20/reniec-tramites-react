import app from "../server/app.js";
import { pool, initializeDatabase } from "../server/config/database.js";
import { emailProvider, env, isProduction } from "../server/config/env.js";

let initialization;
function missingConfiguration() {
  return [
    !env.databaseUrl && "DATABASE_URL",
    isProduction && !env.dniEncryptionKey && "DNI_ENCRYPTION_KEY",
    isProduction && !env.dniHashKey && "DNI_HASH_KEY",
    !emailProvider && "correo SMTP (SMTP_HOST, SMTP_USER, SMTP_PASS, MAIL_FROM)",
  ].filter(Boolean);
}

async function ensureReady() {
  if (!initialization) {
    initialization = (async () => {
      const missing = missingConfiguration();
      if (missing.includes("DATABASE_URL")) throw new Error("Falta DATABASE_URL en Vercel Environment Variables.");
      if (isProduction && (missing.includes("DNI_ENCRYPTION_KEY") || missing.includes("DNI_HASH_KEY"))) {
        throw new Error("Faltan DNI_ENCRYPTION_KEY y/o DNI_HASH_KEY en Vercel Environment Variables.");
      }
      const databaseReady = await initializeDatabase();
      app.locals.databaseConfigured = Boolean(env.databaseUrl);
      app.locals.emailConfigured = Boolean(emailProvider);
      app.locals.databaseReady = databaseReady;
      if (!databaseReady) throw new Error("PostgreSQL no conecta. Comprueba DATABASE_URL, TLS y allowlist de red del proveedor PostgreSQL.");
    })();
  }
  return initialization;
}

export default async function handler(req, res) {
  try {
    await ensureReady();
    return app(req, res);
  } catch (error) {
    console.error("Vercel API initialization failed:", error.message);
    res.statusCode = 503;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    const safeMessage = error.message.includes("DATABASE_URL") || error.message.includes("PostgreSQL") || error.message.includes("DNI_ENCRYPTION_KEY")
      ? error.message
      : "No se pudo iniciar el servicio. Revisa Variables de entorno y Logs de funciones en Vercel.";
    return res.end(JSON.stringify({ error: safeMessage }));
  }
}

export const config = { maxDuration: 30 };
