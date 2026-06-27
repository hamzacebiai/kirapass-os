# 03 — Architectural Decisions

| # | Decision | Reason | Date | Status |
|---|---|---|---|---|
| D1 | NestJS + Prisma + Postgres 16 as runtime stack (pivot from Express) | DI, guards, modular isolation, typed ORM | 2026-06 | Accepted |
| D2 | No Shared Kernel, no repository pattern, no CQRS | Avoid premature abstraction; stability > cleverness | 2026-06 | Accepted (pinned) |
| D3 | `agencyId` derived ONLY from JWT context, never from input | Core tenant-isolation guarantee | 2026-06 | Accepted (immutable) |
| D4 | Tenant isolation via Prisma `$use` middleware + two-level ownership | Central enforcement + defense in depth | 2026-06 | Accepted (Prisma 6 migration pending) |
| D5 | Server-owned RBAC permission matrix; role from JWT only | Permissions never client-controlled | 2026-06 | Accepted |
| D6 | Soft-delete via status; default lists exclude archived/cancelled/voided | Non-destructive, reversible, additive | 2026-06 | Accepted |
| D7 | Pagination default 50 / max 100 (H2) | Bound result sets, backward-compatible | 2026-06-24 | Accepted |
| D8 | Diagnostics endpoints prod-gated via DiagnosticsGuard (H4) | Limit prod exposure of metrics/info | 2026-06-24 | Accepted |
| D9 | Payment hangs off RentSchedule; manual recording, no schedule mutation | Preserve existing RentSchedule behavior; zero coupling | 2026-06-24 | Accepted |
| D10 | Ledger is the recommended next domain, but DEFERRED | Resolves RentSchedule↔Payment reconciliation; held by CTO | 2026-06-25 | Deferred |
| D11 | Foundation = GO for domain expansion; NO-GO for public launch | Isolation/auth proven; launch infra missing | 2026-06-25 | Accepted |
| D12 | Audit must become persisted + cover all domains (target state) | Current console-only, domain-uncovered | 2026-06-25 | Proposed |
| D13 | Gate 5 Audit Persistence: global AuditInterceptor + AuditLog table | Her kritik mutasyon DB'de izlenebilir | 2026-06-27 | Accepted (commit d39123d, migration 20260625205821) |
| D14 | Gate 6 Token Revocation: opaque refresh token (SHA-256) + DB rotation; no JWT refresh secret | Revocable; logout/rotation kanıtı DB'de | 2026-06-27 | Accepted (commit e4a3c58, migration 20260625215231) |
| D15 | AI Engineering Constitution: docs/constitution/ (3 katman) kalıcı | Mega-prompt yerine tek satır bootstrap; rol ayrımı | 2026-06-27 | Accepted |
