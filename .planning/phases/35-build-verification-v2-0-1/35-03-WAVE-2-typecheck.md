---
phase: 35
wave: 2
plan_id: 35-03
title: "Wave 2 — typecheck full sweep (SYNC-35a closure)"
branch: v8.1/config-bucket
requirement_ids:
    - SYNC-35a
dependencies:
    - 35-02 # Wave 1 delete must have landed and renderer-bucket = 0
estimated_commits: 0
---

# Wave 2 — `pnpm run typecheck` full-sweep proof

## Goal

Close SYNC-35a end-to-end: prove `pnpm run typecheck` (root, fans out via `pnpm nx run-many -t typecheck`) exits 0 across all workspaces, AND each of the six per-bucket tsc invocations stays at 0 errors after Wave 1's delete. Verification-only — no commits.

References: see `35-CONTEXT.md` D-35-02 (renderer must be 0 at done-gate, no scope filter); `35-RESEARCH.md` §4 Wave 2 surface; Phase 34 D-34-14 per-bucket idiom.

## Tasks

1. **Aggregate root-level typecheck.**
    - `pnpm run typecheck` exit 0. This is the canonical SYNC-35a contract per REQUIREMENTS.md.

2. **Per-bucket typecheck — all six buckets, all zero errors.**
    - Same idiom as Phase 34 L3 surface. Filtered count (`grep -v TS1185 | wc -l`) must be 0 for every bucket.
    - The renderer bucket is the headline change: 9 → 0 after Wave 1.

3. **Capture typecheck evidence into the in-progress `35-VERIFY-RESULTS.md` artifact.**
    - This artifact accumulates across Waves 2–5 and is finalized in Wave 7. Wave 2 contributes the `## Typecheck (SYNC-35a)` section.
    - File path: `.planning/phases/35-build-verification-v2-0-1/35-VERIFY-RESULTS.md`. Gitignored — written but not committed in this wave (Wave 7 closeout uses `git add -f`).

## Verification commands

```bash
# Task 1 — root-level pnpm typecheck (the SYNC-35a contract verbatim)
pnpm run typecheck
echo "typecheck exit=$?"
# Expected: exit 0

# Task 2 — per-bucket validation (carries Phase 34 L3 idiom)
for cfg in \
  src/shared/tsconfig.json \
  src/preload/tsconfig.json \
  src/main/tsconfig.json \
  src/renderer/tsconfig.json \
  .github/actions/fingerprints/tsconfig.json \
  packages/e2e/tsconfig.json
do
  count=$(pnpm tsc -p "$cfg" --noEmit 2>&1 | grep -v TS1185 | wc -l)
  echo "$cfg: $count"
done
# Expected (all six): 0
```

## Artifact emission

Append the following block to `.planning/phases/35-build-verification-v2-0-1/35-VERIFY-RESULTS.md` (create file if missing):

```markdown
## Typecheck (SYNC-35a)

**Date:** <utc-iso>
**HEAD:** <short-sha>
**Status:** <PASS|FAIL>

| Surface                                      | Errors (filtered) |
| -------------------------------------------- | ----------------- |
| `src/shared/tsconfig.json`                   | 0                 |
| `src/preload/tsconfig.json`                  | 0                 |
| `src/main/tsconfig.json`                     | 0                 |
| `src/renderer/tsconfig.json`                 | 0                 |
| `.github/actions/fingerprints/tsconfig.json` | 0                 |
| `packages/e2e/tsconfig.json`                 | 0                 |
| **Aggregate `pnpm run typecheck` exit**      | 0                 |

Δ vs Phase 34 baseline: renderer-bucket 9 → 0 (closed by Wave 1 D-35-01 branch A delete commit `<sha>`); five other buckets unchanged at 0.
```

## Commits

**Zero commits in Wave 2.** Verification-only. Artifact under `.planning/` is gitignored; landed alongside STATE/ROADMAP in Wave 7.

## Risks / contingencies

- **Aggregate `pnpm run typecheck` non-zero but per-bucket all 0** — possible if `nx` orchestration surfaces a workspace that the six listed tsconfigs don't cover. Investigate which workspace nx-typecheck visited that the per-bucket loop missed; add it to the loop and re-verify both. Most likely culprits: `packages/paths`, `packages/paths-node`, `extensions/**` per-extension tsconfigs (those build via `pnpm build` not `tsc -p`). If aggregate fails because of an extension that wasn't in the renderer bucket, escalate as a Wave 2 finding (it would mean SYNC-35a needs a slightly broader surface than the six buckets Phase 34 codified).
- **Per-bucket non-zero on a bucket other than renderer** — that's pre-existing tech debt that Phase 34 should have caught; treat as an unexpected regression; investigate the diff vs Phase 34 baseline.
- **TS1185 filter behaviour** — `grep -v TS1185` strips the "tsconfig project references not allowed in --noEmit" notice noise that Phase 34 documented. Don't change the filter without re-baselining Phase 34.

## Done criteria

1. `pnpm run typecheck` exits 0 at the project root.
2. Every per-bucket count = 0 (six buckets).
3. `35-VERIFY-RESULTS.md` has its `## Typecheck (SYNC-35a)` section with full evidence.
4. SYNC-35a is satisfied; Wave 3 unblocked.
