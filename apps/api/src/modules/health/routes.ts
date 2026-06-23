import { Router } from "express";

import { healthController } from "./controller.js";

const router = Router();

router.get("/health", healthController);

export default router;
