/**
 * Public surface of the configuration layer.
 *
 * Consumers import from `../config/index.js` rather than reaching into
 * individual files, keeping the config layer's internals swappable.
 */
export { APP, API_PREFIX } from "./constants.js";
export { loadEnv } from "./env.js";
export type { Env, NodeEnv } from "./env.js";
