---
phase: 17-upstream-rebase-ci-workflow
reviewed: 2026-04-15T13:21:43Z
depth: standard
files_reviewed: 3
files_reviewed_list:
  - .github/scripts/rebase-upstream.sh
  - .github/workflows/rebase-upstream.yml
  - .github/workflows/main.yml
findings:
  critical: 4
  warning: 4
  info: 3
  total: 11
status: issues_found
---

# Phase 17: Code Review Report

**Reviewed:** 2026-04-15T13:21:43Z
**Depth:** standard
**Files Reviewed:** 3
**Status:** issues_found

## Summary

Three files reviewed: the rebase automation shell script and two GitHub Actions workflows. The most severe finding is a systemic issue with Action version tags across both workflow files — multiple actions reference versions that do not exist (`@v6`, `@v7`, `@v8`), which means **neither workflow can run at all** until these are corrected. The shell script is functionally sound for its purpose, but has two logic bugs: fork-local tags can corrupt the "up to date" check, and a multi-line PR body passed via `-F` flag to `gh api` is at risk of truncation or malformation. Several warnings concern silent error swallowing and a redundant flag combination.

---

## Critical Issues

### CR-01: `actions/checkout@v6` does not exist — workflow cannot run

**File:** `.github/workflows/rebase-upstream.yml:23`
**Issue:** `actions/checkout` is pinned to `@v6`, which does not exist. The latest release is `@v4`. GitHub Actions will fail to resolve this action at workflow startup, causing an immediate job failure before any steps execute. The same issue exists in `main.yml`.
**Fix:**
```yaml
- uses: actions/checkout@v4
  with:
    fetch-depth: 0
```

---

### CR-02: `actions/checkout@v6` in main.yml — both matrix legs fail

**File:** `.github/workflows/main.yml:23`
**Issue:** Same non-existent `@v6` version as CR-01. Both `ubuntu-latest` and `windows-latest` matrix legs will fail immediately. The CI is completely non-functional as written.
**Fix:**
```yaml
- uses: actions/checkout@v4
  with:
    submodules: "recursive"
```

---

### CR-03: `actions/setup-python@v6`, `upload-artifact@v7`, `download-artifact@v8` — non-existent versions

**File:** `.github/workflows/main.yml:31,110,127`
**Issue:** Three additional actions use version tags that do not exist:
- `actions/setup-python@v6` — latest is `@v5`
- `actions/upload-artifact@v7` — latest is `@v4`
- `actions/download-artifact@v8` — latest is `@v4`

Each of these will cause job step failures at runtime.
**Fix:**
```yaml
# Line 31
- uses: actions/setup-python@v5

# Line 110
- uses: actions/upload-artifact@v4

# Line 127
- uses: actions/download-artifact@v4
```

---

### CR-04: `actions/create-github-app-token@v3` — potentially non-existent version

**File:** `.github/workflows/main.yml:143`
**Issue:** `actions/create-github-app-token` is at `@v1` as of 2025. `@v3` does not exist. This step is in the `api` job which only runs on the upstream `Nexus-Mods/Vortex` repository (guarded by `if: github.repository == 'Nexus-Mods/Vortex'`), so it will not affect this fork's CI directly, but must be corrected before any upstream PR is submitted.
**Fix:**
```yaml
- uses: actions/create-github-app-token@v1
```

---

## Warnings

### WR-01: Fork-local tags corrupt the "latest upstream tag" resolution

**File:** `.github/scripts/rebase-upstream.sh:18-21`
**Issue:** After fetching upstream tags, the script runs `git tag --list 'v*'` which lists ALL local tags — both fork-local and upstream-fetched. If a fork-local tag matching `^v[0-9]+\.[0-9]+\.[0-9]+$` has a higher version than the latest upstream tag (e.g., a local `v9.9.9` created for testing), `sort -V | tail -1` will select the fork-local tag. The subsequent `git merge-base --is-ancestor` check on line 32 will then find `master` is an ancestor of that local tag, and the script will exit with "nothing to do" — silently skipping a real upstream update.
**Fix:** Scope the tag listing to the upstream remote only:
```bash
UPSTREAM_TAG=$(git tag --list 'v*' --sort=-version:refname \
  | grep -E '^v[0-9]+\.[0-9]+\.[0-9]+$' \
  | head -1)
# Or, more precisely, limit to refs fetched from upstream:
UPSTREAM_TAG=$(git ls-remote --tags upstream \
  | grep -oE 'v[0-9]+\.[0-9]+\.[0-9]+$' \
  | sort -V \
  | tail -1)
```

---

### WR-02: Multi-line PR body passed via `-F` flag risks truncation

**File:** `.github/scripts/rebase-upstream.sh:108-115`
**Issue:** The `PR_BODY` variable contains multi-line text with backticks, GitHub alert syntax (`> [!WARNING]`), and embedded newlines. Passing it via `-F "body=${PR_BODY}"` to `gh api` relies on the shell correctly preserving multi-line content through argument expansion, which is fragile. Some shells or `gh` versions may truncate at null bytes, misinterpret newlines, or fail to preserve the backtick-fenced content. The resulting PR body may be silently malformed.
**Fix:** Write the body to a temp file and pass it via `--input`:
```bash
BODY_FILE=$(mktemp)
printf '%s' "${PR_BODY}" > "${BODY_FILE}"
PR_URL=$(gh api "repos/${REPO}/pulls" \
  --method POST \
  --input "${BODY_FILE}" \
  --jq '.html_url')
rm -f "${BODY_FILE}"
```
Or use `gh pr create` (which handles body files natively) when not constrained to the REST API.

---

### WR-03: Silent swallow of `gh api` check failure can cause duplicate PR attempts

**File:** `.github/scripts/rebase-upstream.sh:100-105`
**Issue:** The `EXISTING_PR` lookup uses `|| true` to suppress errors. If the `gh api` call fails due to auth expiry, rate limiting, or network issues, `EXISTING_PR` is empty and the script proceeds to the PR creation block. The creation call will then also fail, but with a less clear error message. More importantly, if the check fails intermittently on a repeated run, the script may attempt to create a duplicate PR.
**Fix:** Remove the `|| true` and let the API failure propagate, or check the exit code explicitly:
```bash
EXISTING_PR=$(gh api "repos/${REPO}/pulls" \
  --method GET \
  -F "head=${REPO%%/*}:${BRANCH}" \
  -F "base=master" \
  -F "state=open" \
  --jq '.[0].number // empty') || {
  echo "Warning: failed to check existing PRs — proceeding to create"
}
```

---

### WR-04: `--no-edit` combined with `-m` is redundant and misleading

**File:** `.github/scripts/rebase-upstream.sh:51`
**Issue:** `git commit --no-edit -m "rebase onto ${UPSTREAM_TAG} (conflicts)"` combines `--no-edit` (suppress editor for amend/merge commits) with `-m` (provide message directly). The `-m` flag makes `--no-edit` redundant — the editor is never opened when `-m` is supplied. While this works correctly, it suggests the author may have intended `--no-edit` to mean something different (perhaps they wanted the rebase's auto-generated commit message, but then overrode it with `-m`). The intent should be clarified.
**Fix:** Remove `--no-edit` since `-m` already prevents editor invocation:
```bash
git commit -m "rebase onto ${UPSTREAM_TAG} (conflicts)" || true
```

---

## Info

### IN-01: `paths-ignore` pattern `"*.md"` only matches root-level markdown files

**File:** `.github/workflows/main.yml:9`
**Issue:** The `paths-ignore` glob `"*.md"` only excludes markdown files at the repository root. Markdown files in subdirectories (e.g., `src/README.md`, `packages/*/README.md`) are not excluded. The intent is likely to exclude all markdown documentation from triggering CI. The `.planning/**` entry already covers planning artifacts, but project markdown scattered in source directories is not covered.
**Fix:** Use the double-star glob to match at any depth:
```yaml
paths-ignore:
  - ".planning/**"
  - "packaging/**"
  - "**/*.md"
```

---

### IN-02: Hardcoded Electron version in rebuild step will drift from `package.json`

**File:** `.github/workflows/main.yml:74`
**Issue:** `npx @electron/rebuild -f -v 39.8.0` hardcodes the Electron version. When `electron` is bumped in `package.json`/`pnpm-workspace.yaml`, this line requires a separate manual update. A mismatch between the rebuild version and the installed Electron version silently uses the wrong ABI, producing native addons that may crash at runtime.
**Fix:** Derive the version from the installed package at CI time:
```yaml
- name: Rebuild native addons for Electron
  if: runner.os == 'Linux'
  run: |
    ELECTRON_VERSION=$(node -e "console.log(require('./node_modules/electron/package.json').version)")
    npx @electron/rebuild -f -v "$ELECTRON_VERSION"
```

---

### IN-03: `FORK_BASE="unknown"` fallback produces misleading PR body content

**File:** `.github/scripts/rebase-upstream.sh:60-62`
**Issue:** When `git merge-base master "upstream/${UPSTREAM_TAG}"` fails (e.g., no common history), `FORK_BASE` is set to `"unknown"`. The subsequent `COMMIT_COUNT` and `COMMIT_LOG` calls gracefully fall back to `"?"` and `"(unavailable)"`, but the commit range in `COMMIT_LOG` is computed as `unknown..upstream/${UPSTREAM_TAG}`, which git accepts but resolves unexpectedly (interpreting `unknown` as a ref name, which fails and triggers the `|| echo "(unavailable)"` fallback). The overall behavior is safe due to the fallbacks, but the logic is confusing and the `"unknown"` string could appear in the PR body in edge cases.
**Fix:** Detect the failure early and short-circuit the commit log generation:
```bash
FORK_BASE=$(git merge-base master "upstream/${UPSTREAM_TAG}" 2>/dev/null) || true
if [[ -z "${FORK_BASE}" ]]; then
  COMMIT_COUNT="?"
  COMMIT_LOG="(no common history found)"
else
  COMMIT_COUNT=$(git rev-list --count "${FORK_BASE}..upstream/${UPSTREAM_TAG}")
  COMMIT_LOG=$(git log --oneline "${FORK_BASE}..upstream/${UPSTREAM_TAG}" | head -20)
fi
```

---

_Reviewed: 2026-04-15T13:21:43Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
