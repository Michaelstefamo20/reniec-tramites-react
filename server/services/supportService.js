import { randomUUID } from "node:crypto";
import { supportRepository } from "../repositories/supportRepository.js";
import { AuthError } from "./authService.js";

const statusLabels = { open: "Abierta", in_progress: "En atención", resolved: "Resuelta" };
const cleanText = (value,max) => String(value || "").replace(/[<>]/g,"").trim().slice(0,max);

export async function createInquiry(accountId,input={}) {
  const subject=cleanText(input.subject,120),message=cleanText(input.message,3000);
  if(subject.length<4||message.length<10)throw new AuthError(400,"Escribe un asunto y describe tu consulta (al menos 10 caracteres).");
  return supportRepository.create({publicId:randomUUID(),accountId,subject,message});
}

export async function listMyInquiries(accountId) {
  const inquiries=await supportRepository.listForUser(accountId);
  return inquiries.map(q=>({...q,status_label:statusLabels[q.status]||"Abierta",notification:q.status==="resolved"}));
}

export async function listAdminInquiries() {
  const inquiries=await supportRepository.listAll();
  return inquiries.map(q=>({...q,status_label:statusLabels[q.status]||"Abierta"}));
}

export async function updateInquiry(publicId,input={},staffEmail) {
  const status=["open","in_progress","resolved"].includes(input.status)?input.status:null;
  const reply=input.reply===undefined?null:cleanText(input.reply,3000);
  if(!status)throw new AuthError(400,"Selecciona un estado válido.");
  if(input.reply!==undefined&&reply.length<2)throw new AuthError(400,"La respuesta debe tener al menos 2 caracteres.");
  const updated=await supportRepository.update({publicId,status,reply,staffEmail});
  if(!updated)throw new AuthError(404,"No se encontró esa consulta.");
  return {...updated,status_label:statusLabels[updated.status],notification:updated.status==="resolved"};
}
