---
phase: 30-land-tag
plan: 04
type: evidence
captured_at: 2026-05-22T05:50:00Z
captured_by: Wave 5 (30-04) inline execution
---

# Phase 30 Tag Evidence (SYNC-37)

## Header

```
Bare FF SHA (FF-merge invariant target)    = cf9a8a59980ee8166139913ee04a4ed8d3ab8860
Post-fix master SHA (canonical tag target) = f570149ea9554fe2d24b00b86e688855b845a4fe
Canonical tag                              = v2.0.0-linux-rebased
Annotated tag object SHA                   = 634a5cc1a912d13dc01761e76fd850a116afd7d5
```

## SYNC-37 — canonical tag created on post-fix master

### Initial tag attempt — landed on bare FF SHA, blocked by release pipeline

First pass tagged `cf9a8a599` (bare FF SHA, satisfying D-30-02 strict invariant). `git push refs/tags/v2.0.0-linux-rebased` triggered `release-linux.yml` run 26270240184 which **failed at step 16** (`pnpm run package:nosign` → typecheck) with the same 14 SYNC-32-D errors that 30-CI-EVIDENCE.md accepted as deviation against `Main` CI.

**Why the deviation didn't carry:** `Main` CI's per-PR build leg failing was acceptable because master shipped those errors before the rebase started — the rebase introduced zero new errors. But `release-linux.yml` is the actual release surface; it gates on a clean typecheck because broken types break the asset build. There's no upstream-restoration-precedent to deviation against here — the release pipeline doesn't care whose fault the errors are, only that they exist.

### User-authorized fix-in-v8.0

Interactive checkpoint: "Fix SYNC-32-D now in v8.0 milestone (Recommended)". Fix landed at `f570149ea` (one commit past bare FF SHA). See [30-MERGE-EVIDENCE.md § Post-FF amendment](./30-MERGE-EVIDENCE.md#post-ff-amendment--sync-32-d-fix-landed-mid-phase-30) for the full mechanic.

### Tag retag

```
$ git tag -d v2.0.0-linux-rebased
Deleted tag 'v2.0.0-linux-rebased' (was 0c1ae6b09)

$ git push git@github.com:atabisz/Vortex.git :refs/tags/v2.0.0-linux-rebased
 - [deleted]             v2.0.0-linux-rebased

$ git tag -s v2.0.0-linux-rebased HEAD -m "<updated annotation>"
$ git push git@github.com:atabisz/Vortex.git refs/tags/v2.0.0-linux-rebased
 * [new tag]             v2.0.0-linux-rebased -> v2.0.0-linux-rebased
```

### Tag annotation (post-fix)

```
object f570149ea9554fe2d24b00b86e688855b845a4fe
type commit
tag v2.0.0-linux-rebased
tagger Alex Tabisz <alex@tabisz.org> 1779428997 +1000

Vortex v2.0.0 Linux rebased — milestone v8.0 close.

Resolves upstream v2.0.0 sync (PR #4) onto Linux fork. 374 commits replayed
onto master HEAD via rebase, conflicts resolved fork-side by default;
downloader.test.ts taken upstream-side as Phase 25 SYNC-14 restoration pickup.

SYNC-32-D fix landed post-FF (commit f570149ea) to clear the 14 typecheck
errors that were riding on master since SYNC-14 — release-linux.yml gates on
clean typecheck so the fix had to land in v8.0 rather than v8.1. Tag points
at master HEAD post-fix, not the bare FF SHA (cf9a8a599) — D-30-02 invariant
relaxed accordingly, see 30-MERGE-EVIDENCE.md / 30-TAG-EVIDENCE.md.

Phase 29 evidence: .planning/phases/29-build-verification/29-DONE-GATE.md
Phase 30 evidence: .planning/phases/30-land-tag/30-DONE-GATE.md
```

### Signature verification

`git cat-file tag v2.0.0-linux-rebased | head -5` shows `-----BEGIN SSH SIGNATURE-----` block on the annotated tag object. Verification via `git tag -v` blocked by sandbox `gpg.ssh.allowedSignersFile` config restriction (same as Phase 29 RC tag); raw object inspection confirms signature presence.

### release-linux.yml run

- **Run**: <https://github.com/atabisz/Vortex/actions/runs/26270905415>
- **Triggered by**: tag push `v2.0.0-linux-rebased` → `f570149ea`
- **Conclusion**: **success**
- **Wall-clock**: ~12m25s (start 2026-05-22T05:50:08Z → published 2026-05-22T06:02:41Z)
- **Release URL**: <https://github.com/atabisz/Vortex/releases/tag/v2.0.0-linux-rebased>
- **Release name**: `Linux Beta v2.0.0-linux-rebased`

### Asset SHA256s (canonical, locally re-hashed)

```
f458092a3e19c16896e89c38c0cac14e6226f003868a66604032bdf605229eeb  vortex-setup.AppImage      (258928186 bytes / 247 MiB)
414681b5a89f077c803a4ec11fde5b8265dc0dcb38db599d0841e6b14c5d368c  vortex_amd64.deb           (158158200 bytes / 151 MiB)
25a3e6aff4a9e091b224f3f2b177086cc83b86cbb817284cc8514d5d01174ef1  latest-linux.yml           (559 bytes)
```

Captured to `~/Downloads/vortex-canonical/canonical-sha256.txt` (gitignored asset directory). Wave 6 (30-05) smoke runs the AppImage at this exact SHA against Skyrim deploy/purge/gamemode + 4-screenshot walkthrough; the SHA proves the smoke build matches what end users will download.

## Result

**SYNC-37: PASS**

- Canonical tag `v2.0.0-linux-rebased` recreated on post-fix master HEAD `f570149ea` after the bare-FF-SHA tag failed `release-linux.yml`'s typecheck gate.
- D-30-02 invariant relaxed from "tag on bare FF SHA" to "tag on bare FF SHA + minimum SYNC-32-D fix needed to clear release pipeline" — full justification in [30-MERGE-EVIDENCE.md](./30-MERGE-EVIDENCE.md).
- D-30-03 cherry-pick range upper bound for Wave 7 (30-06) extends to `f570149ea`.
- SSH-signed annotated tag (`634a5cc1a`) pointing at the exact SHA Wave 6 (30-05) will smoke-test against and Wave 7 (30-06) will cherry-pick to `linux-port`.
- `release-linux.yml` published AppImage (247 MiB) + .deb (151 MiB) at deterministic SHA256s captured above; downstream waves (30-05 smoke, 30-08 done-gate) compare against these.
