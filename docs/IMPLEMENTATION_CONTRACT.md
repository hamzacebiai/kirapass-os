# KiraPass OS — Implementation Contract (Implementation Constitution)

Status: **Final governance document before production coding. No code, no
runtime change.** Authority chain (highest first): DOMAIN_BLUEPRINT.md (frozen) →
APPLICATION_BLUEPRINT.md → RECONCILIATION_PLAN.md → this contract. Where any
ambiguity arises during implementation, the higher document wins; this contract
governs *how* code is written, never *what the domain means*.

This document binds all future implementation. Violations are defects regardless
of whether code compiles or tests pass.

---

## 1. Development Principles

**Coding philosophy**
- Explicit over implicit. Static over dynamic. Deterministic over clever.
- Code reads like the surrounding code: match existing naming, structure, and the established `routes → controller → service` flow.
- The Domain owns meaning; the Application owns coordination; Infrastructure owns mechanics. No layer reaches outside its responsibility.

**Simplicity rules**
- Smallest change that satisfies the requirement. No speculative abstraction (no "we might need it").
- One concept = one place. No duplicated business rule, type, or constant.
- An abstraction is justified only by ≥2 concrete present-day uses, never a hypothetical future one.

**Zero technical-debt policy**
- No `TODO`-as-debt merged without a tracked entry in the relevant blueprint risk register (e.g. Domain §26 R-IDs).
- No commented-out code, no dead exports, no placeholder logic in production modules (legacy scaffolds are the only sanctioned placeholders, already frozen).
- Primitive obsession is debt: domain-meaningful values cross aggregate boundaries as Value Objects (Domain §11), never raw primitives.

**Backward compatibility policy**
- Public API (`/api/**`) and response shapes are stable. A change to either is a **breaking change** and follows §1 Change Management of the CTO charter: stop, document why/impact/migration, obtain approval.
- Internal types/structure may change freely if public behavior is byte-identical.

**Incremental delivery policy**
- One module at a time, completed end-to-end (Definition of Done §9) before the next begins.
- Every commit leaves the system compiling, linting clean, and runnable. No partially-implemented module is merged.

---

## 2. Folder Ownership Rules (apps/api/src)

Ownership = the single concern responsible for a folder. Dependencies are
"allowed to import from."

| Folder | Owner / concern | Allowed dependencies | Forbidden dependencies |
|--------|-----------------|----------------------|------------------------|
| `server/` | Boot only | `app.ts`, `config/` | modules, routes internals, express setup |
| `app.ts` | Composition root | `config/`, `middleware/`, `routes/index` | any feature module directly |
| `config/` | Env + constants | (none internal) | express, modules, middleware |
| `middleware/` | Cross-cutting HTTP infra | express types only | modules, domain, services |
| `routes/index.ts` | Aggregator (consumer) | `modules/discovery` only | feature modules, `registry` directly |
| `modules/registry.ts` | Static truth | `create-plugin`, each module's `routes`, `plugin-contract` | controllers/services of modules |
| `modules/discovery.ts` | Read-only resolver | `registry`, `plugin-contract` | feature internals |
| `modules/create-plugin.ts` | Plugin factory | `plugin-contract` | modules |
| `modules/plugin-contract.ts` | Plugin types | express type (`Router`) | modules, domain |
| `modules/<feature>/routes.ts` | Wiring | own `controller` | other modules, services of others, domain of others |
| `modules/<feature>/controller.ts` | HTTP req/res | own `service`, own `types` | business logic, config, other modules |
| `modules/<feature>/service.ts` | Business logic (per current architecture) | own `types`, own domain, `config` (values only) | express, req/res, other modules, repositories of others |
| `modules/<feature>/domain/` (future) | Aggregates, VOs, specs, domain services | own VOs/types | express, infrastructure, other contexts |
| `modules/<feature>/types.ts` | DTO/domain shapes | own VOs | logic |

A feature module is a closed unit: it may import only its own files plus the
shared plugin/config primitives. **No module imports another module.**

---

## 3. Dependency Rules

**Allowed layer communication (one direction, downward):**
```
server → app → routes/index → discovery → registry → module.routes
       → controller → service → (domain: aggregate/VO/spec/domain-service)
                              → repository abstraction (future) → infrastructure
```

**Forbidden directions (hard):**
- Domain → Application, Application → never imported by Domain.
- Domain/Service → Infrastructure concretes (talk to abstractions/results only).
- Any module → another feature module (cross-module import).
- `routes/index.ts` → feature module or `registry` directly (discovery only).
- Service / domain → express (`Request`/`Response`/`Router`).
- Any file → `process.env` except `config/env.ts`.
- Any router mounted anywhere except via `registry` → `discovery` → aggregator.

**Anti-corruption boundaries:**
- Cross-context data enters only as **id references** or **result Value Objects** (e.g. `VerificationResult`), never as a foreign aggregate.
- External providers (e-Devlet, auth) are wrapped: the domain consumes a result VO, never the provider's shape. The wrapper is the ACL.
- The frozen-Owner snapshot on Lease (Domain §16) is the canonical anti-corruption copy pattern: capture needed data at the boundary moment; do not reference live across contexts.

---

## 4. Module Creation Contract (identical for every future module)

Every new module MUST satisfy this checklist before registration:

**Required files** (under `modules/<feature>/`):
- `routes.ts` — wiring only, `export default` an express `Router`.
- `controller.ts` — req/res mapping → service; no business logic.
- `service.ts` — business logic; no express.
- `types.ts` — DTOs/shapes (+ a `domain/` folder for aggregates/VOs/specs when the module implements an aggregate).

**Required naming:**
- Folder = the blueprint context/aggregate name in lowercase (`owner`, `tenant`, `lease`, …); never legacy synonyms ("landlord").
- Endpoints use the blueprint resource term (`/api/owners`, not `/api/landlords`).
- Exports named per role (`<feature>Controller`, `list<Feature>`, `get<Feature>`).

**Required plugin registration:**
- Construct exactly via `createPlugin({ name, version, router })` (frozen factory; `Object.freeze` enforced).
- `name` added to the `PluginName` union (manual, type-checked).
- Registered **only** in `modules/registry.ts`; never mounted elsewhere.

**Required tests** (see §7): unit (service/VO), aggregate (invariants), architecture (guard) — present and passing before merge.

**Required documentation** (see §8): a module `README.md` mapping it to its blueprint context/aggregate, its use cases, and its public endpoints.

A module that misses any item is not "done" and must not be registered.

---

## 5. Aggregate Implementation Rules

- **Aggregate root is the only entry point** to its internals; child entities (Installments, Documents, Onboarding, allocations) are reached and persisted only through their root (Domain §16; Application §6).
- **Invariants are enforced inside the aggregate** (or by a Specification the aggregate calls). The Application Layer may *evaluate* a Specification for early rejection, but the authoritative guard re-runs inside the aggregate's transaction.
- **Validation placement:**
  - Shape/format validation → Value Object construction at the Application boundary.
  - Business invariants → aggregate + Specifications.
  - Authorization → Application Layer against Domain §7 matrix (never inside the aggregate).
- **One aggregate = one transaction.** Cross-aggregate effects happen via Domain Events after commit (eventual). No multi-aggregate write transaction.
- **Forbidden patterns:** anemic aggregates with logic in services; setters that bypass invariants; cross-aggregate object references (use ids); business rules duplicated in controller/service; reading another aggregate to mutate it; ambient `now()` inside domain (time is an injected input — Domain R-5).

---

## 6. Domain Event Implementation Rules (governance, not implementation)

- **Naming:** past-tense fact, `<Aggregate><Happened>` (e.g. `LeaseActivated`). One event = one fact.
- **Versioning:** additive changes = same event, optional fields; breaking shape = new `vN` event type emitted alongside the old during migration. Never repurpose an event name.
- **Publication timing:** emitted **after** the publishing aggregate's transaction commits; never inside the write transaction.
- **Ordering:** per-aggregate-instance monotonic sequence; **no global order**. Cross-aggregate causality is established by the consumer treating an upstream event as a precondition.
- **Idempotency:** every consumer is idempotent; key = `(eventType, aggregateId, sequence)`. Derived read-models use latest-wins on `computedAt`.
- **Evolution strategy:** events carry ids + minimal VO payload only — never whole aggregates; payload growth is additive; consumers ignore unknown optional fields.
- Eventing remains **conceptual** at this stage — defining these rules now means a future move from in-process policies to an async transport is a swap, not a redesign. No event bus, DI, or dynamic mechanism is introduced.

---

## 7. Testing Strategy (mandatory levels — no test code here)

| Level | Scope | Mandatory for |
|-------|-------|---------------|
| **Unit** | Value Objects (validation), pure service functions, domain services | every module |
| **Aggregate** | invariants & lifecycle transitions enforced inside the root; specifications | every module implementing an aggregate |
| **Integration** | use-case orchestration across controller→service→(domain), event handling, transaction boundary | every Application use case with side effects |
| **Architecture** | ESLint guards (no express in service, no raw plugin literal, aggregator-via-discovery), registry/plugin integrity, no cross-module import, no circular deps | enforced repo-wide, every build |
| **Regression** | public API byte-identical for unchanged behavior; existing endpoints stable | every change |

Rules: a use case is untested if its invariants aren't covered at the aggregate
level. Architecture tests are non-negotiable gates. Regression baseline =
current validated endpoint responses.

---

## 8. Documentation Rules

Every module MUST contain:
- `README.md` — maps module → blueprint context + aggregate(s); lists owned use cases (Application §2), public endpoints, and emitted/consumed Domain Events.
- Inline aggregate/VO/spec doc-comments stating the invariant each enforces (traceable to a blueprint section).

Project-level living documents (must stay consistent with code):
- `DOMAIN_BLUEPRINT.md` (frozen), `APPLICATION_BLUEPRINT.md`, `RECONCILIATION_PLAN.md`, this contract, and `ARCHITECTURE_RULES.md`.
Any code change that affects a documented rule updates the document in the same change.

---

## 9. Definition of Done (feature complete only if ALL true)

- [ ] Maps to exactly one Domain concept + one Application use case; no new domain invented.
- [ ] Follows Module Creation Contract (§4): required files, naming, `createPlugin` registration in `registry.ts` only.
- [ ] Aggregate rules (§5) honored: invariants in aggregate, one-aggregate-per-transaction, authorization in Application Layer.
- [ ] Value Objects used at boundaries (no primitive obsession).
- [ ] Domain Events (if any) follow §6 (naming/timing/idempotency/versioning).
- [ ] Dependency & folder rules (§2–§3) respected; no cross-module/cross-context import; no forbidden direction.
- [ ] Tests present and passing at every mandatory level (§7), including architecture guards.
- [ ] `tsc --noEmit` clean; lint/arch-guard exit 0; server boots; affected + existing endpoints validated.
- [ ] No circular imports; registry/plugin integrity intact; plugins immutable.
- [ ] Public API/response shapes unchanged unless an approved breaking change (with migration) is documented.
- [ ] Module `README.md` present; affected living docs updated.
- [ ] No new technical debt, duplicated business rule, duplicated ownership, or hidden coupling introduced.

A feature failing any box is **not done**, regardless of compile/test status.

---

## 10. Implementation Roadmap Freeze

Order is **locked** (from Domain §10 + RECONCILIATION_PLAN §7). No module begins
before all its dependencies are complete and pass Definition of Done.

1. **IAM / Account** (extends `auth`) — deps: auth.
2. **Party : Owner** (`/api/owners`) — deps: IAM. *Retires `landlord` (BC-1, BC-3) at completion.*
3. **Party : Tenant** (correct shape, no embedded rating) — deps: IAM, Owner. *Retires `tenant` (BC-2, BC-3) at completion.*
4. **Party : Partner** + stewardship — deps: IAM, Owner.
5. **Verification** (Identity + Photo) — deps: Party. *Hardens #2/#3 referenced results.*
6. **Property** (registry) — deps: Owner, Partner.
7. **Property Documents** — deps: Property, Verification.
8. **Property Onboarding** — deps: 6, 7, 5.
9. **Lease** — deps: Property(LeaseReady), Tenant, Owner.
10. **Billing: AidatPlan + Rent terms** — deps: Property, Lease. *Resolve R-8 (Money precision).*
11. **Billing: Payment Schedule + Installments** — deps: 9, 10.
12. **Billing: Payment Records + Status** — deps: 11. *Resolve R-10 (termination settlement).*
13. **Reputation: Tenant Rating** — deps: Lease.

Critical path: 6 → 8 → 9 → 11 → 12. Reputation last. Legacy scaffolds remain
frozen until their replacement step (2/3) passes Definition of Done.

---

## 11. Architectural Guardrails (NEVER violate)

- Never invent or implement a feature outside DOMAIN_BLUEPRINT's allowed domain.
- Never modify the frozen Domain Blueprint (Ubiquitous Language, Contexts, Entities, Aggregates, VOs, Events, Services, Policies, Specs, Business Rules, Authorization, Lifecycles, Dependency Matrix).
- Never bypass an aggregate root to touch its internals.
- Never write across bounded contexts directly (id references / result VOs only).
- Never put business rules/invariants in controllers or the Application Layer.
- Never duplicate a business rule, type, constant, or ownership.
- Never span two aggregate roots in one transaction.
- Never construct a plugin except via `createPlugin()`; never mount a router outside `registry → discovery → aggregator`.
- Never bypass the static registry; never add runtime plugin discovery or filesystem scanning.
- Never introduce dynamic imports, reflection, decorators, or a dependency-injection framework.
- Never import express (`Request`/`Response`/`Router`) into a service or domain layer.
- Never read `process.env` outside `config/env.ts`; never hardcode config outside `config/`.
- Never import one feature module from another.
- Never use ambient `now()` in the domain — time is injected.
- Never change public API/response shapes without an approved, documented breaking change.
- Never build on the frozen legacy scaffolds.

These restate and consolidate ARCHITECTURE_RULES.md, the ESLint guard layer, and
the blueprint locks; they are enforced by tooling where possible and by review
otherwise.

---

## 12. Final Readiness Audit

Cross-document contradiction sweep (Domain Blueprint · Enterprise Audit ·
Application Blueprint · Reconciliation · this contract):

- **Terminology** → consistent. "Owner" is canonical everywhere; "landlord" appears only inside the frozen legacy scaffold and as a documented rename target (BC-1). No drift in this contract.
- **Roadmap order** → identical across Domain §10, Reconciliation §7, and §10 here. No conflict.
- **Aggregate/ownership** → folder ownership (§2) and dependency rules (§3) align with Domain §16 and Application §6; one-writer-per-context preserved.
- **Legacy reconciliation** → scaffolds frozen + marked; replacement gated to steps 2/3; breaking changes BC-1/2/3 registered and pending — no contradiction with "preserve stability."
- **Architecture locks** → guardrails (§11) match ARCHITECTURE_RULES.md and the active ESLint guards; nothing here loosens them.
- **Open risks** → R-1, R-2, R-3, R-5, R-7, R-8, R-10 remain *scheduled hardening items* with named trigger steps; none is a documentation contradiction, each is tracked. R-7 (scaffold divergence) is actively managed (frozen + planned replacement).

No remaining contradiction found; documentation is internally consistent.

### Declaration

**KiraPass OS is IMPLEMENTATION READY.**

The Domain is complete and frozen; the Application coordination model is
complete; legacy scaffolds are frozen and scheduled for in-order replacement;
the architecture is locked and tool-enforced; and this contract governs all
implementation. Coding may begin at **Roadmap Step 1 — IAM/Account**, under the
Definition of Done (§9) and Architectural Guardrails (§11).

No code, runtime, or architecture was modified by this document.
