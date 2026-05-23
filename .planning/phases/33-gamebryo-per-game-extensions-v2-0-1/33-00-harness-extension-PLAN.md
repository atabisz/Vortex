---
phase: 33-gamebryo-per-game-extensions-v2-0-1
plan: 00
type: execute
wave: 0
depends_on: []
files_modified:
    - .planning/phases/33-gamebryo-per-game-extensions-v2-0-1/scripts/grep-checkpoint.sh
    - .planning/phases/33-gamebryo-per-game-extensions-v2-0-1/33-00-SUMMARY.md
autonomous: true
requirements:
    - SYNC-33a
must_haves:
    truths:
        - "Phase 32 harness extracted to .planning/phases/33-gamebryo-per-game-extensions-v2-0-1/scripts/grep-checkpoint.sh and extended from 7 gates to 12 gates (adds gate-7 §1, gate-8 §3, gate-9 §10, gate-10 BG3 4-class divine, gate-11 Morrowind migrate103; existing no-conflict-marker becomes gate-12)"
        - "Harness is executable; --skip-conflict-check dry-run on pre-resolution tree exits 0 with all 11 non-marker gates GREEN"
        - "Harness without --skip-conflict-check exits non-zero (gate-12 fail) — expected pre-resolution state with 879 conflict regions across 183 files still present"
        - "Pre-flight repo-state matches RESEARCH §2 + §4 (branch v8.1/config-bucket, HEAD a592b596c, 183 conflict files in extensions/, BG3 4-class count = 4, Morrowind migrate103 count = 2, all 4 §10 native binaries on disk)"
        - "v2.0.1 introduces zero new playbook-touching call sites (D-33-05 inspection result: confirmed) — no gate 13+ added"
        - "Single-host invariant re-verified: LinkingDeployment.ts is still sole 140a57217 host (D-33-10)"
    artifacts:
        - path: ".planning/phases/33-gamebryo-per-game-extensions-v2-0-1/scripts/grep-checkpoint.sh"
          provides: "12-gate aggregate-fail playbook harness with --skip-conflict-check flag"
          contains: "stagingDirHasFiles, normalizeBackslashPaths, mergeCaseConflictingDirs, resolvePathCase, DivineExecMissing, morrowind migrate103, libloot.so.0, node-loot.node, libloot_wstring_stub.so, bsatk.node"
        - path: ".planning/phases/33-gamebryo-per-game-extensions-v2-0-1/33-00-SUMMARY.md"
          provides: "Pre-flight snapshot, harness extension origin + diff vs Phase 32, gate-by-gate dry-run results, baseline conflict counts, no-new-sites finding"
    key_links:
        - from: "scripts/grep-checkpoint.sh gate-10 (BG3)"
          to: "extensions/games/game-baldursgate3/src/divineCore.ts"
          via: "git grep -nE 'class (DivineExecMissing|DivineMissingDotNet|DivineTimedOut|DivineAborted)\\b extends Error'"
          pattern: "class (DivineExecMissing|DivineMissingDotNet|DivineTimedOut|DivineAborted)\\b extends Error"
        - from: "scripts/grep-checkpoint.sh gate-11 (Morrowind)"
          to: "extensions/games/game-morrowind/src/migrations.js"
          via: "grep -c 'morrowind migrate103: mod directory missing'"
          pattern: "morrowind migrate103: mod directory missing"
---

<objective>
Wave 0 setup. Extend the Phase 32 7-gate harness to 12 gates by adding §1 (extension build guards), §3 (LOOT casing in autosort.ts), §10 (native binaries existence on disk), BG3 4-class divine error preservation, and Morrowind migrate103 warning preservation. Verify pre-flight repo state matches RESEARCH §2/§4 snapshot. Confirm v2.0.1 introduces zero new playbook-touching call sites per D-33-05 (inspection only — no new gates beyond the 5 added here). All 11 non-marker gates must dry-run GREEN on the pre-resolution tree before any of waves A–F starts.

Purpose: Every per-file resolution commit in waves A–E runs `grep-checkpoint.sh --skip-conflict-check` as its safety net. Without the 5 extended gates, a per-game executor could silently regress BG3 divine error classes, drop the Morrowind warning string, break a §1 build guard, mis-fold §3 LOOT casing, or leave native binaries missing on disk. This plan lands the harness BEFORE any resolution starts.

Output: Executable `scripts/grep-checkpoint.sh` (~12 gates), `33-00-SUMMARY.md` baseline data, one signed commit titled `resolve(checkpoint): scripts/grep-checkpoint.sh — extend with §1 + §3 + §10 + BG3 + Morrowind gates`.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@.planning/ROADMAP.md
@.planning/REQUIREMENTS.md
@.planning/phases/33-gamebryo-per-game-extensions-v2-0-1/33-CONTEXT.md
@.planning/phases/33-gamebryo-per-game-extensions-v2-0-1/33-RESEARCH.md
@.planning/phases/33-gamebryo-per-game-extensions-v2-0-1/33-PATTERNS.md
@VORTEX-LINUX-MERGE-PLAYBOOK.md
@CLAUDE.md
@AGENTS.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Pre-flight repo-state verification</name>
  <files></files>
  <read_first>
    - .planning/phases/33-gamebryo-per-game-extensions-v2-0-1/33-RESEARCH.md (sections 2, 4, 5; "Sources" HIGH confidence list)
    - .planning/phases/33-gamebryo-per-game-extensions-v2-0-1/33-CONTEXT.md (D-33-00 branch decision, D-33-04 harness extension, D-33-10 single-host invariant)
    - CLAUDE.md (Branch Strategy, GSD Workflow Enforcement, SSH commit signing notes)
    - VORTEX-LINUX-MERGE-PLAYBOOK.md (§1, §3, §10 entries — playbook surface this gate-set protects)
  </read_first>
  <action>
    Pure repo-state guard. No code changes. If anything fails, STOP and surface — the phase is not safe to execute on a drifted tree.

    Required checks (record actual values for the SUMMARY):

    1. Branch identity:
       ```
       test "$(git rev-parse --abbrev-ref HEAD)" = "v8.1/config-bucket"
       ```

    2. HEAD SHA matches research snapshot:
       ```
       test "$(git rev-parse HEAD)" = "a592b596c0363afd444549cd53e485bebc80d7e7"
       ```
       (informational — drift is acceptable as long as branch identity holds and the conflict surface still matches)

    3. Conflict file count under `extensions/` is 183:
       ```
       test "$(git grep -l '^<<<<<<< ' extensions/ | wc -l)" -eq 183
       ```

    4. Total conflict-region count across `extensions/` is 879:
       ```
       test "$(git grep -c '^<<<<<<< ' extensions/ | awk -F: '{s+=$2} END {print s}')" -eq 879
       ```

    5. Working tree clean:
       ```
       test -z "$(git status --porcelain | grep -v '^??')"
       ```

    6. SSH signing active:
       ```
       test "$(git config --get gpg.format)" = "ssh"
       test "$(git config --get commit.gpgsign)" = "true"
       ```

    7. BG3 preservation gate currently green (4 classes at HEAD lines 17/24/31/38):
       ```
       test "$(git grep -nE 'class (DivineExecMissing|DivineMissingDotNet|DivineTimedOut|DivineAborted)\b extends Error' extensions/games/game-baldursgate3/src/divineCore.ts | wc -l)" -eq 4
       ```

    8. Morrowind preservation gate currently green (warning string ≥1 hit):
       ```
       test "$(grep -c 'morrowind migrate103: mod directory missing' extensions/games/game-morrowind/src/migrations.js)" -ge 1
       ```

    9. §10 native binaries all four on disk:
       ```
       for f in extensions/gamebryo-plugin-management/dist/node-loot.node \
                extensions/gamebryo-plugin-management/dist/libloot.so.0 \
                extensions/gamebryo-plugin-management/dist/libloot_wstring_stub.so \
                extensions/gamebryo-bsa-support/dist/bsatk.node; do
         test -f "$f" || echo "MISSING $f"
       done
       ```
       Expected: zero MISSING lines.

    10. §1 zero conflict markers in any extension package.json (these guards must NOT be in conflict):
       ```
       test -z "$(git grep -l '^<<<<<<< ' -- 'extensions/*/package.json' 'extensions/games/*/package.json')"
       ```

    11. §3 autosort.ts is NOT in the conflict file list (LOOT casing surface untouched):
       ```
       ! git grep -l '^<<<<<<< ' -- extensions/gamebryo-plugin-management/src/autosort.ts | grep -q autosort.ts
       ```

    12. D-33-10 single-host invariant: LinkingDeployment.ts is the sole 140a57217 host:
       ```
       hits=$(git grep -lE 'resolvePathCase\(dataPath,' src/ extensions/ | wc -l)
       test "$hits" -eq 1
       git grep -lE 'resolvePathCase\(dataPath,' src/ extensions/ | grep -q LinkingDeployment.ts
       ```

    13. Phase 32 harness available as the extension base:
       ```
       test -x .planning/phases/32-mod-management-hot-zone-v2-0-1/scripts/grep-checkpoint.sh
       ```

    Failure on ANY of 1, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13 → STOP, surface to operator. Item 2 (exact HEAD SHA) is informational only.

  </action>
  <verify>
    <automated>
      cd /home/alex/src/Vortex && \
      test "$(git rev-parse --abbrev-ref HEAD)" = "v8.1/config-bucket" && \
      test "$(git grep -l '^&lt;&lt;&lt;&lt;&lt;&lt;&lt; ' extensions/ | wc -l)" -eq 183 && \
      test "$(git grep -c '^&lt;&lt;&lt;&lt;&lt;&lt;&lt; ' extensions/ | awk -F: '{s+=$2} END {print s}')" -eq 879 && \
      test "$(git config --get gpg.format)" = "ssh" && \
      test "$(git config --get commit.gpgsign)" = "true" && \
      test "$(git grep -nE 'class (DivineExecMissing|DivineMissingDotNet|DivineTimedOut|DivineAborted)\b extends Error' extensions/games/game-baldursgate3/src/divineCore.ts | wc -l)" -eq 4 && \
      test "$(grep -c 'morrowind migrate103: mod directory missing' extensions/games/game-morrowind/src/migrations.js)" -ge 1 && \
      test -f extensions/gamebryo-plugin-management/dist/node-loot.node && \
      test -f extensions/gamebryo-plugin-management/dist/libloot.so.0 && \
      test -f extensions/gamebryo-plugin-management/dist/libloot_wstring_stub.so && \
      test -f extensions/gamebryo-bsa-support/dist/bsatk.node && \
      test -x .planning/phases/32-mod-management-hot-zone-v2-0-1/scripts/grep-checkpoint.sh && \
      echo "PRE-FLIGHT OK"
    </automated>
  </verify>
  <acceptance_criteria>
    - All 13 checks pass; values recorded in scratch notes for SUMMARY
    - Branch is v8.1/config-bucket, working tree clean, SSH signing active
    - 183 conflict files / 879 regions match RESEARCH §2 baseline
    - BG3 divine 4 classes present, Morrowind migrate103 ≥1 hit, §10 native binaries on disk
    - §1 + §3 + D-33-10 invariants currently green
    - Phase 32 harness present and executable
  </acceptance_criteria>
  <done>Pre-flight checks all pass; values captured for SUMMARY; safe to extend harness.</done>
</task>

<task type="auto">
  <name>Task 2: Extract Phase 32 harness, extend with 5 new gates, install, dry-run, capture baseline, write summary, commit</name>
  <files>
    .planning/phases/33-gamebryo-per-game-extensions-v2-0-1/scripts/grep-checkpoint.sh
    .planning/phases/33-gamebryo-per-game-extensions-v2-0-1/33-00-SUMMARY.md
  </files>
  <read_first>
    - .planning/phases/32-mod-management-hot-zone-v2-0-1/scripts/grep-checkpoint.sh (full read — 159 lines, 7 gates; this is the verbatim base)
    - .planning/phases/33-gamebryo-per-game-extensions-v2-0-1/33-RESEARCH.md (sections 2, 4, 5; "Sources" HIGH confidence list)
    - .planning/phases/33-gamebryo-per-game-extensions-v2-0-1/33-CONTEXT.md (D-33-04 gate definitions, D-33-05 inspection, D-33-10 invariant)
    - .planning/phases/33-gamebryo-per-game-extensions-v2-0-1/33-PATTERNS.md (Pattern P3 harness invocation)
    - VORTEX-LINUX-MERGE-PLAYBOOK.md (§1, §3, §10 sections — gate sources of truth)
    - First 30 lines of v8.0 Phase 27 harness extension via `git show 96364fe17:.planning/phases/27-gamebryo-per-game-extensions/scripts/grep-checkpoint.sh | head -60` (the 5 added gates' shape on the v8.0 archive)
  </read_first>
  <action>
    Step A — Copy Phase 32 harness verbatim to phase 33 dir:
    ```bash
    mkdir -p .planning/phases/33-gamebryo-per-game-extensions-v2-0-1/scripts
    cp .planning/phases/32-mod-management-hot-zone-v2-0-1/scripts/grep-checkpoint.sh \
       .planning/phases/33-gamebryo-per-game-extensions-v2-0-1/scripts/grep-checkpoint.sh
    ```

    Step B — Update header comment (1-3 lines) to cite the v8.1 Phase 33 extension origin:
    ```
    # Phase 33 harness — extends Phase 32 v8.1 base (which extended v8.0 Phase 26 7ed691f40)
    # with §1 (build guards), §3 (LOOT casing), §10 (native binaries),
    # BG3 4-class divine, Morrowind migrate103 — total 12 gates.
    ```
    Do NOT touch the 6 inherited playbook gates (§6, §7a-d, 140a57217) or the no-conflict-marker gate.
    Do NOT touch the aggregate-fail logic (no `set -e`) or the `--skip-conflict-check` flag handling.

    Step C — Insert 5 new gate blocks BEFORE the existing no-conflict-marker gate (which is the last gate in the Phase 32 harness). Use the same pattern style as Phase 32 (each gate increments `pass`/`fail` counters and appends to `failures` on failure). Per D-33-04 / RESEARCH §4 + Pattern P3, the 5 new gates are:

    Gate-7 (§1 — extension build guards):
    ```bash
    # Gate 7: §1 extension build guards — no inline node -e process.platform in extension
    # package.json files except gamestore-xbox; skip-on-{windows,linux}.mjs both present.
    g1_inline=$(git grep -lE 'node -e.*process\.platform' \
                  -- 'extensions/*/package.json' 'extensions/games/*/package.json' \
                | grep -v '^extensions/gamestore-xbox/package.json$' | wc -l)
    g1_skip_win=$(test -f extensions/skip-on-windows.mjs && echo 1 || echo 0)
    g1_skip_lin=$(test -f extensions/skip-on-linux.mjs && echo 1 || echo 0)
    if [ "$g1_inline" -eq 0 ] && [ "$g1_skip_win" -eq 1 ] && [ "$g1_skip_lin" -eq 1 ]; then
      pass=$((pass+1)); echo "PASS gate-7 §1 extension build guards"
    else
      fail=$((fail+1)); failures="$failures gate-7"
      echo "FAIL gate-7 §1 extension build guards (inline=$g1_inline, skip-win=$g1_skip_win, skip-lin=$g1_skip_lin)"
    fi
    ```

    Gate-8 (§3 — LOOT casing in autosort.ts):
    ```bash
    # Gate 8: §3 LOOT casing — zero pluginName.toLowerCase near LOOT call sites in autosort.ts;
    # path.basename(pluginList[ ≥4.
    g3_lower=$(grep -nE 'pluginName\.toLowerCase' extensions/gamebryo-plugin-management/src/autosort.ts | wc -l)
    g3_basename=$(grep -cE 'path\.basename\(pluginList\[' extensions/gamebryo-plugin-management/src/autosort.ts)
    if [ "$g3_lower" -eq 0 ] && [ "$g3_basename" -ge 4 ]; then
      pass=$((pass+1)); echo "PASS gate-8 §3 LOOT casing"
    else
      fail=$((fail+1)); failures="$failures gate-8"
      echo "FAIL gate-8 §3 LOOT casing (toLowerCase=$g3_lower, basename=$g3_basename — need 0/≥4)"
    fi
    ```

    Gate-9 (§10 — native binaries):
    ```bash
    # Gate 9: §10 native binaries on disk — all four files exist.
    g10_missing=0
    for f in extensions/gamebryo-plugin-management/dist/node-loot.node \
             extensions/gamebryo-plugin-management/dist/libloot.so.0 \
             extensions/gamebryo-plugin-management/dist/libloot_wstring_stub.so \
             extensions/gamebryo-bsa-support/dist/bsatk.node; do
      [ -f "$f" ] || g10_missing=$((g10_missing+1))
    done
    if [ "$g10_missing" -eq 0 ]; then
      pass=$((pass+1)); echo "PASS gate-9 §10 native binaries"
    else
      fail=$((fail+1)); failures="$failures gate-9"
      echo "FAIL gate-9 §10 native binaries ($g10_missing missing)"
    fi
    ```

    Gate-10 (BG3 4-class divine):
    ```bash
    # Gate 10: BG3 divine error classes — 4 named classes preserved in divineCore.ts.
    g_bg3=$(git grep -nE 'class (DivineExecMissing|DivineMissingDotNet|DivineTimedOut|DivineAborted)\b extends Error' \
              extensions/games/game-baldursgate3/src/divineCore.ts | wc -l)
    if [ "$g_bg3" -ge 4 ]; then
      pass=$((pass+1)); echo "PASS gate-10 BG3 4-class divine ($g_bg3)"
    else
      fail=$((fail+1)); failures="$failures gate-10"
      echo "FAIL gate-10 BG3 4-class divine ($g_bg3 — need ≥4)"
    fi
    ```

    Gate-11 (Morrowind migrate103):
    ```bash
    # Gate 11: Morrowind migrate103 warning string preserved in migrations.js.
    g_morrow=$(grep -c 'morrowind migrate103: mod directory missing' \
                 extensions/games/game-morrowind/src/migrations.js)
    if [ "$g_morrow" -ge 1 ]; then
      pass=$((pass+1)); echo "PASS gate-11 Morrowind migrate103 ($g_morrow)"
    else
      fail=$((fail+1)); failures="$failures gate-11"
      echo "FAIL gate-11 Morrowind migrate103 ($g_morrow — need ≥1)"
    fi
    ```

    The existing no-conflict-marker gate stays at the end (now gate-12). Numbering convention: the 6 Phase 32 gates were 1-6 (mod_management playbook), the conflict-marker gate was 7. Renumber so 7-11 = the 5 new ones, 12 = no-conflict-marker. Update any echo strings that previously said "gate 7" for marker-check to "gate-12".

    Step D — Make executable:
    ```bash
    chmod +x .planning/phases/33-gamebryo-per-game-extensions-v2-0-1/scripts/grep-checkpoint.sh
    ```

    Step E — D-33-05 inspection: confirm v2.0.1 introduces zero new playbook-touching call sites. Run:
    ```bash
    git diff fork/master fork/sync/upstream-v2.0.1 --name-status -- 'extensions/' | head -30
    git show fork/sync/upstream-v2.0.1:extensions/gamebryo-plugin-management/src/autosort.ts \
      | grep -nE 'toLowerCase|path\.basename' | head -10
    git show fork/sync/upstream-v2.0.1:extensions/games/game-baldursgate3/src/divineCore.ts \
      | grep -nE 'class .* extends Error' | head -10
    git show fork/sync/upstream-v2.0.1:extensions/games/game-morrowind/src/migrations.js \
      | grep -n 'migrate103' | head -10
    ```
    Expected per RESEARCH §1 (Phase 27 retrospective + Phase 32 v2.0.1 inspection): zero new playbook surface — divine error classes absent on upstream side, migrate103 absent on upstream side, no LOOT-casing changes in autosort.ts. Capture all four outputs into the SUMMARY verbatim. If any output reveals a new playbook surface (e.g. upstream introduces a 5th divine error class), document it and add a gate-13.

    Step F — Dry-run the harness on the pre-resolution tree:
    ```bash
    bash .planning/phases/33-gamebryo-per-game-extensions-v2-0-1/scripts/grep-checkpoint.sh --skip-conflict-check
    echo "skip-mode exit=$?"
    bash .planning/phases/33-gamebryo-per-game-extensions-v2-0-1/scripts/grep-checkpoint.sh
    echo "full-mode exit=$?"
    ```
    Expected per RESEARCH §4: skip-mode = exit 0, all 11 non-marker gates PASS. Full-mode = exit non-zero, gate-12 FAIL because 879 markers still present in 183 files. Capture both runs verbatim into SUMMARY.

    Step G — Capture baseline conflict counts (used by all subsequent waves' done-gate audit):
    ```bash
    git grep -l '^<<<<<<< ' extensions/ | wc -l                    # expect 183
    git grep -c '^<<<<<<< ' extensions/ | awk -F: '{s+=$2} END {print s}'   # expect 879
    git grep -c '^<<<<<<< ' extensions/ | sort -t: -k2 -n -r | head -20    # heaviest files
    ```

    Step H — Write `33-00-SUMMARY.md`. Required sections:
    - Pre-flight check results (Task 1, 13 items; pass/fail per item)
    - Harness origin: copied verbatim from `.planning/phases/32-mod-management-hot-zone-v2-0-1/scripts/grep-checkpoint.sh` (which itself derived from v8.0 Phase 26 commit `7ed691f40`); 5 gates added in-place (gate-7..gate-11); marker gate renumbered to gate-12
    - Diff summary vs Phase 32 harness: lines added (≈40-50), gates added (5), gate-numbering changes
    - D-33-05 inspection (Step E verbatim outputs); explicit statement "no gate-13 added; v2.0.1 introduces no new playbook surface"
    - D-33-10 single-host invariant verification (Task 1 item 12 result)
    - Harness dry-run results: skip-mode exit + 11 PASS lines; full-mode exit + gate-12 FAIL line
    - Baseline conflict surface: 183 files, 879 regions, top-20 heaviest files
    - Forward-pointer to plans 01..09 (waves A→F + done gate)

    Step I — Commit. Title (verbatim from Phase 27 commit 96364fe17):
    `resolve(checkpoint): scripts/grep-checkpoint.sh — extend with §1 + §3 + §10 + BG3 + Morrowind gates`

    Body must include (per Pattern P5 / D-33-08):
    - One-line stance: "Wave 0 setup; reuses Phase 32 harness verbatim and adds 5 gates per D-33-04."
    - Origin: Phase 32 harness path + line count
    - 5 added gates listed: §1 (gate-7), §3 (gate-8), §10 (gate-9), BG3 (gate-10), Morrowind (gate-11); marker gate now gate-12
    - D-33-05 inspection result (no new playbook surface in v2.0.1)
    - Dry-run exits: skip-mode=0, full-mode=non-zero (gate-12 fail expected)
    - Files: scripts/grep-checkpoint.sh, 33-00-SUMMARY.md
    - Playbook gates affected: §1, §3, §10, BG3 divine, Morrowind migrate103 (gate definitions)
    - Playbook gates preserved: yes — no resolution work in this commit; gates only added
    - grep-checkpoint.sh exit (post-extension, skip-mode): 0
    - pnpm typecheck: n/a (Wave 0 is harness-only; no source files touched)
    - --no-verify: no
    - SSH-signed per CLAUDE.md (commit.gpgsign=true ensures this)

    Per `feedback_planning_gitignored.md`: `.planning/` is gitignored — `git add -f` for both files.
    Per `feedback_git_push_ssh.md`: do NOT push from sandbox.

  </action>
  <verify>
    <automated>
      cd /home/alex/src/Vortex && \
      test -x .planning/phases/33-gamebryo-per-game-extensions-v2-0-1/scripts/grep-checkpoint.sh && \
      bash .planning/phases/33-gamebryo-per-game-extensions-v2-0-1/scripts/grep-checkpoint.sh --skip-conflict-check &gt;/dev/null &amp;&amp; \
      test -f .planning/phases/33-gamebryo-per-game-extensions-v2-0-1/33-00-SUMMARY.md &amp;&amp; \
      git log -1 --pretty=%s | grep -q '^resolve(checkpoint): scripts/grep-checkpoint.sh — extend with §1 + §3 + §10 + BG3 + Morrowind gates$' &amp;&amp; \
      git cat-file -p HEAD | grep -q '^gpgsig ' &amp;&amp; \
      echo "WAVE 0 COMPLETE"
    </automated>
  </verify>
  <acceptance_criteria>
    - `scripts/grep-checkpoint.sh` exists, executable, ~200-220 lines (Phase 32 base ≈159 + ≈40-50 added)
    - Header comment cites Phase 32 origin and Phase 33 extension rationale
    - Skip-mode dry-run exits 0; all 11 non-marker gates PASS
    - Full-mode run exits non-zero; only gate-12 (no-conflict-marker) FAILs (expected pre-resolution)
    - D-33-05 inspection captured: zero new playbook surface in v2.0.1
    - D-33-10 invariant verified
    - `33-00-SUMMARY.md` records pre-flight, origin, diff vs Phase 32, no-new-sites finding, dry-run exits, baseline counts (183/879)
    - Single SSH-signed commit on `v8.1/config-bucket` with verbatim title
    - `git cat-file -p HEAD | grep -c '^gpgsig '` ≥ 1 (signed)
    - `git add -f` used for both `.planning/` paths
  </acceptance_criteria>
  <done>Harness extended; baseline captured; D-33-05 + D-33-10 verified; signed commit on branch. Waves A–F unblocked.</done>
</task>

</tasks>

<verification>
After this plan completes:
- `bash .planning/phases/33-gamebryo-per-game-extensions-v2-0-1/scripts/grep-checkpoint.sh --skip-conflict-check` exits 0
- `git log -1 --pretty=%s` matches `resolve(checkpoint): scripts/grep-checkpoint.sh — extend with §1 + §3 + §10 + BG3 + Morrowind gates`
- `git cat-file -p HEAD | grep -c '^gpgsig '` ≥ 1
- `33-00-SUMMARY.md` contains pre-flight, harness origin/diff, v2.0.1 no-new-sites inspection, dry-run exits, 183/879 baseline
- 183 conflict files in `extensions/` STILL exist with markers (Wave 0 does NOT resolve any conflict)
</verification>

<success_criteria>

- Harness extended from 7 gates to 12 gates; skip-mode GREEN against pre-resolution tree
- D-33-05 inspection result documented: no gate 13+ added
- D-33-10 single-host invariant re-verified
- Single signed commit on `v8.1/config-bucket`
- Plans 01..09 (waves A–F + done gate) unblocked
  </success_criteria>

<output>
Create `.planning/phases/33-gamebryo-per-game-extensions-v2-0-1/33-00-SUMMARY.md` per Task 2 Step H.
</output>
