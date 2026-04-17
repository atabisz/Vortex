---
phase: 20-windows-string-purge
plan: "02"
subsystem: renderer/util
tags: [audit, platform-guard, eperm, windows-strings, onbrd-03c, onbrd-03d]
dependency_graph:
  requires: [20-01-PLAN.md]
  provides: [ONBRD-03c verification, ONBRD-03d verification]
  affects: []
tech_stack:
  added: []
  patterns: [process.platform guard audit, grep reachability analysis]
key_files:
  created: []
  modified: []
decisions:
  - "ONBRD-03c satisfied by nativeErrors.ts line 13 guard (process.platform !== win32 returns undefined) + message.ts EPERM handler at line 421 — no code changes needed"
  - "ONBRD-03d satisfied by symlink_activator_elevate isSupported() returning IUnavailableReason on non-Windows (line 240) plus monitorConsent() early return at line 49 — single Run as Administrator string is unreachable on Linux"
  - "DeploymentMethod is instantiated on Linux (line 1137 unguarded) but filtered from getSupportedActivators via allTypesSupported + isSupported returning IUnavailableReason — name string never appears in dropdown"
metrics:
  duration: "3 minutes"
  completed_date: "2026-04-16"
  tasks_completed: 2
  files_changed: 0
---

# Phase 20 Plan 02: Windows String Purge — ONBRD-03c/03d Verification Audit Summary

**One-liner:** Verified that decodeSystemError returns undefined on Linux (nativeErrors.ts line 13) and zero reachable "Run as Administrator" strings exist in any Linux error path.

## Objective

Read-only audit verifying ONBRD-03c and ONBRD-03d are satisfied by existing platform guards.
No code changes — both requirements were pre-satisfied before this plan executed.

## Task Execution

### Task 1: Trace decodeSystemError callers and verify EPERM path is Linux-safe (ONBRD-03c)

**Status:** COMPLETE — ONBRD-03c verified

#### decodeSystemError callers identified

Two callers in the codebase:

| File | Line | Call site | Context |
|------|------|-----------|---------|
| `src/renderer/src/util/message.ts` | 374 | `decodeSystemError(err, err.path ?? err.filename ?? fileName)` | Inside `prettifyNodeErrorMessageInner` |
| `src/renderer/src/util/fs.ts` | 526 | `decodeSystemError(err, filePath)` | Inside Access denied dialog flow |

#### nativeErrors.ts line 13 guard confirmed

```typescript
if (code === undefined || process.platform !== "win32") {
  return undefined;
}
```

On Linux, `process.platform !== "win32"` is always `true`. Therefore `decodeSystemError` **always returns `undefined` on Linux**, regardless of error code or input.

#### message.ts caller trace (line 374)

- `decoded = decodeSystemError(...)` returns `undefined` on Linux
- Line 375: `if (decoded !== undefined)` evaluates to `false` — falls through
- Execution continues to the `err.code` checks below

**EPERM handler (line 421):**
```typescript
} else if (err.code === "EPERM") {
  const filePath = err.path || err.filename || undefined;
  const firstLine = filePath
    ? 'Vortex needs to access "{{filePath}}" but it\'s write protected.\n'
    : "Vortex needs to access a file that is write protected.\n";
  return {
    message:
      firstLine +
      "When you configure directories and access rights you need to ensure Vortex can " +
      "still access data directories.\n" +
      "This is usually not a bug in Vortex.",
    replace: { filePath },
    allowReport: false,
  };
}
```

Message contains:
- No "Run as Administrator"
- No "UAC"
- No "Windows"
- No "administrator" language

**Verdict: LINUX-SAFE.**

**EACCES handler (line 457):**
```typescript
} else if (err.code === "EACCES" || err.port !== undefined) {
  return {
    message: "Network connect was not permitted, please check your firewall settings",
    allowReport: false,
  };
}
```

This handles network permission errors (port context), not filesystem EACCES. Message contains no Windows-specific language. **LINUX-SAFE.**

#### fs.ts caller trace (line 526)

- `decoded = decodeSystemError(err, filePath)` returns `undefined` on Linux
- Line 527: `if (decoded !== undefined)` evaluates to `false` — title/message are NOT overwritten with Windows native error text
- Line 532: `if (decoded?.rethrowAs === undefined)` is `true` (decoded is undefined) — buttons are set to `["Cancel", "Retry"]`
- No "Run as Administrator" button; no "Give permission" button with Windows-specific context

**Verdict: LINUX-SAFE.**

#### Grep verification

```
grep -c 'decodeSystemError' nativeErrors.ts message.ts fs.ts
nativeErrors.ts:1  message.ts:2  fs.ts:2
```

```
grep -n 'Run as Administrator\|administrator\|UAC\|Windows will' src/renderer/src/util/message.ts
(no output)
```

#### ONBRD-03c Conclusion

**SATISFIED.** The `decodeSystemError` function is gated at line 13 — it always returns `undefined` on non-win32. All callers check for `undefined` before using the result. The EPERM handler in `message.ts:421` produces actionable Linux-safe copy without any admin/Windows language. No "Run as Administrator" fallthrough exists in any EPERM/EACCES path on Linux. No code changes required per decision D-07.

---

### Task 2: Grep audit for zero reachable "Run as Administrator" strings on Linux (ONBRD-03d)

**Status:** COMPLETE — ONBRD-03d verified

#### "Run as Administrator" grep results (TypeScript/TSX sources only)

```
grep -rn "Run as Administrator" src/ --include="*.ts" --include="*.tsx"
```

**Result: 1 match**

| File | Line | Content | Reachable on Linux? |
|------|------|---------|---------------------|
| `src/renderer/src/extensions/symlink_activator_elevate/index.ts` | 121 | `"Symlink Deployment (Run as Administrator)"` | **No** |

#### Reachability analysis for the single match

The string at line 121 is passed to `super(...)` in the `DeploymentMethod` class constructor. The class IS instantiated on Linux (line 1137, unguarded). However:

1. **`monitorConsent()` early return (line 49):** The deployment execution function returns immediately on non-Windows:
   ```typescript
   if (process.platform !== "win32") {
     // on non-windows platforms we don't need to do any of this.
     return;
   }
   ```
   No deployment operation runs on Linux.

2. **`isSupported()` returns IUnavailableReason on non-Windows (line 240):**
   ```typescript
   public isSupported(state: any, gameId?: string): IUnavailableReason {
     if (process.platform !== "win32") {
       return { description: (t) => t("Elevation not required on non-windows systems") };
     }
   ```
   This causes `allTypesSupported()` to add an error entry, which causes `getSupportedActivators()` to filter out this deployment method entirely.

3. **UI rendering:** `Settings.tsx:1292` renders `{t(activator.name)}` but only for activators returned by `getSupportedActivators()`. Since `symlink_activator_elevated` returns an unavailability reason on non-Windows, it is filtered out. The "Symlink Deployment (Run as Administrator)" name never appears in the deployment method dropdown on Linux.

4. **Settings registration (line 1140-1146):** `context.registerSettings("Workarounds", Settings, ...)` is under `if (process.platform === "win32")` — the symlink Settings component with UAC text is not registered on Linux.

**Verdict: UNREACHABLE on Linux.** Zero user-visible "Run as Administrator" strings exist in any Linux execution path.

#### "administrator" (case-insensitive) full audit

All matches in `src/renderer/src/` (`.ts`/`.tsx`):

| File | Line | Content | Reachable on Linux? |
|------|------|---------|---------------------|
| `fs.test.ts` | 310 | `expect(source).toContain("Create as Administrator")` — test assertion | Test code, not production UI |
| `download_management/views/Settings.tsx` | 740 | `"Vortex can try to create the directory as administrator..."` | **No** — Windows arm of ternary (Plan 01); `process.platform === 'linux'` is false for this arm |
| `download_management/views/Settings.tsx` | 749 | `"Create as Administrator"` | **No** — Windows arm of ternary (Plan 01); same ternary |
| `symlink_activator_elevate/index.ts` | 121 | `"Symlink Deployment (Run as Administrator)"` | **No** — filtered by `isSupported()` |
| `symlink_activator_elevate/index.ts` | 123 | `"This is run as administrator..."` | **No** — part of same class, filtered |

#### UAC audit

UAC-relevant matches in `src/renderer/src/` (excluding code comments):

| File | Line | Content | Reachable on Linux? |
|------|------|---------|---------------------|
| `fs.ts` | 1572 | `"Windows will show an UAC dialog."` | **No** — Windows arm of ternary (Plan 01) |
| `symlink_activator_elevate/Settings.tsx` | 138, 147 | UAC dialog text | **No** — `context.registerSettings` for this component is under `if (process.platform === "win32")` |

Code comments containing "UAC" (`fs.ts:1367`, `ExtensionManager.ts:2643`, `symlink_activator_elevate/index.ts:657`) are not rendered text.

#### ONBRD-03d Conclusion

**SATISFIED.** Exactly 1 "Run as Administrator" string exists in TypeScript source files. It is inside `symlink_activator_elevate/index.ts:121`, filtered from the deployment method dropdown by `isSupported()` returning `IUnavailableReason` on non-Windows. Zero reachable "Run as Administrator" strings exist on Linux.

---

## Verification Commands Run

```bash
# Task 1 verification
grep -c 'decodeSystemError' src/renderer/src/util/nativeErrors.ts src/renderer/src/util/message.ts src/renderer/src/util/fs.ts
# Result: nativeErrors.ts:1  message.ts:2  fs.ts:2

grep -n 'process.platform !== "win32"' src/renderer/src/util/nativeErrors.ts
# Result: 13:  if (code === undefined || process.platform !== "win32") {

grep -n 'err.code === "EPERM"' src/renderer/src/util/message.ts
# Result: 421:  } else if (err.code === "EPERM") {

grep -n 'Run as Administrator\|administrator\|UAC\|Windows will' src/renderer/src/util/message.ts
# Result: (no output — confirmed clean)

# Task 2 verification
grep -rn "Run as Administrator" src/ --include="*.ts" --include="*.tsx" | wc -l
# Result: 1

grep -n 'process.platform !== "win32"' src/renderer/src/extensions/symlink_activator_elevate/index.ts
# Result: 49, 240, 911

grep -n 'process.platform' src/renderer/src/util/fs.ts | grep -n raiseUACDialog
# Result: platform === "linux" ternary confirmed at 1562
```

---

## Deviations from Plan

### Unexpected Finding: DeploymentMethod Instantiated on Linux

**Found during:** Task 2

**Issue:** The plan stated the "Run as Administrator" string is unreachable because `symlink_activator_elevate/index.ts:49` exits early. While `monitorConsent()` does exit early, the `DeploymentMethod` class constructor (line 1137) is called unconditionally — including on Linux. This means the string IS passed to `super()` on Linux.

**Resolution:** The string remains unreachable to the *user* because:
1. `isSupported()` at line 240 returns `IUnavailableReason` on non-Windows
2. `getSupportedActivators()` filters out activators with errors from `allTypesSupported()`
3. The dropdown at `Settings.tsx:1292` only renders `getSupportedActivators()` results

The plan's `must_haves.truths` claim that the string is unreachable is **correct in effect** — a Linux user never sees it — but the mechanism involves two guards (monitorConsent early return + isSupported filtering) rather than one.

**Impact:** No code change needed. The SUMMARY documents the complete reachability analysis.

**Classification:** Informational finding — no rule triggered (no bug, no missing functionality, no blocker).

---

## Stubs

None — this plan makes no code changes.

## Threat Flags

None — this plan makes no code changes and introduces no new network endpoints, auth paths, or trust boundaries.

---

## ONBRD-03c/03d Verification Summary

| Requirement | Status | Mechanism |
|-------------|--------|-----------|
| ONBRD-03c: EPERM/EACCES path produces actionable Linux message without admin language | SATISFIED | `nativeErrors.ts:13` returns undefined on non-win32; `message.ts:421` EPERM handler is clean |
| ONBRD-03d: Zero reachable "Run as Administrator" strings on Linux | SATISFIED | 1 occurrence found (symlink_activator_elevate:121); unreachable via `isSupported()` returning IUnavailableReason on non-Windows |

Both requirements satisfied by existing guards. No code changes required.

## Self-Check: PASSED

- SUMMARY.md created at `.planning/phases/20-windows-string-purge/20-02-SUMMARY.md` ✓
- All verification commands executed and documented ✓
- ONBRD-03c and ONBRD-03d both verified ✓
- No code changes made (audit-only plan) ✓
- Unexpected finding (DeploymentMethod instantiation on Linux) documented and resolved ✓
