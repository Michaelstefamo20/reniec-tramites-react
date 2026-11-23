import { pool } from "../config/database.js";
import { seal, unseal } from "../utils/crypto.js";

export const supportRepository = {
  async create({ publicId, accountId, subject, message }) {
    const { rows } = await pool.query(
      "INSERT INTO support_inquiries(public_id,account_id,subject,message,subject_cipher,message_cipher,status,created_at,updated_at) VALUES($1,$2,'','',$3,$4,'open',NOW(),NOW()) RETURNING public_id,subject_cipher,message_cipher,status,created_at,updated_at",
      [publicId,accountId,seal(subject),seal(message)],
    );
    const row=rows[0];return{...row,subject:unseal(row.subject_cipher),message:unseal(row.message_cipher),subject_cipher:undefined,message_cipher:undefined};
  },
  async listForUser(accountId) {
    const { rows } = await pool.query(
      "SELECT public_id,subject_cipher,message_cipher,status,staff_reply_cipher,created_at,updated_at,resolved_at FROM support_inquiries WHERE account_id=$1 ORDER BY updated_at DESC LIMIT 100",
      [accountId],
    );
    return rows.map(row=>({...row,subject:unseal(row.subject_cipher),message:unseal(row.message_cipher),staff_reply:row.staff_reply_cipher?unseal(row.staff_reply_cipher):null,subject_cipher:undefined,message_cipher:undefined,staff_reply_cipher:undefined}));
  },
  async listAll() {
    const { rows } = await pool.query(
      "SELECT q.public_id,q.subject_cipher,q.message_cipher,q.status,q.staff_reply_cipher,q.created_at,q.updated_at,q.resolved_at,a.email FROM support_inquiries q JOIN accounts a ON a.id=q.account_id ORDER BY CASE q.status WHEN 'open' THEN 0 WHEN 'in_progress' THEN 1 ELSE 2 END,q.updated_at DESC LIMIT 300",
    );
    return rows.map(row=>({...row,subject:unseal(row.subject_cipher),message:unseal(row.message_cipher),staff_reply:row.staff_reply_cipher?unseal(row.staff_reply_cipher):null,subject_cipher:undefined,message_cipher:undefined,staff_reply_cipher:undefined}));
  },
  async update({ publicId,status,reply,staffEmail }) {
    const { rows } = await pool.query(
      "UPDATE support_inquiries SET status=$1,staff_reply=NULL,staff_reply_cipher=CASE WHEN $2::text IS NULL THEN staff_reply_cipher ELSE $2 END,staff_email=$3,updated_at=NOW(),resolved_at=CASE WHEN $1='resolved' THEN NOW() ELSE NULL END WHERE public_id=$4 RETURNING public_id,account_id,subject_cipher,status,staff_reply_cipher,updated_at,resolved_at",
      [status,reply===null?null:seal(reply),staffEmail,publicId],
    );
    const row=rows[0];return row?{...row,subject:unseal(row.subject_cipher),staff_reply:row.staff_reply_cipher?unseal(row.staff_reply_cipher):null,subject_cipher:undefined,staff_reply_cipher:undefined}:null;
  },
  async getAccountEmail(accountId) {
    const { rows } = await pool.query("SELECT email FROM accounts WHERE id=$1",[accountId]);
    return rows[0]?.email || null;
  },
};
