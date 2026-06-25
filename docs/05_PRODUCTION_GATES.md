# 05 — Production Launch Gates
_Public-launch checklist. Status as of 2026-06-25. All gates additive._

| Gate | Requirement | Current | Status | Smallest fix |
|---|---|---|---|---|
| JWT | Strong secret; fail-fast if missing/default in prod | secret len 29, default pattern; validateEnv log-only | FAIL | exit on missing/default secret in prod |
| CORS | Origin allowlist, no wildcard | `enableCors()` wildcard | FAIL | env-driven origin allowlist |
| Docker | Deployable API image | no Dockerfile; compose has Postgres only | FAIL | multi-stage Dockerfile for dist/main.js |
| Backup | Scheduled backup + tested restore | none (volume only) | FAIL | pg_dump cron + restore runbook |
| Audit Persistence | Domain mutations audited + persisted | console-only, domains uncovered | FAIL | global audit interceptor + AuditLog table |
| Token Revocation | Refresh/logout invalidates tokens | 7d token, RefreshToken table unused | FAIL | refresh/logout via existing table, shorter TTL |

## Supporting (non-gating but recommended before scale)
- Strong Postgres password (remove default).
- Composite indexes (agencyId,status) / (agencyId,createdAt).
- Prisma $disconnect on shutdown; AuthService via DI Prisma.
- CI + automated tests + ESLint.

## Gate Decision
Public Production Launch: **NO-GO** until JWT, CORS, Docker, Backup gates pass
(Audit Persistence + Token Revocation strongly recommended in the same sprint).
Domain Expansion: **GO** (independent of these gates).
