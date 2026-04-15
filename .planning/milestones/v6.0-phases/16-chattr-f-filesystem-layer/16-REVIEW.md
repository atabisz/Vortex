---
phase: 16-chattr-f-filesystem-layer
reviewed: 2026-04-15T11:54:52Z
depth: standard
files_reviewed: 3
files_reviewed_list:
  - src/renderer/src/util/chattrCasefold.test.ts
  - src/renderer/src/util/fs.ts
  - src/renderer/src/renderer.tsx
findings:
  critical: 0
  warning: 1
  info: 4
  total: 5
status: issues_found
---

# Phase 16: Code Review Report

**Reviewed:** 2026-04-15T11:54:52Z
**Depth:** standard
**Files Reviewed:** 3
**Status:** issues_found

## Summary

Phase 16 adds `applyChattrCasefold(dirPath)` to `src/renderer/src/util/fs.ts` along with 13 Vitest
tests in `chattrCasefold.test.ts` and a single wiring change in `renderer.tsx`. The implementation
is architecturally sound: platform and Flatpak guards are in place, `execFile` is used (not `exec`)
so `dirPath` cannot be shell-injected, and the function is documented to always resolve. The
`node:fs/promises` alias correctly avoids shadowing the `fs-extra` import.

One warning-level issue exists: the `verifyCasefold().then(...)` chain inside the outer
`new Promise<void>` constructor lacks a `.catch()` handler. If the `.then()` callback throws
(unlikely but structurally possible), `resolve()` is never called and `ensureDirWritableAsync`
hangs permanently. The remaining findings are informational: a fire-and-forget unlink that can
leave a temp file visible during the resolution window, inconsistent `code` types across tests,
a mislabelled CASE-05 test comment, and the unexported `@internal` seams being real public exports.

---

## Warnings

### WR-01: `verifyCasefold().then()` missing `.catch()` — outer Promise can hang

**File:** `src/renderer/src/util/fs.ts:195`
**Issue:** Inside `applyChattrCasefold`, the outer `new Promise<void>((resolve) => { ... })` calls
`verifyCasefold(dirPath).then((active) => { ...; resolve(); })` with no `.catch()`. The function
`verifyCasefold` cannot itself reject (it has an inner try/catch), but the `.then()` callback
invokes `log(...)` before `resolve()`. If `log` throws (e.g. due to a runtime fault or if the
logging module is partially torn down during shutdown), the `.then()` call returns a rejected
promise that is never handled. `resolve()` is never invoked, and the outer `Promise<void>` hangs
forever — permanently blocking `ensureDirWritableAsync` and freezing the directory setup flow.
**Fix:** Add `.catch(resolve)` to ensure the outer promise always settles:
```typescript
verifyCasefold(dirPath).then((active) => {
  if (active) {
    log("info", "chattr+F casefold enabled for staging directory", { dirPath });
  } else {
    log("debug", "chattr+F verify failed (false positive?), using shim", { dirPath });
  }
  resolve();
}).catch(() => resolve());
```

---

## Info

### IN-01: Fire-and-forget unlink leaves verify file visible during resolution window

**File:** `src/renderer/src/util/fs.ts:122`
**Issue:** `fsPromises.unlink(upperFile).catch(() => {})` in the `finally` block is intentionally
not awaited. This means `applyChattrCasefold` resolves (via `resolve()` at line 207) while
`__VORTEX_CASEFOLD_VERIFY` may still exist on disk for a brief moment. If a concurrent call to
`applyChattrCasefold` on the same directory races to run the `readdir` non-empty guard before the
unlink completes, the second call will see a non-empty directory and skip, silently. For normal
usage (no concurrent calls on the same path) this is harmless, but the design has this edge.
**Fix:** If concurrent calls on the same path are possible, await the unlink before resolving, or
document the race explicitly. At minimum, name the concern in a comment:
```typescript
// Intentionally not awaited — cleanup only; caller has already resolved.
// Do not call applyChattrCasefold concurrently on the same dirPath.
fsPromises.unlink(upperFile).catch(() => {});
```

### IN-02: CASE-05 test comment is misattributed; actual CASE-05 coverage is implicit

**File:** `src/renderer/src/util/chattrCasefold.test.ts:96`
**Issue:** The comment on line 96 reads `// CASE-05/CASE-06: Non-ext4 filesystem — no chattr`.
Per the validation plan, CASE-05 is the path-injection prevention requirement (T-08: `execFile`
arg array, not shell string), not the ext4 detection check. The actual arg-array verification is
done implicitly in the happy-path test at line 133-144 via `toHaveBeenNthCalledWith`, but no test
is labelled CASE-05 and none has a comment explaining it covers the injection prevention
requirement.
**Fix:** Update the happy-path test comment to explicitly reference CASE-05:
```typescript
// CASE-05: dirPath is passed as a discrete arg to execFile (no shell interpolation)
// CASE-06: Happy path — chattr is called on ext4 + empty dir + linux + no Flatpak
it("calls chattr +F when ext4 empty dir linux no Flatpak", async () => {
```
And remove the misattributed `CASE-05` from line 96.

### IN-03: `code` type is inconsistent between CASE-07 and CASE-11 error objects in tests

**File:** `src/renderer/src/util/chattrCasefold.test.ts:150`
**Issue:** In the first CASE-07 test (line 150), the chattr error is created as
`(chattrError as NodeJS.ErrnoException).code = "1" as any` (a string cast via `as any`). In the
CASE-11 tests (lines 241, 279), the error is created as
`Object.assign(new Error(...), { code: 1 })` (a numeric literal). Both tests work because
`applyChattrCasefold` does not branch on the specific error code value. However, the inconsistency
makes the tests harder to read and may mislead future maintainers into thinking the code handles
numeric and string codes differently.
**Fix:** Standardise all test error objects to use `code: 1` (numeric, matching EOPNOTSUPP
convention) and remove the `as any` cast:
```typescript
// CASE-07
const chattrError = Object.assign(new Error("chattr: Operation not supported"), { code: 1 });
```

### IN-04: `@internal` test seams are real public exports visible at module boundary

**File:** `src/renderer/src/util/fs.ts:75`
**Issue:** `_setChattr`, `_setChattrNotifier`, and `_resetChattrState` are exported as named
exports from `fs.ts`. The `@internal` JSDoc tag is advisory only — TypeScript does not enforce it
and the symbols are fully accessible to any importer. They are valid for their testing purpose but
appear in autocomplete, are included in any barrel re-export of `fs.ts`, and could be accidentally
called in production code.
**Fix:** This is an accepted pattern for test seams in this codebase (matching `_setNotifier` in
`elevated.ts`), so no change is strictly required. If future hardening is desired, consider
moving these symbols to a separate `fs.testSeams.ts` module that is only imported by tests, or
wrapping them behind a `process.env.NODE_ENV === "test"` guard.

---

_Reviewed: 2026-04-15T11:54:52Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
