# 02 — Active Sprint: P0-1 Production Hardening
_Opened 2026-06-25. Status: PLANNED (not started). Additive-only._

## Objectives
1. Fail-fast env validation in production + reject default-pattern JWT_SECRET;
   set a strong secret.
2. Env-driven CORS allowlist (replace wildcard).
3. Strong Postgres password via env (remove default).
4. Deployable API Dockerfile (multi-stage, runs dist/main.js).
5. Backup/restore: scheduled pg_dump + documented restore runbook (ops).
6. Token revocation: refresh/logout using existing RefreshToken table, or
   document-and-accept shorter TTL.

## Business Value
Converts a correct-but-unlaunchable foundation into a publicly operable,
recoverable, secure service. Removes the six NO-GO launch blockers without
touching domain code or architecture.

## Risks
- Secret/password rotation can lock out existing tokens/sessions (coordinate).
- CORS allowlist misconfig can break legitimate clients (stage first).
- Backup job must be tested by an actual restore, not assumed.
- Token revocation changes auth flow surface — keep additive, behind existing
  table; do not refactor AuthService more than necessary.

## Acceptance Criteria
- Prod boot aborts on missing/weak JWT_SECRET or DATABASE_URL.
- Only allowlisted origins succeed CORS preflight; others rejected.
- No default credentials anywhere reachable in production config.
- `docker build` produces a runnable image; /health 200 in-container.
- A documented restore reproduces the DB from a backup artifact.
- A leaked access token can be invalidated (or risk formally accepted in 03/04).
- No schema redesign, no domain refactor, no Shared Kernel introduced.
