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

# Step 4: Create sync branch from master
BRANCH="sync/upstream-${UPSTREAM_TAG}"
git checkout -b "${BRANCH}" master

# Upstream has an 'api' submodule that our master deleted. Without this, git tries
# to checkout the upstream submodule entry and fails fatally ("does not have a commit
# checked out"). Using the 'ours' merge driver on that path keeps our deletion instead.
echo "api merge=ours" > .git/info/attributes
git config merge.ours.driver true

# Step 5: Attempt merge of upstream tag into the branch — capture conflicts without failing job
HAS_CONFLICTS=false
CONFLICT_FILES=""
if ! git merge "${UPSTREAM_TAG}" --no-edit -m "merge upstream ${UPSTREAM_TAG} into master"; then
  echo "Merge conflicts detected."
  HAS_CONFLICTS=true
  # Capture conflicted files before staging (excluding submodule paths)
  CONFLICT_FILES=$(git diff --name-only --diff-filter=U 2>/dev/null || echo "(see commit)")
  # Remove any submodule entries (mode 160000) from the index — including all
  # conflict stages (1/2/3). Uninitialized submodules cause "does not have a
  # commit checked out" fatal errors on git add. Field layout: mode obj stage\tpath
  git ls-files --stage | awk '$1 == "160000" {print $4}' | sort -u | while read -r sub; do
    git rm --cached --ignore-unmatch -f "$sub" 2>/dev/null || true
  done
  git add -u
  git commit --no-edit -m "merge upstream ${UPSTREAM_TAG} (conflicts)" || true
fi

# Step 6: Restore our fork's .github/workflows/ before pushing.
# GITHUB_TOKEN cannot push workflow file changes — and we don't want upstream's
# CI config overwriting ours anyway. Restoring from master keeps our workflows
# intact and keeps the push within the token's permissions.
git checkout master -- .github/workflows/ 2>/dev/null || true
if ! git diff --cached --quiet; then
  git commit --no-edit -m "restore fork workflows after upstream merge" || true
fi

# Force-push branch (force for idempotency on repeated runs)
git push --force origin "HEAD:refs/heads/${BRANCH}"

# Step 7: Build PR body
FORK_BASE=$(git merge-base master "upstream/${UPSTREAM_TAG}" 2>/dev/null || echo "unknown")
COMMIT_COUNT=$(git rev-list --count "${FORK_BASE}..upstream/${UPSTREAM_TAG}" 2>/dev/null || echo "?")
COMMIT_LOG=$(git log --oneline "${FORK_BASE}..upstream/${UPSTREAM_TAG}" 2>/dev/null | head -20 || echo "(unavailable)")

if [[ "${HAS_CONFLICTS}" == "true" ]]; then
  PR_BODY="## Sync upstream ${UPSTREAM_TAG} into master

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
  PR_BODY="## Sync upstream ${UPSTREAM_TAG} into master

**Upstream tag:** \`${UPSTREAM_TAG}\`
**Upstream release:** https://github.com/Nexus-Mods/Vortex/releases/tag/${UPSTREAM_TAG}
**Conflict status:** Clean merge
**Commits from fork base to upstream tag:** ${COMMIT_COUNT}

### Upstream commits
\`\`\`
${COMMIT_LOG}
\`\`\`

---
Fork: https://github.com/atabisz/Vortex"
fi

# Step 8: Idempotent PR creation via REST API (avoids GraphQL restrictions on fork repos)
# gh api uses REST when given a path, bypassing the GraphQL createPullRequest mutation.
REPO="${GITHUB_REPOSITORY:-atabisz/Vortex}"
EXISTING_PR=$(gh api "repos/${REPO}/pulls" \
  --method GET \
  -F "head=${REPO%%/*}:${BRANCH}" \
  -F "base=master" \
  -F "state=open" \
  --jq '.[0].number // empty' 2>/dev/null || true)

if [[ -z "${EXISTING_PR}" ]]; then
  PR_URL=$(gh api "repos/${REPO}/pulls" \
    --method POST \
    -F "title=chore: sync upstream ${UPSTREAM_TAG} into master" \
    -F "head=${BRANCH}" \
    -F "base=master" \
    -F "body=${PR_BODY}" \
    -F "draft=true" \
    --jq '.html_url')
  echo "Draft PR created: ${PR_URL}"
else
  echo "PR #${EXISTING_PR} already exists for ${BRANCH}, skipping creation."
fi
