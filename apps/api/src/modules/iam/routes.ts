import { Router } from "express";

import {
  activateAccountController,
  assignRoleController,
  closeAccountController,
  getAccountController,
  inviteAccountController,
  listAccountsController,
  suspendAccountController,
} from "./controller.js";

const router = Router();

router.get("/accounts", listAccountsController);
router.post("/accounts", inviteAccountController);
router.get("/accounts/:id", getAccountController);
router.post("/accounts/:id/activate", activateAccountController);
router.post("/accounts/:id/suspend", suspendAccountController);
router.post("/accounts/:id/close", closeAccountController);
router.post("/accounts/:id/role", assignRoleController);

export default router;
