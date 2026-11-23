import { pool } from "../config/database.js";
import { seal, unseal } from "../utils/crypto.js";

export const notificationRepository={
  async create({accountId,kind,title,message,destination="inicio",entityKey=null}){
    const {rows}=await pool.query("INSERT INTO user_notifications(account_id,kind,title,message,title_cipher,message_cipher,destination,entity_key) VALUES($1,$2,'','',$3,$4,$5,$6) ON CONFLICT(account_id,entity_key) WHERE entity_key IS NOT NULL DO NOTHING RETURNING id,kind,title_cipher,message_cipher,destination,created_at,read_at",[accountId,kind,seal(title),seal(message),destination,entityKey]);
    const row=rows[0];return row?{...row,title:unseal(row.title_cipher),message:unseal(row.message_cipher),title_cipher:undefined,message_cipher:undefined}:null;
  },
  async list(accountId){
    const {rows}=await pool.query("SELECT id,kind,title_cipher,message_cipher,destination,created_at,read_at FROM user_notifications WHERE account_id=$1 ORDER BY created_at DESC,id DESC LIMIT 50",[accountId]);
    return rows.map(row=>({...row,title:unseal(row.title_cipher),message:unseal(row.message_cipher),title_cipher:undefined,message_cipher:undefined}));
  },
  async markRead(accountId,id){
    const {rows}=await pool.query("UPDATE user_notifications SET read_at=COALESCE(read_at,NOW()) WHERE account_id=$1 AND id=$2 RETURNING id,read_at",[accountId,id]);
    return rows[0]||null;
  },
  async markAllRead(accountId){
    const {rowCount}=await pool.query("UPDATE user_notifications SET read_at=NOW() WHERE account_id=$1 AND read_at IS NULL",[accountId]);
    return rowCount;
  },
};
