---
phase: 33-gamebryo-per-game-extensions-v2-0-1
plan: 09
type: execute
wave: 9
depends_on:
    - 33-08
files_modified:
    - .planning/STATE.md
    - .planning/ROADMAP.md
    - .planning/phases/33-gamebryo-per-game-extensions-v2-0-1/33-09-SUMMARY.md
autonomous: true
requirements:
    - SYNC-33a
    - SYNC-33b
must_haves:
    truths:
        - "All 6 done-gate criteria PASS (per D-33-14 mirroring D-27-05):"
        - "(1) `git grep -l '^<<<<<<< ' extensions/` returns empty"
        - "(2) Harness 12-gate skip-mode exits 0"
        - "(3) Per-extension typecheck/build runs 0 non-marker errors across every touched extension (8 Route-1, ~70 Route-2, 2 Route-3)"
        - "(4) Total atomic resolution commits across Waves A-F sums to ≥183 (Phase 33 commit accounting matches RESEARCH §1 file count)"
        - "(5) STATE.md updated via gsd-sdk: Phase 33 marked complete, plan count incremented, requirement IDs SYNC-33a + SYNC-33b checked"
        - "(6) ROADMAP.md updated: Phase 33 entry marked complete with status + commit-count + harness-status line"
        - "Wave 9 itself adds 0 resolution commits — only STATE/ROADMAP/SUMMARY commits"
    artifacts:
        - path: ".planning/STATE.md"
          provides: "v8.1 milestone state with Phase 33 complete"
          contains: "Phase 33"
        - path: ".planning/ROADMAP.md"
          provides: "v8.1 roadmap with Phase 33 marked done"
          contains: "Phase 33"
    key_links:
        - from: ".planning/STATE.md"
          to: ".planning/REQUIREMENTS.md SYNC-33a/SYNC-33b"
          via: "requirement ID checkbox"
          pattern: "SYNC-33[ab]"
        - from: ".planning/ROADMAP.md"
          to: ".planning/phases/33-gamebryo-per-game-extensions-v2-0-1/33-*-SUMMARY.md"
          via: "Phase 33 plan list"
          pattern: "33-..-SUMMARY"
---

<objective>
Wave 9 (done gate). Verify the 6-criterion done gate from D-33-14 (mirror of D-27-05). No resolution work — pure verification + state propagation. If any criterion fails, the agent stops and reports; the gate is NOT advisory, it's a hard pass/fail.

Output: 0 resolution commits. 1 SSH-signed commit updating STATE.md + ROADMAP.md (single combined commit per `gsd-sdk query commit`). 1 SUMMARY commit closing Phase 33. Harness 12/12 GREEN at end.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/phases/33-gamebryo-per-game-extensions-v2-0-1/33-CONTEXT.md
@.planning/phases/33-gamebryo-per-game-extensions-v2-0-1/33-RESEARCH.md
@.planning/phases/33-gamebryo-per-game-extensions-v2-0-1/33-PATTERNS.md
@.planning/phases/33-gamebryo-per-game-extensions-v2-0-1/33-00-SUMMARY.md
@.planning/phases/33-gamebryo-per-game-extensions-v2-0-1/33-01-SUMMARY.md
@.planning/phases/33-gamebryo-per-game-extensions-v2-0-1/33-02-SUMMARY.md
@.planning/phases/33-gamebryo-per-game-extensions-v2-0-1/33-03-SUMMARY.md
@.planning/phases/33-gamebryo-per-game-extensions-v2-0-1/33-04-SUMMARY.md
@.planning/phases/33-gamebryo-per-game-extensions-v2-0-1/33-05-SUMMARY.md
@.planning/phases/33-gamebryo-per-game-extensions-v2-0-1/33-06-SUMMARY.md
@.planning/phases/33-gamebryo-per-game-extensions-v2-0-1/33-07-SUMMARY.md
@.planning/phases/33-gamebryo-per-game-extensions-v2-0-1/33-08-SUMMARY.md
@.planning/REQUIREMENTS.md
@.planning/ROADMAP.md
@.planning/STATE.md
@VORTEX-LINUX-MERGE-PLAYBOOK.md
@CLAUDE.md
@AGENTS.md
</context>

<done_gate_criteria>
Per D-33-14 (mirroring Phase 27 D-27-05):

| #   | Criterion                           | Pass condition                                                                      | Verification command                                                                                            |
| --- | ----------------------------------- | ----------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | -------------- | ----------- |
| 1   | Conflict markers cleared            | empty                                                                               | `git grep -l '^<<<<<<< ' extensions/`                                                                           |
| 2   | Harness GREEN                       | exit 0                                                                              | `bash .planning/phases/33-gamebryo-per-game-extensions-v2-0-1/scripts/grep-checkpoint.sh --skip-conflict-check` |
| 3   | Per-extension typecheck/build clean | 0 non-marker errors per extension                                                   | full extension sweep below                                                                                      |
| 4   | Commit accounting                   | ≥183 atomic resolves + N docs + 1 catalog commit + 1 done-gate STATE/ROADMAP commit | `git log --oneline 33-00..HEAD --pretty=%s \| grep -cE '^(resolve                                               | chore.catalog. | docs.33-)'` |
| 5   | STATE.md updated                    | Phase 33 marked complete, SYNC-33a + SYNC-33b checked                               | gsd-sdk query state.update                                                                                      |
| 6   | ROADMAP.md updated                  | Phase 33 entry marked complete with status line                                     | manual edit + gsd-sdk verify                                                                                    |

ALL six MUST pass. If any fails, the agent stops and reports the failing criterion + remediation path.
</done_gate_criteria>

<criterion_3_full_typecheck_sweep>
Criterion 3 requires per-extension verification across ALL touched extensions. Use the route detection pattern from D-33-15 / Pattern P4:

```bash
# Generate the full list of touched extensions
TOUCHED_EXTS=$(git log --name-only --pretty=format: 33-00..HEAD -- 'extensions/**' 2>/dev/null \
  | awk -F/ '/^extensions\// {print $2}' \
  | grep -v '^$' \
  | sort -u)

# For each touched extension, detect route and run check
declare -A ROUTE_RESULTS
FAILED=()
for ext in $TOUCHED_EXTS; do
  PKG="extensions/$ext/package.json"
  if [ ! -f "$PKG" ]; then
    # No package.json (e.g. copy-extension.mjs / copy-native.mjs at extensions/ root)
    if [ "$ext" = "copy-extension.mjs" ] || [ "$ext" = "copy-native.mjs" ]; then
      node --check "extensions/$ext" || FAILED+=("$ext (Route 3 node --check)")
      ROUTE_RESULTS[$ext]="route-3"
    else
      FAILED+=("$ext (no package.json — investigate)")
    fi
    continue
  fi
  NAME=$(node -p "require('./$PKG').name" 2>/dev/null)
  if [ -z "$NAME" ]; then
    FAILED+=("$ext (package.json has no name)")
    continue
  fi
  if grep -q '"typecheck"' "$PKG"; then
    # Route 1
    ERR_COUNT=$(pnpm --filter "$NAME" typecheck 2>&1 | grep -E 'error TS' | grep -v TS1185 | wc -l)
    ROUTE_RESULTS[$ext]="route-1: $ERR_COUNT"
    [ "$ERR_COUNT" -ne 0 ] && FAILED+=("$ext (Route 1 typecheck: $ERR_COUNT errors)")
  else
    # Route 2
    pnpm --filter "$NAME" build >/tmp/wave9-build-$ext.log 2>&1
    if [ $? -ne 0 ]; then
      FAILED+=("$ext (Route 2 build: non-zero exit)")
      ROUTE_RESULTS[$ext]="route-2: FAIL"
    else
      ERR_COUNT=$(grep -E 'error TS' /tmp/wave9-build-$ext.log | grep -v TS1185 | wc -l)
      ROUTE_RESULTS[$ext]="route-2: $ERR_COUNT"
      [ "$ERR_COUNT" -ne 0 ] && FAILED+=("$ext (Route 2 build: $ERR_COUNT TS errors)")
    fi
  fi
done

if [ ${#FAILED[@]} -ne 0 ]; then
  echo "FAIL: criterion 3 — failed extensions:"
  printf '  - %s\n' "${FAILED[@]}"
  exit 1
fi
echo "Criterion 3 PASS — all $(echo "$TOUCHED_EXTS" | wc -l) touched extensions clean"
```

This sweep is the most expensive single check in the gate; budget 10-15 minutes for it (cold cache; warm cache <5 min).
</criterion_3_full_typecheck_sweep>

<commit_accounting_recipe>
Criterion 4 — count commits in Phase 33 (33-00..HEAD):

```bash
RESOLVE=$(git log --oneline 33-00..HEAD --pretty=%s | grep -cE '^resolve\(')
CATALOG=$(git log --oneline 33-00..HEAD --pretty=%s | grep -cE '^chore\(catalog\):')
DOCS=$(git log --oneline 33-00..HEAD --pretty=%s | grep -cE '^docs\(33-')
HARNESS=$(git log --oneline 33-00..HEAD --pretty=%s | grep -cE '^resolve\(checkpoint\):')

echo "Phase 33 commit accounting:"
echo "  resolve(<slug>): $RESOLVE  (expected ≥183)"
echo "  resolve(checkpoint): $HARNESS  (expected 1; harness extension)"
echo "  chore(catalog): $CATALOG  (expected 1; Wave F)"
echo "  docs(33-NN): $DOCS  (expected 9: 33-00 through 33-08)"

# Total expected: ≥183 resolves + 1 harness + 1 catalog + 9 docs = ≥194 commits
TOTAL=$((RESOLVE + HARNESS + CATALOG + DOCS))
test "$RESOLVE" -ge 183 || { echo "FAIL: resolve commits < 183"; exit 1; }
test "$HARNESS" -eq 1 || { echo "FAIL: harness commit count != 1"; exit 1; }
test "$CATALOG" -ge 1 || { echo "FAIL: catalog commit missing"; exit 1; }
test "$DOCS" -ge 9 || { echo "FAIL: docs commits < 9"; exit 1; }
echo "Criterion 4 PASS (total Phase 33 commits: $TOTAL)"

# All Phase 33 commits must be SSH-signed
UNSIGNED=$(for sha in $(git log 33-00..HEAD --pretty=%H); do
  git cat-file -p "$sha" | grep -q '^gpgsig ' || echo "$sha"
done)
test -z "$UNSIGNED" || { echo "FAIL: unsigned Phase 33 commits:"; echo "$UNSIGNED"; exit 1; }
echo "All Phase 33 commits SSH-signed"
```

**Tag sanity check:** Phase 33 ends untagged (no RC tag at end of phase). Tag is reserved for end-of-milestone (v8.1). The done gate does NOT cut a tag.
</commit_accounting_recipe>

<state_update_recipe>
Criterion 5 — STATE.md update via gsd-sdk:

```bash
# Mark phase complete
gsd-sdk query state.update --phase 33 --status complete

# Check requirements
gsd-sdk query state.requirements --check SYNC-33a
gsd-sdk query state.requirements --check SYNC-33b

# Verify
gsd-sdk query state.load | jq '.phases["33-gamebryo-per-game-extensions-v2-0-1"]'
```

If gsd-sdk returns errors or doesn't exist on PATH, fall back to manual STATE.md edit:

- Find Phase 33 entry, mark `status: complete`
- Find SYNC-33a, SYNC-33b, mark each `[x]`
- Bump v8.1 milestone progress counter
  </state_update_recipe>

<roadmap_update_recipe>
Criterion 6 — ROADMAP.md update:

```markdown
### Phase 33: Gamebryo + per-game extensions, v2.0.1

**Status:** complete
**Goal:** Resolve all v2.0.1 conflicts in extensions/ outside the mod-management hot zone (Phase 32) — gamebryo core, per-game extensions, build scaffolding, catalog re-add.
**Requirements:** [SYNC-33a, SYNC-33b]
**Plans:** 10 plans
**Result:** ~183 atomic resolves + 1 catalog re-add + 9 docs commits; harness 12/12 GREEN; per-extension typecheck/build clean across all touched extensions.

Plans:

- [x] 33-00-harness-extension-PLAN.md — Extend harness from 7 to 12 gates
- [x] 33-01-wave-A-gamebryo-core-PLAN.md — Resolve gamebryo-\* (4 ext, 11 files)
- [x] 33-02-wave-B-bepinex-PLAN.md — Resolve modtype-bepinex (1 ext, 4 files)
- [x] 33-03-wave-C-collections-PLAN.md — Resolve collections (1 ext, 12 files)
- [x] 33-04-wave-D1-heavy-pergame-PLAN.md — Resolve heavy per-game (4 ext, 57 files; gate-10 BG3 active)
- [x] 33-05-wave-D2-medium-pergame-PLAN.md — Resolve medium per-game (7 ext, 28 files; gate-11 Morrowind active)
- [x] 33-06-wave-D3-light-pergame-PLAN.md — Resolve light per-game (60 ext, 60 files)
- [x] 33-07-wave-E-build-scaffolding-PLAN.md — Resolve build scaffolding (7 ext, 12 files; copy-extension.mjs API + copy-native.mjs Linux-rebased)
- [x] 33-08-wave-F-catalog-readd-PLAN.md — Re-add 4 packages to pnpm catalog
- [x] 33-09-done-gate-PLAN.md — 6-criterion done gate verification
```

</roadmap_update_recipe>

<active_gates>
Per RESEARCH §4: 0 active gates in Wave 9. The harness IS one of the verification mechanisms (criterion 2), but no source-code resolution is happening — it's read-only verification + STATE/ROADMAP edits.
</active_gates>

<tasks>

<task type="auto">
  <name>Task 1: Run 6-criterion done gate verification (read-only)</name>
  <files>
    (none — read-only verification; outputs go to /tmp/wave9-*.log)
  </files>
  <read_first>
    - .planning/phases/33-gamebryo-per-game-extensions-v2-0-1/scripts/grep-checkpoint.sh
    - .planning/STATE.md (current state)
    - .planning/ROADMAP.md (current Phase 33 entry)
    - All 9 SUMMARY files (33-00 through 33-08) for accurate aggregate stats
  </read_first>
  <action>
    Sequential execution of all 6 criteria. STOP on first failure and report.

    **Criterion 1 — Conflict markers:**
    ```bash
    REM=$(git grep -l '^<<<<<<< ' extensions/ 2>/dev/null | wc -l)
    test "$REM" -eq 0 || { echo "FAIL: criterion 1 — $REM files still have markers"; git grep -l '^<<<<<<< ' extensions/; exit 1; }
    echo "Criterion 1 PASS"
    ```

    **Criterion 2 — Harness:**
    ```bash
    bash .planning/phases/33-gamebryo-per-game-extensions-v2-0-1/scripts/grep-checkpoint.sh --skip-conflict-check
    test $? -eq 0 || { echo "FAIL: criterion 2 — harness exited non-zero"; exit 1; }
    echo "Criterion 2 PASS"
    ```

    **Criterion 3 — Per-extension typecheck/build sweep:** Run the full block from `<criterion_3_full_typecheck_sweep>` above. Save full output to `/tmp/wave9-criterion3.log`.

    **Criterion 4 — Commit accounting:** Run the full block from `<commit_accounting_recipe>` above. Save output to `/tmp/wave9-criterion4.log`.

    **Criterion 5 — STATE.md update:** Run the full block from `<state_update_recipe>`.

    **Criterion 6 — ROADMAP.md update:** Run the full block from `<roadmap_update_recipe>`.

    Report all 6 results in a single block at the end of this task. If all pass, proceed to Task 2 (commit). If any fails, STOP and surface the failure + remediation path. Do NOT commit on partial pass.

  </action>
  <verify>
    <automated>
      cd /home/alex/src/Vortex && \
      ! git grep -l '^&lt;&lt;&lt;&lt;&lt;&lt;&lt; ' extensions/ &amp;&amp; \
      bash .planning/phases/33-gamebryo-per-game-extensions-v2-0-1/scripts/grep-checkpoint.sh --skip-conflict-check &gt;/dev/null &amp;&amp; \
      RC=$(git log --oneline 33-00..HEAD --pretty=%s | grep -cE '^resolve\(') &amp;&amp; \
      test "$RC" -ge 183 &amp;&amp; \
      test -f /tmp/wave9-criterion3.log &amp;&amp; \
      test -f /tmp/wave9-criterion4.log &amp;&amp; \
      ! grep -q FAIL /tmp/wave9-criterion3.log &amp;&amp; \
      ! grep -q FAIL /tmp/wave9-criterion4.log &amp;&amp; \
      echo OK
    </automated>
  </verify>
  <acceptance_criteria>
    - All 6 done-gate criteria report PASS
    - Outputs captured at `/tmp/wave9-criterion{3,4}.log`
    - No commits made yet (verification is read-only)
  </acceptance_criteria>
  <done>Done gate verified; ready to commit STATE/ROADMAP updates.</done>
</task>

<task type="auto">
  <name>Task 2: Commit STATE.md + ROADMAP.md updates (single combined commit)</name>
  <files>
    .planning/STATE.md
    .planning/ROADMAP.md
  </files>
  <read_first>
    - Updated .planning/STATE.md (post-Task-1 edits)
    - Updated .planning/ROADMAP.md (post-Task-1 edits)
  </read_first>
  <action>
    Stage both files (use `git add -f` because `.planning/` is gitignored per `feedback_planning_gitignored.md`):

    ```bash
    git add -f .planning/STATE.md .planning/ROADMAP.md
    git commit -S -s -m "docs(33-09): close Phase 33 — gamebryo + per-game extensions v2.0.1 done" \
      -m "$(cat <<'EOF'
    Done gate criteria (D-33-14):
    1. ✓ Conflict markers in extensions/: 0
    2. ✓ Harness 12-gate skip-mode: exit 0
    3. ✓ Per-extension typecheck/build: 0 non-marker errors across <N> touched extensions
    4. ✓ Commit accounting: <RESOLVE> resolves + <HARNESS> harness + <CATALOG> catalog + <DOCS> docs = <TOTAL> commits, all SSH-signed
    5. ✓ STATE.md updated: Phase 33 complete; SYNC-33a + SYNC-33b checked
    6. ✓ ROADMAP.md updated: Phase 33 marked complete

    v8.1 milestone progress: Phase 33 complete (Phase 32 closed prior; Phases 31-33 of v8.1 done).

    Wave 9 added 0 resolution commits — pure done-gate verification + state propagation.

    SSH-signed; --no-verify NOT used. .planning/ added with -f (gitignored).
    EOF
    )"
    ```

    The commit body MUST substitute the actual numbers from Task 1 outputs (read /tmp/wave9-criterion3.log + /tmp/wave9-criterion4.log).

  </action>
  <verify>
    <automated>
      cd /home/alex/src/Vortex && \
      git log -1 --pretty=%s | grep -q '^docs(33-09): close Phase 33' &amp;&amp; \
      git cat-file -p HEAD | grep -q '^gpgsig ' &amp;&amp; \
      git diff HEAD~1 HEAD --name-only | grep -q '\.planning/STATE\.md' &amp;&amp; \
      git diff HEAD~1 HEAD --name-only | grep -q '\.planning/ROADMAP\.md' &amp;&amp; \
      echo OK
    </automated>
  </verify>
  <acceptance_criteria>
    - Single SSH-signed commit `docs(33-09): close Phase 33 ...`
    - Both STATE.md and ROADMAP.md changes in same commit
    - Commit body documents all 6 criterion results with concrete numbers
  </acceptance_criteria>
  <done>STATE + ROADMAP committed; Phase 33 closed.</done>
</task>

<task type="auto">
  <name>Task 3: Wave 9 SUMMARY commit (Phase 33 closeout)</name>
  <files>.planning/phases/33-gamebryo-per-game-extensions-v2-0-1/33-09-SUMMARY.md</files>
  <read_first>
    - All 9 prior SUMMARYs (33-00 through 33-08)
    - /tmp/wave9-criterion3.log
    - /tmp/wave9-criterion4.log
    - $HOME/.claude/get-shit-done/templates/summary.md
  </read_first>
  <action>
    Write `33-09-SUMMARY.md` — the Phase 33 master closeout summary. Required sections:

    - **Outcome:** Phase 33 closed; all 6 done-gate criteria PASS
    - **Aggregate stats table:**
      | Wave | Plan | Extensions | Files | Resolve commits | Active gates exercised |
      | 0 | 33-00 | (harness) | 1 (grep-checkpoint.sh) | 1 | n/a |
      | A | 33-01 | 4 | 11 | 11 | none |
      | B | 33-02 | 1 | 4 | 4 | none |
      | C | 33-03 | 1 | 12 | 12 | none |
      | D1 | 33-04 | 4 | 57 | 57 | gate-10 (BG3) |
      | D2 | 33-05 | 7 | 28 | 28 | gate-11 (Morrowind) |
      | D3 | 33-06 | 60 | 60 | 60 | none |
      | E | 33-07 | 7 | 12 | 12 | none |
      | F | 33-08 | n/a | 2 (workspace + lockfile) | 1 (catalog) | none |
      | 9 | 33-09 | n/a | 2 (STATE + ROADMAP) | 0 (1 docs commit) | n/a |
      | **Total** | | **84+** | **~187** | **~186 + 9 docs** | 2 active |
    - **Active gate results:**
      - Gate-10 (BG3 4-class divine): pre-count = 4 / post-count = 4 (D-33-11 Pattern P2 protocol per 33-04-SUMMARY)
      - Gate-11 (Morrowind migrate103): pre-count ≥1 / post-count ≥1 (per 33-05-SUMMARY)
      - 10 of 12 gates passive throughout
    - **Critical preservation receipts:**
      - copy-native.mjs dist-fallback skip-on-missing block preserved (Wave E / 33-07-SUMMARY)
      - migrate103 sentinel string preserved (Wave D2 / 33-05-SUMMARY)
      - 4 BG3 named error classes preserved at lines 17/24/31/38 (Wave D1 / 33-04-SUMMARY)
    - **Catalog re-add result:** 4 packages re-added (or partial per pre-audit; reference 33-08-SUMMARY)
    - **Pattern reuse:** Patterns P1-P7 from 33-PATTERNS.md applied across all waves; conventions C1-C10 honored
    - **Affects:** Next phase (post v8.1 progression) sees a clean v2.0.1-aligned tree; cherry-pick to `linux-port` branch eligible per project_branch_strategy.md
    - **Provides:** Phase 33 done; v8.1 milestone progresses one phase
    - **Issues encountered:** (record any tier-escalations from defaults, surprises, or remediations across all 9 waves)

    Add via `git add -f`. Title: `docs(33-09): summarize Phase 33 closeout (gamebryo + per-game v2.0.1; ~183 resolves + harness + catalog re-add)`.

  </action>
  <verify>
    <automated>
      cd /home/alex/src/Vortex && \
      test -f .planning/phases/33-gamebryo-per-game-extensions-v2-0-1/33-09-SUMMARY.md &amp;&amp; \
      git log -1 --pretty=%s | grep -q '^docs(33-09): summarize Phase 33 closeout' &amp;&amp; \
      git cat-file -p HEAD | grep -q '^gpgsig ' &amp;&amp; \
      echo OK
    </automated>
  </verify>
  <acceptance_criteria>
    - 33-09-SUMMARY.md exists, committed via `git add -f`, SSH-signed
    - Phase 33 master closeout summary written with aggregate stats table + active-gate results + critical-preservation receipts
    - All 9 Wave SUMMARYs cross-referenced
  </acceptance_criteria>
  <done>Phase 33 closeout summary committed; v8.1 progress recorded; ready for next phase or branch cherry-pick.</done>
</task>

</tasks>

<verification>
After all tasks:
- 6-criterion done gate: ALL PASS
- 2 SSH-signed commits added in Wave 9 (1 STATE+ROADMAP + 1 SUMMARY); 0 resolution commits
- Phase 33 commit total ≥194 (≥183 resolve + 1 harness + 1 catalog + 9 docs)
- All Phase 33 commits SSH-signed (no unsigned commits)
- STATE.md reflects Phase 33 complete + SYNC-33a/SYNC-33b checked
- ROADMAP.md Phase 33 entry marked complete with 10/10 plan checkboxes
</verification>

<success_criteria>

- All 6 done-gate criteria PASS
- Phase 33 closed; v8.1 milestone progress recorded
- 0 resolution commits in Wave 9
- 2 docs commits (STATE+ROADMAP combined; SUMMARY)
- Branch `v8.1/config-bucket` ready for next phase work or `linux-port` cherry-pick selection
- DO NOT push from sandbox (per CONTEXT pre-flight checks; user pushes manually)
  </success_criteria>

<output>
Create `.planning/phases/33-gamebryo-per-game-extensions-v2-0-1/33-09-SUMMARY.md` per Task 3.
</output>
