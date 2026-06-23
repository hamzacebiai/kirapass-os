# KiraPass OS — Scaffold Reconciliation Plan

Status: **Planning only — no code modified.** Authority: DOMAIN_BLUEPRINT.md
(frozen) + APPLICATION_BLUEPRINT.md. Subject: the pre-blueprint in-code modules
`modules/tenant` and `modules/landlord`. Decision of record: *reconcile against
the blueprint before any new implementation; do not extend, delete, or build on
the scaffolds yet; preserve Clean Architecture, plugin registry, and public API
unless an approved breaking change is required.*

This document is the gap analysis + the sequenced reconciliation plan. The
scaffolds are hereby **FROZEN** (no edits, no new endpoints, no consumers) until
their roadmap step replaces them.

---

## 1. Method

Each scaffold field/behaviour is compared to its blueprint counterpart (Domain
§3–§5 entities/aggregates, §11 Value Objects, §16 consistency; Application §4–§6).
Gaps are classified: **T** terminology · **B** aggregate-boundary · **V**
value-object/primitive-obsession · **L** lifecycle · **D** dependency-order ·
**C** context-ownership · **A** public-API.

---

## 2. `modules/tenant` — Gap Analysis (vs Party:Tenant aggregate)

Current shape: `Tenant { id, fullName, nationalId, phone, email, verificationStatus, rating, active }`; reads `GET /api/tenants`, `GET /api/tenants/:id`; static in-memory data.

| # | Current | Blueprint says | Gap | Class |
|---|---------|----------------|-----|-------|
| T-1 | `rating: number` embedded on Tenant | Rating lives in **Reputation** as `TenantRating` per (Tenant, Lease); Tenant holds only a **derived rating summary** recomputed via `TenantRatingSummaryRecomputed` | Duplicated concept + wrong ownership (Risk R-7) | B |
| T-2 | `verificationStatus` inline string | Identity verification is its own **Verification** aggregate; Tenant references the **VerificationResult**, doesn't own the status | Aggregate-boundary leakage | B |
| T-3 | `id: string` | `TenantId` typed VO | Primitive obsession | V |
| T-4 | `nationalId/phone/email: string` | `NationalId` / `PhoneNumber` / `EmailAddress` VOs | Primitive obsession | V |
| T-5 | `active: boolean` | Lifecycle: Registered → Verified → Active → Past → Archived | Lifecycle collapsed to a flag | L |
| T-6 | no Account link | Tenant ↔ `Account` (IAM) 1:1 | Missing upstream identity | D |
| T-7 | standalone module | belongs to **Party** bounded context | Context placement (cosmetic; per-aggregate module is acceptable) | C |
| T-8 | `GET /api/tenants*` exists now | Tenant is roadmap step **3**, after IAM(1) + Owner(2) | Built out of dependency order | D |

## 3. `modules/landlord` — Gap Analysis (vs Party:Owner aggregate)

Current shape: `Landlord { id, fullName, nationalId, phone, email, iban, verificationStatus, active }`; reads `GET /api/landlords`, `GET /api/landlords/:id`.

| # | Current | Blueprint says | Gap | Class |
|---|---------|----------------|-----|-------|
| O-1 | term "Landlord" | Canonical term is **Property Owner / Owner** (Ubiquitous Language §1) | Terminology drift | T |
| O-2 | endpoint `/api/landlords` | Owner resource → `/api/owners` | API rename (breaking) | A |
| O-3 | `verificationStatus` inline | references **VerificationResult** (Verification context) | Boundary leakage | B |
| O-4 | `iban: string` | `IBAN` VO; semantics = payout account | Primitive obsession (mapping otherwise correct) | V |
| O-5 | `id/nationalId/phone/email: string` | typed VOs (`OwnerId`, `NationalId`, …) | Primitive obsession | V |
| O-6 | `active: boolean` | Lifecycle: Registered → Verified → Active → Archived | Lifecycle collapsed | L |
| O-7 | no Account link, no Partner stewardship ref | Owner ↔ Account (1:1); optional Partner steward | Missing relationships | D |
| O-8 | standalone module | **Party** context; Owner is roadmap step **2** | Out of order (precedes IAM) | D |

## 4. Cross-cutting findings

- **Both scaffolds embed `verificationStatus`** — the single most repeated boundary leak. Reconciled design: Verification context owns the workflow; Party aggregates hold a referenced/denormalized `VerificationResult` read value, never the authoritative status.
- **No repositories / persistence** in either (in-memory) — acceptable; aligns with "no DB yet." No leakage to fix there.
- **Registry/plugin integrity is correct**: both are registered via `createPlugin()` (frozen), discovered via the static registry — the *architecture* is compliant; only the *domain shape* and *ordering* are wrong.
- **No contradiction with Clean Architecture, plugin system, ESLint guards** — those stay frozen and are preserved.

---

## 5. Reconciliation Strategy

Principle: **replace-at-roadmap-step, not patch-now.** The scaffolds cannot be
correctly reconciled in isolation because their correct form depends on
unfinished upstream modules (IAM/Account, Verification). Patching them now would
create throwaway work and violate dependency order. Therefore:

1. **Freeze** `modules/tenant` and `modules/landlord` immediately (documented here; no new endpoints, no consumers, not used as a base for new modules).
2. **Build upstream first** in roadmap order: IAM/Account (#1) → Party:Owner (#2) → Party:Tenant (#3); Verification (#5) provides the result the Party aggregates reference.
3. **Replace, not mutate**: at step #2 the Owner module supersedes `landlord`; at step #3 the Tenant module supersedes `tenant`. The scaffold is removed only at the moment its replacement is ready and validated (so the system stays runnable and no endpoint silently breaks mid-flight).
4. Each replacement adopts the blueprint shape: typed-id + VO fields, lifecycle states (not booleans), Account link, referenced VerificationResult, and **no embedded rating** (Tenant carries a derived summary only).

This keeps "reconcile before new implementation" true in intent — the *plan and
freeze* happen first; the *aligned implementation* then proceeds in order and
absorbs the scaffolds at the correct step.

---

## 6. Breaking-Change Register (requires explicit approval before execution)

| BC | Change | Impact | Migration | Approval |
|----|--------|--------|-----------|----------|
| **BC-1** | Remove `landlord` module; introduce `owner` at `/api/owners` | `GET /api/landlords*` removed | superseded by `/api/owners` (richer Owner shape) at roadmap step #2 | **Pending** |
| **BC-2** | Replace `tenant` module shape; drop embedded `rating`; `verificationStatus` becomes referenced result | `GET /api/tenants*` response shape changes (no `rating`, lifecycle state instead of `active`) | rating moves to Reputation later; consumers read summary endpoint when built | **Pending** |
| **BC-3** | `PluginName` union edits (`"landlord"`→`"owner"`, retiming `"tenant"`) | internal type only; no runtime API | mechanical, covered by ESLint/tsc | **Pending (low risk)** |

No breaking change is executed until approved at its roadmap step. `health` and
`auth` are unaffected by all of the above.

---

## 7. Sequenced Plan (aligned to Domain §10 roadmap)

| Step | Action | Depends on | Touches scaffolds? |
|------|--------|-----------|--------------------|
| 0 | **This plan + freeze** (now) | — | documents only |
| 1 | Implement **IAM / Account** (extends `auth`) | auth | no |
| 2 | Implement **Party:Owner** (`/api/owners`); then retire `landlord` (BC-1, BC-3) | IAM | replaces `landlord` |
| 3 | Implement **Party:Tenant** (correct shape); then retire `tenant` scaffold (BC-2, BC-3) | IAM, Owner | replaces `tenant` |
| 4 | Implement **Party:Partner** + stewardship | IAM, Owner | no |
| 5 | Implement **Verification**; wire Owner/Tenant to referenced results | Party | hardens #2,#3 |
| 6+ | Continue roadmap: Property → Onboarding → Lease → Billing → Reputation (Reputation introduces `TenantRating` + summary) | per roadmap | no |

Each step compiles independently and runs full validation (tsc, lint, arch
guards, registry/plugin integrity, no circular imports, no domain leakage)
before the next begins. A scaffold is deleted only in the same step its
blueprint-aligned replacement passes validation.

---

## 8. Acceptance Criteria (architecture aligned)

Reconciliation is "done" when, per replaced module:
- No embedded rating on Tenant; rating is Reputation-owned (T-1 closed).
- Verification status is a referenced `VerificationResult`, not an owned field (T-2, O-3 closed).
- All boundary fields are VOs, not raw primitives (T-3/4, O-4/5 closed).
- Lifecycle is modelled as states, not a boolean (T-5, O-6 closed).
- Owner terminology + `/api/owners` in place; "landlord" removed from code and language (O-1, O-2 closed).
- Each aggregate links to Account; Owner carries optional Partner steward (T-6, O-7 closed).
- Modules built strictly in dependency order (T-8, O-8 closed).
- Clean Architecture, static registry, `createPlugin()`, discovery, ESLint guards unchanged throughout.

---

## 9. Immediate Status

- `modules/tenant`, `modules/landlord`: **FROZEN** (no edits, no new endpoints, not a base for new work).
- `health`, `auth`: unaffected, remain live.
- No code changed by this plan. Next action awaiting go: **roadmap step 1 — IAM/Account.**

Pending approvals: BC-1, BC-2, BC-3 (execute at steps #2/#3, not before).
