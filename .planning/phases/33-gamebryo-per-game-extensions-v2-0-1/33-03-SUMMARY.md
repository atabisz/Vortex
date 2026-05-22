---
phase: 33-gamebryo-per-game-extensions-v2-0-1
plan: 33-03
wave: C
extension: collections
title: "Wave C — collections (1 extension, 12 files, 12 commits)"
status: complete
date: 2026-05-23
branch: v8.1/config-bucket
ssh_signed: true
pushed: false
---

# 33-03 — Wave C: collections resolution

## Outcome

Resolved 12 conflict files in `extensions/collections/` from the v2.0.1 upstream merge.
12 atomic SSH-signed commits, leaf-first → barrel-last. Extension typecheck closeout
passes (Route 1: `pnpm --filter collections typecheck` → 0 non-marker errors). Harness
green (11/11) after every commit. Branch stays on v8.1/config-bucket; not pushed.

## Per-file resolution table

| # | File | Regions | Stance | SHA |
|---|------|---------|--------|-----|
| 1 | `build.mjs` | 2 | tier-3 upstream-wins (nativeRemapPlugin import + bsdiff.node remap) | `480fe4e09` |
| 2 | `src/util/gameSupport/gamebryo.tsx` | 2 | tier-5 smaller-diff (HEAD-wins ×2) | `4dbece862` |
| 3 | `src/eventHandlers.ts` | 4 | tier-4 Rule-1 dup-block (×1) + tier-5 smaller-diff (×3) | `5221f2ac2` |
| 4 | `src/collectionExport.ts` | 1 | tier-5 smaller-diff (HEAD-wins) | `e30d41a6f` |
| 5 | `src/views/CollectionPageEdit/Instructions.tsx` | 2 | tier-5 smaller-diff (HEAD-wins ×2) | `01827728f` |
| 6 | `src/views/CollectionPageEdit/ModsEditPage.tsx` | 1 | tier-5 smaller-diff (HEAD-wins) | `69f987ab8` |
| 7 | `src/views/CollectionPageView/HealthDownvoteDialog.tsx` | 2 | tier-4 Rule-1 dup-import (×1) + tier-5 smaller-diff (×1) | `de4decf0b` |
| 8 | `src/views/CollectionPageView/index.tsx` | 3 | tier-5 smaller-diff (HEAD-wins ×3) | `d3223f8d0` |
| 9 | `src/views/InstallDialog/InstallFinishedDialog.tsx` | 1 | tier-5 smaller-diff (HEAD-wins) | `dac48eb2e` |
| 10 | `src/views/InstallDialog/InstallStartDialog.tsx` | 3 | tier-4 Rule-1 dup-import (×1) + tier-5 smaller-diff (×2) | `1579637e9` |
| 11 | `src/views/CollectionList/index.tsx` | 2 | tier-4 Rule-1 dup-import (×1) + tier-5 smaller-diff (×1) | `2ed7b2fee` |
| 12 | `src/index.ts` (barrel + closeout) | 3 | tier-5 smaller-diff (HEAD-wins ×3) | `cc86ea670` |

**Totals**: 12 files · 26 regions · 12 commits · 0 push

## Stance breakdown (regions)

- tier-3 upstream-wins (new-feature scaffolding): 2 (build.mjs nativeRemapPlugin)
- tier-4 Rule-1 dup-import / dup-block: 4 (eventHandlers R2; HealthDownvoteDialog R1; InstallStartDialog R1; CollectionList R1)
- tier-5 smaller-diff (HEAD-wins, HEAD compact matches fork/master): 20

Dominant pattern: oxfmt 80-col formatter reflow on the upstream side, with HEAD's
compact form already matching master byte-for-byte. tier-4 cases are upstream
re-pasting imports/blocks already present in HEAD — discarding the upstream side
is a no-op semantically.

## Gates

- **Pre/post sentinel grep (P2)**: pre-commit `grep -c '^<<<<<<< '` ≥ 1, post-commit = 0 — passed on all 12 commits
- **Harness (12-gate, --skip-conflict-check mode)**: exit 0 ("CHECKPOINT PASSED — 11 gate(s) clean") after every commit
- **Per-extension typecheck (Route 1)**: `pnpm --filter collections typecheck` →
  `pnpm tsc` →  0 non-marker errors (TS1185 marker-only filter applied; none present)
- **SSH signature verification**: `git cat-file -p <sha> | grep -c '^gpgsig '` = 1
  on every commit (`gpg.format=ssh`, `commit.gpgsign=true`, key `~/.ssh/id_ed25519`)
- **Master parity**: `diff -u /tmp/<file>.master <file> | wc -l` = 0 on 11/12 files;
  16-line pre-existing drift on `src/index.ts` documented as out-of-scope (see Issues)

## Affects

This wave unblocks:

- **Wave D1 (typecheck-driven cleanup)**: collections extension is now fully
  master-parity except for documented drift; D1 can pick up pre-existing
  formatter drift in `ModsEditPage.tsx` (~line 552 OptionsFilter SOURCES.map),
  `CollectionPageView/index.tsx` (~lines 652, ~993), and `src/index.ts`
  (~line 1612 pauseCollection 5-arg call) without merge-context noise.
- **Wave D2 (full-build parity)**: build.mjs now consumes nativeRemapPlugin from
  shared `scripts/extensions-rolldown.mjs`; bsdiff.node remap config in place
  for downstream rolldown bundling pass.
- **Wave E (smoke)**: collections install/edit/clone flow ready for runtime
  validation on Skyrim/Morrowind once D1+D2 close.

## Provides

- 12 SSH-signed commits on `v8.1/config-bucket` (480fe4e09 → cc86ea670)
- Bluebird Promise TS1064 trap honored (eventHandlers.ts uses `Bluebird from "bluebird"`
  line 4; no `:Promise<void>` annotations adopted from upstream on async fns)
- Casual project voice in commit messages (per `feedback_casual_voice.md`)
- Minimize-diff principle honored throughout (per
  `feedback_minimize_upstream_diff.md`); no reformatting outside conflict regions

## Issues (deferred)

- **`extensions/collections/src/index.ts` ~line 1612**: pre-existing HEAD drift —
  `pauseCollection(api, gameId, collectionId, false)` is single-line in HEAD,
  5-arg wrapped in master. Out-of-scope per minimize-diff. → Wave D2 cleanup.
- **`extensions/collections/src/views/CollectionPageEdit/ModsEditPage.tsx` ~line 552**:
  pre-existing `OptionsFilter SOURCES.map(...)` formatter drift, HEAD compact vs
  master wrapped. Out-of-scope. → Wave D1 cleanup.
- **`extensions/collections/src/views/CollectionPageView/index.tsx` ~lines 652, 993**:
  pre-existing minor formatter drifts. Out-of-scope. → Wave D1 cleanup.

None of these are blockers — extension typecheck passes with current state.

## Workflow notes

- Pattern P5 commit body used on every commit (regions/stance/gates/typecheck)
- Pattern P2 sentinel grep gates fired pre/post on every commit
- Branch invariant: stayed on v8.1/config-bucket; never pushed (sandbox rule)
- No `--no-gpg-sign`, no `--no-verify`, no GPG fallback — SSH only
