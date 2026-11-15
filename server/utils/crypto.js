import { randomBytes, createHash, createHmac, createCipheriv, createDecipheriv, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { env } from "../config/env.js";

const scrypt = promisify(scryptCallback);

export const hashToken = (token) => createHash("sha256").update(token).digest("hex");
export const dniDigest = (dni) => createHmac("sha256", requiredKey(env.dniHashKey, "DNI_HASH_KEY")).update(dni).digest("hex");

export function seal(text) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), encrypted].map((part) => part.toString("base64url")).join(".");
}

export function unseal(value) {
  const [iv, tag, ciphertext] = value.split(".").map((part) => Buffer.from(part, "base64url"));
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
}

export async function passwordHash(password) {
  const salt = randomBytes(16);
  const derived = await scrypt(password, salt, 64, { N: 16384, r: 8, p: 1 });
  return `scrypt$16384$${salt.toString("base64url")}$${Buffer.from(derived).toString("base64url")}`;
}

export async function verifyPassword(password, encoded) {
  try {
    const [algorithm, cost, saltText, hashText] = encoded.split("$");
    if (algorithm !== "scrypt") return false;
    const expected = Buffer.from(hashText, "base64url");
    const actual = Buffer.from(await scrypt(password, Buffer.from(saltText, "base64url"), expected.length, { N: Number(cost), r: 8, p: 1 }));
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}

function encryptionKey() {
  const key = Buffer.from(requiredKey(env.dniEncryptionKey, "DNI_ENCRYPTION_KEY"), "base64");
  if (key.length !== 32) throw new Error("DNI_ENCRYPTION_KEY must be base64 for 32 random bytes");
  return key;
}
function requiredKey(value, name) {
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}
