# Coding Conventions

**Analysis Date:** 2026-03-30

## Naming Patterns

**Files:**
- PascalCase for classes and components: `ComponentEx.ts`, `Database.ts`, `Table.ts`
- camelCase for utilities and modules: `util.ts`, `logging.ts`, `errorHandling.ts`
- camelCase with `.test.ts` suffix for test files: `Database.test.ts`, `Debouncer.test.ts`
- Configuration files use kebab-case: `eslint.config.mjs`, `vitest.config.ts`
- Index files use `index.ts` for barrel exports

**Functions:**
- camelCase for all functions: `countIf()`, `setdefault()`, `createTable()`
- Verb-first patterns for action creators: `startNotification()`, `updateNotification()`, `stopNotification()`
- `is`/`has` prefix for boolean checks: `isReady()`, `hasOwnProperty()`
- Private methods use `m` prefix (legacy class pattern): `mComponent`, `mPath`, `mBaseObject` in `StateProxyHandler`

**Variables:**
- camelCase for all variables: `sourceModId`, `mockState`, `mockApi`
- `const` preferred over `let` and `var`
- Private class fields use `m` prefix (legacy): `mDelayed`, `mDelayedTimer`
- Callback functions use `Cb` suffix: `waitCb`, `installCb`

**Types:**
- PascalCase for interfaces: `INotification`, `IExtensionApi`, `IState`
- PascalCase for type aliases: `ModRow`, `NotificationFunc`
- PascalCase for enum names
- Prefixes: `I` for interfaces, `T` for generic type parameters

## Code Style

**Formatting:**
- Tool: `oxfmt` (Prettier-compatible)
- Print width: 80 characters (see `.oxfmtrc.json`)
- Semicolons required
- Quote style: double quotes preferred (enforced by prettier config)
- Trailing commas in multiline objects/arrays

**Linting:**
- Tool: ESLint with TypeScript support
- Config: `src/{main,preload,renderer,shared}/eslint.config.mjs`
- Most rules configured to `warn` level for ease of refactoring legacy code
- Strictest rules in TypeScript: `@typescript-eslint/consistent-type-imports` (error), unused vars (warn with ignore patterns)

**Key ESLint Rules:**
- `@typescript-eslint/consistent-type-imports`: Force `type` imports (error)
- `@typescript-eslint/no-unused-vars`: Warn on unused vars; ignore patterns starting with `_` (unused args)
- `no-var`: Warn
- `prefer-const`: Warn
- `@typescript-eslint/no-explicit-any`: Warn (not strict yet)
- React: `@eslint-react/jsx-shorthand-boolean` warn, `@eslint-react/no-useless-fragment` warn
- Perfectionist plugin: Sort imports and exports alphabetically

## Import Organization

**Order:**
1. Node.js built-in modules: `import * as path from "path"`
2. External packages: `import React from "react"`, `import Bluebird from "bluebird"`
3. Type imports: `import type { IComponentContext } from "../types/IComponentContext"`
4. Internal modules: `import { deleteOrNop } from "../util/storeHelper"`
5. Re-exports: `export { connect } from "react-redux"`

**Path Aliases:**
- `@/` maps to `src/` in renderer (Jest config, vite tsconfig)
- Relative imports preferred for local modules
- No absolute paths in application code

**Barrel Exports:**
- Used selectively in `controls/api.ts`, `types/` directories
- `export * from "../types/IDialog"` pattern for type aggregation
- Main entry points re-export public API

## Error Handling

**Patterns:**
- Typed error classes with custom inheritance: `UserCanceled`, `TimeoutError`
- Catch blocks explicitly handle all errors
- `.catch(() => { /* best-effort */ })` pattern for non-critical errors
- Error logging via `log()` function: `log("error", "context", error)`

**Error Functions:**
- `getErrorMessage(error)` from `@vortex/shared` for user-friendly messages
- `errorToReportableError()` for telemetry conversion
- `throw new UserCanceled()` for user-initiated cancellation
- Error propagation preserves stack traces

**Example (from `errorHandling.ts`):**
```typescript
export async function terminateAsync(error: Error): Promise<void> {
  log("error", "unrecoverable error", error);
  const allowReport = !isErrorReportingDisabled();
  if (!app.isReady()) {
    dialog.showErrorBox(
      "An unrecoverable error occurred",
      getErrorMessage(error) + "\n\n" + (error.stack ?? ""),
    );
    if (allowReport) {
      await reportCrash("Crash", errorToReportableError(error)).catch(() => {
        /* best-effort */
      });
    }
    app.exit(1);
    return;
  }
  try {
    const isIgnored = await showTerminateError(error, allowReport, false);
    if (isIgnored) return;
  } catch (err) {
    log("error", "error while handling unrecoverable error", err);
  }
  app.exit(1);
}
```

## Logging

**Framework:** Custom `log()` function

**Patterns:**
- `log(level, context, message, [data])`
- Levels: `"error"`, `"info"`, `"debug"`, `"warn"`
- Always include descriptive context: `log("error", "unrecoverable error", error)`
- User errors logged as `"info"`, system errors as `"error"`

**Location:** `src/main/src/logging.ts`, `src/renderer/src/util/log.ts`

## Comments

**When to Comment:**
- JSDoc for public functions and exported classes
- Explain WHY, not WHAT (code shows WHAT)
- Complex algorithm steps warrant inline comments
- TODOs with responsible party if known: `// TODO: remove after fixing issue #123`
- NOTE for important gotchas: `// NOTE(erri120): Welcome, this file exists because...`

**JSDoc/TSDoc:**
- Used for public API functions
- Parameters, return types, and exceptions documented
- Example from `util.ts`:

```typescript
/**
 * count the elements in an array for which the predicate matches
 *
 * @export
 * @template T
 * @param {T[]} container
 * @param {(value: T) => boolean} predicate
 * @returns {number}
 */
export function countIf<T>(
  container: T[],
  predicate: (value: T) => boolean,
): number {
  return container.reduce((count: number, value: T): number => {
    return count + (predicate(value) ? 1 : 0);
  }, 0);
}
```

- Type annotations in JSDoc optional when TypeScript types are explicit

## Function Design

**Size:** Keep functions under 100 lines where practical; break complex logic into helpers

**Parameters:**
- Max 3-4 parameters; use object for related params
- Type all parameters explicitly (TypeScript enforced)
- Destructure object params for clarity
- Optional params with `?` suffix

**Return Values:**
- Always type return values explicitly
- Promises for async operations: `Promise<T>`
- `void` for side-effect-only functions
- Nullable returns use `T | null` or `T | undefined`
- Example: `async query<ModRow>(sql: string): Promise<ModRow[]>`

**Example (from `Debouncer.ts`):**
```typescript
function makeDebouncer(
  func: (...args: any[]) => Error | PromiseLike<void>,
  debounceMS = 200,
  reset = true,
  triggerImmediately = false,
) {
  const { setFn, clearFn, advance, runAll } = makeTimers();
  const d = new GenericDebouncer<
    Timeout,
    typeof setTimeout,
    typeof clearTimeout
  >(setFn, clearFn, func, debounceMS, reset, triggerImmediately);
  return { d, advance, runAll };
}
```

## Module Design

**Exports:**
- Prefer named exports over default exports for modules
- Default exports used for Redux actions (legacy): `export default createAction`
- Deprecation warnings on legacy exports: `/** @deprecated Use createAction from redux-act directly */`

**Barrel Files:**
- Located in `controls/api.ts`, `types/` directories
- Aggregate related exports for public API
- Example: `export * from "../types/IDialog"`
- Minimize barrel files to avoid circular dependencies

**Private Implementation:**
- Prefix private/internal exports with underscore: `_internalHelper()`
- Use module-level `const` for private utilities
- Example from `notifications.ts`:
```typescript
const identity = (input) => input;
const timers = local<{ [id: string]: NodeJS.Timeout }>(
  "notification-timers",
  {},
);
```

---

*Convention analysis: 2026-03-30*
