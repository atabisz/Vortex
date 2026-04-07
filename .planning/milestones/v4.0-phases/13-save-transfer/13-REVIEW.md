---
phase: 13-save-transfer
reviewed: 2026-04-08T00:00:00Z
depth: standard
files_reviewed: 3
files_reviewed_list:
  - src/renderer/src/util/fs.ts
  - src/renderer/src/util/fs.test.ts
  - extensions/gamebryo-savegame-management/src/views/SavegameList.tsx
findings:
  critical: 1
  warning: 4
  info: 2
  total: 7
status: issues_found
---

# Phase 13: Code Review Report

**Reviewed:** 2026-04-08T00:00:00Z
**Depth:** standard
**Files Reviewed:** 3
**Status:** issues_found

## Summary

Three files were reviewed: the fs wrapper utility (`fs.ts`), its Vitest test suite (`fs.test.ts`), and the savegame transfer UI component (`SavegameList.tsx`).

`fs.ts` contains one critical defect — a `throw PromiseBB.reject(err)` that throws a Promise object rather than an error — and two warning-level logic bugs: a `nextName` counter that never increments (causing infinite `.1.1.1...` suffix growth instead of `.1`, `.2`, `.3`), and a BOM detection off-by-one that mishandles BOM-only files. `SavegameList.tsx` has two unhandled-promise patterns in action handlers and one permanently-true reference comparison. The test file is clean.

---

## Critical Issues

### CR-01: `throw PromiseBB.reject(err)` throws a Promise, not an Error

**File:** `src/renderer/src/util/fs.ts:559`
**Issue:** `throw PromiseBB.reject(err)` throws the rejected Promise object as a JavaScript exception. Callers that catch a thrown exception expect an `Error` instance; instead they receive a Bluebird Promise. This also creates a separate unhandled rejection for the thrown promise (no one catches the Bluebird rejection). The intent is clearly to either throw the error directly or return a rejected promise to the caller.
**Fix:**
```typescript
// Option A — return the rejection (preferred, keeps return type consistent):
return PromiseBB.reject(err);

// Option B — throw the error directly (not ideal inside a function that returns PromiseBB):
throw err;
```

---

## Warnings

### WR-01: `nextName` counter never increments — generates `.1.1.1…` instead of `.1`, `.2`, `.3`

**File:** `src/renderer/src/util/fs.ts:857-862`
**Issue:** `nextName` is supposed to return a unique name by appending an incrementing counter. On the first call `foo.esp` → `foo.1.esp` (correct). On subsequent calls `foo.1.esp` → `foo.1.1.esp`, then `foo.1.1.1.esp` — because `parseInt(path.extname("foo.1").slice(1), 10)` returns `1` every time, not an increment. The counter is never extracted and incremented; it just appends `.1` repeatedly. `moveRenameAsync` calls `nextName` recursively on EEXIST, so if a disk has `foo.esp`, `foo.1.esp`, and `foo.2.esp`, only `foo.esp` and `foo.1.esp` are avoided — `foo.1.1.esp`, `foo.1.1.1.esp`, etc. are tried instead.
**Fix:**
```typescript
function nextName(input: string): string {
  const ext = path.extname(input);
  const base = path.basename(input, ext);
  const innerExt = path.extname(base);
  const count = parseInt(innerExt.slice(1), 10);
  if (!isNaN(count)) {
    // Already has a numeric counter — increment it
    const stem = path.basename(base, innerExt);
    return path.join(path.dirname(input), `${stem}.${count + 1}${ext}`);
  } else {
    // No counter yet — start at 1
    return path.join(path.dirname(input), `${base}.1${ext}`);
  }
}
```

### WR-02: `encodingFromBOM` uses strict less-than, failing on BOM-only files

**File:** `src/renderer/src/util/fs.ts:1576`
**Issue:** The condition `b.bom.length < buf.length` excludes buffers whose length equals the BOM exactly (e.g., a file containing only a UTF-8 BOM — 3 bytes). For such a file the function returns `undefined`, so `readFileBOM` decodes the raw BOM bytes with the fallback encoding instead of stripping them. Should be `<=`.
**Fix:**
```typescript
b.bom.length <= buf.length && b.bom.compare(buf, 0, b.bom.length) === 0,
```

### WR-03: `remove` action handler — promise not returned, silent failure on remove error

**File:** `extensions/gamebryo-savegame-management/src/views/SavegameList.tsx:372-395`
**Issue:** The promise returned by `onShowDialog(...).then(...)` is not returned from `remove`. If `onRemoveSavegames` rejects, the rejection is unhandled (no `.catch`). Additionally, `importProfileId` is passed directly as the target profileId (line 391), but `importProfileId` is `undefined` when the user is not in transfer mode — the deletion then operates on `undefined` as the profileId, which may silently delete from the wrong profile or no profile.
**Fix:**
```typescript
private remove = (instanceIds: string[]) => {
  const { t, currentProfile, onRemoveSavegames, onShowDialog } = this.props;
  const { importProfileId } = this.state;
  // Use the active profile if not in transfer mode
  const targetProfileId = importProfileId ?? currentProfile.id;

  return onShowDialog(
    "question",
    t("Confirm Deletion"),
    { text: t("Do you really want to remove these files?"), message: instanceIds.join("\n"), options: { translated: true } },
    [{ label: "Cancel" }, { label: "Delete" }],
  ).then((result: types.IDialogResult) => {
    if (result.action === "Delete") {
      return onRemoveSavegames(targetProfileId, instanceIds);
    }
    return Promise.resolve();
  }).catch((err) => {
    this.props.onShowError("Failed to remove savegames", err);
  });
};
```

### WR-04: `importSaves` action handler — promise not returned, error swallowed on `undefined` result path

**File:** `extensions/gamebryo-savegame-management/src/views/SavegameList.tsx:420-497`
**Issue:** The `onShowDialog(...).then(...).then(...).catch(...)` chain is not returned from `importSaves`. More critically, when `result.action === "Cancel"`, the first `.then` returns `undefined` (no explicit return). The second `.then` receives `undefined` as its argument, checks `result === undefined` (line 461), and early-returns — but `userCancelled` is true, so the notification block at line 467 would fire on the next path. However because `return` at line 462 exits early, the notification is never shown. The cancel notification at line 468 is dead code in the cancel path.
**Fix:** The cancel case should return from the promise chain before the result-processing `.then`, and the chain should be returned so errors propagate:
```typescript
private importSaves = (instanceIds: string[]) => {
  // ...
  return onShowDialog(/* ... */)
    .then((result: types.IDialogResult) => {
      if (result.action === "Cancel") {
        return Promise.reject(new util.ProcessCanceled("user cancelled"));
      }
      return onTransferSavegames(importProfileId, fileNames, result.action === "Copy");
    })
    .then((result: { errors: string[]; allowReport: boolean }) => {
      this.refreshImportSaves();
      if (result.errors === undefined || result.errors.length === 0) {
        this.context.api.sendNotification({ type: "success", message: t("{{ count }} savegame imported", { count: fileNames.length }), displayMS: 2000 });
      } else {
        this.context.api.showErrorNotification(t("Not all savegames could be imported"), result.errors.join("\n"), { allowReport: result.allowReport });
      }
    })
    .catch((err) => {
      if (!(err instanceof util.ProcessCanceled)) {
        this.context.api.showErrorNotification("Failed to import savegames", err);
      }
    });
};
```

---

## Info

### IN-01: `refreshImportSaves` reference comparison is always true

**File:** `extensions/gamebryo-savegame-management/src/views/SavegameList.tsx:413`
**Issue:** `if (importSaves !== savesDict)` compares two distinct object references — a snapshot from `this.state` captured at the start of the method against a freshly constructed `savesDict`. These are always different objects, so the condition is always `true` and the `if` branch is always taken. The guard is dead code.
**Fix:** Remove the comparison or replace it with a meaningful check (e.g., compare keys/lengths if you want to skip redundant state updates):
```typescript
// Simply always update — the if is misleading
this.nextState.importSaves = savesDict;
```

### IN-02: Test suite has no coverage for `nextName` / `moveRenameAsync`

**File:** `src/renderer/src/util/fs.test.ts`
**Issue:** The test file covers BOM detection and Wine prefix case-folding, but there are no tests for `nextName` or `moveRenameAsync`. The counter-increment bug in WR-01 went undetected because there is no test exercising the multi-collision rename path.
**Fix:** Add a test verifying that three consecutive EEXIST collisions produce `foo.1.esp`, `foo.2.esp`, `foo.3.esp` — not `foo.1.esp`, `foo.1.1.esp`, `foo.1.1.1.esp`.

---

_Reviewed: 2026-04-08T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
