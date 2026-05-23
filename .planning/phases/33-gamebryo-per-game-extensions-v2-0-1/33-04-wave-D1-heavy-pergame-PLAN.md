---
phase: 33-gamebryo-per-game-extensions-v2-0-1
plan: 04
type: execute
wave: 4
depends_on:
    - 33-03
files_modified:
    - extensions/games/game-witcher3/**
    - extensions/games/game-baldursgate3/**
    - extensions/games/game-7daystodie/**
    - extensions/games/game-masterchiefcollection/**
    - .planning/phases/33-gamebryo-per-game-extensions-v2-0-1/33-04-SUMMARY.md
autonomous: true
requirements:
    - SYNC-33a
must_haves:
    truths:
        - "All heavy per-game extensions marker-free: game-witcher3 (27 files, ~165 regions), game-baldursgate3 (16 files, ~140 regions), game-7daystodie (8 files, ~62 regions), game-masterchiefcollection (6 files, ~35 regions) — total 57 files, ~402 regions"
        - "57 atomic SSH-signed `resolve(<ext-slug>): ...` commits"
        - "BG3 active gate-10 stays GREEN: divineCore.ts has 4 named DivineExecMissing/DivineMissingDotNet/DivineTimedOut/DivineAborted classes preserved per D-33-11 pre/post grep + read pattern"
        - "Per-extension build-as-typecheck (`pnpm --filter <name> build`) succeeds at each extension closeout — Pattern P4 Route 2 for game-* extensions"
        - "MHC nested-conflict-marker hazard handled hand-only: `extensions/games/game-masterchiefcollection/src/index.ts` resolved by single non-parallel agent, never via regex-pair tooling (RESEARCH §7 R1)"
        - "Bluebird Promise TS1064 trap (RESEARCH §7 R5) avoided in Witcher3 installers.ts — fork-side preferred for `:Promise<T>` annotations on async fns; explicit annotation strip if needed per `feedback_bluebird_promise_trap.md`"
        - "Harness 12 gates stay GREEN after every commit; gate-10 BG3 verified pre/post for divineCore.ts specifically"
    artifacts:
        - path: "extensions/games/game-baldursgate3/src/divineCore.ts"
          provides: "BG3 divine error class preservation surface (4 named classes; gate-10)"
          contains: "class DivineExecMissing extends Error, class DivineMissingDotNet extends Error, class DivineTimedOut extends Error, class DivineAborted extends Error"
        - path: "extensions/games/game-witcher3/src/scriptmerger.ts"
          provides: "Witcher 3 script merger (heaviest single file in extension at 23 regions); exe-version consumer"
          contains: "exe-version"
        - path: "extensions/games/game-baldursgate3/src/loadOrder.ts"
          provides: "BG3 load order (heaviest single file in Phase 33 at 37 regions)"
          contains: "loadOrder"
    key_links:
        - from: "extensions/games/game-baldursgate3/src/divineCore.ts"
          to: "harness gate-10 (BG3 4-class divine error preservation)"
          via: "git grep -nE 'class (DivineExecMissing|DivineMissingDotNet|DivineTimedOut|DivineAborted)\\b extends Error'"
          pattern: "class (DivineExecMissing|DivineMissingDotNet|DivineTimedOut|DivineAborted)\\b extends Error"
        - from: "extensions/games/game-witcher3/src/scriptmerger.ts"
          to: "exe-version catalog package (Wave F re-add target — 2 import sites)"
          via: "import .* from 'exe-version'"
          pattern: "from .exe-version."
---

<objective>
Wave D1. Heavy per-game extensions: 4 extensions, 57 files, ~402 regions. Two parallel batches (witcher3+bg3 simultaneously, then 7dtd+mhc simultaneously) per RESEARCH §6 + D-33-12, with witcher3 internally sub-batched if executor session budget gets tight (RESEARCH Open Q #3). BG3's divineCore.ts is the highest-stakes file in the entire phase — gate-10 active throughout per D-33-11. MHC's index.ts has nested-conflict-marker hazard — single non-parallel hand-resolve only.

Purpose: These 4 extensions account for ~46% of Phase 33's region count. Get them clean and per-extension build-as-typecheck GREEN before Wave D2 dispatches the medium tier in parallel.

Output: 57 SSH-signed commits + 1 SUMMARY commit. Harness 12/12 GREEN at end. BG3 gate-10 verified pre/post per D-33-11 on divineCore.ts.
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
@.planning/phases/33-gamebryo-per-game-extensions-v2-0-1/33-03-SUMMARY.md
@VORTEX-LINUX-MERGE-PLAYBOOK.md
@CLAUDE.md
@AGENTS.md
</context>

<files_in_scope>
| Extension | Files | Region count | Heaviest files | Active gates | Notes |
|-----------|-------|--------------|----------------|--------------|-------|
| game-witcher3 | 27 | ~165 | scriptmerger.ts (23), menumod.ts (18), installers.ts (16), util.ts (15), mergeBackup.ts (14), eventHandlers.ts (14), mergers.ts (13) | none active (all 12 passive for this extension) | exe-version consumer (2 sites in scriptmerger.ts — Wave F re-add target). **Bluebird trap (R5):** installers.ts has `:Promise<types.IInstallResult>` annotations — fork-side for those regions if upstream side reshuffles. Internal sub-batching may be needed. |
| game-baldursgate3 | 16 | ~140 | loadOrder.ts (37 — heaviest in Phase 33), util.ts (20), installers.ts (16), index.tsx (16), githubDownloader.ts (10), divineCore.test.ts (7), **divineCore.ts (6 — ACTIVE GATE)**, divineWrapper.ts (5) | **gate-10 ACTIVE on divineCore.ts** | exe-version consumer (2 sites: index.tsx + installers.ts — Wave F). Bluebird import confirmed in loadOrder.ts. divineCore.test.ts ordered before divineCore.ts (executor judgement; recommend source-first per RESEARCH Open Q #1). |
| game-7daystodie | 8 | ~62 | index.tsx (16), util.ts (11), rest 4-8 each | none active | tier-5 default for ~95% per RESEARCH §2 |
| game-masterchiefcollection | 6 | ~35 | **index.ts (11 — NESTED MARKERS)** | none active | **Hand-resolve only on index.ts; no regex tooling.** Single non-parallel agent for the entire extension. |

**Total:** 57 files, ~402 regions. **Slugs:** `witcher3`, `bg3`, `7daystodie`, `mhc`. **Typecheck route (Pattern P4):** all 4 extensions go through Route 2: `pnpm --filter <name> build` (build-as-typecheck via rolldown — none have a typecheck script per RESEARCH §3 — Phase 27 verified routing for BG3/Morrowind/Witcher3).
</files_in_scope>

<active_gates>
**Active during Wave D1 resolution: 1 of 12 gates** (gate-10 BG3 4-class divine).

- Per D-33-11, executor MUST run pre/post sentinel grep on divineCore.ts specifically (Pattern P2):

    ```bash
    # PRE (before resolving any region in divineCore.ts):
    git grep -nE 'class (DivineExecMissing|DivineMissingDotNet|DivineTimedOut|DivineAborted)\b extends Error' \
      extensions/games/game-baldursgate3/src/divineCore.ts > /tmp/bg3-divine-pre.txt
    test "$(wc -l < /tmp/bg3-divine-pre.txt)" -eq 4

    # POST (after resolving all 6 regions in divineCore.ts):
    git grep -nE 'class (DivineExecMissing|DivineMissingDotNet|DivineTimedOut|DivineAborted)\b extends Error' \
      extensions/games/game-baldursgate3/src/divineCore.ts > /tmp/bg3-divine-post.txt
    test "$(wc -l < /tmp/bg3-divine-post.txt)" -eq 4
    ```

- Per RESEARCH §4: 4 classes are at HEAD lines 17/24/31/38; conflicts in divineCore.ts are NOT in those lines but may be near them. Tier-1 fork-wins on any region overlapping any of those 4 lines.
- After resolution, OPEN divineCore.ts via Read tool with `offset` near line 10, `limit` 50 — visually confirm 4 classes still declared.
- Other 11 gates passive (no autosort.ts, no migrations.js, no §1 package.json, no LinkingDeployment in scope).
  </active_gates>

<stance_application_order>
Per D-33-02:

1. **Playbook-surface (BG3 divine):** tier-1 fork-wins on any divineCore.ts region overlapping lines 17/24/31/38 (the 4 class declarations). RESEARCH §4 confirmed all 4 classes are fork-local Linux additions.
2. **Linux platform guard:** RESEARCH §4 lists 1 `process.platform` hit in `divineCore.test.ts` — tier-2 fork-wins if a region overlaps it.
3. **New v2.0.1 feature scaffolding:** tier-3 upstream-wins. Apply where present (build.mjs files in scope if any per-extension has one — sample at plan-time). For divineCore.ts: only tier-1 takes precedence; new upstream API surface around the 4 classes is fork-wins.
4. **Rule-1 dup-import:** tier-4 HEAD-empty. RESEARCH §7 R4 expects 10-30 instances across the 183 files — heavy hitters witcher3 + bg3 + 7dtd will see most of them.
5. **Smaller-diff:** tier-5 default — ~95% of the 402 regions per RESEARCH §2.
   </stance_application_order>

<shared_per_task_workflow>
Same as 33-01 (Wave A) with these amendments:

- **Bluebird trap (R5)** — for any file importing from `'bluebird'`, before resolving check:

    ```bash
    grep -n 'from .bluebird.' <file>
    ```

    If present, prefer fork-side for `:Promise<T>` / `:Promise<void>` annotations on async fns. RESEARCH §7 R5 marks witcher3/installers.ts and bg3/loadOrder.ts as known carriers.

- **Per-extension typecheck route (Pattern P4 Route 2):** For all 4 extensions in this plan use:

    ```bash
    pnpm --filter <pkg-name> build 2>&1 | tail -20
    ```

    Rolldown refuses syntax/resolution errors at bundle time. Exit 0 = pass. Phase 27 verified routing per RESEARCH §1.

- **D-33-11 pre/post pattern** mandatory for divineCore.ts (PRE before any divineCore.ts region resolved; POST after the divineCore.ts commit; both counts = 4). Save snapshots to /tmp for SUMMARY.

- **MHC index.ts nested markers** — STOP and Read the file in full before resolving. Identify the outer block first. Resolve the outer block hand-side; THEN identify the inner block (now visible without nesting); resolve inner. Never use a script that pairs `<<<<<<<` to `>>>>>>>` greedily. Single agent — do NOT parallelise within MHC.

Per `feedback_minimize_upstream_diff.md`: do not reformat outside conflict regions.
</shared_per_task_workflow>

<tasks>

<task type="auto">
  <name>Task 1: Resolve game-witcher3 (27 files, ~165 regions; sequential within extension; sub-batch optional per executor judgement)</name>
  <files>extensions/games/game-witcher3/**</files>
  <read_first>
    - extensions/games/game-witcher3/package.json (`name` field for `pnpm --filter`)
    - extensions/games/game-witcher3/src/scriptmerger.ts (heaviest, 23 regions; bluebird + exe-version)
    - extensions/games/game-witcher3/src/installers.ts (16 regions; **bluebird trap candidate**)
    - extensions/games/game-witcher3/src/menumod.ts, util.ts, mergeBackup.ts, eventHandlers.ts, mergers.ts (each 13-18 regions)
    - .planning/phases/33-gamebryo-per-game-extensions-v2-0-1/33-RESEARCH.md §2 + §7 R5
    - `git grep -l '^<<<<<<< ' extensions/games/game-witcher3/` (full file list — 27 files at plan-time; verify count)
  </read_first>
  <action>
    Dispatch as ONE background Engineer agent (parallel with bg3 in Task 2 per D-33-12).

    Internal order: heaviest first to surface bluebird/exe-version issues early; barrels last. Suggested order:
    1. scriptmerger.ts (23 regions; check exe-version imports survive)
    2. menumod.ts (18)
    3. installers.ts (16; **bluebird R5 spot-check mandatory**)
    4. util.ts (15)
    5. mergeBackup.ts (14)
    6. eventHandlers.ts (14)
    7. mergers.ts (13)
    8. ...remaining 20 files in any order; barrel index.ts last
    9. src/index.ts (or equivalent barrel) — last commit; per-extension build-as-typecheck here

    **Sub-batching note (RESEARCH Open Q #3):** if agent session budget tightens after first 10 files, stop, dispatch a second agent for remaining 17. Use `git log` to confirm split point. No file overlap → fully safe.

    For each file: shared_per_task_workflow steps 1-10. Title `resolve(witcher3): <basename> — <stance>`.

    **Bluebird trap protocol** for installers.ts (and any other file with `from 'bluebird'`):
    ```bash
    grep -n 'from .bluebird.' extensions/games/game-witcher3/src/installers.ts
    # If non-zero, when resolving regions with :Promise<T> annotations on async fns:
    # - Prefer fork-side
    # - If upstream side wins on stance grounds, strip the explicit annotation post-merge
    # - Verify via `pnpm --filter game-witcher3 build` at extension closeout — TS1064 = trap fired
    ```

    **At extension closeout (last commit, typically src/index.ts or equivalent barrel):**
    ```bash
    pnpm --filter game-witcher3 build 2>&1 | tail -20
    ```
    Exit 0 = pass. Capture into commit body. If non-zero, investigate (likely TS1064 bluebird trap or a Rule-1 dup-import); fix, amend.

    **exe-version consumer note:** scriptmerger.ts has 2 import sites for `exe-version`. After resolving, verify via:
    ```bash
    grep -n "from ['\"]exe-version['\"]" extensions/games/game-witcher3/src/scriptmerger.ts | wc -l   # ≥2
    ```
    Wave F catalog re-add depends on this consumer remaining live.

  </action>
  <verify>
    <automated>
      cd /home/alex/src/Vortex && \
      ! git grep -l '^&lt;&lt;&lt;&lt;&lt;&lt;&lt; ' extensions/games/game-witcher3/ &amp;&amp; \
      bash .planning/phases/33-gamebryo-per-game-extensions-v2-0-1/scripts/grep-checkpoint.sh --skip-conflict-check &gt;/dev/null &amp;&amp; \
      pnpm --filter game-witcher3 build &gt;/dev/null 2&gt;&amp;1 &amp;&amp; \
      test "$(grep -lE \"from ['\\\"]exe-version['\\\"]\" extensions/games/game-witcher3/src/scriptmerger.ts | wc -l)" -ge 1 &amp;&amp; \
      git log --oneline 33-03..HEAD -- extensions/games/game-witcher3/ | grep -c '^[a-f0-9]\+ resolve(witcher3):' | awk '{ if ($1 < 27) exit 1 }' &amp;&amp; \
      echo OK
    </automated>
  </verify>
  <acceptance_criteria>
    - All 27 witcher3 files marker-free
    - 27 SSH-signed `resolve(witcher3): ...` commits
    - Harness skip-mode exits 0 after each commit
    - `pnpm --filter game-witcher3 build` exits 0 (build-as-typecheck) at closeout
    - exe-version imports in scriptmerger.ts preserved (≥2 sites)
    - installers.ts bluebird trap explicitly checked + result documented in commit body
  </acceptance_criteria>
  <done>game-witcher3 resolved + build-as-typecheck GREEN; 27 signed commits on branch.</done>
</task>

<task type="auto">
  <name>Task 2: Resolve game-baldursgate3 (16 files, ~140 regions; gate-10 ACTIVE on divineCore.ts; D-33-11 pre/post pattern)</name>
  <files>extensions/games/game-baldursgate3/**</files>
  <read_first>
    - extensions/games/game-baldursgate3/package.json
    - extensions/games/game-baldursgate3/src/divineCore.ts (current state — 6 conflict regions; **READ IN FULL**)
    - extensions/games/game-baldursgate3/src/divineCore.test.ts (7 regions)
    - extensions/games/game-baldursgate3/src/loadOrder.ts (37 regions — heaviest in phase; bluebird carrier)
    - extensions/games/game-baldursgate3/src/util.ts (20), installers.ts (16), index.tsx (16), githubDownloader.ts (10), divineWrapper.ts (5)
    - `git show fork/master:extensions/games/game-baldursgate3/src/divineCore.ts` (master analog of the active gate target)
    - .planning/phases/33-gamebryo-per-game-extensions-v2-0-1/33-RESEARCH.md §4 (BG3 preservation) + §7 R2
    - .planning/phases/33-gamebryo-per-game-extensions-v2-0-1/33-CONTEXT.md (D-33-11)
    - .planning/phases/33-gamebryo-per-game-extensions-v2-0-1/33-PATTERNS.md (Pattern P2 — pre/post sentinel grep)
  </read_first>
  <action>
    Dispatch as ONE background Engineer agent (parallel with witcher3 in Task 1).

    Internal order — divineCore.test.ts and divineCore.ts go EARLY but per RESEARCH Open Q #1 source-first is safer for catching test-file type drift; recommend:
    1. divineCore.ts (6 regions; **GATE-10 ACTIVE** — see protocol below)
    2. divineCore.test.ts (7 regions; tier-5 default; bluebird trap if present)
    3. divineWrapper.ts (5)
    4. githubDownloader.ts (10)
    5. installers.ts (16)
    6. util.ts (20)
    7. loadOrder.ts (37; **bluebird carrier per RESEARCH §7 R5**)
    8. index.tsx (16; barrel candidate)
    9. ...remaining files
    10. src/index.tsx (last; per-extension build-as-typecheck here)

    **divineCore.ts gate-10 protocol (D-33-11 + Pattern P2):**

    PRE (before any region resolved in divineCore.ts):
    ```bash
    git grep -nE 'class (DivineExecMissing|DivineMissingDotNet|DivineTimedOut|DivineAborted)\b extends Error' \
      extensions/games/game-baldursgate3/src/divineCore.ts > /tmp/bg3-divine-pre.txt
    test "$(wc -l < /tmp/bg3-divine-pre.txt)" -eq 4   # 4 classes at lines 17/24/31/38 of HEAD
    ```

    Resolve all 6 regions per D-33-02 hierarchy:
    - Tier-1 fork-wins on ANY region overlapping HEAD lines 17/24/31/38 (the 4 class declarations) — RESEARCH §4 confirmed all 4 classes are fork-local Linux additions, no plausible upstream change.
    - Tier-5 smaller-diff on the other regions (formatter reflow expected).

    POST (after resolution, before commit):
    ```bash
    git grep -nE 'class (DivineExecMissing|DivineMissingDotNet|DivineTimedOut|DivineAborted)\b extends Error' \
      extensions/games/game-baldursgate3/src/divineCore.ts > /tmp/bg3-divine-post.txt
    test "$(wc -l < /tmp/bg3-divine-post.txt)" -eq 4
    diff /tmp/bg3-divine-pre.txt /tmp/bg3-divine-post.txt
    # Lines may have moved (drifted from 17/24/31/38) but count must still be 4 and identifiers identical
    ```

    Read-confirmation: open divineCore.ts via Read tool with `offset` near line 10, `limit` 50; visually confirm 4 classes still declared (cross-reference with `/tmp/LinkingDeployment` analog pattern from Phase 32 32-04).

    Run harness (gate-10 must be GREEN):
    ```bash
    bash .planning/phases/33-gamebryo-per-game-extensions-v2-0-1/scripts/grep-checkpoint.sh --skip-conflict-check
    ```

    Title: `resolve(bg3): divineCore.ts — fork-wins on 4 named DivineError classes; smaller-diff for remaining regions`. Body MUST include pre/post counts (both = 4), gate-10 status, read-confirmation done.

    For OTHER bg3 files: shared_per_task_workflow steps 1-10. Title `resolve(bg3): <basename> — <stance>`. **Bluebird R5 spot-check** for loadOrder.ts (RESEARCH §7 R5).

    **exe-version consumer note:** index.tsx + installers.ts have exe-version imports. Verify post-resolution:
    ```bash
    grep -lE "from ['\"]exe-version['\"]" extensions/games/game-baldursgate3/src/{index.tsx,installers.ts} | wc -l   # ≥2
    ```

    **At extension closeout (last commit, e.g. src/index.tsx):**
    ```bash
    pnpm --filter game-baldursgate3 build 2>&1 | tail -20
    ```
    Exit 0 = pass. If non-zero, investigate; if TS1064 from bluebird trap on loadOrder.ts, fix per `feedback_bluebird_promise_trap.md`.

  </action>
  <verify>
    <automated>
      cd /home/alex/src/Vortex && \
      ! git grep -l '^&lt;&lt;&lt;&lt;&lt;&lt;&lt; ' extensions/games/game-baldursgate3/ &amp;&amp; \
      bash .planning/phases/33-gamebryo-per-game-extensions-v2-0-1/scripts/grep-checkpoint.sh --skip-conflict-check &gt;/dev/null &amp;&amp; \
      test "$(git grep -nE 'class (DivineExecMissing|DivineMissingDotNet|DivineTimedOut|DivineAborted)\b extends Error' extensions/games/game-baldursgate3/src/divineCore.ts | wc -l)" -eq 4 &amp;&amp; \
      pnpm --filter game-baldursgate3 build &gt;/dev/null 2&gt;&amp;1 &amp;&amp; \
      git log --oneline 33-03..HEAD -- extensions/games/game-baldursgate3/ | grep -c '^[a-f0-9]\+ resolve(bg3):' | awk '{ if ($1 < 16) exit 1 }' &amp;&amp; \
      echo OK
    </automated>
  </verify>
  <acceptance_criteria>
    - All 16 bg3 files marker-free
    - 16 SSH-signed `resolve(bg3): ...` commits
    - **Gate-10 GREEN: 4 named DivineError classes preserved in divineCore.ts (count = 4 pre AND post)**
    - divineCore.ts commit body includes pre/post grep counts + read-confirmation done
    - Harness skip-mode exits 0 after each commit (gate-10 ACTIVE)
    - `pnpm --filter game-baldursgate3 build` exits 0 (build-as-typecheck) at closeout
    - exe-version imports in index.tsx + installers.ts preserved (≥2 sites total)
    - loadOrder.ts bluebird trap result documented in commit body
  </acceptance_criteria>
  <done>game-baldursgate3 resolved + gate-10 verified pre/post + build-as-typecheck GREEN; 16 signed commits on branch.</done>
</task>

<task type="auto">
  <name>Task 3: Resolve game-7daystodie (8 files, ~62 regions; sequential)</name>
  <files>extensions/games/game-7daystodie/**</files>
  <read_first>
    - extensions/games/game-7daystodie/package.json
    - extensions/games/game-7daystodie/src/index.tsx (16 regions)
    - extensions/games/game-7daystodie/src/util.ts (11 regions)
    - 6 other files (each 4-8 regions)
    - .planning/phases/33-gamebryo-per-game-extensions-v2-0-1/33-RESEARCH.md §2
  </read_first>
  <action>
    Dispatch as ONE background Engineer agent (parallel with mhc in Task 4 — but MHC is single-agent so this can run concurrently with MHC's hand-resolve).

    Sequential leaf-first within extension. Heaviest files first:
    1. index.tsx (16)
    2. util.ts (11)
    3. ...remaining 6 files (4-8 each)
    Last commit = barrel/index — closeout build-as-typecheck.

    For each file: shared_per_task_workflow steps 1-10. Title `resolve(7daystodie): <basename> — <stance>`. ~95% tier-5 smaller-diff per RESEARCH §2.

    **At closeout:**
    ```bash
    pnpm --filter game-7daystodie build 2>&1 | tail -20
    ```

  </action>
  <verify>
    <automated>
      cd /home/alex/src/Vortex && \
      ! git grep -l '^&lt;&lt;&lt;&lt;&lt;&lt;&lt; ' extensions/games/game-7daystodie/ &amp;&amp; \
      bash .planning/phases/33-gamebryo-per-game-extensions-v2-0-1/scripts/grep-checkpoint.sh --skip-conflict-check &gt;/dev/null &amp;&amp; \
      pnpm --filter game-7daystodie build &gt;/dev/null 2&gt;&amp;1 &amp;&amp; \
      git log --oneline 33-03..HEAD -- extensions/games/game-7daystodie/ | grep -c '^[a-f0-9]\+ resolve(7daystodie):' | awk '{ if ($1 < 8) exit 1 }' &amp;&amp; \
      echo OK
    </automated>
  </verify>
  <acceptance_criteria>
    - All 8 files marker-free
    - 8 SSH-signed `resolve(7daystodie): ...` commits
    - Harness skip-mode exits 0 after each commit
    - `pnpm --filter game-7daystodie build` exits 0 at closeout
  </acceptance_criteria>
  <done>game-7daystodie resolved + build-as-typecheck GREEN; 8 signed commits on branch.</done>
</task>

<task type="auto">
  <name>Task 4: Resolve game-masterchiefcollection (6 files, ~35 regions; SINGLE-AGENT, NESTED-MARKER HAZARD on index.ts)</name>
  <files>extensions/games/game-masterchiefcollection/**</files>
  <read_first>
    - extensions/games/game-masterchiefcollection/package.json
    - extensions/games/game-masterchiefcollection/src/index.ts (11 regions; **NESTED CONFLICT MARKERS — read in full**)
    - 5 other mhc files (each ~4-6 regions)
    - .planning/phases/33-gamebryo-per-game-extensions-v2-0-1/33-RESEARCH.md §2 (mhc-specific) + §7 R1 (nested-marker hazard)
  </read_first>
  <action>
    Dispatch as ONE non-parallel Engineer agent (no `run_in_background=true` for the index.ts file). This is the MHC nested-marker hazard from RESEARCH §7 R1 + D-33-CONTEXT specials.

    Sequential leaf-first. Suggested order — leave index.ts for LAST so the executor warms up on the simpler 5 files first:
    1. 5 simpler files (each 4-6 regions; tier-5 smaller-diff default per RESEARCH §2)
    2. **src/index.ts (11 regions; NESTED MARKERS)** — last

    **MHC index.ts protocol (RESEARCH §7 R1):**

    Step A — Read the file in full via Read tool (no `offset`/`limit`; the file is small enough). Identify the nested-marker structure: per RESEARCH §2 sample, "an outer block contains inner `<<<<<<<` lines" — the outer's `=======` precedes the inner's `<<<<<<<`. Map every marker line manually.

    Step B — Resolve the OUTER blocks first. Choose stance per D-33-02. After each outer-block resolution, save and re-grep the file:
    ```bash
    grep -cE '^<<<<<<< |^>>>>>>>' extensions/games/game-masterchiefcollection/src/index.ts
    ```
    The count drops by 2 per resolved outer block.

    Step C — Once outer blocks all resolved, the inner blocks are now visible without nesting. Resolve them per D-33-02.

    Step D — Verify zero markers: `git diff --check`; `! grep -q '^<<<<<<< '`.

    Step E — Run harness; commit signed.

    **NEVER use any tool that pairs first `<<<<<<<` to first `>>>>>>>` (e.g. `git mergetool` with default settings, sed-based scripts, regex find/replace).** Hand-resolve only.

    Title: `resolve(mhc): index.ts — hand-resolved nested markers (×11; outer-first then inner)`. Body MUST document the nested-marker structure (number of outer blocks, number of inner blocks, stance per block).

    For 5 simpler MHC files: shared_per_task_workflow steps 1-10 (no nested-marker concern; standard tier-5 default).

    **At extension closeout (last commit = index.ts):**
    ```bash
    pnpm --filter game-masterchiefcollection build 2>&1 | tail -20
    ```
    Exit 0 = pass.

  </action>
  <verify>
    <automated>
      cd /home/alex/src/Vortex && \
      ! git grep -l '^&lt;&lt;&lt;&lt;&lt;&lt;&lt; ' extensions/games/game-masterchiefcollection/ &amp;&amp; \
      bash .planning/phases/33-gamebryo-per-game-extensions-v2-0-1/scripts/grep-checkpoint.sh --skip-conflict-check &gt;/dev/null &amp;&amp; \
      pnpm --filter game-masterchiefcollection build &gt;/dev/null 2&gt;&amp;1 &amp;&amp; \
      git log --oneline 33-03..HEAD -- extensions/games/game-masterchiefcollection/ | grep -c '^[a-f0-9]\+ resolve(mhc):' | awk '{ if ($1 < 6) exit 1 }' &amp;&amp; \
      echo OK
    </automated>
  </verify>
  <acceptance_criteria>
    - All 6 mhc files marker-free including index.ts (no leftover nested markers)
    - 6 SSH-signed `resolve(mhc): ...` commits
    - index.ts commit body documents the nested-marker structure (outer count, inner count, stance per block)
    - Harness skip-mode exits 0 after each commit
    - `pnpm --filter game-masterchiefcollection build` exits 0 at closeout
  </acceptance_criteria>
  <done>game-masterchiefcollection resolved including nested markers; build-as-typecheck GREEN; 6 signed commits on branch.</done>
</task>

<task type="auto">
  <name>Task 5: Wave D1 SUMMARY commit</name>
  <files>.planning/phases/33-gamebryo-per-game-extensions-v2-0-1/33-04-SUMMARY.md</files>
  <read_first>
    - 57 commit messages: `git log --oneline 33-03..HEAD -- extensions/games/game-{witcher3,baldursgate3,7daystodie,masterchiefcollection}/`
    - /tmp/bg3-divine-pre.txt + /tmp/bg3-divine-post.txt (gate-10 snapshots)
    - $HOME/.claude/get-shit-done/templates/summary.md
  </read_first>
  <action>
    Write `33-04-SUMMARY.md`. Sections:
    - Outcome: 4/4 heavy per-game extensions resolved; 57 atomic resolution commits + 1 docs commit
    - Per-extension table: extension, files, regions, fork-side count, upstream-side count, smaller-diff count, Rule-1 dup-import count, build-as-typecheck status
    - **Gate-10 evidence (BG3):** pre-count=4, post-count=4, divineCore.ts read-confirmation done, harness gate-10 GREEN throughout
    - **MHC nested-marker outcome:** outer blocks resolved (count), inner blocks resolved (count), no leftover markers
    - **Bluebird trap status:** witcher3/installers.ts result, bg3/loadOrder.ts result; any explicit annotation strips required
    - **exe-version consumer evidence:** witcher3/scriptmerger.ts ≥2 sites, bg3/{index.tsx,installers.ts} ≥2 sites total — confirms Wave F catalog re-add of exe-version is justified
    - Harness state: 12/12 GREEN
    - Affects: Wave D2 (medium per-game extensions) sees clean dependees; Wave F catalog re-add has live exe-version consumers confirmed
    - Provides: 4 heavy per-game extensions fully resolved; gate-10 active surface preserved
    - Issues encountered (if any sub-batching of witcher3 happened; any per-extension build pre-existing errors)

    Add via `git add -f`. Title: `docs(33-04): summarize Wave D1 heavy per-game resolution (4 extensions, 57 files, 57 commits; BG3 gate-10 GREEN)`.

  </action>
  <verify>
    <automated>
      cd /home/alex/src/Vortex && \
      test -f .planning/phases/33-gamebryo-per-game-extensions-v2-0-1/33-04-SUMMARY.md &amp;&amp; \
      git log -1 --pretty=%s | grep -q '^docs(33-04): summarize Wave D1' &amp;&amp; \
      git cat-file -p HEAD | grep -q '^gpgsig ' &amp;&amp; \
      echo OK
    </automated>
  </verify>
  <acceptance_criteria>
    - 33-04-SUMMARY.md exists, committed via `git add -f`, SSH-signed
    - 57 `resolve(<ext-slug>):` commits + 1 docs commit on Wave D1
    - SUMMARY records gate-10 pre/post evidence, MHC nested-marker outcome, bluebird status, exe-version consumer evidence
    - Conflict-marker files in scope: 0
  </acceptance_criteria>
  <done>Wave D1 complete; gate-10 GREEN on divineCore.ts; summary committed; branch ready for Wave D2.</done>
</task>

</tasks>

<verification>
After all tasks:
- `git grep -l '^<<<<<<< ' extensions/games/game-{witcher3,baldursgate3,7daystodie,masterchiefcollection}/` returns empty
- `bash .planning/phases/33-gamebryo-per-game-extensions-v2-0-1/scripts/grep-checkpoint.sh --skip-conflict-check` exits 0 with gate-10 GREEN
- `git grep -nE 'class (DivineExecMissing|DivineMissingDotNet|DivineTimedOut|DivineAborted)\b extends Error' extensions/games/game-baldursgate3/src/divineCore.ts | wc -l` = 4
- `pnpm --filter game-{witcher3,baldursgate3,7daystodie,masterchiefcollection} build` all exit 0
- 57 + 1 SSH-signed commits
</verification>

<success_criteria>

- 4 heavy per-game extensions fully resolved
- 57 + 1 SSH-signed commits
- Gate-10 BG3 4-class divine GREEN throughout (pre-count=4, post-count=4)
- MHC nested markers hand-resolved without regex tooling
- All 4 per-extension builds exit 0
- Wave D2 unblocked
  </success_criteria>

<output>
Create `.planning/phases/33-gamebryo-per-game-extensions-v2-0-1/33-04-SUMMARY.md` per Task 5.
</output>
