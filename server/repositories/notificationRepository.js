import { pool } from "../config/database.js";

export const notificationRepository={
  async create({accountId,kind,title,message,destination="inicio",entityKey=null}){
    const {rows}=await pool.query("INSERT INTO user_notifications(account_id,kind,title,message,destination,entity_key) VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT(account_id,entity_key) WHERE entity_key IS NOT NULL DO NOTHING RETURNING id,kind,title,message,destination,created_at,read_at",[accountId,kind,title,message,destination,entityKey]);
    return rows[0]||null;
  },
  async list(accountId){
    const {rows}=await pool.query("SELECT id,kind,title,message,destination,created_at,read_at FROM user_notifications WHERE account_id=$1 ORDER BY created_at DESC,id DESC LIMIT 50",[accountId]);
    return rows;
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
