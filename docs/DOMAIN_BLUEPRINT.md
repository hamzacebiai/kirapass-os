# KiraPass OS — Domain Blueprint (Single Source of Truth)

Status: **Domain modeling phase — no implementation.** This document governs all
future feature work. Scope is locked to the Property Operating System domain.
Concepts outside the allowed list (e.g. building/apartment hierarchy,
notifications, generic CRM/marketplace) are intentionally excluded and must not
be introduced without a new explicit domain decision.

Allowed domain concepts: Property, Property Owner, Tenant, Partner, Lease
Contract, Rent, Maintenance Fee (Aidat), Payment Schedule, Payment Status,
Property Documents, Identity Verification, Photo Verification, Tenant Rating,
Property Onboarding.

---

## 1. Ubiquitous Language

Each term has exactly one meaning across the whole platform.

| Term | Canonical meaning |
|------|-------------------|
| **Account** | An authenticated platform login identity. Belongs to exactly one Party. Not a business party itself. |
| **Party** | A real-world actor with a business profile: Owner, Tenant, or Partner. |
| **Property (Ev)** | A single rentable residential unit owned by one Owner. The atomic rentable asset. No sub-unit hierarchy. |
| **Property Owner (Ev Sahibi)** | The Party that legally owns one or more Properties and receives Rent/Aidat payouts. |
| **Tenant (Kiracı)** | The Party that occupies a Property under a Lease and pays Rent (and, where agreed, Aidat). |
| **Partner** | A Party that introduces/manages Owners and their Properties on the platform under a commercial relationship. |
| **Lease Contract (Lease)** | A time-bounded legal agreement binding one Property, one Owner, and one Tenant, defining Rent, Aidat responsibility, and term. |
| **Rent (Kira)** | The recurring amount a Tenant owes the Owner for occupancy, defined by a Lease. |
| **Maintenance Fee (Aidat)** | The recurring building/maintenance charge attached to a Property; a Lease assigns who pays it. |
| **Payment Schedule** | The ordered set of dated obligations (Installments) generated from a Lease's Rent and Aidat terms. |
| **Installment** | A single dated obligation line within a Payment Schedule (type = Rent or Aidat). |
| **Payment Status** | The settlement state of an Installment: Scheduled, Due, Paid, PartiallyPaid, Overdue, Waived. |
| **Payment Record** | A confirmed money-movement event applied to one or more Installments. |
| **Property Document** | An evidentiary file bound to a Property (e.g. tapu / title deed). |
| **Lease Document** | An evidentiary file bound to a Lease (signed contract, identity copies). |
| **Identity Verification** | The process and result of confirming a Party's legal identity (e-Devlet integration placeholder). |
| **Photo Verification** | Proof-image confirmation for a Property condition or a Tenant/occupancy claim. |
| **Tenant Rating** | An evaluation of a Tenant's conduct, authored by the Owner, scoped to one Lease. |
| **Property Onboarding** | The guided lifecycle that brings a Property from draft to verified, lease-ready state. |
| **Active Lease** | The single currently-effective Lease on a Property. A Property has at most one. |

Disambiguation decisions:
- "Owner" always means Property Owner (Ev Sahibi), never an aggregate-ownership relationship; the latter is called **stewardship/responsibility**.
- "Verification" is never used bare — always qualified as **Identity** or **Photo**.
- "Payment" is split into **Installment** (obligation) and **Payment Record** (event) to remove the common overload.

---

## 2. Bounded Contexts

Seven contexts. Each owns its data; cross-context links are by identifier reference only.

| Context | Responsibility | Owns |
|---------|----------------|------|
| **Identity & Access (IAM)** | Authentication, Accounts, Roles, session/authorization. | Account, Role assignment |
| **Party** | Business profiles and their commercial relationships. | Owner, Tenant, Partner |
| **Verification** | Identity (e-Devlet) and Photo verification workflows and results. | IdentityVerification, PhotoVerification |
| **Property** | Property registry and Onboarding lifecycle. | Property, PropertyOnboarding, PropertyDocument |
| **Leasing** | Lease lifecycle binding Property + Owner + Tenant. | Lease, LeaseDocument |
| **Billing** | Rent + Aidat obligations, Payment Schedule, Installments, Payment Records, Payment Status. | PaymentSchedule, Installment, PaymentRecord, AidatPlan |
| **Reputation** | Tenant evaluation. | TenantRating |

### Context map (relationships)

```
        IAM (auth)
          │  Account ↔ Party (1:1)
          ▼
        Party ──upstream──▶ Verification        (Party requests verification)
          │
          │ Owner / Partner
          ▼
        Property ──▶ Verification (photo/property docs)
          │
          ▼
        Leasing  ─uses ids→  Property, Tenant, Owner
          │
          ▼
        Billing  ─derives from→ Lease (Rent + Aidat)
          │
          ▼
        Reputation ─references→ Lease + Tenant
```

Patterns:
- **IAM → Party**: Customer/Supplier; Party trusts Account identity.
- **Party → Verification**: Verification is a downstream **Supporting** context; it publishes verified/failed results that Party and Property consume.
- **Property/Tenant/Owner → Leasing**: Leasing is the **Core** domain; it references upstream ids and enforces lease invariants.
- **Leasing → Billing**: Billing is a **Conformist** downstream of Leasing — schedules are generated from lease terms; Billing never alters lease terms.
- **Leasing → Reputation**: Reputation reads lease/tenant ids; isolated, eventually-consistent.

Core vs supporting: **Leasing + Billing = Core**. Property = Core-adjacent. Party, Verification, Reputation, IAM = Supporting/Generic.

---

## 3. Domain Entities

For each: purpose · identity · ownership (which aggregate/context) · lifecycle anchor.

1. **Account** — Purpose: login + role binding. Identity: `accountId`. Ownership: IAM. Lifecycle: Invited → Active → Suspended → Closed.
2. **Owner (Property Owner)** — Purpose: owns properties, receives payouts. Identity: `ownerId`. Ownership: Party. Lifecycle: Registered → Verified → Active → Archived.
3. **Tenant** — Purpose: occupies property, pays rent. Identity: `tenantId`. Ownership: Party. Lifecycle: Registered → Verified → Active → Past → Archived.
4. **Partner** — Purpose: introduces/manages owners & properties. Identity: `partnerId`. Ownership: Party. Lifecycle: Onboarded → Active → Suspended → Archived.
5. **IdentityVerification** — Purpose: confirm a Party's legal identity. Identity: `identityVerificationId`. Ownership: Verification (references a Party). Lifecycle: Initiated → InProgress → Verified | Failed | Expired.
6. **PhotoVerification** — Purpose: proof images for property condition / occupancy. Identity: `photoVerificationId`. Ownership: Verification (references Property or Tenant+Lease). Lifecycle: Submitted → UnderReview → Approved | Rejected.
7. **Property (Ev)** — Purpose: the rentable asset. Identity: `propertyId`. Ownership: Property context, owned by one Owner (and optionally stewarded by a Partner). Lifecycle: see §8.
8. **PropertyOnboarding** — Purpose: orchestrate property readiness. Identity: `onboardingId` (1:1 with Property). Ownership: Property. Lifecycle: drives Property from Draft → LeaseReady.
9. **PropertyDocument** — Purpose: title/ownership evidence (tapu, property docs). Identity: `documentId`. Ownership: Property aggregate. Lifecycle: see §8 Document.
10. **Lease (Lease Contract)** — Purpose: bind Property+Owner+Tenant with terms. Identity: `leaseId`. Ownership: Leasing (root). Lifecycle: see §8.
11. **LeaseDocument** — Purpose: signed contract + identity copies. Identity: `documentId`. Ownership: Lease aggregate. Lifecycle: Document lifecycle.
12. **AidatPlan** — Purpose: recurring maintenance-fee definition for a Property. Identity: `aidatPlanId`. Ownership: Billing (references Property). Lifecycle: Draft → Active → Retired.
13. **PaymentSchedule** — Purpose: dated obligation set for a Lease. Identity: `scheduleId` (1:1 with Lease). Ownership: Billing. Lifecycle: Generated → Active → Closed.
14. **Installment** — Purpose: one dated obligation (Rent or Aidat). Identity: `installmentId`. Ownership: PaymentSchedule (child entity). Lifecycle: Payment Status states (§8).
15. **PaymentRecord** — Purpose: confirmed money movement applied to installments. Identity: `paymentRecordId`. Ownership: Billing. Lifecycle: Recorded → Confirmed | Reversed.
16. **TenantRating** — Purpose: owner's evaluation of a tenant for one lease. Identity: `ratingId`. Ownership: Reputation. Lifecycle: Draft → Published → (immutable) | Retracted.

---

## 4. Aggregates

Aggregate roots, boundaries, and invariants. Cross-aggregate references are by id only; no object graphs span aggregates.

### Aggregate: **Owner** (root: Owner)
- Boundary: Owner profile + payout IBAN + current verification reference.
- Invariants: payout IBAN required before any payout-bearing Lease becomes Active; an Owner cannot be Archived while holding an Active Lease.

### Aggregate: **Tenant** (root: Tenant)
- Boundary: Tenant profile + identity verification reference + rating summary (denormalized average).
- Invariants: rating summary is derived, never directly edited; a Tenant cannot be deleted, only Archived.

### Aggregate: **Partner** (root: Partner)
- Boundary: Partner profile + managed-owner references.
- Invariants: a Partner cannot be Suspended/Archived while it is the active steward of any Property under an Active Lease (must reassign first).

### Aggregate: **Property** (root: Property)
- Boundary: Property + PropertyOnboarding + PropertyDocument[].
- Invariants:
  - A Property references exactly one Owner; Partner steward is optional.
  - **At most one Active Lease** at any time (enforced via state, checked by Leasing on activation).
  - Cannot reach `LeaseReady` unless: Owner identity Verified, at least one Verified PropertyDocument (title), and required PhotoVerification Approved.

### Aggregate: **Lease** (root: Lease) — Core
- Boundary: Lease terms + LeaseDocument[] + signature/term state.
- Invariants:
  - References exactly one Property, one Tenant; Owner is derived from the Property at activation and frozen onto the Lease.
  - Cannot become **Active** unless: Property is `LeaseReady`, Tenant identity Verified, signed LeaseDocument present, and the Property has no other Active Lease.
  - Term: `startDate < endDate`; Rent amount > 0; Aidat responsibility ∈ {Owner, Tenant}.
  - Once **Ended**, all terms are immutable.

### Aggregate: **PaymentSchedule** (root: PaymentSchedule)
- Boundary: Schedule + Installment[].
- Invariants:
  - Exactly one Schedule per Lease; generated only after Lease becomes Active.
  - Sum/timeline of Rent Installments must reconcile with Lease Rent terms; Aidat Installments reconcile with the active AidatPlan and the Lease's Aidat-responsibility.
  - An Installment in a terminal state (Paid, Waived) is immutable.

### Aggregate: **PaymentRecord** (root: PaymentRecord)
- Boundary: a single confirmed payment + the installment allocations it settles.
- Invariants: total allocated ≤ record amount; allocations only target Installments of the same Lease; a Confirmed record can transition only to Reversed (never edited).

### Aggregate: **AidatPlan** (root: AidatPlan)
- Boundary: maintenance-fee amount + frequency for a Property.
- Invariants: at most one Active AidatPlan per Property; amount ≥ 0.

### Aggregate: **IdentityVerification** / **PhotoVerification** (roots)
- Boundary: one verification workflow + its result.
- Invariants: a `Verified`/`Approved` result is immutable; expiry transitions are system-driven only.

### Aggregate: **TenantRating** (root: TenantRating)
- Boundary: score + commentary + lease/tenant/author references.
- Invariants: exactly one Published rating per (Tenant, Lease); score ∈ [1..5]; only the Owner party of that Lease may author; immutable once Published (Retract only).

---

## 5. Relationships

| From | To | Cardinality | Ownership | Dependency |
|------|----|-------------|-----------|------------|
| Account | Party (Owner/Tenant/Partner) | 1 : 1 | IAM links to Party | Party requires an Account to act |
| Partner | Owner | 1 : 0..* | Partner stewards Owners | Optional; Owner may be partner-less (direct) |
| Owner | Property | 1 : 0..* | Owner owns Properties | Property requires an Owner |
| Partner | Property | 0..1 : 0..* | Partner steward of Property | Optional steward link |
| Property | Lease | 1 : 0..* (≤1 Active) | Property referenced by Leases | Lease requires a `LeaseReady` Property |
| Tenant | Lease | 1 : 0..* | Tenant referenced by Leases | Lease requires a Verified Tenant |
| Owner | Lease | 1 : 0..* | Frozen onto Lease at activation | Derived from Property |
| Lease | PaymentSchedule | 1 : 1 | Billing owns Schedule | Schedule derived from Lease |
| PaymentSchedule | Installment | 1 : 1..* | Schedule owns Installments | — |
| Installment | PaymentRecord (allocation) | 0..* : 0..* | Billing | Settlement linkage |
| Property | AidatPlan | 1 : 0..1 Active | Billing references Property | Feeds Aidat Installments |
| Property | PropertyDocument | 1 : 0..* | Property aggregate | — |
| Lease | LeaseDocument | 1 : 0..* | Lease aggregate | — |
| Party | IdentityVerification | 1 : 0..* (1 Active Verified) | Verification | Gates lifecycle transitions |
| Property/Tenant | PhotoVerification | 1 : 0..* | Verification | Gates onboarding / occupancy proof |
| Tenant | TenantRating | 1 : 0..* | Reputation | Rating requires an Ended/Active Lease |
| Lease | TenantRating | 1 : 0..1 | Reputation | One rating per lease |

No database constructs implied here — cardinality is conceptual.

---

## 6. Business Rules (immutable)

Creation & authorship:
- Only **Platform Admin** or **Partner** may create an Owner profile; an Owner may also self-register (becomes partner-less).
- Only an **Owner** (or its **Partner** steward, or **Platform Admin**) may create a Property.
- Only the **Owner/Partner** of a Property may initiate a Lease draft; the **Tenant** must counter-sign.
- Only the **Owner** party of a Lease may author a Tenant Rating.
- Payment Schedules and Installments are **system-generated** from Lease terms — never hand-created.

Mutability & state gates:
- A Property cannot become `LeaseReady` without: Owner Identity Verified + ≥1 Verified title PropertyDocument + required PhotoVerification Approved.
- A Lease cannot become `Active` without: Property `LeaseReady` + Tenant Identity Verified + signed LeaseDocument + no competing Active Lease on the Property.
- Lease terms are editable **only** in `Draft`/`PendingSignatures`; frozen once `Active`; fully immutable once `Ended`.
- Installments in `Paid`/`Waived` are immutable. `Overdue` is a system-derived state from due date + status, not manually set.
- A Confirmed PaymentRecord is never edited — corrections happen via a Reversal + new record.
- A Published TenantRating is immutable; an Owner may only **Retract** (soft) within a defined window; Platform Admin may force-retract for abuse.

Archival:
- Parties and Properties are **never hard-deleted**; they are Archived. Archival is blocked while an Active Lease or unsettled Installment exists.
- A Lease auto-transitions to `Ended` at term end or early Termination; its Schedule then Closes once all Installments are terminal (Paid/Waived) or written-off by Admin.
- Documents and Verifications expire on policy; expiry never deletes the record (audit retention).

Integrity:
- Owner identity on a Lease is **frozen at activation** — later Owner profile changes do not retroactively alter active leases.
- Cross-context references must point to existing, non-archived aggregates at creation time.

---

## 7. Authorization Matrix

Roles: **Platform Admin**, **Partner**, **Property Owner**, **Tenant**, **Support**.

Legend: C=create, R=read, U=update, A=archive/retract, — = none. "own" = scoped to records the role is party/steward of.

| Resource | Platform Admin | Partner | Property Owner | Tenant | Support |
|----------|----------------|---------|----------------|--------|---------|
| Account | C R U A | R(own-managed) | R U(self) | R U(self) | R |
| Owner profile | C R U A | C R U(own-managed) | R U(self) | — | R |
| Tenant profile | C R U A | R(in own leases) | R(in own leases) | R U(self) | R |
| Partner profile | C R U A | R U(self) | — | — | R |
| Property | C R U A | C R U(own-managed) | C R U(own) | R(leased) | R |
| PropertyDocument | C R U A | C R U(own-managed) | C R U(own) | R(leased) | R |
| Identity/Photo Verification | R A(force) | R(own-managed) | C R(self/own) | C R(self) | R |
| Lease | C R U A | C R U(own-managed, pre-active) | C R U(own, pre-active) | R + sign(own) | R |
| LeaseDocument | C R U A | C R(own-managed) | C R(own) | R + sign(own) | R |
| Payment Schedule / Installment | R + adjust(write-off) | R(own-managed) | R(own) | R(own) | R |
| PaymentRecord | C R A(reverse) | C R(own-managed) | C R(own) | C R(own, self-pay) | R |
| AidatPlan | C R U A | C R U(own-managed) | C R U(own) | R(leased) | R |
| TenantRating | R A(force-retract) | R(own-managed) | C R A(own, within window) | R(about self) | R |

Conflict resolutions:
- Tenant can never edit Lease terms — only **sign**. Removes owner/tenant edit conflict.
- Both Owner and Partner can manage a Property; **Partner stewardship is delegated and revocable by Owner or Admin**; on conflict, Owner > Partner, Admin overrides all.
- Support is **read-only everywhere** (no write surface) to keep an unambiguous least-privilege boundary; escalations go to Admin.

---

## 8. Lifecycle Diagrams (state, text form)

**Property**
```
Draft → PendingVerification → LeaseReady → Leased → Vacant(LeaseReady) → Archived
            │                                  ▲        │
            └──(rejected)→ Draft               └────────┘ (lease ends → Vacant)
```
- Onboarding drives Draft→LeaseReady. Leased on Lease activation. Returns to Vacant(LeaseReady) at lease end. Archived only when no Active Lease/unsettled dues.

**Tenant**
```
Registered → IdentityPending → Verified → Active(leased) → Past → Archived
                    │
                    └──(failed)→ Registered
```

**Lease**
```
Draft → PendingSignatures → Active → Terminating → Ended → Archived
   │            │                          
   └──Cancelled └──Cancelled              (Active → Ended also on natural term end)
```
- Terms editable only in Draft/PendingSignatures. Cancelled allowed before Active. Ended is terminal (immutable terms).

**Payment (Installment)**
```
Scheduled → Due → Paid
              │ ├─ PartiallyPaid → Paid
              │ └─ Overdue → Paid | Waived | WrittenOff(Admin)
              └─ Waived
```
- Overdue is system-derived (Due + unpaid past grace). Paid/Waived terminal & immutable.

**Maintenance Fee (Aidat)**
```
AidatPlan: Draft → Active → Retired
Aidat obligations materialize as Installments (type=Aidat) → follow the Installment lifecycle above.
```

**Document (Property/Lease)**
```
Uploaded → PendingVerification → Verified → (Expired) → Archived
                 │
                 └──(rejected)→ Rejected → (re-upload) Uploaded
```

**Verification (Identity / Photo)**
```
Initiated → InProgress → Verified/Approved → (Expired)
                 │
                 └──(failed)→ Failed → (retry) Initiated
```

---

## 9. Database Planning (conceptual only — no SQL/ORM/migrations)

Future tables (one per aggregate root + child entities), primary ownership, and foreign-key intent.

| Table | Owns (context) | PK | Key FKs (conceptual) |
|-------|----------------|----|----------------------|
| `accounts` | IAM | accountId | partyId → (owner/tenant/partner) |
| `owners` | Party | ownerId | accountId, partnerId? |
| `tenants` | Party | tenantId | accountId |
| `partners` | Party | partnerId | accountId |
| `properties` | Property | propertyId | ownerId, partnerId? |
| `property_onboardings` | Property | onboardingId | propertyId (1:1) |
| `property_documents` | Property | documentId | propertyId |
| `leases` | Leasing | leaseId | propertyId, tenantId, ownerId(frozen) |
| `lease_documents` | Leasing | documentId | leaseId |
| `aidat_plans` | Billing | aidatPlanId | propertyId |
| `payment_schedules` | Billing | scheduleId | leaseId (1:1) |
| `installments` | Billing | installmentId | scheduleId, type(Rent/Aidat) |
| `payment_records` | Billing | paymentRecordId | leaseId |
| `payment_allocations` | Billing | allocationId | paymentRecordId, installmentId |
| `identity_verifications` | Verification | identityVerificationId | partyId |
| `photo_verifications` | Verification | photoVerificationId | propertyId? / tenantId? + leaseId? |
| `tenant_ratings` | Reputation | ratingId | tenantId, leaseId, authorOwnerId |

Ownership rules:
- Each table is written by exactly one context; others read via id (no cross-context writes).
- Child rows (`installments`, `*_documents`, `property_onboardings`) are owned by their aggregate root and never referenced as roots elsewhere.
- `payment_allocations` is the many-to-many bridge between records and installments.
- No physical schema, indexes, or engine choice decided here.

---

## 10. Module Roadmap (safe implementation order)

Each module depends only on already-completed modules. (`health`, `auth` already exist.)

1. **IAM / Account** (extends existing `auth`) — accounts + role binding. Depends on: auth.
2. **Party: Owner** — owner profiles. Depends on: IAM.
3. **Party: Tenant** — tenant profiles. Depends on: IAM. *(existing `tenant` scaffold to be reconciled into this model.)*
4. **Party: Partner** — partner profiles + owner stewardship. Depends on: IAM, Owner.
5. **Verification** — identity + photo workflows. Depends on: Party.
6. **Property** — registry. Depends on: Owner, Partner.
7. **Property Documents** — title/property evidence. Depends on: Property, Verification.
8. **Property Onboarding** — orchestrates Property + Documents + Verification to `LeaseReady`. Depends on: 6,7,5.
9. **Lease** — core binding. Depends on: Property(LeaseReady), Tenant, Owner.
10. **Billing: AidatPlan + Rent terms** — fee/rent definitions. Depends on: Property, Lease.
11. **Billing: Payment Schedule + Installments** — generated from Lease. Depends on: 9,10.
12. **Billing: Payment Records + Payment Status** — settlement. Depends on: 11.
13. **Reputation: Tenant Rating** — depends on: Lease (Ended/Active).

Critical path (Core): 6 → 8 → 9 → 11 → 12. Reputation (13) is last and isolated.

---

## Validation Audit (issues found & resolved)

- **Account vs Party overload** → resolved by separating `Account` (IAM login) from business `Party` profiles (1:1).
- **"Payment" overload** (obligation vs event) → split into `Installment` and `PaymentRecord` + `payment_allocations` bridge.
- **"Verification" ambiguity** → always qualified Identity/Photo; modeled as its own Supporting context.
- **Aidat ownership ambiguity** (property vs lease) → `AidatPlan` owned at Property level; the Lease assigns *responsibility* (Owner/Tenant); obligations materialize as Aidat `Installments` in the Lease's Schedule.
- **Owner mutation affecting active leases** → Owner identity is **frozen onto the Lease at activation**.
- **Dual Property control (Owner + Partner)** → precedence Admin > Owner > Partner; stewardship revocable.
- **Missing single-active-lease guarantee** → invariant on Property; checked by Leasing at activation.
- **Rating authorship conflict** → only the Lease's Owner may author; one per (Tenant, Lease); immutable once Published.
- **Hard-delete risk** → all parties/properties Archive-only, blocked while Active Lease / unsettled dues exist (audit + financial integrity).
- **Out-of-scope drift** → no Building/Apartment hierarchy, Notifications, or AI domains introduced (not in allowed list); Property is the atomic unit.
- **Existing `tenant` scaffold** (current code) is a placeholder and must be **reconciled** into the Party:Tenant model in roadmap step 3 — flagged, not silently overwritten.

This blueprint is the authoritative domain model for all subsequent KiraPass OS implementation phases.

---

# ENTERPRISE DDD EXTENSION

The sections below extend the blueprint to enterprise grade. They **add precision
without changing any existing business rule, invariant, lifecycle, or
authorization decision** above. Where an existing rule is referenced, it is
restated as-is, not modified.

---

## 11. Value Objects

Immutable, identity-less, self-validating concepts. Replacing the listed
primitives removes primitive obsession across the model. Each Value Object (VO)
is equality-by-value and may only exist inside an aggregate or another VO.

| Value Object | Replaces (primitive) | Holds / validates | Used by |
|--------------|----------------------|-------------------|---------|
| **PartyId / PropertyId / LeaseId / …** (typed identifiers) | bare `string` ids | non-empty, context-prefixed identity; type-distinct so a TenantId can never be passed where an OwnerId is required | all aggregates & references |
| **Money** | `number` amount | amount (non-negative where required) + Currency (TRY default); arithmetic closed over same currency | Rent, Aidat, Installment, PaymentRecord, AidatPlan |
| **Currency** | `string` | ISO-style code; whitelist (TRY) | Money |
| **DateRange (LeaseTerm)** | two `Date` fields | `start < end`; supports contains/overlaps | Lease term, schedule windows |
| **DueDate** | `Date` | a date plus grace window; derives Overdue boundary | Installment |
| **NationalId (TCKN)** | `string` | format/length + checksum shape (identity reference) | Owner, Tenant, IdentityVerification |
| **PhoneNumber** | `string` | E.164-style normalization | Owner, Tenant, Partner |
| **EmailAddress** | `string` | syntactic validity, normalized casing | Account, parties |
| **IBAN** | `string` | country + length + check-structure (no bank call) | Owner payout, PaymentRecord |
| **RatingScore** | `number` | integer in [1..5] | TenantRating |
| **VerificationResult** | `string`/enum scattered | outcome (Verified/Failed/Approved/Rejected) + issuedAt + expiresAt | Identity/Photo Verification |
| **DocumentRef** | loose file fields | storage handle + content type + checksum (evidence integrity) | PropertyDocument, LeaseDocument |
| **PaymentStatus** | `string` | the canonical status enum (§ Ubiquitous Language) with legal transitions only | Installment |
| **AidatResponsibility** | `string` | exactly {Owner, Tenant} | Lease, Aidat Installment |
| **PercentageShare** (reserved) | `number` | 0–100; reserved for future partner commission, not yet a rule | Partner relationship (future) |
| **AuditStamp** | scattered timestamps | createdAt / updatedAt / actorRef for archival & immutability audit | every aggregate root |

Rule: aggregates expose typed VOs, never raw primitives, at their boundaries.
VOs carry validation; aggregates carry invariants that span multiple VOs.

---

## 12. Domain Events

Past-tense facts emitted by an aggregate root after a successful state change.
Events are **notifications of fact**, carry only ids + minimal VO payload, and
never cross an aggregate boundary synchronously. (Eventing here is conceptual —
no transport, bus, or runtime mechanism is prescribed; this is **not** a runtime
plugin/DI feature.)

| Aggregate | Domain Event | Emitted when |
|-----------|--------------|--------------|
| Account | `AccountInvited`, `AccountActivated`, `AccountSuspended`, `AccountClosed` | IAM state transitions |
| Owner | `OwnerRegistered`, `OwnerVerified`, `OwnerArchived` | profile lifecycle |
| Tenant | `TenantRegistered`, `TenantVerified`, `TenantArchived`, `TenantRatingSummaryRecomputed` | profile lifecycle / derived summary refresh |
| Partner | `PartnerOnboarded`, `PartnerSuspended`, `PartnerArchived`, `OwnerStewardshipAssigned`, `OwnerStewardshipRevoked` | partner lifecycle & stewardship |
| IdentityVerification | `IdentityVerificationInitiated`, `IdentityVerified`, `IdentityVerificationFailed`, `IdentityVerificationExpired` | verification workflow |
| PhotoVerification | `PhotoVerificationSubmitted`, `PhotoVerificationApproved`, `PhotoVerificationRejected` | photo workflow |
| Property | `PropertyDrafted`, `PropertyVerificationCompleted`, `PropertyMarkedLeaseReady`, `PropertyLeased`, `PropertyVacated`, `PropertyArchived` | onboarding + lease coupling |
| PropertyDocument | `PropertyDocumentUploaded`, `PropertyDocumentVerified`, `PropertyDocumentRejected`, `PropertyDocumentExpired` | document lifecycle |
| Lease | `LeaseDrafted`, `LeaseSignaturesRequested`, `LeaseActivated`, `LeaseTerminating`, `LeaseEnded`, `LeaseCancelled` | lease lifecycle (Owner frozen at `LeaseActivated`) |
| LeaseDocument | `LeaseDocumentUploaded`, `LeaseDocumentSigned` | contract evidence |
| AidatPlan | `AidatPlanActivated`, `AidatPlanRetired` | fee definition |
| PaymentSchedule | `PaymentScheduleGenerated`, `PaymentScheduleClosed` | derived from `LeaseActivated` / all installments terminal |
| Installment | `InstallmentDue`, `InstallmentPaid`, `InstallmentPartiallyPaid`, `InstallmentOverdue`, `InstallmentWaived`, `InstallmentWrittenOff` | settlement transitions (Overdue system-derived) |
| PaymentRecord | `PaymentRecorded`, `PaymentConfirmed`, `PaymentReversed` | money movement |
| TenantRating | `TenantRatingPublished`, `TenantRatingRetracted` | reputation (immutable once published) |

Cross-context reactions (conceptual, eventually consistent):
- `LeaseActivated` → Property emits `PropertyLeased`; Billing reacts → `PaymentScheduleGenerated`.
- `LeaseEnded` → Property → `PropertyVacated`; Reputation enables rating window.
- `PaymentConfirmed` → recomputes affected `Installment` status.
- `TenantRatingPublished` / `TenantRatingRetracted` → `TenantRatingSummaryRecomputed`.

---

## 13. Domain Services

Stateless, pure domain logic that doesn't naturally belong to a single
aggregate (operates across VOs/aggregates by id). **Responsibility only — no
implementation, no I/O, no persistence.**

| Domain Service | Responsibility |
|----------------|----------------|
| **PaymentScheduleGenerator** | Translate a Lease's Rent terms + active AidatPlan + AidatResponsibility into the ordered set of Installments (pure calculation). |
| **OverdueEvaluator** | Given an Installment's DueDate (incl. grace) and PaymentStatus, decide whether it is Overdue. Deterministic, time-input explicit. |
| **PaymentAllocator** | Allocate a PaymentRecord's Money across one or more Installments of the same Lease, respecting allocation ≤ amount and same-lease constraint. |
| **LeaseActivationEvaluator** | Compose all activation preconditions (Property LeaseReady, Tenant Identity Verified, signed LeaseDocument, no competing Active Lease) into a single go/no-go. |
| **PropertyReadinessEvaluator** | Compose onboarding gates (Owner Identity Verified, ≥1 Verified title document, required Photo approved) into LeaseReady eligibility. |
| **TenantRatingSummarizer** | Recompute a Tenant's denormalized rating summary from Published ratings (derived value only). |
| **OwnerIdentityFreezer** | Capture the Owner identity snapshot to freeze onto a Lease at activation. |
| **ArchivalEligibilityEvaluator** | Decide whether a Party/Property may be Archived (no Active Lease, no unsettled Installment). |

Each maps directly to an existing business rule or invariant; none introduces new policy.

---

## 14. Policies

A Policy = "**when** X happens, **then** the domain must ensure Y." Policies
orchestrate reactions; they execute in response to a trigger (often a Domain
Event) and delegate decisions to Specifications/Domain Services. They change no
existing rule — they name *when* existing rules fire.

| Policy | Trigger (when) | Ensures (then) |
|--------|----------------|----------------|
| **ScheduleGenerationPolicy** | on `LeaseActivated` | a PaymentSchedule is generated (never before activation, exactly one per lease) |
| **PropertyOccupancyPolicy** | on `LeaseActivated` / `LeaseEnded` | Property transitions Leased ↔ Vacant(LeaseReady); single-active-lease invariant upheld |
| **OverdueTransitionPolicy** | on time passing a DueDate+grace while unpaid | Installment becomes Overdue (system-derived, never manual) |
| **PaymentReconciliationPolicy** | on `PaymentConfirmed` / `PaymentReversed` | affected Installment statuses recomputed via PaymentAllocator + OverdueEvaluator |
| **RatingEligibilityPolicy** | on `LeaseEnded` (or Active per existing rule) | opens the one-rating-per-lease window for the Lease's Owner |
| **RatingSummaryPolicy** | on `TenantRatingPublished` / `Retracted` | Tenant rating summary recomputed |
| **VerificationExpiryPolicy** | on verification `expiresAt` reached | Verification → Expired; dependent readiness/activation re-gated |
| **DocumentExpiryPolicy** | on document `expiresAt` reached | Document → Expired; Property readiness re-evaluated |
| **OwnerFreezePolicy** | on `LeaseActivated` | Owner identity snapshot frozen onto the Lease |
| **StewardshipReassignmentPolicy** | on Partner suspend/archive request | block while stewarding an Active-Lease Property until reassigned |
| **ArchivalGuardPolicy** | on archive request for Party/Property | block unless ArchivalEligibilityEvaluator passes |

---

## 15. Specifications

A Specification = a reusable, named predicate validating one invariant. They are
the *building blocks* Policies and Domain Services call. Each restates an
existing invariant; none adds new business meaning.

| Specification | Validates (invariant) |
|---------------|-----------------------|
| **PropertyIsLeaseReadySpec** | Owner Identity Verified ∧ ≥1 Verified title document ∧ required Photo Approved |
| **PropertyHasNoActiveLeaseSpec** | the Property has no other Active Lease |
| **TenantIsIdentityVerifiedSpec** | Tenant has an active Verified IdentityVerification |
| **OwnerIsIdentityVerifiedSpec** | Owner has an active Verified IdentityVerification |
| **LeaseDocumentIsSignedSpec** | a signed LeaseDocument exists for the Lease |
| **LeaseTermIsValidSpec** | DateRange start < end ∧ Rent Money > 0 ∧ AidatResponsibility ∈ {Owner,Tenant} |
| **LeaseIsActivatableSpec** | composition: LeaseReady ∧ TenantVerified ∧ DocumentSigned ∧ NoCompetingActiveLease |
| **InstallmentIsOverdueSpec** | DueDate + grace passed ∧ status ∈ {Due, PartiallyPaid} |
| **InstallmentIsImmutableSpec** | status ∈ {Paid, Waived} (no further mutation) |
| **AllocationIsValidSpec** | Σ allocations ≤ PaymentRecord amount ∧ all installments same Lease |
| **SingleActiveAidatPlanSpec** | at most one Active AidatPlan per Property |
| **RatingIsAuthorizedSpec** | author is the Lease's Owner ∧ no existing Published rating for (Tenant,Lease) ∧ score ∈ [1..5] |
| **PartyIsArchivableSpec** | no Active Lease ∧ no unsettled Installment for the Party |
| **ReferenceExistsAndActiveSpec** | a cross-context id reference targets an existing, non-archived aggregate |

---

## 16. Aggregate Consistency Rules

Audit of each aggregate for correct boundary, transactional consistency
(strong, inside the boundary) vs eventual consistency (across boundaries).

| Aggregate | Strongly-consistent (inside boundary) | Eventually-consistent (by id, across boundary) | Boundary verdict |
|-----------|----------------------------------------|------------------------------------------------|------------------|
| Owner | profile, payout IBAN, archived flag | identity verification result; properties owned | Correct |
| Tenant | profile, archived flag, rating **summary** (derived) | identity verification; leases; individual ratings | Correct — summary is read-model, recomputed via event |
| Partner | profile, stewardship list | owners/properties stewarded | Correct |
| Property | Property + Onboarding + Documents | Owner/Partner ids; leases; verification results | Correct — documents are children, never roots elsewhere |
| Lease | terms, signature state, frozen Owner snapshot, LeaseDocuments | Property/Tenant ids; Schedule (separate aggregate) | Correct — Schedule deliberately **excluded** to keep Lease small |
| PaymentSchedule | Schedule + Installments | Lease id; PaymentRecords | Correct — Installments are children of the Schedule, not the Lease |
| PaymentRecord | record + allocations | Installment ids | Correct — allocation references installments by id |
| AidatPlan | amount, frequency, active flag | Property id | Correct |
| IdentityVerification / PhotoVerification | workflow + result VO | Party/Property/Lease ids | Correct |
| TenantRating | score, comment, refs, published flag | Tenant/Lease/author ids | Correct |

Key consistency decisions (reaffirming existing model):
- **Lease and PaymentSchedule are separate aggregates** linked 1:1 by id — a Lease must stay small and stable; a Schedule changes frequently as installments settle. Updating an installment must never lock the Lease.
- **Installments belong to the Schedule, not the Lease** — prevents a large Lease aggregate.
- **Tenant rating summary** inside the Tenant aggregate is a *derived read value*, refreshed by `TenantRatingSummaryRecomputed`; the source of truth remains individual TenantRatings (eventual consistency, acceptable).
- **One transaction = one aggregate**: any operation spanning two aggregates is coordinated by a Policy reacting to a Domain Event, never a single locking transaction.

---

## 17. Future Scalability Review

Risks identified before implementation, with conceptual resolution (no rule
change).

- **Installment volume growth** (long leases × monthly Rent+Aidat) → Schedule is its own aggregate; Installments queried by Schedule/status, not embedded in Lease; status is a VO with bounded transitions. *Resolved by boundary, not by new rule.*
- **Verification provider coupling** (e-Devlet) → Verification is a Supporting context exposing a `VerificationResult` VO; the rest of the domain depends on the *result*, never the provider. Provider swap stays inside one context.
- **Multi-currency drift** → Money + Currency VOs in place now (TRY whitelist) so amounts are never bare numbers; widening currency later is a VO whitelist change, not a model change.
- **Partner commission / revenue share** (foreseeable) → reserved `PercentageShare` VO named but inert; no rule yet, avoids a future invasive refactor.
- **Reputation read amplification** → ratings are isolated in Reputation; the Tenant summary is a denormalized read-model fed by events — read scaling without coupling.
- **Cross-context chatty reads** → standardized on id-reference + `ReferenceExistsAndActiveSpec` at creation time; no synchronous object graphs across contexts.
- **Temporal correctness of Overdue** → OverdueEvaluator takes time as explicit input (deterministic), avoiding hidden `now()` coupling and easing reproducibility.
- **Property atomicity vs future building hierarchy** → explicitly out of scope; Property remains the atomic unit. If a hierarchy is ever authorized, it enters as a new context above Property, not by mutating Property.

Conceptual coupling resolved: Billing depends on Leasing **one-way** (Conformist); Reputation depends on Leasing **one-way**; Verification is depended-upon but depends on no one. No cyclic context dependencies exist.

---

## 18. Domain Integrity Audit (final pass)

- **Duplicated concepts** → none remaining. `Account`/`Party` separated; `Payment` split into `Installment`/`PaymentRecord`; `Verification` always qualified; rating lives only in Reputation (the in-code `tenant.rating` scaffold is flagged for reconciliation, not a second source of truth).
- **Hidden dependencies** → Owner-on-Lease made explicit via frozen snapshot; Overdue made explicit via time-input service; cross-context links made explicit via typed ids + existence spec. No implicit `now()`, no provider leakage.
- **Lifecycle conflicts** → Property ↔ Lease occupancy coupling governed by one policy (`PropertyOccupancyPolicy`) so both lifecycles can't disagree; Schedule closes only after all Installments terminal; Verification/Document expiry re-gates readiness rather than silently invalidating an Active Lease.
- **Authorization conflicts** → Tenant signs but never edits Lease terms; Admin > Owner > Partner precedence on Property; Support read-only everywhere; rating authorship restricted to the Lease's Owner. No overlap grants write to two roles ambiguously.
- **Ownership ambiguity** → each table/aggregate has exactly one writing context (§16); Aidat ownership (Property-level plan, Lease-level responsibility) restated, not changed; Installments owned by Schedule; documents owned by their parent aggregate.
- **Terminology inconsistencies** → all new sections use the §1 Ubiquitous Language verbatim (Installment, PaymentRecord, PaymentStatus, AidatResponsibility, LeaseReady, Active Lease). No synonym introduced.

No existing business rule, invariant, lifecycle, authorization entry, or
relationship from §1–§10 was altered by this extension. Sections §11–§18 add
modeling precision only.

This document is the permanent Single Source of Truth for KiraPass OS.

---

# FINAL ENTERPRISE ARCHITECTURE AUDIT

Architectural hardening only. **No business rule, invariant, lifecycle,
authorization entry, or feature is added or changed.** Sections §19–§26 classify,
verify, and risk-assess the model defined in §1–§18 before implementation.

---

## 19. Core / Supporting / Generic / Infrastructure Separation

Explicit responsibility tiers. This drives investment, ownership, and where
complexity is allowed to live.

| Tier | Contexts / concerns | Why this tier | Implementation posture |
|------|---------------------|---------------|------------------------|
| **Core Domain** (differentiator) | **Leasing**, **Billing** | The lease lifecycle and rent/aidat settlement are KiraPass's reason to exist; highest invariant density. | Richest model; most tests; never outsourced; changes only via domain review. |
| **Core-adjacent** | **Property** (incl. Onboarding) | The rentable asset and its readiness gate the Core; not the differentiator but on the critical path. | Rich model; guards LeaseReady invariant. |
| **Supporting Domain** | **Party** (Owner/Tenant/Partner), **Reputation** (Tenant Rating) | Necessary to operate, specific to KiraPass, but not the competitive edge. | Moderate model; stable contracts. |
| **Generic Subdomain** | **IAM / Access**, **Verification** (Identity/Photo) | Solved problems; could be backed by external providers (e-Devlet, auth). | Thin domain wrapper over a provider result; depend on the *result VO*, not the provider. |
| **Infrastructure (NON-domain, out of model)** | persistence, transport, file storage, event delivery, clock, ID generation, the existing Clean-Architecture/plugin/registry runtime | Pure technical concerns; must never leak into domain language. | Lives entirely outside aggregates; injected as primitives/results at the boundary. The existing static plugin/registry/discovery stack is Infrastructure and is **unchanged**. |

Boundary rule: Core may depend (one-way, by id/result) on Supporting and Generic;
**Generic and Infrastructure must never depend on Core**. Verification, IAM,
clock, storage know nothing about Lease or Payment.

---

## 20. Bounded-Context Ownership Verification

DDD ownership check: each context is the **single writer** of its data; every
other context holds read-only id references. ✓ = verified, no violation.

| Context | Sole-writer of | Reads (by id) | Ownership verdict |
|---------|----------------|---------------|-------------------|
| IAM | Account, role binding | — | ✓ no inbound domain deps |
| Party | Owner, Tenant, Partner | Account, VerificationResult | ✓ |
| Verification | Identity/Photo Verification | Party/Property/Lease ids | ✓ depends on no Core |
| Property | Property, Onboarding, PropertyDocument | Owner/Partner ids, VerificationResult | ✓ |
| Leasing | Lease, LeaseDocument | Property/Tenant/Owner ids | ✓ |
| Billing | AidatPlan, PaymentSchedule, Installment, PaymentRecord, allocations | Lease/Property ids | ✓ Conformist to Leasing |
| Reputation | TenantRating | Tenant/Lease/author ids | ✓ isolated |

No context writes another context's data. No shared mutable entity. Tenant
rating **summary** is a Party-owned read-model fed by Reputation events — not a
co-write (eventual consistency, already declared). **Verified.**

---

## 21. Aggregate Invariant-Ownership Verification

Every invariant must be enforceable **inside exactly one aggregate boundary**
(or by a Policy reacting to an event when it spans boundaries). Audit:

| Invariant | Enforcing aggregate / mechanism | Self-contained? |
|-----------|-------------------------------|-----------------|
| ≤1 Active Lease per Property | Property state + `PropertyHasNoActiveLeaseSpec` checked by Leasing at activation | Cross-boundary → handled by `LeaseActivationEvaluator` + occupancy policy ✓ |
| Lease activatable only when ready | Lease (root) via `LeaseIsActivatableSpec` | ✓ composed inside Lease activation |
| Lease terms frozen Active / immutable Ended | Lease | ✓ in-boundary |
| Owner identity frozen at activation | Lease (snapshot held) | ✓ in-boundary after `OwnerIdentityFreezer` |
| Schedule = 1 per Lease, post-activation only | Billing via `ScheduleGenerationPolicy` | ✓ policy-gated |
| Schedule reconciles with Lease+Aidat terms | PaymentSchedule | ✓ in-boundary |
| Installment Paid/Waived immutable | PaymentSchedule (Installment child) | ✓ in-boundary |
| Allocation ≤ amount, same-lease | PaymentRecord via `AllocationIsValidSpec` | ✓ in-boundary |
| ≤1 Active AidatPlan per Property | Billing via `SingleActiveAidatPlanSpec` | ✓ in-boundary |
| 1 Published rating per (Tenant,Lease), Owner-authored, [1..5] | TenantRating via `RatingIsAuthorizedSpec` | ✓ in-boundary |
| Archive blocked while Active Lease / unsettled dues | Party/Property via `ArchivalGuardPolicy` | Cross-boundary → policy ✓ |

Finding: the only invariants that are **not** purely in-boundary (single-active-lease,
archival eligibility) are explicitly delegated to Policies/Evaluators reacting to
events — which is the correct DDD treatment. **No orphan invariant; no aggregate
asserting another aggregate's rule synchronously.** Verified.

---

## 22. Value-Object Primitive-Obsession Verification

Check: every domain-meaningful primitive at an aggregate boundary is wrapped.

| Former primitive | Wrapped by | Boundary now clean? |
|------------------|-----------|---------------------|
| `string` id | typed ids (PartyId/PropertyId/LeaseId/…) | ✓ type-distinct |
| `number` money | Money + Currency | ✓ no bare amounts |
| `Date` pair | DateRange / LeaseTerm | ✓ |
| `Date` due | DueDate (+grace) | ✓ |
| TCKN/phone/email/IBAN `string` | NationalId / PhoneNumber / EmailAddress / IBAN | ✓ validated VOs |
| status `string` | PaymentStatus, VerificationResult, AidatResponsibility | ✓ bounded enums-as-VO |
| rating `number` | RatingScore [1..5] | ✓ |
| scattered timestamps | AuditStamp | ✓ |
| file fields | DocumentRef (handle+type+checksum) | ✓ |

Residual primitive-obsession risks (flagged, not yet rules):
- **Grace period** currently lives inside DueDate — acceptable, but if grace becomes policy-configurable per Partner/Country it should graduate to its own `GracePolicy` VO. Noted in risk report.
- **Frequency** of AidatPlan/Rent is implied; recommend an explicit `RecurrenceSchedule` VO when Billing is implemented to avoid a raw enum/number. Noted.

Otherwise **no primitive crosses an aggregate boundary unwrapped.** Verified.

---

## 23. Expanded Domain Event Catalog

Conceptual contract per event. (Eventing remains conceptual — no bus/runtime
mechanism is prescribed; the existing static architecture is unchanged.)
Ordering is **per-aggregate-instance** (a monotonic sequence on the publishing
aggregate); there is **no global order**. Idempotency key = `(eventType,
aggregateId, aggregateSequence)`. Versioning is additive (new optional fields →
minor; breaking shape → new `vN` event type, both emitted during migration).

| Event | Publisher | Consumers | Trigger | Ordering guarantee | Versioning | Idempotency |
|-------|-----------|-----------|---------|--------------------|-----------|-------------|
| `IdentityVerified` | Verification | Party, Property(readiness), Leasing(gate) | provider result Verified | after `...Initiated` on same verification | additive | by verificationId+seq |
| `PhotoVerificationApproved` | Verification | Property(readiness) | review approved | per verification | additive | by photoVerificationId+seq |
| `PropertyMarkedLeaseReady` | Property | Leasing | readiness gates pass | after onboarding events | additive | by propertyId+seq |
| `LeaseActivated` | Leasing | Property(occupancy), Billing(schedule), Reputation(window arming) | activation preconditions met | strictly after `LeaseDrafted`/`SignaturesRequested` | additive; **carries frozen Owner snapshot** | by leaseId+seq |
| `LeaseEnded` | Leasing | Property(vacate), Billing(close), Reputation(rating window) | term end / termination | after `LeaseActivated` | additive | by leaseId+seq |
| `PropertyLeased` / `PropertyVacated` | Property | Billing(read), reporting | reaction to lease events | per property | additive | by propertyId+seq |
| `PaymentScheduleGenerated` | Billing | reporting, Tenant/Owner views | reaction to `LeaseActivated` | once per lease (dedup on leaseId) | additive | by scheduleId+seq |
| `InstallmentDue` / `InstallmentOverdue` | Billing | notifications(future, out of scope), reporting | due date / grace boundary (time-derived) | per installment, monotonic | additive | by installmentId+seq+statusTransition |
| `PaymentConfirmed` | Billing (PaymentRecord) | Billing(Installment recompute), reporting | record confirmed | after `PaymentRecorded` | additive | by paymentRecordId+seq |
| `PaymentReversed` | Billing | Installment recompute | reversal issued | strictly after `PaymentConfirmed` | additive | by paymentRecordId+seq |
| `TenantRatingPublished` / `Retracted` | Reputation | Party(summary recompute) | rating published/retracted | per rating | additive | by ratingId+seq |
| `TenantRatingSummaryRecomputed` | Party | Tenant views, reporting | reaction to rating events | per tenant (latest-wins) | additive; latest-wins idempotent | by tenantId+computedAt |

Cross-cutting event rules:
- **Consumers are idempotent**: re-delivery of the same `(eventType,aggregateId,seq)` is a no-op.
- **No global ordering dependency**: a consumer needing causal order keys off the
  publishing aggregate's sequence; cross-aggregate causality (e.g. LeaseActivated→
  ScheduleGenerated) is established by the consumer treating the upstream event id
  as a precondition, not by a global clock.
- **Latest-wins** events (summaries/derived read-models) tolerate out-of-order
  delivery by comparing `computedAt`.
- Events carry **ids + minimal VO payload only** — never whole aggregates.

---

## 24. Scalability Review (final)

| Axis | Conceptual readiness | Resolution / what to preserve |
|------|----------------------|-------------------------------|
| **Multi-Partner** | Ready | Partner is a first-class Party with revocable stewardship; Owner can be partner-less. A Property's writer set = {Owner, its Partner steward, Admin}. To scale: stewardship is data, not structure; reserved `PercentageShare` anticipates commission without refactor. **Risk:** partner-level data isolation/tenancy boundary is **not yet modeled** (see risk R-1). |
| **Multi-Country** | Partially ready | NationalId/IBAN/Phone are VOs that can carry a country discriminator; grace/recurrence/holiday rules are country-variant and should graduate to explicit Policy VOs before a second country (R-2). Property remains atomic; no geographic hierarchy introduced. |
| **Multi-Currency** | Ready (structurally) | Money+Currency VOs already prevent bare amounts; today TRY-whitelisted. Widening = whitelist change + per-context "no implicit cross-currency arithmetic" rule (already implied by Money closing over same Currency). |
| **Event-driven evolution** | Ready | §23 defines publisher/consumer/idempotency/versioning now, so moving from in-process policies to an async bus later is a transport swap, not a model change. Aggregate = one transaction; cross-aggregate = event — already the rule. |
| **CQRS readiness** | Ready | Write model = aggregates with invariants; read concerns (Tenant rating summary, schedules/overdue dashboards, property/lease views) are already framed as **derived read-models fed by events**. Command/query separation is therefore additive, not a redesign. **Caveat:** no read-model is yet named as a formal projection (R-3). |

The existing static runtime architecture (Clean Architecture, plugin registry,
discovery, ESLint guards) is unaffected — none of the above implies dynamic
loading, DI, reflection, or filesystem scanning.

---

## 25. Bounded-Context Dependency Matrix

Direction = "row depends on column" (by id reference / event consumption).
`→` allowed dependency, `·` none, `(e)` event-driven (eventual), `(r)` id-read.

| depends ↓ / on → | IAM | Party | Verification | Property | Leasing | Billing | Reputation |
|------------------|-----|-------|--------------|----------|---------|---------|------------|
| **IAM** | — | · | · | · | · | · | · |
| **Party** | (r) | — | (r/e) | · | · | · | (e) summary |
| **Verification** | · | (r) | — | (r) | (r) | · | · |
| **Property** | · | (r) | (r/e) | — | (e) occupancy | · | · |
| **Leasing** | · | (r) | (r) | (r/e) | — | · | · |
| **Billing** | · | · | · | (r) | (r/e) | — | · |
| **Reputation** | · | (r) | · | · | (r/e) | · | — |

Cycle check: dependency edges flow IAM ← Party ← Verification/Property ←
Leasing ← Billing, with Reputation depending on Leasing/Party only. **No
context-level cycle.** Verification is depended-upon but depends on no Core
(correct for a Generic subdomain). Billing is a strict downstream Conformist of
Leasing. **Acyclic — verified.**

One asymmetry to watch: **Party ⇄ Verification** appears bidirectional (Party
reads Verification result; Verification reads Party id to attach). This is **not**
a true cycle — Verification references Party only as a target id and emits a
result; Party consumes the result event. No synchronous mutual dependency.
Documented to prevent a future implementer from collapsing them. (R-4)

---

## 26. Final Architectural Risk Report

Remaining weaknesses to resolve **during** implementation (none block the model;
each has an owner-context and a trigger point). Severity: H/M/L.

| ID | Risk | Sev | Where it bites | Mitigation (deferred, no rule change now) |
|----|------|-----|----------------|-------------------------------------------|
| **R-1** | **Tenancy/data-isolation boundary for Multi-Partner is unmodeled.** Stewardship governs *control*, but not data partitioning/visibility between competing Partners. | **H** | First time two Partners coexist with overlapping support staff. | Introduce a `TenancyScope`/visibility rule in IAM+Party before onboarding a 2nd Partner; do not retrofit per-query. |
| **R-2** | **Country-variant rules (grace, recurrence, holidays, ID/IBAN formats) are implicit.** | M | First non-TR country. | Graduate Grace/Recurrence to explicit Policy VOs; add Country discriminator to NationalId/IBAN. |
| **R-3** | **Read-models/projections are described but not formally named.** CQRS-ready but no projection catalog. | M | When dashboards (overdue, schedule, ratings) are built. | Add a "Projections" appendix listing each read-model, its source events, and latest-wins/replay rules. |
| **R-4** | **Party⇄Verification could be miscollapsed into a cycle** by an implementer. | L | During Verification module build. | Keep result-by-event; never let Verification import Party logic or vice-versa. |
| **R-5** | **Overdue correctness depends on an external time input.** Determinism relies on time being injected, not read ambiently. | M | Billing implementation + tests. | Time is an Infrastructure input to OverdueEvaluator; forbid ambient `now()` in domain (lint-guard candidate). |
| **R-6** | **Eventual consistency on Tenant rating summary** means transient staleness after publish/retract. | L | Reputation + Party views. | Acceptable by design; surface "as-of" timestamp in read-model; never gate authorization on the summary. |
| **R-7** | **In-code `tenant` (and `landlord`) scaffolds diverge from this model** (embedded `rating`, party shape). | M | Roadmap step 3 (Party:Tenant). | Reconcile/replace scaffolds against Party + Reputation; do not build features on them. |
| **R-8** | **Money has no rounding/precision policy yet.** | M | First real Rent/Aidat calculation & allocation. | Define minor-unit integer storage + rounding policy inside Money before Billing math. |
| **R-9** | **No archival/retention duration policy** for expired Documents/Verifications (kept for audit, but unbounded). | L | Compliance review. | Add retention windows when Verification/Documents are implemented. |
| **R-10** | **PaymentSchedule regeneration on mid-lease term change is undefined** (terms are frozen at Active, so this is currently prevented — but early Termination's effect on remaining Installments needs an explicit settlement rule). | M | Lease Termination + Billing. | On `LeaseTerminating`, define remaining-Installment disposition (Waive/WriteOff/prorate) as a Billing policy. |

Audit conclusion: the domain model is **structurally sound and acyclic**, Core is
clearly isolated, every aggregate owns or correctly delegates its invariants, and
no primitive crosses a boundary unwrapped. The ten risks above are
**implementation-time hardening items**, not model defects — R-1 (multi-partner
isolation) and R-8/R-10 (money precision & termination settlement) are the
highest-leverage to resolve first when their contexts are built.

End of Final Enterprise Architecture Audit. No business rule was modified;
§19–§26 are classification, verification, and risk analysis only.
