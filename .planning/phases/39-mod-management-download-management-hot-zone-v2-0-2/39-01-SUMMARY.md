---
phase: 39-mod-management-download-management-hot-zone-v2-0-2
plan: "01"
subsystem: infra
tags: [conflict-resolution, pre-flight, lease-pin, typecheck-baseline, grep-harness]

requires:
    - phase: 38-config-bucket-v2-0-2
      provides: "Phase 38 final push result: fork/sync/upstream-v2.0.2 HEAD 84c3310a4"

provides:
    - "Lease pin 84c3310a448f0ad4a1988f82fe0fec4a06269b50 recorded for Phase 39 force-with-lease (plan 39-16)"
    - "140a57217 pre-resolution snapshot: LinkingDeployment.ts lines 536/763/820 at /tmp/LinkingDeployment.140a57217-pre.txt"
    - "4 ROADMAP-named clean files confirmed at zero conflict markers (skip-confirmed)"
    - "grep-checkpoint.sh harness confirmed executable and returning exit 0"
    - "Renderer-bucket typecheck baseline: 357 error lines, 335 TS1185 + 22 non-TS1185, across 45 files"

affects:
    - 39-02-PLAN through 39-15-PLAN (typecheck delta budget; any new errors beyond baseline = regression)
    - 39-15-PLAN (LinkingDeployment.ts resolution: consumes 140a57217 pre-resolution snapshot)
    - 39-16-PLAN (phase-end push: consumes lease pin)

tech-stack:
    added: []
    patterns:
        - "Pre-flight snapshot protocol: capture lease pin + conflict-surface snapshot before first source commit"
        - "Renderer typecheck delta tracking: baseline recorded pre-resolution; each plan compares against it"

key-files:
    created:
        - ".planning/phases/39-mod-management-download-management-hot-zone-v2-0-2/39-01-SUMMARY.md"
    modified: []

key-decisions:
    - "lease_pin: 84c3310a448f0ad4a1988f82fe0fec4a06269b50 — Phase 38 final remote HEAD, confirmed matching Phase 38 Plan 38-07 push outcome"
    - "4 clean files confirmed zero-conflict and skip-confirmed: mod_management/{index,stagingDirectory,util/deploy,views/ModList}"
    - "grep-checkpoint.sh at scripts/grep-checkpoint.sh is in place, executable, returns exit 0 on --help"
    - "Renderer typecheck baseline: 357 error lines total; 335 TS1185 (conflict-marker noise from unresolved files), 22 non-TS1185; any post-resolution typecheck delta beyond this baseline counts as a Phase 39 regression"

patterns-established:
    - "140a57217 pre-resolution snapshot: grep -n 'resolvePathCase(dataPath,' LinkingDeployment.ts captures 3 lines; stored at /tmp/LinkingDeployment.140a57217-pre.txt for post-resolution diff"

requirements-completed: []

duration: 10min
completed: 2026-05-23
---

# Phase 39 Plan 01: Pre-flight Summary

**Lease pin 84c3310a4 recorded, 140a57217 snapshot captured (3 lines: 536/763/820), 4 clean files confirmed, harness verified, renderer typecheck baseline 357 lines / 335 TS1185**

## Performance

- **Duration:** ~10 min
- **Started:** 2026-05-23T10:39:54Z
- **Completed:** 2026-05-23T10:50:00Z
- **Tasks:** 3
- **Files modified:** 1 (39-01-SUMMARY.md created)

## Accomplishments

- Lease pin `84c3310a448f0ad4a1988f82fe0fec4a06269b50` confirmed via `git ls-remote` — matches Phase 38 final state; ready for plan 39-16 force-with-lease
- 140a57217 pre-resolution snapshot captured: 3 call sites at lines 536, 763, 820 in `LinkingDeployment.ts`; persisted to `/tmp/LinkingDeployment.140a57217-pre.txt` for plan 39-15 post-resolution diff
- 4 ROADMAP-named clean files confirmed at zero conflict markers (D-39-17 skip-confirmed)
- grep-checkpoint.sh harness confirmed at `scripts/grep-checkpoint.sh`, executable, `--help` exit 0
- Renderer typecheck baseline captured: 357 error lines, 45 affected files — all are TS1185 conflict-marker noise from unresolved files (Phase 40–41 scope) plus a small cluster of Header/externalChanges non-TS1185 errors

## Task Commits

Tasks 1 and 2 are read-only; Task 3 commits the SUMMARY:

1. **Task 1: Record lease pin and confirm clean files** — read-only; results in SUMMARY
2. **Task 2: Capture 140a57217 pre-resolution snapshot + renderer typecheck baseline** — read-only; results in SUMMARY + /tmp artifact
3. **Task 3: Commit pre-flight artefacts** — see commit hash below

**Plan metadata:** committed via Task 3

## Files Created/Modified

- `.planning/phases/39-mod-management-download-management-hot-zone-v2-0-2/39-01-SUMMARY.md` — this file; pre-flight record

## Decisions Made

None beyond locked decisions D-39-14/D-39-16/D-39-17 from CONTEXT.md. Pre-flight executed exactly as planned.

---

## Pre-flight Data

### D-39-16: Lease Pin

```
lease_pin: 84c3310a448f0ad4a1988f82fe0fec4a06269b50
remote ref: refs/heads/sync/upstream-v2.0.2
confirmed via: git ls-remote git@github.com:atabisz/Vortex.git sync/upstream-v2.0.2
result: 84c3310a448f0ad4a1988f82fe0fec4a06269b50  refs/heads/sync/upstream-v2.0.2
status: MATCHES Phase 38 Plan 38-07 recorded final head
```

Plan 39-16 push command:

```bash
git push git@github.com:atabisz/Vortex.git \
  v8.2/sync-upstream-v2.0.2:sync/upstream-v2.0.2 \
  --force-with-lease=sync/upstream-v2.0.2:84c3310a448f0ad4a1988f82fe0fec4a06269b50
```

---

### D-39-17: Clean-file Confirmation (4 ROADMAP-named files)

| File                                                             | Conflict marker count | Status       |
| ---------------------------------------------------------------- | --------------------- | ------------ |
| `src/renderer/src/extensions/mod_management/index.ts`            | 0                     | CLEAN — skip |
| `src/renderer/src/extensions/mod_management/stagingDirectory.ts` | 0                     | CLEAN — skip |
| `src/renderer/src/extensions/mod_management/util/deploy.ts`      | 0                     | CLEAN — skip |
| `src/renderer/src/extensions/mod_management/views/ModList.tsx`   | 0                     | CLEAN — skip |

All four confirmed at zero conflict markers. Per D-39-17: no resolution commits needed for these files.

---

### D-39-06: Harness Sanity Check

```
path: .planning/phases/39-mod-management-download-management-hot-zone-v2-0-2/scripts/grep-checkpoint.sh
executable: yes (-rwxrwxr-x)
bash scripts/grep-checkpoint.sh --help: exit 0
help header: "grep-checkpoint.sh — Phase 26 mod-management hot-zone re-grep harness."
gates encoded: §6 stagingDirHasFiles, §7a normalizeBackslashPaths, §7b mergeCaseConflictingDirs,
               §7c copy-loop replaceAll, §7d resolvePathCase(tempPath), 140a57217 resolvePathCase(dataPath),
               no-conflict-markers (7 gates total)
status: READY
```

---

### D-39-14: 140a57217 Pre-resolution Snapshot

Command run:

```bash
grep -n "resolvePathCase(dataPath," src/renderer/src/extensions/mod_management/LinkingDeployment.ts \
  | tee /tmp/LinkingDeployment.140a57217-pre.txt
```

Output (3 lines — exactly as expected per RESEARCH §C):

```
536:        const fileDataPath = await resolvePathCase(dataPath, relDataPath, dirCache);
763:    const outputPath = await resolvePathCase(dataPath, relOutputPath, this.mReaddirCache);
820:    const fullOutputPath = await resolvePathCase(dataPath, relOutputPath, this.mReaddirCache);
```

Artifact persisted: `/tmp/LinkingDeployment.140a57217-pre.txt` (3 lines, wc -l = 3)

- Line 536 is inside conflict region R5 HEAD-side — **AT RISK** during plan 39-15 resolution. Fork must win on R5.
- Line 17 (resolvePathCase import) is inside conflict region R1 HEAD-side — **AT RISK** during plan 39-15 resolution. Fork must win on R1.
- Lines 763 and 820 are in non-conflicted regions — safe.

Plan 39-15 post-resolution verification command:

```bash
grep -n "resolvePathCase(dataPath," src/renderer/src/extensions/mod_management/LinkingDeployment.ts
# Must see all 3 lines survive. Gate 6 must pass.
```

---

### Renderer Typecheck Baseline

Command run:

```bash
pnpm --filter @vortex/renderer typecheck 2>&1 | tail -60
```

Exit status: 2 (errors present — expected; all unresolved conflict files produce TS1185)

**Error summary:**

| Error code                            | Count   | Source                                                          |
| ------------------------------------- | ------- | --------------------------------------------------------------- |
| TS1185 (merge conflict marker)        | 335     | Conflict markers in unresolved files across Phase 39–41 scope   |
| TS1382 (unexpected token)             | 14      | `Header/index.tsx` conflict marker JSX parse failure            |
| TS1128 (declaration expected)         | 3       | `Header/index.tsx` conflict marker parse cascade                |
| TS1005 ('</' expected / ',' expected) | 3       | `Header/index.tsx` + `externalChanges.ts` conflict marker parse |
| TS2657 (JSX parent element)           | 1       | `Header/index.tsx` conflict marker parse cascade                |
| TS1109 (expression expected)          | 1       | `Header/index.tsx` conflict marker parse cascade                |
| **TOTAL**                             | **357** | **across 45 files**                                             |

**Affected file groups:**

Phase 39 bucket (owned by this phase — will resolve to 0 after plans 39-02..39-13):

- `src/extensions/download_management/` (7 files — 21 regions)
- `src/extensions/mod_management/{eventHandlers,InstallManager,LinkingDeployment,util/activationStore,util/externalChanges,views/Settings}.ts` (6 files — 25 regions)

Phase 40–41 scope (unowned by Phase 39 — will persist through this phase):

- `src/ExtensionManager.ts`
- `src/extensions/{analytics,extension_manager,gamemode_management,hardlink_activator,health_check,ini_prep,nexus_integration,profile_management,starter_dashlet}/`
- `src/telemetry/`, `src/types/`, `src/util/`, `src/views/`
- TS1185 source-marker errors in `src/util/fs.ts`, `src/util/transferPath.ts`, `src/util/linux/proton.ts`, `src/util/protocolRegistration/linux/nxm.ts`, etc. — Phase 41 territory, deferred per D-39-09 + Phase 38 gate-4 precedent

**Note:** Any post-resolution typecheck delta beyond the recorded baseline counts as a Phase 39 regression. The delta budget is: after resolving all 13 Phase 39 files, TS1185 count in the Phase 39 bucket should drop to 0 (removing those ~120 errors); Phase 40–41 TS1185 errors (~215) persist unchanged. If a resolved file introduces NEW non-TS1185 errors not present in this baseline, that is a regression.

---

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## Next Phase Readiness

- Pre-flight complete. All baseline artifacts recorded.
- Plan 39-02 can start immediately on `download_management/actions/state.ts` (D-39-02: download_management bucket first).
- Lease pin and 140a57217 snapshot are in this SUMMARY for subsequent plans to reference.
- Renderer typecheck baseline established; plan-level typecheck gate is delta-based from this point.

Phase 39 pre-flight complete; ready for plan 39-02.

---

_Phase: 39-mod-management-download-management-hot-zone-v2-0-2_
_Completed: 2026-05-23_
