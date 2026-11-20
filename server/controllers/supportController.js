import { env } from "../config/env.js";
import { supportRepository } from "../repositories/supportRepository.js";
import { AuthError, getSessionUser } from "../services/authService.js";
import { createInquiry, listAdminInquiries, listMyInquiries, updateInquiry } from "../services/supportService.js";
import { notifyAccount } from "../services/notificationService.js";

const asyncHandler=handler=>(req,res,next)=>Promise.resolve(handler(req,res,next)).catch(next);
const safeAdminEmails=()=>String(env.supportAdminEmails||"").split(",").map(value=>value.trim().toLowerCase()).filter(Boolean);
const isAdmin=req=>safeAdminEmails().includes(String(req.userEmail||"").toLowerCase());

export const attachCurrentUser=asyncHandler(async(req,res,next)=>{
  req.userEmail=await supportRepository.getAccountEmail(req.accountId);
  if(!req.userEmail)return res.status(401).json({error:"No existe la cuenta de la sesión."});
  next();
});

export const currentUserController=asyncHandler(async(req,res)=>{
  const user=await getSessionUser(req.cookies?.reniec_session);
  if(!user)return res.status(401).json({error:"La sesión venció."});
  res.json({user:{...user,isAdmin:safeAdminEmails().includes(user.email.toLowerCase())}});
});
export const myInquiriesController=asyncHandler(async(req,res)=>res.json({inquiries:await listMyInquiries(req.accountId)}));
export const createInquiryController=asyncHandler(async(req,res)=>{
  try{res.status(201).json({inquiry:await createInquiry(req.accountId,req.body)});}
  catch(error){if(error instanceof AuthError)return res.status(error.status).json({error:error.message});throw error;}
});
export const adminInquiriesController=asyncHandler(async(req,res)=>{
  if(!isAdmin(req))return res.status(403).json({error:"Esta cuenta no tiene permisos de atención."});
  res.json({inquiries:await listAdminInquiries()});
});
export const updateInquiryController=asyncHandler(async(req,res)=>{
  if(!isAdmin(req))return res.status(403).json({error:"Esta cuenta no tiene permisos de atención."});
  try{const inquiry=await updateInquiry(req.params.id,req.body,req.userEmail);if(typeof req.body?.reply==="string"&&req.body.reply.trim())await notifyAccount(inquiry.account_id,{kind:"support_reply",title:"Respuesta a tu consulta",message:`El equipo respondió a «${inquiry.subject}». Abre tus consultas para revisar el mensaje.`,destination:"soporte",entityKey:`support-reply:${inquiry.public_id}:${inquiry.updated_at}`});res.json({inquiry});}
  catch(error){if(error instanceof AuthError)return res.status(error.status).json({error:error.message});throw error;}
});
