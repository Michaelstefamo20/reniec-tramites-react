import { tutorialRepository } from "../repositories/tutorialRepository.js";

export async function getTutorialController(req,res,next) {
  try { res.json({ tutorial: await tutorialRepository.get(req.accountId) }); }
  catch(error) { next(error); }
}

export async function completeTutorialController(req,res,next) {
  try {
    const outcome=req.body?.outcome;
    if(!["completed","skipped"].includes(outcome)) return res.status(400).json({error:"El estado del tutorial no es válido."});
    res.json({tutorial:await tutorialRepository.complete(req.accountId,outcome)});
  } catch(error) { next(error); }
}
