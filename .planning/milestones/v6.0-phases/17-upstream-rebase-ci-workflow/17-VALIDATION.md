---
phase: 17
slug: upstream-rebase-ci-workflow
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-15
---

# Phase 17 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | shellcheck + act (local GitHub Actions runner) / manual gh workflow run |
| **Config file** | `.github/workflows/rebase-upstream.yml` |
| **Quick run command** | `shellcheck .github/scripts/rebase-upstream.sh` |
| **Full suite command** | `shellcheck .github/scripts/rebase-upstream.sh && bash -n .github/scripts/rebase-upstream.sh` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `shellcheck .github/scripts/rebase-upstream.sh`
- **After every plan wave:** Run `shellcheck .github/scripts/rebase-upstream.sh && bash -n .github/scripts/rebase-upstream.sh`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 17-01-01 | 01 | 1 | REBASE-01 | — | N/A | static | `shellcheck .github/scripts/rebase-upstream.sh` | ❌ W0 | ⬜ pending |
| 17-01-02 | 01 | 1 | REBASE-02 | — | N/A | static | `shellcheck .github/scripts/rebase-upstream.sh` | ❌ W0 | ⬜ pending |
| 17-01-03 | 01 | 1 | REBASE-03 | — | N/A | static | `shellcheck .github/scripts/rebase-upstream.sh` | ❌ W0 | ⬜ pending |
| 17-01-04 | 01 | 1 | REBASE-04 | — | N/A | static | `shellcheck .github/scripts/rebase-upstream.sh` | ❌ W0 | ⬜ pending |
| 17-02-01 | 02 | 2 | REBASE-05 | — | N/A | static | `shellcheck .github/workflows/rebase-upstream.yml || true` | ❌ W0 | ⬜ pending |
| 17-02-02 | 02 | 2 | REBASE-06 | — | N/A | grep | `grep -q 'atabisz/Vortex' .github/scripts/rebase-upstream.sh` | ❌ W0 | ⬜ pending |
| 17-02-03 | 02 | 2 | REBASE-07 | — | N/A | grep | `grep -q "github.repository == 'atabisz/Vortex'" .github/workflows/rebase-upstream.yml` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `shellcheck` available on executor (install via `apt-get install shellcheck` or confirm present)

*Existing infrastructure does not cover CI workflow validation — shellcheck + grep-based checks are the primary automated verification path.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Daily cron exits cleanly when fork is up to date | REBASE-01 | Requires live GitHub Actions run against real upstream | Trigger `workflow_dispatch` after fork master is already up to date; confirm no PR created |
| Conflict state committed and draft PR opened with warning body | REBASE-04 | Requires simulated merge conflict in GitHub Actions environment | Force a conflict by diverging master and triggering workflow; inspect draft PR body |
| Second run does not create duplicate PR | REBASE-03 | Requires pre-existing rebase branch in remote | Run workflow twice with same upstream tag; confirm only one PR exists |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
