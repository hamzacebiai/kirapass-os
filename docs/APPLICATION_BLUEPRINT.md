# KiraPass OS — Application Blueprint (Application Layer Single Source of Truth)

Status: **Application Architecture phase — no implementation.** This document
defines how the Application Layer *coordinates* the Domain. It never redefines
domain meaning. The **DOMAIN_BLUEPRINT.md is frozen**; everything here references
it (contexts, aggregates, events, specifications, policies) and adds only
orchestration semantics. No code, interfaces, DTOs, schema, API, or framework.

Domain contexts referenced: IAM, Party, Verification, Property, Leasing, Billing,
Reputation. Aggregate roots referenced: Account, Owner, Tenant, Partner,
IdentityVerification, PhotoVerification, Property (+Onboarding+Documents), Lease
(+LeaseDocuments), AidatPlan, PaymentSchedule (+Installments), PaymentRecord,
TenantRating.

---

## 1. Application Layer Principles

**Responsibilities (what the Application Layer does):**
- Receive an intent (command/query), authorize it, validate its shape, and orchestrate aggregates and domain services to fulfil it.
- Own the **transaction boundary** (one aggregate per transaction) and decide when work is committed.
- Translate Domain Events into orchestration reactions (invoke the next aggregate) and into audit records.
- Map domain/infrastructure outcomes into the Application Error Taxonomy (§9).
- Enforce idempotency and optimistic-concurrency expectations (§10–§11).

**Non-responsibilities (what it must NOT do):**
- Hold business rules, invariants, or calculations — those live in Aggregates, Domain Services, Specifications, Policies.
- Talk to transport, storage, clock, or providers directly — those are Infrastructure, injected as results.
- Mutate more than one aggregate inside one transaction.
- Make authorization *decisions* from domain state it computed itself — it evaluates the §7 Authorization Matrix, not new rules.

**Boundaries (three layers):**
- **Domain Layer** = meaning + invariants (frozen). Pure.
- **Application Layer** = coordination + transactions + authorization evaluation + event orchestration. Stateless between calls.
- **Infrastructure** = persistence, transport, clock, id-gen, file storage, event delivery, external providers (e-Devlet/auth), and the existing static Clean-Architecture/plugin/registry runtime. Provides primitives/results to the Application Layer; never the reverse.

**Orchestration rules:**
- One use case = one Application Service method intent = at most one **write** aggregate per transaction.
- Cross-aggregate effects happen via Domain Events handled *after* commit (eventual consistency), never via multi-aggregate transactions.
- The Application Layer depends downward only (App → Domain; App → Infra abstractions). Domain never depends on Application.

---

## 2. Use Case Catalog

Every business capability appears exactly once, grouped by bounded context. (UC =
use case.)

**IAM**
- UC-IAM-01 Invite Account · UC-IAM-02 Activate Account · UC-IAM-03 Suspend Account · UC-IAM-04 Close Account · UC-IAM-05 Assign Role · UC-IAM-06 Authenticate (login) · UC-IAM-07 Get Account.

**Party**
- UC-PAR-01 Register Owner · UC-PAR-02 Register Tenant · UC-PAR-03 Onboard Partner · UC-PAR-04 Update Party Profile · UC-PAR-05 Assign Owner Stewardship (to Partner) · UC-PAR-06 Revoke Owner Stewardship · UC-PAR-07 Archive Party · UC-PAR-08 Get Party · UC-PAR-09 List Parties (scoped) · UC-PAR-10 Get Tenant Rating Summary (read-model).

**Verification**
- UC-VER-01 Initiate Identity Verification · UC-VER-02 Record Identity Result (provider callback) · UC-VER-03 Submit Photo Verification · UC-VER-04 Review Photo Verification · UC-VER-05 Expire Verification (time-driven) · UC-VER-06 Get Verification.

**Property**
- UC-PRO-01 Draft Property · UC-PRO-02 Update Property Draft · UC-PRO-03 Upload Property Document · UC-PRO-04 Verify Property Document · UC-PRO-05 Run Onboarding Step · UC-PRO-06 Mark Property LeaseReady · UC-PRO-07 Archive Property · UC-PRO-08 Get Property · UC-PRO-09 List Properties (scoped).

**Leasing**
- UC-LEA-01 Draft Lease · UC-LEA-02 Update Lease Draft · UC-LEA-03 Request Signatures · UC-LEA-04 Upload/Sign Lease Document · UC-LEA-05 Activate Lease · UC-LEA-06 Terminate Lease · UC-LEA-07 End Lease (natural term) · UC-LEA-08 Cancel Lease (pre-active) · UC-LEA-09 Get Lease · UC-LEA-10 List Leases (scoped).

**Billing**
- UC-BIL-01 Define/Activate AidatPlan · UC-BIL-02 Retire AidatPlan · UC-BIL-03 Generate Payment Schedule (event-driven) · UC-BIL-04 Record Payment · UC-BIL-05 Confirm Payment · UC-BIL-06 Reverse Payment · UC-BIL-07 Recompute Installment Status (event-driven) · UC-BIL-08 Mark Overdue (time-driven) · UC-BIL-09 Waive Installment · UC-BIL-10 Write-off Installment (Admin) · UC-BIL-11 Close Payment Schedule (event-driven) · UC-BIL-12 Get Schedule / Installments (read) · UC-BIL-13 Settle Remaining on Termination (event-driven, R-10).

**Reputation**
- UC-REP-01 Author Tenant Rating (draft) · UC-REP-02 Publish Tenant Rating · UC-REP-03 Retract Tenant Rating · UC-REP-04 Recompute Rating Summary (event-driven) · UC-REP-05 Get Tenant Ratings (read).

---

## 3. Command / Query Separation

Rule: a **Command** changes aggregate state (and may emit events); a **Query**
reads a model and emits nothing, holds no transaction-for-write.

| Use case group | Commands | Queries |
|----------------|----------|---------|
| IAM | 01,02,03,04,05 | 06 (authenticate = state-reading + token issue; treated as command only if it mutates session store, else query), 07 |
| Party | 01,02,03,04,05,06,07 | 08,09,10 |
| Verification | 01,02,03,04,05 | 06 |
| Property | 01,02,03,04,05,06,07 | 08,09 |
| Leasing | 01,02,03,04,05,06,07,08 | 09,10 |
| Billing | 01,02,03,04,05,06,07,08,09,10,11,13 | 12 |
| Reputation | 01,02,03,04 | 05 |

Notes: event-driven UCs (BIL-03/07/08/11/13, REP-04, VER-05) are **internal
commands** triggered by policies, not external requests — still commands because
they mutate state. All `Get*`/`List*`/summary reads are queries (CQRS read side).

---

## 4. Application Services

One Application Service per bounded context (coordination scope = that context's
aggregates). Responsibility + orchestration scope only.

| Application Service | Responsibility | Coordinates aggregates |
|---------------------|----------------|------------------------|
| **AccessAppService** (IAM) | account lifecycle, role assignment, authentication entrypoint | Account |
| **PartyAppService** | register/update/archive parties; stewardship assignment; expose rating summary read-model | Owner, Tenant, Partner |
| **VerificationAppService** | initiate/record/expire identity & photo verification; publish result events | IdentityVerification, PhotoVerification |
| **PropertyAppService** | property draft, documents, onboarding orchestration, LeaseReady gating, archive | Property (+Onboarding, +PropertyDocument) |
| **LeasingAppService** | lease draft→activate→terminate/end/cancel; document signing; owner-freeze at activation | Lease (+LeaseDocument) |
| **BillingAppService** | aidat plan, schedule generation (reacting to LeaseActivated), payment record/confirm/reverse, status recompute, overdue, waive/writeoff, schedule close, termination settlement | AidatPlan, PaymentSchedule (+Installment), PaymentRecord |
| **ReputationAppService** | author/publish/retract ratings; trigger summary recompute event | TenantRating |

Each Application Service writes **only its own context's aggregates**. Effects on
other contexts are always via emitted Domain Events consumed by the owning
service (§8). No Application Service calls another Application Service's write
methods directly (§12).

---

## 5. Transaction Boundaries

Per use case: TX = single-aggregate write transaction; "after commit" effects are
**eventual** (event-driven). Reads are non-transactional (or snapshot).

| Use case(s) | TX start | TX end (commit) | Strong-consistency boundary | Eventual-consistency boundary |
|-------------|----------|------------------|------------------------------|-------------------------------|
| All `Get*`/`List*`/summary | n/a (read) | n/a | none | read-model may lag |
| IAM commands | load Account | Account saved | Account | role-dependent views |
| Party register/update/archive | load Party | Party saved | that Party | properties/leases referencing it |
| Stewardship assign/revoke | load Partner (+Owner ref) | Partner saved | Partner | Property writer-set view |
| Verification initiate/record/expire | load Verification | Verification saved | that Verification | Party/Property readiness (via event) |
| Property draft/update/doc/verify-doc/onboarding/LeaseReady/archive | load Property | Property saved | Property aggregate (Onboarding+Docs inside) | Leasing readiness (event) |
| Lease draft/update/sign/cancel | load Lease | Lease saved | Lease aggregate | — |
| **Lease activate** | load Lease | Lease saved (Owner frozen) | Lease | Property occupancy + Billing schedule (events) |
| Lease terminate/end | load Lease | Lease saved | Lease | Property vacate + Billing close/settle + Reputation window (events) |
| AidatPlan activate/retire | load AidatPlan | AidatPlan saved | AidatPlan | future schedule generation |
| Generate schedule | load/create Schedule | Schedule saved | PaymentSchedule (+Installments) | reporting read-models |
| Record/Confirm/Reverse payment | load PaymentRecord | PaymentRecord saved | PaymentRecord | Installment status recompute (event) |
| Recompute status / overdue / waive / writeoff / close | load Schedule | Schedule saved | PaymentSchedule | reporting |
| Rating author/publish/retract | load TenantRating | TenantRating saved | TenantRating | Party summary recompute (event) |

Hard rule reaffirmed: **no transaction spans two aggregate roots.** Single-active-lease
and archival-eligibility (cross-aggregate) are checked via Specifications using
read-consistent references at command time, with the authoritative guard re-run
inside the owning aggregate's transaction.

---

## 6. Repository Ownership Map

One repository per aggregate root (ownership only — no interface, no method, no
storage choice).

| Aggregate Root | Future Repository (owner context) |
|----------------|-----------------------------------|
| Account | AccountRepository (IAM) |
| Owner | OwnerRepository (Party) |
| Tenant | TenantRepository (Party) |
| Partner | PartnerRepository (Party) |
| IdentityVerification | IdentityVerificationRepository (Verification) |
| PhotoVerification | PhotoVerificationRepository (Verification) |
| Property (incl. Onboarding, PropertyDocument) | PropertyRepository (Property) |
| Lease (incl. LeaseDocument) | LeaseRepository (Leasing) |
| AidatPlan | AidatPlanRepository (Billing) |
| PaymentSchedule (incl. Installment) | PaymentScheduleRepository (Billing) |
| PaymentRecord (incl. allocations) | PaymentRecordRepository (Billing) |
| TenantRating | TenantRatingRepository (Reputation) |

Rules: child entities (Onboarding, Documents, Installments, allocations) have **no
own repository** — they are loaded/saved only through their root. Read-models
(rating summary, overdue dashboards) are **projections**, not aggregate
repositories, and are read-only.

---

## 7. Application Orchestration (text only)

Order of aggregate coordination per key flow.

- **Activate Lease (UC-LEA-05):** LeasingAppService loads Lease → evaluates `LeaseIsActivatableSpec` (which composes Property LeaseReady, Tenant Identity Verified, signed LeaseDocument, no competing Active Lease via read references) → invokes `OwnerIdentityFreezer` → Lease transitions Active, commits, emits `LeaseActivated`. After commit: Property consumes event → Leased; Billing consumes event → generates Schedule.
- **Generate Schedule (UC-BIL-03):** BillingAppService reacts to `LeaseActivated` → loads active AidatPlan + lease terms by id → `PaymentScheduleGenerator` produces Installments → creates Schedule, commits, emits `PaymentScheduleGenerated`.
- **Record→Confirm Payment (UC-BIL-04/05):** BillingAppService loads/creates PaymentRecord → `PaymentAllocator` allocates across Installments (same lease) → commits PaymentRecord, emits `PaymentConfirmed`. After commit: BillingAppService reacts → loads Schedule → `OverdueEvaluator`+allocation recompute Installment statuses, commits.
- **Onboarding → LeaseReady (UC-PRO-05/06):** PropertyAppService loads Property → `PropertyReadinessEvaluator` checks gates (Owner verified, ≥1 verified title doc, photo approved using verification results by id) → marks LeaseReady, commits, emits `PropertyMarkedLeaseReady`.
- **Publish Rating (UC-REP-02):** ReputationAppService loads TenantRating → `RatingIsAuthorizedSpec` → publishes, commits, emits `TenantRatingPublished`. After commit: PartyAppService reacts → `TenantRatingSummarizer` recomputes summary, commits.
- **Terminate Lease (UC-LEA-06):** LeasingAppService loads Lease → transitions Terminating/Ended, commits, emits `LeaseEnded`/`LeaseTerminating`. After commit: Property → Vacated; Billing → settle remaining Installments (R-10 policy) + close Schedule when terminal; Reputation → open rating window.

Each step touches exactly one write aggregate before commit; subsequent
aggregates are reached only through post-commit event handling.

---

## 8. Domain Event Orchestration

Sync = handled in-process as part of the same logical flow but **after** the
publisher's commit (separate transaction); Async = may be deferred/queued;
eventual = consumer state converges later. (Mechanism stays conceptual — the
existing static runtime is unchanged.)

| Event | Publisher | Subscribers | Sync | Async | Consistency |
|-------|-----------|-------------|------|-------|-------------|
| `IdentityVerified` / `PhotoVerificationApproved` | VerificationAppService | Party, Property | — | ✓ | eventual readiness re-gate |
| `PropertyMarkedLeaseReady` | PropertyAppService | Leasing (read gate) | — | ✓ | eventual |
| `LeaseActivated` | LeasingAppService | Property (occupancy), Billing (schedule), Reputation (arm window) | Billing schedule-gen may be sync-after-commit | Property/Reputation async | eventual; carries frozen Owner snapshot |
| `LeaseEnded` / `LeaseTerminating` | LeasingAppService | Property (vacate), Billing (settle+close), Reputation (window) | Billing settlement sync-after-commit | others async | eventual |
| `PaymentScheduleGenerated` | BillingAppService | reporting projections | — | ✓ | eventual |
| `PaymentConfirmed` / `PaymentReversed` | BillingAppService | Billing (status recompute), reporting | recompute sync-after-commit | reporting async | eventual |
| `InstallmentOverdue` / `InstallmentDue` | BillingAppService | reporting (notifications out of scope) | — | ✓ | eventual |
| `TenantRatingPublished` / `Retracted` | ReputationAppService | Party (summary recompute) | — | ✓ | eventual; latest-wins |
| `TenantRatingSummaryRecomputed` | PartyAppService | read projections | — | ✓ | eventual |

Ordering/idempotency follow Domain Blueprint §23: per-aggregate sequence,
idempotency key `(eventType, aggregateId, sequence)`, additive versioning,
latest-wins for derived read-models. Every subscriber is idempotent.

---

## 9. Application Error Taxonomy

Hierarchy (categories only — no codes/implementation).

- **DomainError** (invariant/spec violated): LeaseNotActivatable, PropertyNotLeaseReady, InstallmentImmutable, RatingNotAuthorized, InvalidLeaseTerm, AllocationExceedsAmount, SingleActiveLeaseViolation, SingleActiveAidatPlanViolation. *Source: Aggregates/Specifications.*
- **ValidationError** (malformed input/VO construction failure): InvalidMoney, InvalidNationalId, InvalidIBAN, InvalidDateRange, InvalidRatingScore. *Source: Value Object construction at the App boundary.*
- **AuthorizationError** (role/scope denied per §7 matrix): NotPermitted, OutOfScope, StewardshipRequired. *Source: Application Layer authorization step.*
- **ApplicationError** (orchestration/use-case level): UseCasePreconditionFailed, ReferenceNotFoundOrArchived, UnsupportedTransition. *Source: Application Services.*
- **ConcurrencyError** (optimistic version mismatch): AggregateVersionConflict. *Source: repository save vs expected version.*
- **ConflictError** (idempotency/state conflict): DuplicateCommand, AlreadyInState, CompetingActiveLease. *Source: idempotency/concurrency guards.*
- **InfrastructureError** (technical, non-domain): PersistenceUnavailable, ProviderUnavailable (e-Devlet/auth), EventDeliveryFailure, ClockUnavailable. *Source: Infrastructure; never carries domain meaning.*

Mapping rule: Infrastructure and Concurrency errors may be retried; Domain,
Validation, Authorization, Conflict errors are **not** auto-retried (deterministic
rejection). The Application Layer is the only place that maps lower errors into
this taxonomy.

---

## 10. Idempotency Rules

Use cases that MUST be idempotent and why.

| Use case | Why idempotent |
|----------|----------------|
| BIL-03 Generate Schedule | event-driven on `LeaseActivated`; re-delivery must not create a 2nd schedule (dedupe on leaseId — 1:1 invariant). |
| BIL-05 Confirm Payment / BIL-04 Record Payment | retried client/provider calls must not double-credit; dedupe on client-supplied command id + paymentRecordId. |
| BIL-06 Reverse Payment | re-delivered reversal must reverse once. |
| BIL-07 Recompute Status / BIL-08 Overdue / BIL-11 Close | event-driven recomputation; replays converge to same state (naturally idempotent / latest-wins). |
| VER-02 Record Identity Result | provider callbacks can repeat; verified result is immutable, re-apply is a no-op. |
| REP-02 Publish Rating | one published rating per (Tenant,Lease); duplicate publish rejected/no-op. |
| REP-04 Recompute Summary | latest-wins derived read-model. |
| IAM-02 Activate / 05 Assign Role | repeated activation/role-assign converges. |

Mechanism: external commands carry a **command id**; internal (event-driven)
handlers use the event idempotency key from §23. Queries are inherently
idempotent.

---

## 11. Concurrency Rules

- **Optimistic concurrency per aggregate root.** Each aggregate carries a version
  (AuditStamp); save expects the loaded version → mismatch raises ConcurrencyError.
- **Locking expectation:** no pessimistic locks across aggregates. The only
  contended invariants are single-active-lease (Property) and single-active-AidatPlan
  (Property) — both serialized **on the Property aggregate version**, so two
  concurrent activations conflict on Property's optimistic check, not a DB lock.
- **Conflict handling:** ConcurrencyError → reload + re-evaluate Specifications +
  retry (bounded). Domain/Conflict errors after re-evaluation are surfaced, not
  retried. PaymentRecord double-submission resolved by idempotency (§10), not locks.
- **Read models** are eventually consistent and never participate in write
  concurrency.

---

## 12. Application Dependency Rules

Allowed dependencies between Application Services (write-path). Edge = "may
trigger via event," never direct write-call.

```
AccessAppService      → (none; upstream identity)
PartyAppService       → consumes Verification events; consumes Reputation events (summary)
VerificationAppService→ (none on Core)
PropertyAppService    → consumes Verification events; consumes Leasing events (occupancy)
LeasingAppService     → reads Property/Tenant/Owner; consumes Property readiness
BillingAppService     → consumes Leasing events
ReputationAppService  → consumes Leasing events
```

Rules: **no Application Service synchronously calls another's write methods.**
Collaboration is event-driven only. Read references use queries/projections.
Cycle check: Party⇄Verification and Property⇄Leasing are event-asymmetric (one
emits, the other reacts) — **no synchronous cycle.** Acyclic at the application
layer. Verified.

---

## 13. Cross-Context Coordination

- Contexts collaborate **only** through (a) id references on commands/queries and
  (b) Domain Events handled after commit.
- **No shared aggregate, no shared repository, no direct cross-context aggregate
  call.** Billing never loads a Lease aggregate to mutate it; it reacts to
  `LeaseActivated`/`LeaseEnded` and reads lease terms by id.
- A cross-context precondition (e.g. "Tenant verified") is evaluated via a
  Specification over a **read reference** to the other context's result, then the
  authoritative gate re-runs inside the owning aggregate's transaction.
- The frozen-Owner snapshot on Lease is the canonical pattern: data needed
  long-term is **copied at the boundary moment**, not referenced live.

---

## 14. Application Security Boundaries

- **Authorization is evaluated in the Application Layer**, before any aggregate is
  loaded for write, against the Domain Blueprint §7 Authorization Matrix (role +
  scope: own / own-managed / leased). It is an *evaluation*, not new rules.
- **Validation (shape/VO)** occurs at the Application boundary on command intake —
  Value Object construction is the validation gate; malformed input never reaches
  an aggregate.
- **Business rules/invariants execute in the Domain** (Aggregates, Specifications,
  Policies) — the Application Layer cannot accept an authorized, well-formed
  command that violates an invariant; the aggregate rejects it.
- **Orchestration executes in the Application Layer** (transaction control, event
  handling, idempotency, concurrency retry).
- Order per command: Authorize → Validate (VO) → Load aggregate → Domain decides
  (invariants/specs) → Commit → Emit events → Audit.

---

## 15. Auditability Rules

Business actions that MUST always generate an audit record (actor, action,
target id, timestamp via AuditStamp — content only, no implementation).

- All IAM state changes (invite/activate/suspend/close/role-assign).
- Stewardship assign/revoke.
- Every Verification result (Verified/Failed/Approved/Rejected/Expired).
- Property LeaseReady transition and Archive.
- Lease activation (incl. frozen Owner snapshot), termination, end, cancel.
- All money-affecting actions: schedule generation, payment record/confirm/reverse,
  waive, write-off, termination settlement.
- Rating publish/retract (incl. force-retract by Admin).
- Any Archive of a Party/Property.
- Every AuthorizationError (denied attempt) on a write command.

Queries are not audited by default except sensitive reads (full identity /
financial export) — flagged for the security review, not mandated here.

---

## 16. Application Layer Validation (audit)

- **Duplicated use cases** → none; each capability appears once (§2). Authentication
  appears only in IAM; rating only in Reputation; schedule generation only in Billing.
- **Orchestration conflicts** → none; every flow writes one aggregate pre-commit
  (§5,§7). Schedule generation owned solely by Billing reacting to one event.
- **Transaction conflicts** → none; no two-aggregate transaction exists; contended
  invariants serialized on Property's optimistic version (§11).
- **Missing use cases** → added termination settlement (UC-BIL-13) and verification
  expiry (UC-VER-05) and overdue (UC-BIL-08) as internal event/time-driven commands
  so no lifecycle transition is unowned.
- **Cyclic dependencies** → none (§12); collaboration is event-asymmetric.
- **Missing responsibilities** → each lifecycle transition in Domain §8 maps to an
  owning Application Service method.
- **Aggregate leakage** → prevented; child entities have no repository (§6); no
  cross-context aggregate mutation (§13).
- **Repository leakage** → repositories are ownership-only, one per root; read-models
  are projections, not repositories.
- **Infrastructure leakage** → clock/provider/storage are Infra inputs; OverdueEvaluator
  takes time as input (no ambient now()); providers surface as result VOs.
- **Business-rule leakage** → no invariant placed in an Application Service; App only
  evaluates authorization + orchestrates; rules stay in Domain.
- **Authorization leakage** → single evaluation point (§14) against §7 matrix; no role
  logic scattered into aggregates.

All issues resolved or shown absent.

---

## 17. Implementation Readiness Report

| Dimension | Assessment | Notes |
|-----------|------------|-------|
| Domain completeness | **High** | DOMAIN_BLUEPRINT §1–§26 frozen and internally consistent. |
| Application completeness | **High** | Every domain capability mapped to exactly one use case + Application Service + transaction boundary + repository owner. |
| Architectural maturity | **High** | Clear Domain/Application/Infrastructure separation; CQRS-ready; event-driven seams defined. |
| Refactoring risk | **Low–Medium** | Low for Core flows; medium where in-code `tenant`/`landlord` scaffolds must be reconciled (R-7). |
| Technical-debt risk | **Medium** | Carried-over domain risks R-1 (multi-partner isolation), R-8 (Money precision), R-10 (termination settlement) must be resolved at their context's build time. |
| Coupling level | **Low** | Acyclic context + application dependency graphs; event-only cross-context collaboration; no shared aggregates. |
| Cohesion level | **High** | One Application Service per context, writing only its own aggregates. |
| Scalability readiness | **High (structural)** | Multi-currency/CQRS/event evolution ready; multi-partner gated on R-1; multi-country gated on R-2. |
| Maintainability readiness | **High** | Single-source-of-truth docs; explicit error taxonomy, idempotency, concurrency, audit rules. |

**Carried-forward weaknesses (report only, no domain redesign):**
- R-1 multi-partner data isolation — resolve in IAM/Party before a 2nd Partner.
- R-2 country-variant policies — before non-TR expansion.
- R-3 projection catalog — name read-models when dashboards are built (this doc treats them as projections but does not enumerate each).
- R-5 ambient-time ban — enforce time-as-input (lint-guard candidate).
- R-7 reconcile existing `tenant`/`landlord` scaffolds with Party/Reputation.
- R-8 Money rounding/precision — before Billing math.
- R-10 termination settlement rule — UC-BIL-13 named here but its disposition policy (waive/writeoff/prorate) is a Billing-build decision.

**Conclusion:** KiraPass OS is **READY to begin implementation.** The Domain is
complete and frozen; the Application Layer coordination model is complete,
internally consistent, acyclic, and free of duplicated responsibilities or
hidden coupling. Recommended first build order (from Domain §10 + this doc):
IAM/Account → Party (reconciling existing scaffolds, R-7) → Verification →
Property → Onboarding → Lease → Billing (resolving R-8/R-10) → Reputation. The
seven carried-forward weaknesses are scheduled, context-local hardening items —
none blocks starting implementation, and each has a named trigger point.

End of Application Blueprint. No domain rule was modified; no code, interface,
DTO, schema, API, or framework detail is present. This document is the permanent
Application Layer Single Source of Truth for KiraPass OS.
