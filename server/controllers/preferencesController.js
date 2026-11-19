import { preferencesRepository } from "../repositories/preferencesRepository.js";

const ALLOWED = new Set(["renew", "duplicate", "acts", "family", "support", "appointments", "first", "address", "rectify", "appointment", "offices"]);

export async function getPreferencesController(req, res, next) {
  try {
    res.json({ shortcuts: await preferencesRepository.getShortcuts(req.accountId) });
  } catch (error) { next(error); }
}

export async function setPreferencesController(req, res, next) {
  try {
    const input = req.body?.shortcuts;
    if (!Array.isArray(input) || input.length > ALLOWED.size || input.some(id => typeof id !== "string" || !ALLOWED.has(id))) {
      return res.status(400).json({ error: "La lista de accesos no es válida." });
    }
    const shortcuts = [...new Set(input)];
    res.json({ shortcuts: await preferencesRepository.setShortcuts(req.accountId, shortcuts) });
  } catch (error) { next(error); }
}
