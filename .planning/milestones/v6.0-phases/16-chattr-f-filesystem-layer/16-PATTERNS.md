# Phase 16: chattr+F Filesystem Layer - Pattern Map

**Mapped:** 2026-04-15
**Files analyzed:** 3 (2 modified, 1 new)
**Analogs found:** 3 / 3

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `src/renderer/src/util/fs.ts` | utility | file-I/O + event-driven (subprocess + notification) | `src/renderer/src/util/elevated.ts` (seam pattern) + `src/renderer/src/util/fs.ts` itself (guard + cache patterns) | exact |
| `src/renderer/src/util/chattrCasefold.test.ts` | test | batch (13 unit test cases) | `src/renderer/src/util/fs.test.ts` | exact |
| `src/renderer/src/renderer.tsx` | config/bootstrap | request-response (injection at startup) | `src/renderer/src/renderer.tsx` lines 127 + 635 (existing `_setNotifier` injection) | exact |

---

## Pattern Assignments

### `src/renderer/src/util/fs.ts` — modifications (utility, file-I/O + subprocess)

**Analog 1 (seam shape):** `src/renderer/src/util/elevated.ts`
**Analog 2 (guard + cache pattern):** `src/renderer/src/util/fs.ts` itself (existing `isWinePrefixPath`, `isSteamOS`-style cache)

#### Injectable seam pattern (lines 15-33 of `elevated.ts`):

```typescript
type SpawnerFn = (cmd: string, args: string[]) => ChildProcess;
let _spawner: SpawnerFn = spawn;

/** @internal Override the spawn function for testing. Do not call in production. */
export function _setSpawner(fn: SpawnerFn): void {
  _spawner = fn;
}

type NotifierFn = (notification: INotification) => void;
let _notifier: NotifierFn | undefined;

/** @internal Register a notification handler for elevation failures. Do not call in production test code. */
export function _setNotifier(fn: NotifierFn | undefined): void {
  _notifier = fn;
}
```

**Copy this for `_setChattr` and `_setChattrNotifier` in `fs.ts`.** The type shape must match exactly: callback-style `ExecFileFn` (not promisified), `NotifierFn` with `INotification` parameter, module-level `let` with default, exported setter function with `@internal` JSDoc.

**CRITICAL:** The notifier export in `fs.ts` MUST be named `_setChattrNotifier`, NOT `_setNotifier`, to avoid name collision with the `elevated.ts` export that renderer.tsx already imports at line 127.

#### Session-flag + cache pattern (`elevated.ts` lines 35-60):

```typescript
let _isSteamOS: boolean | undefined;

export function isSteamOS(): boolean {
  if (_isSteamOS !== undefined) {
    return _isSteamOS;
  }
  try {
    // ... detection logic ...
    _isSteamOS = result;
  } catch {
    _isSteamOS = false;
  }
  return _isSteamOS;
}

/** @internal Reset the cached SteamOS detection result. Do not call in production. */
export function _resetSteamOSCache(): void {
  _isSteamOS = undefined;
}
```

**Mirror for `fs.ts`:** Use `const ext4CasefoldCache = new Map<string, boolean>()` and `let hasShownCasefoldNotification = false` at module level. Export `_resetChattrState()` for test `beforeEach` resets. Tests depend on this export — it is not optional.

#### isWinePrefixPath three-way conjunction guard (fs.ts lines 585-595):

```typescript
function isWinePrefixPath(filePath: string): boolean {
  return (
    process.platform === "linux" &&
    filePath.includes("/compatdata/") &&
    filePath.includes("/pfx/")
  );
}
```

**Mirror for `applyChattrCasefold`:** Use the same `process.platform !== "linux"` early-return pattern plus `process.env.FLATPAK_ID` check. Both are one-liner guards at the top of the function before any I/O.

#### PromiseBB always-resolves pattern (fs.ts line 1232):

```typescript
export function ensureDirWritableAsync(
  dirPath: string,
  confirm?: () => PromiseLike<void>,
): PromiseBB<void> {
  // ...
  return PromiseBB.resolve(fs.ensureDir(dirPath))
    .then(() => {
      const canary = path.join(dirPath, "__vortex_canary");
      return ensureFileAsync(canary).then(() => removeAsync(canary));
    })
```

**The `applyChattrCasefold` call is inserted as a `.then()` between `fs.ensureDir(dirPath)` and the canary write.** Ordering: `ensureDir → chattr+F → canary write`. The inserted `.then(() => applyChattrCasefold(dirPath))` must always resolve — if `applyChattrCasefold` ever rejects, the canary write is skipped and `ensureDirWritableAsync` callers see an unexpected error. The function MUST catch all errors internally.

#### platform guard for non-Linux functions (fs.ts pattern, e.g. changeFileOwnership at line 1324):

```typescript
export function changeFileOwnership(
  filePath: string,
  stat: fs.Stats,
): PromiseBB<void> {
  if (process.platform === "win32") {
    // This is a *nix only function.
    return PromiseBB.resolve();
  }
  // ...
```

**Mirror:** `if (process.platform !== "linux") { return; }` as the first line of `applyChattrCasefold`. Return type is `Promise<void>` (async function), not `PromiseBB<void>` — the function is declared `async`, so `return;` resolves to `Promise<void>`, compatible with `.then()` chaining in `ensureDirWritableAsync` via `PromiseBB.resolve(applyChattrCasefold(dirPath))`.

#### log call convention (fs.ts throughout, e.g. lines 1303-1307):

```typescript
log(
  "error",
  "failed to acquire permission",
  elevatedErr.message,
);
```

**Mirror:** `log("info", "chattr+F casefold enabled for staging directory", { dirPath })` on success; `log("debug", "chattr+F failed, falling back to Wine-prefix shim", { dirPath, exitCode: ... })` on any non-zero exit or guard bypass. Note: EOPNOTSUPP is the common case — always log at `"debug"`, never `"warn"` or `"error"`.

---

### `src/renderer/src/util/chattrCasefold.test.ts` — new file (test, batch unit tests)

**Analog:** `src/renderer/src/util/fs.test.ts`

#### Top-of-file mock block (fs.test.ts lines 1-52):

```typescript
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock resolvePathCase before fs.ts loads (vi.mock is hoisted)
vi.mock("./resolvePathCase", () => ({
  resolvePathCase: vi.fn(),
}));

vi.mock("fs-extra", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  // fs-extra is CJS, so named exports may be on the default export
  const base = (actual.default ?? actual) as Record<string, unknown>;
  return {
    ...base,
    ensureDir: vi.fn().mockResolvedValue(undefined),
    default: {
      ...base,
      ensureDir: vi.fn().mockResolvedValue(undefined),
    },
  };
});

import * as fs from "./fs";
```

**Copy this structure exactly.** `vi.mock` is hoisted before imports. `fs-extra` must include `ensureDir` mock because `applyChattrCasefold` is reached via `ensureDirWritableAsync` which calls `fs.ensureDir`. The `resolvePathCase` mock is required because `fs.ts` imports it at module load.

#### platform-override helper (fs.test.ts lines 93-117):

```typescript
describe("fs.ts Wine prefix case-folding shim", () => {
  let originalPlatform: PropertyDescriptor;

  beforeEach(() => {
    originalPlatform = Object.getOwnPropertyDescriptor(process, "platform")!;
    vi.clearAllMocks();
  });

  afterEach(() => {
    Object.defineProperty(process, "platform", originalPlatform);
  });

  function setPlatform(platform: string) {
    Object.defineProperty(process, "platform", {
      value: platform,
      writable: true,
      configurable: true,
    });
  }
```

**Copy this pattern verbatim.** The `process.platform` override via `Object.defineProperty` is required — you cannot assign to `process.platform` directly. Restore in `afterEach` using the saved descriptor.

Additionally, `beforeEach` must call `fs._resetChattrState()` to clear `ext4CasefoldCache` and `hasShownCasefoldNotification` between test cases — otherwise the "notification fires once" test (CASE-11) will leak state into subsequent tests.

#### Test structure for FLATPAK env guard:

```typescript
afterEach(() => {
  Object.defineProperty(process, "platform", originalPlatform);
  delete process.env.FLATPAK_ID;   // clean up env mutation
});
```

Always delete `FLATPAK_ID` in `afterEach`. Setting an env var is a mutation that leaks between tests unless explicitly cleared.

#### statfs spyOn approach:

`resolvePathCase.test.ts` uses `vi.mock("./fs", ...)` to replace the entire `./fs` module. For `statfs`, the approach from RESEARCH.md is `vi.spyOn(require("fs").promises, "statfs")` or `vi.mock("node:fs", ...)` factory. The test file should use the same `vi.mock` factory pattern (consistent with how `fs-extra` is mocked above) rather than `vi.spyOn` on a getter to avoid "Cannot spy on a non-existent property" errors.

Preferred pattern for `statfs` mock in tests:

```typescript
vi.mock("node:fs", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:fs")>();
  return {
    ...actual,
    promises: {
      ...actual.promises,
      statfs: vi.fn(),
    },
  };
});
```

Then in each test: `vi.mocked((await import("node:fs")).promises.statfs).mockResolvedValue({ type: 0xef53, ... })`.

**Fallback:** If that approach fails in the Vitest happy-dom environment, spy on the inner function at module level: `const mockStatfs = vi.spyOn(require("fs").promises, "statfs")` before the test and `.mockResolvedValue(...)` in the test body.

---

### `src/renderer/src/renderer.tsx` — modification (bootstrap/config, injection)

**Analog:** `src/renderer/src/renderer.tsx` itself — the existing `_setNotifier` injection at lines 127 and 635.

#### Import addition (renderer.tsx line 127):

```typescript
import { _setNotifier } from "./util/elevated";
```

**Add directly below this line:**

```typescript
import { _setChattrNotifier } from "./util/fs";
```

This is the only import change needed. `setTFunction` from `./util/fs` is already imported at line 136, so `fs.ts` is already in scope — add only the new named import.

#### Bootstrap injection (renderer.tsx lines 632-637):

```typescript
  extensions.setStore(store);

  // Wire elevation failure notifications so SteamOS Game Mode errors
  // are visible to the user (ELEV-06). Must be after setStore() which
  // initializes sendNotification on the api.
  _setNotifier((notification) => {
    extensions.getApi().sendNotification?.(notification);
  });
```

**Add immediately after the `_setNotifier` block (after line 637):**

```typescript
  _setChattrNotifier((notification) => {
    extensions.getApi().sendNotification?.(notification);
  });
```

The body is identical to the `_setNotifier` call — both route through `extensions.getApi().sendNotification?.()`. The placement must be after `extensions.setStore(store)` (line 630) because `sendNotification` requires the store to be wired.

---

## Shared Patterns

### Injectable Seam (applies to all new exports in `fs.ts`)

**Source:** `src/renderer/src/util/elevated.ts` lines 15-33
**Apply to:** `_setChattr`, `_setChattrNotifier`, `_resetChattrState` in `fs.ts`

The seam pattern is:
1. Module-level `let` variable holding the default implementation
2. Exported setter function named `_setXxx` with `/** @internal */` JSDoc
3. Production code calls the variable, not the default implementation directly
4. Tests call the setter in `beforeEach` to inject a mock; `_resetChattrState` restores defaults

### Platform Guard (applies to `applyChattrCasefold`)

**Source:** `src/renderer/src/util/fs.ts` lines 585-595 (`isWinePrefixPath`) and line 1324 (`changeFileOwnership`)
**Apply to:** First two lines of `applyChattrCasefold`

```typescript
if (process.platform !== "linux") {
  return;
}
if (process.env.FLATPAK_ID) {
  return;
}
```

### PromiseBB Compatibility

**Source:** `src/renderer/src/util/fs.ts` lines 1224-1232
**Apply to:** The `.then()` insertion point in `ensureDirWritableAsync`

All `fs.ts` async functions return `PromiseBB<T>`. `applyChattrCasefold` returns `Promise<void>` (native async function). PromiseBB is a superset of the native Promise and accepts native Promises in `.then()` chains via `PromiseBB.resolve()`. No explicit wrapping needed — `.then(() => applyChattrCasefold(dirPath))` works correctly.

### Error Handling — Never Reject

**Source:** D-02 in CONTEXT.md; consistent with `elevated.ts` pattern of using `_notifier?.()` for errors rather than rejecting
**Apply to:** `applyChattrCasefold` in its entirety

All error paths (non-ext4, EOPNOTSUPP, which-not-found, verify failure) must call `resolve()`, never `reject()`. The function wraps the entire callback-style `execFile` chain in `new Promise<void>((resolve) => { ... })` with every code path calling `resolve()`.

### Log Level Convention

**Source:** `src/renderer/src/util/fs.ts` lines 1303-1307; CONTEXT.md D-12
**Apply to:** All `log()` calls in `applyChattrCasefold` and `verifyCasefold`

- Success: `log("info", ...)` — chattr+F applied and verified
- Any fallback (EOPNOTSUPP, non-ext4, not-found, verify failure): `log("debug", ...)` — fallback is the common path
- Never use `"warn"` or `"error"` for EOPNOTSUPP — it is the expected outcome on most systems

---

## No Analog Found

All three files have close analogs. No files require falling back to RESEARCH.md patterns exclusively.

---

## Metadata

**Analog search scope:** `src/renderer/src/util/` (elevated.ts, fs.ts, fs.test.ts, resolvePathCase.test.ts), `src/renderer/src/renderer.tsx`
**Files scanned:** 5 analog files read in full or relevant sections
**Pattern extraction date:** 2026-04-15
