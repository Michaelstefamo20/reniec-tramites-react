import pg from "pg";
import { seal } from "../utils/crypto.js";
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

async function migrateSensitiveFields() {
  const families=await pool.query("SELECT id,name,relationship FROM family_members WHERE name_cipher IS NULL OR relationship_cipher IS NULL");
  for(const row of families.rows){
    await pool.query("UPDATE family_members SET name_cipher=COALESCE(name_cipher,$1),relationship_cipher=COALESCE(relationship_cipher,$2),name='',relationship='' WHERE id=$3",[row.name?seal(row.name):seal(""),row.relationship?seal(row.relationship):seal(""),row.id]);
  }
  const inquiries=await pool.query("SELECT id,subject,message,staff_reply FROM support_inquiries WHERE subject_cipher IS NULL OR message_cipher IS NULL OR (staff_reply IS NOT NULL AND staff_reply_cipher IS NULL)");
  for(const row of inquiries.rows){
    await pool.query("UPDATE support_inquiries SET subject_cipher=COALESCE(subject_cipher,$1),message_cipher=COALESCE(message_cipher,$2),staff_reply_cipher=CASE WHEN staff_reply IS NULL THEN NULL ELSE COALESCE(staff_reply_cipher,$3) END,subject='',message='',staff_reply=NULL WHERE id=$4",[seal(row.subject||""),seal(row.message||""),row.staff_reply?seal(row.staff_reply):null,row.id]);
  }
  const notifications=await pool.query("SELECT id,title,message FROM user_notifications WHERE title_cipher IS NULL OR message_cipher IS NULL");
  for(const row of notifications.rows){
    await pool.query("UPDATE user_notifications SET title_cipher=COALESCE(title_cipher,$1),message_cipher=COALESCE(message_cipher,$2),title='',message='' WHERE id=$3",[seal(row.title||""),seal(row.message||""),row.id]);
  }
}

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
      CREATE TABLE IF NOT EXISTS support_inquiries (
        id BIGSERIAL PRIMARY KEY,
        public_id UUID NOT NULL UNIQUE,
        account_id BIGINT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
        subject TEXT NOT NULL,
        message TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','in_progress','resolved')),
        staff_reply TEXT,
        staff_email TEXT,
        subject_cipher TEXT,
        message_cipher TEXT,
        staff_reply_cipher TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        resolved_at TIMESTAMPTZ
      );
      CREATE INDEX IF NOT EXISTS support_inquiries_account_updated_idx ON support_inquiries(account_id,updated_at DESC);
      CREATE TABLE IF NOT EXISTS user_preferences (
        account_id BIGINT PRIMARY KEY REFERENCES accounts(id) ON DELETE CASCADE,
        shortcuts JSONB NOT NULL DEFAULT '["renew","duplicate","acts","family"]'::jsonb,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS family_members (
        id BIGSERIAL PRIMARY KEY,
        account_id BIGINT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
        name TEXT NOT NULL DEFAULT '',
        relationship TEXT NOT NULL DEFAULT '',
        name_cipher TEXT,
        relationship_cipher TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      ALTER TABLE family_members ADD COLUMN IF NOT EXISTS name_cipher TEXT;
      ALTER TABLE family_members ADD COLUMN IF NOT EXISTS relationship_cipher TEXT;
      ALTER TABLE support_inquiries ADD COLUMN IF NOT EXISTS subject_cipher TEXT;
      ALTER TABLE support_inquiries ADD COLUMN IF NOT EXISTS message_cipher TEXT;
      ALTER TABLE support_inquiries ADD COLUMN IF NOT EXISTS staff_reply_cipher TEXT;
      CREATE INDEX IF NOT EXISTS family_members_account_idx ON family_members(account_id,created_at);
      CREATE TABLE IF NOT EXISTS user_tutorials (
        account_id BIGINT PRIMARY KEY REFERENCES accounts(id) ON DELETE CASCADE,
        completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        outcome TEXT NOT NULL CHECK (outcome IN ('completed','skipped'))
      );
      CREATE TABLE IF NOT EXISTS user_notifications (
        id BIGSERIAL PRIMARY KEY,
        account_id BIGINT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
        kind TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        destination TEXT NOT NULL DEFAULT 'inicio',
        entity_key TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        read_at TIMESTAMPTZ,
        title_cipher TEXT,
        message_cipher TEXT
      );
      ALTER TABLE user_notifications ADD COLUMN IF NOT EXISTS title_cipher TEXT;
      ALTER TABLE user_notifications ADD COLUMN IF NOT EXISTS message_cipher TEXT;
      CREATE INDEX IF NOT EXISTS user_notifications_account_created_idx ON user_notifications(account_id,created_at DESC);
      CREATE UNIQUE INDEX IF NOT EXISTS user_notifications_entity_key_idx ON user_notifications(account_id,entity_key) WHERE entity_key IS NOT NULL;
    `);
    await migrateSensitiveFields();
    console.log("PostgreSQL connection ready.");
    return true;
  } catch (error) {
    console.error("PostgreSQL unavailable:", error.message);
    return false;
  }
}
