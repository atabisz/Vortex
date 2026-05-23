# Phase 36 Done Gate — v2.0.1-linux-rebased landed

**Status:** GREEN (7/7)
**Closed:** 2026-05-23

## Summary

Phase 36 landed the v8.1/config-bucket branch onto fork/master via a **Path C
forward-sync 3-way merge** (per `36-RESEARCH-FORWARD-SYNC.md`). v8.1's base
mismatch (memory `project_v8_1_base_mismatch.md`: branch base `d4c0d0da5`
predates v8.0's v2.0.0-linux work on master) made literal FF unreachable.
Two prior attempts collapsed: `--rebase-merges` halted at central upstream-
merge `aa3faf7e5` with 403 conflicts; the surgical squash strategy halted at
Stage A5 with the same foundational mismatch surfaced from a different angle.
The Path C 3-way merge produced 12 conflict files / 2 real code conflicts;
operator-accepted the D-36-01 substitution "FF-merge" → "merge --no-ff to
land" (AskUserQuestion 2026-05-23). Merge commit `c4d1b4555` — 1st parent
`d494bcb7d` (master tip); 2nd parent `f1425a5c8` (v8.1/config-bucket tip).
Phase 32-35 atomic SHAs `e2127cecb..f1425a5c8` survive in the 2nd-parent
ancestry. Original 656-commit v8.1/config-bucket history preserved at the
safety tag `phase36/pre-surgical-snapshot` (= `f1425a5c8`).

FF-pushed the merge commit to fork/master via lease pin; PR #5 auto-MERGED on
push (head reachable via 2nd-parent ancestry) with casual-voice redirect
comment. main.yml on the merge commit: Linux pre-commit gates locally GREEN
(typecheck/lint/test/build/build-extensions, all exit 0); Windows-latest job
hit a pre-existing `skip-on-windows.mjs` ELIFECYCLE on `gamebryo-ba2-support`
that also reproduces on pre-merge master (`f570149e`) — operator-accepted as
a non-Phase-36 regression. Stamped SSH-signed `v2.0.1-linux-rebased` on the
merge HEAD, dual-pushed the tag (fork triggered release-linux.yml; origin
push REJECTED by upstream policy, expected per `project_upstream_pr_policy.md`).
release-linux.yml run `26323706583` produced AppImage + .deb + SHA256 evidence
in 11m 37s. Cherry-picked the path-filtered Linux subset (`--no-merges`
excludes the Wave 1 merge + 119 v8.1 PR-merges) onto linux-port: 407
candidates → 52 clean, 12 auto-resolved (--ours), 324 skipped (empty/dedup);
2 fix-up commits added on top to resolve cherry-induced regressions. Renderer
typecheck post-Wave-5 = 2 errors (4 better than the 6-error pre-Wave-5
baseline; both remaining errors are pre-existing module-resolution gaps).

The major behavioural delta from v8.0 was the landing path: ROADMAP criterion
#1 wording was "fast-forward merged" verbatim, but v8.1's base mismatch made
that unreachable; Path C is the cleanest path that preserves the Phase 35
evidence chain in addressable form.

## SYNC-36a — Path C forward-sync merge + PR #5 close

(Captured by Waves 1 + 2; see `36-REBASE-NOTES.md` for per-conflict detail.)

- **Path C 3-way merge** (replaces `--rebase-merges` and surgical squash):
    - Merge commit: `c4d1b4555c06f4b549b2c2169a754918edb64530`
    - 1st parent: `d494bcb7d090bdf311f8e5b1cc7cfb418b009726` (master tip pre-merge)
    - 2nd parent: `f1425a5c810794b8325db624d97da9abc106ad90` (v8.1/config-bucket / Phase 35 close)
    - Conflicts: 12 files (2 real code, 1 test, 9 docs); resolved per `36-REBASE-NOTES.md` table
    - Bluebird scan: 1 file (`gamebryo-plugin-management/src/index.ts`) — HEAD-wins, no `:Promise<T>` introduced
    - api.d.ts / vortex.api.md / Dependency Report.md: discarded to HEAD per D-36-11
- **Pre-commit SYNC-35a..d gates:** all GREEN (typecheck/lint:ci/test/build/build:extensions exit 0); bundledPlugins floor preserved
- **Snapshot tags:** `phase36/master-pre-merge` = `d494bcb7d` (Wave 1 Stage 0); `phase36/pre-surgical-snapshot` = `f1425a5c8` (carry-forward) ✅
- **FF push:** lease-pinned `fork/master = d717c09c3` → `c4d1b4555` ✅
- **main.yml on merge commit ([run #26322685477](https://github.com/atabisz/Vortex/actions/runs/26322685477)):**
    - `build (ubuntu-latest)` — cancelled by workflow fail-fast; Linux pre-commit gates locally GREEN
    - `build (windows-latest)` — failure (pre-existing `skip-on-windows.mjs` ELIFECYCLE on `gamebryo-ba2-support`; identical failure on pre-merge master `f570149e` [run #26270884452](https://github.com/atabisz/Vortex/actions/runs/26270884452); operator-accepted as non-Phase-36 regression)
    - `api` — skipped (gated `github.repository == 'Nexus-Mods/Vortex'`, expected on fork)
- **PR #5:** state MERGED (auto-closed 2026-05-23T03:48:43Z; PR head `8054a935b` reachable via 2nd-parent ancestry); redirect comment [#issuecomment-4524174105](https://github.com/atabisz/Vortex/pull/5#issuecomment-4524174105) references merge SHA + Phase 35 evidence pointer + rollback tags + CI triage URLs

## SYNC-36b — SSH-signed canonical tag

(Captured by Wave 3.)

- **Tag:** `v2.0.1-linux-rebased` (annotated, SSH-signed via `~/.ssh/id_ed25519`)
- **Tag-object SHA:** `dbef023387a1140c914b511dfa997b56c66fca28`
- **Target commit:** `c4d1b4555c06f4b549b2c2169a754918edb64530` (= Wave 1 merge commit)
- **Body anchors:**
    - `c4d1b4555` — merge SHA
    - `d494bcb7d` — 1st parent / pre-merge master tip
    - `f1425a5c8` — 2nd parent / v8.1/config-bucket tip
    - `f25ff55da` — upstream `v2.0.1` (reachable via 2nd-parent ancestry through `aa3faf7e5`)
    - `e2127cecb..f1425a5c8` — Phase 32-35 atomic-commit range
    - `phase36/pre-surgical-snapshot` — rollback safety tag (= `f1425a5c8`)
- **`git tag -v` exit 0** ✅ (`Good "git" signature for alex@tabisz.org with ED25519 key SHA256:rZjFFKESAOV69TJWFlDoh/mz5xtoklS5CpPOL442wKc`)
- **Push to fork:** OK ✅
- **Push to origin (Nexus-Mods/Vortex):** REJECTED (`Permission to Nexus-Mods/Vortex.git denied to atabisz` — expected per `project_upstream_pr_policy.md`; non-blocking)

### Side note: gpg.ssh.allowedSignersFile bootstrap

`git tag -v` initially errored with `gpg.ssh.allowedSignersFile needs to be configured`. Wave 0's signing-config check verified `gpg.format=ssh` + `tag.gpgsign=true` + `user.signingkey`, but didn't assert the verifier-side allowed_signers file. Created `~/.config/git/allowed_signers` with `alex@tabisz.org ssh-ed25519 ...` line; set `git config --global gpg.ssh.allowedSignersFile ~/.config/git/allowed_signers`. Sig now verifies. The tag itself was correctly signed throughout — only the verifier setup was missing.

## SYNC-36c — Cherry-pick to linux-port

(Captured by Wave 5; see `36-CHERRY-PICK-NOTES.md` for per-cherry detail.)

- **Range:** `merge-base(linux-port, master) = 538aef374..c4d1b4555` (post-merge master)
- **Filter applied (Path C — RESEARCH-FORWARD-SYNC §4 Stage 9):** `--no-merges` (excludes Wave 1 merge commit + 119 v8.1 PR-merges + any v2.0.0-linux merges)
- **Wave 1 merge SHA excluded:** `c4d1b4555`
- **Candidates after path-filter + `--no-merges` + patch-id dedup:** 407
- **Cherry-pick loop result:**
    - Clean apply: 52
    - Auto-resolved (`--ours` HEAD-wins; api.d.ts auto-discard per D-36-11): 12
    - Skipped (empty / dedup against linux-port): 324
    - Total commits added by loop: 66 (loop end SHA `709c87193`)
- **Wave 5 fix-up commits (atop loop end):**
    - `31c8ad3e4` — `revert(36-05): restore DownloadManager.ts on linux-port (Wave 5 fixup)` — reverts cherry `1c0f8dd00`; that cherry deleted DownloadManager.ts but left DownloadObserver.ts orphaned (formatter cherry `156e47c18` was first; `--ours` preserved Observer when the delete-cherry hit). Cleared 28 orphan-consumer typecheck errors.
    - `799ad300f` — `fix(36-05): bump @nexusmods/nexus-api to 1.6.0 — pick up workspace/lock hunks dropped by cherry 76363129e` — cherry `76363129e` (master `4cb8d3fc5` "surface GraphQL error path/location/query") only carried `util.ts` + `eventHandlers.ts` hunks; the `pnpm-workspace.yaml` (+2/-2) + `pnpm-lock.yaml` (+50/-50) hunks were dropped. Bumped both nexus-api pins from `4192c0c9` / `d16099d8` → `4dd3460c2d02d93ba8f1bbeeeb2c5fa9af039a67` (1.6.0); regenerated lockfile. Cleared 6 TS2339 errors at `nexus_integration/util.ts:1139-1141`.
- **Renderer typecheck deltas:**

    | State                             | error count | notes                                                                           |
    | --------------------------------- | ----------- | ------------------------------------------------------------------------------- |
    | pre-Wave-5 baseline (`6a28945d1`) | 6           | pre-existing module-resolution + arity gaps                                     |
    | post-cherry-loop (`709c87193`)    | 34          | 28 orphan-Observer + 6 GraphError                                               |
    | post-revert (`31c8ad3e4`)         | 8           | 6 baseline + 2 GraphError (down from 6 — partial loop fix)                      |
    | post-bump (`799ad300f`)           | **2**       | both pre-existing module-resolution gaps; **net 4 errors better than baseline** |

- **Total commits added to linux-port:** 68 (66 cherries + 2 fix-ups)
- **linux-port advanced:** `6a28945d1` → `799ad300f`
- **Pushed to fork via FF (plain push, no force):** ✅ `6a28945d1..799ad300f`
- **Both fix-up commits SSH-signed:** verified via `git log %G?` = `G` and `gpgsig` header present

## SYNC-36d — release-linux.yml smoke

(Captured by Wave 4.)

- **Run URL:** [https://github.com/atabisz/Vortex/actions/runs/26323706583](https://github.com/atabisz/Vortex/actions/runs/26323706583)
- **Run conclusion:** success
- **Run duration:** 11m 37s (697 s) — within v8.0 RC baseline band (10m 58s)
- **Retries:** 0 — clean first-run; pnpm node-gyp chmod step (Pitfall 9) executed without flake
- **All 26 build steps:** success (24 ran, 2 skipped: `Update latest-linux tag`, `Create GitHub Release (master rolling)` — version-tag path took the alternate `Create GitHub Release (version tag)` step)
- **Release page:** [https://github.com/atabisz/Vortex/releases/tag/v2.0.1-linux-rebased](https://github.com/atabisz/Vortex/releases/tag/v2.0.1-linux-rebased)
- **Release name:** Linux Beta v2.0.1-linux-rebased
- **Published at:** 2026-05-23T04:52:29Z

### Assets

| Name                    | Size          | SHA256                                                             | SHA512 source      |
| ----------------------- | ------------- | ------------------------------------------------------------------ | ------------------ |
| `vortex-setup.AppImage` | 258 768 724 B | `13aa29288e8936a4dd7cdc3c9f3f669d15c7c65d3d416efee8ab2ba957059c9b` | `latest-linux.yml` |
| `vortex_amd64.deb`      | 158 044 146 B | `3d82353963d3625865bcd9281862172ede2a6f860812cc52579f1c1d7b22f3a6` | `latest-linux.yml` |
| `latest-linux.yml`      | 559 B         | (electron-updater manifest)                                        | self               |

**SHA source:** local-hash (D-36-09 boundary path — release exposes SHA512 via electron-updater `latest-linux.yml`; SHA256 obtained by `sha256sum` on downloaded artifacts; D-36-09 prohibits _running_ binaries, not hashing them).

**SHA512 cross-check (from `latest-linux.yml`, base64-encoded):**

- AppImage: `dmhP/kbpH42h8WV0V0LPGERUS577qvW9GeRY+6Ee4Yhbs+Nxd0BO/gH+JfJr7Hb3v5n70CpnEaBVN4G7p0LFTg==`
- .deb: `VVbfUJpA1UH99sZH+tlh8yLv9p5w9IN6MsTgHVNGhzA2aDO15RKrpxpyRlnQof1/0StS68OdQqvjE0l20s6fDg==`

**electron-builder version path:** internal version `1.16.202605230443` (electron-builder timestamp scheme); release tag `v2.0.1-linux-rebased` is the canonical user-visible identifier.

### Phase 37 carry-forward

Local-boot AppImage + .deb verification and 4-screenshot Skyrim walkthrough explicitly deferred to Phase 37 SYNC-37a per D-36-09. Phase 36 closes on CI-smoke evidence only (build + asset publish + manifests + SHA256). Operator UAT happens in Phase 37.

## State table

| Ref                               | Pre-Phase-36 | Post-Phase-36                                                                     |
| --------------------------------- | ------------ | --------------------------------------------------------------------------------- |
| local v8.1/config-bucket          | f1425a5c8    | f1425a5c8 (unchanged; preserved as 2nd-parent ancestor of merge)                  |
| local v8.1/config-bucket-fwd      | (none)       | c4d1b4555 (Wave 1 working branch; can prune)                                      |
| fork/master                       | d717c09c3    | c4d1b4555 (Wave 1 merge) → 3e503fb60 (Wave 6 closeout commit atop)                |
| fork/sync/upstream-v2.0.1         | 8054a935b    | 8054a935b (unchanged; reachable via merge 2nd-parent ancestry; default: retained) |
| fork/linux-port                   | 6a28945d1    | 799ad300f (cherry-picked; --no-merges filter; +2 Wave 5 fix-ups)                  |
| tag v2.0.1-linux-rebased          | (none)       | annotated SSH-signed @ c4d1b4555 (tag-object `dbef02338`)                         |
| tag phase36/master-pre-merge      | (none)       | d494bcb7d (Wave 1 Stage 0 rollback safety; local)                                 |
| tag phase36/pre-surgical-snapshot | (none)       | f1425a5c8 (rollback safety from prior surgical attempt; local)                    |

## 7-criterion gate

| #   | Criterion                                                                                                                                                              | Status | Evidence                                                                                    |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------- |
| 1   | Path C forward-sync merge + pre-commit SYNC-35a..d gates green; merge commit SSH-signed with 2 parents                                                                 | ✅     | `36-REBASE-NOTES.md` Forward-sync section + `artifacts/post-merge-*.txt`                    |
| 2   | Merge commit FF-pushed to fork/master via lease pin; PR #5 MERGED with redirect comment; main.yml Linux locally GREEN (Windows pre-existing failure operator-accepted) | ✅     | `gh pr view 5` MERGED + `artifacts/main-yml-runs.json` + post-push fork/master == merge SHA |
| 3   | `v2.0.1-linux-rebased` SSH-signed; pushed to fork (origin REJECTED per upstream policy, non-blocking); body references merge SHA + parents + upstream anchor           | ✅     | `git tag -v` exit 0 + Wave 3 push receipts                                                  |
| 4   | release-linux.yml green; AppImage + .deb + SHA256s captured                                                                                                            | ✅     | Run URL `26323706583` + `release-smoke/`                                                    |
| 5   | linux-port cherry-pick (`--no-merges` filter; both parent ancestries) + 2 fix-ups + push; post-cherry typecheck = 2 errors (4 better than baseline)                    | ✅     | `36-CHERRY-PICK-NOTES.md` SYNC-36c section                                                  |
| 6   | All Phase 36 docs committed (`git add -f`) including CONTEXT.md inversion fix + Path C deviation note + superseded-wave renames                                        | ✅     | this commit                                                                                 |
| 7   | Done-gate review approved                                                                                                                                              | ✅     | Phase 36 close 2026-05-23                                                                   |

## Carry-forward to Phase 37

- **SYNC-37a** — local-boot AppImage + .deb verification + 4-screenshot Skyrim walkthrough (D-36-09 explicit deferral).
- **SYNC-37b** — `VORTEX-LINUX-MERGE-PLAYBOOK.md` post-mortem update with v8.1 deltas (D-36-10) — should now include the Path C forward-sync pattern as a reusable response to the "branch base predates downstream work" anti-pattern (codified from the 403-conflict `--rebase-merges` halt + Stage A5 surgical halt + Path C win).

Phase 36 closed.
