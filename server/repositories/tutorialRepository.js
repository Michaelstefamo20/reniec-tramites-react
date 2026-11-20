import { pool } from "../config/database.js";

export const tutorialRepository = {
  async get(accountId) {
    const { rows } = await pool.query("SELECT completed_at,outcome FROM user_tutorials WHERE account_id=$1", [accountId]);
    return rows[0] || null;
  },
  async complete(accountId,outcome) {
    const { rows } = await pool.query(
      "INSERT INTO user_tutorials(account_id,completed_at,outcome) VALUES($1,NOW(),$2) ON CONFLICT(account_id) DO UPDATE SET completed_at=NOW(),outcome=EXCLUDED.outcome RETURNING completed_at,outcome",
      [accountId,outcome],
    );
    return rows[0];
  },
};
