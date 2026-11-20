import { familyRepository } from "../repositories/familyRepository.js";
import { notifyAccount } from "../services/notificationService.js";

export async function listFamilyController(req,res,next) {
  try { res.json({ members: await familyRepository.list(req.accountId) }); }
  catch(error) { next(error); }
}

export async function addFamilyController(req,res,next) {
  try {
    const name=typeof req.body?.name==="string"?req.body.name.replace(/[<>]/g,"").trim().replace(/\s+/g," "):"";
    const relationship=typeof req.body?.relationship==="string"?req.body.relationship.replace(/[<>]/g,"").trim().replace(/\s+/g," "):"";
    if(name.length<2||name.length>100||relationship.length<2||relationship.length>50) return res.status(400).json({error:"Ingresa un nombre y un vínculo familiar válidos."});
    if((await familyRepository.list(req.accountId)).length>=20) return res.status(400).json({error:"Puedes añadir hasta 20 familiares."});
    const member=await familyRepository.add(req.accountId,name,relationship);
    await notifyAccount(req.accountId,{kind:"family_added",title:"Familiar añadido",message:`Añadiste a ${name} (${relationship}) a tu lista privada.`,destination:"familia",entityKey:`family-added:${member.id}`});
    res.status(201).json({member});
  } catch(error) { next(error); }
}

export async function removeFamilyController(req,res,next) {
  try {
    const id=Number(req.params.id);
    if(!Number.isSafeInteger(id)||id<1)return res.status(400).json({error:"Identificador de familiar inválido."});
    const members=await familyRepository.list(req.accountId);
    const member=members.find(item=>Number(item.id)===id);
    if(!member)return res.status(404).json({error:"No se encontró ese familiar en tu cuenta."});
    if(!await familyRepository.remove(req.accountId,id))return res.status(404).json({error:"No se encontró ese familiar en tu cuenta."});
    await notifyAccount(req.accountId,{kind:"family_removed",title:"Familiar quitado",message:`Quitaste a ${member.name} de tu lista privada.`,destination:"familia",entityKey:`family-removed:${id}:${Date.now()}`});
    res.status(204).end();
  } catch(error) { next(error); }
}
