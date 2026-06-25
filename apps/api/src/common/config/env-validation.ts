export interface EnvCheck {
  ok: boolean;
  missing: string[];
  warnings: string[];
  hasWeakJwtSecret: boolean;
}

const REQUIRED = ['JWT_SECRET', 'DATABASE_URL'];
const MIN_JWT_SECRET_LENGTH = 32;
const DEFAULT_SECRET_PATTERN = /change-in-production|kirapass-change/i;

/**
 * Boot-time environment diagnostics. Never throws. Log-only (non-breaking):
 * reports missing required vars and weak/default secrets.
 */
export function validateEnv(env: NodeJS.ProcessEnv = process.env): EnvCheck {
  const missing: string[] = [];
  const warnings: string[] = [];
  let hasWeakJwtSecret = false;
  try {
    for (const key of REQUIRED) {
      const v = env[key];
      if (!v || String(v).trim() === '') missing.push(key);
    }
    const secret = env.JWT_SECRET ? String(env.JWT_SECRET) : '';
    if (
      secret &&
      (secret.length < MIN_JWT_SECRET_LENGTH ||
        DEFAULT_SECRET_PATTERN.test(secret))
    ) {
      hasWeakJwtSecret = true;
      warnings.push(
        'JWT_SECRET is weak (length < 32 or default/dev value) — rotate for production',
      );
    }
  } catch {
    // never throw
  }
  return { ok: missing.length === 0, missing, warnings, hasWeakJwtSecret };
}
