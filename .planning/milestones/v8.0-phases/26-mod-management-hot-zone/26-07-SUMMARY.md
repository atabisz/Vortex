---
phase: 26-mod-management-hot-zone
plan: 07
subsystem: mod_management
tags: [merge-resolution, linking-deployment, resolvePathCase, case-folding, 140a57217]
requires: [26-06]
provides:
    [
        "resolved LinkingDeployment.ts with all three resolvePathCase(dataPath, …) call sites preserved; gate 6 of grep-checkpoint.sh actively asserts ≥3 hits from this commit forward",
    ]
affects: ["src/renderer/src/extensions/mod_management/LinkingDeployment.ts"]
tech-stack:
    added: []
    patterns:
        [
            "fork-default stance for non-Linux-fix conflict regions: keep current fork formatting, drop upstream cosmetic alternative; D-26-02 hand-read discipline (grep-pre + region read + grep-post)",
        ]
key-files:
    created:
        - .planning/phases/26-mod-management-hot-zone/26-07-SUMMARY.md
    modified:
        - src/renderer/src/extensions/mod_management/LinkingDeployment.ts
decisions:
    - "Single conflict region at L465-491 (purge() body) was a pure formatting difference (Prettier multiline vs upstream inline Promise.resolve(fs.statAsync...)). Kept fork side (HEAD) per default stance and to keep diff minimal — no semantics, no rename, no Linux fix at stake in this region."
    - "The 140a57217 invariant (three resolvePathCase(dataPath, …) call sites at :523, :742, :799) sat OUTSIDE the conflict region — the resolution decision had zero risk of disturbing it. Confirmed by post-resolution grep landing on the exact line numbers the plan locked in."
    - "Renderer-wide pnpm typecheck is deferred (same Rule 3 deviation as plans 02-06): Tools/useToolsPage.ts and Tools/useToolsData.ts still carry unresolved conflict markers from plans 26-08+. File-scoped typecheck of LinkingDeployment.ts is clean (zero errors), which is what plan 26-07 is responsible for."
metrics:
    duration: ~6 minutes
    completed: 2026-05-15
---

# Phase 26 Plan 07: LinkingDeployment.ts Resolution Summary

Resolved the sole conflict region in `src/renderer/src/extensions/mod_management/LinkingDeployment.ts` (the hardlink/symlink deployment engine, sixth file in D-26-01 leaf-first order) — kept fork-side Prettier formatting in `purge()`, preserved all three `resolvePathCase(dataPath, …)` call sites that constitute the 140a57217 invariant.

## What Changed

One conflict region, lines 465–491 inside the `purge(installPath, dataPath, gameId?, onProgress?)` method:

```ts
// Fork (HEAD) — kept:
return Promise.resolve(
    fs
        .statAsync(dataPath)
        .then(() => this.purgeLinks(installPath, dataPath, onProgress))
        .then(() => this.postLinkPurge(dataPath, false, true, directoryCleaning))
        .then(() => undefined)
        .catch((err: unknown) => {
            if (getErrorCode(err) === "ENOENT") {
                return Promise.resolve(undefined);
            }
            return Promise.reject(err);
        }),
);

// Upstream (v2.0.0) — dropped:
return Promise.resolve(
    fs
        .statAsync(dataPath)
        .then(() => this.purgeLinks(installPath, dataPath, onProgress))
        .then(() => this.postLinkPurge(dataPath, false, true, directoryCleaning))
        .then(() => undefined)
        .catch((err: unknown) => {
            if (getErrorCode(err) === "ENOENT") {
                return Promise.resolve(undefined);
            }
            return Promise.reject(err);
        }),
);
```

Both forms are semantically identical — same chain, same error handling, same `directoryCleaning` arg. The fork side is the Prettier-formatted version that the rest of the file already conforms to. Picking it minimises noise against neighbouring code (CLAUDE.md memory: "Never reformat files outside the scope of a change").

## Per-Region Summary

| Region                               | Lines   | Side kept   | Rationale                                                                                 |
| ------------------------------------ | ------- | ----------- | ----------------------------------------------------------------------------------------- |
| `purge()` Promise.resolve formatting | 465–491 | HEAD (fork) | Pure cosmetic, fork form matches surrounding file style, no Linux fix or rename at stake. |

## Pre/Post Grep Counts

```
$ git grep -nE 'resolvePathCase\(dataPath,' src/renderer/src/extensions/mod_management/LinkingDeployment.ts
```

**Pre-resolution (with conflict markers in place, +13 lines from HEAD-side block):**

- :537 → `resolvePathCase(dataPath, relDataPath, dirCache)`
- :756 → `resolvePathCase(dataPath, relOutputPath, this.mReaddirCache)`
- :813 → `resolvePathCase(dataPath, relOutputPath, this.mReaddirCache)`
  → 3 hits ✓

**Post-resolution (resolved, line numbers settle):**

- :523 → `resolvePathCase(dataPath, relDataPath, dirCache)` — `externalChanges()` method, the call site 140a57217 added
- :742 → `resolvePathCase(dataPath, relOutputPath, this.mReaddirCache)` — deploy/finalise
- :799 → `resolvePathCase(dataPath, relOutputPath, this.mReaddirCache)` — deploy/finalise
  → 3 hits ✓ (matches plan's locked line numbers exactly)

## Arg-Shape Confirmation

All three sites carry the prefix-anchored `(dataPath, …)` shape that gate 6's regex `resolvePathCase\(dataPath,` requires. Fork-canonical names are intact: no upstream rename of `relDataPath` → `relativePath` or `dirCache` → `cache` leaked through.

## Verification

- `git grep '^<<<<<<< ' src/renderer/src/extensions/mod_management/LinkingDeployment.ts` → empty
- `bash .planning/phases/26-mod-management-hot-zone/scripts/grep-checkpoint.sh --skip-conflict-check` → exit 0, all 6 gates clean. Gate 6 explicit:
    > `OK:   140a57217 resolvePathCase(dataPath, …) in LinkingDeployment.ts (≥3 hits — locks :523, :742, :799)`
- File-scoped typecheck of LinkingDeployment.ts → zero errors
- Renderer-wide typecheck deferred (plans 02–06 deviation): Tools/useToolsPage.ts + Tools/useToolsData.ts still carry conflict markers from later plans 26-08+

## Deviations from Plan

None mechanical. One operational note: the renderer-wide `pnpm typecheck -F @vortex/renderer` is deferred (same Rule 3 stance plans 02–06 already documented), because OTHER files in the renderer still hold unresolved conflict markers from later plans in this phase. The plan's intent — that LinkingDeployment.ts itself typechecks cleanly — is satisfied.

## Commits

- `8dccd6255` — `resolve(mod-mgmt): LinkingDeployment.ts — keep fork-side Prettier formatting`

## Self-Check: PASSED

- LinkingDeployment.ts: conflict markers gone, 3 `resolvePathCase(dataPath, …)` hits at :523/:742/:799, file-scoped typecheck clean
- Commit `8dccd6255` exists in `git log`
- Gate 6 of `grep-checkpoint.sh` actively asserts the invariant from this commit forward
