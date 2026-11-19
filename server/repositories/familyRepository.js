import { pool } from "../config/database.js";

export const familyRepository = {
  async list(accountId) {
    const { rows } = await pool.query("SELECT id,name,relationship,created_at FROM family_members WHERE account_id=$1 ORDER BY created_at,id", [accountId]);
    return rows;
  },
  async add(accountId, name, relationship) {
    const { rows } = await pool.query("INSERT INTO family_members(account_id,name,relationship) VALUES($1,$2,$3) RETURNING id,name,relationship,created_at", [accountId,name,relationship]);
    return rows[0];
  },
  async remove(accountId, id) {
    const { rowCount } = await pool.query("DELETE FROM family_members WHERE account_id=$1 AND id=$2", [accountId,id]);
    return rowCount > 0;
  },
};
