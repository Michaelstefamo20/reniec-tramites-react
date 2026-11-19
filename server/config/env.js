import "dotenv/config";

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.API_PORT || process.env.PORT || 4173),
  appBaseUrl: process.env.APP_BASE_URL || (process.env.NODE_ENV === "production"
    ? "https://reniec-tramites-react.vercel.app"
    : process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined),
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
  resendApiKey: process.env.RESEND_API_KEY,
  appsScriptMailUrl: process.env.APPS_SCRIPT_MAIL_URL,
  appsScriptMailSecret: process.env.APPS_SCRIPT_MAIL_SECRET,
  gmailOAuthClientId: process.env.GMAIL_OAUTH_CLIENT_ID,
  gmailOAuthClientSecret: process.env.GMAIL_OAUTH_CLIENT_SECRET,
  gmailOAuthRefreshToken: process.env.GMAIL_OAUTH_REFRESH_TOKEN,
  supportAdminEmails: process.env.SUPPORT_ADMIN_EMAILS || "",
  supportAdminEmails: process.env.SUPPORT_ADMIN_EMAILS || "",
  supportAdminEmails: process.env.SUPPORT_ADMIN_EMAILS,
};

export const isProduction = env.nodeEnv === "production";
export const gmailOAuthConfigured = Boolean(env.gmailOAuthClientId && env.gmailOAuthClientSecret && env.gmailOAuthRefreshToken && env.mailFrom);
export const appsScriptMailConfigured = Boolean(env.appsScriptMailUrl && env.appsScriptMailSecret && env.mailFrom);
export const emailProvider = gmailOAuthConfigured
  ? "gmail-api"
  : appsScriptMailConfigured
    ? "apps-script"
    : env.resendApiKey
      ? "resend"
      : !isProduction && env.smtpHost && env.smtpUser && env.smtpPass && env.mailFrom
        ? "smtp"
        : null;
export const missingEmailVariables = () => [
  !env.appBaseUrl && "APP_BASE_URL",
  !emailProvider && "GMAIL_OAUTH_CLIENT_ID/GMAIL_OAUTH_CLIENT_SECRET/GMAIL_OAUTH_REFRESH_TOKEN o Apps Script/Resend",
  !env.mailFrom && "MAIL_FROM",
].filter(Boolean);
