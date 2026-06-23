# Feature Module Template

Reference scaffold for every feature module. Copy this folder, rename it, and
replace the placeholder `example` logic. Do **not** edit `_template/` itself —
it is documentation, not a live route, and is never mounted.

## Structure

```
src/modules/<feature>/
├── service.ts      # pure business logic — NO express, returns plain data
├── controller.ts   # (req,res) wrapper — calls service, formats response
├── routes.ts       # express Router wiring — method+path → controller
└── types.ts        # optional — shared shapes; delete if unused
```

## Dependency direction (strict, never reverse)

```
routes  →  controller  →  service  →  (config / future repository)
```

- `service` must not import express or controllers/routes.
- `controller` must not contain business logic.
- `routes` must not contain business logic.

## Creating a new module

1. `cp -r _template <feature>` and rename the symbols
   (`getExample` → `get<Feature>`, `exampleController` → `<feature>Controller`).
2. Replace the placeholder service return with real logic.
3. Mount it in the central aggregator `src/routes/index.ts`:

   ```ts
   import { Router } from "express";

   import healthRoutes from "../modules/health/routes.js";
   import <feature>Routes from "../modules/<feature>/routes.js";

   const router = Router();

   router.use(healthRoutes);
   router.use(<feature>Routes);

   export default router;
   ```

The aggregator is mounted under `API_PREFIX` (`/api`) in `app.ts`, so a route
declared as `/example` becomes `GET /api/example`. No changes to `app.ts` or
`server/index.ts` are needed when adding a module.
