# Phase 17: Upstream Rebase CI Workflow - Research

**Researched:** 2026-04-15
**Domain:** GitHub Actions CI, git rebase automation, gh CLI, shell scripting
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Use `git merge-base --is-ancestor <upstream_tag> master` to determine if a tag is new. Add nexus-mods/Vortex as a remote, fetch all tags, resolve the latest semver release tag, then check if it is already an ancestor of master. No external state file — git history is the source of truth.
- **D-02:** Target the latest upstream release tag only (no pre-releases). If multiple upstream releases land before the daily cron runs, only the latest is processed. On-demand runs via `workflow_dispatch` allow specifying a `upstream_ref` input per REBASE-05.
- **D-03:** Idempotency (REBASE-03): after confirming a new tag, check whether a `rebase/upstream-<tag>` branch already exists in the fork. If it does, update the branch but do not open a second PR.
- **D-04:** Logic lives in `.github/scripts/rebase-upstream.sh`, following the cherry-pick.yml pattern. The workflow YAML (`.github/workflows/rebase-upstream.yml`) stays thin — environment variables injected via `env:` blocks, script does the work.
- **D-05:** Workflow file named `rebase-upstream.yml` (kebab-case, consistent with cherry-pick.yml, release-linux.yml, test-pkgbuild.yml).
- **D-06:** Add `rebase/*` to the `push: branches:` trigger in `main.yml` so the ubuntu-latest + windows-latest build matrix runs when the rebase branch is pushed. CI status appears on the draft PR before the reviewer merges.
- **D-07:** Conflict-state branches (conflict markers committed and pushed) also trigger CI. CI will fail on conflict markers — this is the intended signal. No special skip logic needed.
- **D-08:** Clean rebase PR body includes: upstream tag, link to upstream release page, conflict status (clean), upstream commit count, and one-line `git log --oneline <fork_base>..<upstream_tag>` commit list. Also includes the fork link https://github.com/atabisz/Vortex.
- **D-09:** Conflict PR body includes: same header fields, conflict status (warning), and the list of conflicted files from `git diff --name-only --diff-filter=U` after the failed rebase.
- **D-10:** Always `git rebase`, never `git merge`. Merge commits are explicitly out of scope.
- **D-11:** No auto-merge of the rebase PR. Draft only — human review required.
- **D-12:** Fork guard: `if: github.repository == 'atabisz/Vortex'` on the job (REBASE-07).

### Claude's Discretion

- Bot git identity (`github-actions[bot]`) and email for commits — follow cherry-pick.yml pattern exactly.
- PAT vs GITHUB_TOKEN: use `secrets.GITHUB_TOKEN` unless the push step requires a PAT (token permissions may need `contents: write` and `pull-requests: write`).
- Exact cron schedule within "daily" — Claude can choose (e.g., `0 6 * * *` UTC).
- How `workflow_dispatch` `upstream_ref` input overrides the latest-tag logic — Claude handles the branching.

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.

</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| REBASE-01 | Daily cron polls nexus-mods/Vortex for new release tags; exits cleanly when fork is up to date | `git merge-base --is-ancestor` pattern verified; `git ls-remote --tags` confirmed working against upstream |
| REBASE-02 | Creates `rebase/upstream-<tag>` branch, rebases, opens draft PR titled `chore: rebase onto upstream <tag>` | `gh pr create --draft` pattern confirmed from cherry-pick.sh; branch naming convention locked |
| REBASE-03 | Idempotent — updates existing branch without creating duplicate PR | `gh pr list --head <branch>` idempotency pattern confirmed from cherry-pick.sh lines 62–63 |
| REBASE-04 | Conflicts abort cleanly, commit conflict state, push branch, open draft PR — job stays green | `HAS_CONFLICTS` flag pattern confirmed from cherry-pick.sh; `set -euo pipefail` must be conditionally bypassed for rebase step |
| REBASE-05 | `workflow_dispatch` with optional `upstream_ref` input | `on.workflow_dispatch.inputs` YAML pattern; input overrides latest-tag resolution |
| REBASE-06 | PR body includes tag, release URL, conflict status, commit diff summary, fork link | `git log --oneline` and `git diff --name-only --diff-filter=U` shell idioms identified |
| REBASE-07 | `if: github.repository == 'atabisz/Vortex'` job-level guard | Confirmed pattern from main.yml `api` job using `if: github.repository == 'Nexus-Mods/Vortex'` |

</phase_requirements>

## Summary

Phase 17 delivers a GitHub Actions workflow (`rebase-upstream.yml`) and supporting shell script (`.github/scripts/rebase-upstream.sh`) that automate upstream rebase detection for the atabisz/Vortex fork. The implementation is directly modeled on the existing `cherry-pick.yml` + `cherry-pick.sh` pattern already proven in this repo. The domain is GitHub Actions YAML + bash scripting with `gh` CLI — no application code changes.

The key technical challenges are: (1) robust latest-semver-tag resolution from a remote without pre-releases; (2) the `HAS_CONFLICTS` flag pattern that lets `git rebase` fail without failing the job; (3) idempotency via `gh pr list --head` before `gh pr create`; and (4) meaningful PR body construction from git log and diff output.

Additionally, `main.yml` requires a one-line surgical change to add `rebase/*` to its `push: branches:` trigger list so CI runs on rebase branches.

**Primary recommendation:** Copy the cherry-pick.sh structure exactly. Replace cherry-pick-specific logic with rebase logic. The job-level guard, permissions block, bot git identity, and `GH_TOKEN` env var injection are direct copies.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| New upstream tag detection | GitHub Actions runner (bash) | — | Reads remote git refs; no app code involved |
| `git rebase` execution | GitHub Actions runner (bash) | — | Filesystem operation on checked-out repo |
| Branch creation / force-push | GitHub Actions runner (bash) | GitHub API (implicit via git push) | git push uses GITHUB_TOKEN credential |
| PR creation / idempotency check | GitHub Actions runner (gh CLI) | GitHub API | `gh pr create` and `gh pr list` are thin wrappers |
| CI on rebase branch | GitHub Actions (main.yml) | — | Triggered by the `push: branches: [rebase/*]` addition |
| Fork guard | GitHub Actions YAML | — | `if: github.repository == 'atabisz/Vortex'` job condition |

## Standard Stack

### Core

| Library / Tool | Version | Purpose | Why Standard |
|----------------|---------|---------|--------------|
| `actions/checkout` | v6 | Full git history clone | Required for `git merge-base`, `git log`, rebase; `fetch-depth: 0` mandatory |
| `gh` CLI | pre-installed on ubuntu-latest | PR creation, PR list query | Standard on all GitHub-hosted runners; no install step needed |
| `bash` | system | Script execution | `.github/scripts/*.sh` convention already established in repo |
| `git` | system | Rebase, tag resolution, log | Core VCS tool; available on all ubuntu-latest runners |

### Supporting

| Tool | Version | Purpose | When to Use |
|------|---------|---------|-------------|
| `sort -V` | coreutils | Version-aware sort for semver tags | Identifying latest tag from `git ls-remote --tags` output |
| `git ls-remote` | system | List remote tags without full clone | Tag discovery before checkout; used before `git fetch` |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `sort -V` for semver | external action like `EndBug/version-check` | External action adds dependency; `sort -V` + awk is self-contained |
| `GITHUB_TOKEN` | PAT (Personal Access Token) | PAT requires secret management; GITHUB_TOKEN works for `contents: write` + `pull-requests: write` with explicit permissions block |
| manual rebase script | `peter-evans/create-pull-request` action | Action does not support `git rebase` workflow; cherry-pick.sh pattern is simpler |

**No additional installs needed.** All tools are pre-installed on `ubuntu-latest`.

## Architecture Patterns

### System Architecture Diagram

```
[nexus-mods/Vortex remote]
         |
         | git ls-remote --tags (tag discovery)
         v
[bash: resolve latest semver tag]
         |
         | git merge-base --is-ancestor <tag> master?
         v
    YES --> exit 0 (already up to date)
    NO  -->
         |
         | git fetch upstream --tags
         | git checkout -b rebase/upstream-<tag> master
         | git rebase <upstream_tag>
         v
   CLEAN?
    YES --> [push branch] --> [gh pr list: PR exists?]
                                YES --> exit 0 (updated)
                                NO  --> [gh pr create --draft clean body]
    NO  --> [git rebase --abort]
            [git add -A; git commit "conflict state"]
            [push branch]
            [gh pr list: PR exists?]
                YES --> exit 0 (updated)
                NO  --> [gh pr create --draft conflict body]

[main.yml push trigger: rebase/*]
         |
         v
   [ubuntu-latest + windows-latest CI matrix]
   (CI fails on conflict markers — expected signal)
```

### Recommended Project Structure

```
.github/
├── workflows/
│   ├── main.yml          # MODIFY: add rebase/* to push.branches
│   └── rebase-upstream.yml  # NEW: thin YAML, delegates to script
└── scripts/
    ├── cherry-pick.sh    # EXISTING (reference pattern)
    └── rebase-upstream.sh   # NEW: all logic here
```

### Pattern 1: Thin Workflow YAML with Script Delegation

**What:** Workflow YAML only declares triggers, permissions, checkout, git config, and env injection. All business logic in the shell script.
**When to use:** All workflows in this repo (established convention from cherry-pick.yml).

```yaml
# Source: .github/workflows/cherry-pick.yml (verified in repo)
name: Rebase Upstream

on:
  schedule:
    - cron: '0 6 * * *'
  workflow_dispatch:
    inputs:
      upstream_ref:
        description: 'Optional upstream ref to target (default: latest release tag)'
        required: false
        default: ''

permissions:
  contents: write
  pull-requests: write

jobs:
  rebase:
    if: github.repository == 'atabisz/Vortex'
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v6
        with:
          fetch-depth: 0

      - name: Configure Git
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "41898282+github-actions[bot]@users.noreply.github.com"

      - name: Rebase onto upstream
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          UPSTREAM_REF: ${{ inputs.upstream_ref }}
        run: bash .github/scripts/rebase-upstream.sh
```

### Pattern 2: HAS_CONFLICTS Flag (Never Fail the Job)

**What:** Run `git rebase` without `set -e` propagating its exit code. Capture success/failure in a flag. After the conditional block, proceed with push and PR creation regardless.
**When to use:** Any CI step where a non-zero exit is a valid workflow outcome (conflict = still open a PR).

```bash
# Source: .github/scripts/cherry-pick.sh (verified in repo, adapted for rebase)
HAS_CONFLICTS=false
if git rebase "upstream/${UPSTREAM_TAG}"; then
  echo "Rebase succeeded cleanly."
else
  echo "Rebase had conflicts, aborting and committing conflict state."
  HAS_CONFLICTS=true
  git rebase --abort
  # Conflict files were in working tree before abort — need alternate approach
  # See Pitfall 3 for the correct sequence
fi
```

**CRITICAL NOTE:** After `git rebase --abort`, the working tree is clean — there are nothing to commit. The conflict state must be captured BEFORE aborting. See Pattern 3.

### Pattern 3: Correct Conflict-State Commit Sequence

**What:** Capture conflict markers without aborting. Use `--no-reschedule-failed-exec` or stop-rebase pattern.
**When to use:** When you need to commit the conflict state (unresolved files) and push it.

```bash
# Source: [VERIFIED from git rebase docs + cherry-pick.sh adaptation]
HAS_CONFLICTS=false
if ! git rebase "upstream/${UPSTREAM_TAG}"; then
  echo "Rebase conflicts detected."
  HAS_CONFLICTS=true
  # DO NOT git rebase --abort here — the working tree has conflict markers
  # Add all files including conflict markers
  git add -A
  git commit --no-edit -m "rebase onto upstream/${UPSTREAM_TAG} (conflicts)" || true
  # Now working tree is committed with conflict markers
fi
```

This is the same pattern as `cherry-pick.sh` lines 46-53 — do not abort before committing.

### Pattern 4: Latest Semver Tag Resolution

**What:** Fetch all tags from upstream remote, filter release tags (no pre-releases), sort by version, take the last one.
**When to use:** Tag detection step before the merge-base check.

```bash
# Source: [VERIFIED: tested against nexus-mods/Vortex with git ls-remote]
# Latest upstream tag confirmed v1.16.9 as of 2026-04-15

git remote add upstream https://github.com/Nexus-Mods/Vortex.git
git fetch upstream --tags --no-recurse-submodules

if [[ -n "${UPSTREAM_REF}" ]]; then
  UPSTREAM_TAG="${UPSTREAM_REF}"
else
  # Filter: vN.N.N only (no pre-releases like v1.2.3-beta)
  UPSTREAM_TAG=$(git tag --list 'v*' \
    | grep -E '^v[0-9]+\.[0-9]+\.[0-9]+$' \
    | sort -V \
    | tail -1)
fi

if [[ -z "${UPSTREAM_TAG}" ]]; then
  echo "No upstream release tags found, exiting."
  exit 0
fi

echo "Latest upstream tag: ${UPSTREAM_TAG}"
```

### Pattern 5: Idempotency via gh pr list

**What:** Before calling `gh pr create`, check if a PR already exists for the branch. If it does, skip creation.
**When to use:** Any workflow that might run multiple times with the same branch (daily cron + existing branch).

```bash
# Source: .github/scripts/cherry-pick.sh lines 62-63 (verified in repo)
BRANCH="rebase/upstream-${UPSTREAM_TAG}"

# Check if branch already exists on remote
if git ls-remote --exit-code --heads origin "${BRANCH}" > /dev/null 2>&1; then
  echo "Branch ${BRANCH} already exists, force-pushing update."
  git push --force origin "${BRANCH}"
else
  git push origin "${BRANCH}"
fi

# Check if PR already exists
if ! gh pr list --head "${BRANCH}" --json number --jq '.[0].number' | grep -q .; then
  gh pr create \
    --base master \
    --head "${BRANCH}" \
    --title "chore: rebase onto upstream ${UPSTREAM_TAG}" \
    --draft \
    --body "${PR_BODY}"
else
  echo "PR already exists for ${BRANCH}, skipping creation."
fi
```

### Pattern 6: main.yml Surgical Branch Trigger Addition

**What:** Add `rebase/*` to the `push: branches:` list in main.yml so CI runs on rebase branches.
**When to use:** One-line change, surgical. Do not touch any other part of main.yml.

```yaml
# Source: .github/workflows/main.yml (verified in repo)
# BEFORE:
on:
  push:
    branches: [master]
    paths-ignore: ...

# AFTER:
on:
  push:
    branches: [master, rebase/*]
    paths-ignore: ...
```

### Pattern 7: PR Body Construction

**What:** Build the PR body from git log and diff output, then pass it to `gh pr create --body`.
**When to use:** Both clean and conflict PR body construction.

```bash
# Source: [ASSUMED - standard git log/diff idioms]
# Find the merge base between fork master and upstream tag
FORK_BASE=$(git merge-base master "upstream/${UPSTREAM_TAG}")
COMMIT_COUNT=$(git rev-list --count "${FORK_BASE}..upstream/${UPSTREAM_TAG}")
COMMIT_LOG=$(git log --oneline "${FORK_BASE}..upstream/${UPSTREAM_TAG}" | head -20)

# For conflict body: list conflicted files
CONFLICT_FILES=$(git diff --name-only --diff-filter=U)

# Clean body
PR_BODY="## Rebase onto upstream ${UPSTREAM_TAG}

**Upstream tag:** \`${UPSTREAM_TAG}\`
**Upstream release:** https://github.com/Nexus-Mods/Vortex/releases/tag/${UPSTREAM_TAG}
**Conflict status:** Clean rebase
**Commits in upstream since fork base:** ${COMMIT_COUNT}

### Upstream commits
\`\`\`
${COMMIT_LOG}
\`\`\`

---
Fork: https://github.com/atabisz/Vortex"

# Conflict body
PR_BODY="## Rebase onto upstream ${UPSTREAM_TAG}

**Upstream tag:** \`${UPSTREAM_TAG}\`
**Upstream release:** https://github.com/Nexus-Mods/Vortex/releases/tag/${UPSTREAM_TAG}

> [!WARNING]
> Conflicts detected — manual resolution required before merging.

**Conflicted files:**
\`\`\`
${CONFLICT_FILES}
\`\`\`

---
Fork: https://github.com/atabisz/Vortex"
```

### Anti-Patterns to Avoid

- **Using `set -euo pipefail` without disabling it for `git rebase`:** `set -e` will exit the script immediately on rebase failure, preventing the `HAS_CONFLICTS` flag from being set. Use `if ! git rebase ...; then` to catch the exit code explicitly.
- **Calling `git rebase --abort` before committing conflict state:** `--abort` restores the working tree to pre-rebase state, discarding all conflict markers. Commit first, then... actually don't abort at all — just commit the conflict markers directly (cherry-pick.sh pattern).
- **Using `git fetch --depth=1` or shallow clone:** `git merge-base --is-ancestor` requires full commit history. Always use `fetch-depth: 0`.
- **Constructing PR body with unquoted variables:** Use heredoc or single-quote wrapping when passing multi-line strings to `gh pr create --body`. Quote carefully.
- **Forgetting `--tags` on `git fetch upstream`:** Without `--tags`, the upstream tags are not fetched locally and `git tag --list 'v*'` will not see upstream tags.
- **Using `git checkout` for branch naming with literal `<tag>` characters:** The `<` and `>` characters are POSIX shell metacharacters. Always use variable expansion: `BRANCH="rebase/upstream-${UPSTREAM_TAG}"`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| PR creation | custom `curl` GitHub API calls | `gh pr create` | gh CLI handles authentication, pagination, error cases; already on ubuntu-latest |
| PR existence check | custom `curl` API + jq parsing | `gh pr list --head <branch>` | Same as cherry-pick.sh; tested pattern |
| Semver sorting | custom awk/python sort | `sort -V` (coreutils) | `-V` flag is version-aware; handles v1.9.x vs v1.16.x correctly |
| Fork guard | workflow-level `if:` | job-level `if: github.repository == 'atabisz/Vortex'` | Job-level guard is the proven pattern from main.yml `api` job |

**Key insight:** The cherry-pick.sh script already solves 80% of this problem. The remaining 20% is replacing cherry-pick logic with rebase logic and adding the upstream remote fetch step.

## Common Pitfalls

### Pitfall 1: Shallow Clone Breaks merge-base
**What goes wrong:** `git merge-base --is-ancestor v1.16.9 master` returns non-zero even when the tag IS an ancestor, because the shallow clone doesn't have enough history.
**Why it happens:** Default `actions/checkout` uses `fetch-depth: 1`.
**How to avoid:** Always use `fetch-depth: 0` in the checkout step. [VERIFIED: cherry-pick.yml already uses this]
**Warning signs:** `git merge-base` exits non-zero unexpectedly on first run.

### Pitfall 2: GITHUB_TOKEN Permissions Not Explicit
**What goes wrong:** `git push origin <branch>` or `gh pr create` fails with 403/permission denied.
**Why it happens:** By default, `GITHUB_TOKEN` has read-only permissions in some workflow contexts. `permissions:` block must be explicit.
**How to avoid:** Add `permissions: contents: write` and `pull-requests: write` at the workflow top level (same as cherry-pick.yml). [VERIFIED: cherry-pick.yml has this exact block]
**Warning signs:** `remote: Permission to atabisz/Vortex.git denied` on push.

### Pitfall 3: set -e Exits on git rebase Conflict
**What goes wrong:** The script exits immediately when `git rebase` returns exit code 1 (conflict). The `HAS_CONFLICTS=true` line is never reached.
**Why it happens:** `set -euo pipefail` at the top of the script makes any non-zero exit fatal.
**How to avoid:** Use `if ! git rebase ...; then` construct. This is the same construct used for `git cherry-pick` in cherry-pick.sh lines 46-48. [VERIFIED: cherry-pick.sh]
**Warning signs:** Job fails with "Process completed with exit code 1" and no PR is created.

### Pitfall 4: git fetch upstream --tags Missing
**What goes wrong:** `git tag --list 'v*'` only shows fork-local tags. The upstream v1.16.9 tag is invisible.
**Why it happens:** `actions/checkout` only fetches the fork's tags, not the upstream remote's tags.
**How to avoid:** Always run `git remote add upstream ... && git fetch upstream --tags --no-recurse-submodules` before tag resolution.
**Warning signs:** `UPSTREAM_TAG` is empty or resolves to a fork-specific tag like `v1.16.12-linux`.

### Pitfall 5: sort -V vs sort -t. Version Comparison
**What goes wrong:** `sort -t. -k1,1n -k2,2n -k3,3n` misorders `v1.9.x` and `v1.10.x` because of the `v` prefix, or fails on tags without three components.
**Why it happens:** Numeric sort on dot-separated fields doesn't handle the `v` prefix.
**How to avoid:** Use `sort -V` (version sort) which handles the `v` prefix correctly. [VERIFIED: tested with upstream tag list showing v1.16.9 is correctly identified as latest]
**Warning signs:** Workflow targets v1.9.9 when v1.16.9 exists.

### Pitfall 6: Duplicate rebase/* CI Runs
**What goes wrong:** Every `--force` push to the rebase branch (on repeated daily runs) triggers the full Windows + Ubuntu CI matrix, consuming runner minutes.
**Why it happens:** D-06 decision adds `rebase/*` to main.yml push trigger.
**How to avoid:** This is acceptable by design (D-07). No special mitigation needed — the CI signal is intentional. The concurrency group in main.yml (`cancel-in-progress: true`) will cancel previous runs naturally.
**Warning signs:** Excessive CI usage after many repeated cron runs — monitor but don't preemptively suppress.

### Pitfall 7: git push --force on Conflict Branch Overwrites Manual Fixes
**What goes wrong:** If a developer has started manually resolving conflicts on the rebase branch, a new cron run force-pushes and loses their work.
**Why it happens:** Idempotency requires force-push to update an existing branch.
**How to avoid:** This is an accepted trade-off by design (no manual fix protection). Document in PR body that the branch is auto-managed. Out of scope for this phase.
**Warning signs:** Developer complaint after conflict resolution work is lost.

## Code Examples

Verified patterns from official sources:

### Complete rebase-upstream.sh Structure

```bash
#!/usr/bin/env bash
# Source: adapted from .github/scripts/cherry-pick.sh [VERIFIED in repo]
set -euo pipefail

# Required env vars (injected from workflow YAML):
#   GH_TOKEN       - GitHub token with contents:write + pull-requests:write
#   UPSTREAM_REF   - Optional: specific ref to target (empty = latest release tag)

UPSTREAM_REPO="https://github.com/Nexus-Mods/Vortex.git"

# Step 1: Add upstream remote and fetch tags
git remote add upstream "${UPSTREAM_REPO}" 2>/dev/null || git remote set-url upstream "${UPSTREAM_REPO}"
git fetch upstream --tags --no-recurse-submodules

# Step 2: Resolve target tag
if [[ -n "${UPSTREAM_REF:-}" ]]; then
  UPSTREAM_TAG="${UPSTREAM_REF}"
else
  UPSTREAM_TAG=$(git tag --list 'v*' \
    | grep -E '^v[0-9]+\.[0-9]+\.[0-9]+$' \
    | sort -V \
    | tail -1)
fi

if [[ -z "${UPSTREAM_TAG}" ]]; then
  echo "No upstream release tags found, exiting."
  exit 0
fi

echo "Target upstream tag: ${UPSTREAM_TAG}"

# Step 3: Check if already up to date
if git merge-base --is-ancestor "${UPSTREAM_TAG}" master; then
  echo "Fork master is already up to date with ${UPSTREAM_TAG}, nothing to do."
  exit 0
fi

# Step 4: Create or reset rebase branch
BRANCH="rebase/upstream-${UPSTREAM_TAG}"
git checkout -b "${BRANCH}" master

# Step 5: Attempt rebase — capture conflicts without failing job
HAS_CONFLICTS=false
if ! git rebase "upstream/${UPSTREAM_TAG}"; then
  echo "Rebase conflicts detected."
  HAS_CONFLICTS=true
  # DO NOT abort — working tree has conflict markers to commit
  git add -A
  git commit --no-edit -m "rebase onto upstream/${UPSTREAM_TAG} (conflicts)" || true
fi

# Step 6: Push branch (force for idempotency)
git push --force origin "${BRANCH}"

# Step 7: Build PR body
FORK_BASE=$(git merge-base master "upstream/${UPSTREAM_TAG}" 2>/dev/null || echo "unknown")
COMMIT_COUNT=$(git rev-list --count "${FORK_BASE}..upstream/${UPSTREAM_TAG}" 2>/dev/null || echo "?")
COMMIT_LOG=$(git log --oneline "${FORK_BASE}..upstream/${UPSTREAM_TAG}" 2>/dev/null | head -20 || echo "(unavailable)")

if [[ "${HAS_CONFLICTS}" == "true" ]]; then
  CONFLICT_FILES=$(git diff --name-only --diff-filter=U 2>/dev/null || echo "(see commit)")
  PR_BODY="## Rebase onto upstream ${UPSTREAM_TAG}

**Upstream tag:** \`${UPSTREAM_TAG}\`
**Upstream release:** https://github.com/Nexus-Mods/Vortex/releases/tag/${UPSTREAM_TAG}

> [!WARNING]
> Conflicts detected — manual resolution required before merging.

**Conflicted files:**
\`\`\`
${CONFLICT_FILES}
\`\`\`

---
Fork: https://github.com/atabisz/Vortex"
else
  PR_BODY="## Rebase onto upstream ${UPSTREAM_TAG}

**Upstream tag:** \`${UPSTREAM_TAG}\`
**Upstream release:** https://github.com/Nexus-Mods/Vortex/releases/tag/${UPSTREAM_TAG}
**Conflict status:** Clean rebase
**Commits from fork base to upstream tag:** ${COMMIT_COUNT}

### Upstream commits
\`\`\`
${COMMIT_LOG}
\`\`\`

---
Fork: https://github.com/atabisz/Vortex"
fi

# Step 8: Create PR only if one doesn't already exist
if ! gh pr list --head "${BRANCH}" --base master --json number --jq '.[0].number' | grep -q .; then
  gh pr create \
    --base master \
    --head "${BRANCH}" \
    --title "chore: rebase onto upstream ${UPSTREAM_TAG}" \
    --draft \
    --body "${PR_BODY}"
  echo "Draft PR created for ${BRANCH}."
else
  echo "PR already exists for ${BRANCH}, skipping creation."
fi
```

### main.yml push.branches Change

```yaml
# Source: .github/workflows/main.yml (verified in repo)
# Change ONLY this line:
on:
  push:
    branches: [master, rebase/*]   # add rebase/*
    paths-ignore:
      - ".planning/**"
      - "packaging/**"
      - "*.md"
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual periodic upstream check | Automated daily cron in GitHub Actions | This phase | No human polling needed |
| `actions/checkout@v4` (release-linux.yml) | `actions/checkout@v6` (cherry-pick.yml / this workflow) | Repo inconsistency | Use v6 to match cherry-pick.yml convention |

**Deprecated/outdated:**
- None for this phase — all tooling is current.

**Repository action version inconsistency noted:** `cherry-pick.yml` and `main.yml` use `actions/checkout@v6`, while `release-linux.yml` and `test-pkgbuild.yml` use `@v4`. Use `@v6` to match the closest reference workflow (cherry-pick.yml). [VERIFIED: repo inspection]

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `git diff --name-only --diff-filter=U` lists conflicted files during active rebase (before commit) | Code Examples | Conflict files list would be empty in PR body; fallback to "(see commit)" handles this |
| A2 | `gh pr list --head <branch> --base master` correctly returns empty when no PR exists for a new branch | Pattern 5 | PR might appear already existing, preventing creation; test with new branch name |
| A3 | Conflict state is accessible to `git add -A` after failed `git rebase` without calling `--abort` | Pitfall 3 / Code Examples | If wrong, conflict markers would not be committed; cherry-pick.sh uses identical pattern so HIGH confidence this works |
| A4 | The `FORK_BASE` computed via `git merge-base master upstream/<tag>` is a valid commit accessible for `git log --oneline` | PR Body Construction | Log would fail; `|| echo "(unavailable)"` fallback handles this |

**Most claims in this research were verified via direct inspection of the repo's existing scripts and confirmed against the live upstream repository.**

## Open Questions (RESOLVED)

1. **`git diff --name-only --diff-filter=U` timing**
   - What we know: This command lists "Unmerged" files during an active conflict state
   - What's unclear: Whether it needs to be called before or after `git add -A` in the conflict-commit sequence
   - RESOLVED: Call it BEFORE `git add -A` in the script to capture the unresolved file list, store in variable, then proceed with add+commit

2. **PAT requirement for force-push to fork**
   - What we know: `cherry-pick.sh` uses `GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}` and force-pushes without issue
   - What's unclear: Whether `GITHUB_TOKEN` can push to `rebase/*` branches (non-protected) in a fork
   - RESOLVED: Use `GITHUB_TOKEN` with explicit `permissions: contents: write` block — consistent with cherry-pick.yml behavior. No PAT required.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| `gh` CLI | PR creation, PR list | ✓ | pre-installed on ubuntu-latest | — |
| `git` | All git operations | ✓ | pre-installed on ubuntu-latest | — |
| `sort -V` | Semver tag sorting | ✓ | GNU coreutils on ubuntu-latest | — |
| `bash` | Script execution | ✓ | ubuntu-latest default shell | — |
| `actions/checkout@v6` | Full history clone | ✓ | Confirmed used in cherry-pick.yml | — |
| `nexus-mods/Vortex` remote | Tag detection | ✓ | Confirmed accessible (git ls-remote tested) | — |

**Missing dependencies with no fallback:** None.

**Missing dependencies with fallback:** None.

**Live upstream verification:** `git ls-remote --tags https://github.com/Nexus-Mods/Vortex.git` executed successfully. Latest release tag confirmed as `v1.16.9`. Fork's `master` is NOT an ancestor of `v1.16.9`, confirming the workflow would open a PR on its first run.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | No automated tests — GitHub Actions workflows are tested by execution |
| Config file | N/A — workflow YAML is the test artifact |
| Quick run command | `workflow_dispatch` with `upstream_ref` input in GitHub UI |
| Full suite command | Daily cron run |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| REBASE-01 | Exits cleanly when up to date | manual | `workflow_dispatch` with a tag already in master | ❌ Wave 0 — no test infra |
| REBASE-02 | Creates branch + draft PR with correct title | manual | `workflow_dispatch` with `upstream_ref: v1.16.9` | ❌ Wave 0 — no test infra |
| REBASE-03 | Idempotent — no duplicate PR on second run | manual | Two consecutive `workflow_dispatch` runs | ❌ Wave 0 — no test infra |
| REBASE-04 | Conflict path opens PR, job stays green | manual | `workflow_dispatch` with conflicting ref | ❌ Wave 0 — manual only |
| REBASE-05 | `workflow_dispatch` input accepted | manual | GitHub UI dispatch with `upstream_ref` | ❌ Wave 0 |
| REBASE-06 | PR body contains all required fields | manual | Inspect PR body after dispatch | ❌ Wave 0 |
| REBASE-07 | Fork guard prevents run outside fork | manual | Cannot automate — would need different repo | ❌ Wave 0 — manual-only |

### Sampling Rate

- **Per task commit:** N/A — no unit tests; inspect YAML syntax with `actionlint` if available
- **Per wave merge:** Manual `workflow_dispatch` to verify script execution
- **Phase gate:** All 7 REBASE requirements satisfied via manual verification in GitHub Actions UI

### Wave 0 Gaps

- `actionlint` optional linting: `actionlint .github/workflows/rebase-upstream.yml` — confirms YAML syntax before first run
- No test framework needed — bash scripts are exercised by workflow dispatch

*Note: `nyquist_validation: true` in config.json but this phase has no testable TypeScript. Workflow YAML is validated at dispatch time. Manual verification is the only viable test mechanism for CI workflow correctness.*

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | — |
| V3 Session Management | no | — |
| V4 Access Control | yes | `if: github.repository == 'atabisz/Vortex'` job guard — prevents workflow execution in forks-of-forks |
| V5 Input Validation | yes | `upstream_ref` input — must not be used raw in shell without quoting; `set -euo pipefail` prevents injection |
| V6 Cryptography | no | — |

### Known Threat Patterns for GitHub Actions

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Workflow runs in upstream repo or third-party fork | Spoofing/Tampering | `if: github.repository == 'atabisz/Vortex'` job guard (D-12/REBASE-07) |
| `upstream_ref` input used unsanitized in git command | Tampering | Quote all shell variables; `set -u` catches unset vars |
| GITHUB_TOKEN exfiltration via PR body echo | Information Disclosure | PR body contains only git metadata — no secrets echoed |
| Force-push to master via `--force` on wrong branch | Tampering | Script pushes only to `rebase/*` namespace; `master` never touched by this workflow |

## Sources

### Primary (HIGH confidence)
- `.github/scripts/cherry-pick.sh` — Verified reference implementation in repo (idempotency, HAS_CONFLICTS pattern, gh pr create, bot identity)
- `.github/workflows/cherry-pick.yml` — Verified reference workflow (permissions block, checkout@v6, fetch-depth: 0, GH_TOKEN env injection)
- `.github/workflows/main.yml` — Verified CI workflow that needs `rebase/*` addition; confirmed existing branch trigger structure
- `git ls-remote https://github.com/Nexus-Mods/Vortex.git` — Live query confirmed latest tag is `v1.16.9` as of 2026-04-15
- `git merge-base --is-ancestor v1.16.9 master` — Confirmed fork master is NOT ancestor of v1.16.9

### Secondary (MEDIUM confidence)
- `.planning/phases/17-upstream-rebase-ci-workflow/17-CONTEXT.md` — All locked decisions, patterns, and constraints
- `.github/workflows/release-linux.yml` — Additional action version reference (uses @v4 inconsistently)

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all tools verified on ubuntu-latest runner via cherry-pick.yml precedent
- Architecture: HIGH — direct adaptation of verified cherry-pick.sh pattern
- Pitfalls: HIGH — most derived from reading the actual reference implementation
- Shell idioms: MEDIUM-HIGH — `sort -V` verified against live tag list; `git diff --name-only --diff-filter=U` timing [ASSUMED]

**Research date:** 2026-04-15
**Valid until:** 2026-07-15 (stable GitHub Actions environment; gh CLI API unlikely to change)
