import { pool } from "../config/database.js";

export const supportRepository = {
  async create({ publicId, accountId, subject, message }) {
    const { rows } = await pool.query(
      "INSERT INTO support_inquiries(public_id,account_id,subject,message,status,created_at,updated_at) VALUES($1,$2,$3,$4,'open',NOW(),NOW()) RETURNING public_id,subject,message,status,created_at,updated_at",
      [publicId,accountId,subject,message],
    );
    return rows[0];
  },
  async listForUser(accountId) {
    const { rows } = await pool.query(
      "SELECT public_id,subject,message,status,staff_reply,created_at,updated_at,resolved_at FROM support_inquiries WHERE account_id=$1 ORDER BY updated_at DESC LIMIT 100",
      [accountId],
    );
    return rows;
  },
  async listAll() {
    const { rows } = await pool.query(
      "SELECT q.public_id,q.subject,q.message,q.status,q.staff_reply,q.created_at,q.updated_at,q.resolved_at,a.email FROM support_inquiries q JOIN accounts a ON a.id=q.account_id ORDER BY CASE q.status WHEN 'open' THEN 0 WHEN 'in_progress' THEN 1 ELSE 2 END,q.updated_at DESC LIMIT 300",
    );
    return rows;
  },
  async update({ publicId,status,reply,staffEmail }) {
    const { rows } = await pool.query(
      "UPDATE support_inquiries SET status=$1,staff_reply=COALESCE($2,staff_reply),staff_email=$3,updated_at=NOW(),resolved_at=CASE WHEN $1='resolved' THEN NOW() ELSE NULL END WHERE public_id=$4 RETURNING public_id,account_id,subject,status,staff_reply,updated_at,resolved_at",
      [status,reply,staffEmail,publicId],
    );
    return rows[0] || null;
  },
  async getAccountEmail(accountId) {
    const { rows } = await pool.query("SELECT email FROM accounts WHERE id=$1",[accountId]);
    return rows[0]?.email || null;
  },
};
