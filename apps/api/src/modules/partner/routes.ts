import { Router } from "express";

import {
  activatePartnerController,
  archivePartnerController,
  assignStewardshipController,
  getPartnerController,
  listPartnersController,
  onboardPartnerController,
  revokeStewardshipController,
  suspendPartnerController,
} from "./controller.js";

const router = Router();

router.get("/partners", listPartnersController);
router.post("/partners", onboardPartnerController);
router.get("/partners/:id", getPartnerController);
router.post("/partners/:id/activate", activatePartnerController);
router.post("/partners/:id/suspend", suspendPartnerController);
router.post("/partners/:id/archive", archivePartnerController);
router.post("/partners/:id/owners", assignStewardshipController);
router.delete("/partners/:id/owners/:ownerId", revokeStewardshipController);

export default router;
