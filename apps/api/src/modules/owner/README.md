# Owner Module (Roadmap Step 2)

Bounded context: **Party**. Aggregate root: **Owner** (Property Owner / Ev Sahibi).
Authority: DOMAIN_BLUEPRINT.md (§3, §4, §7, §8, §11) + APPLICATION_BLUEPRINT.md (§2).

## Aggregate

- **Owner** `{ id, fullName, nationalId, phone, email, payoutIban, status, accountId?, partnerId? }`
  — immutable; transitions return new frozen instances. Owns all lifecycle
  invariants.
- **Lifecycle:** Registered → Verified → Active → Archived.
- **Invariants:** payout **IBAN required before Activate** (§4).
- **Value Objects:** `OwnerId`, `NationalId`, `PhoneNumber`, `EmailAddress`, `Iban`.
- **Specifications:** `canVerify`, `canActivate`, `canArchive`, `canSetPayoutIban`.
- **References (id-only, no foreign aggregate):** `accountId` (IAM Account),
  `partnerId` (Partner steward).

## Use cases / endpoints

| Use case | Method + path |
|----------|---------------|
| Register Owner (UC-PAR-01) | `POST /api/owners` |
| Get Owner (UC-PAR-08) | `GET /api/owners/:id` |
| List Owners (UC-PAR-09) | `GET /api/owners` |
| Verify (lifecycle) | `POST /api/owners/:id/verify` |
| Set Payout IBAN | `POST /api/owners/:id/payout-iban` |
| Activate (lifecycle) | `POST /api/owners/:id/activate` |
| Archive (UC-PAR-07) | `POST /api/owners/:id/archive` |

## Documented smallest-decisions / deferrals

1. **In-memory repository** — no DB yet; non-persistent.
2. **Authorization deferred** — §7 says Admin/Partner create or self-register; no
   authenticated principal exists yet, so enforcement is not wired (consistent
   with IAM). No auth framework invented.
3. **`accountId` / `partnerId` not existence-checked** — cross-context
   `ReferenceExistsAndActiveSpec` needs a cross-context read mechanism that does
   not exist yet; stored as id references only.
4. **Archive cross-aggregate guard deferred** — "cannot Archive while holding an
   Active Lease" is enforced by an ArchivalGuardPolicy once the Lease context
   exists (roadmap step 9). Local guard only blocks re-archiving here.
5. **Local error taxonomy** — a shared cross-module error layer is now justified
   (IAM + Owner) but deferred to avoid modifying the completed IAM module
   mid-step. Tracked as a future refactor (candidate ADR).

## Relationship to legacy `landlord`

This module is the blueprint-conformant replacement for the frozen legacy
`landlord` scaffold (canonical term is **Owner**). Removing `landlord` is
breaking change **BC-1** and requires explicit approval; until then both
coexist on distinct paths (`/api/owners` vs frozen `/api/landlords`).

## Domain Events (conceptual — not emitted yet)

`OwnerRegistered`, `OwnerVerified`, `OwnerArchived` (DOMAIN_BLUEPRINT §12); no
event transport exists yet, so they are not published.
