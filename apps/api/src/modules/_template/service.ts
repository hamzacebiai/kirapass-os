import type { ExampleResult } from "./types.js";

/**
 * TEMPLATE — service layer (pure business logic).
 *
 * Rules:
 *   - NO express. Never import Request/Response or touch req/res.
 *   - Return plain data objects only.
 *   - This is the only layer allowed to contain business logic.
 *   - May depend on config and (later) a repository layer — never on
 *     controllers or routes.
 */
export function getExample(): ExampleResult {
  return { message: "replace this with real service logic" };
}
