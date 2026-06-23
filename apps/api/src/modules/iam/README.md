# IAM Module (Roadmap Step 1)

Bounded context: **IAM / Access**. Aggregate root: **Account**.
Authority: DOMAIN_BLUEPRINT.md (§3, §7, §11) + APPLICATION_BLUEPRINT.md (§2).

## Scope

The Account identity record and its lifecycle. Authentication entry point
remains the existing `auth` module (`POST /api/auth/login`), untouched.

## Aggregate

- **Account** `{ id, email, role, status, partyId? }` — immutable; transitions
  return new frozen instances. Owns all lifecycle invariants.
- **Lifecycle:** Invited → Active → Suspended → Closed (Closed terminal).
- **Value Objects:** `AccountId`, `EmailAddress`, `Role`, `AccountStatus`.
- **Roles:** PlatformAdmin, Partner, PropertyOwner, Tenant, Support (§7).
- **Specifications:** `canActivate`, `canSuspend`, `canClose`, `canAssignRole`.

## Use cases / endpoints

| Use case | Method + path |
|----------|---------------|
| Invite Account (UC-IAM-01) | `POST /api/accounts` |
| Get Account (UC-IAM-07) | `GET /api/accounts/:id` |
| List Accounts | `GET /api/accounts` |
| Activate (UC-IAM-02) | `POST /api/accounts/:id/activate` |
| Suspend (UC-IAM-03) | `POST /api/accounts/:id/suspend` |
| Close (UC-IAM-04) | `POST /api/accounts/:id/close` |
| Assign Role (UC-IAM-05) | `POST /api/accounts/:id/role` |

Authenticate (UC-IAM-06) is served by the existing `auth` module.

## Documented smallest-decisions (blueprint silent on infra)

1. **In-memory repository** (`repository.ts`) — no DB yet per roadmap; state is
   non-persistent. Ownership boundary stays when a durable store replaces it.
2. **Authorization deferred** — endpoints are not yet role-gated; no
   authenticated principal/session exists. The §7 matrix is the target; no auth
   framework is invented now (no DI/magic). Enforcement is wired when the
   Application security boundary lands.
3. **Id generation** is infrastructure (`randomUUID` in the service), never
   inside the aggregate, keeping the aggregate deterministic.
4. **Local error taxonomy** (`domain/errors.ts`) — a shared cross-module error
   layer is deferred until a 2nd module needs it.

## Domain Events (conceptual — not emitted yet)

`AccountInvited`, `AccountActivated`, `AccountSuspended`, `AccountClosed` are
defined in DOMAIN_BLUEPRINT §12; no event transport exists yet, so they are not
published. To be wired when eventing is introduced.
