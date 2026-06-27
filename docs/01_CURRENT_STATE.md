# 01 — Current State (Reality Snapshot)
_As of 2026-06-25._

## Domains (implemented + verified)
Agency, User, Property, Unit, Tenant, Lease, RentSchedule, Payment.
Deferred (not started): Ledger, Expense, Maintenance, Document.

## Modules
- `modules/`: auth, users, health, property, unit, tenant, lease, rent-schedule,
  payment.
- `common/`: config (env-validation), prisma (tenant-prisma), audit, errors
  (global filter + envelope), metrics, observability (correlation, timing,
  request-logger, log-sanitizer), rate-limit, security (headers, diagnostics
  guard), production (lifecycle), request-context, tenant-context middleware.

## Migrations (8, applied, additive; DB in sync)
1. 20260623212742_add_refresh_tokens
2. 20260623223437_agency_tier_status_roles
3. 20260624102855_add_property
4. 20260624104643_add_unit
5. 20260624110141_add_lease
6. 20260624110929_add_tenant
7. 20260624125614_add_rent_schedule
8. 20260624181841_add_payment
Pending: none.

## APIs (base prefix `/api/v1`)
- Auth: POST /auth/register (public), POST /auth/login (public),
  GET /auth/me, GET /auth/admin/ping (SystemAdmin).
- Per domain (property, unit, tenant, lease, rent-schedule, payment):
  POST /<res> · GET /<res>?page&pageSize&includeArchived · GET /<res>/:id ·
  PATCH /<res>/:id · PATCH /<res>/:id/{archive|cancel|void}.
- Users: /users (list verified).
- Ops: /health, /health/live, /health/ready, /health/info (gated),
  /metrics (gated), /security (gated), /observability/{ping,boom,slow} (gated).
- Missing: POST /auth/refresh, POST /auth/logout (no revocation); no financial
  rollup/statement endpoints.

## Infrastructure
- Postgres 16 in Docker (`kirapass-postgres`, container restart unless-stopped,
  named volume `postgres_data`). docker-compose has Postgres ONLY.
- No API Dockerfile. No CI/CD. No automated tests. No ESLint config.
- Windows dev safety: `scripts/dev-safety.ps1` (port/orphan/Prisma-lock guards).

## Cross-cutting controls (verified)
- Multi-tenant isolation (middleware on 6 models + two-level ownership): PASS.
- Agency isolation (agencyId from context only): PASS — cross-agency probes 404.
- RBAC (server-owned matrix, role from JWT): PASS.
- Soft-delete filtering (default excludes ARCHIVED/CANCELLED/VOIDED): PASS.
- Pagination (default 50 / max 100): PASS.
- Diagnostics protection (prod-gated): PASS.

## Production-readiness findings (current)
- Build: PASS (`nest build` exit 0). Typecheck: PASS (`tsc --noEmit` exit 0).
  Boot: PASS (/health 200). Migrations: in sync.
- Launch blockers open: env not fail-fast + weak JWT secret; CORS wildcard;
  default Postgres password; no backup/restore; no Dockerfile; no token
  revocation.
- Audit: business-domain mutations NOT audited; audit sink is console-only.
- Financial: RentSchedule.status vs Payment unreconciled; overpayment/duplicate
  accepted; void/cancel not terminal.
- Indexes: agencyId indexed (except User); status/createdAt/dueDate/paidAt
  unindexed.
- Launch Readiness Score: 62/100. Domain-expansion: GO. Public launch: NO-GO.
