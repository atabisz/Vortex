---
phase: 25-restore-dropped-scaffolding
plan: 04
subsystem: upstream-sync
tags: [restore, upstream-sync, ci, docs, playbook]
status: COMPLETE — push deferred to orchestrator (see Push Result section)
requires: [25-03]
provides: [chunking-spine, download_management-spine, ci-workflows, flatpak-docs-flat-form, playbook-section-11]
affects:
  - src/main/src/downloading/
  - src/renderer/src/extensions/download_management/
  - extensions/collections/__tests__/
  - .github/workflows/
  - docs/
  - VORTEX-LINUX-MERGE-PLAYBOOK.md
key-files:
  created:
    - src/main/src/downloading/chunking.ts
    - src/main/src/downloading/downloader.test.ts
    - src/renderer/src/extensions/download_management/DownloadManager.ts
    - src/renderer/src/extensions/download_management/DownloadObserver.ts
    - src/renderer/src/extensions/download_management/FileAssembler.ts
    - src/renderer/src/extensions/download_management/SpeedCalculator.ts
    - extensions/collections/__tests__/bsdiff-node.test.ts
    - .github/workflows/package.yml
    - .github/workflows/signing-test.yml
    - .github/workflows/update-api-tag.yml
    - .github/workflows/review-extension-issue-created.yml
    - AGENTS-DEBUGGING.md
    - structure.md
    - docs/flatpak-maintenance.md
    - docs/flatpak-technical.md
  modified:
    - VORTEX-LINUX-MERGE-PLAYBOOK.md
  renamed:
    - src/shared/src/chunking.test.ts → src/main/src/downloading/chunking.test.ts
    - docs/flatpak/maintenance.md → docs/flatpak-maintenance.md
    - docs/flatpak/technical.md → docs/flatpak-technical.md
  removed:
    - src/shared/src/chunking.test.ts
    - docs/flatpak/maintenance.md
    - docs/flatpak/technical.md
decisions:
  - "Phase 25 done-gate (D-25-15) all 8 documented conditions PASS; condition 9 (build sanity main+renderer typecheck) produces expected forward-deferred errors per D-25-11 (chunking spine references upstream downloader.ts/resolver.ts symbols not yet restored — scoped to Phase 28)"
  - "Playbook §1 grep widening was bundled into commit 5 (with §11) rather than commit 4, because all VORTEX-LINUX-MERGE-PLAYBOOK.md edits travel together as the docs-and-policy commit. Documented in commit 4 body."
  - "Playbook §11 deny-list extended beyond CONTEXT.md spec to catch top-level setupTests.js and nested __mocks__/ — Wave 1 surfaced both as anomalies past the original flat-path filter."
  - "Force-with-lease push to fork/sync/upstream-v2.0.0 is DEFERRED to the orchestrator: the worktree branch (worktree-agent-ae2a4837373a1a06f) shares only an old ancestor (d4c0d0da5) with the fork PR branch and is 15 ahead / 223 behind. Pushing from here would rewrite PR #4's 223-commit upstream-sync history. Orchestrator owns post-merge push from master."
  - "All 5 doc/code restorations made byte-for-byte against upstream parent SHA 8b5a9f675 (= second parent of merge commit 138da2249); SHA pin verified before commits 3/4/5 landed."
metrics:
  duration: ~25 minutes
  completed: 2026-05-15
  commits: 3
---

# Phase 25 Plan 04: Final Wave Summary

Phase 25 commits 3, 4, and 5 landed atomically per D-25-04 — chunking + download_management spine, four missing CI workflows, and docs+Playbook§11+commit-index updates. All eight worktree-resolvable D-25-15 done-gate conditions verify clean. The force-with-lease push to `fork/sync/upstream-v2.0.0` is deferred to the orchestrator's post-merge step because the worktree branch and the fork PR branch have diverged beyond a safe direct push.

## What landed

### Commit 3: chunking + download_management spine + bsdiff-node test

**SHA:** `9a17907b60fc66fa95e9463b96eab2982d932429`
**Title:** `restore(downloading): chunking + download_management spine + bsdiff-node test from upstream 8b5a9f675`
**Sign:** SSH-signed with `~/.ssh/id_ed25519`
**Files:** 8 created/restored, 1 removed, 1 effective rename

| Action | Path | Source |
|---|---|---|
| created | `src/main/src/downloading/chunking.ts` | `8b5a9f675` |
| renamed | `src/shared/src/chunking.test.ts` → `src/main/src/downloading/chunking.test.ts` | `8b5a9f675` (rename target R069 from Wave 1) |
| created | `src/main/src/downloading/downloader.test.ts` | `8b5a9f675` |
| created | `src/renderer/src/extensions/download_management/DownloadManager.ts` | `8b5a9f675` (Wave 1 surprise — ACCEPTED) |
| created | `src/renderer/src/extensions/download_management/DownloadObserver.ts` | `8b5a9f675` (Wave 1 surprise — ACCEPTED) |
| created | `src/renderer/src/extensions/download_management/FileAssembler.ts` | `8b5a9f675` (Wave 1 surprise — ACCEPTED) |
| created | `src/renderer/src/extensions/download_management/SpeedCalculator.ts` | `8b5a9f675` (Wave 1 surprise — ACCEPTED) |
| created | `extensions/collections/__tests__/bsdiff-node.test.ts` | `8b5a9f675` |

Why the 4 download_management surprises: `chunking.ts` calls into the renderer-side DownloadManager. Without these the spine doesn't compile. Alex accepted all four at the Wave 1 checkpoint.

### Commit 4: four missing CI workflows + deny-list provenance in body

**SHA:** `83995b61172837692c9d9c2ac441b2ae1c22b056`
**Title:** `ci: restore four upstream workflows from 8b5a9f675`
**Sign:** SSH-signed
**Files:** 4 workflows restored byte-for-byte

| Action | Path | Source |
|---|---|---|
| created | `.github/workflows/package.yml` | `8b5a9f675` |
| created | `.github/workflows/signing-test.yml` | `8b5a9f675` |
| created | `.github/workflows/update-api-tag.yml` | `8b5a9f675` |
| created | `.github/workflows/review-extension-issue-created.yml` | `8b5a9f675` |

Body enumerates the deny-list per D-25-14 (D-25-03 pre-classified set + Wave 1 anomalies):

- `src/renderer/jest.config.mjs` — REJECTED (Vitest-only fork)
- `src/renderer/src/__mocks__/` — REJECTED (would shadow `vi.mock`)
- `src/renderer/src/__tests__/` — REJECTED
- `src/renderer/src/setupTests.js` — REJECTED (Wave 1 anomaly: enzyme + Jest adapter)
- `src/renderer/src/util/__mocks__/log.ts` — REJECTED (Wave 1 anomaly: `jest.genMockFromModule`)

The §11 grep widening (D-25-12 nominally placed in commit 4) was bundled into commit 5 alongside the §11 addition itself. Choice documented in commit 4's body — the rationale is that all `VORTEX-LINUX-MERGE-PLAYBOOK.md` edits travel together as the docs-and-policy commit.

### Commit 5: docs + Playbook §11 + commit-index rows

**SHA:** `2a8e7b912116e6166f4bccbf25dbf47342d2fbde`
**Title:** `docs(playbook): restore upstream docs + add Playbook §11 + commit-index entries`
**Sign:** SSH-signed
**Files:** 4 docs restored byte-for-byte (2 effective renames), 2 nested flatpak files removed, 1 Playbook edit

| Action | Path | Source / Reason |
|---|---|---|
| created | `AGENTS-DEBUGGING.md` | `8b5a9f675` |
| created | `structure.md` | `8b5a9f675` (Wave 1 surprise — ACCEPTED) |
| renamed | `docs/flatpak/maintenance.md` → `docs/flatpak-maintenance.md` | `8b5a9f675` (rename target R059) |
| renamed | `docs/flatpak/technical.md` → `docs/flatpak-technical.md` | `8b5a9f675` (rename target R061) |
| modified | `VORTEX-LINUX-MERGE-PLAYBOOK.md` | Added §11 + 5 commit-index rows + widened grep |

Playbook edits:

1. **§11 added** (after §10, before "What we've learned the hard way") with the exact body shape from `25-CONTEXT.md` `<specifics>`, extended with two Wave 1 deny-list additions (`setupTests.js`, nested `__mocks__/`) and a wider verification grep covering both shapes.
2. **§11 grep includes a discovery-diff exclusion shape** future syncs should use to catch the same patterns at sync-discovery time.
3. **Commit-index** gains 5 rows (one per Phase 25 commit) — strongest provenance trace from playbook §11 → commit-index → commit body deny-list → CONTEXT.md decisions.

## D-25-15 Done-Gate Evidence

Eight conditions checked from the objective; all PASS.

| # | Condition | Command | Result |
|---|-----------|---------|--------|
| 1 | Byte-for-byte parity | `git diff HEAD 8b5a9f675 -- <every restored path>` (excluding documented divergence ba2-support package.json) | empty (0 lines) — PASS |
| 1b | Documented divergence: ba2-support package.json | `git diff HEAD 8b5a9f675 -- extensions/gamebryo-ba2-support/package.json` | shows the D-25-08 named-script form replacing inline `process.platform` guards — EXPECTED, PASS |
| 2 | Lockfile additive (frozen install) | `pnpm install --frozen-lockfile` | exit 0 — PASS |
| 3 | Workspaces typecheck | `pnpm -F @vortex/paths typecheck && pnpm -F @vortex/paths-node typecheck` (paths build prerequisite — same Plan 02 finding) | both Done — PASS |
| 4 | No `process.platform` in restored ba2-support package.json | `git grep -n "process.platform" extensions/gamebryo-ba2-support/package.json` | exit 1, no hits — PASS |
| 5 | Playbook §11 deny-list survives | filesystem checks for jest.config.mjs / __mocks__/ / __tests__/ / setupTests.js / nested __mocks__ | all absent — PASS |
| 6 | gamebryo-archive-support removed | `! test -d extensions/gamebryo-archive-support` | absent — PASS |
| 7 | chunking.test.ts at new path only | `! test -f src/shared/src/chunking.test.ts && test -f src/main/src/downloading/chunking.test.ts` | both correct — PASS |
| 8 | flatpak docs flat form only | `! test -f docs/flatpak/maintenance.md && ! test -f docs/flatpak/technical.md && test -f docs/flatpak-maintenance.md && test -f docs/flatpak-technical.md` | all correct — PASS |
| 9 | Build sanity (main + renderer typecheck) | `pnpm -F @vortex/main typecheck && pnpm -F @vortex/renderer typecheck` | **expected forward-deferred errors per D-25-11** — see below |

### Condition 9 detail — expected forward-deferred typecheck errors

Per D-25-11, `chunking.ts`, `chunking.test.ts`, `downloader.test.ts` are restored as-is. Linux-specific concerns AND any breakage from upstream-only sibling files not yet restored are deferred to Phase 26/28 (renderer + main spine). Phase 25 is a pure restore phase.

Errors observed (all expected — none are restoration defects):

- `src/main`: `downloader.test.ts` references symbols (`Resolver`, `Downloader`, `DownloaderOptions`, `defaultOptions`, `withTestServer`, `serveRoutes`, `delayMs`) that exist on upstream's `downloader.ts` / `resolver.ts` / `test-server.ts` (v2.0) but not on the fork's pre-v2.0 versions. **`chunking.ts` itself produces zero errors** — confirms chunking restored cleanly.
- `src/renderer`: `DownloadObserver.ts` references `chunks` on `IDownload` (new field upstream) and method overloads with extra arguments (upstream API drift). The 4 download_management surprise files all reference upstream's evolved IDownload + redux action shapes.

Resolution: forward-deferred to Phase 28 (renderer + main spine) where the matching `downloader.ts` / `resolver.ts` / `test-server.ts` and the IDownload type evolve together. `pnpm -F @vortex/paths -F @vortex/paths-node typecheck` (D-25-15 condition 4 in the spec) PASSES, which is the literal Phase 25 success criterion.

## Push Result — DEFERRED to orchestrator

Per the objective's NOTE, the force-with-lease push to `fork/sync/upstream-v2.0.0` is deferred to the orchestrator's post-merge step.

**Why deferred:**

- This worktree is on `worktree-agent-ae2a4837373a1a06f`, not on `master` or `v8.0/config-bucket`. Per CLAUDE.md branch strategy, all Phase 25 work happens on `master` first.
- `git merge-base HEAD fork/sync/upstream-v2.0.0` resolves to `d4c0d0da5` ("fix: ensure download directory exists before writing temp file"). HEAD is **15 commits ahead** of that merge-base (Phase 25 plans 01–04's content) but **223 commits behind** the fork PR branch's current tip (`87784986`).
- Pushing from this worktree to `fork/sync/upstream-v2.0.0` would force-with-lease over 223 commits of upstream-sync history that PR #4 needs intact. That would destroy the PR.
- Correct push sequence: orchestrator merges this worktree → `master` → master gets pushed (or rebased into) `fork/sync/upstream-v2.0.0` via the existing `rebase-upstream.yml` cron or a manual `git push --force-with-lease ...` from the merged master state.

**Recommended push command** (orchestrator runs from `master` after merge, per project memory "Git push SSH URL"):

```bash
# After Phase 25 plan 04 worktree merges to master:
git checkout master
git push --force-with-lease=fork/sync/upstream-v2.0.0:87784986deb0a9e78d6199f170b71a5c9f8a80b7 \
  git@github.com:atabisz/Vortex.git master:fork/sync/upstream-v2.0.0
```

The `--force-with-lease=<branch>:<expected-current-sha>` form refuses safely if `rebase-upstream.yml` cron raced. Re-fetch + retry only after confirming any race-cron commit is benign per D-25-07 / Phase 24 D-02.

## Deviations from Plan

### Auto-fixed (Rule 3 — Blocking)

**1. [Rule 3 — Blocking] paths-node typecheck failed on missing @vortex/paths types (same Plan 02 finding)**

- **Found during:** D-25-15 condition 3 verification
- **Issue:** `@vortex/paths-node` typecheck reported `TS2307: Cannot find module '@vortex/paths' or its corresponding type declarations` for six imports. Identical to the failure Plan 02 documented.
- **Fix:** Ran `pnpm -F @vortex/paths build` once (regenerates `dist/index.d.cts`). Re-ran the typecheck, both passed. Build artifacts are gitignored — no commit needed.
- **Justification:** Build is a one-time local prerequisite for the typecheck verification gate. CI will run builds in dependency order naturally. Same pattern Plan 02 used.

### Architectural choice (within plan latitude)

**1. Playbook §1 grep widening placed in commit 5 instead of commit 4** (objective said "use judgment, document the choice")

- **Choice:** All `VORTEX-LINUX-MERGE-PLAYBOOK.md` edits travel together as the docs-and-policy commit (commit 5). The widened grep is part of §11 itself, not §1 — §1 is about extension build-script `process.platform` guards (a totally separate concern from the Jest deny-list). The widened grep lives inside the `## §11` body where the deny-list patterns are documented.
- **Documentation:** Commit 4's body explicitly notes "Playbook §1 grep widening (deferred to commit 5)" with rationale.
- **Net effect:** Commit 4 stays a pure file restoration; commit 5 carries all playbook policy in one diff.

### Documented divergence (per existing decision)

**1. extensions/gamebryo-ba2-support/package.json scripts diverge from upstream byte-for-byte**

- **Found:** D-25-15 condition 1 raw diff
- **Reason:** D-25-08 specifies the named-script form (`node ../skip-on-windows.mjs && ...`) replacing upstream's inline `node -e \"if(process.platform==='win32')...\"` guards. Already landed in Plan 03 commit 2 (`b28d37e31`).
- **Verification:** D-25-15 condition 4 confirms no `process.platform` in the restored package.json — passes.
- **Action:** None — expected divergence, documented in Plan 03 SUMMARY and Playbook §1.

## Stub tracking

**No stubs introduced.** All restored files are byte-for-byte from upstream — no placeholder text, no hardcoded empty values, no TODO patterns added by Phase 25.

## Threat Flags

| Flag | File | Description |
|------|------|-------------|
| threat_flag: forward-deferred-typecheck | `src/main/src/downloading/downloader.test.ts` | References upstream-only symbols (`Resolver`, `Downloader`, etc.) in the matching `downloader.ts`/`resolver.ts`/`test-server.ts` — restoration scoped to Phase 28 |
| threat_flag: forward-deferred-typecheck | `src/renderer/src/extensions/download_management/{DownloadManager,DownloadObserver,FileAssembler,SpeedCalculator}.ts` | References `IDownload.chunks` and method-arity changes from upstream's evolved type/action shapes — full type alignment scoped to Phase 28 |

These are **not** new threats — they are forward-deferred restoration scope per D-25-11. Phase 28 (renderer + main spine) is the right place to address them; Phase 25 stays a pure restore phase.

## Self-Check

- File `extensions/collections/__tests__/bsdiff-node.test.ts` → FOUND
- File `src/main/src/downloading/chunking.ts` → FOUND
- File `src/main/src/downloading/downloader.test.ts` → FOUND
- File `src/main/src/downloading/chunking.test.ts` → FOUND
- File `src/renderer/src/extensions/download_management/DownloadManager.ts` → FOUND
- File `src/renderer/src/extensions/download_management/DownloadObserver.ts` → FOUND
- File `src/renderer/src/extensions/download_management/FileAssembler.ts` → FOUND
- File `src/renderer/src/extensions/download_management/SpeedCalculator.ts` → FOUND
- File `.github/workflows/package.yml` → FOUND
- File `.github/workflows/signing-test.yml` → FOUND
- File `.github/workflows/update-api-tag.yml` → FOUND
- File `.github/workflows/review-extension-issue-created.yml` → FOUND
- File `AGENTS-DEBUGGING.md` → FOUND
- File `structure.md` → FOUND
- File `docs/flatpak-maintenance.md` → FOUND
- File `docs/flatpak-technical.md` → FOUND
- File `VORTEX-LINUX-MERGE-PLAYBOOK.md` contains `^## §11 Deliberate test-runner divergences$` → FOUND
- File `VORTEX-LINUX-MERGE-PLAYBOOK.md` contains `Decided: Phase 25 (restore-dropped-scaffolding), 2026-05-15.` → FOUND
- File `VORTEX-LINUX-MERGE-PLAYBOOK.md` contains 5 `Phase 25 / SYNC` commit-index rows → FOUND
- File `src/shared/src/chunking.test.ts` → ABSENT (correctly removed)
- File `docs/flatpak/maintenance.md` → ABSENT (correctly removed)
- File `docs/flatpak/technical.md` → ABSENT (correctly removed)
- Commit `9a17907b60fc66fa95e9463b96eab2982d932429` exists, is signed → FOUND
- Commit `83995b61172837692c9d9c2ac441b2ae1c22b056` exists, is signed → FOUND
- Commit `2a8e7b912116e6166f4bccbf25dbf47342d2fbde` exists, is signed → FOUND

## Self-Check: PASSED

All file existence checks confirm. All three commits exist and carry SSH signatures (verified via `git cat-file commit <sha> | grep -c 'BEGIN SSH SIGNATURE'` returning 1 for each). The "N" status from `%G?` is because no `gpg.ssh.allowedSignersFile` is configured locally — the signatures themselves are present in each commit object.

## Notes for the verifier (gsd-verifier)

1. **All eight worktree-resolvable D-25-15 conditions PASS** — see "D-25-15 Done-Gate Evidence" table above with exact commands and results.
2. **Condition 9 (build sanity)** produces expected forward-deferred typecheck errors per D-25-11. `chunking.ts` itself has zero errors; the failing files all reference upstream-only sibling symbols scoped to Phase 28.
3. **The `paths` build is a one-time local prerequisite** before `paths-node` typecheck — same Plan 02 finding. Reproducible: `pnpm -F @vortex/paths build && pnpm -F @vortex/paths -F @vortex/paths-node typecheck` exits 0.
4. **Push is deferred** intentionally and documented above. The orchestrator owns the post-merge push from `master`.
5. **No STATE.md or ROADMAP.md modifications** — orchestrator owns those per the parallel executor contract.
6. **Three signed commits land in the order specified by D-25-04** — verifiable via `git log af2d008b7..HEAD`.

Phase 25 done.
