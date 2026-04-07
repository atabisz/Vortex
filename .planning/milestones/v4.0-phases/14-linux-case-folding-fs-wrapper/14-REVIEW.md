---
phase: 14-linux-case-folding-fs-wrapper
reviewed: 2026-04-07T00:00:00Z
depth: standard
files_reviewed: 8
files_reviewed_list:
  - src/renderer/src/util/resolvePathCase.ts
  - src/renderer/src/util/resolvePathCase.test.ts
  - src/renderer/src/util/fs.ts
  - src/renderer/src/util/fs.test.ts
  - src/renderer/src/util/api.ts
  - src/renderer/src/extensions/mod_management/LinkingDeployment.ts
  - src/renderer/src/extensions/mod_management/InstallManager.ts
  - extensions/gamebryo-plugin-management/src/util/PluginPersistor.ts
findings:
  critical: 0
  warning: 2
  info: 3
  total: 5
status: issues_found
---

# Phase 14: Code Review Report

**Reviewed:** 2026-04-07
**Depth:** standard
**Files Reviewed:** 8
**Status:** issues_found

## Summary

This phase introduces `resolvePathCase`, a case-folding path resolution utility for Linux case-sensitive filesystems. The implementation is clean and the design decisions (Wine-prefix guard, leaf-only resolution in the fs shim, per-`finalize()` dirCache in `LinkingDeployment`) are sound. `resolvePathCase.ts` and its tests are high quality. `PluginPersistor.ts` gets a correct `toLowerCase()` fix for Wine-generated filenames.

Two warnings stand out. The first is a type-correctness issue in `doSerialize` that was introduced as part of this phase's new call sites: `doSerialize()` silently returns `undefined` (not `Promise<void>`) for guard exits, and the callers in the new `foreignApp` recovery logic paper over this with `?? Promise.resolve()` instead of fixing the root cause. The second is a logic gap in `resolveCaseIfWinePrefix` that means deeply nested Wine prefix paths whose parent directories also have wrong casing will not be fully resolved. Three info items cover a test ordering inconsistency, a stale `substr` usage, and the missing return-type annotation on `encodingFromBOM`.

---

## Warnings

### WR-01: `doSerialize` returns `undefined` but callers expect `Promise<void>`

**File:** `extensions/gamebryo-plugin-management/src/util/PluginPersistor.ts:299-303`

**Issue:** `doSerialize` is declared `private doSerialize(): Promise<void>` but its two early-exit guard paths explicitly `return;` (returning `undefined`), not `return Promise.resolve()`. Two call sites introduced as part of this phase's recovery logic work around this with `?? Promise.resolve()` at lines 506 and 595. The `??` suppresses the symptom but the underlying function is incorrectly typed and callers relying on its declared return type without the null-coalescing guard would get a runtime crash on the non-happy paths.

**Fix:**

```typescript
private doSerialize(): Promise<void> {
  if (this.mPluginPath === undefined || this.mDataPath === undefined) {
    return Promise.resolve();
  }
  if (this.mKnownPlugins === undefined) {
    return Promise.resolve();
  }
  // ... rest of implementation
```

Once the guard returns are fixed, the `?? Promise.resolve()` at lines 506 and 595 can be dropped:

```typescript
// line 506: was: return this.doSerialize() ?? Promise.resolve();
return this.doSerialize();

// line 595: was: return this.doSerialize() ?? Promise.resolve();
return this.doSerialize();
```

---

### WR-02: `resolveCaseIfWinePrefix` only resolves the leaf, not intermediate directories

**File:** `src/renderer/src/util/fs.ts:602-609`

**Issue:** `resolveCaseIfWinePrefix` splits `absPath` into `dir` and `base` and calls `resolvePathCase(dir, base)` — resolving only the final filename segment. If any *parent* directory within the Wine prefix also has wrong casing (e.g. the path was constructed entirely from a Windows manifest with wrong case), intermediate segments will not be corrected. In the deployment workflow `resolvePathCase` is called with the full relative path, so parent segments are correctly resolved there. But for the `readFileAsync`/`statAsync`/`writeFileAsync` shim, only the leaf gets fixed.

This is a known scope decision (the comments reference "D-09 — safety net for scattered individual calls"), but the behaviour should be documented clearly and the scope limitation should be noted in a comment so future callers don't assume full-path resolution.

**Fix:** Add an explicit comment acknowledging the limitation and the reason for it:

```typescript
/**
 * For Wine prefix paths on Linux, resolve on-disk casing of the leaf
 * file/directory. No dirCache per D-09 — this is a safety net for
 * scattered individual calls, not a bulk deployment loop.
 *
 * NOTE: Only the final path segment (basename) is resolved. Intermediate
 * directories are NOT walked. If a Wine prefix has wrong-cased parent dirs
 * that are also wrong-cased, callers must pre-resolve the full path via
 * resolvePathCase(rootDir, relPath) before calling these fs functions.
 */
async function resolveCaseIfWinePrefix(absPath: string): Promise<string> {
```

If full-path resolution is ever needed, `resolvePathCase("/", absPath)` (rooted at `/`) would achieve it, at the cost of many more `readdir` calls.

---

## Info

### IN-01: Test cases are numbered out of order

**File:** `src/renderer/src/util/resolvePathCase.test.ts:96-128`

**Issue:** "Test 6" appears at line 96 and "Test 5" appears at line 114, so the numbering is inverted in the file. This is cosmetic but will cause confusion when reading test output or referencing tests by number.

**Fix:** Swap the test labels so numbering matches file order, or re-order the test blocks to match their labels.

---

### IN-02: `String.prototype.substr` is deprecated

**File:** `src/renderer/src/extensions/mod_management/LinkingDeployment.ts:997`

**Issue:** `backupPath.substr(0, backupPath.length - BACKUP_TAG.length)` uses the deprecated `substr`. This is pre-existing code, not introduced in this phase, but the file is in scope.

**Fix:**

```typescript
const targetPath = backupPath.slice(0, backupPath.length - BACKUP_TAG.length);
```

---

### IN-03: `encodingFromBOM` return type does not include `undefined`

**File:** `src/renderer/src/util/fs.ts:1553-1566`

**Issue:** The declared return type is `{ encoding: string; length: number }` but the function returns `undefined` on the no-BOM path (line 1565). TypeScript does not catch this because the function body returns `undefined` implicitly without a type error in this configuration — but callers that do not check for `undefined` risk a runtime crash. This is pre-existing but the file is in scope. The call site at line 1582 correctly checks `if (detectedEnc === undefined)` so there is no current crash, but the type signature is misleading.

**Fix:**

```typescript
export function encodingFromBOM(buf: Buffer): {
  encoding: string;
  length: number;
} | undefined {
```

---

_Reviewed: 2026-04-07_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
