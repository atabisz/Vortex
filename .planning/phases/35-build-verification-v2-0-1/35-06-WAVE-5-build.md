---
phase: 35
wave: 5
plan_id: 35-06
title: "Wave 5 — build (SYNC-35d)"
branch: v8.1/config-bucket
requirement_ids:
    - SYNC-35d
dependencies:
    - 35-05 # Wave 4 test must be green
estimated_commits: 0
---

# Wave 5 — `pnpm build` + `pnpm build:extensions` exit 0; bundledPlugins ≥ 130

## Goal

Close SYNC-35d: prove the build chain (renderer webpack + main rolldown + preload + shared + extensions) exits 0 on `v8.1/config-bucket` HEAD post-Wave-1-delete, and `src/main/build/bundledPlugins/` count holds the floor of 130. Current count = 132 (per RESEARCH §4 measurement); margin of 2. Native-dep webpack warnings (`vortexmt` etc.) are non-fatal — same disposition as v8.0 D-29-XX. Verification-only — no commits.

References: see `35-CONTEXT.md` D-35-07 / D-35-08 (build chain + bundledPlugins floor); `35-RESEARCH.md` §4 Wave 5 surface.

## Tasks

1. **Run `pnpm build` (full chain).**
    - Per package.json: `pnpm run typecheck && pnpm --filter "@vortex/*" --filter "@nexusmods/*" --filter "./packages/**" --filter "!@vortex/e2e" --filter "!vortex-api" -r run build`.
    - Capture full stdout/stderr to `.planning/phases/35-build-verification-v2-0-1/artifacts/v81-build.txt`.

2. **Run `pnpm build:extensions`.**
    - Per package.json: `pnpm run api && pnpm --filter "./extensions/**" run build`.
    - Capture to `.planning/phases/35-build-verification-v2-0-1/artifacts/v81-build-extensions.txt`.

3. **Count `build: Done` markers.**
    - v8.0 P29 baseline = 133 markers. Document the v2.0.1 count for drift-tracking.

4. **Confirm bundledPlugins floor.**
    - `ls src/main/build/bundledPlugins/ | wc -l` ≥ 130. Current = 132. Document drift if any.

5. **Document non-fatal native-dep webpack warnings.**
    - `vortexmt` and similar emit non-fatal warnings during renderer webpack. Same disposition as v8.0 D-29-XX. Document for audit clarity, do not chase.

6. **Append `## Build (SYNC-35d)` section to `35-VERIFY-RESULTS.md`.**

## Verification commands

```bash
# Task 1 — pnpm build (full chain)
mkdir -p .planning/phases/35-build-verification-v2-0-1/artifacts
pnpm build 2>&1 | tee .planning/phases/35-build-verification-v2-0-1/artifacts/v81-build.txt
echo "build exit=$?" >> .planning/phases/35-build-verification-v2-0-1/artifacts/v81-build.txt
# Expected: exit 0

# Task 2 — pnpm build:extensions
pnpm build:extensions 2>&1 | tee .planning/phases/35-build-verification-v2-0-1/artifacts/v81-build-extensions.txt
echo "build:extensions exit=$?" >> .planning/phases/35-build-verification-v2-0-1/artifacts/v81-build-extensions.txt
# Expected: exit 0

# Task 3 — build: Done marker count
markers=$(grep -c 'build: Done' \
  .planning/phases/35-build-verification-v2-0-1/artifacts/v81-build.txt \
  .planning/phases/35-build-verification-v2-0-1/artifacts/v81-build-extensions.txt \
  | awk -F: '{ s += $NF } END { print s }')
echo "build: Done markers: $markers"
# v8.0 baseline: 133. Document drift either way.

# Task 4 — bundledPlugins floor (D-35-08)
ls src/main/build/bundledPlugins/ | wc -l
# Expected: ≥ 130. Current per RESEARCH: 132.

# Task 5 — webpack native-dep warnings (informational)
grep -E 'vortexmt|winapi-bindings|drivelist|diskusage|bsatk|ba2tk|turbowalk|loot|xxhash' \
  .planning/phases/35-build-verification-v2-0-1/artifacts/v81-build.txt \
  | grep -iE 'warning|warn' | head -20
# Document findings; non-fatal per D-29-XX precedent.
```

## Artifact emission

Append to `.planning/phases/35-build-verification-v2-0-1/35-VERIFY-RESULTS.md`:

```markdown
## Build (SYNC-35d)

**Date:** <utc-iso>
**Status:** PASS

### Build chain

- `pnpm build` exit: 0 (renderer webpack + main rolldown + preload + shared + workspace packages)
- `pnpm build:extensions` exit: 0 (vortex-api + extensions/\*\*)
- `build: Done` markers: <N> (v8.0 baseline: 133; Δ <N−133>)

### bundledPlugins (D-35-08)

- Count: <N> (floor: 130; current per RESEARCH: 132)
- Floor satisfied: YES (margin: <N−130>)

### Non-fatal warnings

Native-dep webpack warnings observed for: <list — vortexmt, …>. Carries v8.0 D-29-XX disposition: non-fatal, no action required this phase.
```

## Commits

**Zero commits in Wave 5.** Verification-only. Artifacts gitignored.

## Risks / contingencies

- **`pnpm build` exit non-zero.** Hard FAIL. Investigate: which workspace failed? If it's renderer webpack and the failure cites `extensions/download_management/`, that's a Wave-1-delete spillover — escalate. If it's an unrelated workspace, that's pre-existing Phase 34 debt that escaped per-bucket typecheck (typecheck and bundle aren't perfectly equivalent).
- **`pnpm build:extensions` exit non-zero.** Investigate per-extension. v8.0 P29 documented warnings around native binaries; same disposition unless something now blocks rather than warns.
- **bundledPlugins drift below floor.** Investigate which extension(s) failed to bundle. Either fix in this wave (in scope for SYNC-35d) or document and escalate. Floor is non-negotiable.
- **Native-dep build failure on Linux.** Carries Phase 33 §10 native binaries playbook receipts. If a native dep that worked at Phase 34 closeout now fails, that's a regression — escalate.
- **R1 lockfile-drift contingency.** Same as Wave 4 — unlikely.

## Done criteria

1. `pnpm build` exits 0.
2. `pnpm build:extensions` exits 0.
3. bundledPlugins count ≥ 130.
4. Native-dep webpack warnings documented as non-fatal per D-29-XX precedent.
5. `35-VERIFY-RESULTS.md` build section appended.
6. SYNC-35d satisfied; Wave 6 unblocked.
