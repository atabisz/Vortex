---
phase: 33-gamebryo-per-game-extensions-v2-0-1
plan: 05
type: execute
wave: 5
depends_on:
    - 33-04
files_modified:
    - extensions/games/game-kingdomcome-deliverance/src/collections/CollectionsDataView.tsx
    - extensions/games/game-kingdomcome-deliverance/src/collections/collections.ts
    - extensions/games/game-kingdomcome-deliverance/src/collections/loadOrder.ts
    - extensions/games/game-kingdomcome-deliverance/src/collections/util.ts
    - extensions/games/game-kingdomcome-deliverance/src/index.ts
    - extensions/games/game-spyroreignitedtrilogy/src/index.ts
    - extensions/games/game-spyroreignitedtrilogy/src/loadOrder.ts
    - extensions/games/game-spyroreignitedtrilogy/src/migrations.ts
    - extensions/games/game-spyroreignitedtrilogy/src/util.ts
    - extensions/games/game-morrowind/src/index.ts
    - extensions/games/game-morrowind/src/loadorder.js
    - extensions/games/game-morrowind/src/migrations.js
    - extensions/games/game-morrowind/src/views/MorrowindCollectionsDataView.tsx
    - extensions/games/game-codevein/src/index.ts
    - extensions/games/game-codevein/src/loadOrder.ts
    - extensions/games/game-codevein/src/migrations.ts
    - extensions/games/game-codevein/src/util.ts
    - extensions/games/game-bloodstainedritualofthenight/src/index.ts
    - extensions/games/game-bloodstainedritualofthenight/src/loadOrder.ts
    - extensions/games/game-bloodstainedritualofthenight/src/migrations.ts
    - extensions/games/game-bloodstainedritualofthenight/src/util.ts
    - extensions/games/game-bladeandsorcery/src/index.js
    - extensions/games/game-bladeandsorcery/src/installers.js
    - extensions/games/game-bladeandsorcery/src/migrations.js
    - extensions/games/game-bladeandsorcery/src/util.js
    - extensions/games/game-untitledgoose/src/index.ts
    - extensions/games/game-untitledgoose/src/migrations.ts
    - extensions/games/game-untitledgoose/src/util.ts
    - .planning/phases/33-gamebryo-per-game-extensions-v2-0-1/33-05-SUMMARY.md
autonomous: true
requirements:
    - SYNC-33a
must_haves:
    truths:
        - "All 28 medium per-game files marker-free across 7 extensions"
        - "28 atomic SSH-signed `resolve(<slug>): ...` commits"
        - "Per-extension Pattern P4 Route 2 (`pnpm --filter <name> build`) returns 0 non-marker errors at each extension closeout"
        - "Harness 12 gates stay GREEN after every commit"
        - "Gate-11 ACTIVE on game-morrowind/src/migrations.js — Pattern P2 pre/post sentinel grep on `'morrowind migrate103: mod directory missing'` returns ≥1 both pre and post"
        - "Tier-1 fork-wins applied to any region overlapping migrations.js lines 50/60 (RESEARCH §4)"
        - "All other regions default tier-5 smaller-diff per RESEARCH §2"
    artifacts:
        - path: "extensions/games/game-morrowind/src/migrations.js"
          provides: "Morrowind migrate103 warning preserved (gate-11 sentinel)"
          contains: "morrowind migrate103: mod directory missing"
        - path: "extensions/games/game-kingdomcome-deliverance/src/index.ts"
          provides: "KCD extension entry post-v2.0.1 reflow"
          contains: "registerGame"
    key_links:
        - from: "extensions/games/game-morrowind/src/migrations.js"
          to: "warning sentinel at lines 50/60 (RESEARCH §4)"
          via: "tier-1 fork-wins region overlap"
          pattern: "morrowind migrate103: mod directory missing"
        - from: "extensions/games/game-kingdomcome-deliverance/src/index.ts"
          to: "src/collections/{CollectionsDataView,collections,loadOrder,util}.ts"
          via: "intra-extension imports"
          pattern: "from .*collections/"
---

<objective>
Wave D2. Resolve 28 conflict files across 7 medium per-game extensions. ~6-7 parallel Engineer agents per D-33-12 (extensions are fully independent per RESEARCH §6 cross-extension import audit). Most regions default tier-5 smaller-diff (formatter reflow per RESEARCH §2) — single active fork-wins region in Wave D2 is `game-morrowind/src/migrations.js` (gate-11 active per RESEARCH §4: `morrowind migrate103: mod directory missing` warning at lines 50 and 60).

Purpose: medium-tier per-game extensions consumed by individual game profiles. Independent per-extension; no shared types between them. Get all 7 clean before lowering to D3 single-file extensions.

Output: 28 SSH-signed commits + 1 SUMMARY commit. Harness 12/12 GREEN at end.
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
@.planning/phases/33-gamebryo-per-game-extensions-v2-0-1/33-04-SUMMARY.md
@VORTEX-LINUX-MERGE-PLAYBOOK.md
@CLAUDE.md
@AGENTS.md
</context>

<files_in_scope>
| # | Extension | Slug | Files | Notable |
|---|-----------|------|-------|---------|
| 1 | game-kingdomcome-deliverance | kcd | 5 | collections/\* + index.ts |
| 2 | game-spyroreignitedtrilogy | spyro | 4 | index.ts, loadOrder.ts, migrations.ts, util.ts |
| 3 | game-morrowind | morrowind | 4 | **migrations.js gate-11 ACTIVE**; loadorder.js + index.ts + views/MorrowindCollectionsDataView.tsx |
| 4 | game-codevein | codevein | 4 | index.ts, loadOrder.ts, migrations.ts, util.ts |
| 5 | game-bloodstainedritualofthenight | bloodstained | 4 | index.ts, loadOrder.ts, migrations.ts, util.ts |
| 6 | game-bladeandsorcery | bas | 4 | index.js, installers.js, migrations.js, util.js (all .js — vanilla node) |
| 7 | game-untitledgoose | untitledgoose | 3 | index.ts, migrations.ts, util.ts |

**Total:** 28 files across 7 extensions. **Typecheck route (Pattern P4):** Route 2 — `pnpm --filter <name> build` (no game-\* extension has tsconfig+typecheck script per RESEARCH §3). For all-`.js` extensions (game-bladeandsorcery), `node --check <file>` per file (Route 3) + extension-level `pnpm --filter game-bladeandsorcery build` at closeout.
</files_in_scope>

<active_gates>
Per RESEARCH §4: 1 of 12 gates active in Wave D2.

| Gate           | File                                              | Status     | Mechanism                         |
| -------------- | ------------------------------------------------- | ---------- | --------------------------------- |
| 11 (Morrowind) | extensions/games/game-morrowind/src/migrations.js | **ACTIVE** | Pattern P2 pre/post sentinel grep |

All other 11 gates passive post-commit assertions.
</active_gates>

<active_gate_protocol>
Per D-33-11 / Pattern P2 — applied ONLY to game-morrowind/src/migrations.js:

**Pre-resolution:**

```bash
F=extensions/games/game-morrowind/src/migrations.js
PRE_COUNT=$(git grep -c "'morrowind migrate103: mod directory missing'" -- "$F" || echo 0)
test "$PRE_COUNT" -ge 1 || { echo "FAIL: gate-11 sentinel missing pre-resolve"; exit 1; }
echo "gate-11 pre-count: $PRE_COUNT (expected >=1; warning at lines 50/60 per RESEARCH §4)"
```

**Stance for any region overlapping lines 50 or 60:** tier-1 fork-wins. Preserve the warning string verbatim. Do NOT take upstream side if it removes or alters the sentinel.

**Post-resolution (in same commit):**

```bash
POST_COUNT=$(git grep -c "'morrowind migrate103: mod directory missing'" -- "$F" || echo 0)
test "$POST_COUNT" -ge 1 || { echo "FAIL: gate-11 sentinel lost"; exit 1; }
test "$POST_COUNT" -ge "$PRE_COUNT" || { echo "FAIL: gate-11 sentinel count regressed"; exit 1; }
echo "gate-11 post-count: $POST_COUNT (must be >= $PRE_COUNT)"
```

Record both counts in commit body per Pattern P5.
</active_gate_protocol>

<stance_application_order>
Per D-33-02 (apply in order):

1. Playbook-surface: N/A in Wave D2 (RESEARCH §4 records no §1/§3/§10 hits in any of the 28 files)
2. Linux platform guard: N/A in Wave D2 files (RESEARCH §4 records no `process.platform` hits)
3. **Active gate-11 fork-wins: tier-1 fork-wins on any region in `game-morrowind/src/migrations.js` overlapping the warning at lines 50/60**
4. New v2.0.1 feature scaffolding: N/A in Wave D2 (Wave E covers build scaffolding)
5. Rule-1 dup-import: tier-4 HEAD-empty for any region where upstream merely duplicates a HEAD import (watch index.ts + barrels)
6. Smaller-diff: tier-5 default for everything else (~all other regions per RESEARCH §2)
   </stance_application_order>

<shared_per_task_workflow>
Same as 33-01 (Wave A). Steps 1-10. Per-extension typecheck via Pattern P4 Route 2 deferred to last commit per extension.

**Bluebird trap** (R5 / `feedback_bluebird_promise_trap.md`): spot-check each file with `grep -n 'from .bluebird.' <file>`. If file imports `Promise` from bluebird, do NOT take upstream `:Promise<T>` annotations on async fns — TS1064.

**Vanilla `.js` files (game-bladeandsorcery):** use `node --check <file>` after each commit (Route 3) + `pnpm --filter game-bladeandsorcery build` at extension closeout.
</shared_per_task_workflow>

<tasks>

<task type="auto">
  <name>Task 1: Resolve game-kingdomcome-deliverance (5 files; closeout typecheck)</name>
  <files>
    extensions/games/game-kingdomcome-deliverance/src/collections/CollectionsDataView.tsx
    extensions/games/game-kingdomcome-deliverance/src/collections/collections.ts
    extensions/games/game-kingdomcome-deliverance/src/collections/loadOrder.ts
    extensions/games/game-kingdomcome-deliverance/src/collections/util.ts
    extensions/games/game-kingdomcome-deliverance/src/index.ts
  </files>
  <read_first>
    - All 5 files current state
    - `git show fork/master:<path>` for each
    - extensions/games/game-kingdomcome-deliverance/package.json (name field)
    - .planning/phases/33-gamebryo-per-game-extensions-v2-0-1/33-RESEARCH.md §2 + §6
  </read_first>
  <action>
    Engineer agent (parallel-eligible per D-33-12). Sequential within extension, dependees-first → barrel-last:
    collections/util.ts → collections/loadOrder.ts → collections/collections.ts → collections/CollectionsDataView.tsx → src/index.ts.

    Per file: shared_per_task_workflow steps 1-10, all tier-5 smaller-diff baseline (formatter reflow).
    Bluebird spot-check on each file (KCD historically uses bluebird in collections paths).

    Titles:
    - `resolve(kcd): collections/util.ts — smaller-diff`
    - `resolve(kcd): collections/loadOrder.ts — smaller-diff`
    - `resolve(kcd): collections/collections.ts — smaller-diff`
    - `resolve(kcd): collections/CollectionsDataView.tsx — smaller-diff`
    - `resolve(kcd): src/index.ts — smaller-diff (barrel)` (or `... — Rule-1 dup-import (HEAD-empty)` if applicable)

    **At src/index.ts commit (extension closeout):**
    ```bash
    pnpm --filter game-kingdomcome-deliverance build 2>&1 | grep -E 'error TS' | grep -v TS1185 | wc -l
    ```
    Must be 0. Record in commit body.

  </action>
  <verify>
    <automated>
      cd /home/alex/src/Vortex && \
      ! git grep -l '^&lt;&lt;&lt;&lt;&lt;&lt;&lt; ' extensions/games/game-kingdomcome-deliverance/ &amp;&amp; \
      bash .planning/phases/33-gamebryo-per-game-extensions-v2-0-1/scripts/grep-checkpoint.sh --skip-conflict-check &gt;/dev/null &amp;&amp; \
      TC=$(pnpm --filter game-kingdomcome-deliverance build 2>&amp;1 | grep -E 'error TS' | grep -v TS1185 | wc -l) &amp;&amp; \
      test "$TC" -eq 0 &amp;&amp; \
      git log -5 --pretty=%s | grep -c '^resolve(kcd):' | grep -q '^5$' &amp;&amp; \
      for sha in $(git log -5 --pretty=%H); do git cat-file -p $sha | grep -q '^gpgsig ' || exit 1; done &amp;&amp; \
      echo OK
    </automated>
  </verify>
  <acceptance_criteria>
    - 5 files marker-free; 5 SSH-signed `resolve(kcd): ...` commits
    - `pnpm --filter game-kingdomcome-deliverance build` returns 0 non-marker errors at closeout
    - Harness skip-mode exits 0 after each commit
  </acceptance_criteria>
  <done>kcd resolved + build-as-typecheck GREEN.</done>
</task>

<task type="auto">
  <name>Task 2: Resolve game-spyroreignitedtrilogy (4 files; closeout typecheck)</name>
  <files>
    extensions/games/game-spyroreignitedtrilogy/src/index.ts
    extensions/games/game-spyroreignitedtrilogy/src/loadOrder.ts
    extensions/games/game-spyroreignitedtrilogy/src/migrations.ts
    extensions/games/game-spyroreignitedtrilogy/src/util.ts
  </files>
  <read_first>
    - All 4 files current state
    - `git show fork/master:<path>` for each
  </read_first>
  <action>
    Engineer agent (parallel with Task 1, 3-7). Sequential within extension, leaf-first:
    util.ts → migrations.ts → loadOrder.ts → index.ts.

    All tier-5 smaller-diff baseline. Bluebird spot-check.

    Titles:
    - `resolve(spyro): util.ts — smaller-diff`
    - `resolve(spyro): migrations.ts — smaller-diff`
    - `resolve(spyro): loadOrder.ts — smaller-diff`
    - `resolve(spyro): src/index.ts — smaller-diff (barrel)`

    **Closeout:** `pnpm --filter game-spyroreignitedtrilogy build` non-marker error count = 0.

  </action>
  <verify>
    <automated>
      cd /home/alex/src/Vortex && \
      ! git grep -l '^&lt;&lt;&lt;&lt;&lt;&lt;&lt; ' extensions/games/game-spyroreignitedtrilogy/ &amp;&amp; \
      TC=$(pnpm --filter game-spyroreignitedtrilogy build 2>&amp;1 | grep -E 'error TS' | grep -v TS1185 | wc -l) &amp;&amp; \
      test "$TC" -eq 0 &amp;&amp; \
      git log --since='1 hour ago' --pretty=%s | grep -c '^resolve(spyro):' | grep -q '^4$' &amp;&amp; \
      echo OK
    </automated>
  </verify>
  <acceptance_criteria>
    - 4 files marker-free; 4 SSH-signed `resolve(spyro): ...` commits
    - Build-as-typecheck = 0 non-marker errors
  </acceptance_criteria>
  <done>spyro resolved.</done>
</task>

<task type="auto">
  <name>Task 3: Resolve game-morrowind (4 files; gate-11 ACTIVE on migrations.js; closeout typecheck)</name>
  <files>
    extensions/games/game-morrowind/src/index.ts
    extensions/games/game-morrowind/src/loadorder.js
    extensions/games/game-morrowind/src/migrations.js
    extensions/games/game-morrowind/src/views/MorrowindCollectionsDataView.tsx
  </files>
  <read_first>
    - All 4 files current state
    - `git show fork/master:<path>` for each
    - .planning/phases/33-gamebryo-per-game-extensions-v2-0-1/33-RESEARCH.md §4 (lines 50, 60 sentinel)
    - .planning/phases/33-gamebryo-per-game-extensions-v2-0-1/33-PATTERNS.md (Pattern P2)
  </read_first>
  <action>
    Engineer agent (parallel with Tasks 1-2, 4-7). Sequential within extension:
    views/MorrowindCollectionsDataView.tsx → loadorder.js → migrations.js (**gate-11 active**) → src/index.ts.

    **Per-file specifics:**

    - **views/MorrowindCollectionsDataView.tsx:** tier-5 smaller-diff. Title: `resolve(morrowind): views/MorrowindCollectionsDataView.tsx — smaller-diff`.

    - **loadorder.js:** tier-5 default. `node --check src/loadorder.js` post-resolve. Bluebird spot-check. Title: `resolve(morrowind): loadorder.js — smaller-diff`.

    - **migrations.js (GATE-11 ACTIVE):** apply Pattern P2 pre/post protocol from `<active_gate_protocol>` block above. Stance: tier-1 fork-wins on any region overlapping lines 50/60 (the warning-string emission). Other regions in the file default tier-5. `node --check src/migrations.js` post-resolve. Title: `resolve(morrowind): migrations.js — fork-wins on migrate103 sentinel (gate-11 active)`. Commit body MUST include both PRE_COUNT and POST_COUNT plus stance breakdown per region.

    - **src/index.ts:** tier-5 default; tier-4 HEAD-empty if dup-import. Title: `resolve(morrowind): src/index.ts — smaller-diff (barrel)` (or appropriate stance).

    **Closeout:** `pnpm --filter game-morrowind build` non-marker error count = 0.

  </action>
  <verify>
    <automated>
      cd /home/alex/src/Vortex && \
      ! git grep -l '^&lt;&lt;&lt;&lt;&lt;&lt;&lt; ' extensions/games/game-morrowind/ &amp;&amp; \
      SENTINEL=$(git grep -c "'morrowind migrate103: mod directory missing'" -- extensions/games/game-morrowind/src/migrations.js) &amp;&amp; \
      test "$SENTINEL" -ge 1 &amp;&amp; \
      bash .planning/phases/33-gamebryo-per-game-extensions-v2-0-1/scripts/grep-checkpoint.sh --skip-conflict-check &gt;/dev/null &amp;&amp; \
      TC=$(pnpm --filter game-morrowind build 2>&amp;1 | grep -E 'error TS' | grep -v TS1185 | wc -l) &amp;&amp; \
      test "$TC" -eq 0 &amp;&amp; \
      git log --since='1 hour ago' --pretty=%s | grep -c '^resolve(morrowind):' | grep -q '^4$' &amp;&amp; \
      echo OK
    </automated>
  </verify>
  <acceptance_criteria>
    - 4 files marker-free; 4 SSH-signed `resolve(morrowind): ...` commits
    - Gate-11 sentinel count ≥1 in migrations.js post-commit (and ≥ pre-count)
    - migrations.js commit title contains "fork-wins on migrate103 sentinel (gate-11 active)"
    - migrations.js commit body records pre/post counts + per-region stance breakdown
    - Build-as-typecheck = 0 non-marker errors
  </acceptance_criteria>
  <done>morrowind resolved + gate-11 sentinel preserved + build GREEN.</done>
</task>

<task type="auto">
  <name>Task 4: Resolve game-codevein (4 files; closeout typecheck)</name>
  <files>
    extensions/games/game-codevein/src/index.ts
    extensions/games/game-codevein/src/loadOrder.ts
    extensions/games/game-codevein/src/migrations.ts
    extensions/games/game-codevein/src/util.ts
  </files>
  <read_first>
    - All 4 files current state
    - `git show fork/master:<path>` for each
  </read_first>
  <action>
    Engineer agent (parallel with Tasks 1-3, 5-7). Leaf-first:
    util.ts → migrations.ts → loadOrder.ts → index.ts. All tier-5.

    Titles:
    - `resolve(codevein): util.ts — smaller-diff`
    - `resolve(codevein): migrations.ts — smaller-diff`
    - `resolve(codevein): loadOrder.ts — smaller-diff`
    - `resolve(codevein): src/index.ts — smaller-diff (barrel)`

    **Closeout:** `pnpm --filter game-codevein build` non-marker error count = 0.

  </action>
  <verify>
    <automated>
      cd /home/alex/src/Vortex && \
      ! git grep -l '^&lt;&lt;&lt;&lt;&lt;&lt;&lt; ' extensions/games/game-codevein/ &amp;&amp; \
      TC=$(pnpm --filter game-codevein build 2>&amp;1 | grep -E 'error TS' | grep -v TS1185 | wc -l) &amp;&amp; \
      test "$TC" -eq 0 &amp;&amp; \
      git log --since='1 hour ago' --pretty=%s | grep -c '^resolve(codevein):' | grep -q '^4$' &amp;&amp; \
      echo OK
    </automated>
  </verify>
  <acceptance_criteria>
    - 4 files marker-free; 4 SSH-signed `resolve(codevein): ...` commits
    - Build = 0 non-marker errors
  </acceptance_criteria>
  <done>codevein resolved.</done>
</task>

<task type="auto">
  <name>Task 5: Resolve game-bloodstainedritualofthenight (4 files; closeout typecheck)</name>
  <files>
    extensions/games/game-bloodstainedritualofthenight/src/index.ts
    extensions/games/game-bloodstainedritualofthenight/src/loadOrder.ts
    extensions/games/game-bloodstainedritualofthenight/src/migrations.ts
    extensions/games/game-bloodstainedritualofthenight/src/util.ts
  </files>
  <read_first>
    - All 4 files current state
    - `git show fork/master:<path>` for each
  </read_first>
  <action>
    Engineer agent (parallel with Tasks 1-4, 6-7). Leaf-first: util.ts → migrations.ts → loadOrder.ts → index.ts. All tier-5.

    Titles:
    - `resolve(bloodstained): util.ts — smaller-diff`
    - `resolve(bloodstained): migrations.ts — smaller-diff`
    - `resolve(bloodstained): loadOrder.ts — smaller-diff`
    - `resolve(bloodstained): src/index.ts — smaller-diff (barrel)`

    **Closeout:** `pnpm --filter game-bloodstainedritualofthenight build` non-marker error count = 0.

  </action>
  <verify>
    <automated>
      cd /home/alex/src/Vortex && \
      ! git grep -l '^&lt;&lt;&lt;&lt;&lt;&lt;&lt; ' extensions/games/game-bloodstainedritualofthenight/ &amp;&amp; \
      TC=$(pnpm --filter game-bloodstainedritualofthenight build 2>&amp;1 | grep -E 'error TS' | grep -v TS1185 | wc -l) &amp;&amp; \
      test "$TC" -eq 0 &amp;&amp; \
      git log --since='1 hour ago' --pretty=%s | grep -c '^resolve(bloodstained):' | grep -q '^4$' &amp;&amp; \
      echo OK
    </automated>
  </verify>
  <acceptance_criteria>
    - 4 files marker-free; 4 SSH-signed `resolve(bloodstained): ...` commits
    - Build = 0 non-marker errors
  </acceptance_criteria>
  <done>bloodstained resolved.</done>
</task>

<task type="auto">
  <name>Task 6: Resolve game-bladeandsorcery (4 files all .js; closeout build)</name>
  <files>
    extensions/games/game-bladeandsorcery/src/index.js
    extensions/games/game-bladeandsorcery/src/installers.js
    extensions/games/game-bladeandsorcery/src/migrations.js
    extensions/games/game-bladeandsorcery/src/util.js
  </files>
  <read_first>
    - All 4 files current state
    - `git show fork/master:<path>` for each
    - extensions/games/game-bladeandsorcery/package.json (verify "main" entry)
  </read_first>
  <action>
    Engineer agent (parallel with Tasks 1-5, 7). Leaf-first: util.js → migrations.js → installers.js → index.js.
    Per file `node --check <file>` post-resolve (Route 3 — vanilla .js, no tsconfig).
    Bluebird spot-check (BAS historically uses bluebird in installers.js).

    Titles:
    - `resolve(bas): util.js — smaller-diff`
    - `resolve(bas): migrations.js — smaller-diff`
    - `resolve(bas): installers.js — smaller-diff`
    - `resolve(bas): src/index.js — smaller-diff (barrel)`

    **Closeout:** `pnpm --filter game-bladeandsorcery build` exit 0 (rolldown pass for .js bundles too).

  </action>
  <verify>
    <automated>
      cd /home/alex/src/Vortex && \
      ! git grep -l '^&lt;&lt;&lt;&lt;&lt;&lt;&lt; ' extensions/games/game-bladeandsorcery/ &amp;&amp; \
      for f in extensions/games/game-bladeandsorcery/src/*.js; do node --check "$f" || exit 1; done &amp;&amp; \
      pnpm --filter game-bladeandsorcery build &gt;/dev/null 2&gt;&amp;1 &amp;&amp; \
      git log --since='1 hour ago' --pretty=%s | grep -c '^resolve(bas):' | grep -q '^4$' &amp;&amp; \
      echo OK
    </automated>
  </verify>
  <acceptance_criteria>
    - 4 files marker-free; 4 SSH-signed `resolve(bas): ...` commits
    - `node --check` passes for all 4 .js files
    - `pnpm --filter game-bladeandsorcery build` exits 0
  </acceptance_criteria>
  <done>bas resolved (vanilla node path).</done>
</task>

<task type="auto">
  <name>Task 7: Resolve game-untitledgoose (3 files; closeout typecheck)</name>
  <files>
    extensions/games/game-untitledgoose/src/index.ts
    extensions/games/game-untitledgoose/src/migrations.ts
    extensions/games/game-untitledgoose/src/util.ts
  </files>
  <read_first>
    - All 3 files current state
    - `git show fork/master:<path>` for each
  </read_first>
  <action>
    Engineer agent (parallel with Tasks 1-6). Leaf-first: util.ts → migrations.ts → index.ts. All tier-5.

    Titles:
    - `resolve(untitledgoose): util.ts — smaller-diff`
    - `resolve(untitledgoose): migrations.ts — smaller-diff`
    - `resolve(untitledgoose): src/index.ts — smaller-diff (barrel)`

    **Closeout:** `pnpm --filter game-untitledgoose build` non-marker error count = 0.

  </action>
  <verify>
    <automated>
      cd /home/alex/src/Vortex && \
      ! git grep -l '^&lt;&lt;&lt;&lt;&lt;&lt;&lt; ' extensions/games/game-untitledgoose/ &amp;&amp; \
      TC=$(pnpm --filter game-untitledgoose build 2>&amp;1 | grep -E 'error TS' | grep -v TS1185 | wc -l) &amp;&amp; \
      test "$TC" -eq 0 &amp;&amp; \
      git log --since='1 hour ago' --pretty=%s | grep -c '^resolve(untitledgoose):' | grep -q '^3$' &amp;&amp; \
      echo OK
    </automated>
  </verify>
  <acceptance_criteria>
    - 3 files marker-free; 3 SSH-signed `resolve(untitledgoose): ...` commits
    - Build = 0 non-marker errors
  </acceptance_criteria>
  <done>untitledgoose resolved.</done>
</task>

<task type="auto">
  <name>Task 8: Wave D2 SUMMARY commit</name>
  <files>.planning/phases/33-gamebryo-per-game-extensions-v2-0-1/33-05-SUMMARY.md</files>
  <read_first>
    - All Wave D2 commit messages: `git log --oneline 33-04..HEAD -- extensions/games/`
    - $HOME/.claude/get-shit-done/templates/summary.md
  </read_first>
  <action>
    Write `33-05-SUMMARY.md`. Required sections:
    - Outcome: 7/7 medium per-game extensions resolved; 28 commits + 1 docs commit
    - Per-extension table: slug, files, regions, stance breakdown, closeout build status
    - Active gate result: gate-11 (Morrowind migrations.js) — pre/post sentinel counts
    - Harness state: 12/12 GREEN
    - Affects: Wave D3 unblocked (light per-game extensions); Wave F catalog re-add still pending consumer evidence audit
    - Provides: 7 medium per-game extensions fully resolved
    - Issues encountered (if any) — note any tier escalations from defaults

    Add via `git add -f`. Title: `docs(33-05): summarize Wave D2 medium per-game resolution (7 extensions, 28 files, 28 commits)`.

  </action>
  <verify>
    <automated>
      cd /home/alex/src/Vortex && \
      test -f .planning/phases/33-gamebryo-per-game-extensions-v2-0-1/33-05-SUMMARY.md &amp;&amp; \
      git log -1 --pretty=%s | grep -q '^docs(33-05): summarize Wave D2' &amp;&amp; \
      git cat-file -p HEAD | grep -q '^gpgsig ' &amp;&amp; \
      echo OK
    </automated>
  </verify>
  <acceptance_criteria>
    - 33-05-SUMMARY.md exists, committed via `git add -f`, SSH-signed
    - 28 `resolve(<slug>):` commits (kcd×5, spyro×4, morrowind×4, codevein×4, bloodstained×4, bas×4, untitledgoose×3) + 1 docs commit
    - Conflict-marker files in 7 extension dirs: 0
  </acceptance_criteria>
  <done>Wave D2 complete; summary committed; branch ready for Wave D3.</done>
</task>

</tasks>

<verification>
After all tasks:
- `git grep -l '^<<<<<<< ' extensions/games/{game-kingdomcome-deliverance,game-spyroreignitedtrilogy,game-morrowind,game-codevein,game-bloodstainedritualofthenight,game-bladeandsorcery,game-untitledgoose}/` returns empty
- `bash .planning/phases/33-gamebryo-per-game-extensions-v2-0-1/scripts/grep-checkpoint.sh --skip-conflict-check` exits 0
- Per-extension `pnpm --filter <name> build` returns 0 non-marker errors for all 7
- 28 + 1 SSH-signed commits on Wave D2
- Gate-11 sentinel count ≥1 in game-morrowind/src/migrations.js
</verification>

<success_criteria>

- 7 medium per-game extensions fully resolved
- 28 + 1 SSH-signed commits
- Gate-11 active resolution complete with sentinel preserved
- Harness 12/12 GREEN
- Wave D3 unblocked
  </success_criteria>

<output>
Create `.planning/phases/33-gamebryo-per-game-extensions-v2-0-1/33-05-SUMMARY.md` per Task 8.
</output>
