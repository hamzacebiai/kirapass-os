import { Router } from "express";

import { getModules } from "../modules/discovery.js";

/**
 * Central router aggregator (consumption layer).
 *
 * Mounts every plugin's router exposed by the discovery layer. Pure wiring:
 * consumes `getModules()` and mounts `plugin.router` for each entry. New
 * modules are added in `modules/registry.ts`.
 */
const router = Router();

for (const plugin of getModules()) {
  router.use(plugin.router);
}

export default router;
