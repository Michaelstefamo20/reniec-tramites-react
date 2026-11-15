import { env, isProduction } from "../config/env.js";

export const cookieOptions = (maxAge) => ({ httpOnly: true, secure: isProduction, sameSite: "strict", path: "/", maxAge });
export const publicUser = (row, unseal) => ({ name: unseal(row.name_cipher), email: row.email });
export const requireValue = (value, name) => {
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
};
export const appBaseUrl = () => requireValue(env.appBaseUrl, "APP_BASE_URL");
