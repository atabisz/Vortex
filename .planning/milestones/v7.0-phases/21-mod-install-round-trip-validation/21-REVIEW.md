---
phase: 21-mod-install-round-trip-validation
reviewed: 2026-04-17T00:00:00Z
depth: standard
files_reviewed: 2
files_reviewed_list:
  - src/renderer/src/extensions/hardlink_activator/hardlink_activator.test.ts
  - src/renderer/src/extensions/hardlink_activator/index.ts
findings:
  critical: 0
  warning: 5
  info: 3
  total: 8
status: issues_found
---

# Phase 21: Code Review Report

**Reviewed:** 2026-04-17
**Depth:** standard
**Files Reviewed:** 2
**Status:** issues_found

## Summary

Two files reviewed: the hardlink activator deployment method (`index.ts`) and its new vitest test suite (`hardlink_activator.test.ts`). The production code is generally well-structured. The most actionable finding is a real async race condition in `purgeLinks` that can cause an unhandled exception at runtime when `postPurge` is called concurrently with the walk promise chain. There are also type hygiene gaps and a test infrastructure concern: the renderer vitest config uses the `.mts` extension, which the root vitest project glob (`./src/**/vitest.config.ts`) does not match — meaning the new tests may not run under `pnpm run test` from the repo root.

---

## Warnings

### WR-01: Async race — `mInstallationFiles` can be `undefined` when promise resolves

**File:** `src/renderer/src/extensions/hardlink_activator/index.ts:318`

**Issue:** The `purgeLinks` walk chain resolves with `this.mInstallationFiles` at the very end of the promise chain (line 318). If `postPurge()` runs between the turbowalk completion (line 317 `.then(() => installQueue)`) and the final `.then(() => PromiseBB.resolve(this.mInstallationFiles))`, `this.mInstallationFiles` will be `undefined`. The caller at line 323 immediately calls `.then((inos) => { const total = inos.size; ... })`, which throws `TypeError: Cannot read properties of undefined (reading 'size')` — an unhandled rejection.

**Fix:** Capture the set in a local variable before the async chain, so the resolved value is stable:

```typescript
this.mInstallationFiles = new Set<string>();
const fileSet = this.mInstallationFiles;  // local reference
// ...
installEntryProm = turbowalk(...)
  .catch(...)
  .then(() => installQueue)
  .then(() => PromiseBB.resolve(fileSet));  // resolve local, not this.mXxx
```

---

### WR-02: `purgeLinks` data-path scan silently drops all `unlinkAsync` errors

**File:** `src/renderer/src/extensions/hardlink_activator/index.ts:348-349`

**Issue:** Inside the game-directory scan, `unlinkAsync` errors are caught and logged but the `.catch` does not re-throw or return a rejected promise. This means a partial purge (e.g. one file locked by the game process) silently succeeds — the caller receives a resolved promise and has no way to detect that deployed files were left behind.

```typescript
return fs
  .unlinkAsync(entry.filePath)
  .catch((err) =>
    log("warn", "failed to remove", entry.filePath),  // returns void, swallows error
  );
```

**Fix:** If silent partial purge is intentional (best-effort), add a comment making that explicit and consider tracking failed paths for reporting. If the caller should know about failures, re-throw after logging:

```typescript
.catch((err) => {
  log("warn", "failed to remove", entry.filePath);
  // best-effort: continue purging remaining files
});
```

---

### WR-03: Test file uses CommonJS `require()` in an ESM module context

**File:** `src/renderer/src/extensions/hardlink_activator/hardlink_activator.test.ts:163-164`

**Issue:** The test file uses ES module `import` syntax throughout, but lines 163-164 use CommonJS `require("fs")` and `require("path")`. Under Vitest in a native ESM environment, `require` is not available unless the test runner is configured for CJS interop. This is fragile — it will fail silently in environments where CJS globals are not injected, and it is inconsistent with the rest of the file.

```typescript
const { readFileSync } = require("fs");   // CommonJS in ESM file
const { resolve } = require("path");
```

**Fix:** Use top-level ESM imports:

```typescript
import { readFileSync } from "fs";
import { resolve } from "path";
```

---

### WR-04: Source-file-as-string test is brittle and relies on magic number offset

**File:** `src/renderer/src/extensions/hardlink_activator/hardlink_activator.test.ts:162-178`

**Issue:** The `symlink_activator isGamebryoGame blocklist` test reads `symlink_activator/index.ts` from disk as raw text and then slices an arbitrary 600-character window (`src.slice(defIndex, defIndex + 600)`) to assert that `"skyrimse"` appears inside the `isGamebryoGame` method body. This is fragile in three ways:

1. The 600-character window is a magic number — adding entries to the game list could push `"skyrimse"` past that offset without any test failure indication.
2. The test depends on `__dirname` resolving correctly relative to the test runner working directory.
3. It tests source text rather than behavior — if the method is renamed or moved, the test silently passes (finds `"skyrimse"` somewhere in the file) or gives a confusing failure.

**Fix:** Test the behavior directly by importing the symlink activator and calling `isSupported` with `"skyrimse"`, which exercises the blocklist as a contract rather than an implementation detail. If that import is too heavy, at minimum remove the magic number and use `src.indexOf('"skyrimse"', defIndex)` constrained within the function's opening and closing brace offsets.

---

### WR-05: Renderer vitest config uses `.mts` extension — not picked up by root project glob

**File:** `src/renderer/vitest.config.mts` (context: `vitest.config.ts` root, affects `hardlink_activator.test.ts`)

**Issue:** The root `vitest.config.ts` discovers projects via `"./src/**/vitest.config.ts"` (line 11). The renderer's config is `src/renderer/vitest.config.mts` — the `.mts` extension does not match the `.ts` glob. As a result, `pnpm run test` from the repository root does not include the renderer test suite, and the new `hardlink_activator.test.ts` is never executed in CI.

**Fix:** Either rename `src/renderer/vitest.config.mts` to `src/renderer/vitest.config.ts` (updating the `__dirname` shim accordingly), or add a second glob entry in the root config:

```typescript
projects: [
  "./src/**/vitest.config.ts",
  "./src/**/vitest.config.mts",   // add this
  ...
],
```

---

## Info

### IN-01: `mInstallationFiles` field type does not include `undefined`

**File:** `src/renderer/src/extensions/hardlink_activator/index.ts:65`

**Issue:** The field is declared as `private mInstallationFiles: Set<string>` (non-optional), but the code treats it as `Set<string> | undefined` throughout — `!== undefined` guard at line 281, `=== undefined` guard at line 293, optional chaining `?.add()` at line 302. The type should match the runtime semantics to surface accidental unguarded accesses at compile time.

**Fix:**

```typescript
private mInstallationFiles: Set<string> | undefined;
```

---

### IN-02: `postPurge` uses `delete` on a class instance property

**File:** `src/renderer/src/extensions/hardlink_activator/index.ts:266-267`

**Issue:** `delete this.mInstallationFiles` (line 266) followed by `this.mInstallationFiles = undefined` (line 267) is redundant. `delete` on an instance property removes the own property from the prototype chain but the immediately following assignment puts it back. Only the assignment is needed.

**Fix:** Remove the `delete` line:

```typescript
public postPurge(): PromiseBB<void> {
  this.mInstallationFiles = undefined;
  return PromiseBB.resolve();
}
```

---

### IN-03: `winapi-bindings` mock duplicates `GetVolumePathName` unnecessarily

**File:** `src/renderer/src/extensions/hardlink_activator/hardlink_activator.test.ts:4-9`

**Issue:** The mock provides `GetVolumePathName` both as a named export and as `default.GetVolumePathName`. The production code imports `* as winapi from "winapi-bindings"` and calls `winapi.GetVolumePathName(...)`, so only the named export is needed. The `default` duplication adds noise and maintenance burden if the mock needs to be updated.

**Fix:**

```typescript
vi.mock("winapi-bindings", () => ({
  GetVolumePathName: vi.fn(() => "C:\\"),
}));
```

---

_Reviewed: 2026-04-17_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
