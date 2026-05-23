---
phase: 36
wave: 4
plan_id: 36-04
title: "Wave 4 — release-linux.yml smoke evidence (SYNC-36d)"
branch: master
requirement_ids:
    - SYNC-36d
dependencies:
    - 36-03 # tag pushed; release-linux.yml triggered
estimated_commits: 0
---

# Wave 4 — Watch release-linux.yml to green; capture AppImage + .deb SHA256s

## Goal

Block until `release-linux.yml` (triggered by Wave 3 tag push) reaches `success` conclusion. Capture the run URL, asset list, and AppImage + .deb SHA256s into the done-gate. **NO local boot, NO Skyrim walkthrough, NO screenshots** — those are Phase 37 SYNC-37a per D-36-09. This is CI-smoke evidence only.

References: see `36-CONTEXT.md` D-36-09; `36-RESEARCH.md` §2 Pattern 4, §3 Pitfall 9, §6 Assumption A11; v8.0 RC tag run [26259632336](https://github.com/atabisz/Vortex/actions/runs/26259632336) as empirical baseline (10m58s pipeline).

## Tasks

1. **Resume the run ID captured in Wave 3.**
    - From `36-DONE-GATE.md` SYNC-36b section.
    - Defensive re-fetch:
        ```
        RUN_ID=$(gh run list --repo atabisz/Vortex \
          --workflow="Release Linux (AppImage + deb)" \
          --branch v2.0.1-linux-rebased --limit 1 \
          --json databaseId --jq '.[0].databaseId')
        ```

2. **Watch the run to conclusion.**
    - `gh run watch "$RUN_ID" --repo atabisz/Vortex --exit-status`
    - `--exit-status` makes gh exit non-zero on failure conclusion — surfaces as task failure cleanly.
    - Expected wall-clock: ~11 min (v8.0 RC baseline 10m58s; v2.0.1 should be similar; no workflow changes since v8.0).

3. **On retryable failure (Pitfall 9 — pnpm node-gyp chmod), retry up to 2x.**
    - Symptom: install step fails with `Permission denied` exit 126.
    - Recovery: `gh run rerun "$RUN_ID" --repo atabisz/Vortex` then re-watch.
    - After 2 retries, escalate.

4. **Capture release-page metadata.**
    - `gh release view v2.0.1-linux-rebased --repo atabisz/Vortex --json url,assets,publishedAt`
    - Extract: release URL, list of assets (name + size), publishedAt.

5. **Capture AppImage + .deb SHA256s.**
    - **Preferred path (A11 happy):** download SHA256 manifest if present in release assets (`gh release download v2.0.1-linux-rebased --repo atabisz/Vortex --pattern '*.sha256*' --pattern 'SHA256*' --dir <artifacts-dir>`).
    - **Fallback path (A11 unhappy — softprops/action-gh-release omits SHA manifest):** extract from CI run logs (electron-builder prints SHAs during the build step). Use `gh run view "$RUN_ID" --repo atabisz/Vortex --log` and grep for `sha256` near AppImage / deb file names.
    - **Last-resort path:** `gh release download` the AppImage + .deb themselves and `sha256sum` locally — this technically lands one foot in Phase 37 territory (download), but D-36-09's "no local boot" rule is about running the binaries, not hashing them. If both prior paths fail, this is acceptable; document the path chosen.

6. **Append `## SYNC-36d — release-linux.yml smoke` section to `36-DONE-GATE.md`.**

## Verification commands

```bash
# Task 1 — re-fetch RUN_ID (defensive)
RUN_ID=$(gh run list --repo atabisz/Vortex \
  --workflow="Release Linux (AppImage + deb)" \
  --branch v2.0.1-linux-rebased --limit 1 \
  --json databaseId --jq '.[0].databaseId')
echo "Run ID: $RUN_ID"
test -n "$RUN_ID" || { echo "No run found — Wave 3 tag push may have failed"; exit 1; }

# Task 2 — watch to conclusion
gh run watch "$RUN_ID" --repo atabisz/Vortex --exit-status

# Capture conclusion + duration
gh run view "$RUN_ID" --repo atabisz/Vortex \
  --json conclusion,createdAt,updatedAt,url \
  --jq '{conclusion, url, duration_seconds: ((.updatedAt | fromdateiso8601) - (.createdAt | fromdateiso8601))}'

# Task 3 — retry path on Pitfall 9 (only if conclusion != success)
# gh run rerun "$RUN_ID" --repo atabisz/Vortex
# gh run watch "$RUN_ID" --repo atabisz/Vortex --exit-status
# (allow up to 2 retries; escalate if still failing)

# Task 4 — release-page metadata
mkdir -p .planning/phases/36-land-tag-cherry-pick-v2-0-1/release-smoke
cd .planning/phases/36-land-tag-cherry-pick-v2-0-1/release-smoke
gh release view v2.0.1-linux-rebased --repo atabisz/Vortex \
  --json url,name,publishedAt,assets > release-info.json
gh release view v2.0.1-linux-rebased --repo atabisz/Vortex \
  --json assets --jq '.assets[] | "\(.name) \(.size) bytes"' > assets.txt
cat assets.txt

# Task 5 — SHA256s (preferred path)
gh release download v2.0.1-linux-rebased --repo atabisz/Vortex \
  --pattern '*.sha256*' --pattern 'SHA256*' --dir . 2>/dev/null \
  || echo "No SHA256 manifest in release assets — falling back to CI logs"

# Fallback: scrape from CI logs
if ! ls *.sha256* >/dev/null 2>&1; then
  gh run view "$RUN_ID" --repo atabisz/Vortex --log \
    | grep -iE 'sha256.*(AppImage|\.deb)' > ci-shas.txt \
    || echo "No SHAs in CI log either — last-resort: hash assets locally"
fi

# Last resort: hash locally (D-36-09 boundary — hashing is fine; running is not)
if ! ls *.sha256* >/dev/null 2>&1 && [ ! -s ci-shas.txt ]; then
  gh release download v2.0.1-linux-rebased --repo atabisz/Vortex \
    --pattern '*.AppImage' --pattern '*.deb' --dir .
  sha256sum *.AppImage *.deb > local-shas.txt
  cat local-shas.txt
fi

cd "$(git rev-parse --show-toplevel)"
```

## Artifact emission

Append to `.planning/phases/36-land-tag-cherry-pick-v2-0-1/36-DONE-GATE.md`:

```markdown
## SYNC-36d — release-linux.yml smoke

- **Run URL:** https://github.com/atabisz/Vortex/actions/runs/<RUN_ID>
- **Run conclusion:** success
- **Run duration:** <Xm Ys> (v8.0 RC baseline: 10m58s)
- **Retries:** <0 | 1 | 2> (Pitfall 9 chmod flake mitigation, if any)
- **Release page:** https://github.com/atabisz/Vortex/releases/tag/v2.0.1-linux-rebased
- **Published at:** <utc-iso>

### Assets (from `gh release view`)

| Name                         | Size    | SHA256                 |
| ---------------------------- | ------- | ---------------------- |
| Vortex-<version>.AppImage    | <bytes> | <sha256>               |
| vortex\_<version>\_amd64.deb | <bytes> | <sha256>               |
| <other>                      | <bytes> | <sha256 if applicable> |

**SHA source:** release-asset-manifest | CI-log-scrape | local-hash (D-36-09 boundary path)

### Phase 37 carry-forward

Local-boot AppImage + .deb verification and 4-screenshot Skyrim walkthrough
explicitly deferred to Phase 37 SYNC-37a per D-36-09. Phase 36 closes on
CI-smoke evidence only.
```

Files staged on disk under `.planning/phases/36-land-tag-cherry-pick-v2-0-1/release-smoke/` (gitignored; Wave 6 commits via `git add -f`):

- `release-info.json` — full `gh release view` output
- `assets.txt` — name + size table
- `*.sha256*` if downloaded, OR `ci-shas.txt`, OR `local-shas.txt` depending on path

## Commits

**Zero commits in Wave 4.** Smoke evidence is captured to gitignored artifacts; Wave 6 done-gate commits everything via `git add -f`.

## Risks / contingencies

- **R-36-06 — release-linux.yml flake (Pitfall 9 chmod).** Allow 2 retries via `gh run rerun`. After 2 retries still failing, escalate — likely a real workflow regression that Wave 0 missed.
- **Run never starts.** If the `gh run list` query returns empty even after `sleep 30`, the tag-push event may not have registered. Re-trigger by re-pushing the tag (`git push --force <fork> v2.0.1-linux-rebased` — annotated tags are immutable but force-push of the same SHA is a no-op for force-with-lease semantics; clean re-trigger via delete + re-push if necessary).
- **A11 — no SHA256 manifest in release assets, no SHAs in CI logs.** Fall back to local hash via `sha256sum`. D-36-09 prohibits _running_ the binaries (boot/screenshot work), not hashing them. Document the path chosen.
- **softprops/action-gh-release@v2 changes asset format.** Should be unchanged since v8.0 RC; if the release page lacks expected assets, investigate the workflow's release step.
- **`gh release view` returns assets but the AppImage/.deb file names differ from v8.0 RC.** Capture whatever names appear; the SYNC-36d contract is "AppImage + .deb with SHA256 manifest", not specific filenames. Document the actual names in the asset table.
- **Workflow takes substantially longer than 11min.** Not a failure; just wait. `gh run watch --exit-status` will block. Operator can `Ctrl+C` and re-poll later if needed; restart with the same RUN_ID.

## Done criteria

1. `release-linux.yml` run on `v2.0.1-linux-rebased` reached conclusion=success (with up to 2 retries on Pitfall 9 flake).
2. Run URL and duration captured in `36-DONE-GATE.md`.
3. Release page URL captured.
4. Asset list (name + size) captured.
5. AppImage + .deb SHA256s captured (via manifest, CI logs, or local hash — path documented).
6. Phase 37 carry-forward (local boot, screenshots) explicitly deferred in writing.
7. SYNC-36d closed; Wave 5 (cherry-pick) unblocked.
