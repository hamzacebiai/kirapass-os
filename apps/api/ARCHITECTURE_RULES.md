# KiraPass API — Architecture Guard Rules

Design artifact (not runtime code). Defines the enforceable boundaries of the
`apps/api` platform. Any change that violates these rules should be rejected in
review. Reference scaffold: `src/modules/_template/`.

## 1. Layers

| Layer | Location | May contain | Must NOT contain |
|-------|----------|-------------|------------------|
| Server (boot) | `src/server/index.ts` | config load, `createApp()`, `listen` | express setup, route/feature knowledge |
| App (composition) | `src/app.ts` | pipeline wiring (parsers, aggregator, middleware) | `listen`, `process.env`, business logic |
| Config | `src/config/**` | env parsing, constants | express/HTTP concerns |
| Aggregator | `src/routes/index.ts` | mounting module routers | inline routes, business logic |
| Module routes | `src/modules/<f>/routes.ts` | method+path → controller | business logic, inline handlers with work |
| Module controller | `src/modules/<f>/controller.ts` | req/res mapping, response formatting | business logic, decisions/computation |
| Module service | `src/modules/<f>/service.ts` | business logic, pure functions | express, req/res, HTTP status |
| Module types | `src/modules/<f>/types.ts` | DTOs, domain shapes | logic |
| Middleware | `src/middleware/**` | cross-cutting infra (404, errors) | domain/business logic |

## 2. Allowed dependency graph (one-directional)

```
server  →  app  →  routes/index (aggregator)  →  modules/<f>/routes
                                                      →  controller
                                                            →  service
                                                                  →  types
                                                                  →  config
app  →  config, middleware, routes/index
service  →  config, types        (NEVER express)
```

Direction is strictly downward. A lower layer must never import an upper one.

## 3. Forbidden dependencies (hard failures)

- `service.ts` importing `express` (incl. `type` imports of Request/Response).
- `service.ts` reading `process.env` or any global config source.
- `controller.ts` containing business logic, branching on domain rules, or
  computing results that belong in a service.
- `routes.ts` containing logic beyond `method + path → controller`.
- Any file outside `src/config/env.ts` reading `process.env`.
- Any hardcoded environment/config value (ports, hosts, secrets, URLs) outside
  `src/config/**`.
- A module router mounted anywhere other than `src/routes/index.ts`
  (no `app.use` of a feature router in `app.ts`, `server`, or another module).
- A module importing another module (modules are siblings, not dependencies).

## 4. Module creation rules

1. Copy `src/modules/_template/` → `src/modules/<feature>/`; never edit
   `_template` itself (it is documentation and is never mounted).
2. Keep exactly: `service.ts`, `controller.ts`, `routes.ts`, and `types.ts`
   only if shared shapes are needed.
3. Service is written first and tested in isolation (no express in its imports).
4. Controller maps the request into a typed DTO and delegates; nothing else.
5. Routes wire HTTP verb + path to the controller; nothing else.
6. Integrate by adding one `import` and one `router.use(...)` line in
   `src/routes/index.ts`. No changes to `app.ts` or `server/index.ts`.
7. Endpoints resolve under `API_PREFIX` (`/api`); routes declare paths relative
   to it (e.g. `/auth/login` → `POST /api/auth/login`).

## 5. Single integration point (registry + discovery)

Three fixed layers, one direction:

- `src/modules/registry.ts` — **STATIC TRUTH LAYER**: the only place feature
  modules are registered (one import + one array entry each).
- `src/modules/discovery.ts` — **ABSTRACTION LAYER**: read-only wrapper over the
  registry, exposing `getModules(): readonly Router[]`. No mutation, no logic,
  no scanning. The stable seam future auto-discovery plugs into.
- `src/routes/index.ts` — **CONSUMPTION LAYER**: iterates `getModules()` and
  mounts each router. Imports the discovery layer only.

`app.ts` mounts the aggregator once under `API_PREFIX`. Adding/removing a module
touches only its own folder plus one line in `registry.ts`.

Forbidden (enforced by ESLint `no-restricted-imports` on `src/routes/index.ts`):
- importing a feature module (`../modules/<f>/routes`, controller, service)
  directly in the aggregator;
- importing `registry.ts` directly in the aggregator — it must go through
  `discovery.ts`.

## 5a. Plugin runtime phase (Phase 8 — IMPLEMENTED)

The `ModulePlugin` contract is now the registry's runtime representation:

- `registry.ts` stores `readonly ModulePlugin[]` — each entry is
  `{ name, version, router }`. It remains the single, static source of truth
  (hand-written; still no scanning, no codegen yet).
- `discovery.ts` returns `readonly ModulePlugin[]` as a pure pass-through
  (no transformation/filtering/mutation).
- `routes/index.ts` mounts `plugin.router` for each entry.

Every registry entry MUST satisfy `ModulePlugin`:
- `name: string`
- `version: string`
- `router: Router`

Runtime behavior is identical to the pre-plugin registry: the same Router
objects are mounted in the same order; only the registry's container shape
changed (routers → plugin objects wrapping those routers).

**STILL FORBIDDEN** in this phase: dynamic `import()`, `fs` / `fs.readdir`
scanning, async discovery, dependency injection, and any runtime plugin
loading. Registration stays static and explicit.

## PLUGIN FACTORY LAYER (PHASE 9)

All plugins MUST be created via createPlugin().

Flow:

registry.ts
→ createPlugin()
→ ModulePlugin (frozen)
→ plugin.router

RULES:
- Manual ModulePlugin object creation is forbidden
- Object.freeze is enforced via createPlugin()
- registry.ts is the single source of truth
- No runtime plugin system exists
- No filesystem scanning allowed
- No dynamic import allowed

> Note: `PluginName` (`plugin-contract.ts`) is a **manual** string-literal union
> of known module ids (`"health" | "auth"`), extended by hand — never
> auto-generated. Pure DX/typing change; no runtime behavior difference.

## PLUGIN ENFORCEMENT LAYER (PHASE 10)

Plugin system is now lint-enforced.

Rules:
- Only `createPlugin()` may construct plugins
- Raw `ModulePlugin` object literals are forbidden in `/modules`
- ESLint enforces architecture boundaries at development time
- Runtime behavior remains unchanged
- No filesystem scanning exists
- No dynamic plugin loading exists

Mechanism: the `no-raw-plugin-object` guard (`eslint.config.js`) flags any
object literal carrying a `router` property whose parent is not a
`createPlugin(...)` call, scoped to `src/modules/**`. Exempt: the factory
(`create-plugin.ts`) and test files (`*.test.ts` / `*.spec.ts`).

Error: "All plugins must be created via createPlugin(). Direct ModulePlugin
object literals are forbidden."

## 6. Review checklist (per PR)

- [ ] No `express` import in any `service.ts`.
- [ ] No `process.env` outside `config/env.ts`.
- [ ] No hardcoded config values outside `config/**`.
- [ ] Controllers contain no business logic.
- [ ] Routes contain no logic.
- [ ] New module mounted only via `routes/index.ts`.
- [ ] No cross-module imports.
