import { createPlugin } from "./create-plugin.js";
import authRoutes from "./auth/routes.js";
import healthRoutes from "./health/routes.js";
import iamRoutes from "./iam/routes.js";
import ownerRoutes from "./owner/routes.js";
import partnerRoutes from "./partner/routes.js";
import verificationRoutes from "./verification/routes.js";
import landlordRoutes from "./landlord/routes.js";
import tenantRoutes from "./tenant/routes.js";
import type { ModulePlugin } from "./plugin-contract.js";

/**
 * Static module registry — STATIC SOURCE OF TRUTH.
 *
 * Each entry is constructed via `createPlugin()` (the only supported plugin
 * constructor) wrapping a module's default Router with its identity metadata.
 * Registration stays fully static and type-safe — no fs scanning, no dynamic
 * import. Runtime mounting is unchanged: the aggregator mounts `plugin.router`
 * in the same order as before.
 */
export const moduleRegistry: readonly ModulePlugin[] = [
  createPlugin({ name: "health", version: "1.0.0", router: healthRoutes }),
  createPlugin({ name: "auth", version: "1.0.0", router: authRoutes }),
  createPlugin({ name: "iam", version: "1.0.0", router: iamRoutes }),
  createPlugin({ name: "owner", version: "1.0.0", router: ownerRoutes }),
  createPlugin({ name: "tenant", version: "1.0.0", router: tenantRoutes }),
  createPlugin({ name: "partner", version: "1.0.0", router: partnerRoutes }),
  createPlugin({
    name: "verification",
    version: "1.0.0",
    router: verificationRoutes,
  }),
  // LEGACY PLACEHOLDER — pre-blueprint scaffold, frozen and excluded from
  // implementation decisions. To be replaced by Party:Owner in roadmap order
  // (breaking change BC-1, pending approval). See docs/RECONCILIATION_PLAN.md.
  createPlugin({ name: "landlord", version: "1.0.0", router: landlordRoutes }),
];

/** Alias for the registry's plugin-array shape. */
export type PluggableRegistry = readonly ModulePlugin[];
