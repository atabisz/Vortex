---
phase: 32-mod-management-hot-zone-v2-0-1
plan: 03
wave: 2
status: complete
requirements: [SYNC-32a]
dependency_graph:
    requires:
        - 32-02 (7 leaf files marker-free + harness skip-mode GREEN baseline)
    provides:
        - "5 mid-tier files marker-free on v8.1/config-bucket"
        - "transferPath playbook §4 surface in views/Settings.tsx preserved (4 hits at L58/321/381/568, master parity)"
        - "mod_management/ non-marker typecheck baseline collapsed from 260 to 0 (the entire JSX-cascade source — views/ModList.tsx — resolved)"
        - "Clean mid-tier imports for playbook-heavy tier (Plan 04) compilation"
    affects:
        - .planning/phases/32-mod-management-hot-zone-v2-0-1/32-04-PLAN.md
key-files:
    created:
        - .planning/phases/32-mod-management-hot-zone-v2-0-1/32-03-SUMMARY.md
    modified:
        - src/renderer/src/extensions/mod_management/modMerging.ts
        - src/renderer/src/extensions/mod_management/views/DeactivationButton.tsx
        - src/renderer/src/extensions/mod_management/views/Settings.tsx
        - src/renderer/src/extensions/mod_management/eventHandlers.ts
        - src/renderer/src/extensions/mod_management/views/ModList.tsx
decisions:
    - "Three PLAN-stated upstream-side resolutions (Settings.tsx import block, eventHandlers.ts import block, plus the upstream-side controls block in ModList.tsx) became HEAD-wins or HEAD-empty due to duplicate-import avoidance — Wave-1 precedent applied. In each case the upstream-side proposed imports for symbols already present elsewhere in the file. Result matches fork/master verbatim. Rule 1 fix (avoid lint/TS dup-import noise)."
    - "ModList.tsx region 2 was a partial upstream-wins: brought in the new controls (Dropzone..ZoomableImage) and UpdateState type that the file genuinely needed, while dropping duplicate showDialog/CollapseIcon/ComponentEx/DropdownButton imports that already existed above the conflict. Net effect = master parity."
    - "transferPath playbook §4 surface in views/Settings.tsx preserved verbatim: post-resolution count 4 = master analog 4 (lines 58 import, 321 method def, 381 outer call, 568 this.transferPath() call)."
    - "mod_management/ JSX-cascade typecheck baseline (260 errors all in views/ModList.tsx per Plan 01 Step F) collapsed to 0 the moment ModList.tsx markers cleared — exactly the predicted RESEARCH §5 outcome."
metrics:
    duration: ~10m
    completed: 2026-05-22
---

# Phase 32 Plan 03: Wave 2 — Mid-tier resolution Summary

5 mid-tier files resolved across 19 conflict regions on `v8.1/config-bucket`.
Each file landed as its own SSH-signed commit per D-32-08. Harness gates 1-6
stayed GREEN throughout (gate 7 expected-FAIL until phase end — Plan 06).

## Outcome

5 / 5 mid-tier files marker-free; 19 / 19 conflict regions resolved; 5 atomic
commits on `v8.1/config-bucket`. mod_management/ non-marker typecheck baseline
collapsed from **260 → 0** the moment ModList.tsx markers cleared.

## Per-file table

| #             | File                           | Regions | Stance split (HEAD / upstream-partial / smaller-diff)   | Commit SHA  | Harness exit | Typecheck (non-marker, bucket-scoped) |
| ------------- | ------------------------------ | ------: | ------------------------------------------------------- | ----------- | -----------: | ------------------------------------: |
| 1             | `modMerging.ts`                |       2 | 0 / 0 / 2                                               | `d231c12e8` |            0 |                                     0 |
| 2             | `views/DeactivationButton.tsx` |       1 | 0 / 0 / 1                                               | `282a4378f` |            0 |                                     0 |
| 3             | `views/Settings.tsx`           |       2 | 1 / 0 / 1 (HEAD-wins on transferPath import; dup-avoid) | `aec6d3125` |            0 |                                     0 |
| 4             | `eventHandlers.ts`             |       3 | 1 / 0 / 2 (HEAD-empty on dup-import block)              | `cb4453cfc` |            0 |                                     0 |
| 5             | `views/ModList.tsx`            |      11 | 0 / 1 (controls + UpdateState) / 10                     | `d9d98be7c` |            0 |                  **260 → 0** (bucket) |
| **Aggregate** | —                              |  **19** | **2 / 1 / 16**                                          | —           |        all 0 |        mm-bucket: 260 → 0 (collapsed) |

Stance summary across the wave: 2 HEAD regions (transferPath playbook §4
preservation + dup-import avoidance), 1 partial-upstream region (ModList
controls block sans dups), 16 smaller-diff regions matching fork/master
single-line layout. Zero clean upstream-wins regions — Wave-1 dup-import
precedent applied to every PLAN-suggested upstream-wins import block.

## Playbook gates: still GREEN

Final harness skip-mode run after the 5th commit:

```
OK:   §6 stagingDirHasFiles in InstallManager.ts (≥1 hit) + util/stagingIntegrity.ts present
OK:   §7a normalizeBackslashPaths in InstallManager.ts (≥3 hits: import + 2 call sites)
OK:   §7b mergeCaseConflictingDirs in InstallManager.ts (≥3 hits: import + 2 call sites)
OK:   §7c copy-loop replaceAll("\\","/") in InstallManager.ts (≥2 hits: source + destination)
OK:   §7d resolvePathCase(tempPath, …) in InstallManager.ts (≥1 hit)
OK:   140a57217 resolvePathCase(dataPath, …) in LinkingDeployment.ts (≥3 hits)
SKIP: no conflict markers in src/renderer/src/extensions/mod_management/ (--skip-conflict-check)

CHECKPOINT PASSED — 6 gate(s) clean
exit=0
```

transferPath playbook §4 surface in `views/Settings.tsx`:

- pre-resolve: 5 hits (4 master analog + 1 dup from upstream-side conflict)
- post-resolve: **4 hits at lines 58/321/381/568 — exact parity with `fork/master`**

## Typecheck baseline collapse — the Plan's central deliverable

Pre-Wave-2 baseline (after Plan 02): `extensions/mod_management/` non-marker
TS errors = **260**, all in `views/ModList.tsx` (JSX-cascade from unresolved
conflict markers per RESEARCH §5).

After ModList.tsx commit (`d9d98be7c`):

```
$ cd src/renderer && pnpm tsc -p tsconfig.json 2>&1 | grep "extensions/mod_management/" | grep -v TS1185 | wc -l
0
```

The entire 260-error JSX cascade evaporated as predicted. The remaining 3
files in `mod_management/` with conflict markers (`InstallManager.ts`,
`LinkingDeployment.ts`, `index.ts`) produce only TS1185 marker-syntax errors
which are filtered out — they generate **zero** non-marker errors at
type-check time.

Net: `mod_management/` is the first directory in the renderer to reach a
clean type-check baseline this phase. Plan 04 (playbook-heavy) inherits clean
mid-tier consumers.

## Issues encountered

### Stance deviation: PLAN's upstream-wins guidance superseded by Wave-1 dup-import precedent (Rule 1)

PLAN tasks 3, 4, and the import-block portion of task 5 prescribed
`upstream-wins` (or partial fork/upstream merge) for the import-block
regions. In every case, the upstream-side import additions duplicated symbols
already present elsewhere in the file:

- **`views/Settings.tsx`** R1: upstream proposed
  `import { getErrorCode, getErrorMessageOrDefault, unknownToError } from "@vortex/shared"`
  at L77 — already imported at L3.
- **`eventHandlers.ts`** R1: upstream proposed `import type InstallManager from "./InstallManager"`,
  `import { currentActivator, ... } from "./selectors"`, `import { ensureStagingDirectory } from "./stagingDirectory"`,
  `import * as _ from "lodash"`, `import type { RuleType } from "modmeta-db"`,
  `import * as path from "path"`, and the `@vortex/shared` import — every one already
  imported at lines 1-42.
- **`views/ModList.tsx`** R2: upstream's controls block included
  `showDialog`/`CollapseIcon`/`ComponentEx`/`DropdownButton` already imported above (HEAD-side R1).

Took HEAD-empty for the duplicates and HEAD-wins where possible. For ModList.tsx
R2 specifically, kept the unique upstream additions (`Dropzone`,
`EmptyPlaceholder`, `FlexLayout`, `Icon`, `IconBar`, `SuperTable`, `OptionsFilter`,
`TextFilter`, `IconButton`, `ZoomableImage`, plus `UpdateState` type) — these
were genuinely new and the file uses every one. Result matches `fork/master`
verbatim across all 5 files.

This is the same Rule 1 dup-import-avoidance pattern documented in 32-02
SUMMARY for `NotificationAggregator.ts` and `stagingDirectory.ts`. PATTERNS
table guidance was based on a textual read of the conflict markers; once
inspected with file context, the upstream sides were universally
duplicate-additions.

### oxfmt re-formats untouched lines on commit (out of scope, accepted)

Husky pre-commit `oxfmt` reformatted import order and trailing-comma style on
the post-conflict-resolution buffer. Specifically: alphabetical sort of
imports (matches `fork/master`'s order), trailing commas on multi-line
function calls. Behavioral content is intact in all cases. Wave-1 precedent
applies — outside our control mid-resolution. `--no-verify` was NOT used per
D-32-10.

### Local SSH signature verification quirk (cosmetic; carryover from Plan 02)

Same as Plan 02: `gpg.ssh.allowedSignersFile` not configured locally, so
`git log --show-signature` reports `N` (no signature). Each commit object
DOES carry a `gpgsig -----BEGIN SSH SIGNATURE-----` block — verifiable via
`git cat-file -p <sha> | grep -c gpgsig` (returns 1).

The plan's automated `<verify>` blocks include
`git log -1 --show-signature 2>&1 | grep -q 'Good "git" signature'` — that
grep cannot pass on this sandbox for the reason above. Substitute
verification: every commit in `8f0765278..HEAD` contains a `gpgsig` block
(spot-checked via `git cat-file -p`).

## Affects

- Plan 04 (playbook-heavy: `LinkingDeployment.ts`, `InstallManager.ts`) now
  has clean mid-tier consumers — no JSX-cascade noise polluting type-check
  signal.
- Plan 04's pre-resolve typecheck baseline can use `mod_management/ = 0`
  as a clean reference. Any post-Plan-04 non-marker error is genuinely from
  Plan 04 work, not a leaked dependency.
- Plan 05 (`index.ts` barrel) inherits clean mid-tier exports.

## Provides

- 5 mid-tier files marker-free
- 5 SSH-signed atomic commits on `v8.1/config-bucket` (`d231c12e8`,
  `282a4378f`, `aec6d3125`, `cb4453cfc`, `d9d98be7c`)
- transferPath playbook §4 surface intact (4 hits, master parity)
- `mod_management/` non-marker typecheck baseline = **0** (down from 260)
- 3 files remaining with conflict markers in `mod_management/`:
  `LinkingDeployment.ts`, `InstallManager.ts`, `index.ts` (all Plan 04/05
  territory per D-32-01 tier order)

## Patterns

The shared per-task workflow (steps 1-9 in PLAN 02 reused) ran end-to-end
across all 5 files without modification:

- **Pattern S1 (master-blob analog):** every mid-tier file had a clear
  `fork/master` analog; `diff -u` confirmed correct stance in <30s per file.
- **Pattern S2 (pre/post grep snapshot):** required only for `views/Settings.tsx`
  (transferPath playbook §4) — pre 5, post 4, master 4 ✓.
- **Pattern S3 (harness skip-mode):** ran after every commit, gates 1-6 GREEN.
- **Pattern S4 (bucket-scoped typecheck):** ran with the corrected
  `cd src/renderer && pnpm tsc -p tsconfig.json | grep <file> | grep -v TS1185 | wc -l`
  command; returned 0 for every file's path. The plan-level
  `mod_management/`-scoped run after ModList.tsx returned 0.
- **Pattern S5 (commit body template):** every commit body lists region split,
  gates affected, gates preserved, harness exit, typecheck count, and
  `--no-verify` status.

## Self-Check: PASSED

- 5 mid-tier files marker-free — verified
  (`git grep -l '^<<<<<<< ' src/renderer/src/extensions/mod_management/ | wc -l`
  returns 3 = 15 - 7 - 5).
- Remaining 3 marker files: `LinkingDeployment.ts`, `InstallManager.ts`,
  `index.ts` — verified.
- 5 commits on `v8.1/config-bucket` — verified
  (`git log --oneline 8f0765278..HEAD` returns 5 `resolve(mod-mgmt-v2.0.1):`
  lines + this docs commit).
- Each commit carries a `gpgsig` SSH signature block in its object —
  verifiable via `git cat-file -p`. Quirk acknowledged.
- transferPath grep parity 4 = 4 — verified.
- Harness skip-mode exits 0 (gates 1-6 GREEN) after the 5th commit — verified.
- `mod_management/` non-marker typecheck count = 0 — verified post-ModList.tsx
  commit, the central deliverable of this plan.
