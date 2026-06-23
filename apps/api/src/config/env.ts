/**
 * Environment abstraction layer.
 *
 * The rest of the application must NOT read `process.env` directly.
 * All environment access is funnelled through this module so that:
 *   - defaults live in one place
 *   - values are parsed/validated once at boot
 *   - the config shape is strongly typed and easy to mock in tests
 */

export type NodeEnv = "development" | "test" | "production";

export interface Env {
  readonly nodeEnv: NodeEnv;
  readonly host: string;
  readonly port: number;
  readonly isProduction: boolean;
}

/** Read a raw string env var, falling back to a default. */
function readString(key: string, fallback: string): string {
  const value = process.env[key];
  return value === undefined || value.trim() === "" ? fallback : value;
}

/** Read and validate a numeric env var. */
function readNumber(key: string, fallback: number): number {
  const raw = process.env[key];
  if (raw === undefined || raw.trim() === "") return fallback;

  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) {
    throw new Error(`Invalid numeric environment variable ${key}="${raw}"`);
  }
  return parsed;
}

/** Read and validate the NODE_ENV value. */
function readNodeEnv(): NodeEnv {
  const value = readString("NODE_ENV", "development");
  if (value === "development" || value === "test" || value === "production") {
    return value;
  }
  throw new Error(`Invalid NODE_ENV="${value}"`);
}

/**
 * Parse the process environment into a typed, validated config object.
 * Called once during boot; the result is the single source of truth.
 */
export function loadEnv(): Env {
  const nodeEnv = readNodeEnv();

  return {
    nodeEnv,
    host: readString("HOST", "0.0.0.0"),
    port: readNumber("PORT", 3000),
    isProduction: nodeEnv === "production",
  };
}
