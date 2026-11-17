import { initializeDatabase, pool } from "./config/database.js";
import { mailer } from "./config/mailer.js";
import { emailProvider, env, isProduction, missingEmailVariables } from "./config/env.js";
import app from "./app.js";

const databaseReady = await initializeDatabase();
app.locals.databaseReady = databaseReady;
app.locals.databaseConfigured = Boolean(env.databaseUrl);
app.locals.emailConfigured = Boolean(emailProvider);
app.locals.emailProvider = emailProvider || "none";
app.locals.emailMissingVariables = missingEmailVariables();
if (isProduction && (!env.dniEncryptionKey || !env.dniHashKey)) {
  throw new Error("Set DNI_ENCRYPTION_KEY and DNI_HASH_KEY before production startup");
}

const server = app.listen(env.port, () => console.log(`Application server listening on port ${env.port}`));
server.on("error", (error) => {
  if (error.code === "EADDRINUSE") console.error(`El puerto ${env.port} ya está ocupado. Cierra la otra instancia con Ctrl+C o cambia PORT en .env.`);
  else console.error("No se pudo iniciar la API:", error.message);
  process.exitCode = 1;
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => server.close(async () => { await pool?.end(); process.exit(0); }));
}
