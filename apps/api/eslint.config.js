import tseslint from "typescript-eslint";

/**
 * KiraPass API — Architecture Guard Layer (ESLint flat config).
 *
 * Encodes the boundaries from ARCHITECTURE_RULES.md as deterministic,
 * file-scoped lint rules so violations fail at development time rather than
 * relying on reviewer discipline.
 *
 * Layer is selected purely by file path:
 *   src/modules/<f>/service.ts     → service rules
 *   src/modules/<f>/controller.ts  → controller rules
 *   src/modules/<f>/routes.ts      → routes rules
 *   src/routes/index.ts            → aggregator rules
 *   src/modules/** (any)           → no-raw-plugin-object
 */

/**
 * no-raw-plugin-object — forbids constructing a ModulePlugin via a raw object
 * literal anywhere in src/modules (except the factory). Targets object
 * literals carrying a `router` property whose parent is NOT a `createPlugin`
 * call, so `createPlugin({ ... router })` stays allowed while a bare
 * `{ name, version, router }` is rejected.
 */
const noRawPluginObject = {
  selector:
    ":not(CallExpression[callee.name='createPlugin']) > ObjectExpression:has(Property[key.name='router'])",
  message:
    "All plugins must be created via createPlugin(). Direct ModulePlugin object literals are forbidden.",
};

export default tseslint.config(
  {
    ignores: ["dist/**", "node_modules/**"],
  },

  // Base parsing for all TypeScript sources.
  {
    files: ["src/**/*.ts"],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: { sourceType: "module" },
    },
  },

  // ── SERVICE layer: framework-agnostic, no env, pure logic ────────────────
  {
    files: ["src/modules/**/service.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "express",
              message:
                "Service layer must be framework-agnostic — no express import.",
            },
          ],
          patterns: [
            {
              group: ["express", "express/*", "**/middleware/*"],
              message:
                "Service layer must not depend on express or HTTP middleware.",
            },
          ],
        },
      ],
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "MemberExpression[object.name='process'][property.name='env']",
          message:
            "Service must not read process.env — receive config via the config layer.",
        },
        {
          selector: "Identifier[name=/^(Request|Response|NextFunction)$/]",
          message:
            "Service must not reference express req/res/next types — keep it transport-agnostic.",
        },
        noRawPluginObject,
      ],
    },
  },

  // ── CONTROLLER layer: thin req/res wrapper, no business logic ─────────────
  {
    files: ["src/modules/**/controller.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["**/config/*", "**/config/index.js"],
              message:
                "Controller must not read config directly — delegate to the service.",
            },
          ],
        },
      ],
      "no-restricted-syntax": [
        "error",
        {
          selector: "ForStatement, ForOfStatement, ForInStatement, WhileStatement, DoWhileStatement",
          message:
            "Controller must stay thin — iteration/business logic belongs in the service.",
        },
        {
          selector: "SwitchStatement",
          message:
            "Controller must not branch on domain rules — move decisions into the service.",
        },
        noRawPluginObject,
      ],
    },
  },

  // ── ROUTES layer: wiring only (path+method → named controller) ────────────
  {
    files: ["src/modules/**/routes.ts", "src/routes/index.ts"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "CallExpression[callee.property.name=/^(get|post|put|patch|delete|options|head|all|use)$/] > ArrowFunctionExpression",
          message:
            "Routes are wiring only — pass a named controller, not an inline handler.",
        },
        {
          selector:
            "CallExpression[callee.property.name=/^(get|post|put|patch|delete|options|head|all|use)$/] > FunctionExpression",
          message:
            "Routes are wiring only — pass a named controller, not an inline handler.",
        },
        {
          selector: "FunctionDeclaration",
          message: "Routes must not declare functions — no logic at the route layer.",
        },
        noRawPluginObject,
      ],
    },
  },

  // ── AGGREGATOR: may consume the module registry only ──────────────────────
  {
    files: ["src/routes/index.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["../modules/*/*", "**/modules/*/routes", "**/modules/*/routes.js"],
              message:
                "routes/index.ts may import the discovery layer only — register feature modules in modules/registry.ts.",
            },
            {
              group: ["**/modules/registry", "**/modules/registry.js"],
              message:
                "routes/index.ts must consume modules via the discovery layer (getModules), not the registry directly.",
            },
          ],
        },
      ],
    },
  },

  // ── PLUGIN ENFORCEMENT: no raw ModulePlugin literals in modules ───────────
  // Covers module files NOT handled by the per-layer blocks above
  // (registry.ts, discovery.ts, plugin-contract.ts, …). The factory and test
  // files are exempt.
  {
    files: ["src/modules/**/*.ts"],
    ignores: [
      "src/modules/create-plugin.ts",
      "src/modules/**/service.ts",
      "src/modules/**/controller.ts",
      "src/modules/**/routes.ts",
      "src/modules/**/*.test.ts",
      "src/modules/**/*.spec.ts",
    ],
    rules: {
      "no-restricted-syntax": ["error", noRawPluginObject],
    },
  },
);
