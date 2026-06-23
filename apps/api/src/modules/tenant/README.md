# Tenant Module (Roadmap Step 3)

Bounded context: **Party**. Aggregate root: **Tenant** (Kiracı).
Authority: DOMAIN_BLUEPRINT.md (§3, §4, §8, §11, §16) + APPLICATION_BLUEPRINT.md (§2).

> Blueprint-conformant replacement for the former legacy `tenant` scaffold
> (breaking changes **BC-2** + **BC-3**, executed at this step).

## Aggregate

- **Tenant** `{ id, fullName, nationalId, phone, email, status, accountId?, ratingSummary }`
  — immutable; transitions return new frozen instances.
- **Lifecycle:** Registered → Verified → Active → Past → Archived.
- **Value Objects:** `TenantId`, `NationalId`, `PhoneNumber`, `EmailAddress`.
- **Specifications:** `canVerify`, `canActivate`, `canMarkPast`, `canArchive`.

## Key blueprint corrections vs the old scaffold

- **No embedded `rating`** — rating lives in the Reputation context as
  `TenantRating` per lease (step 13). `ratingSummary` here is a DERIVED,
  read-only value fed by a future `TenantRatingSummaryRecomputed` handler; it is
  `null` until Reputation exists and is **never settable via the API**.
- **No owned `verificationStatus`** — identity verification is referenced, not
  owned. `verify` is a lifecycle transition now; real `VerificationResult`
  linkage arrives with the Verification context (step 5).
- **No `active` boolean** — replaced by the proper lifecycle `status`.
- **Typed VOs** instead of raw primitives.

## Use cases / endpoints

| Use case | Method + path |
|----------|---------------|
| Register Tenant (UC-PAR-02) | `POST /api/tenants` |
| Get Tenant | `GET /api/tenants/:id` |
| List Tenants | `GET /api/tenants` |
| Verify (lifecycle) | `POST /api/tenants/:id/verify` |
| Activate (lifecycle) | `POST /api/tenants/:id/activate` |
| Mark Past (lifecycle) | `POST /api/tenants/:id/past` |
| Archive (UC-PAR-07) | `POST /api/tenants/:id/archive` |

## Deferrals

- In-memory repository (no DB yet); authorization enforcement deferred (no
  principal); `accountId` not existence-checked (no cross-context read yet);
  Active/Past will later be driven by Lease events (step 9); archive
  cross-aggregate guard (active lease / unsettled dues) deferred to
  ArchivalGuardPolicy.
- Local error taxonomy + VOs duplicate IAM/Owner — shared kernel refactor
  tracked (see remaining risks).

## Domain Events (conceptual — not emitted yet)

`TenantRegistered`, `TenantVerified`, `TenantArchived` (DOMAIN_BLUEPRINT §12).
