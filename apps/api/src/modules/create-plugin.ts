import type { ModulePlugin } from "./plugin-contract.js";

/**
 * Plugin factory — the ONLY supported way to construct a `ModulePlugin`.
 *
 * Pure helper: no side effects on its input (it copies), no logic. Returns a
 * frozen, immutable plugin so metadata cannot be mutated after registration.
 */
export function createPlugin(plugin: ModulePlugin): ModulePlugin {
  return Object.freeze({ ...plugin });
}
