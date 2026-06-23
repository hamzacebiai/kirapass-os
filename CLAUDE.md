# CLAUDE.md — KiraPass OS Engineering Constitution

Canonical, auto-loaded engineering operating system for this repository. Exactly
ONE CLAUDE.md exists (repository root). It governs **engineering behaviour
only** and never defines business rules — those are owned solely by
`docs/DOMAIN_BLUEPRINT.md`.

> Before EVERY task, run the **Mandatory Pre-Task Workflow** below. Standing
> instructions live here; never ask the user to re-paste them.

---

## Mandatory Pre-Task Workflow (run before EVERY task — non-negotiable)

1. **Load `CLAUDE.md`** (this file).
2. **Load `docs/DOMAIN_BLUEPRINT.md`** (frozen business SSOT).
3. **Load ADRs** (`docs/adr/*` if present).
4. **Detect architectural conflicts** between the request and the Architecture
   Rules / Forbidden Patterns / DDD Rules. If any exists → see Conflict Protocol.
5. **Detect roadmap position** — the next unfinished step in the locked Roadmap.
6. **Detect legacy modules** — confirm `tenant`/`landlord` are frozen and out of scope.
7. **Determine the current implementation phase** and the exact module in play.
8. **Continue implementation** only after 1–7 pass.

**Conflict Protocol:** if the request conflicts with the Blueprint, architecture,
domain, Forbidden Patterns, or roadmap order → **STOP. Explain the conflict.
Propose the smallest compliant solution. Wait for approval. Never proceed
automatically.**

---

## Project Identity

KiraPass OS — an AI-powered **Property Operating System** for the operational
lifecycle of residential rental properties. Node.js + Express + TypeScript
monorepo (`apps/api`), ESM/NodeNext, strict TS. Not a CRM, marketplace, listing
site, ERP, or generic SaaS template.

## Project Mission

Evolve the platform from frozen Enterprise Blueprint to production-grade system
while preventing architecture drift, feature drift, business drift, technical
debt, unnecessary complexity, duplicated logic/concepts, circular dependencies,
and leaky abstractions. Optimise for maintainability, predictability,
testability, scalability, DDD correctness, and minimal operational complexity.

## AI Engineering Responsibilities

Act as CTO / Principal Architect / DDD Architect / AI Engineering Lead. Priority
order: **architecture-first, DDD-first, implementation-second.** Preserve
long-term integrity over speed. Apply the Conflict Protocol whenever a request
collides with governance. Report outcomes faithfully — never claim a gate passed
unless actually executed.

## Business Domain Authority

`docs/DOMAIN_BLUEPRINT.md` is the **Single Source of Truth** for business rules,
bounded contexts, ubiquitous language, entities, aggregates, value objects,
domain events, policies, specifications, lifecycles, authorization, and the
architecture/enterprise audits. It is **frozen** — never modify, redesign, or
recreate it. CLAUDE.md must never redefine a business rule.

**Domain lock — the ONLY allowed business concepts:** Property, Property Owner,
Tenant, Partner, Lease Contract, Rent, Maintenance Fee (Aidat), Payment
Schedule, Payment Status, Payment Record, Property Documents, Lease Documents,
Identity Verification, Photo Verification, Property Onboarding, Tenant Rating.
Reject anything outside this scope (no Building/Apartment hierarchy,
Notifications, or AI domains — not in the allowed list).

## Engineering Authority

Engineering behaviour is owned by this file. Detailed rules it references live in
the documents indexed under **Repository Governance**; this file is the entry
point and never restates a rule that another doc owns.

## Hierarchy of Truth (authority order)

1. **Human instructions** (the live conversation).
2. **Latest approved ADRs** (`docs/adr/*` — none yet; create on first approval).
3. **`docs/DOMAIN_BLUEPRINT.md`** (business rules — frozen).
4. **`CLAUDE.md`** + the engineering docs it indexes (Repository Governance).
5. **Implementation code.**

Business rules belong only to the Domain Blueprint; engineering behaviour only to
CLAUDE.md; **code never overrides documentation.** On conflict the higher source
wins; keep only the newest approved version of any rule.

## Repository Governance

Canonical document index (each referenced exactly once, here). Keep all mutually
consistent; update in the same change as the code/decision they describe:
- `docs/DOMAIN_BLUEPRINT.md` — domain SSOT, frozen (§1–§26).
- `docs/APPLICATION_BLUEPRINT.md` — application coordination layer.
- `docs/IMPLEMENTATION_CONTRACT.md` — implementation constitution (folder ownership §2–§3, Module Creation Contract §4, Testing §7, Definition of Done §9).
- `docs/RECONCILIATION_PLAN.md` — legacy scaffold reconciliation + breaking-change register.
- `apps/api/ARCHITECTURE_RULES.md` — code-level guard rules (mirrors the ESLint guard layer).

## Architecture Rules (frozen — never redesign/replace/bypass)

Clean Architecture, DDD, static Module Registry, Discovery layer, Plugin factory.
Positive rules:
- `createPlugin()` is the ONLY plugin constructor; plugins are immutable (`Object.freeze`).
- Modules register ONLY in `apps/api/src/modules/registry.ts`; mounted via `registry → discovery → routes/index`.
- Config/secrets only via `apps/api/src/config/env.ts`; no hardcoded config outside `config/`.
- Prohibitions: see **Forbidden Patterns**.

## Forbidden Patterns (HARD — never, unless explicitly approved in writing)

Single authoritative prohibition list. Enforced by ESLint guards where possible,
review otherwise.
- Dynamic module loading; runtime plugin registration; filesystem/dynamic module discovery.
- Dynamic imports; reflection; decorators; dependency-injection frameworks; service locators; any "hidden magic" or framework-specific abstraction.
- Architecture rewrites of Clean Architecture / Registry / Discovery / Plugin layers.
- Circular dependencies; cross-module imports (a module importing another module).
- Hidden infrastructure coupling (domain/service reaching transport, storage, clock, providers, or `process.env` directly).
- Business logic inside controllers, routes, repositories, or middleware.
- Primitive obsession (raw primitives across an aggregate boundary where a VO exists).
- Anemic aggregates (logic that belongs to the root placed in services).
- Shared mutable state across modules/aggregates.
- Repository-to-repository communication.
- Cross-context / multi-aggregate transactions (one transaction = one aggregate).
- Mounting a router anywhere except via the registry; bypassing the registry/discovery.
- Modifying `DOMAIN_BLUEPRINT.md`; inventing permissions; expanding the domain.
- Building on, extending, or prematurely deleting the frozen legacy scaffolds.

## DDD Rules (positive practice)

- Aggregate roots own their invariants; all state transitions go through the root.
- Value Objects at every aggregate boundary (Blueprint §11).
- Specifications are pure TRUE/FALSE predicates; never mutate.
- Policies orchestrate cross-aggregate collaboration; aggregates enforce invariants.
- Domain Events are immutable past-tense facts; they never execute business logic.
- Cross-aggregate effects happen via events (eventual consistency); cross-context access by id reference or result Value Object only (anti-corruption).
- Authorization follows Blueprint §7 exactly.

### DDD Pre-Codegen Verification (before writing any module code)

Verify against the Blueprint for the target aggregate: **aggregate boundaries ·
aggregate invariants · Value Objects · Specifications · Policies · Domain Events ·
Authorization (§7) · Lifecycle**. If the intended design would violate any → stop
and redesign before generating code.

## Clean Architecture Rules (positive structure)

One-way downward dependency:
`server → app → routes/index → discovery → registry → module.routes → controller → service → domain → (repository abstraction → infrastructure)`.
Domain never imports Application/Infrastructure. `routes/index.ts` imports the
discovery layer only. Folder ownership + allowed/forbidden imports:
`IMPLEMENTATION_CONTRACT §2–§3`. Prohibitions: see Forbidden Patterns.

## Plugin Rules

Every module exposes `routes.ts` with a default Express `Router`, registered via
`createPlugin({ name, version, router })`; `name` is added to the `PluginName`
union (manual, type-checked). Enforced by ESLint `no-raw-plugin-object`.

## Registry Rules

`registry.ts` is the single static source of truth for mounted modules;
`discovery.ts` is a read-only pass-through (`getModules()`); the aggregator
iterates and mounts `plugin.router`.

## Coding Standards

Explicit > implicit, static > dynamic, deterministic > clever. Match existing
code style and the `routes → controller → service (→ domain)` flow. Smallest
change that satisfies the requirement; no speculative abstraction (justified only
by ≥2 present-day uses). One concept = one place. No ambient `now()`/randomness in
the domain — inject time and ids as infrastructure inputs.

## Testing Standards

Mandatory levels: **unit** (VOs, pure services, domain services), **aggregate**
(invariants & lifecycle), **integration** (use-case orchestration, events,
transaction boundary), **architecture** (ESLint guards, registry/plugin
integrity, no cross-module/cyclic imports), **regression** (public API
byte-identical for unchanged behaviour). Architecture tests are non-negotiable.
Details: `IMPLEMENTATION_CONTRACT §7`.

## Security Standards

Authorization evaluated in the Application Layer against Blueprint §7 (role +
scope) before loading a write aggregate — never inside aggregates, never invented.
Input/shape validation = Value Object construction at the boundary. Secrets/config
only via `config/env.ts`. No credential logging.

## Performance Standards

Deterministic, low-complexity solutions; no premature optimisation. One aggregate
per transaction; no synchronous cross-context object graphs. Read concerns are
projections/read-models fed by events (CQRS-ready), eventually consistent.

## Refactoring Rules

Extend the architecture; never rewrite it merely because another approach is
possible. No unnecessary refactoring before the correct roadmap phase. Never
refactor working code without a requirement. Breaking changes follow Change
Management.

## Documentation Rules / Governance

Every module has a `README.md` mapping it to its Blueprint context/aggregate, use
cases, endpoints, and emitted/consumed events; aggregate/VO/spec doc-comments
state the invariant they enforce. **Whenever architecture or a permanent rule
changes, update CLAUDE.md + the relevant ADR + the affected doc in the SAME
change. Documentation must never lag implementation.**

## Architecture Decision Rules

Permanent decisions are recorded as ADRs under `docs/adr/` (create the directory
on first approval) and reflected here. On approval, update the docs — do not
duplicate the decision in chat. If two rules conflict, keep only the newest
approved version.

## Implementation Workflow

1. Run the Mandatory Pre-Task Workflow.
2. Confirm roadmap position (see Roadmap Enforcement).
3. Run DDD Pre-Codegen Verification for the target aggregate.
4. Implement ONE roadmap step at a time, end-to-end, per the Module Creation
   Contract (`IMPLEMENTATION_CONTRACT §4`).
5. When the Blueprint is silent on infrastructure, make the smallest decision and
   document it in the module README; never expand the business domain.
6. Run the Validation Workflow; satisfy all Quality Gates.

## Roadmap Enforcement

Implement strictly in locked Roadmap order. No module may depend on a future
module. **If a request asks to implement a module out of order or skip ahead:
STOP, explain why it violates roadmap order and which dependencies are
unfinished, and REFUSE implementation until the prerequisites are complete or the
user explicitly overrides.**

## Validation Workflow (run after every implementation task)

`npx tsc --noEmit -p apps/api/tsconfig.json` → `npm run lint --workspace apps/api`
→ `npm run build --workspace apps/api` → boot the server → exercise new + existing
endpoints (regression) → architecture review → domain review. Report only
actually-executed results.

## Quality Gates (Definition of Done — a task is complete ONLY when ALL pass)

TypeScript compile (`tsc --noEmit`); ESLint/architecture guards exit 0; build
succeeds; registry & plugin integrity intact; server boots; affected + existing
endpoints validated (regression); no circular/cross-module imports; domain review
passes. Plus: maps to exactly one domain concept + one application use case;
Module Creation Contract satisfied; invariants in the aggregate; VOs at
boundaries; events follow naming/timing/idempotency; public API unchanged unless
an approved, documented breaking change; module README present; no new technical
debt / duplicated rule / hidden coupling. **No task is complete until every gate
passes.** Full list: `IMPLEMENTATION_CONTRACT §9`.

## Change Management

Public API (`/api/**`) and response shapes are stable. Any breaking change MUST:
**STOP → explain impact → list the migration path → request approval → never
continue automatically.** Status: BC-2 (replaced `tenant` shape, dropped embedded
rating) and BC-3 (registry/`PluginName` edits for tenant) — **executed at step 3**.
BC-1 (remove `landlord`; use `/api/owners`) — **PENDING approval**.

## Technical Debt Rules

Zero-debt policy: no debt-`TODO` merged without a tracked risk-register entry
(Blueprint §26 R-IDs); no dead code/exports/commented-out code in production
modules; primitive obsession is debt. Open tracked risks with named trigger
steps: R-1 (multi-partner data isolation), R-2 (multi-country policies), R-3
(projection catalog), R-5 (ambient-time ban), R-7 (legacy scaffold divergence),
R-8 (Money precision), R-10 (termination settlement).

## Prompt Governance

Standing instructions live here, not in chat. Do not request re-pasting of prior
prompts. Output implementation only (no theory/tutorials) unless explicitly
asked; keep outputs minimal, deterministic, production-ready.

## Permanent Memory Rules

This file is the permanent project memory, auto-consulted before each task (via
the Mandatory Pre-Task Workflow). It plus the indexed docs constitute the durable
context. Keep it the single canonical governance file.

## Rule Update Policy / Self-Governance

Living document; refactor whenever needed to stay deterministic, concise,
non-redundant, versioned, internally consistent, and architecture-first /
DDD-first / implementation-second. Each prohibition lives in exactly one place
(Forbidden Patterns); each doc is indexed exactly once (Repository Governance).
Never allow contradictory rules; on conflict keep the newest approved version.
Update Version History on every change.

---

## Implementation Roadmap (locked order)

Source: `DOMAIN_BLUEPRINT §10` + `IMPLEMENTATION_CONTRACT §10`. No step begins
before its dependencies pass the Definition of Done.

1. **IAM / Account** — ✅ implemented (`modules/iam`, `/api/accounts`). Authorization enforcement deferred (no authenticated principal yet).
2. **Party : Owner** — ✅ implemented (`modules/owner`, `/api/owners`). Legacy `landlord` retirement (BC-1) still PENDING approval; `owner` and frozen `landlord` coexist meanwhile.
3. **Party : Tenant** — ✅ implemented (`modules/tenant`, `/api/tenants`), blueprint-conformant (no embedded rating). Legacy `tenant` scaffold REPLACED in place (BC-2 + BC-3 executed).
4. **Party : Partner** — ✅ implemented (`modules/partner`, `/api/partners`) with owner stewardship. Suspend/archive-while-stewarding-active-lease guard deferred to Property/Lease.
5. **Verification** — ✅ implemented (`modules/verification`, `/api/verifications/identity` + `/api/verifications/photo`); two aggregates (IdentityVerification, PhotoVerification). Party integration (consuming results) deferred to event orchestration.
6. **Property** (registry) — next.
7. **Property Documents.**
8. **Property Onboarding.**
9. **Lease.**
10. **Billing: AidatPlan + Rent terms** (resolve R-8 Money precision).
11. **Billing: Payment Schedule + Installments.**
12. **Billing: Payment Records + Payment Status** (resolve R-10 termination settlement).
13. **Reputation : Tenant Rating.**

## Legacy Status

`modules/landlord` is the only remaining **frozen pre-blueprint placeholder** —
not production, not authoritative; do not extend or build on it. Replaced by
`modules/owner` at step 2; physical removal is BC-1, PENDING approval.
`modules/tenant` has been REPLACED with the blueprint-conformant Party:Tenant
implementation (step 3). `health` and `auth` are live and stable.

---

## Version History

- **v1.4** — Status sync after roadmap Step 5. Verification context implemented
  (`modules/verification`): IdentityVerification + PhotoVerification aggregates,
  immutable results, injected timestamps. Standalone (no Party modification per
  freeze). Next step = Property.
- **v1.3** — Status sync after roadmap Step 4. Party:Partner (`/api/partners`)
  implemented with owner stewardship (assign/revoke, idempotent). Next step =
  Verification. Shared-kernel extraction remains intentionally deferred per
  engineering strategy (avoid premature abstraction until more contexts exist).
- **v1.2** — Status sync after roadmap Steps 2–3. Marked Party:Owner (`/api/owners`)
  and Party:Tenant (`/api/tenants`) implemented; recorded BC-2 + BC-3 executed at
  step 3 (legacy `tenant` replaced in place, no embedded rating); BC-1 (`landlord`)
  still pending; next step = Partner. Flagged shared-kernel (VOs + error taxonomy)
  consolidation as a growing tracked risk.
- **v1.1** — Final Engineering Constitution Audit. Added the Mandatory Pre-Task
  Workflow (8 steps) + Conflict Protocol; added explicit Roadmap Enforcement
  (refusal on out-of-order requests); consolidated ALL prohibitions into a single
  authoritative **Forbidden Patterns** list (added business-logic-in-
  repositories/routes/middleware, anemic aggregates, shared mutable state,
  repo-to-repo communication, cross-context transactions); added a DDD
  Pre-Codegen Verification checklist; added `build` to the Validation Workflow and
  "no task complete until every gate passes"; strengthened Change Management
  ("never continue automatically") and Documentation Governance ("docs never lag
  implementation"); de-duplicated the document index (referenced once under
  Repository Governance); split Roadmap Billing into steps 10–12.
- **v1.0** — Established CLAUDE.md as the permanent engineering constitution;
  consolidated rules from ARCHITECTURE_RULES.md and IMPLEMENTATION_CONTRACT.md;
  referenced (not duplicated) the frozen DOMAIN_BLUEPRINT.md and
  APPLICATION_BLUEPRINT.md; recorded hierarchy of truth, roadmap status, legacy
  freeze, and BC-1/2/3.
