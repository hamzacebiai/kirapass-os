export interface EnvCheck {
  ok: boolean;
  missing: string[];
  warnings: string[];
}

const REQUIRED = ['JWT_SECRET', 'DATABASE_URL'];

/**
 * Boot-time environment diagnostics. Never throws. Log-only (non-breaking):
 * reports missing required vars and weak/default secrets.
 */
export function validateEnv(env: NodeJS.ProcessEnv = process.env): EnvCheck {
  const missing: string[] = [];
  const warnings: string[] = [];
  try {
    for (const key of REQUIRED) {
      const v = env[key];
      if (!v || String(v).trim() === '') missing.push(key);
    }
    if (env.JWT_SECRET && /change-in-production|kirapass-change/i.test(String(env.JWT_SECRET))) {
      warnings.push('JWT_SECRET uses a default/dev value — rotate for production');
    }
  } catch {
    // never throw
  }
  return { ok: missing.length === 0, missing, warnings };
}
