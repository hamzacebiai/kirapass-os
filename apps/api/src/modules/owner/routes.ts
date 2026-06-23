import { Router } from "express";

import {
  activateOwnerController,
  archiveOwnerController,
  getOwnerController,
  listOwnersController,
  registerOwnerController,
  setPayoutIbanController,
  verifyOwnerController,
} from "./controller.js";

const router = Router();

router.get("/owners", listOwnersController);
router.post("/owners", registerOwnerController);
router.get("/owners/:id", getOwnerController);
router.post("/owners/:id/verify", verifyOwnerController);
router.post("/owners/:id/payout-iban", setPayoutIbanController);
router.post("/owners/:id/activate", activateOwnerController);
router.post("/owners/:id/archive", archiveOwnerController);

export default router;
