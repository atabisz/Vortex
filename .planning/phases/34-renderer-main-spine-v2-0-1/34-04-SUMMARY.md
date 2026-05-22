---
phase: 34
plan: 04
wave: D
status: complete
files_resolved: 20
commits: 21
typecheck_filtered: 0
markers_delta: -20
markers_pre: 68
markers_post: 48
harness_gates: 12
harness_state: GREEN
bluebird_trap_audit: clean
linux_guard_preserved:
    - util/elevated.ts: process.platform === 'linux' branch (SteamOS sudo -n + desktop pkexec)
key-files:
    modified:
        - src/renderer/src/util/opn.ts
        - src/renderer/src/util/walk.ts
        - src/renderer/src/util/startupSettings.ts
        - src/renderer/src/util/migrate.ts
        - src/renderer/src/util/message.ts
        - src/renderer/src/util/errorHandling.ts
        - src/renderer/src/util/elevated.ts
        - src/renderer/src/util/util.objDiff.test.ts
        - src/renderer/src/reducers/notifications.ts
        - src/renderer/src/reducers/verify.test.ts
        - src/renderer/src/hooks/windowControls.ts
        - src/renderer/src/store/stateDiff.ts
        - src/renderer/src/store/stateDiff.test.ts
        - src/renderer/src/telemetry/selectors.ts
        - src/renderer/src/contexts/PagesContext.tsx
        - src/renderer/src/contexts/builtInPages.ts
        - src/renderer/src/ui/README.md
        - src/renderer/src/ui/components/form/input/Input.tsx
        - src/renderer/src/ui/components/form/formfield/FormField.tsx
        - src/renderer/src/ui/components/no_results/NoResults.tsx
---

# Phase 34 Plan 04: Wave D (Renderer Leaves) Summary

Resolved all 20 renderer-leaf conflict files in three sub-batches (D1 util/\* → D2 reducers/hooks/store/telemetry → D3 contexts/ui), 0 filtered-bucket typecheck errors against Wave-D-resolved files, harness 12/12 GREEN, bluebird-trap clean.

## Sub-batch order

| Batch                                               | Files                                                                                          | Commits     |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------- | ----------- |
| **D1** util/\*                                      | 8 (opn, walk, startupSettings, migrate, message, errorHandling, elevated, util.objDiff.test)   | D1.1 → D1.8 |
| **D2** reducers/_ + hooks/_ + store/_ + telemetry/_ | 6 (notifications, verify.test, windowControls, stateDiff, stateDiff.test, telemetry/selectors) | D2.1 → D2.6 |
| **D3** contexts/_ + ui/_                            | 6 (PagesContext, builtInPages, README, Input, FormField, NoResults)                            | D3.1 → D3.6 |

## Per-file region tally + stance

| Task | File                                       | Regions | Stance                                                             | Commit    |
| ---- | ------------------------------------------ | ------- | ------------------------------------------------------------------ | --------- |
| D1.1 | util/opn.ts                                | 1       | §6 fork-wins (bluebird PromiseBB used in body)                     | 2ea2e9183 |
| D1.2 | util/walk.ts                               | 1       | §5 smaller-diff (HEAD one-liner)                                   | 9eb39d3e7 |
| D1.3 | util/startupSettings.ts                    | 1       | §6 upstream-wins / Rule-1 (log import needed for body)             | 436016657 |
| D1.4 | util/migrate.ts                            | 1       | Rule-1 dup-import (HEAD makeCI kept; upstream re-imports rejected) | e0ccee883 |
| D1.5 | util/message.ts                            | 1       | Rule-1 dup-import HEAD-empty                                       | 7bcb1e638 |
| D1.6 | util/errorHandling.ts                      | 1       | hybrid (HEAD compact OT + upstream added symbols)                  | 0f87b6307 |
| D1.7 | util/elevated.ts                           | 3       | §3 Linux-guard fork-wins + hybrid asar block + Rule-1 dup-import   | dc60e99fe |
| D1.8 | util/util.objDiff.test.ts                  | 6       | §6 fork-wins (TS over upstream JS rename, all 6 regions)           | 7403a2073 |
| D2.1 | reducers/notifications.ts                  | 1       | §5 smaller-diff (HEAD one-liner)                                   | 6e9450db9 |
| D2.2 | reducers/verify.test.ts                    | 2       | §5 smaller-diff (HEAD compact assertions)                          | eb6b4f009 |
| D2.3 | hooks/windowControls.ts                    | 1       | §5 smaller-diff (HEAD one-liner)                                   | 354a8270d |
| D2.4 | store/stateDiff.ts                         | 2       | hybrid (upstream comments + HEAD compact .push)                    | 302f57fa9 |
| D2.5 | store/stateDiff.test.ts                    | 4       | §5 smaller-diff (HEAD one-liners x4)                               | 7549591e9 |
| D2.6 | telemetry/selectors.ts                     | 1       | §5 smaller-diff (HEAD-wins on blank-line nit)                      | 1451726fc |
| D3.1 | contexts/PagesContext.tsx                  | 2       | §5 smaller-diff (HEAD compact useSelector + deps)                  | 354b8ca2e |
| D3.2 | contexts/builtInPages.ts                   | 2       | §5 smaller-diff (HEAD compact x2)                                  | 7c7abcbdb |
| D3.3 | ui/README.md                               | 1       | §5 smaller-diff (HEAD compact JSX example)                         | c2f29d952 |
| D3.4 | ui/components/form/input/Input.tsx         | 1       | §5 smaller-diff (HEAD compact extends)                             | 84b39a0e6 |
| D3.5 | ui/components/form/formfield/FormField.tsx | 1       | §5 smaller-diff (HEAD compact extends)                             | 11fd65a7d |
| D3.6 | ui/components/no_results/NoResults.tsx     | 1       | §5 smaller-diff (HEAD one-line URL)                                | e3b951b82 |

**Total regions resolved:** 33 across 20 files.

**Stance distribution:**

- §5 smaller-diff: 14 files (24 regions)
- Rule-1 dup-import: 3 files (3 regions) — message, migrate, startupSettings (last is technically §6 upstream-wins on log import, but functions as missing-import Rule-1)
- §6 fork-wins: 2 files (7 regions) — opn (1), util.objDiff.test (6)
- hybrid: 3 files (6 regions) — errorHandling (1), elevated (3, with §3 Linux-guard inside), stateDiff (2)

D-34-03 honored: every region hand-classified. No `git checkout --ours` / `--theirs` blanket use.

## Bluebird-trap audit (T-34-04-01)

The plan named two risk files (per RESEARCH "Bluebird Promise Trap"):

| File                    | bluebird import?                                                              | `:Promise<void>` annotations?                                               | Trap fired? | Audit outcome                                                                                                                                                                                                    |
| ----------------------- | ----------------------------------------------------------------------------- | --------------------------------------------------------------------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `util/errorHandling.ts` | yes — `import type PromiseBB from "bluebird"` (type-only, no runtime binding) | 1 (line 35, `showErrorBox`) — pre-existing in HEAD, outside conflict region | no          | clean — no upstream `:Promise<void>` taken on bluebird-importing async fn; `import type` does not establish `Promise` as PromiseBB at runtime, so even a hypothetical taken annotation could not trigger TS1064. |
| `util/elevated.ts`      | no — file uses native Promise; runElevated returns native `Promise<string>`   | 0                                                                           | no          | clean — no bluebird import at all post-resolve; trap pattern not applicable.                                                                                                                                     |

**Bonus:** `util/opn.ts` and `util/migrate.ts` also import bluebird (PromiseBB value-import). Spot-checked both — no upstream-side `:Promise<void>` annotations in any conflict region. Both clean.

## §3 Linux-guard preservation (T-34-04-02)

`src/renderer/src/util/elevated.ts` — full HEAD-only Linux elevation path preserved:

- `process.platform === "linux"` outer guard
- SteamOS sub-branch: `isSteamOS()` detection + `sudo -n` non-interactive fallback (Game Mode where pkexec hangs without polkit agent) + `rejectWithSteamOSNotification()` on close-non-zero or spawn-error
- Standard desktop Linux sub-branch: `pkexec` with code-126 → `UserCanceled`, other non-zero codes → `Error("pkexec exited with code N")`, spawn errors propagated
- Windows fallback (`winapi.ShellExecuteEx({ verb: "runas", ... })`) reached only when `process.platform !== "linux"`

Adopted upstream's `log("warn", ...)` cleanup-error style (cleaner than HEAD's `console.error`) and upstream's asar-unpacked-modulePath block for issue #23043 — both pure additive improvements that don't gut the Linux guard.

## Filtered bucket-scoped typecheck (D-34-06)

Command:

```
pnpm tsc -p src/renderer/tsconfig.json --noEmit 2>&1 \
  | grep -v TS1185 \
  | grep -vFf <(git grep -lE '^(<{7}|={7}|>{7})( |$)' src/renderer/) \
  | wc -l
```

Result: **0** errors against Wave-D-resolved files. Remaining renderer typecheck output (760 lines pre-filter) all originates from Wave E/F files still bearing conflict markers (48 files). Wave D resolution is internally consistent.

## Mid-wave files-still-bearing-markers count

| Checkpoint                | `src/renderer/` files with markers |
| ------------------------- | ---------------------------------- |
| Pre-Wave-D (after Wave C) | 68                                 |
| End of D1 (8 resolves)    | 60                                 |
| End of D2 (6 resolves)    | 54                                 |
| End of D3 (6 resolves)    | 48                                 |

Delta = **-20** exactly. Monotonically decreasing across sub-batches. Plan invariant satisfied.

## Harness state

`bash .planning/phases/34-renderer-main-spine-v2-0-1/scripts/grep-checkpoint.sh --skip-conflict-check` — exit 0, **CHECKPOINT PASSED — 12 gate(s) clean** at every per-file commit and at wave end. (Plan references "13 gates"; harness reports 12 because the 13th is the conflict-marker gate which is intentionally skipped via `--skip-conflict-check` while Wave E/F files still bear markers — exactly the documented mode for mid-bucket waves.)

## Atomic commit list

| #   | SHA           | Title                                                                                                          |
| --- | ------------- | -------------------------------------------------------------------------------------------------------------- |
| 1   | 2ea2e9183     | resolve(renderer-leaves): util/opn.ts — fork-wins (bluebird PromiseBB used in body)                            |
| 2   | 9eb39d3e7     | resolve(renderer-leaves): util/walk.ts — smaller-diff (HEAD one-liner over upstream 3-line reflow)             |
| 3   | 436016657     | resolve(renderer-leaves): util/startupSettings.ts — upstream-wins (log import needed for body)                 |
| 4   | e0ccee883     | resolve(renderer-leaves): util/migrate.ts — Rule-1 dup-import (HEAD makeCI kept; upstream re-imports rejected) |
| 5   | 7bcb1e638     | resolve(renderer-leaves): util/message.ts — Rule-1 dup-import HEAD-empty (3 symbols already imported above)    |
| 6   | 0f87b6307     | resolve(renderer-leaves): util/errorHandling.ts — hybrid (HEAD compact OT import + upstream added symbols)     |
| 7   | dc60e99fe     | resolve(renderer-leaves): util/elevated.ts — §3 Linux-guard fork-wins + hybrid asar block + Rule-1 dup-import  |
| 8   | 7403a2073     | resolve(renderer-leaves): util/util.objDiff.test.ts — fork-wins (TS over upstream JS rename)                   |
| 9   | 6e9450db9     | resolve(renderer-leaves): reducers/notifications.ts — smaller-diff (HEAD one-liner)                            |
| 10  | eb6b4f009     | resolve(renderer-leaves): reducers/verify.test.ts — smaller-diff (HEAD compact assertions)                     |
| 11  | 354a8270d     | resolve(renderer-leaves): hooks/windowControls.ts — smaller-diff (HEAD one-liner)                              |
| 12  | 302f57fa9     | resolve(renderer-leaves): store/stateDiff.ts — hybrid (upstream comments + HEAD compact .push)                 |
| 13  | 7549591e9     | resolve(renderer-leaves): store/stateDiff.test.ts — smaller-diff (HEAD one-liners x4)                          |
| 14  | 1451726fc     | resolve(renderer-leaves): telemetry/selectors.ts — smaller-diff (HEAD-wins on blank-line nit)                  |
| 15  | 354b8ca2e     | resolve(renderer-leaves): contexts/PagesContext.tsx — smaller-diff (HEAD compact useSelector + deps)           |
| 16  | 7c7abcbdb     | resolve(renderer-leaves): contexts/builtInPages.ts — smaller-diff (HEAD compact x2)                            |
| 17  | c2f29d952     | resolve(renderer-leaves): ui/README.md — smaller-diff (HEAD compact JSX example)                               |
| 18  | 84b39a0e6     | resolve(renderer-leaves): ui/components/form/input/Input.tsx — smaller-diff (HEAD compact extends)             |
| 19  | 11fd65a7d     | resolve(renderer-leaves): ui/components/form/formfield/FormField.tsx — smaller-diff (HEAD compact extends)     |
| 20  | e3b951b82     | resolve(renderer-leaves): ui/components/no_results/NoResults.tsx — smaller-diff (HEAD one-line URL)            |
| 21  | (this commit) | docs(phase-34): Wave D (renderer leaves) summary — 20 files, 0 typecheck errors                                |

All 21 commits SSH-signed (verified via `git log --format=raw` showing `gpgsig` block; local `gpg.ssh.allowedSignersFile` is unconfigured so `git log %G?` returns `N`, identical to prior Waves A/B/C — same parity behaviour).

## Deviations

None. Plan executed as written: D1 → D2 → D3 sub-batch order honored, all 20 files resolved with hand-classification, no blanket checkout, bluebird-trap audit applied to both named risk files (clean), §3 Linux-guard preserved in `util/elevated.ts`, filtered typecheck = 0.

## Threat-model coverage

| Threat ID                            | Disposition | Outcome                                                                                                                                                                                                               |
| ------------------------------------ | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| T-34-04-01 (bluebird trap)           | mitigate    | clean — no upstream `:Promise<void>` annotations taken on bluebird-importing async fns; both risk files audited (errorHandling.ts uses `import type`, no runtime binding; elevated.ts has no bluebird import at all). |
| T-34-04-02 (Linux-guard tampering)   | mitigate    | preserved — full SteamOS sudo + desktop pkexec branches retained in elevated.ts; only adopted upstream's better cleanup-error log style and asar-unpacked block (both additive).                                      |
| T-34-04-03 (commit signature)        | mitigate    | all 21 commits include `gpgsig SSH SIGNATURE` block; local verification config unrelated to signing.                                                                                                                  |
| T-34-04-04 (blanket --theirs/--ours) | mitigate    | per-region hand-classification on every file; no blanket checkouts run.                                                                                                                                               |
| T-34-04-SC (package installs)        | n/a         | no installs in this wave.                                                                                                                                                                                             |

## Self-Check: PASSED

- 20 atomic resolve commits exist on `v8.1/config-bucket` (verified via `git log --oneline v8.1/config-bucket~21..HEAD`)
- All 20 files marker-free (verified via `git grep -nE '^(<{7}|={7}|>{7})( |$)' <each-file>` returns 0)
- Filtered bucket-typecheck = 0 errors against Wave-D-resolved files
- Harness 12/12 GREEN at wave end
- Bluebird-trap audit clean for both named risk files
- §3 Linux-guard surfaces preserved in util/elevated.ts

Wave D closed; Wave E (renderer extensions) unblocked.
