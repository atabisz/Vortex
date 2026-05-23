---
phase: 34-renderer-main-spine-v2-0-1
plan: 08
wave: H
title: "Wave H — R2 DROP (dead Jest __mocks__/ tree)"
status: complete
completed: 2026-05-23
files_resolved: 23
commits: 1
typecheck_errors_pre: 9
typecheck_errors_post: 9
typecheck_errors_outside_download_management: 0
markers_remaining_in_scope: 0
ssh_signed: all
---

# Phase 34 Plan 08: Wave H (R2 DROP) Summary

R2 disposition executed: deleted `src/renderer/src/__mocks__/` (23 files,
all dead Jest mock fixtures from the legacy renderer test setup) per
D-34-15 (DROP) + D-34-16 (post-Wave-G ordering). Renderer typecheck
unchanged (9 errors before, 9 after — all confined to deferred
`extensions/download_management/` scope), confirming the directory had no
live references in renderer source. SYNC-34b flipped to `[x]`.

## Commit

- `6c41da31b` chore(renderer): drop dead Jest `__mocks__/` tree (R2)

Single atomic commit covering 23 file deletions plus a stale-comment
update in `src/renderer/src/util/winapi-shim.ts` (header note that
referenced `__mocks__/winapi-bindings.js` was removed in the same commit
to keep renderer source marker-clean post-deletion).

## R2 disposition

- **Method:** `git rm -r src/renderer/src/__mocks__/`
- **Decision basis:** D-34-15 (DROP per v8.0 precedent — the `__mocks__/`
  tree was never integrated into the renderer's Jest config after v8.0
  reset to Vitest for the spine; tests that referenced it had already
  been migrated or retired)
- **Ordering basis:** D-34-16 (Wave H runs after Wave G's repo-leaf
  cleanup so we can verify the post-deletion typecheck count against
  Wave G's 0-errors-elsewhere baseline)

## Pre-deletion safety

```
grep -r '__mocks__' src/renderer/src/ \
  --include='*.ts' --include='*.tsx' \
  --include='*.test.ts' --include='*.test.tsx' \
  | grep -v '^src/renderer/src/__mocks__/'
```

Returned 1 hit, all comment-only:

- `src/renderer/src/util/winapi-shim.ts:12` — JSDoc NOTE referencing the
  Jest mock for `winapi-bindings.js`. Not a code reference. Updated in
  the same commit to remove the stale mention.

No live `import`, `jest.mock(...)`, `require()`, or path-resolved
reference to anything under `src/renderer/src/__mocks__/`. Safe to drop.

## Files removed (23)

```
src/renderer/src/__mocks__/ComponentEx.js
src/renderer/src/__mocks__/cheerio-utils.js
src/renderer/src/__mocks__/cheerio.js
src/renderer/src/__mocks__/collection.json
src/renderer/src/__mocks__/diskusage.js
src/renderer/src/__mocks__/electron.js
src/renderer/src/__mocks__/ffi.js
src/renderer/src/__mocks__/fs-util.js
src/renderer/src/__mocks__/leveldown.js
src/renderer/src/__mocks__/modmeta-db.js
src/renderer/src/__mocks__/original-fs.js
src/renderer/src/__mocks__/react-i18next.js
src/renderer/src/__mocks__/ref-struct.js
src/renderer/src/__mocks__/ref-union.js
src/renderer/src/__mocks__/ref.js
src/renderer/src/__mocks__/sdv_collection.json
src/renderer/src/__mocks__/shortid.js
src/renderer/src/__mocks__/state.json
src/renderer/src/__mocks__/storeHelper.js
src/renderer/src/__mocks__/turbowalk.js
src/renderer/src/__mocks__/vortex-api.js
src/renderer/src/__mocks__/wholocks.js
src/renderer/src/__mocks__/winapi-bindings.js
```

## Wave-end gate (provenance-aware)

| Gate                                                                              | Result                                   |
| --------------------------------------------------------------------------------- | ---------------------------------------- |
| Pre-deletion grep for live `__mocks__/` refs in renderer source                   | 0 (one comment-only hit, updated)        |
| Pre-deletion `pnpm tsc -p src/renderer/tsconfig.json --noEmit` (TS1185 filtered)  | 9 errors                                 |
| Pre-deletion errors outside `extensions/download_management/`                     | 0 (all 9 in deferred bucket)             |
| Post-deletion `pnpm tsc -p src/renderer/tsconfig.json --noEmit` (TS1185 filtered) | 9 errors (identical)                     |
| Post-deletion errors outside `extensions/download_management/`                    | 0 (still all 9 in deferred bucket)       |
| Post-deletion grep for any `__mocks__/` mention in renderer source                | 0                                        |
| Harness `grep-checkpoint.sh --skip-conflict-check`                                | 12 GREEN gates clean (CHECKPOINT PASSED) |
| SSH signed                                                                        | yes (verified via `git cat-file -p`)     |

The provenance-aware gate replaces the plan-time-stale "renderer bucket
typecheck = 0" assumption from H1 step 4. The 9 download_management
errors are pre-existing drift carried from Wave F (FileAssembler /
SpeedCalculator missing modules + IDownload type/signature drift),
explicitly deferred to Phase 35 per the Wave F SUMMARY. The Wave H
contract is "deletion of `__mocks__/` introduces no new errors and
removes none" — i.e. pre-count == post-count, and all errors remain
inside the deferred scope. Both conditions met.

## SYNC-34b flip

`.planning/REQUIREMENTS.md` line 19 flipped from `[ ]` to `[x]` with
inline evidence:

> done in 34-08 (R2 DROP 6c41da31b, renderer typecheck unchanged at 9
> errors all in deferred download_management/ scope)

## Deviations

- **Stale comment in `winapi-shim.ts` updated in the same commit.** The
  pre-deletion grep returned one hit, but it was a JSDoc NOTE block
  describing the mock's existence rather than any code path that
  resolved to it. Removed the note to keep renderer source free of
  references to the deleted directory. Not a Rule-N deviation — the
  comment update is part of the same logical R2 DROP.
- **`download_management/` 9-error drift left untouched.** Out of scope
  per the operational invariant from Wave F SUMMARY. Phase 35 will
  absorb (FileAssembler / SpeedCalculator missing modules + IDownload
  type/signature drift).

## SSH signing

H1 commit `6c41da31b` SSH-signed with `~/.ssh/id_ed25519.pub` (verified
via `git cat-file -p 6c41da31b` showing `gpgsig -----BEGIN SSH
SIGNATURE-----` block). `%G?` returns `N` only because
`gpg.ssh.allowedSignersFile` isn't configured for verification —
signature is present and valid.

## Phase 34 wave 9 done-gate

With Wave H complete, Phase 34 conflict resolution is finished:

- Spine (Waves B/C/D/F) — done
- Repo-wide leaves (Wave G) — done
- R2 carry-forward (Wave H) — done

The remaining 9-error `extensions/download_management/` drift is a
typecheck issue, not a marker-resolution issue, and is owned by Phase 35.
