import { env } from "../config/env.js";

let cachedToken;
let tokenExpiresAt = 0;

async function getAccessToken() {
  if (cachedToken && Date.now() < tokenExpiresAt - 60_000) return cachedToken;
  const body = new URLSearchParams({
    client_id: env.gmailOAuthClientId,
    client_secret: env.gmailOAuthClientSecret,
    refresh_token: env.gmailOAuthRefreshToken,
    grant_type: "refresh_token",
  });
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    signal: AbortSignal.timeout(12_000),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || !result.access_token) {
    console.error("Gmail OAuth refresh failed:", response.status, result.error || "unknown_error");
    const error = new Error("Gmail OAuth no pudo autorizar el envío. Revisa las credenciales OAuth del servidor.");
    error.code = "GMAIL_OAUTH_FAILED";
    throw error;
  }
  cachedToken = result.access_token;
  tokenExpiresAt = Date.now() + Number(result.expires_in || 3600) * 1000;
  return cachedToken;
}

export async function sendWithGmailApi({ from, to, subject, text, html }) {
  const fromHeader = from.includes("<") ? from : `<${from}>`;
  const mime = [
    `From: ${fromHeader}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    "MIME-Version: 1.0",
    "Content-Type: multipart/alternative; boundary=reniec-boundary",
    "",
    "--reniec-boundary",
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
    "",
    Buffer.from(text, "utf8").toString("base64"),
    "--reniec-boundary",
    "Content-Type: text/html; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
    "",
    Buffer.from(html, "utf8").toString("base64"),
    "--reniec-boundary--",
    "",
  ].join("\r\n");
  const response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: { Authorization: `Bearer ${await getAccessToken()}`, "Content-Type": "application/json" },
    body: JSON.stringify({ raw: Buffer.from(mime, "utf8").toString("base64url") }),
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) {
    const result = await response.json().catch(() => ({}));
    console.error("Gmail API send failed:", response.status, result.error?.status || "unknown_error");
    const error = new Error("Gmail API no aceptó el mensaje. Revisa el consentimiento OAuth y el permiso gmail.send.");
    error.code = "GMAIL_API_SEND_FAILED";
    throw error;
  }
}
