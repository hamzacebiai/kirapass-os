// Keys whose values must never appear in logs (case-insensitive).
const SENSITIVE_KEYS = new Set<string>([
  'password',
  'passwordhash',
  'token',
  'accesstoken',
  'refreshtoken',
  'authorization',
  'secret',
  'jwt',
  'apikey',
]);

const REDACTED = '[REDACTED]';

/**
 * Deep-redacts sensitive keys from any object/array for safe logging.
 * Never throws — returns input as-is on any error.
 */
export function sanitize<T>(input: T): T {
  try {
    if (Array.isArray(input)) {
      return input.map((v) => sanitize(v)) as unknown as T;
    }
    if (input && typeof input === 'object') {
      const out: Record<string, any> = {};
      for (const [k, v] of Object.entries(input as Record<string, any>)) {
        out[k] = SENSITIVE_KEYS.has(k.toLowerCase()) ? REDACTED : sanitize(v);
      }
      return out as unknown as T;
    }
    return input;
  } catch {
    return input;
  }
}
