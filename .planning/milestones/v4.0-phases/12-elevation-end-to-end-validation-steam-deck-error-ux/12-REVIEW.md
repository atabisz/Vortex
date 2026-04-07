---
phase: 12-elevation-end-to-end-validation-steam-deck-error-ux
reviewed: 2026-04-07T00:00:00Z
depth: standard
files_reviewed: 3
files_reviewed_list:
  - src/renderer/src/util/elevated.ts
  - src/renderer/src/util/elevated.test.ts
  - src/renderer/src/renderer.tsx
findings:
  critical: 0
  warning: 4
  info: 3
  total: 7
status: issues_found
---

# Phase 12: Code Review Report

**Reviewed:** 2026-04-07T00:00:00Z
**Depth:** standard
**Files Reviewed:** 3
**Status:** issues_found

## Summary

Three files reviewed: the new SteamOS elevation path (`elevated.ts`), its test suite (`elevated.test.ts`), and the renderer entry point (`renderer.tsx`) where the notifier is wired in. The SteamOS detection and notification plumbing look structurally sound and the test coverage is good. Four warnings require attention: a dual-settle race in the SteamOS promise path, a potential `undefined` stack dereference in `renderer.tsx`, an unsanitized key injection in the elevated script generator, and a missing `error.stack` guard in `elevated.ts`. Three info items cover minor code quality points.

## Warnings

### WR-01: SteamOS path can both reject and resolve the same promise

**File:** `src/renderer/src/util/elevated.ts:238-280`

**Issue:** In the SteamOS branch, `rejectWithSteamOSNotification(reject)` is called inside the `close` handler (line 250) when the exit code is non-zero, but `return resolve(tmpPath)` is still reached at line 280 after the `if/else` block. If the `close` event fires synchronously (as the tests deliberately arrange), `reject` fires first and then `resolve` fires immediately after — the first settler wins in a native Promise so the observable behaviour is correct, but this is a latent correctness bug: the code expresses the wrong intent and will confuse future readers. It also means the `cleanup` callback for the temp file is never called on the error path.

**Fix:**
```typescript
if (isSteamOS()) {
  const proc = getSpawner()("sudo", ["-n", process.execPath, "--run", tmpPath]);
  proc.on("close", (code: number | null) => {
    if (code !== null && code !== 0) {
      rejectWithSteamOSNotification(reject);
      return; // do NOT fall through to resolve()
    }
    // code 0 or null: IPC handles results; resolve now
    resolve(tmpPath);
  });
  proc.on("error", (_spawnErr: Error) => {
    rejectWithSteamOSNotification(reject);
  });
  return; // remove the shared resolve(tmpPath) at line 280
}
```
The `resolve(tmpPath)` call should be moved *into* the `close` handler (success path only), mirroring the pkexec branch's intent.

---

### WR-02: `error.stack` accessed without null guard in `renderer.tsx`

**File:** `src/renderer/src/renderer.tsx:332`

**Issue:** At line 332, `error.stack.includes("packery")` and at line 338, `error.stack.includes("react-sortable-tree")` are called without first checking that `error.stack` is defined. The same `error` object passes through multiple filters before reaching these lines, and `stack` is not guaranteed to be present — for example, when `error` is a thrown string or a plain object. A `TypeError: Cannot read properties of undefined (reading 'includes')` here would be caught by the outer `unhandledrejection` handler and re-enter `errorHandler`, potentially looping.

**Fix:**
```typescript
if (error.stack?.includes("packery")) {
  return;
}

if (error.stack?.includes("react-sortable-tree")) {
  return;
}
```
Use optional chaining on both `.includes()` calls (lines 332 and 338).

---

### WR-03: Unsanitized argument key injected into elevated script source

**File:** `src/renderer/src/util/elevated.ts:202-206`

**Issue:** The `args` parameter keys are interpolated directly into the generated JavaScript program as variable names with `let ${argKey} = ...`. If any caller passes a key that is a JavaScript reserved word or contains special characters, the generated script will have a syntax error. More importantly, if a caller ever passes an attacker-influenced key (e.g., from user input or file names), this is a code-injection vector into the elevated process.

**Fix:** Validate or allowlist keys before interpolation:
```typescript
const VALID_IDENTIFIER = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/;
for (const argKey of Object.keys(args)) {
  if (!VALID_IDENTIFIER.test(argKey)) {
    return reject(new Error(`Invalid elevated arg key: ${argKey}`));
  }
  if (Object.prototype.hasOwnProperty.call(args, argKey)) {
    prog += `let ${argKey} = ${JSON.stringify(args[argKey])};\n`;
  }
}
```

---

### WR-04: `error.stack.startsWith` can throw when `stack` is undefined in elevated process

**File:** `src/renderer/src/util/elevated.ts:100`

**Issue:** Inside `elevatedMain` (which runs in the elevated Node process), `handleError` accesses `error.stack.startsWith(errType)` at line 100. If `error` is not an `Error` instance (e.g., a thrown string or number), `error.stack` will be `undefined` and `.startsWith()` will throw a `TypeError`. The resulting error in `handleError` would be unhandled (since `handleError` is the uncaught exception handler), silently crashing the elevated process.

**Fix:**
```typescript
const testIfScriptInvalid = () => {
  if (typeof error?.stack !== "string") return;
  syntaxErrors.forEach((errType) => {
    if (error.stack.startsWith(errType)) {
      error = "InvalidScriptError: " + error.stack;
      client.sendEndError(error);
    }
  });
};
```

## Info

### IN-01: `UserCanceled` message set via `as any` bypass instead of constructor

**File:** `src/renderer/src/util/elevated.ts:64`

**Issue:** `(err as any).message = "..."` works at runtime but bypasses TypeScript's type system. If `UserCanceled` accepts a message in its constructor (or if the class is changed to seal `message`), this silent mutation will break without a compiler error.

**Fix:** Check whether `UserCanceled` accepts a message parameter and use the constructor:
```typescript
const err = new UserCanceled("Elevation is not available in Steam Game Mode. " +
  "Switch to Desktop Mode to perform this operation.");
```
If the constructor does not accept a message, add that parameter rather than mutating post-construction.

---

### IN-02: Duplicate describe blocks for non-SteamOS pkexec tests

**File:** `src/renderer/src/util/elevated.test.ts:252`

**Issue:** The describe block `"runElevated — non-SteamOS Linux still uses pkexec"` (lines 252–293) and `"runElevated — Linux pkexec branch"` (lines 296–407) share identical `beforeEach`/`afterEach` setup. The first block contains a single test that is also covered by Test 1 in the second block (`capturedCmd === "pkexec"`). The duplication adds maintenance surface without additional coverage.

**Fix:** Remove the `"non-SteamOS Linux still uses pkexec"` describe block entirely (lines 252–293); the assertion `capturedCmd === "pkexec"` in Test 1 of the pkexec branch already covers this case.

---

### IN-03: SteamOS notifier silently unavailable during early startup

**File:** `src/renderer/src/renderer.tsx:635`

**Issue:** `_setNotifier(...)` is called inside `init()` after `extensions.setStore()` (line 630). If `runElevated` is somehow invoked between renderer startup and the `_setNotifier` call completing, the notification is silently swallowed (the `?.` optional-call means no crash, but the user sees nothing). This is a narrow window but worth noting for any future code that calls `runElevated` during early init.

**Fix:** No code change required now — the window is narrow and the `?.` guard is correct. Document the ordering dependency with a comment near `_setNotifier`:
```typescript
// Must be called after setStore() — extensions.getApi().sendNotification
// is not available until the store is wired.
_setNotifier((notification) => {
  extensions.getApi().sendNotification?.(notification);
});
```

---

_Reviewed: 2026-04-07T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
