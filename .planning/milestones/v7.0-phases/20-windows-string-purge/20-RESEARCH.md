# Phase 20: Windows String Purge - Research

**Researched:** 2026-04-16
**Domain:** Platform-conditional UI copy strings (TypeScript / React / Electron)
**Confidence:** HIGH

## Summary

Phase 20 is entirely a surgical copy-only phase. Every change is a two-arm ternary — the Windows
string is preserved byte-for-byte; a Linux arm is added alongside it. No new imports, no new
components, no architectural additions.

Two source files receive changes: `src/renderer/src/util/fs.ts` (one edit to the `message` field
in `raiseUACDialog`) and `src/renderer/src/extensions/download_management/views/Settings.tsx` (two
edits to `confirmElevate`: the dialog `text` field and the `"Create as Administrator"` button label).

Two additional sites — `nativeErrors.ts` and `symlink_activator_elevate/index.ts` — have been
pre-audited in CONTEXT.md. Both are confirmed clean on Linux: `nativeErrors.ts` early-returns
`undefined` on non-Windows at line 13, and `symlink_activator_elevate` exits early at line 49 for
non-Windows. The `message.ts` EPERM handler at line 421 is already Linux-safe. ONBRD-03c and
ONBRD-03d require verification of these claims as part of execution, not additional code changes.

**Primary recommendation:** Make the two ternary edits, then run a grep audit confirming zero
reachable "Run as Administrator" strings remain on Linux paths.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**D-01:** Add a Linux arm to `raiseUACDialog` in `fs.ts:1552`. The Windows arm message tail
"Windows will show an UAC dialog." is replaced on Linux with "You will be asked for your password."
Full Linux message:
`'Vortex needs to access "{{ fileName }}" but doesn\'t have permission to.\nIf your account has admin rights Vortex can unlock the file for you. You will be asked for your password.'`

**D-02:** Button labels `["Cancel", "Retry", "Give permission"]` are platform-neutral — no change
needed.

**D-03:** Windows arm is preserved unchanged. Platform guard: ternary on `process.platform === 'linux'`
inside the `message` string field.

**D-04:** Both the dialog text and button label get Linux arms in `Settings.tsx:730`.
- Linux dialog text: `"This directory is not writable. Vortex can create it with elevated permissions."`
- Linux button label: `"Create with elevated permissions"`
- Windows text and button label remain unchanged.

**D-05:** Platform guard: `process.platform === 'linux'` ternary on the `text` string and on the
button label string.

**D-06:** `decodeSystemError()` already returns `undefined` on non-Windows (line 13 guard).
`message.ts:421` already handles `err.code === 'EPERM'` with clean Linux-safe copy. No "Run as
Administrator" fallthrough exists in the EPERM/EACCES call path on Linux.

**D-07:** Phase 20 does **not** add a Linux arm to `nativeErrors.ts`. The requirement ONBRD-03c is
satisfied by the existing `message.ts` EPERM handler. The plan must verify this claim by tracing all
`decodeSystemError` callers and confirming no "Run as Administrator" fallthrough exists, then document
it as verified rather than adding dead code.

**D-08:** `symlink_activator_elevate/index.ts:49` already exits early on non-Windows
(`if (process.platform !== 'win32') return`). The "Run as Administrator" strings at lines 121–123
are unreachable on Linux. No changes to this file in Phase 20.

### Claude's Discretion

- Exact surrounding whitespace and ternary structure in the `raiseUACDialog` message string.
- Whether the Linux message in `raiseUACDialog` uses `\n` or `" "` as the sentence separator
  (match the existing Windows message format).
- Log level and message for any audit trace added during the EPERM path verification.

### Deferred Ideas (OUT OF SCOPE)

- Audit of `Access denied` dialog in `fs.ts:427` (the wholocks path)
- Full i18n / translation key extraction for Linux-specific strings
- New error handling features
- String changes outside the four identified sites
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| ONBRD-03a | `fs.ts` `raiseUACDialog` shows pkexec-specific message on Linux | D-01/D-03: two-arm ternary on `message` field, verified pattern from phases 18/19 |
| ONBRD-03b | `Settings.tsx:737` "windows user account" error text + "Create as Administrator" button label platform-guarded | D-04/D-05: two ternaries in `confirmElevate`, verified existing code |
| ONBRD-03c | EPERM/EACCES call path on Linux produces actionable message without "Run as Administrator" | D-06/D-07: verified via `nativeErrors.ts:13` early-return guard + `message.ts:421` EPERM handler |
| ONBRD-03d | No `"Run as Administrator"` visible to Linux user in any reachable first-run error path | D-08: `symlink_activator_elevate` unreachable on Linux; grep audit required at end of phase |
</phase_requirements>

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Platform-conditional dialog message copy | Renderer (React/TypeScript) | — | Dialog options objects are constructed in renderer-process TypeScript; `process.platform` is available in both main and renderer processes in Electron |
| UAC elevation dialog (`raiseUACDialog`) | Renderer utility (`fs.ts`) | — | Function lives in `src/renderer/src/util/fs.ts`; called from renderer-process file operations |
| Download path elevation confirm dialog (`confirmElevate`) | Renderer extension view (`Settings.tsx`) | — | Private method in React component class; called from `ensureDirWritableAsync` callback |
| EPERM error prettification | Renderer utility (`message.ts`) | — | `prettifyNodeErrorMessageInner` in `message.ts`; handles cross-platform POSIX errors |
| Windows native error decoding | Renderer utility (`nativeErrors.ts`) | — | `decodeSystemError` gated at line 13: returns `undefined` on non-Windows |

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| TypeScript | 5.9.3 | Language | Project standard; all source files |
| React | 16.12.0 | UI component | Renderer process standard |
| Electron | 39.8.0 | `process.platform` + `showMessageBox` | Project runtime |
| Vitest | 4.1.0 | Test runner | Project standard for renderer tests |

No new libraries are required for Phase 20. [VERIFIED: codebase grep + CLAUDE.md]

### Supporting

No supporting libraries beyond existing project stack. Phase 20 changes are string-only.

### Alternatives Considered

Not applicable — this phase has no library selection decisions. All tooling is established.

---

## Architecture Patterns

### System Architecture Diagram

```
Linux user triggers file operation
        |
        v
  renderer/src/util/fs.ts
  ensureDirWritableAsync() ──────> EPERM/EBADF error caught
        |                                    |
        |                          message.ts:421 (EPERM handler)
        |                          "write protected" — no admin language
        |
        v
  raiseUACDialog(t, err, op, filePath)
        |
        v
  options.message = process.platform === 'linux'
    ? t('<Linux copy>')    <── Phase 20 adds this arm
    : t('<Windows copy>')  <── unchanged
        |
        v
  showMessageBox(options)  ──────> user sees Linux-specific message
        |
     [Give permission] button
        |
        v
  elevated() via pkexec   ──────> "You will be asked for your password."
                                   matches what actually happens


Linux user changes download directory in Settings
        |
        v
  Settings.tsx
  onApply() -> ensureDirWritableAsync(newPath, this.confirmElevate)
        |
        EPERM caught in ensureDirWritableAsync
        |
        v
  confirmElevate() callback invoked
        |
        v
  onShowDialog("question", "Access denied", {
    text: process.platform === 'linux'
      ? "This directory is not writable..."  <── Phase 20 adds this arm
      : "This directory is not writable to the current windows user account..."
  }, [
    { label: "Cancel" },
    { label: process.platform === 'linux'
        ? "Create with elevated permissions"  <── Phase 20 adds this arm
        : "Create as Administrator" }
  ])


nativeErrors.ts decodeSystemError() — Linux path
        |
        v
  line 13: if (code === undefined || process.platform !== 'win32') return undefined;
        |
        v
  returns undefined on Linux ──> no Windows-specific error text ever rendered


symlink_activator_elevate/index.ts — Linux path
        |
        v
  line 49: if (process.platform !== 'win32') return;
        |
        v
  "Run as Administrator" strings at lines 121-123 are unreachable on Linux
```

### Recommended Project Structure

No structural changes. All edits are in-place within existing files.

```
src/renderer/src/
├── util/
│   ├── fs.ts               # Edit: raiseUACDialog message field (ONBRD-03a)
│   ├── nativeErrors.ts     # Read-only audit: line 13 guard confirmed clean
│   └── message.ts          # Read-only audit: EPERM handler at line 421 confirmed clean
└── extensions/
    ├── download_management/views/
    │   └── Settings.tsx    # Edit: confirmElevate text + button label (ONBRD-03b)
    └── symlink_activator_elevate/
        └── index.ts        # Read-only audit: line 49 early-return confirmed clean
```

### Pattern 1: Two-Arm Ternary for Platform-Conditional Strings

**What:** Replace a single string value with a ternary that selects a Linux or Windows arm.
The Windows arm is copied byte-for-byte from the original; the Linux arm is added alongside.

**When to use:** Any single-field string change where the value differs between Windows and Linux.

**Example (from fs.ts — Phase 20 target):**
```typescript
// Source: verified from src/renderer/src/util/fs.ts:1561 (current code)
// BEFORE (Windows-only):
message: t(
  'Vortex needs to access "{{ fileName }}" but doesn\'t have permission to.\n' +
    "If your account has admin rights Vortex can unlock the file for you. " +
    "Windows will show an UAC dialog.",
  { replace: { fileName: fileToAccess } },
),

// AFTER (platform-guarded):
message: process.platform === "linux"
  ? t(
      'Vortex needs to access "{{ fileName }}" but doesn\'t have permission to.\n' +
        "If your account has admin rights Vortex can unlock the file for you. " +
        "You will be asked for your password.",
      { replace: { fileName: fileToAccess } },
    )
  : t(
      'Vortex needs to access "{{ fileName }}" but doesn\'t have permission to.\n' +
        "If your account has admin rights Vortex can unlock the file for you. " +
        "Windows will show an UAC dialog.",
      { replace: { fileName: fileToAccess } },
    ),
```
[VERIFIED: source read; pattern confirmed across phases 18/19 decisions in STATE.md]

**Example (from Settings.tsx — Phase 20 target):**
```typescript
// Source: verified from src/renderer/src/extensions/download_management/views/Settings.tsx:730
// BEFORE (Windows-only):
{
  text:
    "This directory is not writable to the current windows user account. " +
    "Vortex can try to create the directory as administrator but it will " +
    "then have to give access to it to all logged in users.",
},
[{ label: "Cancel" }, { label: "Create as Administrator" }],

// AFTER (platform-guarded):
{
  text:
    process.platform === "linux"
      ? "This directory is not writable. Vortex can create it with elevated permissions."
      : "This directory is not writable to the current windows user account. " +
        "Vortex can try to create the directory as administrator but it will " +
        "then have to give access to it to all logged in users.",
},
[
  { label: "Cancel" },
  {
    label:
      process.platform === "linux"
        ? "Create with elevated permissions"
        : "Create as Administrator",
  },
],
```
[VERIFIED: source read; exact code at Settings.tsx:730-746]

### Pattern 2: t() Wrapping for i18n Consistency

**What:** Both arms of a platform ternary in `raiseUACDialog` must be wrapped in `t()` — the
existing Windows string uses `t()` for i18n, and the Linux arm must follow suit to avoid a
silent regression if translations are added later.

**When to use:** Any string change inside a function that already uses `t()` for i18n.

[VERIFIED: CONTEXT.md code_context section; `raiseUACDialog` uses `t(...)` for message body]

### Anti-Patterns to Avoid

- **Deleting or editing the Windows arm:** Never rewrite the existing Windows string. The ternary
  adds a Linux branch alongside; the Windows branch is a byte-for-byte copy of the original.
  Changing Windows copy silently breaks Windows wording and stales locale caches.
  [CITED: STATE.md "String changes must be NEW conditional branches, never edits to existing t('...') literals"]

- **Missing t() on the Linux arm:** If the function already wraps strings in `t()`, the Linux arm
  must also be wrapped. Omitting `t()` causes the string to be excluded from future translation
  pipelines.

- **Block-level if/else instead of ternary for single-field changes:** The project pattern for a
  single string field is a ternary inline inside the options object. A block-level `if` splits the
  entire function body and duplicates more code than needed. Use ternary for single-field changes,
  block for multi-field changes (CONTEXT.md code_context).

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Platform detection | Custom OS detection function | `process.platform === "linux"` / `process.platform !== "win32"` | Already available in Electron renderer process; established project pattern |
| Dialog rendering | Custom dialog component | `showMessageBox()` (fs.ts) / `onShowDialog()` (Settings.tsx) | Existing abstractions already handle Electron dialog lifecycle |

**Key insight:** Phase 20 has no library choices to make. Every tool is already in the codebase.

---

## Runtime State Inventory

> This phase is not a rename/refactor/migration — no runtime state is affected.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | None — string changes are in-process TypeScript, not persisted data | None |
| Live service config | None — no external service stores these dialog strings | None |
| OS-registered state | None | None |
| Secrets/env vars | None | None |
| Build artifacts | None — renderer TypeScript rebuilt at each `pnpm run build` | None |

---

## Common Pitfalls

### Pitfall 1: Ternary Condition Direction

**What goes wrong:** Developer writes `process.platform !== "linux"` (negation) and accidentally
puts the Linux copy in the `else` arm, making Windows users see the Linux message.

**Why it happens:** "Not Linux" = Windows feels natural when thinking defensively, but reverses
the arms.

**How to avoid:** Always use the positive form `process.platform === "linux"` with Linux arm first.
This is the established project convention across all existing platform guards.

**Warning signs:** Test by mentally tracing: on Windows `process.platform === "linux"` is `false`,
so the second (else) arm must be the Windows text.

### Pitfall 2: Line 13 Guard in nativeErrors.ts Is Non-Obvious

**What goes wrong:** Developer reads ONBRD-03c description ("nativeErrors.ts has a Linux arm for
EPERM/EACCES") and adds a new Linux branch to `decodeSystemError()`, creating dead code.

**Why it happens:** The requirement description was written before the audit. The audit (D-06/D-07)
determined no change is needed.

**How to avoid:** Read CONTEXT.md D-06 and D-07 before touching `nativeErrors.ts`. The plan task
for ONBRD-03c must be a verification task, not an edit task.

**Warning signs:** Any plan task that says "add Linux arm to nativeErrors.ts" contradicts CONTEXT.md.

### Pitfall 3: The wholocks `Access denied` Dialog at fs.ts:427–452

**What goes wrong:** Developer notices fs.ts:443 "If your account has admin rights Vortex can try
to unlock the file for you." and adds a Linux arm, then triggers a test failure because `wholocks`
is a Windows-only native module that throws on Linux.

**Why it happens:** The string is borderline but the CONTEXT.md explicitly defers this site.

**How to avoid:** The deferred section of CONTEXT.md explicitly excludes `fs.ts:427`. This dialog
path uses `wholocks.default(filePath)` which is a Windows-only native module — on Linux, the catch
block fires before the dialog renders. No Linux user can reach this dialog in the reachable error
path. Do not touch this site.

**Warning signs:** Any plan task touching fs.ts:412 (`unlockConfirm`) or lines 427–452 is out of
scope.

### Pitfall 4: ONBRD-03d Grep Audit Must Cover Rendered String Paths Only

**What goes wrong:** Grep finds `"Run as Administrator"` in `symlink_activator_elevate/index.ts:121`
and the developer flags the phase as failing ONBRD-03d.

**Why it happens:** The string exists in the class constructor's `name` parameter — but the entire
constructor is unreachable on Linux due to the `process.platform !== 'win32'` guard at line 49.

**How to avoid:** The grep audit for ONBRD-03d must evaluate reachability, not just presence. The
only remaining instance is at `symlink_activator_elevate/index.ts:121` and it is unreachable on
Linux. Documenting this as "found but unreachable" satisfies the requirement.

---

## Code Examples

Verified patterns from official sources:

### Existing raiseUACDialog (current — to be edited)

```typescript
// Source: src/renderer/src/util/fs.ts:1552-1570 (verified by Read tool)
function raiseUACDialog<T>(
  t: TFunction,
  err: any,
  op: () => PromiseBB<T>,
  filePath: string,
): PromiseBB<T> {
  let fileToAccess = filePath !== undefined ? filePath : err.path;
  const options: Electron.MessageBoxOptions = {
    title: "Access denied (2)",
    message: t(
      'Vortex needs to access "{{ fileName }}" but doesn\'t have permission to.\n' +
        "If your account has admin rights Vortex can unlock the file for you. " +
        "Windows will show an UAC dialog.",
      { replace: { fileName: fileToAccess } },
    ),
    buttons: ["Cancel", "Retry", "Give permission"],
    noLink: true,
    type: "warning",
  };
  // ...
}
```

### Existing confirmElevate (current — to be edited)

```typescript
// Source: src/renderer/src/extensions/download_management/views/Settings.tsx:730-747 (verified by Read tool)
private confirmElevate = (): PromiseBB<void> => {
  const { t, onShowDialog } = this.props;
  return onShowDialog(
    "question",
    "Access denied",
    {
      text:
        "This directory is not writable to the current windows user account. " +
        "Vortex can try to create the directory as administrator but it will " +
        "then have to give access to it to all logged in users.",
    },
    [{ label: "Cancel" }, { label: "Create as Administrator" }],
  ).then((result) =>
    result.action === "Cancel"
      ? PromiseBB.reject(new UserCanceled())
      : PromiseBB.resolve(),
  );
};
```

### decodeSystemError Linux early-return (current — no change needed)

```typescript
// Source: src/renderer/src/util/nativeErrors.ts:7-15 (verified by Read tool)
export function decodeSystemError(
  err: Error,
  filePath: string,
): IDecoded | undefined {
  const code = err["systemCode"] ?? err["nativeCode"];

  if (code === undefined || process.platform !== "win32") {
    return undefined;  // <-- Linux path: always returns undefined here
  }
  // ... Windows-only error handling follows
}
```

### message.ts EPERM handler (current — no change needed)

```typescript
// Source: src/renderer/src/util/message.ts:421-435 (verified by Read tool)
} else if (err.code === "EPERM") {
  const filePath = err.path || err.filename || undefined;
  const firstLine =
    filePath
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
No "Run as Administrator" language. Linux-safe as-is. [VERIFIED: source read]

---

## ONBRD-03d: Full "Run as Administrator" Audit Results

Grep across `src/**/*.{ts,tsx}` for the string `"Run as Administrator"`:

**Matches found:** [VERIFIED: Grep tool run during this research session]

| File | Line | Content | Reachable on Linux? |
|------|------|---------|---------------------|
| `src/renderer/src/extensions/symlink_activator_elevate/index.ts` | 121 | `"Symlink Deployment (Run as Administrator)"` (constructor name arg) | **No** — `if (process.platform !== 'win32') return` at line 49 exits before constructor executes any deployment logic; this is a class name string passed to the parent constructor, but the entire deployment method is skipped on non-Windows |

**Conclusion:** Zero reachable "Run as Administrator" strings exist on Linux after Phase 20's two
code changes. The single remaining occurrence is inside an unreachable code path on Linux.
[VERIFIED: Grep tool + Read of symlink_activator_elevate/index.ts:49]

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Single Windows-only dialog message string | Two-arm ternary with Linux arm added | Phase 20 (this phase) | Linux users see pkexec-appropriate language |
| "Create as Administrator" button label | Platform-guarded: "Create with elevated permissions" on Linux | Phase 20 (this phase) | Button label matches actual elevation mechanism |

**No deprecated patterns introduced.** All changes follow the established ternary guard pattern from
phases 18 and 19.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `wholocks.default(filePath)` throws or is not callable on Linux, making fs.ts:427 `unlockConfirm` unreachable before the dialog renders | Common Pitfalls #3 | If wholocks works on Linux, the dialog at fs.ts:443 could render to Linux users with borderline "admin rights" copy — but this is deferred by CONTEXT.md regardless |

The A1 assumption does not affect Phase 20 scope since CONTEXT.md explicitly defers that site.
If wrong, it becomes a Phase 21+ item.

---

## Open Questions

1. **`t()` wrapping on confirmElevate dialog text**
   - What we know: `confirmElevate` in Settings.tsx passes the `text` string as a plain string
     literal to `onShowDialog`, not wrapped in `t()`.
   - What's unclear: Should the Linux arm also skip `t()` to match the surrounding pattern?
   - Recommendation: Match the existing pattern — if the Windows arm is not wrapped in `t()`, the
     Linux arm should not be either. Consistency with the surrounding code takes priority.
     The CONTEXT.md does not prescribe `t()` wrapping for the Settings.tsx changes (only for
     `raiseUACDialog`). [VERIFIED: source read at Settings.tsx:730-746]

---

## Environment Availability

Step 2.6: SKIPPED — Phase 20 is purely TypeScript string changes with no external tool dependencies.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.0 |
| Config file | `src/renderer/vitest.config.mts` |
| Quick run command | `pnpm vitest run --project src/renderer src/renderer/src/util/fs.test.ts` |
| Full suite command | `pnpm vitest run --coverage` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ONBRD-03a | `raiseUACDialog` message ternary: Linux arm returns pkexec copy, Windows arm returns UAC copy | unit | `pnpm vitest run src/renderer/src/util/fs.test.ts` | ✅ (extend existing) |
| ONBRD-03b | `confirmElevate` dialog text + button label ternary: Linux arm returns correct copy | unit | `pnpm vitest run src/renderer/src/extensions/download_management/views/Settings.test.tsx` | ❌ Wave 0 — file does not exist |
| ONBRD-03c | Verification: `decodeSystemError` callers never produce "Run as Administrator" on Linux | manual-only | Grep audit (`grep -r "Run as Administrator" src/` + reachability analysis) | n/a |
| ONBRD-03d | No reachable "Run as Administrator" string in Linux error paths | manual-only | Grep audit as above | n/a |

**Note on ONBRD-03c and ONBRD-03d:** These requirements are satisfied by code-reading and grep
audit, not by new automated tests. The plan should include a dedicated verification task, not a new
test file.

### Sampling Rate
- **Per task commit:** `pnpm vitest run src/renderer/src/util/fs.test.ts`
- **Per wave merge:** `pnpm vitest run --coverage`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `src/renderer/src/extensions/download_management/views/Settings.test.tsx` — covers ONBRD-03b
  (`confirmElevate` Linux arm text and button label). This file likely does not exist; check before
  assuming. If it does not exist, a minimal test asserting the ternary outputs must be created or
  the requirement falls back to a manual smoke test.

*(Existing `fs.test.ts` infrastructure can be extended with a mock for `process.platform` using
`vi.stubGlobal` or `Object.defineProperty(process, 'platform', { value: 'linux' })` to test both
arms of the ternary in `raiseUACDialog`.)*

---

## Security Domain

> Phase 20 makes no changes to authentication, session management, access control, cryptography,
> or input validation. All changes are UI copy-only.

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | n/a |
| V3 Session Management | no | n/a |
| V4 Access Control | no | n/a |
| V5 Input Validation | no | n/a |
| V6 Cryptography | no | n/a |

**Threat pattern note:** The dialog messages changed in Phase 20 describe elevation prompts (pkexec
on Linux, UAC on Windows). The strings themselves carry no security risk — they are user-facing
informational copy. The actual elevation mechanism (`elevated()` via pkexec) is not modified.

---

## Sources

### Primary (HIGH confidence)
- `src/renderer/src/util/fs.ts` — Read lines 1552-1570 (raiseUACDialog), 412-458 (unlockConfirm/Access denied dialog)
- `src/renderer/src/util/nativeErrors.ts` — Read complete file; line 13 guard confirmed
- `src/renderer/src/util/message.ts` — Read lines 365-435; EPERM handler at 421 confirmed
- `src/renderer/src/extensions/download_management/views/Settings.tsx` — Read lines 720-750; confirmElevate confirmed
- `src/renderer/src/extensions/symlink_activator_elevate/index.ts` — Read lines 40-127; platform guard at 49 confirmed; "Run as Administrator" at 121 confirmed unreachable on Linux
- `.planning/phases/20-windows-string-purge/20-CONTEXT.md` — Locked decisions D-01 through D-08
- `.planning/phases/20-windows-string-purge/20-UI-SPEC.md` — Verbatim copy strings approved
- `.planning/STATE.md` — Pattern decisions from phases 18/19

### Secondary (MEDIUM confidence)
- `vitest.config.ts` + `src/renderer/vitest.config.mts` — Test configuration verified

### Tertiary (LOW confidence)
- None

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — codebase fully read, no library selection decisions
- Architecture: HIGH — all four target sites read directly from source
- Pitfalls: HIGH — derived from direct code reading, CONTEXT.md audit decisions, and project history
- String copy: HIGH — exact strings captured from UI-SPEC.md (approved) and CONTEXT.md

**Research date:** 2026-04-16
**Valid until:** Stable indefinitely — no external dependencies; all findings are from codebase
