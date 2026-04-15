# Project Research Summary

**Project:** Vortex Linux fork — milestone v6.0 Infrastructure
**Domain:** Electron mod manager — chattr+F dual-path filesystem layer + GitHub Actions upstream rebase CI
**Researched:** 2026-04-15
**Confidence:** HIGH (both features fully grounded in codebase inspection, kernel docs, and Actions docs)

---

## Executive Summary

This milestone adds two independent infrastructure capabilities to the Vortex Linux fork. The first is the chattr+F filesystem layer — it applies a kernel-level case-insensitive directory flag to new staging directories on ext4 filesystems, complementing the existing Wine-prefix userspace case-folding shim. The second is the upstream rebase CI workflow — it automates daily polling of nexus-mods/Vortex for new release tags and opens a draft PR when the fork needs rebasing. Neither feature has any runtime dependency on the other; they share only the milestone boundary.

The recommended implementation approach for both features requires zero new npm dependencies. The chattr+F layer shells out to the `chattr` binary (from `e2fsprogs`, pre-installed on all Ubuntu systems) using Node.js `child_process.execFile`, and detects ext4 via `fs.promises.statfs()` (Node 22 built-in). The rebase CI uses `actions/checkout@v6`, `actions/github-script@v9.0.0`, and `peter-evans/create-pull-request@v8.1.1` — all established, actively maintained Actions. The only architectural addition to application code is a single new function (`applyChattrCasefold`) inserted as one `.then()` call inside the existing `ensureDirWritableAsync` in `src/renderer/src/util/fs.ts`.

The primary risks are well-characterized. For chattr+F: the feature will silently fail on most user home directories (ext4 without the `casefold` feature is the norm), so the fallback to the existing userspace shim must be the default path, not the exception. For the rebase CI: idempotency (no duplicate PRs on repeated daily runs), conflict handling (rebase conflicts must produce a draft PR, not a failed job), and trigger selection (schedule-only, never push-to-master) are the three correctness requirements that must be implemented from day one.

---

## Key Findings

### Recommended Stack

Both features are zero-dependency additions to the existing stack. No new npm packages are required. The chattr+F layer uses only Node.js built-ins (`child_process.execFile`, `fs.promises.statfs`) and the `chattr` system binary. The rebase CI uses three well-vetted GitHub Actions that are already consistent with existing workflow patterns in the repo.

**Core technologies:**

- `child_process.execFile('chattr', ['+F', dirPath])` — apply kernel casefold attribute — zero deps, universally available on Linux, graceful ENOENT fallback; use argument array (not shell string) to avoid path injection
- `fs.promises.statfs(path)` — detect filesystem type via magic number — Node 22 built-in (added v18.17.0), no text parsing, direct POSIX-correct call; `EXT4_SUPER_MAGIC = 0xef53`
- `chattr` binary from `e2fsprogs` — pre-installed on all Ubuntu/Fedora/Arch; must be pre-flight checked (`commandExists('chattr')`) because it is absent in minimal Docker containers
- `actions/checkout@v6` — full history checkout for rebase — already used in existing workflows; `fetch-depth: 0` required for rebase
- `actions/github-script@v9.0.0` — query nexus-mods/Vortex releases via Octokit — pre-authenticated, April 2026 release
- `peter-evans/create-pull-request@v8.1.1` — create rebase draft PR — 2.7k stars, 114 releases, actively maintained, April 2026

**Rejected alternatives:**

- `ioctl` npm package (v2.0.2): NaN-based, last published July 2019, unmaintained — reject
- `ffi-napi` (v4.0.3): adds native addon dep to replace a 5-line `execFile` call — reject
- Parsing `/proc/mounts` for filesystem detection: fragile, bind-mount edge cases — reject in favor of `statfs()`
- Marketplace rebase Actions (`imba-tjd/rebase-upstream@0.12`): self-described "not widely tested", uses `git push -f`, no conflict control — reject
- `repository_dispatch` trigger: requires nexus-mods/Vortex to cooperate — unavailable
- btrfs casefold via chattr: not supported in any released kernel as of April 2026 — treat btrfs as fallback-to-shim only

### Expected Features

**Must have — chattr+F (table stakes):**

- Pre-flight check: `commandExists('chattr')` before any invocation; skip and activate shim if absent
- Detect filesystem type at staging directory path using `statfs()` ext4 magic (0xEF53)
- Apply `chattr +F` immediately after `fs.ensureDir()` creates the staging directory, before any files are written (the ordering `mkdir → chattr+F → write-tag-file` is a hard requirement)
- Catch all non-zero exit codes (EOPNOTSUPP, EINVAL, ENOENT) and fall back silently to the existing Wine-prefix shim
- Platform guard: `process.platform !== 'linux'` early return — Windows CI matrix must stay green
- Flatpak sandbox detection (`FLATPAK_ID` env var) — skip chattr attempt entirely inside Flatpak
- Skip existing non-empty staging directories entirely — chattr+F is only applied to newly created, empty directories
- Log at INFO when chattr+F succeeds; log at DEBUG on fallback — no user-visible error for normal fallback

**Must have — rebase CI (table stakes):**

- `schedule` cron trigger (daily, 06:00 UTC) plus `workflow_dispatch` manual override — no `push: branches: [master]` trigger
- Compare latest nexus-mods/Vortex tag against last-known tag in `.planning/upstream-sync/last-known-tag.txt` — exit early on no change; update tracking file only when a PR is opened
- Fixed, predictable branch name: `rebase/upstream-<tag>` — enables idempotent PR update without creating duplicates
- Pre-creation idempotency check: `gh pr list --head <branch> --base master --state open` — if PR exists, update branch only, do not create a second PR
- "Already up to date" guard: `git merge-base --is-ancestor upstream/HEAD fork/master` — exit 0 cleanly with no PR when no new commits
- Clean rebase path: push branch, open draft PR titled `chore: rebase onto upstream <tag>`
- Conflicted rebase path: `git rebase --abort`, commit conflict state, push, open draft PR with "conflicts detected" warning body — `git rebase` exit 1 must never fail the workflow job
- PR body includes: upstream tag, upstream release URL, conflict status, and fork link (https://github.com/atabisz/Vortex) per project convention
- Job-level `if: github.repository == 'atabisz/Vortex'` guard
- Workflow permissions: `contents: write`, `pull-requests: write` declared explicitly in the YAML

**Should have — post-validation (v1.x):**

- chattr+F: runtime verification after success — write uppercase file, read lowercase — catches NFS/FUSE silent-success false positives; cache result per staging directory path per session
- chattr+F: informational notification when staging directory is on ext4 without casefold feature (educational, not an error)
- Rebase CI: `workflow_dispatch` input for `upstream_ref` override — debugging and on-demand trigger
- Rebase CI: upstream commit diff summary in PR body (`gh api repos/Nexus-Mods/Vortex/compare/<prev>...<new>`)
- Rebase CI: `upstream-rebase` label on all rebase PRs for easy filtering

**Defer to v2+:**

- chattr+F: migration path for existing staging directories — blocked by hard kernel constraint (chattr+F requires empty dir); requires create-new-dir, copy-files, switch approach; high complexity, low incremental value
- Rebase CI: drift detection alert after N consecutive conflicted rebases
- Rebase CI: auto-resolve known trivial conflicts (version bumps in package.json) — unpredictable conflict surface

**Anti-features — do not implement:**

- chattr+F: running `tune2fs -O casefold` on users' filesystems — destructive, requires unmounting, can corrupt data
- chattr+F: removing the userspace Wine-prefix shim when kernel casefold is active — the two mechanisms cover orthogonal path trees (Wine prefix paths vs staging dir paths)
- chattr+F: showing error dialogs on btrfs/XFS/ZFS — these filesystems never support it; silent fallback only
- chattr+F: calling chattr+F on non-empty staging directories — kernel rejects it; no retroactive application
- Rebase CI: auto-merging the rebase PR — upstream changes always require human review
- Rebase CI: pushing rebased commits directly to `master` — bypasses review, can break the rolling release
- Rebase CI: `git merge` instead of `git rebase` — merge commits pollute history and make the upstream diff unreadable
- Rebase CI: trigger on `push: branches: [master]` — creates a feedback loop when the rebase PR is merged back

### Architecture Approach

The chattr+F layer is a purely additive change to `src/renderer/src/util/fs.ts` in the renderer process. A single new function `applyChattrCasefold(dirPath)` is inserted as one `.then()` call inside the existing `ensureDirWritableAsync`. The function always resolves (never rejects), is fully gated on `process.platform === 'linux'`, and is placed before the canary write test. The existing Wine-prefix shim (`isWinePrefixPath`, `resolveCaseIfWinePrefix`) is unchanged — it operates on a different path namespace (`/compatdata/<id>/pfx/`) and does not intersect with staging directory paths. The rebase CI consists entirely of two new files with no changes to existing workflows.

**Major components:**

1. `src/renderer/src/util/fs.ts: applyChattrCasefold()` (new function, ~20 lines) — shells out to `chattr +F` via `execFile`, catches all errors, always resolves; called from `ensureDirWritableAsync` immediately after `fs.ensureDir()` and before the canary write test
2. `src/renderer/src/util/fs.ts: ensureDirWritableAsync()` (one-line modification) — adds `.then(() => applyChattrCasefold(dirPath))` after the `ensureDir` call; no other logic changes
3. `src/renderer/src/util/fs.test.ts` (modified) — three new test cases: chattr succeeds on ext4-casefold; chattr returns EOPNOTSUPP and resolves without throw; non-Linux returns immediately without calling chattr
4. `.github/workflows/sync-upstream.yml` (new) — daily schedule + workflow_dispatch; orchestrates rebase check; fork-only via `if: github.repository == 'atabisz/Vortex'`
5. `.github/scripts/sync-upstream.sh` (new) — git operations for fetch, tag comparison, branch creation, rebase, conflict detection, push; modeled after existing `.github/scripts/cherry-pick.sh`

**Unchanged components:**

- `stagingDirectory.ts` — no change; the injection point is one layer below, inside `ensureDirWritableAsync` in `fs.ts`
- `isWinePrefixPath` / `resolveCaseIfWinePrefix` in `fs.ts` — Wine-prefix scope; staging dirs never match `/compatdata/` pattern
- `ensureDirAsync` in `LinkingDeployment.ts` — handles deployment target dirs, not staging dirs; chattr+F not needed there
- All existing workflows (`main.yml`, `release-linux.yml`, `cherry-pick.yml`) — no modifications; `main.yml` CI runs automatically on the rebase PR via pre-existing `pull_request: branches: [master]` trigger

**Injection point (critical detail):**

The only correct insertion position is inside `ensureDirWritableAsync` in `fs.ts` at approximately line 1224, not in `stagingDirectory.ts`. The mandatory sequence is `ensureDir → chattr+F → canary write`. Calling chattr+F after the canary write (or after `writeStagingTag`) would fail because the directory would no longer be empty.

### Critical Pitfalls

1. **chattr+F on non-casefold ext4 filesystem — most users' `/home` partitions lack the casefold feature** — `chattr +F` returns EOPNOTSUPP on any ext4 partition formatted without the `casefold` feature (the default for all Linux distros); treat chattr failure as the common case, not an error; the fallback to the userspace shim must be the default path. Prevention: explicit exit-code check; fallback activation on any non-zero result; never gate deployment on chattr+F success.

2. **chattr+F on non-empty directory fails — the `mkdir → chattr+F → write-tag` ordering is a hard kernel constraint** — the kernel rejects chattr+F on any non-empty directory; if the staging directory already exists with mods, skip chattr+F entirely and use the shim; if called after `writeStagingTag` writes even one file, the call fails. Prevention: call must be inside `ensureDirWritableAsync` before the canary write; skip for pre-existing directories without attempting the call.

3. **NFS/FUSE silent false positive — chattr+F exits 0 but casefold is not active** — on some NFS configurations and FUSE filesystems, `chattr +F` appears to succeed (exit 0) but the attribute is not stored on the remote filesystem; code that trusts the exit code skips the shim and gets "file not found" errors on case-mismatch. Prevention: after `chattr +F` exits 0, verify with a runtime test (write uppercase file, read lowercase); fall back to shim if the test fails; cache the result per staging directory per session.

4. **Rebase CI creates duplicate PRs on daily runs** — a naive workflow creates a new PR on every cron run regardless of whether one already exists; the `gh pr create` API returns an error that surfaces as a CI failure. Prevention: fixed branch name (`rebase/upstream-<tag>`) plus pre-creation `gh pr list` idempotency check — both must be in the initial workflow, not added after the first duplicate occurs.

5. **`git rebase` exit 1 must not fail the workflow job** — when rebase encounters conflicts, the natural GitHub Actions behavior is to fail the step and produce no output; the correct behavior is to catch the conflict, abort the rebase, commit the conflict state, push, and open a draft PR with a warning body. Prevention: explicit `HAS_CONFLICTS` flag pattern before any `set -e` scope; never rely on rebase to exit 0 on the conflict path.

6. **Windows CI broken by missing `process.platform === 'linux'` guard** — `main.yml` runs both `ubuntu-latest` and `windows-latest` builds; any `chattr` or `lsattr` call outside a platform guard causes `ENOENT` on Windows and fails the matrix. Prevention: `applyChattrCasefold` has an unconditional `if (process.platform !== 'linux') return` as the first line; add a test asserting the function is a no-op when `process.platform` is mocked to `'win32'`.

---

## Implications for Roadmap

Both tracks are independent at both development and runtime level. They can be implemented in parallel (two branches, two PRs) and merged in any order.

### Phase 1A: chattr+F Filesystem Layer

**Rationale:** Self-contained change to a single file (`fs.ts`) with no upstream PR implications and no CI workflow changes needed. Can be developed and reviewed independently of Phase 1B. The injection point, call signature, and fallback behavior are fully specified — no further design decisions required before starting.

**Delivers:** Kernel-level case-insensitive lookup for new staging directories on ext4-casefold filesystems; silent fallback to the existing userspace shim on all other filesystems; zero change to existing behavior on Windows or non-casefold Linux; both Windows and Linux CI matrix jobs stay green.

**Addresses (from FEATURES.md):** chattr+F detect + apply at staging creation (P1); silent fallback (P1); Flatpak sandbox detection (P1); platform guard for Windows CI (P1).

**Avoids:** Pitfalls 1 (EOPNOTSUPP fallback), 2 (empty-dir ordering), 4 (btrfs silent failure), 5 (binary absence check), 6 (Windows platform guard). Anti-features: no tune2fs, no shim removal.

**Files changed:** `src/renderer/src/util/fs.ts`, `src/renderer/src/util/fs.test.ts`

**Research needed:** None. Implementation is fully specified in ARCHITECTURE.md Q5 and FEATURES.md behavioral contract.

### Phase 1B: Upstream Rebase CI Workflow

**Rationale:** Pure CI infrastructure — no application code changes, no interaction with Phase 1A at any level. Can be developed and reviewed in parallel with Phase 1A. The workflow structure is modeled directly on the existing `.github/scripts/cherry-pick.sh` idempotency pattern.

**Delivers:** Daily automated detection of new nexus-mods/Vortex release tags; draft rebase PR with clean/conflict distinction; idempotent behavior on repeated runs; reduces the estimated 4–8 hour manual rebase cycle to a human review-and-merge operation.

**Addresses (from FEATURES.md):** Cron trigger + tag comparison (P1); clean and conflicted rebase paths (P1); PR body template with fork URL (P1); duplicate PR guard (P1); repository guard (P1).

**Avoids:** Pitfalls 7 (duplicate PRs — fixed branch name + idempotency check), 8 (empty PR on no-op — `merge-base` guard), 9 (conflict-to-draft-PR), 10 (branch protection — push to side branch only), 11 (feedback loop — `schedule` trigger not `push`), 12 (stale PR accumulation — fixed branch name + label).

**Files changed:** `.github/workflows/sync-upstream.yml` (new), `.github/scripts/sync-upstream.sh` (new), `.planning/upstream-sync/last-known-tag.txt` (new tracking file)

**Research needed:** None. Trigger mechanism, workflow structure, permissions model, and PR body template are fully specified in STACK.md and FEATURES.md.

### Phase 2: Integration Validation

**Rationale:** Both Phase 1 deliverables need end-to-end validation that unit tests alone cannot provide. The rebase CI needs a first live run to confirm GITHUB_TOKEN permissions and branch creation work in the actual fork. The chattr+F layer needs confirmation that both matrix jobs stay green.

**Delivers:** Confirmed green CI on both `ubuntu-latest` and `windows-latest` matrix jobs for Phase 1A; first successful (or intentionally-conflicted) rebase PR from Phase 1B; confirmed no duplicate PR on second workflow run.

**Gate for Phase 1A:** Both matrix jobs in `main.yml` pass on the chattr+F PR; `applyChattrCasefold` unit tests pass; `fs.test.ts` covers all three cases (success, EOPNOTSUPP, non-Linux).

**Gate for Phase 1B:** Manual `workflow_dispatch` trigger produces a draft PR (or clean "no new upstream" exit); second manual trigger without merging the PR updates the branch without creating a duplicate; conflict-path creates a draft PR (inject artificial conflict to verify).

**Optional additions at this phase (v1.x items):** `workflow_dispatch` `upstream_ref` input override; runtime casefold verification (`verifyCasefoldActive`); `upstream-rebase` label support; `workflow_dispatch` for rebase CI.

### Phase Ordering Rationale

- Phase 1A and 1B share no files and have no runtime dependencies — parallel development is correct; do not serialize them.
- Phase 2 validation gates on both Phase 1 PRs being merged and cannot start before both are in.
- The chattr+F migration path (existing staging directories) is deferred to v2+ due to the hard kernel constraint (empty-dir requirement); new installations automatically get kernel casefold, existing installations silently continue using the shim.
- The rebase CI conflict-to-draft-PR path must be implemented in Phase 1B from day one — adding it reactively means the first upstream release with conflicts produces a failed CI job with no actionable output and no PR.
- The runtime casefold verification (`verifyCasefoldActive`) is deferred to Phase 2 validation because it is only relevant for NFS/FUSE staging directories, which are an uncommon configuration; the Phase 1A implementation is correct for the common cases.

### Research Flags

Phases with standard patterns — skip research-phase:

- **Phase 1A (chattr+F):** Injection point, call signature, platform guards, and test cases are fully specified in ARCHITECTURE.md Q5 and FEATURES.md. Implement directly from those documents.
- **Phase 1B (Rebase CI):** Workflow structure, action versions, permissions model, idempotency pattern, and PR body template are fully specified in STACK.md and FEATURES.md. The `cherry-pick.sh` in the repo is the direct model.
- **Phase 2 (Validation):** Standard CI validation — no research needed.

Phases that may benefit from deeper investigation before implementation:

- **NFS/FUSE runtime verification (Phase 2 / v1.x addition):** The `verifyCasefoldActive` function (write uppercase, read lowercase) is straightforward but needs care around race conditions and ensuring the test file does not interfere with the staging directory state. Brief design spike recommended before merging.
- **btrfs casefold (future, not this milestone):** Research confidence is LOW — btrfs casefold is not confirmed in any released kernel as of April 2026. Do not implement btrfs casefold support until kernel availability is confirmed on hardware.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All technologies verified: `fs.statfs()` Node docs, `chattr` man page, Actions marketplace versions confirmed April 2026; rejected alternatives confirmed via npm registry and marketplace inspection |
| Features | HIGH | Grounded in direct codebase inspection of `fs.ts`, `stagingDirectory.ts`, `profile_management/index.ts`, and existing CI workflows; behavioral contract derived from actual call chain |
| Architecture | HIGH | Injection point (`ensureDirWritableAsync` in `fs.ts`) confirmed by full call chain trace from `manageGameDiscovered` through `ensureStagingDirectoryImpl`; workflow structure modeled on existing `cherry-pick.sh` pattern |
| Pitfalls | HIGH | 13 pitfalls documented from codebase audit + kernel behavior + Actions permissions; not inferred — observed from source patterns, man pages, and kernel documentation |

**Overall confidence:** HIGH

### Gaps to Address

- **btrfs casefold status (LOW confidence):** No released kernel version confirmed supporting `chattr +F` on btrfs as of April 2026. STACK.md correctly includes `BTRFS_SUPER_MAGIC` in `getStagingFsType()` as future-proofing but explicitly marks btrfs casefold as unconfirmed. Treat btrfs as "always fallback to shim" for this milestone; revisit when btrfs casefold lands in a stable kernel release.

- **NFS/FUSE runtime verification (Phase 2 decision point):** The `verifyCasefoldActive` runtime test (Pitfall 6) is specified but marked as a v1.x addition. If staging directories on NAS/network mounts are a common user configuration for this project's target audience (Steam Deck users using external drives), promote the runtime verification to a Phase 1A must-have rather than a post-validation addition. Decide before Phase 1A starts.

- **SteamOS `/home` partition behavior (expected, documented for clarity):** SteamOS uses btrfs for the OS partition but ext4 for `/home` on Steam Deck; however, the ext4 `/home` partition is typically formatted without the casefold feature. Steam Deck users will always fall back to the userspace shim — chattr+F will not activate in the primary SteamOS deployment scenario. This is correct behavior (silent fallback), but worth stating explicitly so the feature is not expected to reduce per-call overhead on Steam Deck.

---

## Sources

### Primary (HIGH confidence)

- `src/renderer/src/util/fs.ts` — `ensureDirWritableAsync`, `isWinePrefixPath`, `resolveCaseIfWinePrefix`, injection point confirmed
- `src/renderer/src/extensions/mod_management/stagingDirectory.ts` — `ensureStagingDirectoryImpl`, full staging dir creation call chain
- `src/renderer/src/extensions/profile_management/index.ts` — `manageGameDiscovered` → `ensureStagingDirectory` call site
- `.github/workflows/main.yml` — CI matrix structure; Windows + Linux parallel build jobs confirmed
- `.github/workflows/cherry-pick.yml` + `.github/scripts/cherry-pick.sh` — idempotent PR creation pattern; conflict-to-draft-PR handling — direct model for rebase CI
- `.github/workflows/release-linux.yml` — fork-only workflow pattern; `workflow_run` trigger example
- nodejs.org — `fs.statfs()` added v18.17.0, `.type` field returns `f_type` filesystem magic number
- man1/chattr — `+F` sets `FS_CASEFOLD_FL`; requires empty directory; requires filesystem-level casefold feature enabled at mkfs time
- kernelnewbies.org/Linux_5.2 — ext4 casefold merged in Linux 5.2 (2019)
- github.com/peter-evans/create-pull-request — v8.1.1, April 2026, 2.7k stars, 537 forks, 114 releases
- github.com/actions/github-script — v9.0.0, April 2026
- docs.github.com Actions — `schedule`, `workflow_dispatch`, `repository_dispatch` event docs; confirmed no cross-repo `release` trigger

### Secondary (MEDIUM confidence)

- Steam/Proton `chattr +F` behavior on Steam library folders — community-documented in Steam for Linux changelogs (2019) and SteamOS documentation; no direct Valve source code inspection
- btrfs EOPNOTSUPP on `chattr +F`: confirmed via chattr man page behavior documentation; no direct kernel btrfs source inspection for April 2026 btrfs status

### Tertiary (LOW confidence)

- btrfs casefold kernel support: no released kernel version confirmed as of April 2026 — ext4-only for this milestone
- `imba-tjd/rebase-upstream@0.12` characteristics: confirmed via marketplace search but limited detail on actual behavior

---

*Research completed: 2026-04-15*
*Ready for roadmap: yes*
