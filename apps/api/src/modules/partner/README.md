# Partner Module (Roadmap Step 4)

Bounded context: **Party**. Aggregate root: **Partner**.
Authority: DOMAIN_BLUEPRINT.md (§3, §4, §7, §11) + APPLICATION_BLUEPRINT.md (§2).

## Aggregate

- **Partner** `{ id, name, email, phone, status, accountId?, managedOwnerIds[] }`
  — immutable; transitions return new frozen instances (and a frozen
  managed-owner list).
- **Lifecycle:** Onboarded → Active → Suspended → Archived (Suspended → Active
  reactivation allowed).
- **Value Objects:** `PartnerId`, `EmailAddress`, `PhoneNumber`.
- **Specifications:** `canActivate`, `canSuspend`, `canArchive`, `canManageStewardship`.
- **Stewardship:** `managedOwnerIds` is a set of id-only references to Owner
  aggregates (no foreign aggregate, no existence check yet).

## Use cases / endpoints

| Use case | Method + path |
|----------|---------------|
| Onboard Partner (UC-PAR-03) | `POST /api/partners` |
| Get Partner | `GET /api/partners/:id` |
| List Partners | `GET /api/partners` |
| Activate (lifecycle) | `POST /api/partners/:id/activate` |
| Suspend (lifecycle) | `POST /api/partners/:id/suspend` |
| Archive (UC-PAR-07) | `POST /api/partners/:id/archive` |
| Assign Owner Stewardship (UC-PAR-05) | `POST /api/partners/:id/owners` (body `{ ownerId }`) |
| Revoke Owner Stewardship (UC-PAR-06) | `DELETE /api/partners/:id/owners/:ownerId` |

Stewardship assign/revoke are idempotent.

## Deferrals

- In-memory repository; authorization enforcement deferred (no principal);
  `accountId`/`ownerId` references not existence-checked (no cross-context read).
- **Cross-aggregate invariant deferred** (§4): "cannot Suspend/Archive while
  stewarding a Property under an Active Lease — must reassign first" — enforced
  by a StewardshipReassignmentPolicy once Property/Lease exist (steps 6/9).
- Local error taxonomy + VOs duplicate other Party modules — shared-kernel
  consolidation intentionally deferred (premature abstraction).

## Domain Events (conceptual — not emitted yet)

`PartnerOnboarded`, `PartnerSuspended`, `PartnerArchived`,
`OwnerStewardshipAssigned`, `OwnerStewardshipRevoked` (DOMAIN_BLUEPRINT §12).
