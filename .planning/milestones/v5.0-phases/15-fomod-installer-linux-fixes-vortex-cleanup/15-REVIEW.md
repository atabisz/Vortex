---
phase: 15-fomod-installer-linux-fixes-vortex-cleanup
reviewed: 2026-04-09T00:01:00Z
depth: standard
files_reviewed: 2
files_reviewed_list:
  - /home/alex/src/fomod-installer/src/InstallScripting/XmlScript/XmlScriptInstaller.cs
  - src/renderer/src/extensions/mod_management/InstallManager.ts
findings:
  critical: 0
  warning: 1
  info: 2
  total: 3
status: issues_found
---

# Phase 15: Code Review Report

**Reviewed:** 2026-04-09T00:01:00Z
**Depth:** standard
**Files Reviewed:** 2 (plus 2 generated files skipped)
**Status:** issues_found

## Summary

Reviewed `XmlScriptInstaller.cs` (fomod-installer repo) and `InstallManager.ts` (Vortex renderer) for the phase 15 Linux fix changes. The two generated files (`api.d.ts`, `vortex.api.md`) contain no logic and were confirmed consistent with the API surface used.

The `NormalizePath` change in `XmlScriptInstaller.cs` is correct and safe. The `TextUtil.NormalizePath` implementation in `Utils/TextUtil.cs` always returns a non-null `string` (returns `string.Empty` for empty input), and the `matchedFiles[0]` access is guarded by a `count == 1` check immediately before the call. The downstream `InstallFileFromMod` function handles an empty `toPath` gracefully (falls back to `Path.GetFileName(fromPath)`), so even a degenerate empty-string path from `NormalizePath` would not crash.

The `reportUnsupported` changes in `InstallManager.ts` are mechanically correct. The `source === "CSharpScript"` filter precisely matches what the C# emitter sends: `Instruction.UnsupportedFunctionalityWarning("CSharpScript", ...)` sets `source = function` (i.e., `"CSharpScript"`), confirmed in `FomodInstaller.Interface/ModInstaller/Instruction.cs`. The `sendNotification` call is correctly typed — `"warning"` is a valid `NotificationType`.

One warning-level issue was found: the `replaceAll` removal on `copy.destination` (line 7950 of `InstallManager.ts`) means backslash-containing destination strings from the C# installer are no longer normalized to forward slashes before being passed to `path.join(destinationPath, destination)`. On Linux, `path.join` treats `\` as a literal character, which would produce a broken destination path. This is the line that was changed; the source path (`copy.source`) was never transformed by `replaceAll` and is unaffected.

Two info-level items are noted: the CSharpScript notification fires on macOS as well (the guard is `!== "win32"`), and the notification lacks a `title` field.

---

## Warnings

### WR-01: `replaceAll("\\", "/")` removal on `copy.destination` may break Linux paths

**File:** `src/renderer/src/extensions/mod_management/InstallManager.ts:7950`

**Issue:** The line `const destination = copy.destination.replaceAll("\\", "/");` was the only normalization step converting Windows-style backslash path separators in FOMOD destination strings into forward slashes before `path.join(destinationPath, destination)` is called. On Linux, `path.join` does not convert `\` — a destination like `Data\SKSE\Plugins\file.dll` would produce the path `<destinationPath>/Data\SKSE\Plugins\file.dll` as a single flat filename rather than a nested directory tree.

The C# `XmlScriptInstaller` now calls `NormalizeSeparators` on `strDest` before emitting the instruction, so well-formed XML FOMOD installers will produce clean destination strings. However, `replaceAll` removal is only safe if every code path that populates `copy.destination` — including the basic file installer, list installer, and any custom installer extensions — guarantees forward-slash-only destinations on all platforms. That guarantee is not enforced by the `IInstruction` type.

**Fix:** Either restore the `replaceAll` normalization unconditionally (it is a no-op when no backslashes are present, so there is no cost):

```typescript
const destination = copy.destination.replaceAll("\\", "/");
```

Or add a platform guard so it runs only on Linux, matching the same pattern used elsewhere in the file:

```typescript
const destination =
  process.platform !== "win32"
    ? copy.destination.replaceAll("\\", "/")
    : copy.destination;
```

---

## Info

### IN-01: CSharpScript notification fires on macOS as well as Linux

**File:** `src/renderer/src/extensions/mod_management/InstallManager.ts:4523`

**Issue:** The guard is `process.platform !== "win32"`, so the notification "This mod uses a C# installer script that cannot run on Linux" will also display on macOS. The message text says "Linux" explicitly, which would be misleading to a macOS user.

**Fix:** Either broaden the message text to say "non-Windows" / "this platform", or tighten the guard to `=== "linux"` if macOS is not a supported target:

```typescript
if (csharpUnsupported.length > 0 && process.platform === "linux") {
  api.sendNotification({
    type: "warning",
    message:
      "This mod uses a C# installer script that cannot run on Linux. " +
      "The mod was installed using basic file mapping. Some optional " +
      "components may be missing.",
  });
}
```

### IN-02: CSharpScript warning notification has no `title` field

**File:** `src/renderer/src/extensions/mod_management/InstallManager.ts:4524-4530`

**Issue:** The `sendNotification` call for the CSharpScript warning omits the optional `title` field. The `INotification` interface documents that `title` "should only be one or two words." Without a title the notification banner will show only the (long) `message` string, which is harder to scan at a glance.

**Fix:** Add a concise title:

```typescript
api.sendNotification({
  type: "warning",
  title: "C# script unsupported",
  message:
    "This mod uses a C# installer script that cannot run on Linux. " +
    "The mod was installed using basic file mapping. Some optional " +
    "components may be missing.",
});
```

---

## Generated Files

`packages/vortex-api/lib/api.d.ts` and `etc/vortex.api.md` are generated artifacts. The `IInstruction` interface declares `source?: string` (optional), which is consistent with the TypeScript code filtering `instr.source === "CSharpScript"`. The `INotification` interface declares `type: NotificationType` as required; `"warning"` is a valid value. No issues found in generated files.

---

_Reviewed: 2026-04-09T00:01:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
