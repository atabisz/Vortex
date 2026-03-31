# Testing Patterns

**Analysis Date:** 2026-03-30

## Test Framework

**Runners:**
- **Vitest** (primary): `vitest` with `@vitest/coverage-v8`
  - Main config: `vitest.config.ts` at repository root
  - Per-project configs in `src/{main,renderer,shared}/vitest.config.ts`
  - Projects: `src/main`, `src/renderer`, `src/shared`, `packages/paths`, `packages/paths-node`, `extensions/games/game-stardewvalley`

- **Jest** (legacy in renderer): `jest.config.mjs` in `src/renderer/`
  - Gradual migration to Vitest in progress
  - TODO comment in eslint config: "remove old Jest tests and replace with Vitests"

**Assertion Library:**
- Vitest: Built-in `expect()` from Vitest
- Jest: `jest.expect()`
- Example: `expect(state).toBeInstanceOf(Table)`

**Run Commands:**
```bash
pnpm test                    # Run all tests with coverage (Vitest + Jest)
pnpm test:watch              # Watch mode (Vitest only)
vitest run --coverage        # Vitest with coverage report
pnpm -F @vortex/renderer run test:jest  # Legacy Jest tests only
```

## Test File Organization

**Location:**
- **Vitest**: Co-located with source: `src/{module}.test.ts` in same directory
- **Jest**: Separate `__tests__` directory: `src/__tests__/{name}.test.ts`
- Both patterns exist; new tests prefer co-located Vitest

**Naming:**
- Test files: `{Module}.test.ts` or `{module}.test.ts`
- Mock files: `src/__mocks__/{module}.js` (Jest pattern)
- Example: `src/main/src/store/Database.test.ts` tests `Database.ts` in same directory

**Structure:**
```
src/
├── main/
│   ├── src/
│   │   ├── store/
│   │   │   ├── Database.ts
│   │   │   └── Database.test.ts
│   │   └── errorHandling.ts
│   └── vitest.config.ts
├── renderer/
│   ├── src/
│   │   ├── __tests__/
│   │   │   └── PhasedInstaller.test.ts
│   │   ├── __mocks__/
│   │   │   ├── ComponentEx.js
│   │   │   └── cheerio.js
│   │   └── controls/
│   │       └── ComponentEx.ts
│   ├── jest.config.mjs
│   └── vitest.config.mts
└── shared/
    ├── src/
    │   ├── Debouncer.ts
    │   └── Debouncer.test.ts
    └── vitest.config.ts
```

## Test Structure

**Suite Organization:**
```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("ComponentName", () => {
  describe("Feature/Method", () => {
    it("should do something when condition", () => {
      // Arrange
      const fixture = createFixture();

      // Act
      const result = fixture.doSomething();

      // Assert
      expect(result).toBe(expected);
    });
  });
});
```

**Patterns:**

Setup/Teardown:
```typescript
beforeEach(() => {
  // Setup shared state, mocks, etc.
});

afterEach(() => {
  // Cleanup or verify final state
  jest.clearAllMocks();
  vi.clearAllMocks();
});
```

Test nesting for organization:
```typescript
describe("Database", () => {
  describe("createTable / createView", () => {
    it("creates Table instances", () => {
      // Test body
    });
  });

  describe("transaction()", () => {
    it("commits on success", async () => {
      // Test body
    });
  });
});
```

## Mocking

**Framework:**
- **Vitest**: `vi` from `vitest`
- **Jest**: `jest` from `@jest/globals`

**Patterns:**

Mock modules:
```typescript
// Jest
jest.mock("../extensions/mod_management/util/dependencies");
jest.mock("../util/log");

// Vitest (same syntax)
vi.mock("../module");
```

Mock functions with resolvers:
```typescript
const mockFn = vi.fn().mockResolvedValue(undefined);
const mockFn = vi.fn().mockRejectedValue(new Error("boom"));
const mockFn = vi.fn((x) => x * 2);
```

Mock return values and side effects:
```typescript
const mock = {
  getState: jest.fn(() => mockState as IState),
  dispatch: jest.fn(),
  emit: jest.fn(),
};

// Vitest with spy
const spy = vi.spyOn(obj, "method");
```

Fake timers for debouncing/scheduling:
```typescript
vi.useFakeTimers();
vi.advanceTimersByTimeAsync(200); // Advance fake time
vi.runAllTimersAsync();           // Run all pending timers
vi.useRealTimers();               // Restore real timers
```

**What to Mock:**
- External dependencies (APIs, file system, timers)
- Third-party library side effects
- Database or network calls
- Module-level dependencies in Jest `__tests__` dirs (circular dependency workaround)

**What NOT to Mock:**
- Pure utility functions
- Business logic being tested
- Error classes or exception handling (test real errors)
- Small, deterministic helpers

Example (from `Database.test.ts`):
```typescript
function createMockConnection() {
  return {
    run: vi.fn().mockResolvedValue(undefined),
    runAndReadAll: vi.fn().mockResolvedValue({
      getRowObjectsJson: () => [],
    }),
  };
}

function createMockLevelPersist() {
  return {
    connection: createMockConnection(),
    beginTransaction: vi.fn().mockResolvedValue(undefined),
    commitTransaction: vi.fn().mockResolvedValue(undefined),
    rollbackTransaction: vi.fn().mockResolvedValue(undefined),
    getDirtyTables: vi.fn().mockResolvedValue([]),
  };
}

describe("Database", () => {
  it("commits on success", async () => {
    const persist = createMockLevelPersist();
    const invalidator = createMockInvalidator();
    const db = new Database(persist as unknown as LevelPersist, invalidator);

    await db.transaction(async (tx) => {
      const mods = tx.createTable<ModRow>("mods_pivot");
      await mods.insert({ mod_id: "1", name: "test" });
    });

    expect(persist.beginTransaction).toHaveBeenCalledTimes(1);
    expect(persist.commitTransaction).toHaveBeenCalledTimes(1);
  });
});
```

## Fixtures and Factories

**Test Data:**

Factory pattern for creating fixtures:
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

describe("GenericDebouncer", () => {
  it("does not call the function before the timer expires", async () => {
    const fn = vi.fn().mockResolvedValue(undefined);
    const { d, advance } = makeDebouncer(fn);

    d.schedule();
    await advance(100);

    expect(fn).not.toHaveBeenCalled();
  });
});
```

**Location:**
- Fixtures colocated in test file using `create*()` or `make*()` helper functions
- Shared fixtures in `src/__tests__/fixtures/` or test-setup files (not yet established)
- Example from `PhasedInstaller.test.ts`: Mock state and API objects defined in `beforeEach`

**Naming:**
- Factory functions: `create{Thing}()`, `make{Thing}()`
- Mock variables: `mock{ServiceName}`
- Test data: `{descriptive}Fixture` or inline object literals

## Coverage

**Requirements:** Not enforced yet (captured by `@vitest/coverage-v8`)

**View Coverage:**
```bash
pnpm test                    # Shows coverage after run
pnpm vitest run --coverage   # Detailed Vitest coverage
# Coverage reports in: test-results/
```

**Coverage Configuration:**
- Provider: `v8` (modern JavaScript engine coverage)
- Reporters: `text` (console), `cobertura` (CI-friendly XML)
- Reports directory: `test-results/` (in root)

**CI Integration:**
- GitHub Actions reporter enabled when `$CI` and `$GITHUB_ACTIONS` env vars set
- JUnit XML output for CI dashboards

## Test Types

**Unit Tests:**
- Scope: Single function or class method
- Approach: Mock external dependencies, test one behavior at a time
- Location: `{Module}.test.ts` co-located with source
- Framework: Vitest
- Example: `Database.test.ts` tests `Database.query()`, `transaction()` individually

**Integration Tests:**
- Scope: Multiple modules working together (stores, services, actions)
- Approach: Partial mocking of I/O, test workflows
- Location: `src/__tests__/{Feature}.test.ts`
- Framework: Jest or Vitest
- Example: `PhasedInstaller.test.ts` tests InstallManager with mock API and state

**E2E Tests:**
- Framework: Not yet implemented in main codebase
- Location: `packages/e2e/` (empty, setup phase)
- Future: Playwright or Cypress for full application flows

## Common Patterns

**Async Testing:**
```typescript
// With await
it("calls the function after the debounce delay", async () => {
  const fn = vi.fn().mockResolvedValue(undefined);
  const { d, advance } = makeDebouncer(fn);

  d.schedule();
  await advance(200);

  expect(fn).toHaveBeenCalledOnce();
});

// Promise.catch for error testing
await expect(
  db.transaction(() => {
    throw new Error("boom");
  }),
).rejects.toThrow("boom");
```

**Error Testing:**
```typescript
it("invokes the callback with an error on rejection", async () => {
  const err = new Error("boom");
  const fn = vi.fn().mockRejectedValue(err);
  const { d, advance } = makeDebouncer(fn);
  const cb = vi.fn();

  d.schedule(cb);
  await advance(200);

  expect(cb).toHaveBeenCalledWith(err);
});

// Synchronous error propagation
it("propagates a synchronously thrown error to the callback", async () => {
  const err = new Error("sync boom");
  const fn = vi.fn(() => {
    throw err;
  });
  const { d, advance } = makeDebouncer(fn);
  const cb = vi.fn();

  d.schedule(cb);
  await advance(200);

  expect(cb).toHaveBeenCalledWith(err);
});
```

**Callback Invocation:**
```typescript
// Verify callbacks called with correct arguments
expect(cb).toHaveBeenCalledWith(null); // Success
expect(cb).toHaveBeenCalledWith(err);  // Error

// Verify call counts
expect(fn).toHaveBeenCalledOnce();
expect(fn).toHaveBeenCalledTimes(2);
expect(fn).not.toHaveBeenCalled();
```

**Mocking Private Methods/State:**
```typescript
// Access private members via type assertion
const state = installManager.mInstallPhaseState.get(sourceModId);
state.allowedPhase = 0;
state.downloadsFinished.add(0);

// Or test through public API
installManager.markPhaseDownloadsFinished(sourceModId, 1, mockApi);
```

## Setup Files

**Renderer Setup:** `src/renderer/test-setup.ts`
- Runs before Vitest tests in renderer project
- Configures environment (happy-dom)
- Sets up globals and mocks

**Jest Setup:** `src/renderer/src/setupTests.js`
- Referenced in `jest.config.mjs`
- Legacy setup for Jest tests

## Strict Mode Checking

**TypeScript Strict Mode:**
- Some areas use `tsconfig.strict.json`
- Check touched area before replying: `if (tsconfig.strict.json exists in touched area) { run typecheck }`
- Extensions may have their own strict checks

---

*Testing analysis: 2026-03-30*
