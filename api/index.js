import app from "../server/app.js";
import { pool, initializeDatabase } from "../server/config/database.js";
import { emailProvider, env, isProduction } from "../server/config/env.js";

let initialization;
async function ensureReady() {
  if (!initialization) {
    initialization = (async () => {
      if (isProduction && (!env.dniEncryptionKey || !env.dniHashKey)) {
        throw new Error("DNI_ENCRYPTION_KEY and DNI_HASH_KEY must be configured in Vercel Environment Variables.");
      }
      const databaseReady = await initializeDatabase();
      app.locals.databaseConfigured = Boolean(env.databaseUrl);
      app.locals.emailConfigured = Boolean(emailProvider);
      app.locals.databaseReady = databaseReady;
      if (!databaseReady) throw new Error("PostgreSQL connection unavailable.");
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
    return res.end(JSON.stringify({ error: "No se pudo iniciar el servicio. Revisa las variables de entorno y la base de datos." }));
  }
}

export const config = { maxDuration: 30 };
