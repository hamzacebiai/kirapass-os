import type { Router } from "express";

/**
 * Known plugin identifiers (manual union — NOT auto-generated).
 * Extend this union when adding a module.
 */
export type PluginName =
  | "health"
  | "auth"
  | "iam"
  | "owner"
  | "tenant"
  | "partner"
  | "verification"
  | "landlord";

/**
 * Plugin contract — the runtime shape every registry entry conforms to.
 * Constructed exclusively via `createPlugin()`.
 */
export interface ModulePlugin {
  /** Unique, stable module identifier. */
  name: PluginName;
  /** The module's Express router (mount target). */
  router: Router;
  /** Semantic version of the module. */
  version: string;
}

/**
 * Forward-looking signature for a future discovery/resolver engine.
 * `getModules()` already satisfies this shape.
 */
export type ModuleResolver = () => readonly ModulePlugin[];
