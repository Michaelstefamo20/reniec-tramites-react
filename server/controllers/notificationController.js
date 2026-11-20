import { notificationRepository } from "../repositories/notificationRepository.js";

export async function listNotificationsController(req,res,next){
  try{const notifications=await notificationRepository.list(req.accountId);res.json({notifications,unreadCount:notifications.filter(item=>!item.read_at).length})}catch(error){next(error)}
}
export async function markNotificationReadController(req,res,next){
  try{const id=Number(req.params.id);if(!Number.isSafeInteger(id)||id<1)return res.status(400).json({error:"Identificador de notificación inválido."});const notification=await notificationRepository.markRead(req.accountId,id);if(!notification)return res.status(404).json({error:"No se encontró esa notificación."});res.json({notification})}catch(error){next(error)}
}
export async function markAllNotificationsReadController(req,res,next){
  try{const updated=await notificationRepository.markAllRead(req.accountId);res.json({updated})}catch(error){next(error)}
}
