# Pitfalls Research

**Domain:** chattr+F case-folding filesystem layer + GitHub Actions upstream rebase automation
**Researched:** 2026-04-15
**Confidence:** HIGH — grounded in codebase audit of `fs.ts`, `stagingDirectory.ts`, and existing CI workflows

> **Scope note:** This document covers one specific milestone: adding (1) chattr+F dual-path
> filesystem layer to complement the existing Wine prefix case-folding shim in `fs.ts`, and
> (2) a GitHub Actions workflow for automated upstream rebase PRs. The v3.0 pitfalls
> (pkexec elevation, gamebryo-savegame C++ compilation) are documented in the prior
> `PITFALLS.md` (v3.0 scope). Cross-references made where a prior decision creates a
> new-milestone trap.

---

## Critical Pitfalls

Mistakes that require rewrites or block entire feature areas.

---

### Pitfall 1: chattr+F requires the filesystem to be mounted with the `casefold` feature — this is almost never true for user home directories

**What goes wrong:**
`chattr +F <directory>` will return `Operation not supported` (EOPNOTSUPP) on any
filesystem not mounted with the `casefold` feature enabled at mount time. The casefold
feature must be enabled when the filesystem is *created* (e2fsck/mkfs.ext4 with
`-O casefold`) or added via `tune2fs -O casefold` on an unmounted filesystem. It cannot
be enabled on a live, in-use filesystem without unmounting it.

On a typical Linux desktop (Ubuntu 22.04, Fedora 39, SteamOS), the `/home` partition is
an ext4 filesystem formatted *without* the casefold feature. The user's staging directory
(`~/.local/share/Vortex/mods/<game>/`) lives on this filesystem. `chattr +F` on that
path will silently fail or return EOPNOTSUPP — and Node.js's `child_process.exec('chattr
+F ...')` will receive a non-zero exit code that, if not explicitly checked, is discarded.

The failure is **silent at the call site** if the error is swallowed: the directory exists,
deployment proceeds, but case-insensitive lookup is never active. The user gets no feedback.

**Why it happens:**
Developers test on a system they control (e.g., a dev VM with casefold enabled on the test
partition) and assume the feature is universally available. The `chattr` man page does not
prominently warn that casefold is an opt-in filesystem feature. The EOPNOTSUPP error from
`chattr` is identical to other "not supported on this platform" errors, making it easy to
treat as "not Linux" rather than "not this filesystem."

**How to avoid:**
1. Treat chattr+F as **best-effort with graceful fallback**: check the `chattr +F` exit code
   explicitly. If it returns EOPNOTSUPP, log at `debug` level and fall back to the existing
   case-folding shim in `fs.ts` (the `resolvePathCase` / `resolveCaseIfWinePrefix` mechanism).
2. Never assume chattr+F succeeded. After the `chattr +F` call, verify with `lsattr -d
   <directory>` and parse the output for the `F` flag before reporting the feature active.
3. Do **not** gate deployment on chattr+F success. The shim already handles the common case;
   chattr+F is a performance optimization, not a correctness requirement.
4. Add a Node.js helper `async function trySetCasefold(dir: string): Promise<boolean>` that
   shells out to `chattr +F`, checks exit code, and returns `true`/`false` cleanly. Never
   fire-and-forget a shell command that sets filesystem attributes.

**Warning signs:**
- `chattr +F` exits with code 1 and message `Operation not supported while setting flags on <path>`
- The staging directory lives on a partition that `tune2fs -l <device> | grep features` shows
  does NOT include `casefold` in the feature list
- User reports case-insensitive lookup working on one machine and failing on another (different
  filesystem formatting at install time)

**Phase to address:** chattr+F implementation phase. The fallback path to `fs.ts`'s shim must
be in place before any deployment code that calls `chattr +F`.

---

### Pitfall 2: chattr+F can only be set on **empty** directories — applying it to an existing staging folder fails

**What goes wrong:**
The chattr man page is explicit: *"This attribute can only be changed in empty directories."*
Attempting `chattr +F` on a non-empty directory returns `Operation not supported` or
`Inappropriate ioctl for device` depending on kernel version.

The Vortex staging directory (`ensureStagingDirectory` in `stagingDirectory.ts`) may already
exist and contain mods from previous sessions. In that case, chattr+F cannot be applied
retroactively. The code in `stagingDirectory.ts` calls `ensureDirWritableAsync` and
`writeStagingTag` — these succeed, but there is no hook to apply chattr+F to the pre-existing
directory.

Additionally, even if the directory is initially empty when first created, the moment
`writeStagingTag` writes the `__vortex_staging_folder` marker file, the directory is no
longer empty — if chattr+F is called after tag creation rather than before, it will fail.

**Why it happens:**
Developers write the "happy path" — new game, new staging dir, apply chattr+F before any
files exist. But returning users already have a populated staging directory. The timing of
the `chattr +F` call relative to staging directory population is not obvious.

**How to avoid:**
1. Call `chattr +F` **immediately after `fs.mkdirAsync` or `fs.ensureDirAsync`** creates the
   directory, *before* any files are written into it (including the `__vortex_staging_folder`
   tag). The correct sequence is: `mkdir → chattr +F → write tag`.
2. For **existing staging directories** (the migration case): skip chattr+F silently. Do not
   attempt to apply it to a non-empty directory. Fall back to the fs.ts shim for all existing
   directories. Log a one-time notification: "Case-insensitive filesystem optimization not
   available for existing staging folders. New staging folders will use it automatically."
3. If a fresh staging directory is created by `ensureStagingDirectory` (the
   `mods === undefined` branch at line 183 of `stagingDirectory.ts`), hook the chattr+F call
   into that newly-created-only code path.

**Warning signs:**
- `chattr +F` exits non-zero for a directory that already has mods in it
- Developer tests with a fresh game installation (empty dir) but users report failure because
  they have existing mod libraries
- The `__vortex_staging_folder` tag file write precedes the `chattr +F` call in the call stack

**Phase to address:** chattr+F implementation phase. The `mkdir → chattr+F → write-tag`
ordering must be enforced in the same commit that introduces the feature.

---

### Pitfall 3: chattr+F does **not** cascade to subdirectories — and Vortex's staging layout is deeply nested

**What goes wrong:**
Setting chattr+F on the staging root (`~/.local/share/Vortex/mods/skyrimse/`) does not
automatically make subdirectories case-insensitive. Each subdirectory created after the
parent is set casefold **will** inherit the flag automatically (kernel ≥ 5.2) — but only
if the parent already had the `F` attribute when the subdirectory was created. Pre-existing
subdirectories and subdirectories created before the parent gets `F` are **not** retroactively
case-insensitive.

The Vortex staging layout creates a per-mod subdirectory for each installed mod:
`<stagingRoot>/<modId>/`. If the staging root gets chattr+F after mod directories already
exist, those existing mod directories operate in case-sensitive mode while new ones are
case-insensitive. Mixed behavior in the same staging folder is a recipe for inconsistent
deployment results.

**Why it happens:**
The inheritance rule is subtle: *new* subdirectories created under a casefold directory
inherit the flag; *existing* ones do not. Developers testing with a freshly-created staging
root and immediately installing mods see everything working. A migration scenario where
mods already exist produces inconsistency.

**How to avoid:**
1. Apply chattr+F only to new staging directories (see Pitfall 2). Do not attempt retroactive
   application.
2. After applying chattr+F to the staging root, verify that newly created mod subdirectories
   inherit the flag: `lsattr -d <stagingRoot>/<newModDir>` should show `F`. Add this as a
   test assertion in the integration test for the feature.
3. Do not rely on chattr+F for individual mod subdirectory lookups when the staging root was
   created before the feature shipped. The fs.ts shim remains the safety net for all
   pre-existing directories.

**Warning signs:**
- `lsattr -d <modSubdir>` does not show `F` even though `<stagingRoot>` has `F`
- Mod directories created in the same session as staging root creation show `F`, but
  directories from a prior session do not
- Case-insensitive lookup fails for older mods but works for newly installed ones

**Phase to address:** chattr+F implementation phase and the integration test spec.

---

### Pitfall 4: chattr+F silently does nothing on btrfs — the error is identical to "filesystem feature not enabled"

**What goes wrong:**
btrfs does not support the chattr `F` attribute (casefold). On btrfs, `chattr +F` returns:
`chattr: Operation not supported while setting flags on <path>`. This is the same error text
as an ext4 filesystem without the casefold feature enabled. The code cannot distinguish
"ext4 without casefold" from "btrfs" from "xfs" from "tmpfs" without additional filesystem
type detection.

SteamOS uses btrfs for the main partition. Some Linux users use btrfs home partitions
(Fedora 33+ defaults to btrfs for home). Docker volumes, CI environments, and many NAS
mounts are also btrfs or NFS.

Attempting `chattr +F` on btrfs produces EOPNOTSUPP. If the code treats this as a
non-fatal warning and falls back to the shim, behavior is correct. If the code attempts
a retry or escalation, it will loop forever.

**Why it happens:**
The casefold feature in the Linux VFS was initially implemented for ext4 and later added
to f2fs. btrfs has its own case-insensitive mount option (`-o suid,noexec,relatime,
space_cache=v2,subvol=/@ -o noatime,compress=zstd`) but does NOT support the chattr `F`
attribute — it uses a different kernel path.

**How to avoid:**
1. Before attempting `chattr +F`, detect the filesystem type using `statfs()` or by reading
   `/proc/mounts`. If the filesystem type is `btrfs` (magic `0x9123683e`), `xfs`, `tmpfs`,
   `nfs`, or `fuse.*`, skip chattr+F immediately without attempting the call.
2. A simpler approach: attempt `chattr +F` and treat any non-zero exit code as "feature
   unavailable on this filesystem." Do NOT retry. Log at `debug` level and activate fallback.
3. Never expose a user-facing error for chattr+F failure. It is a transparent optimization.

**Warning signs:**
- SteamOS deployment always falls back to shim (expected — btrfs)
- Fedora users on btrfs home partition always use shim (expected)
- CI environments (typically tmpfs or overlayfs) never test the chattr+F code path — add
  an ext4-specific integration test with a loopback device if critical path verification needed

**Phase to address:** chattr+F implementation phase. The btrfs/non-ext4 guard should be
in the first commit.

---

### Pitfall 5: chattr+F requires the `e2fsprogs` `chattr` binary — not available in all Docker/container environments

**What goes wrong:**
The `chattr` binary comes from the `e2fsprogs` package. On a minimal Docker image (e.g.,
`node:22-slim` or `node:22-alpine`), `chattr` is not installed. Calling `child_process
.exec('chattr +F ...')` in a container environment will fail with `ENOENT` (command not
found) rather than EOPNOTSUPP.

The Vortex CI runs on `ubuntu-latest` (a GitHub-hosted runner) where `e2fsprogs` is
pre-installed. But if integration tests are ever run in a Docker container, or if a user
runs Vortex inside a container for some reason, the `chattr` binary may be absent.

**Why it happens:**
Developers test on full Linux desktop systems where `e2fsprogs` is part of the base install.
Container images strip non-essential packages by default.

**How to avoid:**
1. Before the first chattr+F call, check for the `chattr` binary with `which chattr` or
   equivalent. If not found, skip and activate fallback silently.
2. Add `which chattr` to the Node.js helper `trySetCasefold()` as a pre-flight check:
   ```typescript
   async function trySetCasefold(dir: string): Promise<boolean> {
     if (process.platform !== 'linux') return false;
     if (!await commandExists('chattr')) return false;
     const { code } = await exec(`chattr +F "${dir}"`);
     return code === 0;
   }
   ```
3. Do not add `e2fsprogs` as a runtime dependency of Vortex. It is a system package.
   The presence check handles the absence case.

**Warning signs:**
- `ENOENT` or `command not found` when shelling out to `chattr` in a container
- CI test environment reports chattr+F working even though the underlying test filesystem
  is tmpfs (chattr binary present but the test is incorrectly asserting success)

**Phase to address:** chattr+F implementation phase. The `commandExists` guard must
be in the initial implementation.

---

### Pitfall 6: NFS and FUSE mounts silently ignore chattr+F — Wine prefix paths are frequently on network or FUSE mounts

**What goes wrong:**
chattr+F silently returns success (exit code 0) on some NFS configurations and FUSE
filesystems, but the attribute is NOT actually stored on the remote filesystem and case-
insensitive lookup does not function. This is the most dangerous failure mode: the code
believes casefold is enabled, skips the shim, and case-sensitive lookup failures surface
as mysterious "file not found" errors during deployment.

The risk is highest for users who store Steam libraries on a NAS (NFS mount), an external
drive with NTFS-fuse, or in a Flatpak sandbox (OverlayFS). Vortex staging directories
placed on these mounts will fail silently.

Note: For Wine prefix paths specifically, `fs.ts` already has `isWinePrefixPath()` which
guards `resolvePathCase` calls. The chattr+F feature primarily targets staging directories,
not Wine prefix directories. However, if staging directories are placed on a NFS/FUSE mount,
the failure described above applies.

**Why it happens:**
NFS filesystems report themselves as capable of extended attributes but do not necessarily
pass chattr `F` through to the server. FUSE filesystems vary — ext4-in-a-FUSE-layer may
support casefold, while `ntfs-3g` does not. There is no reliable way to distinguish
"chattr+F accepted" from "chattr+F silently accepted but not active" without a runtime test.

**How to avoid:**
1. After applying `chattr +F`, immediately create a test file with an uppercase name and
   attempt to read it with a lowercase name. If the read succeeds, casefold is active. If
   it fails, fall back to the shim and remove the test file.
   ```typescript
   async function verifyCasefoldActive(dir: string): Promise<boolean> {
     const testFile = path.join(dir, '__VORTEX_CASEFOLD_TEST__');
     await fs.writeFileAsync(testFile, '');
     try {
       await fs.statAsync(path.join(dir, '__vortex_casefold_test__'));
       return true;
     } catch {
       return false;
     } finally {
       await fs.removeAsync(testFile).catch(() => {});
     }
   }
   ```
2. Cache the result of this verification per staging directory (keyed by absolute path) so
   the test runs once per session, not on every file operation.
3. If verification fails even after `chattr +F` appeared to succeed, treat the directory
   as case-sensitive and activate the shim.

**Warning signs:**
- User stores Steam library on a NAS or external drive
- `lsattr -d <dir>` shows `F` but creating `TEST.txt` and reading `test.txt` returns ENOENT
- Deployment completes but game reports missing DLLs that Vortex claims are deployed

**Phase to address:** chattr+F implementation phase. The verification step is mandatory
before advertising the feature as active.

---

### Pitfall 7: Rebase CI opens duplicate PRs on every scheduled run if the branch already exists

**What goes wrong:**
If the rebase workflow runs on a schedule (e.g., daily) and an upstream-rebase PR is already
open from a previous run, a naive implementation will push a new branch or update the same
branch and attempt to create a second PR. The result is either:
- A GitHub API error `"A pull request already exists for..."` that surfaces as a workflow
  failure (non-zero exit), spamming the maintainer with CI failure notifications
- If error is swallowed, multiple open PRs for the same upstream rebase accumulate

The existing cherry-pick workflow in `.github/scripts/cherry-pick.sh` already handles this
correctly for cherry-picks (lines 62-66: `gh pr list --head "$BRANCH" ... | grep -q .`).
The rebase workflow must implement the same idempotency check.

**Why it happens:**
Developers implement the "create PR" step first and test it manually (once). The duplicate
case only manifests on the second scheduled run.

**How to avoid:**
1. Before pushing the rebase branch, check if a PR already exists with the same head and
   base using `gh pr list --head <branch> --base master --state open`. If one exists, only
   push an update to the branch (force-push if needed) but do NOT create a new PR.
2. Use a **fixed, predictable branch name** for the rebase PR: `upstream-rebase/main` or
   `upstream-rebase/$(date +%Y-%m)`. A fixed name makes the "PR exists?" check deterministic.
   Do not include a timestamp in the branch name — that creates a new branch (and a new PR)
   on every run.
3. If the upstream is already up to date (rebase is a no-op), delete the rebase branch (if
   it exists from a previous run) and close any open PR with a comment: "Upstream is now
   up to date with this fork — no rebase needed."

**Warning signs:**
- Multiple open PRs titled "Upstream rebase" or "Sync with nexus-mods/Vortex"
- Workflow fails every run after the first with "pull request already exists" error
- The branch name includes a timestamp or run ID component

**Phase to address:** Rebase CI implementation phase. The idempotency check must be in the
initial workflow, not a follow-up fix.

---

### Pitfall 8: "Already up to date" rebase exits 0 but must not create a PR — distinguishing no-op from real changes

**What goes wrong:**
`git rebase origin/master` exits 0 whether or not there were any changes to rebase. If the
fork's master is already up to date with the upstream, the rebase is a no-op. A workflow
that unconditionally pushes the rebase branch and creates a PR after a no-op rebase will:
- Push an empty branch (no new commits)
- Create a PR that, when viewed, shows 0 commits and no diff
- Generate a merge conflict with an empty PR

The maintainer must manually close these empty PRs, which generates noise and erodes trust
in the automation.

**Why it happens:**
`git rebase` exit code 0 does not distinguish "rebased N commits" from "nothing to rebase."
Developers test with a diverged fork where the rebase is always non-trivial.

**How to avoid:**
Before pushing the rebase branch, check whether any new commits were added:
```bash
UPSTREAM_HEAD=$(git rev-parse origin/upstream-master)
FORK_HEAD=$(git rev-parse HEAD)
if git merge-base --is-ancestor "$UPSTREAM_HEAD" "$FORK_HEAD"; then
  echo "Fork is already up to date with upstream. No PR needed."
  exit 0
fi
```
Or more directly: check the commit count between the upstream and the fork's master before
attempting the rebase at all. If `git log --oneline upstream/master..origin/master` returns
empty, skip the entire workflow.

**Warning signs:**
- PRs created with 0 commits and no diff
- Workflow creates a PR on every scheduled run even when no upstream changes occurred
- The rebase branch push results in an empty diff against master

**Phase to address:** Rebase CI implementation phase.

---

### Pitfall 9: Rebase conflicts in CI must create a draft PR — not fail the workflow with a non-zero exit code

**What goes wrong:**
`git rebase` exits non-zero when there are merge conflicts. If the workflow uses `set -e` or
the default GitHub Actions behavior (fail on non-zero step exit), the workflow job fails, no
PR is created, and the maintainer only gets a "CI failed" notification with no actionable
information about which files have conflicts.

The correct behavior (matching the cherry-pick workflow pattern in `.github/scripts/
cherry-pick.sh`) is to commit conflict markers, push the branch, and create a **draft PR**
with a warning body. The maintainer then gets a draft PR they can open and manually resolve.

**Why it happens:**
The natural instinct is to treat rebase failure as an error. But in an automated workflow,
conflict detection is expected and must be surfaced as a reviewable artifact, not a silent
failure.

**How to avoid:**
```bash
HAS_CONFLICTS=false
if ! git rebase upstream/master; then
  # Conflict: accept the partial state and commit markers
  git rebase --abort
  # Use merge instead for the conflict case
  git merge upstream/master || true
  git add -A
  git commit -m "upstream-rebase: unresolved conflicts require manual resolution"
  HAS_CONFLICTS=true
fi

# Push regardless
git push --force origin upstream-rebase/main

# Create PR as draft if conflicts, normal if clean
if [ "$HAS_CONFLICTS" = "true" ]; then
  gh pr create --draft --title "Upstream rebase (conflicts)" \
    --body "Conflicts detected. Manual resolution required."
else
  gh pr create --title "Upstream rebase" \
    --body "Automated rebase of upstream nexus-mods/Vortex onto fork master."
fi
```

**Warning signs:**
- Workflow job red (failed) but no PR created — conflicts are swallowed
- `git rebase` exit code 1 propagates to the Actions step and terminates the job
- The maintainer sees only "step failed: rebase upstream" without any PR to inspect

**Phase to address:** Rebase CI implementation phase. The conflict-to-draft-PR path must
be implemented from the start, not added after the first real conflict occurs.

---

### Pitfall 10: GITHUB_TOKEN cannot push to a fork's protected `master` branch — bot pushes are blocked by branch protection rules

**What goes wrong:**
If the fork's `master` branch has branch protection rules enabled (required PR reviews,
required status checks, or "Restrict who can push to matching branches"), `GITHUB_TOKEN`
from a workflow job CANNOT push directly to `master`. Attempting to do so fails with
`remote: error: GH006: Protected branch update failed`.

For the rebase workflow, the bot only needs to push to a **new** rebase branch (e.g.,
`upstream-rebase/main`), not to `master` directly. Pushing to a non-protected branch does
not require bypass permissions. Only the final merge of the rebase PR goes to `master`,
which happens via the normal PR merge mechanism (human-approved).

The confusion arises when developers test the workflow by trying to push to `master` to
verify it works, not realizing the workflow should only ever push to a side branch.

**Why it happens:**
Developers confuse "push the rebased code to master" with "push the rebased code to a
branch and open a PR." The correct workflow never touches `master` directly from CI.

**How to avoid:**
1. The rebase workflow must push to `upstream-rebase/main` (or a similar non-protected
   branch name) only. Never attempt to push to `master` from the workflow.
2. Ensure `contents: write` and `pull-requests: write` permissions are declared in the
   workflow YAML:
   ```yaml
   permissions:
     contents: write
     pull-requests: write
   ```
3. The `GITHUB_TOKEN` has `contents: write` permission to push to non-protected branches
   by default when granted in the workflow definition. No PAT is needed for this use case.
4. If branch protection is accidentally configured to require human review for ALL branches
   (including side branches), the workflow will fail. Check: branch protection rules should
   apply to `master` and `v*` only, not to `upstream-rebase/*`.

**Warning signs:**
- `remote: error: GH006: Protected branch update failed` in workflow output
- Workflow tries to push to `master` directly instead of a side branch
- `gh pr create` succeeds but the branch doesn't exist (push was blocked silently)

**Phase to address:** Rebase CI implementation phase. Verify permissions in the first
workflow run against a non-protected branch.

---

### Pitfall 11: Rebase workflow triggered by `push` to `master` creates a feedback loop

**What goes wrong:**
If the rebase workflow is triggered by `on: push: branches: [master]` and the workflow
then pushes a branch derived from `master`, subsequent merges of the rebase PR back into
`master` trigger the workflow again — creating a loop. Depending on the workflow logic,
this can result in:
- A new rebase PR opened immediately after the previous one is merged
- An "already up to date" no-op loop (if Pitfall 8's guard is in place, this is harmless
  but wasteful)
- A genuine loop if the rebase commits differ from what was merged (e.g., due to squash
  merging changing commit hashes)

**Why it happens:**
`on: push` to the main branch fires for every push including bot-merged PRs. The trigger
is too broad.

**How to avoid:**
1. Use `schedule` (e.g., `on: schedule: cron: '0 2 * * *'`) or `workflow_dispatch` as the
   primary trigger for the rebase workflow, not `push`. A daily schedule is sufficient for
   upstream sync; the maintainer can trigger manually when they know an upstream release
   just dropped.
2. If a `push` trigger is desired, use `workflow_run` chaining (trigger on completion of the
   `Main` workflow) combined with the "already up to date" guard (Pitfall 8). The guard
   ensures the workflow exits cleanly when there's nothing to do.
3. Add an `if` condition to the workflow job to skip runs triggered by the rebase bot itself:
   ```yaml
   if: github.actor != 'github-actions[bot]'
   ```
   This prevents self-triggered runs.

**Warning signs:**
- Multiple rebase PRs opened within minutes of each other
- Workflow run history shows back-to-back runs triggered by bot commits
- `github.actor` in the trigger event is `github-actions[bot]`

**Phase to address:** Rebase CI implementation phase. Use `schedule` as the primary trigger.

---

### Pitfall 12: Accumulating unmerged rebase PRs — the "stale rebase" problem

**What goes wrong:**
If the rebase PR is not merged before the next scheduled run, two scenarios arise:
1. **Fixed branch name**: The next run force-pushes the rebase branch and updates the existing
   PR. This is correct behavior — one PR, always current.
2. **Timestamped/rotating branch name**: A new branch and a new PR are created alongside the
   old one. Over time, N unmerged rebase PRs accumulate, all with different upstream snapshots.
   The maintainer must manually close stale PRs and figure out which one is current.

Additionally, if the maintainer is slow to merge (e.g., a major upstream release creates
conflicts that need careful resolution), the rebase PRs accumulate a backlog that becomes
increasingly hard to resolve because each new upstream commit adds more potential conflicts.

**Why it happens:**
The workflow treats each run as independent and doesn't check for or clean up prior runs.
Using timestamped branch names (common in "just make it work" initial implementations) is
the root cause.

**How to avoid:**
1. Always use a fixed branch name for rebase PRs. One branch, one PR, always updated in
   place. The `git push --force origin upstream-rebase/main` pattern from Pitfall 7 ensures
   this.
2. Add a workflow step to close stale rebase PRs before creating a new one:
   ```bash
   # Close any open rebase PRs that point to a different (old) branch
   gh pr list --label "upstream-rebase" --state open --json number,headRefName \
     | jq -r '.[] | select(.headRefName != "upstream-rebase/main") | .number' \
     | xargs -I{} gh pr close {} --comment "Superseded by new rebase PR"
   ```
3. Add a `upstream-rebase` label to all rebase PRs so they're easy to query and manage.

**Warning signs:**
- Multiple open PRs with "upstream rebase" in the title
- Branch names include dates: `upstream-rebase-2026-01-15`, `upstream-rebase-2026-02-01`
- Maintainer manually closes stale PRs after every rebase cycle

**Phase to address:** Rebase CI implementation phase. The fixed-branch + label pattern
must be established in the first workflow version.

---

### Pitfall 13: Windows CI build breaks because chattr+F code is not platform-guarded

**What goes wrong:**
The existing `fs.ts` correctly gates case-folding logic behind `process.platform === "linux"`
checks in `isWinePrefixPath()`. New chattr+F code that calls `child_process.exec('chattr +F
...')` or shells out to `lsattr` will throw `ENOENT` on Windows because `chattr` does not
exist on Windows. If the `process.platform` guard is missing or in the wrong place, the
Windows CI job (`runs-on: windows-latest` in `main.yml`) will fail.

The `main.yml` workflow explicitly runs build on both `ubuntu-latest` and `windows-latest`
with a matrix. Windows build failures block PRs.

**Why it happens:**
Developers add the `process.platform === 'linux'` guard at the top of a function but
forget that TypeScript module-level imports or side-effect-free require calls still execute
on Windows. If `chattr` invocation is at module scope rather than inside the platform guard,
Windows will fail on import.

**How to avoid:**
1. All chattr+F code must be inside `if (process.platform === 'linux')` blocks — no
   exceptions. This mirrors the existing pattern in `fs.ts` (`isWinePrefixPath` returns
   false on non-Linux and all case-folding code is gated on it).
2. The CI matrix at `main.yml` line 16 runs both OS builds in parallel. A Windows build
   failure blocks the PR. Run the PR CI (not just local testing) before considering the
   feature complete.
3. Add an explicit test in `fs.test.ts` that `trySetCasefold()` returns `false` on non-Linux
   platforms (mock `process.platform`).

**Warning signs:**
- Windows CI job fails with `ENOENT` or "command not found" for `chattr` or `lsattr`
- The PR build shows one green (Linux) and one red (Windows) job
- `process.platform` check added to the function body but the module-level import already
  ran on Windows

**Phase to address:** chattr+F implementation phase. The platform guard is a day-one
requirement per the project's cross-platform invariant.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Fire-and-forget `exec('chattr +F ...')` without checking exit code | Simple to write | Silent failure — casefold not active but code thinks it is | Never — always check exit code and verify with lsattr or runtime test |
| Apply chattr+F to staging root only (not per-mod dirs) | Single call point | Subdirectory inheritance breaks for pre-existing mod dirs (Pitfall 3) | Acceptable if documented — new dirs inherit, old dirs use shim |
| Timestamped rebase branch names | Avoids stale branch | Accumulate unmerged PRs, maintainer churn | Never for a scheduled workflow — always use fixed names |
| Trigger rebase workflow on `push` to `master` | React immediately to local changes | Feedback loop when rebase PR is merged back | Acceptable only if combined with `github.actor != 'github-actions[bot]'` guard AND "already up to date" early exit |
| Using PAT instead of GITHUB_TOKEN for rebase workflow | Can bypass branch protection | PAT scopes are too broad, expires and breaks workflow | Only if GITHUB_TOKEN insufficient — prefer GITHUB_TOKEN with explicit `permissions: contents: write` |
| Skipping the `verifyCasefoldActive` runtime test (Pitfall 6) | Faster startup | NFS/FUSE users silently get no casefold benefit but believe it's active | Never — the runtime test is the only reliable way to detect the NFS/FUSE silent-success case |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| `chattr +F` + ext4 without casefold | Assume EOPNOTSUPP means "Linux doesn't support it" | It means THIS filesystem wasn't formatted with casefold; treat as best-effort, fall back to shim |
| `chattr +F` + non-empty staging dir | Call chattr on existing dir, expect it to work | Only call on empty dir; skip for existing dirs and use shim |
| `chattr +F` + btrfs (SteamOS) | Test on ext4 dev machine only; ship to SteamOS users who get EOPNOTSUPP | Guard with filesystem type detection OR treat all non-zero exit as fallback-to-shim |
| `chattr +F` + NFS/FUSE | Trust chattr exit code 0 as confirmation | Verify with runtime test (create uppercase file, read lowercase) |
| Rebase workflow + protected master | Try to push rebased commits directly to master | Only push to a non-protected side branch; the PR merge goes to master manually |
| Rebase workflow + GITHUB_TOKEN | Omit `permissions` block and wonder why push fails | Always declare `contents: write` and `pull-requests: write` in the workflow YAML |
| Rebase PR + conflict markers | Let the workflow fail on `git rebase` exit 1 | Catch the conflict, commit markers, push, open draft PR with warning body |
| `chattr` binary + minimal container | No guard for binary absence; `ENOENT` crash | Check `which chattr` before invoking; skip gracefully if absent |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Calling `lsattr` on every file operation to check if casefold is active | Deployment lag; extra syscall per file | Cache `trySetCasefold()` result per staging directory path at session start | At first deployment with any significant mod count |
| Forking a child process (`exec('chattr +F ...')`) for every new mod subdirectory | Spawn overhead; mod install slowdown | Apply chattr+F only to staging root; subdir inheritance handles the rest | With 100+ mod installs in a session |
| Rebase workflow fetches entire upstream history on every run | Long workflow duration | Use `--depth=1` for the upstream remote fetch; only need the latest commit | When upstream repo has years of history |

---

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Shell-interpolating user-controlled staging path into `chattr +F "<path>"` | Path injection if staging path contains shell metacharacters (spaces, backticks) | Use `execFile('chattr', ['+F', dir])` (argument array) instead of `exec('chattr +F "' + dir + '"')` |
| Storing PAT for rebase workflow in workflow file or repo secrets visible to fork PRs | PAT exfiltration via `pull_request` trigger | Use `GITHUB_TOKEN` with explicit permissions; if PAT needed, use `pull_request_target` (not `pull_request`) and never print secrets in workflow output |
| Rebase workflow with `pull_request_target` trigger and untrusted code execution | Supply chain attack via upstream PR that modifies workflow files | Rebase workflow should use `schedule` or `workflow_dispatch` only; never trigger on `pull_request_target` |

---

## "Looks Done But Isn't" Checklist

- [ ] **chattr+F active:** `chattr +F` exit code 0 does not mean casefold is working — verify with
  the runtime uppercase/lowercase test (Pitfall 6). Missing: the runtime verification step.
- [ ] **chattr+F on new dirs only:** The staging root creation code path has the `mkdir → chattr+F →
  write-tag` sequence, but the migration path (existing dirs) silently skips — confirm with
  a test that existing staging dirs do NOT have chattr+F attempted on them.
- [ ] **Windows build green:** Platform guard exists in the function body but the PR's Windows CI
  job is the authoritative check. Verify both matrix jobs pass before merging.
- [ ] **Rebase PR idempotent:** Run the workflow twice in succession without merging the PR.
  Second run should push an update to the existing branch and NOT create a second PR.
- [ ] **Conflict path creates draft PR:** Artificially inject a conflict (add a conflicting commit
  to master before the rebase runs) and verify the workflow creates a draft PR with conflict
  body, not a failed CI job.
- [ ] **"Already up to date" is a no-op:** When the fork is already up to date with upstream,
  the workflow must exit 0 cleanly without creating a PR. Verify by running the workflow
  immediately after merging a rebase PR.
- [ ] **chattr+F binary absent:** Test in an environment without `e2fsprogs` (or mock the
  `which chattr` check) and confirm Vortex falls back to the shim without errors.

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| chattr+F called on non-casefold filesystem — feature silently inactive | LOW | Add EOPNOTSUPP guard + fallback activation; no data loss, shim was always there |
| chattr+F called on non-empty dir — returns error, staging dir unusable | LOW | Wrap in try/catch; log and fall back; staging dir still works case-sensitively via shim |
| Duplicate rebase PRs accumulate | LOW | `gh pr list --label upstream-rebase --state open | xargs gh pr close`; add fixed branch name to workflow |
| Rebase CI fails on conflict, no PR created | MEDIUM | Add conflict-to-draft-PR path; maintainer must manually rebase and push once to unblock |
| Windows CI broken by missing platform guard | MEDIUM | Add `process.platform === 'linux'` guard around all chattr/lsattr calls; re-run CI |
| Path injection via shell interpolation of staging dir | HIGH | Refactor to `execFile` with argument array; audit all child_process calls in the new code |
| Rebase workflow feedback loop (self-triggering) | LOW | Add `if: github.actor != 'github-actions[bot]'` condition; change trigger to `schedule` |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| chattr+F on non-casefold filesystem (EOPNOTSUPP) | chattr+F implementation | `trySetCasefold()` returns false gracefully on ext4 without casefold; shim activates |
| chattr+F on non-empty directory | chattr+F implementation | Test with pre-populated staging dir; chattr call skipped; shim active |
| chattr+F cascade behavior misunderstood | chattr+F implementation | New mod subdirs show `F` in lsattr; existing subdirs do not; both deploy correctly |
| btrfs/NFS/FUSE silent failure | chattr+F implementation | Runtime casefold verification test passes on ext4+casefold, fails and activates shim on btrfs |
| `chattr` binary absent in container | chattr+F implementation | `commandExists('chattr')` pre-check; graceful skip verified in test |
| Windows build broken by missing platform guard | chattr+F implementation | Both matrix jobs in main.yml pass green |
| Duplicate rebase PRs | Rebase CI implementation | Run workflow twice without merging — second run updates existing PR, not create new |
| "Already up to date" creates empty PR | Rebase CI implementation | Run workflow when fork is current — workflow exits 0, no PR created |
| Conflict not surfaced as draft PR | Rebase CI implementation | Inject conflict; verify draft PR with warning body created; workflow exits 0 |
| Branch protection blocks bot push | Rebase CI implementation | First workflow run pushes to `upstream-rebase/main` branch cleanly |
| Feedback loop from push trigger | Rebase CI implementation | Merge rebase PR; verify no new rebase workflow run is triggered by the merge commit |
| Stale rebase PR accumulation | Rebase CI implementation | Run workflow 3 times without merging; confirm exactly 1 open PR throughout |

---

## Sources

- Codebase audit (HIGH confidence):
  - `/home/alex/src/Vortex/src/renderer/src/util/fs.ts` — `isWinePrefixPath()`, `resolveCaseIfWinePrefix()`, `resolvePathCaseSync()`: existing case-folding shim pattern
  - `/home/alex/src/Vortex/src/renderer/src/extensions/mod_management/stagingDirectory.ts` — `ensureStagingDirectoryImpl()`: staging dir creation code path, `STAGING_DIR_TAG`, ordering of dir creation vs tag write
  - `/home/alex/src/Vortex/.github/workflows/main.yml` — Windows/Linux CI matrix; `runs-on: windows-latest` is active
  - `/home/alex/src/Vortex/.github/workflows/cherry-pick.yml` — existing cherry-pick workflow pattern for branch naming and PR idempotency check
  - `/home/alex/src/Vortex/.github/scripts/cherry-pick.sh` — `gh pr list --head ... | grep -q .` idempotency pattern; conflict-to-draft-PR pattern
  - `/home/alex/src/Vortex/.github/workflows/release-linux.yml` — existing Linux release workflow structure
- chattr man page (HIGH confidence, fetched 2026-04-15):
  - `chattr +F` requires empty directory
  - `F` attribute enables case-insensitive path lookups
  - Requires filesystem-level casefold feature enabled at mkfs time
  - No explicit root privilege requirement for `F` (unlike `i`, `a`, `j` attributes)
- Linux kernel casefold behavior (HIGH confidence):
  - Subdirectory inheritance: new subdirs under a casefold parent inherit the flag; existing subdirs do not
  - btrfs does not support chattr `F` — EOPNOTSUPP returned
  - NFS/FUSE may accept chattr `F` silently without activating the feature
- GitHub Actions permissions (MEDIUM confidence, fetched 2026-04-15):
  - `contents: write` required to push branches
  - `pull-requests: write` required to create PRs
  - GITHUB_TOKEN cannot bypass branch protection rules on protected branches
  - When any permission is explicitly set, all others default to `none`

---

*Pitfalls research for: Vortex Linux fork — chattr+F staging layer + GitHub Actions upstream rebase CI*
*Researched: 2026-04-15*
