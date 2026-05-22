---
phase: 25-restore-dropped-scaffolding
plan: 03
subsystem: infra
tags: [pnpm, catalog, electron, native-addon, ba2tk, github-actions, vortex-fork]

requires:
    - phase: 25-01
      provides: discovery diff (gamebryo-archive-support → gamebryo-ba2-support rename, ba2tk version source)
    - phase: 25-02
      provides: paths + paths-node workspaces; lockfile state stable for catalog edit

provides:
    - extensions/gamebryo-ba2-support workspace restored from upstream parent 8b5a9f675
    - gamebryo-archive-support directory removed (upstream rename)
    - ba2tk catalog entry pinned to Nexus-Mods/node-ba2tk SHA 762d8de8
    - release-linux.yml ba2tk native-rebuild step (modeled on bsatk)
    - verify-addons.cjs ba2tk smoke-test assertion
affects: [25-04, 25-05, 26, 27, 28, 29]

tech-stack:
    added: [ba2tk@2.0.9 (git pin)]
    patterns:
        - "named-script Linux-guard form (skip-on-windows.mjs) per Playbook §1"
        - "catalog entry git-pinned to upstream SHA, matching flatpak/generated-sources.json"
        - "native rebuild step appended after the existing bsatk pattern"

key-files:
    created:
        - extensions/gamebryo-ba2-support/.gitignore
        - extensions/gamebryo-ba2-support/build.mjs
        - extensions/gamebryo-ba2-support/package.json
        - extensions/gamebryo-ba2-support/src/index.ts
        - extensions/gamebryo-ba2-support/tsconfig.json
    modified:
        - .github/workflows/release-linux.yml
        - pnpm-workspace.yaml
        - pnpm-lock.yaml
        - scripts/verify-addons.cjs

key-decisions:
    - "ba2tk catalog source: upstream Nexus-Mods git pin at SHA 762d8de8 (matches upstream catalog AND flatpak/generated-sources.json — fork is NOT vendoring)"
    - "Hooks bypass (--no-verify) used to preserve byte-for-byte parity for upstream-restored files in the same atomic commit as the package.json scripts rewrite"
    - "ba2tk added to allowBuilds: true (mirrors the bsatk pattern; native gyp build needs the build hook)"

patterns-established:
    - "Pattern: when upstream renames an extension directory, fork removes the old directory in the same atomic commit that restores the new one"
    - "Pattern: native-addon-bearing extensions get a dedicated rebuild step in release-linux.yml + a matching addonWorkspaces entry in verify-addons.cjs"

requirements-completed: [SYNC-13]

duration: 5m 29s
completed: 2026-05-15
---

# Phase 25 Plan 03: gamebryo-ba2-support + ba2tk catalog + CI rebuild Summary

**Restored gamebryo-ba2-support extension from upstream SHA 8b5a9f675, rewrote its package.json to the fork's named-script Linux-guard form, removed the renamed-away gamebryo-archive-support directory, pinned ba2tk in the catalog to Nexus-Mods upstream SHA 762d8de8, and wired ba2tk into release-linux.yml + verify-addons.cjs.**

## Performance

- **Duration:** 5m 29s (329 seconds)
- **Started:** 2026-05-15T01:22:16Z
- **Completed:** 2026-05-15T01:27:45Z
- **Tasks:** 2 (combined into one atomic commit per D-25-04)
- **Files modified:** 5 paths in commit (plus 18 file deletions for the removed gamebryo-archive-support directory)

## Accomplishments

- **gamebryo-ba2-support restored byte-for-byte from `8b5a9f675`** — `git diff 8b5a9f675 HEAD -- extensions/gamebryo-ba2-support ':!extensions/gamebryo-ba2-support/package.json'` is empty.
- **package.json scripts rewritten to D-25-08 named-script form** — replaces upstream's inline `node -e "if(process.platform==='win32')process.exit(1)"` guards with `node ../skip-on-windows.mjs` calls. Playbook §1 satisfied.
- **gamebryo-archive-support removed** (`git rm -r`) per the Wave 1 user-acknowledged rename in `25-DISCOVERY-RESULT.md ## User Decisions on Surprises > Renames`.
- **ba2tk catalog entry added** at `pnpm-workspace.yaml:133` (alphabetically between `@welldone-software/why-did-you-render` and `bbcode-to-react`): `ba2tk: git+https://github.com/Nexus-Mods/node-ba2tk#762d8de841ca1c770a0925311fd626d71de67971`. Same SHA as `flatpak/generated-sources.json` — fork is NOT vendoring (the "custom fork" wording in CLAUDE.md/STACK.md is mislabeled and out of scope to fix here).
- **`ba2tk: true` added to allowBuilds** (`pnpm-workspace.yaml:15`) so pnpm runs the gyp build hook (mirrors the bsatk row).
- **release-linux.yml `Rebuild ba2tk for Linux` step** appended at lines 89–95, immediately after the existing bsatk rebuild block. Resolves ba2tk via `require.resolve('ba2tk/package.json', {paths: ['extensions/gamebryo-ba2-support/node_modules', 'node_modules']})`, optionally runs `fetch_ba2tk.js` if present, then `npx node-gyp rebuild --target=39.8.0 --arch=x64 --dist-url=https://electronjs.org/headers`.
- **verify-addons.cjs ba2tk assertion** added: ba2tk is in `addonWorkspaces` map (resolves from `extensions/gamebryo-ba2-support/node_modules`) and `crossPlatformAddons` list (alongside xxhash-addon and bsatk).
- **`pnpm install` clean** (52.9s); **`pnpm install --frozen-lockfile` clean** post-commit (catalog stable, lockfile internally consistent).
- **ba2tk@2.0.9 resolves** to tarball `https://codeload.github.com/Nexus-Mods/node-ba2tk/tar.gz/762d8de8…` — verified in `pnpm-lock.yaml`.

## Task Commits

Per D-25-04, this plan delivers commit 2 of 5 in Phase 25 as a single atomic commit (the only catalog/lockfile-touching commit):

1. **Atomic restore + catalog + CI** — `b28d37e31` (restore)

Title: `restore(extensions): gamebryo-ba2-support + ba2tk catalog entry + CI rebuild`

Signed: SSH ed25519. Local `git verify-commit` errors out because the worktree lacks `gpg.ssh.allowedSignersFile` config, but the `gpgsig` block is attached in the commit object (verifiable with `git cat-file -p HEAD | head`).

## Files Created/Modified

### Created (restored from `8b5a9f675`, byte-for-byte except package.json)

- `extensions/gamebryo-ba2-support/.gitignore` — upstream-faithful (rename target from gamebryo-archive-support)
- `extensions/gamebryo-ba2-support/build.mjs` — upstream-faithful (rename target)
- `extensions/gamebryo-ba2-support/src/index.ts` — upstream-faithful (new file)
- `extensions/gamebryo-ba2-support/tsconfig.json` — upstream-faithful (rename target)
- `extensions/gamebryo-ba2-support/package.json` — upstream content for everything except `scripts` block, which is rewritten to the fork's named-script form

### Modified (fork-authored)

- `pnpm-workspace.yaml` — line 15 (`ba2tk: true` allowBuilds), line 133 (`ba2tk: git+...` catalog)
- `pnpm-lock.yaml` — additive: ba2tk@2.0.9 resolution + gamebryo-ba2-support workspace link
- `.github/workflows/release-linux.yml` — lines 89–95 (new `Rebuild ba2tk for Linux` step after the existing bsatk block at lines 83–87)
- `scripts/verify-addons.cjs` — line 37 (addonWorkspaces ba2tk entry), line 105 (crossPlatformAddons list extended)

### Deleted (upstream rename — entire directory)

- `extensions/gamebryo-archive-support/{package.json,build.mjs,.gitignore,tsconfig.json,vitest.config.ts,scripts/*,src/*,test-data/*}` — 18 files removed via `git rm -r`

## Decisions Made

- **Catalog source pinned to upstream SHA, NOT a fork-vendored URL** — confirmed via Plan 01's `## node-ba2tk Grep Result` (no fork hits in any package.json or pnpm-lock.yaml). The CLAUDE.md / STACK.md "(custom fork)" wording for node-ba2tk is mislabeled; the same SHA `762d8de8` is already pinned in `flatpak/generated-sources.json`. Side-finding flagged for a future doc-correction commit (out of scope this phase).
- **`--no-verify` used for the atomic commit** to preserve byte-for-byte parity for the upstream-restored files (`build.mjs`, `tsconfig.json`, `.gitignore`, `src/index.ts`). oxfmt would have reformatted them and broken D-25-15 condition 1's byte-for-byte assertion against `8b5a9f675`. The fork-authored package.json scripts rewrite is in the same commit; running hooks would have reformatted both. The hook bypass is scoped to this commit; future fork-authored edits run hooks normally. Per the parallel-execution guidance: documented in commit body and here.
- **Workflow step shape** — added as a standalone `- name: Rebuild ba2tk for Linux` step (matching the CONTEXT.md `<specifics>` template literally), not folded into the existing combined `Rebuild pnpm-isolated native addons for Electron` step that already contains loot + bsatk. Both shapes work in YAML; the standalone shape is what CONTEXT.md specified verbatim and is easier to audit/grep for in future syncs.
- **`ba2tk: true` in allowBuilds** — added to mirror the existing bsatk row. Without it, pnpm 10's strict-build-allowlist would refuse to run the gyp postinstall and the AppImage build would fail at the `Rebuild ba2tk` step.

## Deviations from Plan

None significant. The plan was followed as written. The `--no-verify` decision was anticipated by `<parallel_execution>` guidance ("Acceptable approach... document the call in the commit body and SUMMARY.md") and is documented above.

One small judgment call: appended ba2tk as a standalone step rather than folding it into the existing combined `Rebuild pnpm-isolated native addons for Electron` step. The existing block has `loot` + `bsatk` in one shell. The CONTEXT.md `<specifics>` "release-linux.yml ba2tk rebuild step" template showed it as a standalone step, so I followed the template — easier to grep and easier to remove if ba2tk's build pattern ever diverges from bsatk's.

## Issues Encountered

None. The PreToolUse security_reminder_hook fired once on the workflow edit (defensive warning about command injection in GH Actions) but the new step uses no untrusted input — only static paths and constant flags — so retry succeeded with no change.

## User Setup Required

None — no external service configuration.

## Next Phase Readiness

- Catalog is stable for the rest of Phase 25; subsequent commits (3 download files, 4 CI workflows, 5 docs) will not touch `pnpm-workspace.yaml` or `pnpm-lock.yaml`.
- D-25-15 done-gate conditions 1 + 2 + 3 satisfied for this commit's portion (byte-for-byte match for non-package.json files; install green; frozen-lockfile green).
- Plan 04 next: commits 3 (chunking + downloader.test.ts + downloading spine, including the 4 ACCEPTED surprise files) and 4 (4 missing CI workflows + Playbook §11) and 5 (docs).

## Self-Check: PASSED

- [x] `extensions/gamebryo-ba2-support/` exists (5 files)
- [x] `extensions/gamebryo-archive-support/` removed
- [x] `git diff 8b5a9f675 HEAD -- extensions/gamebryo-ba2-support ':!extensions/gamebryo-ba2-support/package.json'` is empty (byte-for-byte)
- [x] No `process.platform` or `node -e ... platform` in `extensions/gamebryo-ba2-support/package.json`
- [x] `skip-on-windows.mjs` present in `extensions/gamebryo-ba2-support/package.json` build/dist scripts
- [x] `pnpm-workspace.yaml` catalog has `ba2tk: git+https://github.com/Nexus-Mods/node-ba2tk#762d8de8…`
- [x] `pnpm-workspace.yaml` allowBuilds has `ba2tk: true`
- [x] `pnpm-lock.yaml` resolves ba2tk@2.0.9 at the pinned tarball
- [x] `.github/workflows/release-linux.yml` contains `Rebuild ba2tk for Linux` (1 occurrence; appears immediately after the bsatk block)
- [x] `scripts/verify-addons.cjs` contains `ba2tk` (2 occurrences: addonWorkspaces map + crossPlatformAddons list)
- [x] `pnpm install` clean (52.9s)
- [x] `pnpm install --frozen-lockfile` clean (catalog/lockfile internally consistent)
- [x] One atomic signed commit landed: `b28d37e31`
- [x] Title matches D-25-04 commit 2 format: `restore(extensions): gamebryo-ba2-support + ba2tk catalog entry + CI rebuild`
- [x] Body cites SHA `8b5a9f675`, D-25-08 named-script reason, D-25-09 CI step modeled on bsatk, D-25-10 catalog source decision, restoration command
- [x] Signed (SSH ed25519; `gpgsig` block present in commit object)
- [x] No modifications to STATE.md or ROADMAP.md (orchestrator owns)

---

_Phase: 25-restore-dropped-scaffolding_
_Plan: 03_
_Completed: 2026-05-15_
