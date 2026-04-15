# Phase 17: Upstream Rebase CI Workflow - Context

**Gathered:** 2026-04-15
**Status:** Ready for planning

<domain>
## Phase Boundary

Deliver a GitHub Actions workflow that detects new nexus-mods/Vortex release tags once per day and automatically opens a draft rebase PR in the atabisz/Vortex fork. The workflow must be idempotent, handle conflicts gracefully (without failing the job), and include meaningful PR body content for human review.

</domain>

<decisions>
## Implementation Decisions

### Tag Detection Strategy
- **D-01:** Use `git merge-base --is-ancestor <upstream_tag> master` to determine if a tag is new. Add nexus-mods/Vortex as a remote, fetch all tags, resolve the latest semver release tag, then check if it is already an ancestor of master. No external state file — git history is the source of truth.
- **D-02:** Target the latest upstream release tag only (no pre-releases). If multiple upstream releases land before the daily cron runs, only the latest is processed. On-demand runs via `workflow_dispatch` allow specifying a `upstream_ref` input per REBASE-05.
- **D-03:** Idempotency (REBASE-03): after confirming a new tag, check whether a `rebase/upstream-<tag>` branch already exists in the fork. If it does, update the branch but do not open a second PR.

### Script Structure
- **D-04:** Logic lives in `.github/scripts/rebase-upstream.sh`, following the cherry-pick.yml pattern. The workflow YAML (`.github/workflows/rebase-upstream.yml`) stays thin — environment variables injected via `env:` blocks, script does the work.
- **D-05:** Workflow file named `rebase-upstream.yml` (kebab-case, consistent with cherry-pick.yml, release-linux.yml, test-pkgbuild.yml).

### CI on Rebase Branch
- **D-06:** Add `rebase/*` to the `push: branches:` trigger in `main.yml` so the ubuntu-latest + windows-latest build matrix runs when the rebase branch is pushed. CI status appears on the draft PR before the reviewer merges.
- **D-07:** Conflict-state branches (conflict markers committed and pushed) also trigger CI. CI will fail on conflict markers — this is the intended signal. No special skip logic needed.

### PR Body Content
- **D-08:** Clean rebase PR body includes: upstream tag, link to upstream release page, conflict status (clean), upstream commit count, and one-line `git log --oneline <fork_base>..<upstream_tag>` commit list. Also includes the fork link https://github.com/atabisz/Vortex (memory rule + REBASE-06).
- **D-09:** Conflict PR body includes: same header fields, conflict status (⚠️ Conflicts detected), and the list of conflicted files from `git diff --name-only --diff-filter=U` after the failed rebase.

### Locked Constraints (from REQUIREMENTS.md Out of Scope)
- **D-10:** Always `git rebase`, never `git merge`. Merge commits are explicitly out of scope.
- **D-11:** No auto-merge of the rebase PR. Draft only — human review required.
- **D-12:** Fork guard: `if: github.repository == 'atabisz/Vortex'` on the job (REBASE-07).

### Claude's Discretion
- Bot git identity (`github-actions[bot]`) and email for commits — follow cherry-pick.yml pattern exactly.
- PAT vs GITHUB_TOKEN: use `secrets.GITHUB_TOKEN` unless the push step requires a PAT (token permissions may need `contents: write` and `pull-requests: write`).
- Exact cron schedule within "daily" — Claude can choose (e.g., `0 6 * * *` UTC).
- How `workflow_dispatch` `upstream_ref` input overrides the latest-tag logic — Claude handles the branching.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Existing Workflow Patterns
- `.github/workflows/cherry-pick.yml` — Reference pattern for thin YAML + `.github/scripts/` shell delegation, bot git identity, `GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}`, `gh pr create` usage
- `.github/workflows/main.yml` — The CI workflow that needs `rebase/*` added to its push branch triggers

### Requirements
- `.planning/REQUIREMENTS.md` §"REBASE-01 through REBASE-07" — All 7 rebase requirements; also §"Out of Scope" for explicit prohibitions (no merge, no auto-merge, no push to master)

### Project Context
- `.planning/PROJECT.md` — Current milestone goal ("Automated upstream rebase CI") and fork link rule (https://github.com/atabisz/Vortex must appear in PR body)
- `.planning/ROADMAP.md` §"Phase 17" — Success criteria checklist (5 items)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `.github/workflows/cherry-pick.yml` — Template for the workflow structure: permissions block, bot git config step, `bash .github/scripts/<name>.sh` invocation, `GH_TOKEN` env var injection
- `.github/scripts/cherry-pick.sh` — Reference for how shell scripts are structured in this repo (env var consumption, `gh pr create` calls, error handling)

### Established Patterns
- All existing workflows use `actions/checkout@v6` with `fetch-depth: 0` when full git history is needed
- `GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}` is the auth pattern — no PAT required for cherry-pick, likely sufficient here too
- `git config user.name "github-actions[bot]"` / `user.email "41898282+github-actions[bot]@users.noreply.github.com"` is the bot identity pattern

### Integration Points
- `.github/workflows/main.yml` — `push: branches:` list needs `rebase/*` appended (surgical one-line change)
- New files: `.github/workflows/rebase-upstream.yml` + `.github/scripts/rebase-upstream.sh`

</code_context>

<specifics>
## Specific Ideas

- The `workflow_dispatch` trigger should include an optional `upstream_ref` input (string, default empty) so developers can test against a specific tag or commit ref without waiting for the daily cron.
- The rebase branch naming convention is `rebase/upstream-<tag>` (from REBASE-02).
- Draft PR title: `chore: rebase onto upstream <tag>` (from REBASE-02 / roadmap success criteria).
- When the merge-base check shows the tag is already in master history, the workflow exits cleanly with a log message and no PR action — this is the "already up to date" path from REBASE-01.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 17-upstream-rebase-ci-workflow*
*Context gathered: 2026-04-15*
