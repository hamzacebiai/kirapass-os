// ⚠️ LEGACY PLACEHOLDER — pre-blueprint scaffold, frozen. Do not extend.
// To be replaced by Party:Owner per docs/DOMAIN_BLUEPRINT.md (roadmap order).
import { Router } from "express";

import { getLandlordController, listLandlordsController } from "./controller.js";

const router = Router();

router.get("/landlords", listLandlordsController);
router.get("/landlords/:id", getLandlordController);

export default router;
