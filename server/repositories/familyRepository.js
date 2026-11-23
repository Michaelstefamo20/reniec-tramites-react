import { pool } from "../config/database.js";
import { seal, unseal } from "../utils/crypto.js";

export const familyRepository = {
  async list(accountId) {
    const { rows } = await pool.query("SELECT id,name_cipher,relationship_cipher,created_at FROM family_members WHERE account_id=$1 ORDER BY created_at,id", [accountId]);
    return rows.map(row=>({...row,name:unseal(row.name_cipher),relationship:unseal(row.relationship_cipher),name_cipher:undefined,relationship_cipher:undefined}));
  },
  async add(accountId, name, relationship) {
    const { rows } = await pool.query("INSERT INTO family_members(account_id,name,relationship,name_cipher,relationship_cipher) VALUES($1,'','',$2,$3) RETURNING id,name_cipher,relationship_cipher,created_at", [accountId,seal(name),seal(relationship)]);
    const row=rows[0];return{...row,name:unseal(row.name_cipher),relationship:unseal(row.relationship_cipher),name_cipher:undefined,relationship_cipher:undefined};
  },
  async remove(accountId, id) {
    const { rowCount } = await pool.query("DELETE FROM family_members WHERE account_id=$1 AND id=$2", [accountId,id]);
    return rowCount > 0;
  },
};
