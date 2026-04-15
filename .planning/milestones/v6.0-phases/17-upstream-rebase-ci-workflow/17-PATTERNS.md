# Phase 17: Upstream Rebase CI Workflow - Pattern Map

**Mapped:** 2026-04-15
**Files analyzed:** 3 new/modified files
**Analogs found:** 3 / 3

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `.github/workflows/rebase-upstream.yml` | config (CI workflow) | event-driven | `.github/workflows/cherry-pick.yml` | exact |
| `.github/scripts/rebase-upstream.sh` | utility (CI script) | event-driven | `.github/scripts/cherry-pick.sh` | exact |
| `.github/workflows/main.yml` | config (CI workflow) | event-driven | `.github/workflows/main.yml` (self) | exact — surgical one-line edit |

---

## Pattern Assignments

### `.github/workflows/rebase-upstream.yml` (config, event-driven)

**Analog:** `.github/workflows/cherry-pick.yml`

**Trigger + dispatch input pattern** (analog lines 1–6, adapted):
```yaml
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
```

**Permissions block** (analog lines 8–10 — copy verbatim):
```yaml
permissions:
  contents: write
  pull-requests: write
```

**Job-level fork guard** (from `main.yml` line 121, adapted for this fork):
```yaml
jobs:
  rebase:
    if: github.repository == 'atabisz/Vortex'
    runs-on: ubuntu-latest
```

**Checkout step** (analog line 18–20 — copy verbatim, `fetch-depth: 0` is mandatory):
```yaml
    steps:
      - uses: actions/checkout@v6
        with:
          fetch-depth: 0
```

**Bot git identity step** (analog lines 22–25 — copy verbatim):
```yaml
      - name: Configure Git
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
```

**Script invocation step with env injection** (analog lines 27–34, adapted):
```yaml
      - name: Rebase onto upstream
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          UPSTREAM_REF: ${{ inputs.upstream_ref }}
        run: bash .github/scripts/rebase-upstream.sh
```

**Full assembled workflow** — the new file should look exactly like cherry-pick.yml in shape (name, on, permissions, jobs.<job>.if, runs-on, steps: checkout, Configure Git, run-script) with only the trigger, job name, env vars, and script name changed.

---

### `.github/scripts/rebase-upstream.sh` (utility, event-driven)

**Analog:** `.github/scripts/cherry-pick.sh`

**Script header + set flags** (analog lines 1–3 — copy verbatim):
```bash
#!/usr/bin/env bash
set -euo pipefail
```

**Env var documentation block** (analog lines 4–12 pattern, adapted):
```bash
# Required environment variables:
#   GH_TOKEN       - GitHub token with contents:write + pull-requests:write
#   UPSTREAM_REF   - Optional: specific ref to target (empty = latest release tag)
```

**HAS_CONFLICTS flag + conflict-safe cherry-pick/rebase pattern** (analog lines 45–53 — this is the core structural pattern):
```bash
HAS_CONFLICTS=false
if git cherry-pick "${CHERRY_PICK_ARGS[@]}"; then
  echo "Cherry-pick succeeded cleanly."
else
  echo "Cherry-pick had conflicts, committing with conflict markers."
  HAS_CONFLICTS=true
  git add -A
  git commit --no-edit -m "cherry-pick of #${PR_NUMBER} (conflicts)" || true
fi
```
**Adapt for rebase:** replace `git cherry-pick` with `git rebase "upstream/${UPSTREAM_TAG}"` and update the commit message. Do NOT call `git rebase --abort` — the analog never calls `git cherry-pick --abort` either. Commit conflict markers in place.

**Idempotency check + `gh pr create` pattern** (analog lines 62–83 — copy structure verbatim):
```bash
if ! gh pr list --head "$BRANCH" --base "$TARGET" --json number --jq '.[0].number' | grep -q .; then
  DRAFT_FLAG=""
  BODY="..."

  if [ "$HAS_CONFLICTS" = "true" ]; then
    DRAFT_FLAG="--draft"
    BODY="${BODY}
> [!WARNING]
> This cherry-pick had merge conflicts that need manual resolution."
  fi

  gh pr create \
    --base "$TARGET" \
    --head "$BRANCH" \
    --title "$PR_TITLE" \
    $DRAFT_FLAG \
    --body "$BODY"
else
  echo "PR already exists for $BRANCH -> $TARGET, skipping creation."
fi
```
**Adapt for rebase:** the rebase workflow always creates a `--draft` PR (clean AND conflict), so `DRAFT_FLAG` is always `--draft`. The body structure differs per clean vs conflict state (see Shared Patterns below). Base is always `master`.

**Force-push pattern** (analog line 60 — copy verbatim):
```bash
git push --force origin "$BRANCH"
```

**Additional logic needed (no direct analog — use RESEARCH.md patterns):**

1. **Upstream remote setup + tag fetch** — no analog in cherry-pick.sh (it receives a SHA via env var). Use RESEARCH.md Pattern 4:
```bash
UPSTREAM_REPO="https://github.com/Nexus-Mods/Vortex.git"
git remote add upstream "${UPSTREAM_REPO}" 2>/dev/null || git remote set-url upstream "${UPSTREAM_REPO}"
git fetch upstream --tags --no-recurse-submodules
```

2. **Latest semver tag resolution** — no analog. Use RESEARCH.md Pattern 4:
```bash
if [[ -n "${UPSTREAM_REF:-}" ]]; then
  UPSTREAM_TAG="${UPSTREAM_REF}"
else
  UPSTREAM_TAG=$(git tag --list 'v*' \
    | grep -E '^v[0-9]+\.[0-9]+\.[0-9]+$' \
    | sort -V \
    | tail -1)
fi
```

3. **Already-up-to-date check** — no analog. Use RESEARCH.md Pattern (merge-base):
```bash
if git merge-base --is-ancestor "${UPSTREAM_TAG}" master; then
  echo "Fork master is already up to date with ${UPSTREAM_TAG}, nothing to do."
  exit 0
fi
```

4. **Conflict file list capture (timing-critical)** — must happen BEFORE `git add -A`. Use RESEARCH.md open question answer:
```bash
# Capture BEFORE git add -A
CONFLICT_FILES=$(git diff --name-only --diff-filter=U 2>/dev/null || echo "(see commit)")
git add -A
git commit --no-edit -m "rebase onto upstream/${UPSTREAM_TAG} (conflicts)" || true
```

---

### `.github/workflows/main.yml` (config, event-driven — surgical edit)

**Analog:** itself (self-modification)

**Current state** (lines 5–6):
```yaml
on:
  push:
    branches: [master]
    paths-ignore:
```

**Target state** (add `rebase/*` to branches list — one-line change):
```yaml
on:
  push:
    branches: [master, rebase/*]
    paths-ignore:
```

This is the only change to `main.yml`. No other lines should be touched.

---

## Shared Patterns

### Bot Git Identity
**Source:** `.github/workflows/cherry-pick.yml` lines 22–25
**Apply to:** `rebase-upstream.yml` Configure Git step
```yaml
- name: Configure Git
  run: |
    git config user.name "github-actions[bot]"
    git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
```

### GH_TOKEN Env Injection
**Source:** `.github/workflows/cherry-pick.yml` line 29
**Apply to:** `rebase-upstream.yml` script invocation step
```yaml
env:
  GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```
No PAT needed — `GITHUB_TOKEN` with explicit `permissions: contents: write` + `pull-requests: write` is sufficient, matching cherry-pick.yml behavior.

### HAS_CONFLICTS Flag (Never-fail-job pattern)
**Source:** `.github/scripts/cherry-pick.sh` lines 45–53
**Apply to:** `rebase-upstream.sh` git rebase step
The pattern: wrap the potentially-failing git command in `if <command>; then ... else HAS_CONFLICTS=true; fi`. The job must not exit on rebase failure — the `else` branch commits conflict markers and continues. `set -euo pipefail` remains active at the script level because the `if` construct catches the non-zero exit without propagating it.

### Idempotent PR Creation Check
**Source:** `.github/scripts/cherry-pick.sh` lines 62–63
**Apply to:** `rebase-upstream.sh` PR creation step
```bash
if ! gh pr list --head "${BRANCH}" --base master --json number --jq '.[0].number' | grep -q .; then
  gh pr create ...
else
  echo "PR already exists for ${BRANCH}, skipping creation."
fi
```

### Force-Push for Idempotency
**Source:** `.github/scripts/cherry-pick.sh` line 60
**Apply to:** `rebase-upstream.sh` push step
```bash
git push --force origin "${BRANCH}"
```

### PR Body with WARNING Block
**Source:** `.github/scripts/cherry-pick.sh` lines 68–71
**Apply to:** `rebase-upstream.sh` conflict body construction
```bash
> [!WARNING]
> This cherry-pick had merge conflicts that need manual resolution.
```
Adapt the message text for rebase context.

### Full-Depth Checkout
**Source:** `.github/workflows/cherry-pick.yml` lines 18–20
**Apply to:** `rebase-upstream.yml` checkout step — mandatory for `git merge-base --is-ancestor`
```yaml
- uses: actions/checkout@v6
  with:
    fetch-depth: 0
```

### Fork Guard (Job-Level)
**Source:** `.github/workflows/main.yml` line 121 (`if: github.repository == 'Nexus-Mods/Vortex'`)
**Apply to:** `rebase-upstream.yml` `rebase` job — use fork-specific value
```yaml
jobs:
  rebase:
    if: github.repository == 'atabisz/Vortex'
```

---

## No Analog Found

No files in this phase lack a codebase analog. All three files have direct matches:

| File | Analog Quality | Notes |
|------|---------------|-------|
| `rebase-upstream.yml` | Exact — same thin-YAML structure | Trigger type differs (schedule vs pull_request_target) |
| `rebase-upstream.sh` | Exact — same HAS_CONFLICTS pattern, idempotency, gh CLI usage | Cherry-pick → rebase substitution required |
| `main.yml` (edit) | Exact — self | One-line insertion only |

---

## PR Body Construction (Reference)

This pattern has no analog in cherry-pick.sh (its body is a single-line string). Planner should reference RESEARCH.md Pattern 7 and the complete script example:

**Clean rebase body variables:**
```bash
FORK_BASE=$(git merge-base master "upstream/${UPSTREAM_TAG}" 2>/dev/null || echo "unknown")
COMMIT_COUNT=$(git rev-list --count "${FORK_BASE}..upstream/${UPSTREAM_TAG}" 2>/dev/null || echo "?")
COMMIT_LOG=$(git log --oneline "${FORK_BASE}..upstream/${UPSTREAM_TAG}" 2>/dev/null | head -20 || echo "(unavailable)")
```

**Conflict body requires** capturing `CONFLICT_FILES` BEFORE `git add -A` (see RESEARCH.md Open Question 1 answer — before is correct).

**Fork link** (required by project memory rule — must appear in every PR body):
```
Fork: https://github.com/atabisz/Vortex
```

---

## Metadata

**Analog search scope:** `.github/workflows/`, `.github/scripts/`
**Files scanned:** 6 workflow YAML files, 1 shell script
**Pattern extraction date:** 2026-04-15
