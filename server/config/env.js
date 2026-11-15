import "dotenv/config";

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.API_PORT || process.env.PORT || 4173),
  appBaseUrl: process.env.APP_BASE_URL,
  databaseUrl: process.env.DATABASE_URL,
  databaseSsl: process.env.DATABASE_SSL !== "false",
  dniEncryptionKey: process.env.DNI_ENCRYPTION_KEY,
  dniHashKey: process.env.DNI_HASH_KEY,
  smtpHost: process.env.SMTP_HOST,
  smtpPort: Number(process.env.SMTP_PORT || 587),
  smtpSecure: process.env.SMTP_SECURE === "true",
  smtpUser: process.env.SMTP_USER,
  smtpPass: process.env.SMTP_PASS,
  mailFrom: process.env.MAIL_FROM,
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  anthropicModel: process.env.ANTHROPIC_MODEL || "claude-3-5-haiku-latest",
};
export const isProduction = env.nodeEnv === "production";
export const emailProvider = env.smtpHost && env.smtpUser && env.smtpPass && env.mailFrom ? "smtp" : null;
export const missingEmailVariables = () => [
  !env.smtpHost && "SMTP_HOST",
  !env.smtpUser && "SMTP_USER",
  !env.smtpPass && "SMTP_PASS",
  !env.mailFrom && "MAIL_FROM",
].filter(Boolean);
