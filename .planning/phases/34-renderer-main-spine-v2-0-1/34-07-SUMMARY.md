---
phase: 34-renderer-main-spine-v2-0-1
plan: 07
wave: G
title: "Wave G — repo-wide leaves (docs, install prep, fingerprints, packages/e2e, misc)"
status: complete
completed: 2026-05-23
files_resolved: 34
commits: 35
typecheck_errors: 0
markers_remaining_in_scope: 0
ssh_signed: all
---

# Phase 34 Plan 07: Wave G (repo-wide leaves) Summary

Resolved all 34 conflict-marked files outside `src/`, `.planning/`, and
`extensions/` after the v2.0.1 upstream merge. 35 commits total (34
resolutions + 1 strict-TS Rule-1 typecheck fix). All commits SSH-signed
on `v8.1/config-bucket`. Wave G scope marker count = 0; Wave H
(`src/renderer/src/extensions/download_management/`) untouched.

## Commit range

First: `e32e79de3` resolve(repo-leaves): CHANGELOG.md
Last: `ed7780661` fix(phase-34): G5.7 tools/addicons/index.html

## Sub-batches

### G1 — repo-leaf docs / etc (6 commits)

Hand-classified each file by content domain:

- `e32e79de3` CHANGELOG.md — §4 upstream-wins (v2.0.1 release entry + tag-slug normalization, kept HEAD-only [1.16.9]/[1.16.8] tag links)
- `c6107df13` CLAUDE.md — §3 fork-wins (HEAD-only GSD fork content; oxfmt expanded the file +60/-16 — accepted since CLAUDE.md is fork-only)
- `3a7681d15` CONTRIBUTE.md — §3 fork-wins (preserved Arch/Debian/Fedora/NixOS/Flatpak setup link refs)
- `4053217c7` README.md — §3 fork-wins (Linux install AppImage/.deb/Arch instructions preserved)
- `a43ba7529` etc/Dependency Report.md — §4 upstream-wins (regenerated artifact, identical packages, took compact format)
- `4fdca120c` etc/vortex.api.md — §4 upstream-wins (API Extractor regen, dropped DownloadCheckpoint forgotten-export — surfaces correctly in the new render)

### G2 — install preparation (no commits)

Ran `pnpm install --frozen-lockfile=false` (no lockfile drift) and a
separate `pnpm install` inside `.github/actions/fingerprints/` (not in
the workspace; has its own pnpm-lock.yaml). `@vercel/ncc` 0.38.4
verified for the dist regeneration path.

### G3 — fingerprints action (10 commits)

`.github/actions/fingerprints/` is a self-contained GitHub Action with
its own tsconfig, package.json, lockfile. All 9 source files were §7
smaller-diff (HEAD long-lines vs upstream's oxfmt-wrapped form) — same
behaviour, took HEAD's compact form throughout.

- `6482244e1` src/types.ts (2 regions)
- `6d3f2c841` src/clickhouse.ts (4 regions)
- `c68710282` src/collect-input.ts (2 regions)
- `27a4d9fd3` src/collect-input.test.ts (3 regions)
- `9ad338a98` src/collect-pr.ts (2 regions)
- `b6c1f9d4e` src/collect-pr.test.ts (5 regions)
- `143957155` src/collect-release.ts (5 regions, incl. import block + paginate.iterator + core.info wrapping)
- `b6739c3e3` src/collect-release.test.ts (2 regions)
- `b96b4f6ea` src/index.ts (3 regions)
- `3a2e83884` dist/index.js — regenerated via canonical `pnpm build` (ncc 0.38.4 + tsc 5.9.3, `--license LICENSES.txt`); 1283 kB bundle, `node --check` exit 0

**Typecheck:** `tsc --noEmit` from inside `.github/actions/fingerprints/`
returns 0 errors (filtered for TS1185).

### G4 — packages/e2e (11 commits + 1 fix)

Mix of resolutions across 11 e2e test/fixture/helper files:

- `4a352b382` README.md — §7 smaller-diff (1 region)
- `fd2a18adc` fixtures/game-setup/fake-game.ts — §7 smaller-diff (4 regions)
- `deae1569e` fixtures/vortex-app.ts — §5 Rule-1 dup-import HEAD-empty + §7 smaller-diff (5 regions). Region 5 initially took the wrong side; corrected in `1e8d0c756` (see below).
- `8f8cc10c6` helpers/navigation.ts — §4 upstream-wins (v2.0.1 added `{ timeout: 3000 }` to `homeLink.isVisible()`)
- `314c37ada` selectors/navbar.ts — §6 Rule-2 D1-carryover (HEAD's `modsLink`) + §4 v2.0.1 feature upstream-wins (locator-based reassignments of gamesLink/homeLink/extensionsLink)
- `7d8bf1722` selectors/settings.ts — §7 smaller-diff (1 region)
- `19ede560e` tests/smoke.spec.ts — §7 smaller-diff (5 regions)
- `affba619d` tests/dashboard.spec.ts — §4 upstream-wins (explicit `{ timeout: 5000 }` on isVisible/toBeVisible)
- `c55e88613` tests/login.spec.ts — §3 fork-wins (real fork test using `loginToNexus` + `freeUser` vs upstream stub)
- `a592fef53` tests/game-management.spec.ts — §5 Rule-1 dup-import HEAD-empty + §3 fork-wins (preserves `manageGame`, `ManagedGame`, `NavBar` imports)
- `76adb4e64` tests/settings.spec.ts — §7 smaller-diff (2 regions)

**G4 wave-typecheck checkpoint surfaced 3 errors** — fixed in `1e8d0c756`:

- `1e8d0c756` fix(phase-34): G4 typecheck — strict-TS Rule 1 auto-fix
    - `vortex-app.ts:207` waitForFunction arrow → string form. **Rule 1**:
      TS2584 `Cannot find name 'document'`. tsconfig.strict.json has
      `lib: ["ESNext"]` only; the arrow form references the browser-global
      `document`. Switched to upstream's string form (Playwright evaluates
      the string in the page context, identical runtime behaviour). My G4.3
      resolution had taken HEAD's arrow form for region 5; this corrects
      that mis-classification.
    - `game-management.spec.ts:27` `GAME_CONFIGS.stardewvalley` → `!`
      non-null assertion. **Rule 1**: TS18048 `'config' is possibly
'undefined'` — `GAME_CONFIGS` is typed `Record<string, GameConfig>`
      so index access returns `T | undefined` under strict. The literal
      key always exists in the map, non-null assertion is correct.

**Typecheck:** `tsc -p packages/e2e/tsconfig.json --noEmit` returns 0
errors (filtered for TS1185).

### G5 — misc remaining (7 commits)

- `a98a4f95b` **tests**/reducers.download_management.test.js — §7 HEAD-paths (the file lives at the HEAD path so HEAD's relative imports `../src/extensions/...` are correct; took double-quote style to match the rest of the file)
- `2ab4de97a` docs/flatpak/maintenance.md — §3 fork-wins (Flatpak packaging is fork-only; preserved link-reference style matching the rest of the file)
- `e95fc7482` docs/native-node-module-management.md — §4 upstream-wins (esptk + bsdiff-node accurately describe modules the fork ships per `scripts/verify-addons.cjs`)
- `a8dfe6cf2` flatpak/generated-sources.json — §3 fork-wins (generated artifact derived from our pnpm-driven yarn.lock; upstream entries reflect a different lockfile; took HEAD-empty for all 4 regions; verified valid JSON)
- `115665994` scripts/download-duckdb-extensions.ts + scripts/download-duckdb-extensions.test.ts — §7 smaller-diff (6 formatting-only regions across both files; vitest run passes all 6 tests)
- `ed7780661` tools/addicons/index.html — §7 smaller-diff (HTML formatting churn; same DOM, same styling)

## Wave-end gate (G33)

| Gate                                                               | Result                  |
| ------------------------------------------------------------------ | ----------------------- |
| Wave G scope markers (outside `.planning/`, `src/`, `extensions/`) | 0                       |
| `.github/actions/fingerprints/` typecheck                          | 0 errors (excl. TS1185) |
| `packages/e2e/` typecheck                                          | 0 errors (excl. TS1185) |
| Harness `grep-checkpoint.sh --skip-conflict-check`                 | 12 GREEN gates clean    |
| `vitest run scripts/download-duckdb-extensions.test.ts`            | 6/6 passed              |
| `node --check .github/actions/fingerprints/dist/index.js`          | exit 0                  |
| `python3 -c 'json.load(...)' flatpak/generated-sources.json`       | VALID JSON              |

The 4 remaining `<<<<<<<` byte sequences in
`extensions/gamebryo-savegame-management/test/saves/oblivion/oblivion_*.ess`
and `flatpak/screenshots/08.png` are binary-fixture false positives, not
actual conflicts. `extensions/` is Wave H scope; `src/` Wave H scope.

## Deviations

- **G4.3 region 5 mis-classification (recovered).** Initial resolution
  took HEAD's arrow-form `waitForFunction`, which doesn't type-check
  under strict (no DOM lib). Caught at the G4 wave-typecheck checkpoint
  and fixed in `1e8d0c756` as **Rule 1** auto-fix.
- **G4.10 (game-management.spec.ts) strict-TS gap (recovered).** The
  upstream file shape used a `Record<string, GameConfig>` index access
  that's `undefined` under strict; pre-existing strict-TS gap surfaced
  by the G4 wave-typecheck. Fixed in same commit `1e8d0c756` with `!`
  non-null assertion as **Rule 1** auto-fix.
- **CLAUDE.md oxfmt expansion (+60/-16).** lint-staged's pre-commit
  oxfmt step reformatted the entire file. Acceptable since CLAUDE.md is
  fork-only content. For all subsequent files, pre-formatted with
  `pnpm oxfmt` before `git add` so any reformatting was visible in the
  resolution diff.
- **fingerprints not in pnpm workspace.** Required a separate `pnpm
install` inside `.github/actions/fingerprints/` since
  `pnpm --filter` doesn't reach it. Captured in G2.
- **dist/index.js regenerated via canonical `pnpm build`** rather than
  hand-resolved (D-34-03: never hand-resolve generated artifacts when a
  canonical regen path exists).

## SSH signing

All 35 commits SSH-signed with `~/.ssh/id_ed25519.pub` (verified via
`git cat-file -p <hash>` showing `gpgsig -----BEGIN SSH SIGNATURE-----`
block). `git config gpg.format=ssh`, `commit.gpgsign=true`. The `%G?`
verifier returns `N` only because `gpg.ssh.allowedSignersFile` isn't
configured for verification — signatures are present and valid.

## Wave H readiness

Wave H (`src/renderer/src/extensions/download_management/`) is
unblocked. Wave G's repo-wide leaves are clean; the spine (Waves
B/C/D/F) and repo-wide leaves (G) are fully resolved. Wave H can begin
with download_management drift carried forward from Wave F.
