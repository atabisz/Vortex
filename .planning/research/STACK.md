# Stack Research

**Domain:** Electron mod manager — chattr+F casefold staging + GitHub Actions upstream rebase
**Researched:** 2026-04-15
**Confidence:** HIGH for chattr+F approach and CI trigger pattern; MEDIUM for btrfs casefold status

---

## Scope

This document covers stack additions for the **chattr+F filesystem casefold** and **upstream rebase
CI** features. Previous milestone research (v1.0–v3.0) is summarized in the "Already Validated"
section; the bulk of this document covers only new additions.

---

## Already Validated — Do Not Re-Research

| Component | Status | Notes |
|-----------|--------|-------|
| Electron 39 on Linux | v1.0 | .deb + AppImage; 16 runtime .so deps |
| Wine prefix case-folding shim | v1.0 | `isWinePrefixPath()` + `resolveCaseIfWinePrefix()` wrapping fs calls in `src/main/src/filesystem/fs.ts` |
| pnpm workspace monorepo | All phases | pnpm 10, Node.js 22, TypeScript, Vitest |
| `pkexec` / `sudo` elevation | v3.0 | `child_process.spawn` approach; no new npm deps |
| gamebryo-savegame pnpm patch | v3.0 | `patches/gamebryo-savegame@2.1.2.patch` |
| CI: ubuntu-latest with native addon rebuilds | v2.0+ | main.yml + release-linux.yml both functional |

---

## Feature: chattr+F Kernel Casefold on ext4/btrfs

### Background

`chattr +F` sets the `FS_CASEFOLD_FL` inode flag on a directory. The kernel then performs
case-insensitive path lookups within that directory. For mod staging directories, this means a
mod file named `Data/Textures/Foo.dds` is found even when the game requests
`data/textures/foo.dds` — eliminating the need for the Wine prefix shim for those paths.

**Kernel requirement:** Linux 5.2+ for ext4 casefold (confirmed merged; see kernelnewbies.org/Linux_5.2).
**btrfs casefold:** Not confirmed in any released kernel version as of April 2026 — ext4 ONLY for now.
**Filesystem prerequisite:** The filesystem must be formatted with the `casefold` feature enabled
(e2fsprogs 1.45.6+: `mkfs.ext4 -O casefold`). The feature cannot be added to an existing
filesystem without reformatting.

### How chattr +F Works at the Kernel Level

`chattr +F` internally calls `ioctl(fd, FS_IOC_SETFLAGS, &flags)` with `FS_CASEFOLD_FL = 0x40000000`
set in the flags bitmask. The kernel (ext4 driver) validates: (a) the filesystem was mounted with
casefold support, (b) the directory is empty, (c) the kernel version is 5.2+. If any check fails,
`ioctl` returns `EOPNOTSUPP`.

### API Approach: Shell Out to `chattr`

**Recommended: `child_process.execFile('chattr', ['+F', dirPath])`**

Rationale:
- Zero new npm dependencies — uses Node.js built-in `child_process`
- `chattr` is part of `e2fsprogs`, installed on all major Linux distros (Ubuntu: `e2fsprogs` package)
- The `ioctl` npm package (v2.0.2, last published July 2019) uses NaN (not N-API) — requires
  native recompile per Node version and is unmaintained. Risk of breakage on Node 22 upgrade.
- `ffi-napi` (v4.0.3, last published March 2021) could call `ioctl` via FFI, but adds a native
  addon dependency to a feature that needs zero-dep shell-out as fallback anyway.
- Direct ioctl via N-API would require writing a new C++ addon — unjustified complexity when
  `chattr` is universally available.

**Integration pattern** (fits existing `src/main/src/filesystem/fs.ts` style):

```typescript
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

/**
 * Attempt to enable kernel case-folding on `dirPath` via chattr +F.
 * Returns true on success, false if the filesystem does not support it
 * or chattr is not available (caller falls back to Wine prefix shim).
 */
export async function tryEnableCasefold(dirPath: string): Promise<boolean> {
  if (process.platform !== 'linux') return false;
  try {
    await execFileAsync('chattr', ['+F', dirPath]);
    return true;
  } catch {
    // EOPNOTSUPP: filesystem not formatted with casefold feature
    // ENOENT: chattr not installed (e2fsprogs missing)
    // EINVAL: directory not empty, or kernel < 5.2
    return false;
  }
}
```

**Fallback:** When `tryEnableCasefold()` returns `false`, the existing Wine prefix shim
(`resolveCaseIfWinePrefix`) continues to handle case-insensitive resolution. No degradation.

### How to Detect Filesystem Type: `fs.statfs()` (Node.js Built-In)

**Recommended: `fs.promises.statfs(path)` — available since Node.js v18.17.0**

The `.type` field returns the Linux filesystem magic number matching `statfs(2)`'s `f_type`.

```typescript
import { statfs } from 'node:fs/promises';

const EXT4_SUPER_MAGIC  = 0xef53;
const BTRFS_SUPER_MAGIC = 0x9123683e;  // future-proofing; btrfs casefold not yet merged

export async function getStagingFsType(path: string): Promise<'ext4' | 'btrfs' | 'other'> {
  if (process.platform !== 'linux') return 'other';
  try {
    const stats = await statfs(path);
    if (stats.type === EXT4_SUPER_MAGIC) return 'ext4';
    if (stats.type === BTRFS_SUPER_MAGIC) return 'btrfs';
    return 'other';
  } catch {
    return 'other';
  }
}
```

**Why not `/proc/mounts`:** Parsing text files is fragile (bind mounts, overlays) and requires
mapping device paths to directory paths. `statfs()` is the POSIX-correct approach and works
directly on any path — no device lookup needed.

**Why not shell out to `findmnt` or `df`:** Extra process spawn, extra failure modes, text parsing.
`statfs()` is synchronous-capable and built into Node with proper typing.

**Node 22 compatibility:** Confirmed. `fs.statfs()` was added in v18.17.0; Node 22 (LTS) fully
supports it. No polyfill needed.

### System Prerequisites (runtime, not build-time)

| Prerequisite | Ubuntu pkg | Notes |
|-------------|-----------|-------|
| `chattr` binary | `e2fsprogs` | Pre-installed on all Ubuntu installations; no apt change needed |
| ext4 with casefold feature | (user's filesystem) | Must be present at format time; `mkfs.ext4 -O casefold`; NOT retroactively addable |
| Linux kernel 5.2+ | (user's kernel) | Ubuntu 20.04 LTS ships 5.4+; all current LTS distros qualify |

**No new npm packages needed for chattr+F.**

### What NOT to Use for chattr+F

| Approach | Why Rejected |
|----------|-------------|
| `ioctl` npm package (v2.0.2) | NaN-based (not N-API), last published July 2019, unmaintained; rebuild risk on Node 22 upgrades |
| `ffi-napi` (v4.0.3) | Adds native addon dep for something `execFile` handles in 5 lines; published 2021, unknown Node 22 status |
| Custom N-API ioctl addon | 200+ lines of C++ to replace a `chattr` one-liner; not justified |
| Parsing `/proc/mounts` | Fragile text parsing; use `statfs()` instead |
| `findmnt` / `df` shell-out | Extra process, text parsing, same data available from `statfs()` |

---

## Feature: GitHub Actions Upstream Rebase Automation

### Problem Statement

The `nexus-mods/Vortex` upstream repo releases new tags/versions periodically. This fork
(`atabisz/Vortex`) needs to rebase its `linux-port` branch on top of new upstream releases and
open a PR for human review before merging.

### Trigger Mechanism: `schedule` (cron polling)

**There is no GitHub Actions event that fires on a different repository's release.**

The `release` and `push` events in GitHub Actions only fire for activity in the *current* repo.
Cross-repo watching requires one of:
1. **`schedule` (cron)**: poll upstream periodically — the standard pattern
2. **`repository_dispatch`**: receive a webhook from upstream — requires upstream to cooperate (N/A here)
3. **`workflow_dispatch`**: manual trigger — good to add as a companion for on-demand runs

**Recommended trigger combination:**

```yaml
on:
  schedule:
    - cron: '0 6 * * *'   # daily at 06:00 UTC
  workflow_dispatch:        # allow manual trigger
```

Daily polling is sufficient. New upstream releases are rare (weekly/monthly). The 5-minute minimum
cron interval is irrelevant here — daily is the right cadence.

### Workflow Logic

The workflow needs to:
1. Fetch latest upstream release tag via GitHub REST API
2. Compare against last-known tag stored in the fork
3. If new: checkout `linux-port`, add upstream remote, `git rebase upstream/master`, push to new branch
4. Create a draft PR with the rebase branch → `master`

### Recommended Actions

| Action | Version | Purpose | Why |
|--------|---------|---------|-----|
| `actions/checkout@v6` | v6 | Checkout fork with full history | Already used in existing workflows; `fetch-depth: 0` for rebase |
| `actions/github-script@v9.0.0` | v9.0.0 | Query upstream release via Octokit | Pre-authenticated; avoids raw curl; current release April 2026 |
| `peter-evans/create-pull-request@v8.1.1` | v8.1.1 | Create the rebase PR | Actively maintained (537 forks, 114 releases); handles branch creation + PR |

**Note on marketplace rebase actions:**
Several marketplace actions exist (`imba-tjd/rebase-upstream@0.12`, `tjusl/fetch-upstream-action-rebase`)
but both are uncertified, minimally tested, and not maintained by established publishers.
The recommended approach builds the rebase workflow from primitives (git commands + github-script +
create-pull-request) to ensure full control over conflict handling and PR content.

### Tag Tracking Pattern

Store the last-seen upstream tag in a tracked file in the repo:

```
.planning/upstream-sync/last-known-tag.txt
```

The workflow reads this file, compares with `GET /repos/nexus-mods/Vortex/releases/latest`,
and skips if unchanged. On new tag: rebase, update the file, commit, push, create PR.

**Alternative:** Use a git tag in the fork repo (`upstream-synced/v1.x.x`). More visible but
adds noise to the tag list. The file approach is simpler.

### Skeleton Workflow

```yaml
name: Upstream Rebase Check

on:
  schedule:
    - cron: '0 6 * * *'
  workflow_dispatch:

jobs:
  check-upstream:
    runs-on: ubuntu-latest
    permissions:
      contents: write
      pull-requests: write

    steps:
      - uses: actions/checkout@v6
        with:
          fetch-depth: 0
          token: ${{ secrets.GITHUB_TOKEN }}

      - name: Get latest upstream release
        id: upstream
        uses: actions/github-script@v9.0.0
        with:
          script: |
            const { data } = await github.rest.repos.getLatestRelease({
              owner: 'nexus-mods',
              repo: 'Vortex',
            });
            core.setOutput('tag', data.tag_name);
            core.setOutput('published_at', data.published_at);

      - name: Check if tag is new
        id: check
        run: |
          LAST=$(cat .planning/upstream-sync/last-known-tag.txt 2>/dev/null || echo "none")
          NEW="${{ steps.upstream.outputs.tag }}"
          echo "last=$LAST" >> $GITHUB_OUTPUT
          echo "new=$NEW" >> $GITHUB_OUTPUT
          if [ "$LAST" = "$NEW" ]; then
            echo "changed=false" >> $GITHUB_OUTPUT
          else
            echo "changed=true" >> $GITHUB_OUTPUT
          fi

      - name: Rebase onto upstream
        if: steps.check.outputs.changed == 'true'
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git remote add upstream https://github.com/nexus-mods/Vortex.git
          git fetch upstream
          BRANCH="upstream-rebase/${{ steps.upstream.outputs.tag }}"
          git checkout -b "$BRANCH" origin/linux-port
          git rebase upstream/master || true   # conflicts → PR created for human resolution

      - name: Update last-known-tag file
        if: steps.check.outputs.changed == 'true'
        run: |
          mkdir -p .planning/upstream-sync
          echo "${{ steps.upstream.outputs.tag }}" > .planning/upstream-sync/last-known-tag.txt
          git add .planning/upstream-sync/last-known-tag.txt
          git commit -m "chore: track upstream ${{ steps.upstream.outputs.tag }}" || true

      - name: Create Pull Request
        if: steps.check.outputs.changed == 'true'
        uses: peter-evans/create-pull-request@v8.1.1
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          branch: upstream-rebase/${{ steps.upstream.outputs.tag }}
          base: master
          title: "chore: rebase linux-port onto upstream ${{ steps.upstream.outputs.tag }}"
          body: |
            Automated rebase of `linux-port` onto upstream `${{ steps.upstream.outputs.tag }}`.

            Upstream published: ${{ steps.upstream.outputs.published_at }}

            Review for merge conflicts and Linux-specific changes before merging.
          draft: true
          labels: upstream-sync
```

### Permissions Required

The workflow needs `contents: write` (push rebase branch) and `pull-requests: write` (create PR).
Both are grantable via `permissions:` in the workflow without a PAT, provided branch protection
on `master` allows bot pushes to feature branches.

If `GITHUB_TOKEN` lacks PR creation permission (org-level setting), a PAT stored as
`secrets.REBASE_PAT` with `repo` scope is the fallback.

### What NOT to Use for Rebase CI

| Approach | Why Rejected |
|----------|-------------|
| `imba-tjd/rebase-upstream@0.12` | Self-described as "not widely tested"; 0 issues/PRs open; uses `git push -f`; no control over conflict handling |
| `tjusl/fetch-upstream-action-rebase` | Uncertified third-party; no version pinning; unclear maintenance |
| `release` event trigger | Only fires on THIS repo's releases, not upstream |
| `repository_dispatch` | Requires upstream (nexus-mods/Vortex) to send a webhook — not under our control |
| Polling more frequently than daily | Upstream releases are infrequent; hourly polling wastes CI minutes |

---

## Core Technologies Summary

### New Stack Additions for chattr+F

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| `child_process.execFile` | Node 22 built-in | Shell out to `chattr +F` | Zero deps; universally available; graceful ENOENT fallback |
| `fs.promises.statfs` | Node 22 built-in (added v18.17.0) | Detect ext4/btrfs via magic number | POSIX-correct; no text parsing; returns `f_type` magic directly |
| `chattr` binary | e2fsprogs (system) | Set `FS_CASEFOLD_FL` on directory | Pre-installed on all Ubuntu/Fedora/Arch; part of base system |

### New Stack Additions for Rebase CI

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| `actions/github-script` | v9.0.0 | Query upstream releases via Octokit | Pre-authenticated; avoids raw curl; current April 2026 release |
| `peter-evans/create-pull-request` | v8.1.1 | Create rebase PR automatically | 2.7k stars, 537 forks, 114 releases; actively maintained; released April 2026 |
| `schedule` trigger (cron) | GitHub Actions built-in | Poll upstream daily | Only cross-repo trigger available; daily cadence is appropriate |

### No New npm Dependencies Required

Both features use only:
- Node.js built-in modules (`child_process`, `fs/promises`)
- System binaries already present on Linux (`chattr` from `e2fsprogs`)
- Existing GitHub Actions (checkout, github-script, create-pull-request)

---

## Installation

No `npm install` needed. Both features are zero-dependency additions.

For CI workflow: pin action versions as shown above. No new apt packages required.

For local development: `e2fsprogs` is pre-installed on Ubuntu; `chattr --version` should confirm
e2fsprogs 1.47.x on Ubuntu 24.04.

---

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Shell out `chattr +F` | `ioctl` npm package (v2.0.2) | Never — NaN-based, unmaintained, Node 22 risk |
| `fs.statfs()` built-in | Parse `/proc/mounts` | Never for type detection — `statfs` is always correct |
| `fs.statfs()` built-in | Shell out `findmnt` | Only if somehow running Node < 18.17 (not applicable; we pin Node 22) |
| `peter-evans/create-pull-request@v8` | Write custom PR creation script | Only if PR options needed beyond what the action supports |
| `schedule` daily cron | `workflow_dispatch` only | Add `workflow_dispatch` as a companion; don't replace `schedule` with it |

---

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| `fs.statfs()` | Node.js 18.17.0+ | Node 22 confirmed; no polyfill |
| `child_process.execFile` | Node.js 0.1.x+ | Built-in; no compat concern |
| `actions/github-script@v9.0.0` | GitHub Actions | Upgraded to `@actions/github` v9; April 2026 |
| `peter-evans/create-pull-request@v8.1.1` | GitHub Actions | Current as of April 2026 |
| `chattr +F` | e2fsprogs 1.45.6+ + kernel 5.2+ + ext4 with casefold feature | Ubuntu 24.04 ships e2fsprogs 1.47.x and kernel 6.x — satisfies all |

---

## Integration with Existing Code

### chattr+F integrates into `src/main/src/filesystem/`

The existing `fs.ts` (Linux filesystem backend) handles file operations. A new companion file
`casefold.linux.ts` is the right location for `tryEnableCasefold()` and `getStagingFsType()`.

The call site is the staging directory creation path — when Vortex creates a new staging directory
on Linux:
1. Call `getStagingFsType(parentPath)` → check for `'ext4'`
2. If ext4: call `tryEnableCasefold(newDir)` after `mkdir`
3. Log result; fall back silently if casefold is not supported

This is a purely additive change. The Wine prefix shim remains active as fallback for non-casefold
filesystems.

### Rebase CI workflow lives in `.github/workflows/upstream-rebase.yml`

This is a new workflow file — no changes to existing `main.yml`, `e2e.yml`, or release workflows.
The only shared concern: the new workflow needs `contents: write` permission, which existing
workflows do not grant. This is scoped to the new workflow only.

---

## Sources

- kernelnewbies.org/Linux_5.2 — confirmed ext4 casefold added in Linux 5.2 (HIGH confidence)
- man7.org/linux/man-pages/man1/chattr.1 — confirmed `+F` sets case-insensitive lookup (HIGH confidence)
- registry.npmjs.org/ioctl — `ioctl` package v2.0.2, published 2019, NaN-based (HIGH confidence)
- registry.npmjs.org/ffi-napi — `ffi-napi` v4.0.3, published March 2021 (HIGH confidence)
- nodejs.org docs `fs.statfs` — added v18.17.0, returns `.type` with filesystem magic (HIGH confidence)
- docs.github.com Actions events — confirmed `schedule`/`workflow_dispatch`/`repository_dispatch`; no cross-repo `release` trigger (HIGH confidence)
- github.com/peter-evans/create-pull-request — v8.1.1, April 2026, actively maintained (HIGH confidence)
- github.com/actions/github-script — v9.0.0, April 2026 (HIGH confidence)
- github.com/imba-tjd/rebase-upstream — v0.12, "not widely tested", 0 issues (MEDIUM confidence — verified via marketplace search but limited detail available)
- btrfs casefold: NOT confirmed in any released kernel version as of April 2026 (LOW confidence — no source found; ext4-only for now)

---

*Stack research for: Vortex Linux — v4.0 chattr+F casefold + upstream rebase CI*
*Researched: 2026-04-15*
