import { Router } from "express";

import {
  activateTenantController,
  archiveTenantController,
  getTenantController,
  listTenantsController,
  markTenantPastController,
  registerTenantController,
  verifyTenantController,
} from "./controller.js";

const router = Router();

router.get("/tenants", listTenantsController);
router.post("/tenants", registerTenantController);
router.get("/tenants/:id", getTenantController);
router.post("/tenants/:id/verify", verifyTenantController);
router.post("/tenants/:id/activate", activateTenantController);
router.post("/tenants/:id/past", markTenantPastController);
router.post("/tenants/:id/archive", archiveTenantController);

export default router;
