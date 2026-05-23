---
phase: 35
wave: 1
plan_id: 35-02
title: "Wave 1 — delete dead DownloadManager + DownloadObserver (D-35-01 branch A)"
branch: v8.1/config-bucket
requirement_ids:
    - SYNC-35a # closes the renderer-bucket from 9 → 0; SYNC-35a's full-sweep proof lands in Wave 2
dependencies:
    - 35-01 # Wave 0 readiness must be GREEN
estimated_commits: 1
---

# Wave 1 — Delete dead `DownloadManager.ts` + `DownloadObserver.ts`

## Goal

Land the single-file-pair deletion confirmed by RESEARCH §1 caller map (Σ(significant) = 0). Drives the renderer-bucket typecheck count from 9 → 0, satisfying the renderer half of SYNC-35a. The "rewire" half of D-35-01 branch A is a no-op — there's nothing to rewire because nothing outside the two doomed files imports them. One SSH-signed `chore(download_management)` commit. Net diff: −4154 LOC, +0 LOC.

References: see `35-CONTEXT.md` D-35-01..D-35-03 and `35-RESEARCH.md` §1 (caller map) + §3 (branch decision) + §5 risk #5 (commit cadence).

## Tasks

1. **Pre-delete confirmation: re-run the caller-map evidence one last time at HEAD.**
    - The Wave 0 readiness gate verified Phase 34's baseline; this task re-confirms RESEARCH's import audit at the exact HEAD that's about to land the delete. Cheap insurance.

2. **`git rm` the two dead files.**
    - `src/renderer/src/extensions/download_management/DownloadManager.ts` (2882 lines)
    - `src/renderer/src/extensions/download_management/DownloadObserver.ts` (1272 lines)
    - No other file edits. The extension's own `index.ts`, sibling `views/`, `util/`, `types/`, `reducers/`, `actions/`, `selectors.ts` all already do not reference these symbols (per RESEARCH §1 internal-caller audit).

3. **Post-delete renderer-bucket typecheck verification.**
    - `pnpm tsc -p src/renderer/tsconfig.json --noEmit` filtered count must drop from 9 to 0. The 9 errors were all confined to these two files (per Phase 34 D-34-14 evidence).

4. **Post-delete external-reference audit.**
    - Confirm zero non-comment hits anywhere in `src/` for `from .*DownloadManager` / `from .*DownloadObserver` / `from .*FileAssembler` / `from .*SpeedCalculator` outside `src/main/src/downloading/` (which is the upstream replacement spine — a different `DownloadManager` class).

5. **Commit.**
    - Title: `chore(download_management): drop dead DownloadManager + DownloadObserver — superseded by IPCDownloadAdapter`
    - Body: Pattern S5 — short why-block citing D-35-01 branch A + RESEARCH Σ(significant)=0 + Phase 25 SYNC-14 deferral expiry. Casual project voice.
    - SSH-signed (`~/.ssh/id_ed25519`). NEVER `--no-verify` / `--no-gpg-sign`.
    - `.planning/` is gitignored — this commit only touches `src/renderer/src/extensions/download_management/`.

6. **Verify SSH signature on the new commit.**
    - `git cat-file -p HEAD | grep -c '^gpgsig '` ≥ 1.

## Verification commands

```bash
# Task 1 — caller-map re-confirmation at HEAD (mirrors RESEARCH appendix)
rg -n "from ['\"]\\./(DownloadManager|DownloadObserver|FileAssembler|SpeedCalculator)['\"]" src/
# Expected: only the 5 self-references inside the two doomed files (lines 23, 24 in DownloadManager.ts;
# lines 11, 12, 58 in DownloadObserver.ts). No external hits.

# Task 2 — the delete
git rm \
  src/renderer/src/extensions/download_management/DownloadManager.ts \
  src/renderer/src/extensions/download_management/DownloadObserver.ts

# Task 3 — post-delete renderer-bucket (the headline gate)
pnpm tsc -p src/renderer/tsconfig.json --noEmit 2>&1 | grep -v TS1185 | wc -l
# Expected: 0

# Task 4 — post-delete external audit
rg -ln 'DownloadManager|DownloadObserver|FileAssembler|SpeedCalculator' src/ \
  | grep -v 'src/main/src/downloading/' \
  | grep -v 'IPCDownloadAdapter.ts'
# Expected: only comment-only references in src/shared/src/types/{state,preload}.ts,
# src/renderer/src/util/util.ts, src/renderer/src/extensions/{browse_nexus/views/BrowseNexusPage.tsx,
# nexus_integration/selectors.test.ts, mod_management/InstallManager.ts}. Zero live imports.

rg -n "from .*['\"].*DownloadManager['\"]|from .*['\"].*DownloadObserver['\"]|from .*['\"].*FileAssembler['\"]|from .*['\"].*SpeedCalculator['\"]" src/ \
  | grep -v 'src/main/src/downloading/'
# Expected: zero hits.

# Task 5 — commit
git commit -S -m "chore(download_management): drop dead DownloadManager + DownloadObserver — superseded by IPCDownloadAdapter

The renderer-side DownloadManager.ts (2882 lines) and DownloadObserver.ts (1272 lines)
have been orphaned since upstream 0743774cd \"Remove old downloader\" replaced the
renderer-side downloader with the main-side src/main/src/downloading/manager.ts spine
+ IPCDownloadAdapter bridge. Phase 25 SYNC-14 restored these files as a transitional
accept-as-surprise (D-25-11); that deferral has now expired.

Σ(external callers) = 0 — the only imports of these symbols are the two files importing
each other. The extension's own index.ts does not register them. AlreadyDownloaded /
DownloadIsHTML consumers all already import from @vortex/shared/errors, not from this
re-export. Deleting closes the renderer-bucket typecheck from 9 → 0 (D-34-14
deferral-receipt) and removes a permanent maintenance burden every future upstream sync
hits this seam.

Branch A delete-and-rewire — rewire half is a no-op. Net diff −4154 / +0.

Refs: D-35-01 branch A; D-34-20 carry-over; 35-RESEARCH.md §1 + §3.
"

# Task 6 — SSH-sig audit
git cat-file -p HEAD | grep -c '^gpgsig '
# Expected: ≥ 1
```

## Commits

| #   | Title                                                                                                         | Body shape                                   | Signed                  | Files touched |
| --- | ------------------------------------------------------------------------------------------------------------- | -------------------------------------------- | ----------------------- | ------------- |
| 1   | `chore(download_management): drop dead DownloadManager + DownloadObserver — superseded by IPCDownloadAdapter` | Pattern S5 (why + decision refs + diff stat) | SSH `~/.ssh/id_ed25519` | 2 deletions   |

## Risks / contingencies

- **Renderer-bucket count ≠ 0 post-delete.** RESEARCH §3 says the 9 errors are all confined to the two doomed files; if any error remains, escalate immediately — there's a hidden caller the audit missed. Do not push forward; revisit branch A vs branch B with the new evidence.
- **`AlreadyDownloaded` / `DownloadIsHTML` import surprise** — RESEARCH §3 confirms all consumers use `@vortex/shared/errors`. If post-delete typecheck surfaces a `Cannot find module './DownloadManager'` error from a non-doomed file, that's a hidden re-export consumer; pause and add an `@vortex/shared/errors` rewire in the same commit (still well under 100 LOC of glue, so still branch A).
- **Webpack chunk reference surprise** — Wave 0 risk #3 sanity check should have caught this. If somehow webpack errors at this stage, escalate to surgical patch (branch B).
- **Bluebird trap** — N/A. Branch A deletes the bluebird-importing files; no `:Promise<void>` annotations to add. Trap cannot fire (D-35-03).

## Done criteria

1. The two files are `git rm`-ed and the commit lands.
2. Renderer-bucket typecheck (filtered) = 0.
3. Zero live external imports of `DownloadManager` / `DownloadObserver` / `FileAssembler` / `SpeedCalculator` outside `src/main/src/downloading/` and `IPCDownloadAdapter.ts`.
4. Commit is SSH-signed (`gpgsig` block present).
5. Markers outside `.planning/` still 0 (no accidental conflict markers).
6. SYNC-35a's renderer-bucket precondition closed; full-sweep proof lands in Wave 2.
