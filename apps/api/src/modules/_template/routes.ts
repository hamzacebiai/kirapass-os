import { Router } from "express";

import { exampleController } from "./controller.js";

/**
 * TEMPLATE — routes layer (express wiring only).
 *
 * Rules:
 *   - Map HTTP method + path to a controller. Nothing else.
 *   - NO business logic, NO inline handlers with real work.
 *   - Export the router as default.
 */
const router = Router();

router.get("/example", exampleController);

export default router;
