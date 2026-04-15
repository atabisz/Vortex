#!/usr/bin/env bash
set -euo pipefail

# Required environment variables (injected from workflow YAML):
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
  echo "Fork master already includes ${UPSTREAM_TAG}, nothing to do."
  exit 0
fi

# Step 4: Create rebase branch
BRANCH="rebase/upstream-${UPSTREAM_TAG}"
git checkout -b "${BRANCH}" master

# Step 5: Attempt rebase — capture conflicts without failing job
HAS_CONFLICTS=false
CONFLICT_FILES=""
if ! git rebase "${UPSTREAM_TAG}"; then
  echo "Rebase conflicts detected."
  HAS_CONFLICTS=true
  # Capture conflicted files BEFORE git add -A (diff-filter=U lists Unmerged files)
  CONFLICT_FILES=$(git diff --name-only --diff-filter=U 2>/dev/null || echo "(see commit)")
  # DO NOT abort — working tree has conflict markers to commit
  git add -A
  git commit --no-edit -m "rebase onto ${UPSTREAM_TAG} (conflicts)" || true
fi

# Step 6: Force-push branch (force for idempotency on repeated runs)
git push --force origin "${BRANCH}"

# Step 7: Build PR body
FORK_BASE=$(git merge-base master "upstream/${UPSTREAM_TAG}" 2>/dev/null || echo "unknown")
COMMIT_COUNT=$(git rev-list --count "${FORK_BASE}..upstream/${UPSTREAM_TAG}" 2>/dev/null || echo "?")
COMMIT_LOG=$(git log --oneline "${FORK_BASE}..upstream/${UPSTREAM_TAG}" 2>/dev/null | head -20 || echo "(unavailable)")

if [[ "${HAS_CONFLICTS}" == "true" ]]; then
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

# Step 8: Idempotent PR creation — skip if PR already exists for this branch
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
