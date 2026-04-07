---
phase: 11-persistent-elevation-token
reviewed: 2026-04-07T00:00:00Z
depth: standard
files_reviewed: 3
files_reviewed_list:
  - build/linux/10-vortex.rules
  - src/main/electron-builder.config.cjs
  - README.md
findings:
  critical: 0
  warning: 1
  info: 1
  total: 2
status: issues_found
---

# Phase 11: Code Review Report

**Reviewed:** 2026-04-07
**Depth:** standard
**Files Reviewed:** 3
**Status:** issues_found

## Summary

This phase adds a polkit JS rules file (`10-vortex.rules`) granting `AUTH_ADMIN_KEEP` for the Vortex elevation action, wires it into `.deb` packaging via `electron-builder.config.cjs`, and documents the `.deb` vs AppImage elevation difference in `README.md`.

The core implementation is correct: the rules file uses the right polkit API, references the correct action ID matching `io.nexusmods.vortex.policy`, and applies the `subject.active` session guard. The `.deb`-only scoping via `deb.extraFiles` (not `linux.extraFiles`) correctly excludes AppImage. The README documentation is accurate.

One warning: the existing `linux.extraFiles` entry in the builder config installs the `.policy` file to an absolute system path (`/usr/share/polkit-1/actions/`), which cannot be written by an AppImage at runtime. This pre-existing issue is not introduced by this phase but is worth flagging since the `.policy` file is a prerequisite for the rules file to function — AppImage users without the `.policy` file installed system-wide will have non-functional elevation. One informational note on the polkit rule's missing newline at EOF.

## Warnings

### WR-01: linux.extraFiles policy install path unreachable from AppImage

**File:** `src/main/electron-builder.config.cjs:64-69`

**Issue:** The `linux` section's `extraFiles` entry attempts to install `io.nexusmods.vortex.policy` to the absolute system path `/usr/share/polkit-1/actions/io.nexusmods.vortex.policy`. For an AppImage build, electron-builder places `extraFiles` entries inside the squashfs image — an absolute `to` path is interpreted as a path relative to the squashfs root, not the live filesystem. The `.policy` file therefore ends up embedded inside the AppImage at that path rather than installed to the running system. AppImage users will not have the polkit action registered, meaning `pkexec` calls using `io.nexusmods.vortex.run-elevated` will fail with "Not authorized" rather than prompting for a password.

This is a pre-existing issue (not introduced in this phase), but it is directly relevant because the polkit rules file added in this phase depends on the action being registered to have any effect. For `.deb` users the `.policy` file is installed correctly by `.deb`'s file placement mechanism, so the phase's core goal is achieved for `.deb`. AppImage elevation remains degraded for reasons beyond this phase's scope.

**Fix:** Move the `.policy` file entry from `linux.extraFiles` to `deb.extraFiles` (so only `.deb` gets it via the package manager's file placement), and document separately that AppImage users must manually install the `.policy` file, or provide a runtime installer. Alternatively, if AppImage elevation via a bundled polkit setup is a future goal, it requires a different mechanism (e.g., a `postinstall` script or in-app setup wizard).

```javascript
// Current (broken for AppImage — absolute path goes inside squashfs):
linux: {
  extraFiles: [
    {
      from: "../../build/linux/io.nexusmods.vortex.policy",
      to: "/usr/share/polkit-1/actions/io.nexusmods.vortex.policy",
    },
  ],
},

// Fix: move to deb.extraFiles alongside the rules file
deb: {
  depends: ["xdg-utils", "libasound2", "liblz4-1", "zlib1g"],
  artifactName: "vortex_amd64.deb",
  extraFiles: [
    {
      from: "../../build/linux/io.nexusmods.vortex.policy",
      to: "/usr/share/polkit-1/actions/io.nexusmods.vortex.policy",
    },
    {
      from: "../../build/linux/10-vortex.rules",
      to: "/etc/polkit-1/rules.d/10-vortex.rules",
    },
  ],
},
```

## Info

### IN-01: Polkit rules file missing trailing newline

**File:** `build/linux/10-vortex.rules:5`

**Issue:** The file ends at line 5 (`});`) without a trailing newline. POSIX text files are expected to end with a newline. While polkitd will parse the file correctly regardless, some tooling (linters, `diff`, `cat`) behaves better with a trailing newline, and it is the project's convention for source files.

**Fix:** Add a newline after the closing `});` on line 5. Most editors do this automatically; if the file was created via a tool that omitted it, re-save with the trailing newline.

---

_Reviewed: 2026-04-07_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
