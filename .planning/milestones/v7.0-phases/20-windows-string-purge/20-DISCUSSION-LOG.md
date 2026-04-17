# Phase 20: Windows String Purge - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-16
**Phase:** 20-windows-string-purge
**Areas discussed:** Linux permission dialog copy, confirmElevate button label, nativeErrors.ts approach, symlink_activator_elevate scope

---

## Linux permission dialog copy

| Option | Description | Selected |
|--------|-------------|----------|
| pkexec-specific | Replace "Windows will show an UAC dialog." with "You will be asked for your password." | ✓ |
| Minimal — omit mechanism | Drop the OS-specific tail entirely — shorter, accurate, less informative | |
| You decide | Any phrasing that removes the UAC reference | |

**User's choice:** pkexec-specific
**Notes:** Mirrors the two-sentence Windows message structure. Button label "Give permission" is already platform-neutral — no change needed.

---

## confirmElevate button label

| Option | Description | Selected |
|--------|-------------|----------|
| Both text + button label | Fix "windows user account" text AND change "Create as Administrator" to "Create with elevated permissions" | ✓ |
| Text only, keep button | Fix the text but keep "Create as Administrator" button | |
| You decide | Claude picks appropriate Linux variants | |

**User's choice:** Both text + button label
**Notes:** Button labels are CTAs the user clicks — "Create as Administrator" is Windows-specific and should have a Linux arm.

---

## nativeErrors.ts approach

| Option | Description | Selected |
|--------|-------------|----------|
| Verify EPERM path is clean, no changes | Confirm message.ts:421 already handles EPERM cleanly; document as satisfied | ✓ |
| Add explicit Linux arm anyway | Add platform-guarded Linux section to decodeSystemError() | |
| Trace full error call chain first | Trace every EPERM/EACCES path before deciding | |

**User's choice:** Verify the EPERM path is clean, no changes
**Notes:** decodeSystemError() already returns undefined on non-Windows. message.ts:421 handles
EPERM with "write protected" copy — no admin language. ONBRD-03c satisfied by existing code;
plan must verify and document.

---

## symlink_activator_elevate scope

| Option | Description | Selected |
|--------|-------------|----------|
| No — already guarded, leave it | Extension exits early on non-Windows (line 49); strings are dead code | ✓ |
| Add platform-guarded names anyway | Change extension name/description to have Linux-specific variants | |

**User's choice:** No — already guarded, leave it
**Notes:** `if (process.platform !== 'win32') return` at line 49 makes lines 121–123 unreachable
on Linux. No diff needed; no upstream impact.

---

## Claude's Discretion

- Exact whitespace/ternary structure inside the `raiseUACDialog` message string
- Whether Linux message uses `\n` or `" "` as sentence separator
- Log level for any audit trace in the EPERM verification step

## Deferred Ideas

- `fs.ts:427` wholocks `Access denied` dialog — contains "admin rights" language; review during
  implementation, guard only if "Run as Administrator" text found
- Full i18n/translation key extraction for Linux strings — out of scope for v7.0
