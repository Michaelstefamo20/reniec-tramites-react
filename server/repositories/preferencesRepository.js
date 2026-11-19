import { pool } from "../config/database.js";

const DEFAULT_SHORTCUTS = ["renew", "duplicate", "acts", "family"];

export const preferencesRepository = {
  async getShortcuts(accountId) {
    const { rows } = await pool.query("SELECT shortcuts FROM user_preferences WHERE account_id=$1", [accountId]);
    return rows[0]?.shortcuts || DEFAULT_SHORTCUTS;
  },
  async setShortcuts(accountId, shortcuts) {
    const { rows } = await pool.query(
      "INSERT INTO user_preferences(account_id,shortcuts,updated_at) VALUES($1,$2::jsonb,NOW()) ON CONFLICT(account_id) DO UPDATE SET shortcuts=EXCLUDED.shortcuts,updated_at=NOW() RETURNING shortcuts",
      [accountId, JSON.stringify(shortcuts)],
    );
    return rows[0].shortcuts;
  },
};
