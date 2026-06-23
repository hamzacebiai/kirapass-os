// ⚠️ LEGACY PLACEHOLDER — pre-blueprint scaffold, frozen. Do not extend.
// To be replaced by Party:Owner per docs/DOMAIN_BLUEPRINT.md (roadmap order).
import type { Request, Response } from "express";

import { getLandlord, listLandlords } from "./service.js";

export function listLandlordsController(_req: Request, res: Response): void {
  res.json(listLandlords());
}

export function getLandlordController(req: Request, res: Response): void {
  const id = String(req.params.id);
  const landlord = getLandlord(id);

  if (!landlord) {
    res.status(404).json({ error: "Landlord Not Found", id });
    return;
  }

  res.json(landlord);
}
