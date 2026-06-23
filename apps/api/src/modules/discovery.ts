import { moduleRegistry } from "./registry.js";
import type { ModulePlugin } from "./plugin-contract.js";

/**
 * Module discovery layer (read-only abstraction over the static registry).
 *
 * Pure pass-through: returns `moduleRegistry` (a `readonly ModulePlugin[]`)
 * unchanged — no transformation, filtering, mutation, or scanning. The stable
 * seam the consumption layer depends on.
 */
export function getModules(): readonly ModulePlugin[] {
  return moduleRegistry;
}
