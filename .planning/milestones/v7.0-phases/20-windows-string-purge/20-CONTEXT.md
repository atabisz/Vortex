# Phase 20: Windows String Purge - Context

**Gathered:** 2026-04-16
**Status:** Ready for planning

<domain>
## Phase Boundary

Platform-guard all Windows-specific error strings so no UAC prompts, "Run as Administrator" text,
or Windows-account language is visible to a Linux user in any reachable first-run error path.

**In scope:** ONBRD-03a, ONBRD-03b, ONBRD-03c, ONBRD-03d
**Out of scope:** New error handling features, string changes outside the four identified sites,
symlink_activator_elevate (already unreachable on Linux)

</domain>

<decisions>
## Implementation Decisions

### raiseUACDialog — Linux message body (ONBRD-03a)

- **D-01:** Add a Linux arm to `raiseUACDialog` in `fs.ts:1552`. The Windows arm message tail
  "Windows will show an UAC dialog." is replaced on Linux with "You will be asked for your password."
  Full Linux message: `'Vortex needs to access "{{ fileName }}" but doesn\'t have permission to.\nIf your account has admin rights Vortex can unlock the file for you. You will be asked for your password.'`
- **D-02:** Button labels `["Cancel", "Retry", "Give permission"]` are platform-neutral — no change
  needed. "Give permission" already describes what happens correctly on Linux (pkexec elevation).
- **D-03:** Windows arm is preserved unchanged. Platform guard: ternary on `process.platform === 'linux'`
  inside the `message` string field.

### confirmElevate — dialog text and button label (ONBRD-03b)

- **D-04:** Both the dialog text and button label get Linux arms in `Settings.tsx:730`.
  - Linux dialog text: `"This directory is not writable. Vortex can create it with elevated permissions."`
  - Linux button label: `"Create with elevated permissions"`
  - Windows text and button label remain unchanged.
- **D-05:** Platform guard: `process.platform === 'linux'` ternary on the `text` string and on the
  button label string.

### nativeErrors.ts / EPERM path audit (ONBRD-03c)

- **D-06:** `decodeSystemError()` already returns `undefined` on non-Windows (line 13 guard).
  `message.ts:421` already handles `err.code === 'EPERM'` with clean Linux-safe copy
  ("write protected" — no admin language). No "Run as Administrator" fallthrough exists in the
  EPERM/EACCES call path on Linux.
- **D-07:** Phase 20 does **not** add a Linux arm to `nativeErrors.ts`. The requirement ONBRD-03c
  is satisfied by the existing `message.ts` EPERM handler. The plan must verify this claim by
  tracing all `decodeSystemError` callers and confirming no "Run as Administrator" fallthrough exists,
  then document it as verified rather than adding dead code.

### symlink_activator_elevate (ONBRD-03d coverage)

- **D-08:** `symlink_activator_elevate/index.ts:49` already exits early on non-Windows
  (`if (process.platform !== 'win32') return`). The "Run as Administrator" strings at lines 121–123
  are unreachable on Linux. No changes to this file in Phase 20.

### Claude's Discretion

- Exact surrounding whitespace and ternary structure in the `raiseUACDialog` message string.
- Whether the Linux message in `raiseUACDialog` uses `\n` or `" "` as the sentence separator
  (match the existing Windows message format).
- Log level and message for any audit trace added during the EPERM path verification.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase Requirements
- `.planning/REQUIREMENTS.md` §Windows String Purge (ONBRD-03) — all four sub-requirements

### Key Source Files
- `src/renderer/src/util/fs.ts:1552` — `raiseUACDialog` function; the message body containing "Windows will show an UAC dialog."
- `src/renderer/src/util/fs.ts:427–452` — first `Access denied` dialog (uses wholocks; separate from raiseUACDialog — review but likely already clean)
- `src/renderer/src/extensions/download_management/views/Settings.tsx:730` — `confirmElevate` method; "windows user account" text + "Create as Administrator" button label
- `src/renderer/src/util/nativeErrors.ts:7` — `decodeSystemError`; returns `undefined` on non-Windows at line 13
- `src/renderer/src/util/message.ts:421` — `err.code === 'EPERM'` handler; already Linux-safe
- `src/renderer/src/extensions/symlink_activator_elevate/index.ts:49` — early-exit platform guard; "Run as Administrator" strings in dead code on Linux

### Patterns to Follow
- Phase 18 CONTEXT.md D-01/D-05: `process.platform === 'linux'` ternary guard pattern
- Phase 19 CONTEXT.md D-09: Windows text preserved unchanged; Linux arm added alongside

No external specs — requirements fully captured in decisions above.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `process.platform === 'linux'` ternary: established pattern across fs.ts, elevated.ts, todos.tsx,
  Settings.tsx (Phase 19) — use consistently
- `raiseUACDialog` already has a `t(...)` i18n call for the message body — the Linux arm needs to
  use `t()` as well for consistency

### Established Patterns
- Platform guard: ternary inside string argument or block-level `if` — both used in codebase; prefer
  ternary for single-field changes, block for multi-field changes
- Windows text preserved: never delete or rewrite Windows strings — add Linux arm alongside

### Integration Points
- `raiseUACDialog` in fs.ts: one surgical change to the `message` field of the `options` object
- `confirmElevate` in Settings.tsx: two surgical changes — `text` field in the dialog spec and button
  label string in the buttons array
- No new imports required for either change

</code_context>

<specifics>
## Specific Ideas

- **raiseUACDialog**: The Windows message uses a two-sentence structure: `[permission needed]` +
  `[UAC mechanism]`. The Linux arm mirrors this: `[permission needed]` + `[pkexec mechanism]`.
  Keeps the dialog structurally identical between platforms.
- **confirmElevate**: "Create with elevated permissions" mirrors the Windows "Create as Administrator"
  intent without the Windows concept. Button label change is important — it's a CTA the user clicks.
- **EPERM audit**: The plan must grep for any remaining "Run as Administrator" in rendered error
  paths and confirm the count is zero before marking ONBRD-03d satisfied.

</specifics>

<deferred>
## Deferred Ideas

- Audit of `Access denied` dialog in `fs.ts:427` (the wholocks path) — currently says "If your
  account has admin rights Vortex can try to unlock the file for you." This is borderline: it doesn't
  say "Windows" or "UAC" but implies admin-rights elevation. Review during implementation; guard only
  if "Run as Administrator" or Windows-specific text is found.
- Full i18n / translation key extraction for Linux-specific strings — out of scope for v7.0.

</deferred>

---

*Phase: 20-windows-string-purge*
*Context gathered: 2026-04-16*
