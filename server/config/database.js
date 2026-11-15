import pg from "pg";
import { env } from "./env.js";

const { Pool } = pg;
export const pool = env.databaseUrl
  ? new Pool({
      connectionString: env.databaseUrl,
      ssl: env.databaseSsl ? { rejectUnauthorized: true } : false,
      max: 10,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
    })
  : null;

export async function initializeDatabase() {
  if (!pool) {
    console.warn("DATABASE_URL missing: authentication endpoints will return 503 until configured.");
    return false;
  }
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS accounts (
        id BIGSERIAL PRIMARY KEY,
        name_cipher TEXT NOT NULL,
        dni_cipher TEXT NOT NULL,
        dni_hash TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT,
        verified_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL
      );
      CREATE TABLE IF NOT EXISTS tokens (
        token_hash TEXT PRIMARY KEY,
        account_id BIGINT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
        purpose TEXT NOT NULL,
        expires_at BIGINT NOT NULL,
        created_at BIGINT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS sessions (
        token_hash TEXT PRIMARY KEY,
        account_id BIGINT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
        expires_at BIGINT NOT NULL
      );
      ALTER TABLE accounts ALTER COLUMN password_hash DROP NOT NULL;
    `);
    console.log("PostgreSQL connection ready.");
    return true;
  } catch (error) {
    console.error("PostgreSQL unavailable:", error.message);
    return false;
  }
}
