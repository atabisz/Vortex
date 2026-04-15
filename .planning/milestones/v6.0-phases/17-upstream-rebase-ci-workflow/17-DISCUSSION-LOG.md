# Phase 17: Upstream Rebase CI Workflow - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-15
**Phase:** 17-upstream-rebase-ci-workflow
**Areas discussed:** Tag detection strategy, Script structure, CI on rebase branch, Conflict PR body detail

---

## Tag Detection Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Compare HEAD to upstream tip | Add nexus-mods/Vortex as remote, fetch tags, use git merge-base to check if latest tag is already in master history | ✓ |
| Store last-seen tag in repo file | Commit a .github/upstream-tag file after each successful rebase PR | |
| Check existing PR branches | List rebase/upstream-<tag> branches to detect new tags | |

**User's choice:** Compare HEAD to upstream tip (recommended)
**Notes:** git itself is the source of truth; no external state storage needed

| Option | Description | Selected |
|--------|-------------|----------|
| Latest release tag only | Use latest semver tag from nexus-mods/Vortex; ignore pre-releases | ✓ |
| All new tags since last run | Queue all new tags if multiple releases land before daily cron | |
| Configurable via workflow_dispatch | Default latest, allow specific ref override | |

**User's choice:** Latest release tag only (recommended)

| Option | Description | Selected |
|--------|-------------|----------|
| git merge-base check | Check if upstream tag commit is ancestor of master; if yes skip, if no rebase | ✓ |
| Check if rebase branch exists | Combine merge-base with branch presence check | |

**User's choice:** git merge-base check (recommended)

---

## Script Structure

| Option | Description | Selected |
|--------|-------------|----------|
| .github/scripts/rebase-upstream.sh | Shell script following cherry-pick.yml pattern; thin YAML, logic in script | ✓ |
| Inline YAML shell steps | All logic in run: blocks directly in workflow YAML | |

**User's choice:** .github/scripts/rebase-upstream.sh (recommended)

| Option | Description | Selected |
|--------|-------------|----------|
| rebase-upstream.yml | Kebab-case, matches existing workflow naming | ✓ |
| upstream-sync.yml | More descriptive of intent | |
| sync-fork.yml | GitHub's fork sync terminology | |

**User's choice:** rebase-upstream.yml (recommended)

---

## CI on Rebase Branch

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — add rebase/* to main.yml push triggers | CI runs on rebase branches; status visible on draft PR | ✓ |
| No — exclude rebase/* from CI | Rebase branches skip CI entirely | |

**User's choice:** Yes — add rebase/* to main.yml push triggers (recommended)

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — same trigger, CI will fail and show it clearly | Conflict branches also trigger CI; compile failure on conflict markers is the signal | ✓ |
| No — skip CI for conflict branches | Add condition to skip CI for conflict branches | |

**User's choice:** Yes — same trigger, CI will fail and show it clearly

---

## Conflict PR Body Detail

| Option | Description | Selected |
|--------|-------------|----------|
| Conflict file list | Run git diff --name-only --diff-filter=U and embed conflicted file list in PR body | ✓ |
| Warning flag only | Just ⚠️ Conflicts detected; reviewer inspects locally | |
| Conflict count + file list | Count conflict markers plus file list | |

**User's choice:** Conflict file list (recommended)

| Option | Description | Selected |
|--------|-------------|----------|
| Commit count + one-line log | git log --oneline <fork_base>..<upstream_tag>; human-scannable commit list | ✓ |
| Commit count only | Just "N commits since last rebase" | |
| Full git log with stats | git log --stat; very detailed | |

**User's choice:** Commit count + one-line log (recommended)

---

## Claude's Discretion

- Bot git identity and email — follow cherry-pick.yml pattern
- PAT vs GITHUB_TOKEN — use GITHUB_TOKEN unless push step requires PAT
- Exact cron schedule — Claude chooses (e.g., 0 6 * * * UTC)
- workflow_dispatch upstream_ref input branching logic — Claude handles

## Deferred Ideas

None — discussion stayed within phase scope.
