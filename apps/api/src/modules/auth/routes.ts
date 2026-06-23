import { Router } from "express";

import { loginController } from "./controller.js";

/**
 * Auth routes — wiring only.
 *
 * Mounted by the aggregator under the API prefix, so `/auth/login` resolves
 * to `POST /api/auth/login`.
 */
const router = Router();

router.post("/auth/login", loginController);

export default router;
