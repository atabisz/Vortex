---
phase: 33-gamebryo-per-game-extensions-v2-0-1
plan: 06
type: execute
wave: 6
depends_on:
    - 33-05
files_modified:
    # 60 single-file game-* extensions; all conflicts in src/index.{ts,js}
    # Authoritative file list: see <files_in_scope> table below
    - extensions/games/game-ahatintime/src/index.js
    - extensions/games/game-battletech/src/index.js
    - extensions/games/game-conanexiles/src/index.js
    - extensions/games/game-daggerfallunity/src/index.js
    - extensions/games/game-darkestdungeon/src/index.js
    - extensions/games/game-darksouls/src/index.js
    - extensions/games/game-dawnofman/src/index.js
    - extensions/games/game-divinityoriginalsin2/src/index.js
    - extensions/games/game-dragonage/src/index.js
    - extensions/games/game-dragonage2/src/index.js
    - extensions/games/game-dragons-dogma/src/index.js
    - extensions/games/game-elex/src/index.js
    - extensions/games/game-enderal/src/index.js
    - extensions/games/game-factorio/src/index.js
    - extensions/games/game-fallout3/src/index.js
    - extensions/games/game-fallout4/src/index.js
    - extensions/games/game-fallout4vr/src/index.js
    - extensions/games/game-falloutnv/src/index.ts
    - extensions/games/game-galciv3/src/index.js
    - extensions/games/game-gardenpaws/src/index.js
    - extensions/games/game-greedfall/src/index.js
    - extensions/games/game-grimdawn/src/index.js
    - extensions/games/game-grimrock/src/index.js
    - extensions/games/game-kenshi/src/index.js
    - extensions/games/game-kerbalspaceprogram/src/index.js
    - extensions/games/game-microsoftflightsimulator/src/index.js
    - extensions/games/game-monster-hunter-world/src/index.js
    - extensions/games/game-mount-and-blade/src/index.js
    - extensions/games/game-neverwinter-nights/src/index.js
    - extensions/games/game-neverwinter-nights2/src/index.js
    - extensions/games/game-nomanssky/src/index.ts
    - extensions/games/game-oblivion/src/index.js
    - extensions/games/game-oni/src/index.js
    - extensions/games/game-pathfinderkingmaker/src/index.js
    - extensions/games/game-pathfinderwrathoftherighteous/src/index.ts
    - extensions/games/game-prisonarchitect/src/index.js
    - extensions/games/game-rimworld/src/index.js
    - extensions/games/game-sekiro/src/index.js
    - extensions/games/game-shadowrunreturns/src/index.js
    - extensions/games/game-sims3/src/index.js
    - extensions/games/game-sims4/src/index.js
    - extensions/games/game-skyrim/src/index.js
    - extensions/games/game-skyrimse/src/index.js
    - extensions/games/game-skyrimvr/src/index.js
    - extensions/games/game-starbound/src/index.js
    - extensions/games/game-survivingmars/src/index.js
    - extensions/games/game-sw-kotor/src/index.js
    - extensions/games/game-teamfortress2/src/index.js
    - extensions/games/game-teso/src/index.js
    - extensions/games/game-torchlight2/src/index.js
    - extensions/games/game-totalwarthreekingdoms/src/index.js
    - extensions/games/game-vtmbloodlines/src/index.js
    - extensions/games/game-warthunder/src/index.js
    - extensions/games/game-witcher/src/index.js
    - extensions/games/game-witcher2/src/index.js
    - extensions/games/game-wolcen/src/index.js
    - extensions/games/game-worldoftanks/src/index.js
    - extensions/games/game-x4foundations/src/index.js
    - extensions/games/game-xcom2/src/index.js
    - extensions/games/game-xrebirth/src/index.js
    - .planning/phases/33-gamebryo-per-game-extensions-v2-0-1/33-06-SUMMARY.md
autonomous: true
requirements:
    - SYNC-33a
must_haves:
    truths:
        - "All 60 single-file per-game extensions marker-free"
        - "60 atomic SSH-signed `resolve(<short-slug>): src/index.{ts,js} — smaller-diff` commits"
        - "Per-extension Pattern P4 Route 2 (`pnpm --filter <name> build`) returns exit 0 at each batch closeout"
        - "Harness 12 gates stay GREEN after every commit"
        - "All regions tier-5 smaller-diff (formatter reflow per RESEARCH §2) — 0 active gates in Wave D3"
        - "All 60 `.js` files validated with `node --check` post-commit (Route 3); 3 `.ts` files validated via `pnpm --filter <name> build`"
    artifacts:
        - path: "extensions/games/game-skyrimse/src/index.js"
          provides: "SkyrimSE extension entry post-v2.0.1 reflow (continues working with §1+§3 guards from prior phases)"
          contains: "registerGame"
    key_links:
        - from: "extensions/games/game-skyrim/src/index.js"
          to: "vortex-api re-exports of @vortex/main"
          via: "vortex-api imports"
          pattern: "from .vortex-api."
---

<objective>
Wave D3. Resolve 60 conflict files across 60 single-file light per-game extensions (1 file per extension; all are `src/index.{ts,js}` — 57 `.js`, 3 `.ts`). Batched ~10 extensions per Engineer agent → 6 parallel agents per D-33-12. All regions default tier-5 smaller-diff (formatter reflow per RESEARCH §2); 0 active gates per RESEARCH §4 (no §1/§3/§10/BG3/Morrowind/process.platform hits).

Purpose: Mass-resolve the long tail of per-game extensions. Each extension is independent (RESEARCH §6 cross-extension import audit confirms no inter-game imports). Pure formatter-reflow churn from upstream's oxfmt application.

Output: 60 SSH-signed commits + 1 SUMMARY commit. Harness 12/12 GREEN at end.
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
@.planning/phases/33-gamebryo-per-game-extensions-v2-0-1/33-05-SUMMARY.md
@VORTEX-LINUX-MERGE-PLAYBOOK.md
@CLAUDE.md
@AGENTS.md
</context>

<files_in_scope>
60 extensions × 1 file each = 60 files. All `src/index.{ts,js}`.

**Batches (6 batches of 10 extensions for parallel Engineer dispatch):**

| Batch | Extensions (slug used in commit title is bracketed)                                                                                                                                                                                                                        | Count |
| ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- |
| B1    | ahatintime [ahatintime], battletech [battletech], conanexiles [conanexiles], daggerfallunity [daggerfallunity], darkestdungeon [darkestdungeon], darksouls [darksouls], dawnofman [dawnofman], divinityoriginalsin2 [dos2], dragonage [dragonage], dragonage2 [dragonage2] | 10    |
| B2    | dragons-dogma [dragons-dogma], elex [elex], enderal [enderal], factorio [factorio], fallout3 [fallout3], fallout4 [fallout4], fallout4vr [fallout4vr], falloutnv [falloutnv], galciv3 [galciv3], gardenpaws [gardenpaws]                                                   | 10    |
| B3    | greedfall [greedfall], grimdawn [grimdawn], grimrock [grimrock], kenshi [kenshi], kerbalspaceprogram [ksp], microsoftflightsimulator [msfs], monster-hunter-world [mhw], mount-and-blade [mab], neverwinter-nights [nwn], neverwinter-nights2 [nwn2]                       | 10    |
| B4    | nomanssky [nomanssky], oblivion [oblivion], oni [oni], pathfinderkingmaker [pfkm], pathfinderwrathoftherighteous [pfwotr], prisonarchitect [prisonarchitect], rimworld [rimworld], sekiro [sekiro], shadowrunreturns [shadowrun], sims3 [sims3]                            | 10    |
| B5    | sims4 [sims4], skyrim [skyrim], skyrimse [skyrimse], skyrimvr [skyrimvr], starbound [starbound], survivingmars [survivingmars], sw-kotor [kotor], teamfortress2 [tf2], teso [teso], torchlight2 [torchlight2]                                                              | 10    |
| B6    | totalwarthreekingdoms [tw3k], vtmbloodlines [vtmb], warthunder [warthunder], witcher [witcher], witcher2 [witcher2], wolcen [wolcen], worldoftanks [wot], x4foundations [x4], xcom2 [xcom2], xrebirth [xrebirth]                                                           | 10    |

**Total:** 60 files. **Slug rule (D-33-07):** slug used in commit title is the short bracketed form above; full directory name is `game-<extension>`.

**Typecheck route (Pattern P4):**

- 3 `.ts` files (falloutnv, nomanssky, pfwotr): Route 2 — `pnpm --filter game-<name> build`
- 57 `.js` files: Route 3 per-file — `node --check src/index.js` + Route 2 batch closeout — `pnpm --filter game-<name> build` exit 0
  </files_in_scope>

<active_gates>
Per RESEARCH §4: 0 of 12 gates active in Wave D3 (no §1/§3/§10 surfaces, no `process.platform` hits, no BG3/Morrowind sentinels). All 12 gates passive post-commit assertions.
</active_gates>

<stance_application_order>
Per D-33-02:

1. Playbook-surface: N/A in Wave D3
2. Linux platform guard: N/A
3. New v2.0.1 feature scaffolding: N/A
4. Rule-1 dup-import: tier-4 HEAD-empty if upstream merely duplicates a HEAD import block (rare; watch for it)
5. **Smaller-diff: tier-5 default for ~all regions per RESEARCH §2 (formatter reflow)**
   </stance_application_order>

<shared_per_task_workflow>
Same as 33-01 (Wave A). Steps 1-10. Per-extension build deferred to last commit per batch.

**Bluebird trap** (R5): every file must be spot-checked with `grep -n 'from .bluebird.' <file>` before applying upstream `:Promise<T>` annotations.

**Vanilla `.js` files:** `node --check <file>` post-commit (Route 3) + `pnpm --filter game-<name> build` at extension closeout (Route 2). Single-file extensions = each commit IS the extension closeout, so both checks run per commit.
</shared_per_task_workflow>

<tasks>

<task type="auto">
  <name>Task 1: Resolve Batch B1 (10 extensions: ahatintime → dragonage2)</name>
  <files>
    extensions/games/game-ahatintime/src/index.js
    extensions/games/game-battletech/src/index.js
    extensions/games/game-conanexiles/src/index.js
    extensions/games/game-daggerfallunity/src/index.js
    extensions/games/game-darkestdungeon/src/index.js
    extensions/games/game-darksouls/src/index.js
    extensions/games/game-dawnofman/src/index.js
    extensions/games/game-divinityoriginalsin2/src/index.js
    extensions/games/game-dragonage/src/index.js
    extensions/games/game-dragonage2/src/index.js
  </files>
  <read_first>
    - All 10 files current state
    - `git show fork/master:<path>` for each
    - .planning/phases/33-gamebryo-per-game-extensions-v2-0-1/33-RESEARCH.md §2 + §6
  </read_first>
  <action>
    Engineer agent (parallel-eligible per D-33-12; runs in parallel with Tasks 2-6).
    Sequential within batch — one file at a time, all tier-5 smaller-diff baseline. Bluebird spot-check on each.

    For each of the 10 files run shared_per_task_workflow steps 1-10. Title format:
    `resolve(<slug>): src/index.js — smaller-diff`

    Where `<slug>` is the bracketed slug from the files_in_scope table:
    - `resolve(ahatintime): src/index.js — smaller-diff`
    - `resolve(battletech): src/index.js — smaller-diff`
    - `resolve(conanexiles): src/index.js — smaller-diff`
    - `resolve(daggerfallunity): src/index.js — smaller-diff`
    - `resolve(darkestdungeon): src/index.js — smaller-diff`
    - `resolve(darksouls): src/index.js — smaller-diff`
    - `resolve(dawnofman): src/index.js — smaller-diff`
    - `resolve(dos2): src/index.js — smaller-diff`
    - `resolve(dragonage): src/index.js — smaller-diff`
    - `resolve(dragonage2): src/index.js — smaller-diff`

    Per file: `node --check <file>` post-resolve + `pnpm --filter game-<name> build` at the same commit (single-file extensions; per-commit = per-extension closeout). Build must exit 0. Commit body records both checks per Pattern P5.

    If any file shows Rule-1 dup-import → escalate to tier-4 HEAD-empty and adjust title to `... — Rule-1 dup-import (HEAD-empty)`.

  </action>
  <verify>
    <automated>
      cd /home/alex/src/Vortex && \
      ! git grep -l '^&lt;&lt;&lt;&lt;&lt;&lt;&lt; ' extensions/games/game-{ahatintime,battletech,conanexiles,daggerfallunity,darkestdungeon,darksouls,dawnofman,divinityoriginalsin2,dragonage,dragonage2}/ &amp;&amp; \
      for f in $(git diff-tree --no-commit-id --name-only -r HEAD~10..HEAD -- 'extensions/games/*/src/index.js' 2>/dev/null | sort -u); do node --check "$f" || exit 1; done &amp;&amp; \
      bash .planning/phases/33-gamebryo-per-game-extensions-v2-0-1/scripts/grep-checkpoint.sh --skip-conflict-check &gt;/dev/null &amp;&amp; \
      git log -10 --pretty=%s | grep -cE '^resolve\((ahatintime|battletech|conanexiles|daggerfallunity|darkestdungeon|darksouls|dawnofman|dos2|dragonage|dragonage2)\):' | grep -q '^10$' &amp;&amp; \
      for sha in $(git log -10 --pretty=%H); do git cat-file -p $sha | grep -q '^gpgsig ' || exit 1; done &amp;&amp; \
      echo OK
    </automated>
  </verify>
  <acceptance_criteria>
    - 10 files marker-free; 10 SSH-signed `resolve(<slug>): src/index.js — smaller-diff` commits
    - `node --check` passes for all 10 .js files
    - Each commit body records `pnpm --filter game-<name> build` exit 0
  </acceptance_criteria>
  <done>Batch B1 resolved.</done>
</task>

<task type="auto">
  <name>Task 2: Resolve Batch B2 (10 extensions: dragons-dogma → gardenpaws)</name>
  <files>
    extensions/games/game-dragons-dogma/src/index.js
    extensions/games/game-elex/src/index.js
    extensions/games/game-enderal/src/index.js
    extensions/games/game-factorio/src/index.js
    extensions/games/game-fallout3/src/index.js
    extensions/games/game-fallout4/src/index.js
    extensions/games/game-fallout4vr/src/index.js
    extensions/games/game-falloutnv/src/index.ts
    extensions/games/game-galciv3/src/index.js
    extensions/games/game-gardenpaws/src/index.js
  </files>
  <read_first>
    - All 10 files current state
    - `git show fork/master:<path>` for each
  </read_first>
  <action>
    Engineer agent (parallel with Tasks 1, 3-6). Sequential within batch. All tier-5 smaller-diff.

    **Note:** falloutnv is `.ts` (Route 2 only — `pnpm --filter game-falloutnv build` exit 0; no `node --check` needed). Other 9 are `.js` (Route 3 + Route 2).

    Titles:
    - `resolve(dragons-dogma): src/index.js — smaller-diff`
    - `resolve(elex): src/index.js — smaller-diff`
    - `resolve(enderal): src/index.js — smaller-diff`
    - `resolve(factorio): src/index.js — smaller-diff`
    - `resolve(fallout3): src/index.js — smaller-diff`
    - `resolve(fallout4): src/index.js — smaller-diff`
    - `resolve(fallout4vr): src/index.js — smaller-diff`
    - `resolve(falloutnv): src/index.ts — smaller-diff`
    - `resolve(galciv3): src/index.js — smaller-diff`
    - `resolve(gardenpaws): src/index.js — smaller-diff`

    Per file: `node --check` (`.js` only) + `pnpm --filter game-<name> build` exit 0.

  </action>
  <verify>
    <automated>
      cd /home/alex/src/Vortex && \
      ! git grep -l '^&lt;&lt;&lt;&lt;&lt;&lt;&lt; ' extensions/games/game-{dragons-dogma,elex,enderal,factorio,fallout3,fallout4,fallout4vr,falloutnv,galciv3,gardenpaws}/ &amp;&amp; \
      git log -10 --pretty=%s | grep -cE '^resolve\((dragons-dogma|elex|enderal|factorio|fallout3|fallout4|fallout4vr|falloutnv|galciv3|gardenpaws)\):' | grep -q '^10$' &amp;&amp; \
      echo OK
    </automated>
  </verify>
  <acceptance_criteria>
    - 10 files marker-free; 10 SSH-signed commits with correct slug prefixes
    - Each commit body records build exit 0
  </acceptance_criteria>
  <done>Batch B2 resolved.</done>
</task>

<task type="auto">
  <name>Task 3: Resolve Batch B3 (10 extensions: greedfall → neverwinter-nights2)</name>
  <files>
    extensions/games/game-greedfall/src/index.js
    extensions/games/game-grimdawn/src/index.js
    extensions/games/game-grimrock/src/index.js
    extensions/games/game-kenshi/src/index.js
    extensions/games/game-kerbalspaceprogram/src/index.js
    extensions/games/game-microsoftflightsimulator/src/index.js
    extensions/games/game-monster-hunter-world/src/index.js
    extensions/games/game-mount-and-blade/src/index.js
    extensions/games/game-neverwinter-nights/src/index.js
    extensions/games/game-neverwinter-nights2/src/index.js
  </files>
  <read_first>
    - All 10 files current state
    - `git show fork/master:<path>` for each
  </read_first>
  <action>
    Engineer agent (parallel with Tasks 1-2, 4-6). Sequential within batch. All tier-5 smaller-diff. All `.js` (Route 3 + Route 2).

    Titles:
    - `resolve(greedfall): src/index.js — smaller-diff`
    - `resolve(grimdawn): src/index.js — smaller-diff`
    - `resolve(grimrock): src/index.js — smaller-diff`
    - `resolve(kenshi): src/index.js — smaller-diff`
    - `resolve(ksp): src/index.js — smaller-diff`
    - `resolve(msfs): src/index.js — smaller-diff`
    - `resolve(mhw): src/index.js — smaller-diff`
    - `resolve(mab): src/index.js — smaller-diff`
    - `resolve(nwn): src/index.js — smaller-diff`
    - `resolve(nwn2): src/index.js — smaller-diff`

  </action>
  <verify>
    <automated>
      cd /home/alex/src/Vortex && \
      ! git grep -l '^&lt;&lt;&lt;&lt;&lt;&lt;&lt; ' extensions/games/game-{greedfall,grimdawn,grimrock,kenshi,kerbalspaceprogram,microsoftflightsimulator,monster-hunter-world,mount-and-blade,neverwinter-nights,neverwinter-nights2}/ &amp;&amp; \
      git log -10 --pretty=%s | grep -cE '^resolve\((greedfall|grimdawn|grimrock|kenshi|ksp|msfs|mhw|mab|nwn|nwn2)\):' | grep -q '^10$' &amp;&amp; \
      echo OK
    </automated>
  </verify>
  <acceptance_criteria>
    - 10 files marker-free; 10 SSH-signed commits with correct slug prefixes
  </acceptance_criteria>
  <done>Batch B3 resolved.</done>
</task>

<task type="auto">
  <name>Task 4: Resolve Batch B4 (10 extensions: nomanssky → sims3)</name>
  <files>
    extensions/games/game-nomanssky/src/index.ts
    extensions/games/game-oblivion/src/index.js
    extensions/games/game-oni/src/index.js
    extensions/games/game-pathfinderkingmaker/src/index.js
    extensions/games/game-pathfinderwrathoftherighteous/src/index.ts
    extensions/games/game-prisonarchitect/src/index.js
    extensions/games/game-rimworld/src/index.js
    extensions/games/game-sekiro/src/index.js
    extensions/games/game-shadowrunreturns/src/index.js
    extensions/games/game-sims3/src/index.js
  </files>
  <read_first>
    - All 10 files current state
    - `git show fork/master:<path>` for each
  </read_first>
  <action>
    Engineer agent (parallel with Tasks 1-3, 5-6). Sequential within batch. All tier-5 smaller-diff.

    **Note:** nomanssky and pfwotr are `.ts` (Route 2 only). Other 8 are `.js` (Route 3 + Route 2).

    Titles:
    - `resolve(nomanssky): src/index.ts — smaller-diff`
    - `resolve(oblivion): src/index.js — smaller-diff`
    - `resolve(oni): src/index.js — smaller-diff`
    - `resolve(pfkm): src/index.js — smaller-diff`
    - `resolve(pfwotr): src/index.ts — smaller-diff`
    - `resolve(prisonarchitect): src/index.js — smaller-diff`
    - `resolve(rimworld): src/index.js — smaller-diff`
    - `resolve(sekiro): src/index.js — smaller-diff`
    - `resolve(shadowrun): src/index.js — smaller-diff`
    - `resolve(sims3): src/index.js — smaller-diff`

  </action>
  <verify>
    <automated>
      cd /home/alex/src/Vortex && \
      ! git grep -l '^&lt;&lt;&lt;&lt;&lt;&lt;&lt; ' extensions/games/game-{nomanssky,oblivion,oni,pathfinderkingmaker,pathfinderwrathoftherighteous,prisonarchitect,rimworld,sekiro,shadowrunreturns,sims3}/ &amp;&amp; \
      git log -10 --pretty=%s | grep -cE '^resolve\((nomanssky|oblivion|oni|pfkm|pfwotr|prisonarchitect|rimworld|sekiro|shadowrun|sims3)\):' | grep -q '^10$' &amp;&amp; \
      echo OK
    </automated>
  </verify>
  <acceptance_criteria>
    - 10 files marker-free; 10 SSH-signed commits with correct slug prefixes
  </acceptance_criteria>
  <done>Batch B4 resolved.</done>
</task>

<task type="auto">
  <name>Task 5: Resolve Batch B5 (10 extensions: sims4 → torchlight2)</name>
  <files>
    extensions/games/game-sims4/src/index.js
    extensions/games/game-skyrim/src/index.js
    extensions/games/game-skyrimse/src/index.js
    extensions/games/game-skyrimvr/src/index.js
    extensions/games/game-starbound/src/index.js
    extensions/games/game-survivingmars/src/index.js
    extensions/games/game-sw-kotor/src/index.js
    extensions/games/game-teamfortress2/src/index.js
    extensions/games/game-teso/src/index.js
    extensions/games/game-torchlight2/src/index.js
  </files>
  <read_first>
    - All 10 files current state
    - `git show fork/master:<path>` for each
    - **Special note:** skyrim/skyrimse/skyrimvr index.js files are gamebryo-engine — confirm RESEARCH §4 records 0 §1/§3/§10 hits in *these specific paths* (the §1/§3/§10 invariants live in `extensions/gamebryo-*` not `extensions/games/game-skyrim*`). If a region in any skyrim index.js touches gamebryo loader/native paths, escalate stance.
  </read_first>
  <action>
    Engineer agent (parallel with Tasks 1-4, 6). Sequential within batch. All tier-5 smaller-diff baseline. All `.js` (Route 3 + Route 2).

    Titles:
    - `resolve(sims4): src/index.js — smaller-diff`
    - `resolve(skyrim): src/index.js — smaller-diff`
    - `resolve(skyrimse): src/index.js — smaller-diff`
    - `resolve(skyrimvr): src/index.js — smaller-diff`
    - `resolve(starbound): src/index.js — smaller-diff`
    - `resolve(survivingmars): src/index.js — smaller-diff`
    - `resolve(kotor): src/index.js — smaller-diff`
    - `resolve(tf2): src/index.js — smaller-diff`
    - `resolve(teso): src/index.js — smaller-diff`
    - `resolve(torchlight2): src/index.js — smaller-diff`

  </action>
  <verify>
    <automated>
      cd /home/alex/src/Vortex && \
      ! git grep -l '^&lt;&lt;&lt;&lt;&lt;&lt;&lt; ' extensions/games/game-{sims4,skyrim,skyrimse,skyrimvr,starbound,survivingmars,sw-kotor,teamfortress2,teso,torchlight2}/ &amp;&amp; \
      git log -10 --pretty=%s | grep -cE '^resolve\((sims4|skyrim|skyrimse|skyrimvr|starbound|survivingmars|kotor|tf2|teso|torchlight2)\):' | grep -q '^10$' &amp;&amp; \
      echo OK
    </automated>
  </verify>
  <acceptance_criteria>
    - 10 files marker-free; 10 SSH-signed commits with correct slug prefixes
  </acceptance_criteria>
  <done>Batch B5 resolved.</done>
</task>

<task type="auto">
  <name>Task 6: Resolve Batch B6 (10 extensions: totalwarthreekingdoms → xrebirth)</name>
  <files>
    extensions/games/game-totalwarthreekingdoms/src/index.js
    extensions/games/game-vtmbloodlines/src/index.js
    extensions/games/game-warthunder/src/index.js
    extensions/games/game-witcher/src/index.js
    extensions/games/game-witcher2/src/index.js
    extensions/games/game-wolcen/src/index.js
    extensions/games/game-worldoftanks/src/index.js
    extensions/games/game-x4foundations/src/index.js
    extensions/games/game-xcom2/src/index.js
    extensions/games/game-xrebirth/src/index.js
  </files>
  <read_first>
    - All 10 files current state
    - `git show fork/master:<path>` for each
  </read_first>
  <action>
    Engineer agent (parallel with Tasks 1-5). Sequential within batch. All tier-5 smaller-diff. All `.js` (Route 3 + Route 2).

    Titles:
    - `resolve(tw3k): src/index.js — smaller-diff`
    - `resolve(vtmb): src/index.js — smaller-diff`
    - `resolve(warthunder): src/index.js — smaller-diff`
    - `resolve(witcher): src/index.js — smaller-diff`
    - `resolve(witcher2): src/index.js — smaller-diff`
    - `resolve(wolcen): src/index.js — smaller-diff`
    - `resolve(wot): src/index.js — smaller-diff`
    - `resolve(x4): src/index.js — smaller-diff`
    - `resolve(xcom2): src/index.js — smaller-diff`
    - `resolve(xrebirth): src/index.js — smaller-diff`

  </action>
  <verify>
    <automated>
      cd /home/alex/src/Vortex && \
      ! git grep -l '^&lt;&lt;&lt;&lt;&lt;&lt;&lt; ' extensions/games/game-{totalwarthreekingdoms,vtmbloodlines,warthunder,witcher,witcher2,wolcen,worldoftanks,x4foundations,xcom2,xrebirth}/ &amp;&amp; \
      git log -10 --pretty=%s | grep -cE '^resolve\((tw3k|vtmb|warthunder|witcher|witcher2|wolcen|wot|x4|xcom2|xrebirth)\):' | grep -q '^10$' &amp;&amp; \
      echo OK
    </automated>
  </verify>
  <acceptance_criteria>
    - 10 files marker-free; 10 SSH-signed commits with correct slug prefixes
  </acceptance_criteria>
  <done>Batch B6 resolved.</done>
</task>

<task type="auto">
  <name>Task 7: Wave D3 SUMMARY commit</name>
  <files>.planning/phases/33-gamebryo-per-game-extensions-v2-0-1/33-06-SUMMARY.md</files>
  <read_first>
    - All Wave D3 commits: `git log --oneline 33-05..HEAD -- extensions/games/`
    - $HOME/.claude/get-shit-done/templates/summary.md
  </read_first>
  <action>
    Write `33-06-SUMMARY.md`. Required sections:
    - Outcome: 60/60 light per-game extensions resolved; 60 commits + 1 docs commit
    - Per-batch table: batch ID, extensions, file types (.ts/.js), per-extension build status
    - Active gates: 0 (all passive in Wave D3)
    - Harness state: 12/12 GREEN
    - Affects: Wave E unblocked (build scaffolding); Wave F catalog re-add still pending consumer evidence audit (D1+D2 evidence already captured)
    - Provides: 60 single-file per-game extensions fully resolved; long tail closed
    - Issues encountered (if any) — note any tier escalations from defaults

    Add via `git add -f`. Title: `docs(33-06): summarize Wave D3 light per-game resolution (60 extensions, 60 files, 60 commits)`.

  </action>
  <verify>
    <automated>
      cd /home/alex/src/Vortex && \
      test -f .planning/phases/33-gamebryo-per-game-extensions-v2-0-1/33-06-SUMMARY.md &amp;&amp; \
      git log -1 --pretty=%s | grep -q '^docs(33-06): summarize Wave D3' &amp;&amp; \
      git cat-file -p HEAD | grep -q '^gpgsig ' &amp;&amp; \
      echo OK
    </automated>
  </verify>
  <acceptance_criteria>
    - 33-06-SUMMARY.md exists, committed via `git add -f`, SSH-signed
    - 60 `resolve(<slug>):` commits across the 60 extensions + 1 docs commit on Wave D3
    - Conflict-marker files in 60 D3 extension dirs: 0
  </acceptance_criteria>
  <done>Wave D3 complete; per-game long tail closed; branch ready for Wave E.</done>
</task>

</tasks>

<verification>
After all tasks:
- `git grep -l '^<<<<<<< ' extensions/games/` (across all 60 D3 extensions) returns empty
- `bash .planning/phases/33-gamebryo-per-game-extensions-v2-0-1/scripts/grep-checkpoint.sh --skip-conflict-check` exits 0
- All 60 per-extension `pnpm --filter game-<name> build` invocations exit 0
- 60 + 1 SSH-signed commits on Wave D3
</verification>

<success_criteria>

- 60 light per-game extensions fully resolved
- 60 + 1 SSH-signed commits
- Harness 12/12 GREEN
- Wave E unblocked
  </success_criteria>

<output>
Create `.planning/phases/33-gamebryo-per-game-extensions-v2-0-1/33-06-SUMMARY.md` per Task 7.
</output>
