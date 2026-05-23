#!/usr/bin/env bash
#
# grep-checkpoint.sh — Phase 26 mod-management hot-zone re-grep harness.
#
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

# Gate 7: no conflict markers in mod_management/ tree.
gate7_label="no conflict markers in $MOD_MGMT_DIR"
if [ "$skip_conflict_check" -eq 1 ]; then
  printf 'SKIP: %s (--skip-conflict-check)\n' "$gate7_label"
else
  marker_files=$(git grep -l '^<<<<<<< ' "$MOD_MGMT_DIR" 2>/dev/null || true)
  if [ -z "$marker_files" ]; then
    pass "$gate7_label"
  else
    file_count=$(printf '%s\n' "$marker_files" | wc -l)
    fail "$gate7_label" "${file_count} file(s) still contain '<<<<<<< ' — $(printf '%s' "$marker_files" | tr '\n' ' ')"
  fi
fi

printf '\n'
if [ "$failures" -eq 0 ]; then
  printf 'CHECKPOINT PASSED — %d gate(s) clean\n' "$(( skip_conflict_check == 1 ? 6 : 7 ))"
else
  printf 'CHECKPOINT FAILED — %d gate(s) failed\n' "$failures"
fi

exit "$failures"
