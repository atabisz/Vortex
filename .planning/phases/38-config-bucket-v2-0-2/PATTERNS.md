# Phase 38: Config bucket (v2.0.2) — Pattern Map

**Mapped:** 2026-05-23
**Plan slots analyzed:** 6 (38-01 .. 38-06; optional 38-07 push)
**Analogs found:** 6 / 6 (all map to v8.1 Phase 31 SUMMARY/PLAN files)

> Phase 38 is an upstream-sync conflict-resolution phase — no new files. The
> "patterns" mapped here are **resolution stances per plan slot** lifted from
> the v8.1 Phase 31 prior art that closed cleanly on 2026-05-22 (commit
> `30fa56f6a`, branch `v8.1/config-bucket`). All v8.1 paths are relative to
> `.planning/phases/31-config-bucket/`.

## Plan-slot Classification

| Phase 38 Plan                                                | Files                        | Role                           | Closest v8.1 Analog                                                                   | Match                     |
| ------------------------------------------------------------ | ---------------------------- | ------------------------------ | ------------------------------------------------------------------------------------- | ------------------------- |
| 38-01 (branch + baseline + R1 verify)                        | none — branch ops            | bootstrap / inventory          | `31-01-PLAN.md` + `31-01-SUMMARY.md`                                                  | exact                     |
| 38-02 (`.vscode/launch.json` + `src/renderer/tsconfig.json`) | 2 files, keep-HEAD           | config keep-HEAD               | none direct (NEW vs v8.1); closest stance = `31-02-SUMMARY.md` (Dockerfile keep-HEAD) | stance-match              |
| 38-03 (4× `eslint.config.mjs`)                               | 4 files, pick-HEAD wholesale | eslint base-extraction dedupe  | `31-03-PLAN.md` + `31-03-SUMMARY.md`                                                  | exact                     |
| 38-04 (`src/main/prepare-dist-package.mjs`)                  | 1 file, keep-HEAD            | dist-build helper              | `31-04-SUMMARY.md` (vitest+prepare-dist combined)                                     | exact (prepare-dist half) |
| 38-05 (`pnpm-workspace.yaml`)                                | 1 file, hand-resolve         | catalog/allowBuilds union      | `31-06-PLAN.md` + `31-06-SUMMARY.md`                                                  | exact                     |
| 38-06 (`pnpm-lock.yaml` regen)                               | 1 file, regenerate           | lockfile regen + drift summary | `31-07-PLAN.md` + `31-07-SUMMARY.md`                                                  | exact                     |
| 38-07 (optional, push)                                       | force-with-lease push        | release / handoff              | `31-08-PLAN.md` + `31-08-SUMMARY.md`                                                  | exact                     |

**Files dropped vs v8.1** (auto-merged clean in v2.0.2 — no Phase 38 commit needed): `package.json` (was 31-05), `vitest.config.ts` (was 31-04), `docker/windows/Dockerfile` (was 31-02), `.vscode/extensions.json` (was already no-op in 31). Document these in 38-01-SUMMARY as "no-op vs v8.1 prior art."

---

## Pattern Assignments

### Plan 38-01 — branch + baseline-inventory + R1 verify

**Analog:** `31-01-PLAN.md` + `31-01-SUMMARY.md`

**Pattern to copy:**

- Branch from current `fork/master` HEAD (v8.1 branched from `d717c09c3`; v8.2 branches from **`ea21358a4`**, NOT CONTEXT's stale `855fb3e1a` — see RESEARCH R4).
- Authoritative conflict enumeration via `git grep -l '^<<<<<<< '` on `fork/sync/upstream-v2.0.2`, filtered to Bucket A.
- R1 verification: `git show fork/sync/upstream-v2.0.2:packages/paths{,-node}/package.json` — restore from `fork/master` if absent (v8.1 restore commit was `8ca3b2053`).

**v2.0.2 deltas the planner must incorporate:**

- 4 v8.1 files become no-op (package.json / vitest.config.ts / Dockerfile / extensions.json) — list explicitly.
- 2 new-to-v8.2 files enter Bucket A (`launch.json`, `renderer/tsconfig.json`) — list explicitly.
- 2 .mjs files (`extensions/copy-native.mjs`, `rolldown.base.mjs`) carry conflict markers but **defer to Phase 40**; baseline inventory must explicitly mark them out-of-scope (RESEARCH R3).
- Branch base SHA and merge-tree SHA from CONTEXT have drifted — re-record current values in the SUMMARY.

---

### Plan 38-02 — `.vscode/launch.json` + `src/renderer/tsconfig.json` (keep-HEAD)

**Analog:** `31-02-SUMMARY.md` (Dockerfile keep-HEAD — closest stance match for "small file, single/few regions, pure keep-HEAD")

**Pattern to copy:**

- Atomic per-file commit titled `resolve(config): <file> — keep HEAD <one-line>` (D-38-03).
- Hand-edit conflict markers via Edit tool — `git checkout --ours` does not work because markers are committed-in from PR auto-merge (no live merge state). Pattern from 31-02/03/04/05 SUMMARYs all confirm this mechanic.
- Verify with `git grep '^<<<<<<< ' -- <file>` returning no output before commit.

**v2.0.2 deltas the planner must incorporate:**

- Both files are **NEW vs v8.1** (no direct file analog). Stance is mechanical: `launch.json` 3 regions are all `build/` vs `out/` (D-38-13); `renderer/tsconfig.json` 1 region is fork's `*.test.ts(x)` exclude additions.
- Husky `--no-verify` likely NOT needed here (RESEARCH R5 says hook risk is low for v8.2 because no companion package.json conflict). Document in commit body if used anyway.

---

### Plan 38-03 — 4× `eslint.config.mjs` (pick-HEAD wholesale)

**Analog:** `31-03-PLAN.md` + `31-03-SUMMARY.md`

**Pattern to copy** (verbatim stance from 31-03):

- Pick HEAD wholesale on every conflict region in all four files — upstream-side adds are duplicates of `eslint.config.base.mjs` (already-extracted base content).
- Validate base extraction: confirm `eslint.config.base.mjs` contains `projectService`, `tsconfigRootDir`, `perfectionist`, `recommendedTypeChecked`, `sort-imports`, `sort-exports`, `consistent-type-imports`. If any are missing, the pick-HEAD-wholesale stance breaks down and per-region hand-merge is required.
- Renderer's HEAD-only tail content (`vortex/no-bluebird-*`, `react-x`, `better-tailwindcss`, `sort-jsx-props`, `@eslint-react`) sits outside the conflict regions and survives automatically — verify in commit body.
- Verify each file with `node --check` exits 0.
- 4 atomic commits, one per file, D-38-03 title format.

**v2.0.2 deltas the planner must incorporate:**

- v2.0.1 → v2.0.2 only **reduced** upstream-side inline rules further (more base extraction). Stance unchanged.
- 31-03's commits used `--no-verify` per R5; v8.2 likely does NOT need this (no companion YAML/JSON unresolved at the time these run, IF Plan 38-03 sequences after 38-05). Sequencing matters — document in plan dependency chain.

---

### Plan 38-04 — `src/main/prepare-dist-package.mjs` (keep-HEAD)

**Analog:** `31-04-SUMMARY.md` (split file — `prepare-dist-package.mjs` half)

**Pattern to copy:**

- Keep HEAD wholesale on conflict region — fork's addition is necessary for fork's dist build flow.
- Verify with `node --check` exits 0.
- Atomic commit, D-38-03 title format.

**v2.0.2 deltas the planner must incorporate:**

- v8.1's stance was "keep HEAD's `build/` regex + full author/description/homepage". v8.2's conflict region is **different shape**: it's the `packagesSection` block emission for workspace:_ resolution in dist context (15 fork-side lines vs upstream's vanilla one-liner). Stance is structurally identical (keep HEAD wholesale) but the rationale text in the commit body differs — frame it as "preserve `packagesSection` workspace:_ resolution" not "preserve `build/` regex".
- File has 101 lines of fork-side oxfmt formatting drift on top of v2.0.1→v2.0.2 (whitespace-only). Confirm in commit body that whitespace deltas are formatting-only.
- `vitest.config.ts` half of the v8.1 plan is **dropped** in v8.2 (auto-merged clean) — this plan covers prepare-dist-package only.

---

### Plan 38-05 — `pnpm-workspace.yaml` (hand-resolve)

**Analog:** `31-06-PLAN.md` + `31-06-SUMMARY.md`

**Pattern to copy:**

- Region-by-region table in the commit body and SUMMARY (31-06's "Region-by-region" table is the template).
- Verify with `python3 -c 'import yaml; yaml.safe_load(open("pnpm-workspace.yaml"))'`.
- Sanity-check the auto-merged content survived: `@electron/rebuild: true` in allowBuilds (D-38-07); `nx: ^22.7.1` in catalog (D-38-14); `leveldown`/`levelup` still present.

**v2.0.2 deltas the planner must incorporate:**

- **Only 1 conflict region in v8.2 vs 5 in v8.1.** Region content is `nexus-api` SHA bump + `native-errors` line — both upstream side. Stance: **take upstream side** on this region (additive catalog change + real SHA bump). This is the **opposite default** of v8.1's allowBuilds region, but consistent with v8.1's catalog-additions stance (31-06 regions 2/3/5 all took upstream).
- D-38-07's "keep HEAD on allowBuilds" is honored automatically — the allowBuilds block has NO conflict in v2.0.2 (auto-merged clean). No work needed there.
- A3 sanity check (RESEARCH): verify allowBuilds region didn't silently drop `@electron/rebuild` during auto-merge before committing.

---

### Plan 38-06 — `pnpm-lock.yaml` regenerate

**Analog:** `31-07-PLAN.md` + `31-07-SUMMARY.md`

**Pattern to copy:**

- Sequence: `rm pnpm-lock.yaml` → `pnpm install --no-frozen-lockfile` → `pnpm install --frozen-lockfile` (validation; must report "Lockfile is up to date" / exit 0).
- Single regen commit titled `chore(deps): regenerate pnpm-lock.yaml after v2.0.2 sync` (D-38-16).
- Drift summary in commit body comparing post-regen lockfile against `fork/sync/upstream-v2.0.2:pnpm-lock.yaml` (D-38-17 item 5 target reference).
- Be alert for `cleanupUnusedCatalogs: true` side-effects — v8.1 31-07 had pnpm drop unused catalog entries (`esptk`, `exe-version`, etc.). Document any v8.2 drops in commit body.

**v2.0.2 deltas the planner must incorporate:**

- **Drift baseline is tiny** — 22 ins / 15 del (37 lines) vs v8.1's 661. Drift summary will be short — bulleted prose works fine, table is overkill (Claude's-discretion freedom in CONTEXT).
- v8.1 31-07 had a precondition keep-HEAD commit on `extensions/games/game-baldursgate3/package.json` because that workspace's package.json had unrelated conflict markers blocking `pnpm install`. **Verify in 38-01** whether v2.0.2 has any analogous precondition — if any workspace `package.json` carries conflict markers, resolve atomically before lockfile regen (mirroring 31-07's BG3 precondition pattern). If clean, skip.
- Estimated runtime 3–8 minutes (vs v8.1's 5–15).

---

### Plan 38-07 (optional) — force-with-lease push

**Analog:** `31-08-PLAN.md` + `31-08-SUMMARY.md`

**Pattern to copy:**

- `git push --force-with-lease git@github.com:atabisz/Vortex.git v8.2/sync-upstream-v2.0.2:sync/upstream-v2.0.2` — inline SSH URL per `feedback_git_push_ssh.md` (sandbox blocks `.git/config`).
- `autonomous: false` per CLAUDE.md — force-push to shared remote requires human-confirm.

**v2.0.2 deltas the planner must incorporate:**

- v8.1 31-08 was a first-push (no remote ref existed; `--force-with-lease` was no-op). v8.2 pushes to **existing** `sync/upstream-v2.0.2` branch (PR #6 head at `314ca807c`) — the lease check is real this time and defends against the daily `rebase-upstream.yml` cron.
- v8.1 31-08 surfaced the PR-creation link as next step. v8.2's PR #6 already exists — push lands review thread updates, no new PR creation.

---

## Shared Patterns (cross-cutting, apply to all hand-resolution plans 38-02..38-05)

### Conflict-marker resolution mechanic

**Source:** `31-02-SUMMARY.md` "R5 — `--no-verify` used" + `31-03-SUMMARY.md` "Note on resolution mechanics" + `31-04-SUMMARY.md` "Note on resolution mechanics" + `31-05-SUMMARY.md` "Note on resolution mechanics"

**Pattern:** `git checkout --ours` / `--theirs` does NOT work — markers are committed-in from PR #6 auto-merge, no live merge state exists. Hand-edit each file via Edit tool to remove `<<<<<<<` / `=======` / `>>>>>>>` markers and write the resolved content. Then `git add` + atomic commit.

### Husky `--no-verify` handling

**Source:** `31-02-SUMMARY.md` R5; `31-03/04/05-SUMMARY.md` "Note on resolution mechanics"

**Pattern (v8.1):** Used `--no-verify` while pre-commit oxfmt couldn't parse files with merge markers still present elsewhere in the tree.

**v8.2 delta:** Per RESEARCH R5, only ONE Bucket A YAML conflicts (`pnpm-workspace.yaml`) and there's no companion `package.json` conflict. **Implication:** sequence Plan 38-05 (pnpm-workspace.yaml) BEFORE Plan 38-06 (lockfile), and run other hand-resolution plans without `--no-verify` if the tree is clean by then. Document in each commit body whether `--no-verify` was used and why.

### Atomic-commit title format

**Source:** D-38-03 mirrors v8.1 D-31-03 — every 31-0X-SUMMARY confirms.

**Pattern:** `resolve(config): <file> — <one-line stance>`. Lockfile commit uses `chore(deps): regenerate pnpm-lock.yaml after v2.0.2 sync` (D-38-16).

### Verification-before-commit per file

**Source:** Every 31-0X-SUMMARY's "Verification" section.

**Pattern:**

- `git grep '^<<<<<<< ' -- <file>` returns no output (exit 1).
- For .mjs/.cjs: `node --check <file>` exits 0.
- For .json: `python3 -c 'import json; json.load(open("<file>"))'` (or `JSON.parse` via node).
- For .yaml: `python3 -c 'import yaml; yaml.safe_load(open("<file>"))'`.

---

## No Analog Found

None — every Phase 38 plan slot has a direct or stance-match v8.1 analog. The two NEW-vs-v8.1 files (`launch.json`, `renderer/tsconfig.json`) bundled into Plan 38-02 don't have file-level analogs but inherit the keep-HEAD stance pattern from `31-02-SUMMARY.md` (Dockerfile) plus the D-38-13 `build/` vs `out/` decision precedent.

## Metadata

**Analog search scope:** `.planning/phases/31-config-bucket/` (8 PLAN + 8 SUMMARY files)
**Files scanned:** 16 v8.1 prior-art docs + Phase 38 CONTEXT + Phase 38 RESEARCH
**Pattern extraction date:** 2026-05-23
