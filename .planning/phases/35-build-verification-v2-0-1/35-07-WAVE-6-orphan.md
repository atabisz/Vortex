---
phase: 35
wave: 6
plan_id: 35-07
title: "Wave 6 — orphan reconcile (SYNC-35e)"
branch: v8.1/config-bucket
requirement_ids:
    - SYNC-35e
dependencies:
    - 35-06 # Wave 5 build must be green
estimated_commits: 1
---

# Wave 6 — Delete orphan `src/main/electron-builder.config.json`

## Goal

Close SYNC-35e (R3 carry-forward from 31-01-SUMMARY): delete the genuinely-orphan `src/main/electron-builder.config.json` (added by upstream v2.0.1, never referenced by the actual `package` / `package:nosign` scripts which both use `electron-builder.config.cjs`), and remove the corresponding line from `structure.md:27`. One SSH-signed `chore(electron-builder)` commit.

References: see `35-CONTEXT.md` D-35-04 (locked: delete + pre-deletion check); `35-RESEARCH.md` §4 Wave 6 surface (confirms orphan-ness + identifies `structure.md:27` as the only doc reference; flatpak yaml line 109 references a different filename and is out of scope).

## Tasks

1. **Pre-deletion repo-wide reference audit.**
    - Re-run the D-35-04 grep at HEAD. Expected: only `structure.md:27` (doc reference) and `flatpak/com.nexusmods.vortex.yaml:109` (different filename — `electron-builder-config.json`, hyphenated, not the orphan target).
    - If any new live reference shows up (CI workflow, build script, etc.), abort and re-plan Wave 6 to add the rewire alongside the delete.

2. **Confirm `package` + `package:nosign` scripts use `.cjs`.**
    - `src/main/package.json` `package` and `package:nosign` reference `./electron-builder.config.cjs`. If anything has drifted, document and adjust.

3. **`git rm` the orphan + edit `structure.md`.**
    - `git rm src/main/electron-builder.config.json`.
    - Remove the bullet at `structure.md:27` listing the now-deleted file. Minimize-diff: delete the line cleanly, do not refresh surrounding doc structure.

4. **Commit.**
    - Title: `chore(electron-builder): drop orphan v2.0.1 config.json — superseded by .cjs`
    - Body: Pattern S5 — pre-deletion audit receipt + script-level confirmation + structure.md line removal. Note explicitly that `flatpak/com.nexusmods.vortex.yaml:109` references a _different_ filename (`electron-builder-config.json`, hyphenated) and is out of scope for SYNC-35e.
    - SSH-signed (`~/.ssh/id_ed25519`). NEVER `--no-verify`.

5. **Post-commit verification.**
    - SSH-sig audit: `git cat-file -p HEAD | grep -c '^gpgsig '` ≥ 1.
    - Repo-wide reference audit: zero hits for `electron-builder.config.json` (dotted) outside `.planning/`.
    - `pnpm package:nosign` smoke (script-level only — full AppImage build is Phase 36 release-linux.yml). Confirm the script enters electron-builder without complaining about a missing `.json`. If full `pnpm package:nosign` is heavy in this sandbox, a lighter validator is `pnpm -F @vortex/main run package:nosign --help` or just ensuring the npm-script line resolves; document the smoke evidence in `35-VERIFY-RESULTS.md`.

6. **Append `## Orphan reconcile (SYNC-35e)` section to `35-VERIFY-RESULTS.md`.**

## Verification commands

```bash
# Task 1 — pre-deletion audit (D-35-04 verbatim)
rg -n "electron-builder\.config\.json" \
  -g '!.planning/**' \
  -g '!**/node_modules/**' \
  -g '!**/out/**' \
  -g '!**/dist/**'
# Expected: structure.md:27 + flatpak/com.nexusmods.vortex.yaml:109 (different filename — out of scope)

# Task 2 — confirm package scripts
grep -nE '"(package|package:nosign)":' src/main/package.json
# Expected: both reference electron-builder.config.cjs (NOT .json)

# Task 3 — the delete
git rm src/main/electron-builder.config.json

# structure.md:27 line removal — use a precise sed or hand-edit. Example sed (verify before running):
#   sed -i '/`src\/main\/electron-builder\.config\.json`: electron-builder packaging config/d' structure.md
# Then verify:
grep -n 'electron-builder.config.json' structure.md
# Expected: no output

# Task 4 — commit
git commit -S -m "chore(electron-builder): drop orphan v2.0.1 config.json — superseded by .cjs

src/main/electron-builder.config.json was added by upstream v2.0.1 with no conflict marker
(pure addition during Phase 31 config bucket merge). Pre-deletion audit confirms genuine
orphan: src/main/package.json scripts \`package\` and \`package:nosign\` both use
./electron-builder.config.cjs; no CI workflow, build script, or runtime path reads the .json.

The 31-01-SUMMARY pickup note hedged on deletion (\"do not delete in v8.1\") because Phase 31
lacked the bandwidth to verify orphan-ness. Phases 31–34 closeout has now confirmed it.
Deleting reduces the diff against linux-port and removes ambiguity for future syncs.

Also drops the documentation bullet at structure.md:27 that listed the now-deleted file.

Note: flatpak/com.nexusmods.vortex.yaml:109 references a DIFFERENT filename
(\`electron-builder-config.json\`, hyphenated) — out of scope for this commit; tracked as
follow-up if the flatpak build needs revisiting.

Refs: D-35-04, SYNC-35e (R3 carry-forward from 31-01-SUMMARY).
"

# Task 5 — post-commit verification
git cat-file -p HEAD | grep -c '^gpgsig '
# Expected: ≥ 1

rg -n "electron-builder\.config\.json" \
  -g '!.planning/**' \
  -g '!**/node_modules/**' \
  -g '!**/out/**' \
  -g '!**/dist/**'
# Expected: only flatpak/com.nexusmods.vortex.yaml:109 (different hyphenated filename)

# Smoke: confirm pnpm package:nosign at least resolves the script entry without complaining
pnpm -F @vortex/main run package:nosign --help 2>&1 | head -20 \
  || pnpm package:nosign --dry-run 2>&1 | head -20
# Document whatever resolves cleanly. Full package build is Phase 36 release-linux.yml.
```

## Artifact emission

Append to `.planning/phases/35-build-verification-v2-0-1/35-VERIFY-RESULTS.md`:

```markdown
## Orphan reconcile (SYNC-35e)

**Date:** <utc-iso>
**Status:** PASS
**Commit:** <sha> `chore(electron-builder): drop orphan v2.0.1 config.json — superseded by .cjs`

### Pre-deletion audit (D-35-04)

- `src/main/electron-builder.config.json` referenced by: `structure.md:27` (doc only) + zero live consumers.
- `src/main/package.json` `package` + `package:nosign` both use `./electron-builder.config.cjs`.
- `flatpak/com.nexusmods.vortex.yaml:109` references the hyphenated `electron-builder-config.json` — different filename, out of scope.

### Post-deletion audit

- Repo-wide grep for `electron-builder.config.json` (dotted): zero hits outside `.planning/` and `flatpak/com.nexusmods.vortex.yaml` (different filename).
- `pnpm package:nosign` script-level smoke: <pass/explain>.
- SSH signature on commit: present (`gpgsig` block).
```

## Commits

| #   | Title                                                                          | Body shape                                                                                           | Signed                  | Files touched                   |
| --- | ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------- | ----------------------- | ------------------------------- |
| 1   | `chore(electron-builder): drop orphan v2.0.1 config.json — superseded by .cjs` | Pattern S5 (pre-audit + script confirmation + structure.md line removal + flatpak out-of-scope note) | SSH `~/.ssh/id_ed25519` | 1 deletion + 1 doc line removed |

## Risks / contingencies

- **Hidden live reference surfaces in pre-deletion audit.** If the grep finds anything beyond `structure.md:27` and `flatpak/com.nexusmods.vortex.yaml:109`, pause Wave 6, characterize the new reference, and either rewire to `.cjs` (in scope) or escalate. D-35-04's deletion is conditional on the audit being clean.
- **`structure.md` formatting drift.** The line removal must be precise — minimize-diff. If the bullet uses inline backticks or wraps onto multiple lines, hand-edit rather than sed.
- **Flatpak filename ambiguity.** `electron-builder-config.json` (hyphenated) is a separate concern. Don't conflate in the commit; out-of-scope-note prevents future confusion.
- **`pnpm package:nosign` heavy in sandbox.** Full electron-builder run downloads platform binaries; not realistic to fully exercise in this sandbox. Script-level smoke (resolves the entry, does not need to complete) is the realistic Wave 6 verification. Phase 36 release-linux.yml is the full-build acid test.
- **Git index races with structure.md edit.** Use a single commit that includes both the `git rm` of the .json and the `structure.md` line removal — atomic.

## Done criteria

1. Pre-deletion audit reproduces RESEARCH §4 evidence (only `structure.md:27` doc reference; flatpak yaml line out of scope).
2. `src/main/electron-builder.config.json` deleted via `git rm`.
3. `structure.md:27` orphan line removed (minimize-diff edit).
4. Commit landed, SSH-signed.
5. Post-commit grep returns no live references to the dotted filename.
6. `pnpm package:nosign` smoke resolves the script entry cleanly (full AppImage build deferred to Phase 36).
7. `35-VERIFY-RESULTS.md` orphan-reconcile section appended.
8. SYNC-35e satisfied; Wave 7 unblocked.
