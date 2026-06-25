# 04 — Technical Debt (from audits)

## Critical
- TD-C1 Business-domain mutations are NOT audited; no global audit interceptor
  (only auth/rbac/users log). Financial actions untracked.
- TD-C2 Audit sink is console-only (ephemeral, not persisted/queryable).
- TD-C3 Financial source of truth split: RentSchedule.status (manual) vs Payment
  records (append-only) — unreconciled. Overpayment + duplicate accepted.
- TD-C4 Launch security config: env not fail-fast, weak JWT_SECRET, default
  Postgres password, CORS wildcard. (Tracked operationally in 02/05.)
- TD-C5 No backup/restore capability.

## Medium
- TD-M1 Soft-delete not terminal: VOIDED/CANCELLED/ARCHIVED records editable /
  reversible via PATCH status.
- TD-M2 Single update/delete not auto-scoped by middleware; isolation depends on
  service `getById` discipline (no safety net for future code).
- TD-M3 No token revocation (7d access token; RefreshToken table unused).
- TD-M4 Missing indexes: status, createdAt/dueDate/paidAt (sort/filter keys).
- TD-M5 No Dockerfile, no CI, no automated tests, no ESLint.
- TD-M6 In-memory rate-limit + audit dedup are process-local (no horizontal
  scaling correctness).

## Low
- TD-L1 Raw `new PrismaClient()` in AuthService (outside DI, never disconnected).
- TD-L2 TenantPrismaService has no onModuleDestroy/$disconnect.
- TD-L3 agencyId without FK on Unit/Lease/RentSchedule/Payment.
- TD-L4 tenantId denormalized 3-deep (Lease/RentSchedule/Payment), no
  consistency check (payer may differ from lease tenant).
- TD-L5 Decimal money serializes as string.
- TD-L6 User.agencyId unindexed.
- TD-L7 RBAC cosmetic: STAFF Payment write vs RentSchedule read asymmetry;
  `*.delete` permission gates soft-delete.
- TD-L8 Prisma `$use` deprecated (Prisma 6 removal).
