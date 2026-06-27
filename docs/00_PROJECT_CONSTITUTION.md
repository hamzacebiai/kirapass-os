# 00 — Project Constitution (Immutable)

> Stable rules. Changes here require explicit CTO approval. If a live human
> instruction conflicts, the human wins and this file is updated to match.

## Product Vision
KiraPass OS — a multi-tenant B2B PropTech SaaS: a property-management operating
system for real-estate agencies. Each agency is an isolated tenant managing its
own properties, units, tenants (renters), leases, rent schedules, and payments.

## Architecture Constitution
- Stack: NestJS 10 (CommonJS) · Prisma 5.22 · PostgreSQL 16 (Docker).
- One API app (`apps/api`); database package (`packages/database`).
- Feature isolation: one module per domain (`modules/<domain>/`), cross-cutting
  concerns in `common/*`. NO Shared Kernel. NO repository pattern. NO CQRS.
- Additive-only evolution. Never break a working system. Never modify
  `docker-compose.yml`, drop DBs, delete volumes, or reset migrations without
  explicit confirmation.
- Stability > speed. Working MVP over perfect architecture. No overengineering.

## Layer Strategy
Controller (HTTP + guards + DTO validation) → Service (business rules +
ownership) → Prisma (tenant-aware data access). Controllers hold no business
logic; services never read identity from the request body; data access goes
through `TenantPrismaService`.

## B2B-First Strategy
The customer is the agency, not the end renter. All data, permissions, billing,
and isolation are scoped to the agency tenant. Features are prioritized by
platform-wide ROI and gate-readiness (foundation before domain, financial truth
before financial features).

## Tenant Isolation Requirements (non-negotiable)
- `agencyId` is derived ONLY from the authenticated JWT context. NEVER accepted
  from DTO/body/query.
- All tenant models are scoped by Prisma middleware on filter-based reads.
- Single-record mutations MUST call an ownership-checked `getById` first.
- Child entities enforce two-level ownership (entity.agencyId AND parent.agencyId).
- SYSTEM_ADMIN may bypass for global views; all other roles are tenant-bound.

## Audit Requirements
- Every state-changing action SHOULD be auditable with actor (userId), tenant
  (agencyId), correlationId, action, resource, and timestamp.
- Audit logging is fail-safe: it must NEVER throw or block a request.
- Sensitive values (passwords, tokens, secrets) MUST be redacted before logging.
- Target state: audit events are persisted and queryable per tenant (current
  implementation logs to console only — see TECH_DEBT).

## Financial Correctness Requirements
- Money is `Decimal(12,2)`; amounts must be positive and ≤2 decimals.
- There must be a single authoritative source of truth for "is rent paid?"
  (target: a reconciliation layer; not yet implemented).
- Payments are tenant- and ownership-validated; cross-agency references are
  rejected. Over/duplicate-payment rules and terminal voiding are governed by
  the future reconciliation domain, not by ad-hoc logic in completed domains.
