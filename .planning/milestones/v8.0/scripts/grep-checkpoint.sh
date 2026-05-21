#!/usr/bin/env bash
#
# grep-checkpoint.sh — shared mod-management + per-game extension re-grep harness.
#
# Encodes the playbook items that the v8.0 sync milestone MUST preserve while
# resolving conflict files on v8.0/config-bucket. Originally Phase 26
# (mod_management hot zone, 7 gates). Phase 27 (gamebryo + per-game extensions)
# extends in place with 5 new durable gates per
# .planning/phases/27-gamebryo-per-game-extensions/27-CONTEXT.md D-27-02 + D-27-03.
# Phase 28 (renderer + main spine) extends with 4 more durable gates per
# .planning/phases/28-renderer-main-spine/28-CONTEXT.md D-28-02 + D-28-03 and
# relocates the script from .planning/phases/26-mod-management-hot-zone/scripts/
# to .planning/milestones/v8.0/scripts/ per D-28-04 (history preserved via git mv).
# Future sync milestones (v8.1, v9.0) reuse the script verbatim.
#
# Phase 26 gates (original 7, unchanged in body — re-numbered tail only):
#   §6  — stagingDirHasFiles in InstallManager.ts + util/stagingIntegrity.ts exists
#         (VORTEX-LINUX-MERGE-PLAYBOOK.md §6, line 95+)
#   §7a — normalizeBackslashPaths in InstallManager.ts (≥3 hits: import + 2 calls)
#         (VORTEX-LINUX-MERGE-PLAYBOOK.md §7a, line 103+)
#   §7b — mergeCaseConflictingDirs in InstallManager.ts (≥3 hits: import + 2 calls)
#         (VORTEX-LINUX-MERGE-PLAYBOOK.md §7b, line 117+)
#   §7c — copy-loop replaceAll backslash→slash (≥2 hits: source + destination)
#         (VORTEX-LINUX-MERGE-PLAYBOOK.md §7c, line 125+)
#   §7d — resolvePathCase(tempPath, …) in extractArchive (≥1 hit)
#         (VORTEX-LINUX-MERGE-PLAYBOOK.md §7d, line 132+)
#   140a57217 — resolvePathCase(dataPath, …) in LinkingDeployment.ts (≥3 hits)
#         (VORTEX-LINUX-MERGE-PLAYBOOK.md externalChanges entry, line 309/360)
#
# Phase 28 gates (4 new, durable, run after every commit per D-28-02 + D-28-03):
#   §2  — winapi-bindings allowlisted in renderer webpack externals on Linux
#         (VORTEX-LINUX-MERGE-PLAYBOOK.md §2; CONTEXT D-28-02). Positive ≥2:
#         alias map line + linux-only externals push. Both must survive.
#   §4  — testPathTransfer in transferPath.ts has NO Windows-only reject guard
#         (VORTEX-LINUX-MERGE-PLAYBOOK.md §4; CONTEXT D-28-02). NEGATIVE gate
#         (count must be 0). First negative gate in the milestone.
#   §8  — StarterInfo.ts retains Proton helpers + hide-instead-of-quit on the
#         Proton spawn path (VORTEX-LINUX-MERGE-PLAYBOOK.md §8; CONTEXT D-28-02).
#         Two sub-checks, both must pass:
#         8a — Proton helpers (isPathPrefix|shouldRunWithProton|runToolWithProton)
#              count ≥3 in StarterInfo.ts.
#         8b — protonSpawned closure exists AND hideWindow is called inside
#              StarterInfo.ts (the close-case hide-instead-of-quit shape lives
#              inside `protonSpawned`, not inside `onSpawned`).
#   §9  — Steam.ts resolveSteamPaths() calls findAllLinuxSteamPaths and reads
#         libraryfolders.vdf (VORTEX-LINUX-MERGE-PLAYBOOK.md §9; CONTEXT D-28-02).
#         File lives at src/renderer/src/util/Steam.ts on this fork (not
#         src/main/src/util/Steam.ts as CONTEXT D-28-02 cited — that path
#         doesn't exist; the playbook §9 grep example uses the renderer path
#         correctly). Auto-fix per Rule 1.
#         Two sub-checks, both must pass:
#         9a — findAllLinuxSteamPaths reference ≥1.
#         9b — libraryfolders.vdf reference ≥1.
#
# D-28-02 sub-notes (gate-shape corrections vs CONTEXT spec — Rule 1 auto-fixes):
#   - §2 spec proposed chained `git grep | grep -E 'nodeExternals|allowlist|allowList'`
#     with threshold ≥1. On this fork, the load-bearing Linux fix is the
#     `process.platform === "linux" ? ["winapi-bindings"] : []` ternary inside
#     the externals push at webpack.config.cjs:91, NOT a single line that pairs
#     `winapi-bindings` with `allowlist`. The original chained grep returns 0
#     because no single line carries both tokens. Switched to a plain
#     `git grep 'winapi-bindings' <file> | wc -l` count gate with threshold ≥2:
#     alias map line (:46) + linux-only externals push (:91). Locks both
#     invariants at once.
#   - §8b spec proposed `git grep -n 'onSpawned' <file> | grep -E 'hide|minimize'`
#     with threshold ≥1. On this fork, hide-on-spawn lives inside the
#     `protonSpawned` closure (StarterInfo.ts:270) calling `hideWindow()`
#     (line 271) — NOT inside `onSpawned` (line 174, which only dispatches
#     Redux + handles Flatpak emulation). Switched the regex to look for
#     `protonSpawned` reference (≥1) AND `hideWindow` reference inside the file
#     (≥1).
#   - §9 spec listed the file as `src/main/src/util/Steam.ts`. That path doesn't
#     exist on this fork — the file is `src/renderer/src/util/Steam.ts` (the
#     playbook §9 grep example uses the renderer path correctly). Auto-fixed.
#
# Phase 27 gates (5 new, durable, run after every commit per D-27-02 + D-27-03):
#   §1  — extension build guards (named-script form, no inline node -e platform
#         guards outside gamestore-xbox; skip-on-{windows,linux}.mjs present)
#         (VORTEX-LINUX-MERGE-PLAYBOOK.md §1, lines 21–48; CONTEXT D-27-03)
#   §3  — LOOT call-site casing in extensions/gamebryo-plugin-management/src/
#         autosort.ts (no pluginName.toLowerCase as LOOT basename arg; the
#         path.basename(pluginList[…].filePath) shape survives)
#         (VORTEX-LINUX-MERGE-PLAYBOOK.md §3, lines 67–73; CONTEXT D-27-03)
#   §10 — cross-compiled native binaries on disk (loot + bsatk artefacts)
#         (VORTEX-LINUX-MERGE-PLAYBOOK.md §10, lines 163–179; CONTEXT D-27-03)
#   BG3 4-class divine errors — DivineExecMissing / DivineMissingDotNet /
#         DivineTimedOut / DivineAborted all extend Error in
#         extensions/games/game-baldursgate3/src/divineCore.ts
#         (CONTEXT D-27-02; base commit f15bbabb8 anchor)
#   Morrowind migrate103 — 'morrowind migrate103: mod directory missing'
#         warning string survives in extensions/games/game-morrowind/src/migrations.js
#         (CONTEXT D-27-02; base commit f15bbabb8 anchor)
#
# Conflict-marker gate (renumbered to 16) — broadened path list to cover the
# Phase 27 directories alongside the Phase 26 mod_management dir. Phase 28's
# resolution scope (renderer/main/preload/shared/nexus/scripts/fingerprints) is
# NOT in the gate's path list — Phase 28 plans 28-01..28-10 invoke this script
# with --skip-conflict-check after each commit, and plan 28-11 runs a separate
# broader git grep for done-gate item #1 per CONTEXT D-28-05.
#
# D-26-03a (file/method distinction): the playbook's "externalChanges" entry names
# the externalChanges() METHOD inside LinkingDeployment.ts — NOT a separate file.
# `src/renderer/src/extensions/mod_management/externalChanges.ts` does not exist on
# this fork. The 140a57217 gate is therefore single-file (LinkingDeployment.ts
# only). Do not add a second-file gate; the prefix-anchored regex
# `resolvePathCase\(dataPath,` plus the ≥3 threshold locks all three call sites
# (LinkingDeployment.ts:523, :742, :799) at once.
#
# D-27-03 sub-note (gate 8 threshold + count form) — the plan task spec says
# `path.basename(pluginList[` count must be ≥4 ("one per LOOT call site"), and
# proposed `git grep -cE <pattern> <single-file>` for the count. Two corrections
# applied per Rule 1 (auto-fix spec bugs):
#   1. `git grep -cE … <single-file>` prints `path:count`, not a bare count, so
#      arithmetic on it fails. Switched to `git grep -nE … | wc -l`, matching
#      the other gates' shape.
#   2. Threshold lowered from ≥4 to ≥3.
# The actual baseline tree has 3 distinct expressions of that shape feeding
# 4 LOOT call sites: line 202 (sortPluginsAsync prep), line 503
# (loadPluginsAsync map), and line 546 (lootKey local reused at lines 549
# getPluginMetadataAsync + 553 getPluginAsync). The intent of the spec —
# "every LOOT call site is covered by basename, none use raw lower-case" — is
# satisfied; the count is just lower than the spec assumed because one local
# (`lootKey`) feeds two adjacent calls. Threshold set to ≥3 with this comment
# anchoring the rationale; do not lower below 3 without re-reading autosort.ts.
# If a future autosort.ts edit pushes the count back up to ≥4, raise the
# threshold accordingly (the spec's intent was to lock the maximum, not let it
# erode). The negative gate (no pluginName.toLowerCase at LOOT call sites)
# remains the load-bearing protection.
#
# Usage:
#   bash .planning/milestones/v8.0/scripts/grep-checkpoint.sh
#   bash .planning/milestones/v8.0/scripts/grep-checkpoint.sh --skip-conflict-check
#
# Exit code: number of failed gates (0 = clean). NO `set -e` — every gate runs
# even if earlier ones fail, so the executor sees the full picture.
# `--skip-conflict-check` skips ONLY the conflict-marker gate (gate 16); all
# other 15 gates always run.

set -u

skip_conflict_check=0
for arg in "$@"; do
  case "$arg" in
    --skip-conflict-check) skip_conflict_check=1 ;;
    -h|--help)
      sed -n '2,75p' "$0"
      exit 0
      ;;
    *)
      printf 'unknown flag: %s\n' "$arg" >&2
      exit 2
      ;;
  esac
done

# Run from repo root regardless of caller's cwd.
repo_root=$(git rev-parse --show-toplevel 2>/dev/null) || {
  printf 'FATAL: not inside a git work tree\n' >&2
  exit 2
}
cd "$repo_root"

INSTALL_MANAGER="src/renderer/src/extensions/mod_management/InstallManager.ts"
LINKING_DEPLOYMENT="src/renderer/src/extensions/mod_management/LinkingDeployment.ts"
STAGING_INTEGRITY="src/renderer/src/extensions/mod_management/util/stagingIntegrity.ts"
MOD_MGMT_DIR="src/renderer/src/extensions/mod_management/"
AUTOSORT="extensions/gamebryo-plugin-management/src/autosort.ts"
DIVINE_CORE="extensions/games/game-baldursgate3/src/divineCore.ts"
MORROWIND_MIGRATIONS="extensions/games/game-morrowind/src/migrations.js"
WEBPACK_RENDERER="src/renderer/webpack.config.cjs"
TRANSFER_PATH="src/renderer/src/util/transferPath.ts"
STARTER_INFO="src/renderer/src/util/StarterInfo.ts"
STEAM_TS="src/renderer/src/util/Steam.ts"

# Phase 27 conflict-marker path list — broadened from MOD_MGMT_DIR alone. Order
# matters only cosmetically; git grep folds duplicates.
CONFLICT_PATHS=(
  "src/renderer/src/extensions/mod_management/"
  "extensions/gamebryo-plugin-management/"
  "extensions/gamebryo-savegame-management/"
  "extensions/collections/"
  "extensions/modtype-bepinex/"
  "extensions/games/game-baldursgate3/"
  "extensions/games/game-morrowind/"
  "extensions/games/game-witcher3/"
)

failures=0

pass() { printf 'OK:   %s\n' "$1"; }
fail() { printf 'FAIL: %s (%s)\n' "$1" "$2"; failures=$((failures + 1)); }

# Gate 1: §6 stagingDirHasFiles + sibling util/stagingIntegrity.ts exists.
gate1_label="§6 stagingDirHasFiles in InstallManager.ts (≥1 hit) + util/stagingIntegrity.ts present"
gate1_hits=$(git grep -nE '\bstagingDirHasFiles\b' "$INSTALL_MANAGER" 2>/dev/null | wc -l)
if [ "$gate1_hits" -ge 1 ] && [ -f "$STAGING_INTEGRITY" ]; then
  pass "$gate1_label"
else
  fail "$gate1_label" "expected ≥1 hit AND file present, found ${gate1_hits} hit(s); stagingIntegrity.ts present=$(test -f "$STAGING_INTEGRITY" && echo yes || echo no)"
fi

# Gate 2: §7a normalizeBackslashPaths — import + 2 call sites.
gate2_label="§7a normalizeBackslashPaths in InstallManager.ts (≥3 hits: import + 2 call sites)"
gate2_hits=$(git grep -nE '\bnormalizeBackslashPaths\b' "$INSTALL_MANAGER" 2>/dev/null | wc -l)
if [ "$gate2_hits" -ge 3 ]; then
  pass "$gate2_label"
else
  fail "$gate2_label" "expected ≥3 hits, found ${gate2_hits}"
fi

# Gate 3: §7b mergeCaseConflictingDirs — import + 2 call sites.
gate3_label="§7b mergeCaseConflictingDirs in InstallManager.ts (≥3 hits: import + 2 call sites)"
gate3_hits=$(git grep -nE '\bmergeCaseConflictingDirs\b' "$INSTALL_MANAGER" 2>/dev/null | wc -l)
if [ "$gate3_hits" -ge 3 ]; then
  pass "$gate3_label"
else
  fail "$gate3_label" "expected ≥3 hits, found ${gate3_hits}"
fi

# Gate 4: §7c copy-loop replaceAll("\\","/") — source + destination in extractArchive.
# NOTE: D-26-03 spec literal regex was '\\\\\\\\.*"/"' (8 shell backslashes → 4 regex
# backslashes → matches 4 literal backslashes on disk). The file actually contains
# `replaceAll("\\", "/")` which is 2 literal backslashes between the quotes. Per
# Rule 1 (auto-fix spec bug), gate uses the correct count — 4 shell backslashes =
# 2 regex backslashes = matches the 2 literal backslashes in `"\\"`. Intent of the
# spec is preserved (≥2 hits, source + destination); the literal regex was wrong.
gate4_label='§7c copy-loop replaceAll("\\","/") in InstallManager.ts (≥2 hits: source + destination)'
gate4_hits=$(git grep -n 'replaceAll' "$INSTALL_MANAGER" 2>/dev/null | grep -cE '\\\\.*"/"')
if [ "$gate4_hits" -ge 2 ]; then
  pass "$gate4_label"
else
  fail "$gate4_label" "expected ≥2 hits, found ${gate4_hits}"
fi

# Gate 5: §7d resolvePathCase(tempPath, …) in extractArchive copy loop.
gate5_label="§7d resolvePathCase(tempPath, …) in InstallManager.ts (≥1 hit)"
gate5_hits=$(git grep -nE 'resolvePathCase\(tempPath' "$INSTALL_MANAGER" 2>/dev/null | wc -l)
if [ "$gate5_hits" -ge 1 ]; then
  pass "$gate5_label"
else
  fail "$gate5_label" "expected ≥1 hit, found ${gate5_hits}"
fi

# Gate 6: 140a57217 — resolvePathCase(dataPath, …) in LinkingDeployment.ts.
# Single-file gate per D-26-03a. The base commit de79ab7be has three call sites
# (LinkingDeployment.ts:523, :742, :799), all carrying the (dataPath, …) shape that
# 140a57217 produced. The ≥3 threshold locks all three at once.
gate6_label="140a57217 resolvePathCase(dataPath, …) in LinkingDeployment.ts (≥3 hits — locks :523, :742, :799)"
gate6_hits=$(git grep -nE 'resolvePathCase\(dataPath,' "$LINKING_DEPLOYMENT" 2>/dev/null | wc -l)
if [ "$gate6_hits" -ge 3 ]; then
  pass "$gate6_label"
else
  fail "$gate6_label" "expected ≥3 hits, found ${gate6_hits}"
fi

# Gate 7: §1 extension build guards (CONTEXT D-27-03).
# Three sub-checks, all must pass:
#   7a (negative) — no inline `node -e ... process.platform` guards in any
#       extension package.json EXCEPT gamestore-xbox (the named-script form,
#       skip-on-windows.mjs / skip-on-linux.mjs, is the durable shape).
#   7b (positive) — extensions/skip-on-windows.mjs and skip-on-linux.mjs exist.
#   7c (positive) — gamestore-xbox/package.json references skip-on-linux.mjs.
gate7_label="§1 extension build guards (named-script form survives; no inline process.platform outside gamestore-xbox)"
gate7_offenders=$(grep -l "node -e.*process.platform" extensions/*/package.json extensions/games/*/package.json 2>/dev/null | grep -v 'gamestore-xbox' | head -1)
gate7_skip_win=$(test -f extensions/skip-on-windows.mjs && echo 1 || echo 0)
gate7_skip_lin=$(test -f extensions/skip-on-linux.mjs && echo 1 || echo 0)
gate7_xbox=$(grep -q "skip-on-linux.mjs" extensions/gamestore-xbox/package.json 2>/dev/null && echo 1 || echo 0)
if [ -z "$gate7_offenders" ] && [ "$gate7_skip_win" -eq 1 ] && [ "$gate7_skip_lin" -eq 1 ] && [ "$gate7_xbox" -eq 1 ]; then
  pass "$gate7_label"
else
  reason=""
  [ -n "$gate7_offenders" ] && reason="${reason}inline-guard offender: ${gate7_offenders}; "
  [ "$gate7_skip_win" -ne 1 ] && reason="${reason}extensions/skip-on-windows.mjs missing; "
  [ "$gate7_skip_lin" -ne 1 ] && reason="${reason}extensions/skip-on-linux.mjs missing; "
  [ "$gate7_xbox" -ne 1 ] && reason="${reason}gamestore-xbox/package.json missing skip-on-linux.mjs reference; "
  fail "$gate7_label" "${reason%; }"
fi

# Gate 8: §3 LOOT call-site casing in autosort.ts (CONTEXT D-27-03).
# Two sub-checks:
#   8a (negative) — no `pluginName.toLowerCase` adjacent to a LOOT call.
#   8b (positive) — `path.basename(pluginList[…]` count ≥3 (see header note for
#       why 3 not 4 — three distinct expressions feed four LOOT call sites
#       because lootKey at line 546 is reused at getPluginMetadataAsync line 549
#       and getPluginAsync line 553).
gate8_label="§3 LOOT call-site casing in autosort.ts (no pluginName.toLowerCase at LOOT calls; path.basename shape ≥3)"
gate8_negative=$(git grep -nE 'pluginName\.toLowerCase' "$AUTOSORT" 2>/dev/null | grep -E '(loadPluginsAsync|getPluginMetadataAsync|getPluginAsync|sortPluginsAsync)' | head -1)
# `git grep -cE <pattern> <single-file>` prints `path:count`. Use plain count via
# `git grep -nE | wc -l` instead, which is consistent with the other gates and
# avoids the `path:N` parse step.
gate8_positive=$(git grep -nE 'path\.basename\(pluginList\[' "$AUTOSORT" 2>/dev/null | wc -l)
if [ -z "$gate8_negative" ] && [ "$gate8_positive" -ge 3 ]; then
  pass "$gate8_label"
else
  reason=""
  [ -n "$gate8_negative" ] && reason="${reason}LOOT call uses pluginName.toLowerCase: ${gate8_negative}; "
  [ "$gate8_positive" -lt 3 ] && reason="${reason}path.basename(pluginList[…]) count ${gate8_positive} < 3; "
  fail "$gate8_label" "${reason%; }"
fi

# Gate 9: §10 cross-compiled native binaries on disk (CONTEXT D-27-03).
# All four artefacts must exist. Phase 27 only edits gamebryo-plugin-management/
# src/**, but a hand-resolution that accidentally restages or git-removes any
# dist/** would surface here.
gate9_label="§10 cross-compiled native binaries present (loot + bsatk dist artefacts)"
gate9_loot_node=$(test -f extensions/gamebryo-plugin-management/dist/node-loot.node && echo 1 || echo 0)
gate9_libloot=$(test -f extensions/gamebryo-plugin-management/dist/libloot.so.0 && echo 1 || echo 0)
gate9_libloot_stub=$(test -f extensions/gamebryo-plugin-management/dist/libloot_wstring_stub.so && echo 1 || echo 0)
gate9_bsatk=$(test -f extensions/gamebryo-bsa-support/dist/bsatk.node && echo 1 || echo 0)
if [ "$gate9_loot_node" -eq 1 ] && [ "$gate9_libloot" -eq 1 ] && [ "$gate9_libloot_stub" -eq 1 ] && [ "$gate9_bsatk" -eq 1 ]; then
  pass "$gate9_label"
else
  reason=""
  [ "$gate9_loot_node" -ne 1 ] && reason="${reason}node-loot.node missing; "
  [ "$gate9_libloot" -ne 1 ] && reason="${reason}libloot.so.0 missing; "
  [ "$gate9_libloot_stub" -ne 1 ] && reason="${reason}libloot_wstring_stub.so missing; "
  [ "$gate9_bsatk" -ne 1 ] && reason="${reason}bsatk.node missing; "
  fail "$gate9_label" "${reason%; }"
fi

# Gate 10: BG3 4-class divine error preservation (CONTEXT D-27-02).
# divineCore.ts IS resolved by plan 27-05. Gate may noise-fail before that
# commit lands IF the conflict region wraps the class declarations — but the
# 4 classes are stable across the merge and conflict markers wrap added/removed
# lines, not the unchanged class declarations. So the gate should remain clean
# throughout. If it ever fails, read divineCore.ts directly.
gate10_label="BG3 4-class divine errors preserved in divineCore.ts (DivineExecMissing/MissingDotNet/TimedOut/Aborted, count ≥4)"
gate10_hits=$(git grep -nE 'class (DivineExecMissing|DivineMissingDotNet|DivineTimedOut|DivineAborted)\b extends Error' "$DIVINE_CORE" 2>/dev/null | wc -l)
if [ "$gate10_hits" -ge 4 ]; then
  pass "$gate10_label"
else
  fail "$gate10_label" "expected ≥4 hits, found ${gate10_hits}"
fi

# Gate 11: Morrowind migrate103 warning preservation (CONTEXT D-27-02).
# migrations.js IS resolved by plan 27-06. Same caveat as gate 10 — the
# warning string is on a line that's stable across the merge.
gate11_label="Morrowind migrate103 warning preserved in migrations.js (count ≥1)"
gate11_hits=$(git grep -n 'morrowind migrate103: mod directory missing' "$MORROWIND_MIGRATIONS" 2>/dev/null | wc -l)
if [ "$gate11_hits" -ge 1 ]; then
  pass "$gate11_label"
else
  fail "$gate11_label" "expected ≥1 hit, found ${gate11_hits}"
fi

# Gate 12: §2 winapi-bindings allowlisted in renderer webpack externals on Linux
# (CONTEXT D-28-02; success criterion #2). Threshold ≥2: alias map line + the
# linux-only externals push. Both must survive any upstream-side webpack edit.
gate12_label="§2 winapi-bindings retained in renderer webpack (alias + linux-only externals push, ≥2 hits)"
gate12_hits=$(git grep -nE 'winapi-bindings' "$WEBPACK_RENDERER" 2>/dev/null | wc -l)
if [ "$gate12_hits" -ge 2 ]; then
  pass "$gate12_label"
else
  fail "$gate12_label" "§2 regression — winapi-bindings missing from $WEBPACK_RENDERER (expected ≥2 hits, found ${gate12_hits})"
fi

# Gate 13: §4 transferPath.ts NEGATIVE — Windows-only reject must NOT exist
# (CONTEXT D-28-02; success criterion #3). First negative gate in the milestone.
# Threshold: count must equal 0.
gate13_label="§4 testPathTransfer in transferPath.ts has NO Windows-only reject (NEGATIVE gate, count==0)"
gate13_hits=$(git grep -nE "platform !== ['\"]win32['\"]\\) reject\\(UnsupportedOperatingSystem" "$TRANSFER_PATH" 2>/dev/null | wc -l)
if [ "$gate13_hits" -eq 0 ]; then
  pass "$gate13_label"
else
  fail "$gate13_label" "§4 regression detected — Windows-only reject re-introduced in $TRANSFER_PATH (found ${gate13_hits} hit(s), expected 0)"
fi

# Gate 14: §8 StarterInfo.ts Proton helpers + hide-instead-of-quit on Proton path
# (CONTEXT D-28-02; success criterion #4). Two sub-checks, both must pass; emit
# two messages on partial failure (per CONTEXT specifics).
#   14a — Proton helpers (isPathPrefix|shouldRunWithProton|runToolWithProton)
#         count ≥3 in StarterInfo.ts.
#   14b — protonSpawned closure exists AND hideWindow is referenced inside the
#         file. Per D-28-02 sub-note: hide-on-spawn lives inside protonSpawned
#         (line 270, calling hideWindow at line 271 on the close case), NOT
#         inside onSpawned. Looking for both `protonSpawned` (≥1) and
#         `hideWindow` (≥1) locks the protonSpawned closure shape.
gate14_label="§8 StarterInfo.ts Proton helpers (≥3) + protonSpawned/hideWindow hide-instead-of-quit (≥1 each)"
gate14_helpers=$(git grep -nE '\b(isPathPrefix|shouldRunWithProton|runToolWithProton)\b' "$STARTER_INFO" 2>/dev/null | wc -l)
gate14_protonSpawned=$(git grep -n 'protonSpawned' "$STARTER_INFO" 2>/dev/null | wc -l)
gate14_hideWindow=$(git grep -n 'hideWindow' "$STARTER_INFO" 2>/dev/null | wc -l)
if [ "$gate14_helpers" -ge 3 ] && [ "$gate14_protonSpawned" -ge 1 ] && [ "$gate14_hideWindow" -ge 1 ]; then
  pass "$gate14_label"
else
  reason=""
  [ "$gate14_helpers" -lt 3 ] && reason="${reason}§8 regression — Proton helpers missing or fewer than 3 references in $STARTER_INFO (found ${gate14_helpers}); "
  [ "$gate14_protonSpawned" -lt 1 ] && reason="${reason}§8 regression — protonSpawned closure missing in $STARTER_INFO (upstream may have collapsed Proton spawn path); "
  [ "$gate14_hideWindow" -lt 1 ] && reason="${reason}§8 regression — hideWindow no longer referenced in $STARTER_INFO (upstream may have reverted close-case to quit()); "
  fail "$gate14_label" "${reason%; }"
fi

# Gate 15: §9 Steam.ts findAllLinuxSteamPaths + libraryfolders.vdf
# (CONTEXT D-28-02; success criterion #5). Two sub-checks, both must pass.
# File path is src/renderer/src/util/Steam.ts on this fork (CONTEXT D-28-02
# typo'd src/main/src/util/Steam.ts — auto-fixed per Rule 1).
#   15a — findAllLinuxSteamPaths reference ≥1.
#   15b — libraryfolders.vdf reference ≥1.
gate15_label="§9 Steam.ts retains findAllLinuxSteamPaths (≥1) + libraryfolders.vdf (≥1)"
gate15a_hits=$(git grep -n 'findAllLinuxSteamPaths' "$STEAM_TS" 2>/dev/null | wc -l)
gate15b_hits=$(git grep -nE 'libraryfolders\.vdf' "$STEAM_TS" 2>/dev/null | wc -l)
if [ "$gate15a_hits" -ge 1 ] && [ "$gate15b_hits" -ge 1 ]; then
  pass "$gate15_label"
else
  reason=""
  [ "$gate15a_hits" -lt 1 ] && reason="${reason}§9 regression — findAllLinuxSteamPaths() not called in $STEAM_TS; "
  [ "$gate15b_hits" -lt 1 ] && reason="${reason}§9 regression — libraryfolders.vdf parsing missing from $STEAM_TS; "
  fail "$gate15_label" "${reason%; }"
fi

# Gate 16 (was 12): no conflict markers across the Phase 26 mod_management dir
# AND the seven Phase 27 extension directories. `--skip-conflict-check` gates
# ONLY this gate; the other 15 always run. Phase 28's broader resolution scope
# is gated separately by plan 28-11's done-gate (CONTEXT D-28-05 #1).
gate16_label="no conflict markers in mod_management/ + 7 Phase 27 extension dirs"
if [ "$skip_conflict_check" -eq 1 ]; then
  printf 'SKIP: %s (--skip-conflict-check)\n' "$gate16_label"
else
  marker_files=$(git grep -l '^<<<<<<< ' "${CONFLICT_PATHS[@]}" 2>/dev/null || true)
  if [ -z "$marker_files" ]; then
    pass "$gate16_label"
  else
    file_count=$(printf '%s\n' "$marker_files" | wc -l)
    fail "$gate16_label" "${file_count} file(s) still contain '<<<<<<< ' — $(printf '%s' "$marker_files" | tr '\n' ' ')"
  fi
fi

printf '\n'
if [ "$failures" -eq 0 ]; then
  printf 'CHECKPOINT PASSED — %d gate(s) clean\n' "$(( skip_conflict_check == 1 ? 15 : 16 ))"
else
  printf 'CHECKPOINT FAILED — %d gate(s) failed\n' "$failures"
fi

exit "$failures"
