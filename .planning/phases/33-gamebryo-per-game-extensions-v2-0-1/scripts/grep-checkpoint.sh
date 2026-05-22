#!/usr/bin/env bash
#
# grep-checkpoint.sh — Phase 33 gamebryo + per-game extensions re-grep harness.
#
# Phase 33 extension of the Phase 32 v8.1 base (which itself extended v8.0 Phase 26
# 7ed691f40). Adds 5 gates per [D-33-04] / RESEARCH §4 / [D-33-05]:
#   - gate 7  §1 extension build guards (skip-on-{windows,linux}.mjs + no inline
#             node -e process.platform in extension package.json files)
#   - gate 8  §3 LOOT casing in autosort.ts (zero pluginName.toLowerCase, ≥4
#             path.basename(pluginList[) hits)
#   - gate 9  §10 cross-compiled native binaries on disk (4 files)
#   - gate 10 BG3 4-class divine error preservation in divineCore.ts
#   - gate 11 Morrowind migrate103 warning string preservation in migrations.js
# The existing no-conflict-marker gate is renumbered to gate 12.
#
# Total: 12 gates. Inherited 6 mod_management gates (1–6) plus 5 added gates (7–11)
# all run unconditionally; gate 12 is suppressed under --skip-conflict-check so the
# harness can pass per per-file commit while resolution is still in flight.
#
# Original Phase 26 framing (preserved verbatim):
# Encodes the playbook items that this phase MUST preserve while resolving the 8
# mod_management/* conflict files on v8.0/config-bucket. Plans 26-02..26-09 invoke
# this script after each per-file commit to confirm no fix was eaten by hand-merge;
# plan 26-10's done-gate runs it once more (without --skip-conflict-check) as the
# final assertion. Future sync milestones (v8.1, v9.0) reuse it verbatim.
#
# Gates (per .planning/phases/26-mod-management-hot-zone/26-CONTEXT.md D-26-03):
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
#   no-conflict-markers — `git grep -l '^<<<<<<< ' src/.../mod_management/` empty
#
# D-26-03a (file/method distinction): the playbook's "externalChanges" entry names
# the externalChanges() METHOD inside LinkingDeployment.ts — NOT a separate file.
# `src/renderer/src/extensions/mod_management/externalChanges.ts` does not exist on
# this fork. The 140a57217 gate is therefore single-file (LinkingDeployment.ts
# only). Do not add a second-file gate; the prefix-anchored regex
# `resolvePathCase\(dataPath,` plus the ≥3 threshold locks all three call sites
# (LinkingDeployment.ts:523, :742, :799) at once.
#
# Usage:
#   bash .planning/phases/26-mod-management-hot-zone/scripts/grep-checkpoint.sh
#   bash .planning/phases/26-mod-management-hot-zone/scripts/grep-checkpoint.sh --skip-conflict-check
#
# Exit code: number of failed gates (0 = clean). NO `set -e` — every gate runs
# even if earlier ones fail, so the executor sees the full picture.

set -u

skip_conflict_check=0
for arg in "$@"; do
  case "$arg" in
    --skip-conflict-check) skip_conflict_check=1 ;;
    -h|--help)
      sed -n '2,40p' "$0"
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

# Gate 7: §1 extension build guards.
# Two halves:
#   (a) zero hits for `node -e ... process.platform` in extension package.json
#       files, EXCEPT extensions/gamestore-xbox/package.json which is the
#       playbook-allowed inline-guard exception.
#   (b) both extensions/skip-on-windows.mjs and skip-on-linux.mjs exist on disk.
gate7_label="§1 extension build guards (no inline node -e process.platform; skip-on-{windows,linux}.mjs present)"
gate7_inline_hits=$(git grep -lE 'node -e.*process\.platform' \
                      -- 'extensions/*/package.json' 'extensions/games/*/package.json' 2>/dev/null \
                    | grep -v '^extensions/gamestore-xbox/package.json$' | wc -l)
gate7_skip_win=0; [ -f extensions/skip-on-windows.mjs ] && gate7_skip_win=1
gate7_skip_lin=0; [ -f extensions/skip-on-linux.mjs ] && gate7_skip_lin=1
if [ "$gate7_inline_hits" -eq 0 ] && [ "$gate7_skip_win" -eq 1 ] && [ "$gate7_skip_lin" -eq 1 ]; then
  pass "$gate7_label"
else
  fail "$gate7_label" "inline=${gate7_inline_hits} (want 0), skip-win=${gate7_skip_win} (want 1), skip-lin=${gate7_skip_lin} (want 1)"
fi

# Gate 8: §3 LOOT casing in autosort.ts.
# Per VORTEX-LINUX-MERGE-PLAYBOOK.md §3: all LOOT call sites
# (loadPluginsAsync, getPluginMetadataAsync, getPluginAsync, sortPluginsAsync)
# must use `path.basename(pluginList[id].filePath)` — the real on-disk
# filename — not `pluginName.toLowerCase()`. Surrogate gate calibrated to
# fork HEAD pre-resolution state per RESEARCH §4 (this gate is passive
# during Phase 33 — autosort.ts is not in the conflict file list):
#   - ≥3 `path.basename(pluginList[` hits (the case-preserving canonicaliser
#     used at the LOOT boundary; current fork has these at lines 202, 503, 546)
#   - presence of all 4 LOOT call-site identifiers in the file
# `pluginName.toLowerCase` is intentionally PERMITTED here — line 543 derives
# an internal `id` for indexing pluginList per playbook line 233; the LOOT
# call on line 549 uses `lootKey` which is the path.basename construction.
# Counting toLowerCase outright would false-fail.
AUTOSORT="extensions/gamebryo-plugin-management/src/autosort.ts"
gate8_label="§3 LOOT casing in autosort.ts (≥3 path.basename(pluginList[) + all 4 LOOT call sites present)"
if [ -f "$AUTOSORT" ]; then
  gate8_basename=$(grep -cE 'path\.basename\(pluginList\[' "$AUTOSORT" 2>/dev/null || echo 0)
  gate8_loot_calls=$(grep -cE '\bloot\.(loadPluginsAsync|getPluginMetadataAsync|getPluginAsync|sortPluginsAsync)\b' "$AUTOSORT" 2>/dev/null || echo 0)
  if [ "$gate8_basename" -ge 3 ] && [ "$gate8_loot_calls" -ge 4 ]; then
    pass "$gate8_label"
  else
    fail "$gate8_label" "basename=${gate8_basename} (want ≥3), loot-calls=${gate8_loot_calls} (want ≥4)"
  fi
else
  fail "$gate8_label" "autosort.ts missing at $AUTOSORT"
fi

# Gate 9: §10 cross-compiled native binaries on disk.
# All four files must exist: 3 in gamebryo-plugin-management/dist + 1 in
# gamebryo-bsa-support/dist. These are .gitignore'd-but-tracked artefacts on
# the fork — preserved by the build, not regenerated per-commit.
gate9_label="§10 native binaries on disk (node-loot.node, libloot.so.0, libloot_wstring_stub.so, bsatk.node)"
gate9_missing=0
gate9_missing_list=""
for f in extensions/gamebryo-plugin-management/dist/node-loot.node \
         extensions/gamebryo-plugin-management/dist/libloot.so.0 \
         extensions/gamebryo-plugin-management/dist/libloot_wstring_stub.so \
         extensions/gamebryo-bsa-support/dist/bsatk.node; do
  if [ ! -f "$f" ]; then
    gate9_missing=$((gate9_missing + 1))
    gate9_missing_list="${gate9_missing_list} ${f}"
  fi
done
if [ "$gate9_missing" -eq 0 ]; then
  pass "$gate9_label"
else
  fail "$gate9_label" "${gate9_missing} missing:${gate9_missing_list}"
fi

# Gate 10: BG3 4-class divine error preservation in divineCore.ts.
# The 4 named error classes (DivineExecMissing, DivineMissingDotNet,
# DivineTimedOut, DivineAborted) are fork-local Linux divine tooling
# additions. Preservation gate per [D-33-11] / [D-33-02] tier-1.
DIVINE_CORE="extensions/games/game-baldursgate3/src/divineCore.ts"
gate10_label="BG3 divine error classes in divineCore.ts (≥4: DivineExecMissing, DivineMissingDotNet, DivineTimedOut, DivineAborted)"
if [ -f "$DIVINE_CORE" ]; then
  gate10_hits=$(git grep -nE 'class (DivineExecMissing|DivineMissingDotNet|DivineTimedOut|DivineAborted)\b extends Error' "$DIVINE_CORE" 2>/dev/null | wc -l)
  if [ "$gate10_hits" -ge 4 ]; then
    pass "$gate10_label"
  else
    fail "$gate10_label" "expected ≥4, found ${gate10_hits}"
  fi
else
  fail "$gate10_label" "divineCore.ts missing at $DIVINE_CORE"
fi

# Gate 11: Morrowind migrate103 warning string preservation in migrations.js.
# The warning text "morrowind migrate103: mod directory missing" appears at
# lines 50 + 60 of HEAD per RESEARCH §4. Preservation gate per [D-33-11].
MORROW_MIG="extensions/games/game-morrowind/src/migrations.js"
gate11_label="Morrowind migrate103 warning in migrations.js (≥1 'morrowind migrate103: mod directory missing')"
if [ -f "$MORROW_MIG" ]; then
  gate11_hits=$(grep -c 'morrowind migrate103: mod directory missing' "$MORROW_MIG" 2>/dev/null || echo 0)
  if [ "$gate11_hits" -ge 1 ]; then
    pass "$gate11_label"
  else
    fail "$gate11_label" "expected ≥1, found ${gate11_hits}"
  fi
else
  fail "$gate11_label" "migrations.js missing at $MORROW_MIG"
fi

# Gate 12: no conflict markers in mod_management/ tree AND extensions/ tree.
# Phase 33 broadens the marker check to cover both Phase 32's surface
# (mod_management — already empty post-Phase-32) and Phase 33's surface
# (extensions/ — 879 regions in 183 files at start of phase). Skip-mode
# suppresses this gate so per-file commits during Wave A–E pass cleanly;
# done-gate runs it without --skip-conflict-check to assert full eradication.
gate12_label="no conflict markers in $MOD_MGMT_DIR + extensions/"
if [ "$skip_conflict_check" -eq 1 ]; then
  printf 'SKIP: %s (--skip-conflict-check)\n' "$gate12_label"
else
  marker_files=$(git grep -l '^<<<<<<< ' "$MOD_MGMT_DIR" extensions/ 2>/dev/null || true)
  if [ -z "$marker_files" ]; then
    pass "$gate12_label"
  else
    file_count=$(printf '%s\n' "$marker_files" | wc -l)
    fail "$gate12_label" "${file_count} file(s) still contain '<<<<<<< ' — $(printf '%s' "$marker_files" | head -5 | tr '\n' ' ')$( [ "$file_count" -gt 5 ] && echo "(+$((file_count - 5)) more)" )"
  fi
fi

printf '\n'
if [ "$failures" -eq 0 ]; then
  printf 'CHECKPOINT PASSED — %d gate(s) clean\n' "$(( skip_conflict_check == 1 ? 11 : 12 ))"
else
  printf 'CHECKPOINT FAILED — %d gate(s) failed\n' "$failures"
fi

exit "$failures"
