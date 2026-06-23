# Verification Module (Roadmap Step 5)

Bounded context: **Verification**. Aggregate roots: **IdentityVerification**,
**PhotoVerification**.
Authority: DOMAIN_BLUEPRINT.md (§3, §4, §8, §11) + APPLICATION_BLUEPRINT.md (§2).

## Aggregates

- **IdentityVerification** `{ id, partyId, status, result }` — immutable.
  Lifecycle: Initiated → InProgress → Verified | Failed | Expired (Failed →
  retry → Initiated). A Verified `result` is immutable; only system Expire may
  follow.
- **PhotoVerification** `{ id, subjectType, subjectId, leaseId?, status, result }`
  — immutable. Lifecycle: Submitted → UnderReview → Approved | Rejected. An
  Approved decision is immutable.
- **Value Objects:** `IdentityVerificationId`, `PhotoVerificationId`,
  `IsoTimestamp`, `VerificationResult` (outcome + issuedAt + expiresAt),
  `PhotoResult` (outcome + decidedAt), `PhotoSubjectType`.
- **Specifications:** `canStartIdentity`, `canCompleteIdentity`,
  `canExpireIdentity`, `canRetryIdentity`, `canReviewPhoto`, `canDecidePhoto`.
- Timestamps are injected by the service (no ambient clock in the domain).

## Use cases / endpoints

Identity:
| Method + path |
|---------------|
| `POST /api/verifications/identity` (initiate, body `{ partyId }`) |
| `GET /api/verifications/identity` · `GET /api/verifications/identity/:id` |
| `POST /api/verifications/identity/:id/start` |
| `POST /api/verifications/identity/:id/verify` (body `{ expiresAt? }`) |
| `POST /api/verifications/identity/:id/fail` |
| `POST /api/verifications/identity/:id/expire` |
| `POST /api/verifications/identity/:id/retry` |

Photo:
| Method + path |
|---------------|
| `POST /api/verifications/photo` (submit, body `{ subjectType, subjectId, leaseId? }`) |
| `GET /api/verifications/photo` · `GET /api/verifications/photo/:id` |
| `POST /api/verifications/photo/:id/review` |
| `POST /api/verifications/photo/:id/approve` |
| `POST /api/verifications/photo/:id/reject` |

## Deferrals

- In-memory repositories (no DB yet); authorization enforcement deferred (no
  principal).
- `partyId` / `subjectId` / `leaseId` are id-only references, not
  existence-checked (cross-context read mechanism does not exist yet).
- **No Party integration performed.** Per the freeze, this module does not
  modify Owner/Tenant. Their consumption of `VerificationResult` (Party reading
  the result) awaits the event-orchestration mechanism (DOMAIN_BLUEPRINT §12/§23).
- Local error taxonomy + VOs (no shared kernel by policy).

## Domain Events (conceptual — not emitted yet)

`IdentityVerificationInitiated`, `IdentityVerified`,
`IdentityVerificationFailed`, `IdentityVerificationExpired`,
`PhotoVerificationSubmitted`, `PhotoVerificationApproved`,
`PhotoVerificationRejected` (DOMAIN_BLUEPRINT §12).
