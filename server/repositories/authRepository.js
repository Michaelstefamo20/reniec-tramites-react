import { pool } from "../config/database.js";

export const authRepository = {
  async createPendingAccount({ nameCipher, dniCipher, dniHash, email }) {
    const { rows } = await pool.query(
      "INSERT INTO accounts(name_cipher,dni_cipher,dni_hash,email,password_hash,created_at) VALUES($1,$2,$3,$4,NULL,NOW()) RETURNING id,email",
      [nameCipher, dniCipher, dniHash, email],
    );
    return rows[0];
  },
  async deleteUnverifiedAccount(accountId) {
    await pool.query("DELETE FROM accounts WHERE id=$1 AND verified_at IS NULL", [accountId]);
  },
  async findPendingAccountByIdentity(dniHash, email) {
    const { rows } = await pool.query(
      "SELECT id,email FROM accounts WHERE dni_hash=$1 AND email=$2 AND password_hash IS NULL AND verified_at IS NULL",
      [dniHash, email],
    );
    return rows[0];
  },
  async findActivatedAccountByIdentity(dniHash, email) {
    const { rows } = await pool.query(
      "SELECT id FROM accounts WHERE dni_hash=$1 OR email=$2 LIMIT 1",
      [dniHash, email],
    );
    return rows[0];
  },
  async findActivationToken(client, tokenHash, now) {
    const { rows } = await client.query(
      "SELECT t.account_id,a.email FROM tokens t JOIN accounts a ON a.id=t.account_id WHERE t.token_hash=$1 AND t.purpose='setup-password' AND t.expires_at>$2 AND a.password_hash IS NULL AND a.verified_at IS NULL FOR UPDATE OF t,a",
      [tokenHash, now],
    );
    return rows[0];
  },
  async activateAccount(client, accountId, passwordHash) {
    await client.query("UPDATE accounts SET password_hash=$1,verified_at=NOW() WHERE id=$2", [passwordHash, accountId]);
  },
  async consumeToken(client, tokenHash) {
    await client.query("DELETE FROM tokens WHERE token_hash=$1", [tokenHash]);
  },
  async findVerifiedAccountByEmail(email) {
    const { rows } = await pool.query("SELECT id,name_cipher,email,password_hash,verified_at FROM accounts WHERE email=$1", [email]);
    return rows[0];
  },
  async findAccountForReset(email) {
    const { rows } = await pool.query("SELECT id,email FROM accounts WHERE email=$1 AND verified_at IS NOT NULL AND password_hash IS NOT NULL", [email]);
    return rows[0];
  },
  async createToken({ accountId, tokenHash, purpose, expiresAt }) {
    await pool.query("DELETE FROM tokens WHERE account_id=$1 AND purpose=$2", [accountId, purpose]);
    await pool.query("INSERT INTO tokens(token_hash,account_id,purpose,expires_at,created_at) VALUES($1,$2,$3,$4,$5)", [tokenHash, accountId, purpose, expiresAt, Date.now()]);
  },
  async findResetToken(client, tokenHash, now) {
    const { rows } = await client.query("SELECT account_id FROM tokens WHERE token_hash=$1 AND purpose='reset-password' AND expires_at>$2 FOR UPDATE", [tokenHash, now]);
    return rows[0];
  },
  async updatePassword(client, accountId, passwordHash) {
    await client.query("UPDATE accounts SET password_hash=$1 WHERE id=$2", [passwordHash, accountId]);
  },
  async clearRecoveryTokens(client, accountId) {
    await client.query("DELETE FROM tokens WHERE account_id=$1 AND purpose IN ('reset-password','setup-password')", [accountId]);
  },
  async clearSessions(client, accountId) {
    await client.query("DELETE FROM sessions WHERE account_id=$1", [accountId]);
  },
  async findSession(tokenHash, now) {
    const { rows } = await pool.query("SELECT account_id FROM sessions WHERE token_hash=$1 AND expires_at>$2", [tokenHash, now]);
    return rows[0];
  },
  async findUser(accountId) {
    const { rows } = await pool.query("SELECT name_cipher,email FROM accounts WHERE id=$1", [accountId]);
    return rows[0];
  },
  async findAccountIdByEmail(email) {
    const { rows } = await pool.query("SELECT id FROM accounts WHERE email=$1", [email]);
    return rows[0]?.id || null;
  },
  async deleteSession(tokenHash) {
    await pool.query("DELETE FROM sessions WHERE token_hash=$1", [tokenHash]);
  },
  async createSession(tokenHash, accountId, expiresAt) {
    await pool.query("DELETE FROM sessions WHERE expires_at<=$1", [Date.now()]);
    await pool.query("INSERT INTO sessions(token_hash,account_id,expires_at) VALUES($1,$2,$3)", [tokenHash, accountId, expiresAt]);
  },
  async verifyEmailToken(client, tokenHash, now) {
    const { rows } = await client.query("SELECT account_id FROM tokens WHERE token_hash=$1 AND purpose='verify-email' AND expires_at>$2 FOR UPDATE", [tokenHash, now]);
    return rows[0];
  },
  async markEmailVerified(client, accountId) {
    await client.query("UPDATE accounts SET verified_at=NOW() WHERE id=$1", [accountId]);
  },
};
