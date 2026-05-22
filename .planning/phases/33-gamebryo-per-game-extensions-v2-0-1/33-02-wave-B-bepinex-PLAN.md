---
phase: 33-gamebryo-per-game-extensions-v2-0-1
plan: 02
type: execute
wave: 2
depends_on:
    - 33-01
files_modified:
    - extensions/modtype-bepinex/src/bepInExDownloader.ts
    - extensions/modtype-bepinex/src/common.ts
    - extensions/modtype-bepinex/src/index.ts
    - .planning/phases/33-gamebryo-per-game-extensions-v2-0-1/33-02-SUMMARY.md
autonomous: true
requirements:
    - SYNC-33a
must_haves:
    truths:
        - "modtype-bepinex (3 src files, ~9 regions per RESEARCH §2) marker-free"
        - "3 atomic SSH-signed `resolve(bepinex): ...` commits"
        - "Per-extension typecheck (`pnpm --filter modtype-bepinex typecheck`) returns 0 non-marker errors at closeout"
        - "Harness 12 gates stay GREEN after every commit"
        - "src files mostly tier-5 smaller-diff per RESEARCH §2"
        - "src/common.ts process.platform hit (RESEARCH §4) preserved if any region overlaps it (tier-2 fork-wins)"
    artifacts:
        - path: "extensions/modtype-bepinex/src/index.ts"
          provides: "modtype-bepinex extension entry post-v2.0.1 oxfmt reflow"
          contains: "registerExtension"
    key_links:
        - from: "extensions/modtype-bepinex/src/index.ts"
          to: "extensions/modtype-bepinex/src/{bepInExDownloader,common}.ts"
          via: "intra-extension imports (leaf-first ordering)"
          pattern: "from .*(bepInExDownloader|common)"
---

<objective>
Wave B. Resolve all 3 conflict files in `modtype-bepinex` extension, leaf-first per D-33-01. Single Engineer agent (the extension is self-contained per RESEARCH §6 cross-extension import audit). All regions default tier-5 smaller-diff (formatter reflow per RESEARCH §2) except any region overlapping `src/common.ts`'s `process.platform` line (tier-2 fork-wins). Note: `build.mjs` carried zero markers in the live tree at plan-check time — dropped from scope.

Purpose: modtype-bepinex provides BepInEx mod-type registration consumed by Unity-engine games (BG3 uses BepInEx for some mods, kingdomcome-deliverance, etc.). Get it clean so per-game waves D1-D3 see a stable dependee.

Output: 3 SSH-signed commits + 1 SUMMARY commit. Harness 12/12 GREEN at end.
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
@VORTEX-LINUX-MERGE-PLAYBOOK.md
@CLAUDE.md
@AGENTS.md
</context>

<files_in_scope>
| File | Region count | Stance |
|------|--------------|--------|
| extensions/modtype-bepinex/src/bepInExDownloader.ts | 7 (per RESEARCH §2) | tier-5 smaller-diff (formatter reflow) |
| extensions/modtype-bepinex/src/common.ts | 1 | tier-5 default; tier-2 fork-wins if region overlaps `process.platform` line (RESEARCH §4) |
| extensions/modtype-bepinex/src/index.ts | 1 | tier-5 smaller-diff; check for Rule-1 dup-import in import block (tier-4) |

**Total:** 3 files, ~9 regions. **Slug:** `bepinex`. **Typecheck route (Pattern P4):** `pnpm --filter modtype-bepinex typecheck` (Route 1 — has tsconfig + typecheck script per RESEARCH §3). Note: `build.mjs` had zero markers in live tree at plan-check time and is excluded from this wave.
</files_in_scope>

<active_gates>
Per RESEARCH §4: 0 of 12 gates active. All gates are passive post-commit assertions.
</active_gates>

<stance_application_order>
Per D-33-02 (apply in order):

1. Playbook-surface: N/A in Wave B
2. Linux platform guard: tier-2 fork-wins on any region overlapping `src/common.ts`'s `process.platform` line (RESEARCH §4 records 1 hit)
3. New v2.0.1 feature scaffolding: N/A in active scope (build.mjs excluded — zero live markers)
4. Rule-1 dup-import: tier-4 HEAD-empty if upstream side merely duplicates a HEAD import (watch index.ts)
5. Smaller-diff: tier-5 default for everything else (~7 of 9 regions per RESEARCH §2)
   </stance_application_order>

<shared_per_task_workflow>
Same as 33-01 (Wave A). Steps 1-10. Per-extension typecheck deferred to last commit (src/index.ts).
</shared_per_task_workflow>

<tasks>

<task type="auto">
  <name>Task 1: Resolve modtype-bepinex (3 files leaf-first; closeout typecheck)</name>
  <files>
    extensions/modtype-bepinex/src/bepInExDownloader.ts
    extensions/modtype-bepinex/src/common.ts
    extensions/modtype-bepinex/src/index.ts
  </files>
  <read_first>
    - All 3 files current state
    - `git show fork/master:extensions/modtype-bepinex/src/{bepInExDownloader,common,index}.ts` for each
    - extensions/modtype-bepinex/package.json (`name` field)
    - .planning/phases/33-gamebryo-per-game-extensions-v2-0-1/33-RESEARCH.md §2 + §4
  </read_first>
  <action>
    Single Engineer agent (no parallelism inside extension). Sequential leaf-first: src/bepInExDownloader.ts → src/common.ts → src/index.ts.

    Per-file specifics:

    - **src/bepInExDownloader.ts (7 regions):** Per RESEARCH §2 the 7 regions are formatter reflow → tier-5 smaller-diff. Bluebird spot-check (`grep -n 'from .bluebird.' <file>`).
      Title: `resolve(bepinex): bepInExDownloader.ts — smaller-diff (×7 line-wrap)`.

    - **src/common.ts (1 region):** tier-5 default; tier-2 fork-wins if region overlaps `process.platform` per RESEARCH §4.
      Title: `resolve(bepinex): common.ts — smaller-diff` OR `resolve(bepinex): common.ts — fork-wins on process.platform branch` depending on region content.

    - **src/index.ts (1 region; BARREL — last):** tier-5 default; tier-4 HEAD-empty if dup-import.
      Title: `resolve(bepinex): index.ts — smaller-diff` (or appropriate stance).

    **At src/index.ts commit (extension closeout):**
    ```bash
    pnpm --filter modtype-bepinex typecheck 2>&1 | grep -E 'error TS' | grep -v TS1185 | wc -l
    ```
    Must be 0. Record in commit body. Fallback to `cd extensions/modtype-bepinex && pnpm tsc -p tsconfig.json` if pnpm --filter fails (RESEARCH §3 routing).

    Each commit body per Pattern P5 / D-33-08: regions resolved (with stance breakdown), playbook gates (none in this plan; record "none — no playbook surface in this file"), harness exit, typecheck status (deferred / count), --no-verify status.

  </action>
  <verify>
    <automated>
      cd /home/alex/src/Vortex && \
      ! git grep -l '^&lt;&lt;&lt;&lt;&lt;&lt;&lt; ' extensions/modtype-bepinex/ &amp;&amp; \
      bash .planning/phases/33-gamebryo-per-game-extensions-v2-0-1/scripts/grep-checkpoint.sh --skip-conflict-check &gt;/dev/null &amp;&amp; \
      TC=$(pnpm --filter modtype-bepinex typecheck 2>&amp;1 | grep -E 'error TS' | grep -v TS1185 | wc -l) &amp;&amp; \
      test "$TC" -eq 0 &amp;&amp; \
      git log -3 --pretty=%s | grep -c '^resolve(bepinex):' | grep -q '^3$' &amp;&amp; \
      for sha in $(git log -3 --pretty=%H); do git cat-file -p $sha | grep -q '^gpgsig ' || exit 1; done &amp;&amp; \
      echo OK
    </automated>
  </verify>
  <acceptance_criteria>
    - 3 files marker-free
    - 3 SSH-signed `resolve(bepinex): ...` commits
    - Harness skip-mode exits 0 after each commit
    - `pnpm --filter modtype-bepinex typecheck` returns 0 non-marker errors at closeout
    - common.ts commit body documents whether process.platform was preserved (tier-2) or region was reflow (tier-5)
  </acceptance_criteria>
  <done>modtype-bepinex resolved + per-extension typecheck GREEN; 4 signed commits on branch.</done>
</task>

<task type="auto">
  <name>Task 2: Wave B SUMMARY commit</name>
  <files>.planning/phases/33-gamebryo-per-game-extensions-v2-0-1/33-02-SUMMARY.md</files>
  <read_first>
    - 4 commit messages: `git log --oneline 33-01..HEAD -- extensions/modtype-bepinex/`
    - $HOME/.claude/get-shit-done/templates/summary.md
  </read_first>
  <action>
    Write `33-02-SUMMARY.md` summarising Wave B. Required sections:
    - Outcome: 1/1 extension resolved; 3 commits + 1 docs commit
    - Per-file table: file, regions, stance breakdown, commit SHA, typecheck status
    - Harness state: 12/12 gates GREEN
    - Affects: Wave D1/D2 per-game extensions that use BepInEx (BG3 collection install paths; kingdomcome-deliverance) see clean dependees
    - Provides: modtype-bepinex extension fully resolved
    - Issues encountered (if any)

    Add via `git add -f`. Commit title: `docs(33-02): summarize Wave B modtype-bepinex resolution (1 extension, 3 files, 3 commits)`.

  </action>
  <verify>
    <automated>
      cd /home/alex/src/Vortex && \
      test -f .planning/phases/33-gamebryo-per-game-extensions-v2-0-1/33-02-SUMMARY.md &amp;&amp; \
      git log -1 --pretty=%s | grep -q '^docs(33-02): summarize Wave B' &amp;&amp; \
      git cat-file -p HEAD | grep -q '^gpgsig ' &amp;&amp; \
      echo OK
    </automated>
  </verify>
  <acceptance_criteria>
    - 33-02-SUMMARY.md exists, committed via `git add -f`, SSH-signed
    - 3 `resolve(bepinex):` commits + 1 docs commit on Wave B
    - Conflict-marker files in `extensions/modtype-bepinex/`: 0
  </acceptance_criteria>
  <done>Wave B complete; summary committed; branch ready for Wave C.</done>
</task>

</tasks>

<verification>
After all tasks:
- `git grep -l '^<<<<<<< ' extensions/modtype-bepinex/` returns empty
- `bash .planning/phases/33-gamebryo-per-game-extensions-v2-0-1/scripts/grep-checkpoint.sh --skip-conflict-check` exits 0
- `pnpm --filter modtype-bepinex typecheck` returns 0 non-marker errors
- 3 + 1 SSH-signed commits on `v8.1/config-bucket`
</verification>

<success_criteria>

- modtype-bepinex extension fully resolved
- 3 + 1 SSH-signed commits
- Harness 12/12 GREEN
- Wave C unblocked (collections)
  </success_criteria>

<output>
Create `.planning/phases/33-gamebryo-per-game-extensions-v2-0-1/33-02-SUMMARY.md` per Task 2.
</output>
