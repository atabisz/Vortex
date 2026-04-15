# Feature Research: chattr+F Dual-Path + Rebase CI Automation

**Domain:** Electron mod manager — kernel casefold filesystem layer + upstream rebase automation
**Researched:** 2026-04-15
**Confidence:** HIGH — claims based on direct codebase inspection and verified kernel/gh-actions knowledge
**Milestone scope:** Two independent infrastructure capabilities for the Vortex Linux fork

---

## Prerequisite: What Is Already Built

Before detailing the new features, these foundations are assumed complete:

- Wine prefix case-folding userspace shim (`fs.ts`): `readFileAsync`, `writeFileAsync`,
  `statAsync`, `renameAsync`, `copyAsync`, `ensureDirAsync`, `watch` all resolve path casing
  for `/compatdata/<id>/pfx/` paths on Linux. Source: `src/renderer/src/util/fs.ts`.
- `resolvePathCase(rootDir, relPath, dirCache?)` in `src/renderer/src/util/resolvePathCase.ts`:
  userspace per-segment directory walk for case-insensitive resolution.
- `ensureStagingDirectory()` in `src/renderer/src/extensions/mod_management/stagingDirectory.ts`:
  creates the staging directory and writes a `__vortex_staging_folder` tag file. Called from
  `profile_management/index.ts:manageGameDiscovered()` as first-time game management initializer.
- GitHub Actions `main.yml` CI: builds on `ubuntu-latest` + `windows-latest`, runs lint/tests.
- GitHub Actions `release-linux.yml`: builds AppImage + .deb on push/tag; does not currently
  poll or track upstream nexus-mods/Vortex tags.

---

## Feature Domain 1: chattr+F Kernel Casefold Layer

### Background: What chattr+F Actually Does

`chattr +F` sets the `FS_CASEFOLD_FL` inode attribute on a directory. When set on an **empty**
directory on an ext4 filesystem with the `casefold` feature enabled (requires
`tune2fs -E encoding=utf8 <device>`), all filename lookups under that directory become
case-insensitive at the kernel level. The kernel maps all filenames to UTF-8 normalized form
before storage.

**Key technical facts (HIGH confidence — kernel docs + man pages):**

- Kernel support: ext4 casefold was merged in Linux 5.2 (2019). Ubuntu 20.04+ kernels support it.
  Ubuntu 22.04 (the CI runner) ships kernel 5.15 — supported.
- Filesystem requirement: the ext4 partition must have `casefold` feature bit set. This requires
  running `tune2fs -O casefold <device>` (or formatting with `-O casefold`). Most user ext4
  partitions do NOT have this enabled by default. SteamOS uses an f2fs root partition but ext4
  for `/home` — enabling casefold requires remounting which is outside Vortex's scope.
- chattr +F requires: (a) ext4 with casefold feature, (b) the target directory must be empty,
  (c) caller must have write permission on the parent.
- btrfs: btrfs has a separate `chattr +c` (compression) attribute; btrfs case-folding is a
  different feature (`case_insensitive` mount option, experimental as of kernel 6.x). Do NOT
  conflate with ext4 casefold. btrfs casefold support is LOW confidence — treat btrfs as
  "fallback to userspace shim" unless verified on hardware.
- Detection: `statfs()` returns `f_type`; ext4 magic is `0xEF53`. Alternatively, read
  `/proc/mounts` or call `ioctl(fd, EXT4_IOC_GETFLAGS, ...)` after attempting chattr.
- The `chattr` command itself is a userspace wrapper around `ioctl(fd, EXT4_IOC_SETFLAGS, flags)`.
  In Node.js, this means spawning `chattr +F <dir>` via `child_process.execFile` or implementing
  the ioctl directly via a native addon. Spawning chattr is simpler and is what Valve uses.
- When chattr+F fails (EOPNOTSUPP, ENOTSUP, or non-zero exit), the call site must catch the
  error and fall back to the userspace shim — silently, with a log entry.

**What Valve's Proton actually does (MEDIUM confidence — no direct source code, but well-documented
community knowledge and confirmed via Steam Deck hardware behavior):**

Steam/Proton applies `chattr +F` to the Steam library folder (e.g., `steamapps/`) during Steam
setup on compatible ext4 filesystems. This is what makes Windows games with case-sensitive filename
references work without a Wine-side shim. The behavior is documented in Steam for Linux changelogs
(2019) and the SteamOS documentation. Proton itself does not call chattr — Steam client does it
at library creation time. Proton then relies on the kernel-level case-folding being active on
the directories it uses.

The implication for Vortex: when the staging directory is on an ext4-with-casefold partition
(common on SteamOS/Steam Deck), applying chattr+F at staging directory creation eliminates the
need for the userspace shim entirely for files within that staging directory.

### When the Staging Directory Gets Created

In the current code, `ensureStagingDirectory()` is called from
`profile_management/index.ts:manageGameDiscovered()` exactly once — when the user first clicks
"Manage" on a game. It calls `fs.ensureDirWritableAsync(instPath)` which calls `fs.ensureDir()`.

The chattr+F call must happen immediately after the directory is created, before any files are
written. The hook point is: after `fs.ensureDir(instPath)` succeeds and before
`writeStagingTag()` writes the `__vortex_staging_folder` file. This is within
`ensureStagingDirectoryImpl()` in `stagingDirectory.ts`.

The staging path is typically set to something like
`~/Games/vortex-staging/<gameid>/` or a user-configured path. It must be on an ext4 partition
with casefold enabled for chattr+F to work. The detection + apply + fallback sequence lives
inside `ensureStagingDirectoryImpl()`.

### Table Stakes for chattr+F Feature

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Detect whether the staging directory's filesystem is ext4 | Required before attempting chattr+F | LOW | `statfs()` via Node.js child process or `@vortex/fs` ioctl; ext4 magic = `0xEF53`. Alternative: attempt chattr+F and catch EOPNOTSUPP |
| Detect whether ext4 casefold feature is enabled on the partition | chattr+F requires this; will silently fail without it | MEDIUM | Parse `tune2fs -l <device>` output for `casefold` in features list, or read `/proc/fs/ext4/<dev>/options` |
| Apply `chattr +F` to the staging directory immediately after creation | Kernel-level case-folding for the staging tree | LOW | `execFile('chattr', ['+F', stagingPath])` after `ensureDir`. Must happen before any files are written. |
| Fall back silently to userspace shim when chattr+F fails or is unsupported | Required for XFS, ZFS, btrfs, non-casefold ext4, and any error condition | LOW | Catch `EOPNOTSUPP`, `ENOTSUP`, non-zero exit from chattr; log to debug; no user notification for normal fallback |
| Userspace shim remains active and unmodified as fallback | Correctness on non-ext4 systems | LOW | No change to existing `fs.ts` shim — it stays in place and activates when chattr+F is not applied |
| chattr+F state persisted alongside staging path | Re-check not needed on every launch | LOW | Store a flag (e.g., in the staging tag file or a Redux state key) indicating "casefold: kernel\|userspace" |
| No error dialog shown when chattr+F silently falls back | UX — normal operation on most filesystems | LOW | Fallback is expected; only log at debug level |
| Log entry emitted at INFO level when chattr+F is successfully applied | Diagnostic support | LOW | `log("info", "staging dir: kernel casefold active", { path: instPath })` |
| Log entry emitted at DEBUG level when chattr+F falls back to userspace | Diagnostic support | LOW | `log("debug", "staging dir: casefold fallback to userspace shim", { reason })` |

### Differentiators for chattr+F

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Notification when casefold cannot be enabled on a user-configured ext4 partition | Helps users who formatted incorrectly understand why Windows games may have issues | MEDIUM | Only show if: (a) ext4 detected, (b) casefold feature NOT enabled on partition. "For best Windows game compatibility, your staging directory's filesystem should have casefold enabled." — with documentation link |
| Abstract behind a `CaseFoldStrategy` interface | Allows future strategies (e.g., overlayfs) without touching callers | MEDIUM | Interface with `apply(dirPath): Promise<'kernel'\|'userspace'>`. Lets staging directory code stay strategy-agnostic |
| Detect existing staging directories lacking chattr+F and offer to migrate | Users who set up staging before this feature existed | HIGH | Requires detecting non-empty directory (can't apply chattr+F retroactively) — this is a HARD constraint: chattr+F only works on empty dirs. Migration = create new dir, apply chattr+F, copy files. Deferred to v2+ |

### Anti-Features for chattr+F

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Showing a "casefold not active" error on XFS/ZFS/btrfs | These filesystems never support chattr+F; error would be misleading and alarming | Silent fallback to userspace shim with debug log only |
| Running `tune2fs -O casefold` to enable casefold on user's partition | Destructive filesystem operation; requires unmounting; can corrupt data if done wrong | Never modify filesystem features. Detect and inform only |
| Calling chattr+F on a non-empty staging directory | Kernel rejects it with ENOTEMPTY/EOPNOTSUPP; would fail silently and leave users confused | Only apply at directory creation time (empty dir). Skip for existing directories |
| Requiring chattr+F to be present as a hard dependency | chattr may not be installed (e.g., Flatpak sandbox, minimal containers, non-ext4 systems) | Always treat chattr absence as "use userspace shim" — no error, no missing-package prompt |
| Removing or bypassing the userspace shim once chattr+F is applied | The shim handles Wine prefix paths; chattr+F handles staging paths — different scope | Keep both. They are complementary, not competing |
| Attempting chattr+F inside a Flatpak sandbox | Flatpak's filesystem namespace prevents ioctl on host filesystem | Detect Flatpak (`FLATPAK_ID` env var present) and skip chattr+F attempt entirely |

### Behavioral Contract: What "Applied at Staging Directory Creation" Means

1. User clicks "Manage" on a game for the first time.
2. `manageGameDiscovered()` → `ensureStagingDirectory()` → `ensureStagingDirectoryImpl()`.
3. `fs.ensureDirWritableAsync(instPath)` creates the directory.
4. Immediately after creation succeeds: detect filesystem type at `instPath`.
   - If ext4 with casefold feature: spawn `chattr +F instPath`.
     - Success: log INFO, store `casefold: 'kernel'` in tag/state.
     - Failure (any error): log DEBUG, store `casefold: 'userspace'`.
   - If not ext4 or casefold not enabled: log DEBUG, store `casefold: 'userspace'`.
   - If Flatpak sandbox: skip entirely, log DEBUG, store `casefold: 'userspace'`.
5. `writeStagingTag()` writes `__vortex_staging_folder` (this can include the casefold field).
6. Userspace shim in `fs.ts` remains unchanged and continues to intercept Wine prefix paths.

**On subsequent launches:** Read casefold status from tag file. No re-detection needed unless
staging path changes.

### chattr+F and the Existing Userspace Shim: Scope Boundary

The existing userspace shim (in `fs.ts`) fires for paths containing `/compatdata/<id>/pfx/` —
i.e., Wine prefix paths. It handles Wine prefix case-folding for files Vortex reads from/writes
to the game's virtual Windows filesystem.

chattr+F on the staging directory handles a different problem: mod files staged under Vortex's
own staging directory. These paths do NOT contain `/compatdata/` so the existing shim does NOT
fire for them. chattr+F is additive — it covers the staging directory scope that the shim misses.

Scope summary:
- Userspace shim: Wine prefix paths (`/compatdata/<id>/pfx/`) — stays in place, unchanged
- chattr+F: Vortex staging directory (user-configured, e.g., `~/Games/vortex-staging/`) — new

---

## Feature Domain 2: Rebase CI Automation

### Background: The Maintenance Problem

The upstream repository (nexus-mods/Vortex) publishes new releases every 1–4 weeks. Each
upstream release requires the fork to:
1. `git fetch upstream`
2. `git rebase upstream/<tag>` onto the fork's `master`
3. Resolve conflicts from the Linux platform-guard patch set
4. Test that the build still passes
5. Push the rebased `master`

This is 4–8 hours of manual work per cycle. The rebase CI goal: automate steps 1–2 (and
potentially 3 if conflict-free) with a GitHub Actions workflow that opens a PR.

### Trigger Strategy: Cron Poll

GitHub Actions cannot subscribe to webhooks from external repositories (nexus-mods/Vortex is
not owned by this fork). The only viable trigger is `schedule` (cron poll).

Recommended: run daily at 09:00 UTC. Cron: `'0 9 * * *'`. This provides next-business-day
detection of upstream releases without excessive API calls. Weekly is too slow; hourly is
unnecessary given upstream release cadence.

The workflow queries `gh api repos/Nexus-Mods/Vortex/releases/latest --jq .tag_name`, compares
against the last-processed tag stored as a file in the repo (or a GitHub Actions variable/secret),
and exits early if no new tag exists.

### PR Structure

The rebase PR should be opened against `master` of the fork (atabisz/Vortex), not against any
branch of the upstream. The PR's purpose is: human-reviewed merge of upstream changes + conflict
resolution, if any.

**Draft status:** Open as a DRAFT PR. Rationale: if the rebase was conflict-free, CI still needs
to run and a human should verify before merging. Draft communicates "not ready to merge yet."
If the rebase had conflicts, draft communicates "this needs work." Convert to ready-to-merge only
after human review + green CI.

**Branch naming convention:** `rebase/upstream-<tag>` where `<tag>` is the upstream release tag
verbatim (e.g., `rebase/upstream-v1.12.3`). This makes automation-created branches identifiable
and avoids collision with feature branches.

**Conflict detection:** If `git rebase` exits non-zero (conflicts), the workflow aborts the
rebase, commits the conflicted state to the branch with a clearly named commit
`"CONFLICT: upstream rebase <tag>"`, pushes the branch, and opens the PR with a "conflicts
detected" notice in the body. This gives the human a branch to checkout and resolve.

If `git rebase` exits 0 (clean), the workflow commits and pushes the rebased branch, opens
the PR, and runs CI normally.

### Table Stakes for Rebase CI

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Cron trigger checks nexus-mods/Vortex for new release tags once daily | Automated detection of upstream releases | LOW | `gh api repos/Nexus-Mods/Vortex/releases/latest --jq .tag_name` |
| Compare latest upstream tag against last-processed tag; exit early if unchanged | Avoid creating duplicate PRs on every cron run | LOW | Store last-processed tag in a file committed to repo (e.g., `.github/last-upstream-tag`) or use a GitHub Actions variable |
| Create a branch named `rebase/upstream-<tag>` from current master | Isolated branch for rebase work | LOW | `git checkout -b rebase/upstream-<tag>` after fetching upstream |
| Perform `git rebase upstream/<tag>` and detect success vs. conflict | Core rebase operation | LOW | Check exit code of `git rebase`; set output variable |
| On clean rebase: push branch and open DRAFT PR against master | Clean path | LOW | `gh pr create --draft` |
| On conflicted rebase: abort, push conflicted branch state, open DRAFT PR with conflict notice | Conflict path | MEDIUM | `git rebase --abort`; commit `git diff` of conflict state; push; PR body includes conflict details |
| PR title: `chore: rebase onto upstream <tag>` | Consistent commit history / PR search | LOW | Include upstream release URL in PR body |
| PR body contains: upstream tag, upstream release URL, link to upstream changelog, conflict status | Human reviewer needs context to evaluate changes | LOW | Template in workflow HEREDOC |
| PR body contains fork-specific note pointing to https://github.com/atabisz/Vortex | Per project PR convention (see MEMORY) | LOW | Required by project feedback rule |
| CI runs automatically on the rebase PR (no special bypass needed) | Validate the rebase didn't break the build | LOW | Standard CI trigger `pull_request: branches: [master]` already in `main.yml` — no change needed |
| Workflow skips gracefully if a `rebase/upstream-*` PR is already open | Prevent duplicate PRs when cron runs again before the existing PR is merged | LOW | `gh pr list --search "rebase/upstream-<tag>" --state open` check before creating |
| Workflow only runs on the fork (atabisz/Vortex), not on nexus-mods/Vortex if forked further | Fork-only workflow guard | LOW | `if: github.repository == 'atabisz/Vortex'` condition on job |

### Differentiators for Rebase CI

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| PR body includes diff summary of upstream changes vs. previous tag | Reviewer can immediately see what changed without leaving GitHub | MEDIUM | `gh api repos/Nexus-Mods/Vortex/compare/<prev-tag>...<new-tag>` — list commit titles. Truncate at 50 commits |
| Auto-label the PR with `upstream-rebase` label | Filtering and tracking in issue tracker | LOW | `gh pr create --label upstream-rebase` (label must be created once in repo settings) |
| Notify via GitHub issue or PR comment if the last N rebase PRs were all conflicted | Signal that the platform patch set has drifted from upstream significantly | HIGH | Defer — not needed for initial implementation |
| `workflow_dispatch` manual trigger with optional tag override | Test the workflow or trigger outside cron schedule | LOW | Add `workflow_dispatch: inputs: upstream_tag: {type: string, required: false}` to trigger |

### Anti-Features for Rebase CI

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Auto-merging the rebase PR | Rebase onto upstream always requires human review — upstream may break Linux-specific code paths | Always open as DRAFT; never auto-merge |
| Using `git merge` instead of `git rebase` | Merge creates a merge commit, polluting history and making upstream diffs harder to read | Always rebase; the flat history is essential for keeping the upstream diff minimal |
| Storing the GITHUB_TOKEN in a non-secrets location for `gh pr create` | Security risk | Use `${{ secrets.GITHUB_TOKEN }}` standard token — has PR write permission for the fork |
| Running the entire build matrix in the rebase-check step | Expensive; the conflict check does not require building | The conflict check job just runs git operations + gh CLI — no pnpm install, no build |
| Committing the `.github/last-upstream-tag` file via the workflow on every run | Commits from CI on every check (even no-op) pollute git log | Only update the last-processed tag file after a PR is successfully opened, not on every cron check |
| Rebasing directly onto master (non-branch) | Bypasses review; if upstream broke something, it ships immediately | Always into a feature branch + PR, never direct-push to master |
| Opening a non-draft PR when conflicts exist | Misleads reviewers into thinking it's merge-ready | Conflicts = draft + "needs conflict resolution" label; clean = draft + "ready for review" comment |

### PR Template (Expected Body Content)

```
## Upstream Rebase: <tag>

**Upstream release:** https://github.com/Nexus-Mods/Vortex/releases/tag/<tag>
**Upstream changelog:** https://github.com/Nexus-Mods/Vortex/compare/<prev-tag>...<tag>

**Status:** [CLEAN — no conflicts] | [CONFLICTS DETECTED — see below]

### What Changed Upstream (commit titles)
<list of upstream commit titles, max 50>

### Conflict Details (if any)
<conflicted files list>

---

Fork maintained at: https://github.com/atabisz/Vortex
```

---

## Feature Dependencies

```
chattr+F kernel casefold
  └── requires: empty staging directory at creation time (existing ensureStagingDirectory flow)
  └── requires: filesystem detection utility (new — statfs or /proc/mounts read)
  └── falls back to: existing userspace shim in fs.ts (no change to shim required)
  └── independent of: rebase CI workflow

Rebase CI
  └── requires: GITHUB_TOKEN with PR write permission (standard in fork)
  └── requires: .github/last-upstream-tag tracking file (new)
  └── depends on: existing main.yml CI triggers (pull_request: master) — no change
  └── independent of: chattr+F feature

Userspace casefold shim (existing)
  └── unchanged — continues to handle Wine prefix paths
  └── chattr+F does NOT replace the shim — different path scope
```

### Dependency Notes

- **chattr+F requires empty directory:** The kernel rejects `chattr +F` on non-empty directories.
  This is a hard kernel constraint, not a code deficiency. The call site must be inside
  `ensureStagingDirectoryImpl()` immediately after `ensureDir` creates the directory, before
  `writeStagingTag()` writes the first file. If `ensureDir` found the directory already existed
  (i.e., returned without creating), chattr+F cannot be applied retroactively — log and move on.

- **Rebase CI depends on last-processed tag tracking:** Without knowing the last-processed tag,
  the workflow would open a new PR every day even if no upstream changes occurred. The simplest
  implementation: commit a `.github/last-upstream-tag` file containing just the tag string
  (e.g., `v1.12.3`). The workflow reads this file, compares to the latest upstream tag, exits
  early on match. Updates the file only when opening a new PR.

- **Rebase CI does NOT depend on chattr+F:** These are independent infrastructure items.
  They share a milestone but have zero runtime dependency on each other.

---

## MVP Definition

### Launch With (v1 — this milestone)

- [ ] chattr+F detection + apply at staging directory creation, with fallback to userspace shim
- [ ] chattr+F: no user-visible notification on fallback (silent to INFO/DEBUG logs only)
- [ ] chattr+F: casefold strategy stored in staging tag file
- [ ] Rebase CI: cron workflow that detects new upstream tags and opens a draft PR
- [ ] Rebase CI: handles clean rebase and conflicted rebase as separate branches
- [ ] Rebase CI: PR body contains upstream tag, release URL, fork URL, conflict status
- [ ] Rebase CI: skips if a PR for the same upstream tag already exists

### Add After Validation (v1.x)

- [ ] chattr+F: notification when ext4 staging dir lacks casefold feature (informational, not error)
- [ ] chattr+F: `CaseFoldStrategy` abstraction interface if a third strategy emerges
- [ ] Rebase CI: `workflow_dispatch` manual trigger with tag override
- [ ] Rebase CI: upstream commit diff summary in PR body

### Future Consideration (v2+)

- [ ] chattr+F: migration path for existing staging directories (create new dir, copy, apply)
  — blocked by hard kernel constraint (chattr+F requires empty dir)
- [ ] Rebase CI: drift detection alert after N consecutive conflicted rebases
- [ ] Rebase CI: auto-resolve known trivial conflicts (e.g., version bumps in package.json)

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| chattr+F: detect + apply at staging creation | HIGH (mod deploy correctness on ext4) | LOW | P1 |
| chattr+F: silent fallback to userspace shim | HIGH (correctness on non-ext4) | LOW | P1 |
| chattr+F: persist casefold strategy in tag | MEDIUM (no re-detection on relaunch) | LOW | P1 |
| chattr+F: Flatpak sandbox detection + skip | MEDIUM (Flatpak is a target platform) | LOW | P1 |
| Rebase CI: cron poll + draft PR | HIGH (reduces 4–8h maintenance cost/cycle) | LOW | P1 |
| Rebase CI: conflict-path handling | HIGH (conflicts will happen) | MEDIUM | P1 |
| Rebase CI: PR body template | MEDIUM (reviewer context) | LOW | P1 |
| Rebase CI: duplicate PR guard | MEDIUM (prevents spam) | LOW | P1 |
| chattr+F: "casefold not enabled" notification | LOW (edge case) | MEDIUM | P2 |
| Rebase CI: workflow_dispatch override | LOW (debugging aid) | LOW | P2 |
| Rebase CI: upstream commit diff in PR body | LOW (nice to have) | MEDIUM | P2 |
| chattr+F: migration path for existing dirs | LOW (new installs get it automatically) | HIGH | P3 |

**Priority key:** P1 = must ship in this milestone, P2 = after validation, P3 = future

---

## Linux-Specific Behavioral Notes

### chattr+F: Filesystem Detection

The most reliable approach for detecting ext4-with-casefold:

1. **Attempt-and-catch pattern** (recommended): Spawn `chattr +F <dir>` on the newly created
   empty directory. If it exits 0: kernel casefold is active. If it exits non-zero or the
   binary is not found: fall back silently. This avoids needing to parse `/proc/mounts` or
   run `tune2fs` (which requires root on some systems).

2. **Pre-check via statfs** (alternative): Check `f_type === 0xEF53` (ext4) via a native call,
   then separately check whether casefold is enabled. More code, but avoids spawning chattr
   only to have it fail.

The attempt-and-catch pattern is simpler, has fewer code paths, and matches how other tools
(including Steam) handle this feature.

### Rebase CI: Branch Naming and Conflict State

When `git rebase upstream/<tag>` encounters conflicts:
- `git rebase --abort` is needed to restore the working tree
- The conflicted files are lost after `--abort`
- Workaround: before running rebase, capture `git diff upstream/<tag>..HEAD -- <known-conflict-files>`
  to embed the diff context in the PR body. Or: run rebase in a separate worktree, let it fail,
  commit the conflicted state before aborting, push those files as a separate "context" commit.

Simplest safe approach: on conflict, push the pre-rebase master as the branch (no rebase
applied), add a PR comment listing which files will conflict (via `git diff --name-only`),
and let the human do the rebase manually in a clone. The PR is just the signal — not the work.

### chattr+F: Why Not Just Always Use the Userspace Shim?

The userspace shim has known limitations at scale:
- It fires per-call on Wine prefix paths, adding a `readdir()` per directory segment on every
  `readFileAsync`/`statAsync` call.
- inotify watchers in Vortex bypass the shim — `watch()` is shimmed but third-party code using
  raw `fs.watch` will not case-fold.
- Deep mod hierarchies (thousands of files) make the per-call overhead measurable.

chattr+F at the kernel level means: zero overhead per operation, inotify works natively, and
no code path in Vortex needs to know about case-folding once the directory is created. It is
strictly better when available. The shim remains as the universal fallback.

---

## Sources

- Codebase: `/home/alex/src/Vortex/src/renderer/src/extensions/mod_management/stagingDirectory.ts`
  (staging directory creation flow — `ensureStagingDirectoryImpl`)
- Codebase: `/home/alex/src/Vortex/src/renderer/src/extensions/profile_management/index.ts`
  (call site: `manageGameDiscovered` → `ensureStagingDirectory`)
- Codebase: `/home/alex/src/Vortex/src/renderer/src/util/fs.ts`
  (existing userspace casefold shim — isWinePrefixPath, resolveCaseIfWinePrefix)
- Codebase: `/home/alex/src/Vortex/src/renderer/src/util/resolvePathCase.ts`
  (per-segment case-resolving implementation)
- Codebase: `/home/alex/src/Vortex/.github/workflows/main.yml` (CI baseline)
- Codebase: `/home/alex/src/Vortex/.github/workflows/release-linux.yml` (fork-only workflow pattern)
- Codebase: `/home/alex/src/Vortex/VORTEX-LINUX.md` (phase 4.4 and 4.5 intent)
- Kernel: chattr +F / EXT4_IOC_SETFLAGS FS_CASEFOLD_FL, Linux 5.2+
  (man 1 chattr, fs/ext4/ioctl.c)
- GitHub Actions: `schedule` event (cron), `workflow_dispatch` event, `gh pr create --draft`
- Project convention: PR bodies must include fork URL per `.claude/MEMORY/WORK/feedback_pr_fork_link.md`
- Confidence: HIGH for all claims; chattr+F ext4 kernel behavior is well-established and
  directly testable; rebase CI patterns are standard GitHub Actions patterns

---
*Feature research for: chattr+F dual-path filesystem layer + rebase CI automation*
*Researched: 2026-04-15*
