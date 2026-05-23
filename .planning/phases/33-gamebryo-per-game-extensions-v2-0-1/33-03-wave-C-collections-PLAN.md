---
phase: 33-gamebryo-per-game-extensions-v2-0-1
plan: 03
type: execute
wave: 3
depends_on:
    - 33-02
files_modified:
    - extensions/collections/build.mjs
    - extensions/collections/src/util/gameSupport/gamebryo.tsx
    - extensions/collections/src/eventHandlers.ts
    - extensions/collections/src/collectionExport.ts
    - extensions/collections/src/views/CollectionPageEdit/Instructions.tsx
    - extensions/collections/src/views/CollectionPageEdit/ModsEditPage.tsx
    - extensions/collections/src/views/CollectionPageView/HealthDownvoteDialog.tsx
    - extensions/collections/src/views/CollectionPageView/index.tsx
    - extensions/collections/src/views/InstallDialog/InstallFinishedDialog.tsx
    - extensions/collections/src/views/InstallDialog/InstallStartDialog.tsx
    - extensions/collections/src/views/CollectionList/index.tsx
    - extensions/collections/src/index.ts
    - .planning/phases/33-gamebryo-per-game-extensions-v2-0-1/33-03-SUMMARY.md
autonomous: true
requirements:
    - SYNC-33a
must_haves:
    truths:
        - "All 12 collections files marker-free; 12 atomic SSH-signed `resolve(collections): ...` commits"
        - "Per-extension typecheck (`pnpm --filter collections typecheck`) returns 0 non-marker errors at closeout"
        - "Harness 12 gates stay GREEN after every commit"
        - "build.mjs upstream-wins on nativeRemapPlugin; src/util/gameSupport/gamebryo.tsx leaf-tier"
        - "src/index.ts barrel resolved last (depends on every sibling stabilised first)"
        - "View files (8 .tsx) ~95% formatter reflow → tier-5 smaller-diff per RESEARCH §2"
    artifacts:
        - path: "extensions/collections/src/index.ts"
          provides: "Collections extension entry post-v2.0.1 oxfmt reflow + nativeRemapPlugin scaffolding"
          contains: "registerExtension"
        - path: "extensions/collections/build.mjs"
          provides: "Rolldown build wrapper with nativeRemapPlugin"
          contains: "nativeRemapPlugin"
    key_links:
        - from: "extensions/collections/src/index.ts"
          to: "extensions/collections/src/{eventHandlers,collectionExport,util/gameSupport/gamebryo,views/...}"
          via: "intra-extension imports (barrel)"
          pattern: "from .*(eventHandlers|collectionExport|gameSupport|views)"
        - from: "extensions/collections/src/util/gameSupport/gamebryo.tsx"
          to: "vortex-api re-exports of @vortex/main + gamebryo workspace types"
          via: "vortex-api imports"
          pattern: "from .vortex-api."
---

<objective>
Wave C. Resolve all 12 conflict files in `collections` extension, leaf-first/dependees-first per D-33-01. Single Engineer agent (collections is a tightly-coupled workspace; the 12 files reference each other heavily). All regions default tier-5 smaller-diff (formatter reflow per RESEARCH §2) except `build.mjs` (tier-3 upstream-wins on nativeRemapPlugin).

Purpose: collections extension exposes Nexus collection install/export workflows. Many per-game extensions (BG3, Witcher 3, gamebryo plugins) use vortex-api re-exports that flow through collections types. Get it clean before Wave D per-game work.

Output: 12 SSH-signed commits + 1 SUMMARY commit. Harness 12/12 GREEN at end. Per-extension typecheck = 0 non-marker errors.
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
@.planning/phases/33-gamebryo-per-game-extensions-v2-0-1/33-02-SUMMARY.md
@VORTEX-LINUX-MERGE-PLAYBOOK.md
@CLAUDE.md
@AGENTS.md
</context>

<files_in_scope>
Order is dependees-first → barrel-last per D-33-01 / Pattern carrier from Phase 32 32-03 + 32-05.

| #   | File                                                                         | Region count (approx) | Stance baseline                                           |
| --- | ---------------------------------------------------------------------------- | --------------------- | --------------------------------------------------------- |
| 1   | extensions/collections/build.mjs                                             | 1                     | tier-3 upstream-wins on nativeRemapPlugin                 |
| 2   | extensions/collections/src/util/gameSupport/gamebryo.tsx                     | small                 | tier-5 smaller-diff                                       |
| 3   | extensions/collections/src/eventHandlers.ts                                  | small                 | tier-5 smaller-diff; bluebird spot-check                  |
| 4   | extensions/collections/src/collectionExport.ts                               | small                 | tier-5 smaller-diff                                       |
| 5   | extensions/collections/src/views/CollectionPageEdit/Instructions.tsx         | small                 | tier-5 smaller-diff (JSX line-wrap)                       |
| 6   | extensions/collections/src/views/CollectionPageEdit/ModsEditPage.tsx         | small                 | tier-5 smaller-diff                                       |
| 7   | extensions/collections/src/views/CollectionPageView/HealthDownvoteDialog.tsx | small                 | tier-5 smaller-diff                                       |
| 8   | extensions/collections/src/views/CollectionPageView/index.tsx                | small                 | tier-5 smaller-diff                                       |
| 9   | extensions/collections/src/views/InstallDialog/InstallFinishedDialog.tsx     | small                 | tier-5 smaller-diff                                       |
| 10  | extensions/collections/src/views/InstallDialog/InstallStartDialog.tsx        | small                 | tier-5 smaller-diff                                       |
| 11  | extensions/collections/src/views/CollectionList/index.tsx                    | small                 | tier-5 smaller-diff                                       |
| 12  | extensions/collections/src/index.ts                                          | small                 | tier-5 smaller-diff (BARREL — last); tier-4 if dup-import |

**Total:** 12 files, ~30+ regions per RESEARCH §2. **Slug:** `collections`. **Typecheck route (Pattern P4):** `pnpm --filter collections typecheck` (Route 1 — has tsconfig + typecheck script per RESEARCH §3).
</files_in_scope>

<active_gates>
Per RESEARCH §4: 0 of 12 gates active. All gates passive.
</active_gates>

<stance_application_order>
Per D-33-02:

1. Playbook-surface: N/A
2. Linux platform guard: N/A in collections (RESEARCH §4 lists no `process.platform` hits in collections files)
3. New scaffolding: tier-3 upstream-wins on `build.mjs` `nativeRemapPlugin`
4. Rule-1 dup-import: tier-4 HEAD-empty for any region where upstream merely duplicates a HEAD import (watch index.ts)
5. Smaller-diff: tier-5 default (~95% per RESEARCH §2)
   </stance_application_order>

<shared_per_task_workflow>
Same as 33-01 (Wave A). Steps 1-10. Per-extension typecheck deferred to last commit (src/index.ts).
</shared_per_task_workflow>

<tasks>

<task type="auto">
  <name>Task 1: Resolve collections (12 files dependees-first → barrel-last; closeout typecheck)</name>
  <files>
    extensions/collections/build.mjs
    extensions/collections/src/util/gameSupport/gamebryo.tsx
    extensions/collections/src/eventHandlers.ts
    extensions/collections/src/collectionExport.ts
    extensions/collections/src/views/CollectionPageEdit/Instructions.tsx
    extensions/collections/src/views/CollectionPageEdit/ModsEditPage.tsx
    extensions/collections/src/views/CollectionPageView/HealthDownvoteDialog.tsx
    extensions/collections/src/views/CollectionPageView/index.tsx
    extensions/collections/src/views/InstallDialog/InstallFinishedDialog.tsx
    extensions/collections/src/views/InstallDialog/InstallStartDialog.tsx
    extensions/collections/src/views/CollectionList/index.tsx
    extensions/collections/src/index.ts
  </files>
  <read_first>
    - All 12 files current state
    - `git show fork/master:<path>` for each
    - extensions/collections/package.json (`name` field)
    - scripts/extensions-rolldown.mjs (`nativeRemapPlugin`)
    - .planning/phases/33-gamebryo-per-game-extensions-v2-0-1/33-RESEARCH.md §2 + §6
  </read_first>
  <action>
    Single Engineer agent. Sequential per the file ordering above (dependees-first → barrel-last).

    For each file run shared_per_task_workflow steps 1-10. Title for each:
    - `resolve(collections): build.mjs — upstream-wins on nativeRemapPlugin import`
    - `resolve(collections): util/gameSupport/gamebryo.tsx — smaller-diff`
    - `resolve(collections): eventHandlers.ts — smaller-diff`
    - `resolve(collections): collectionExport.ts — smaller-diff`
    - `resolve(collections): views/CollectionPageEdit/Instructions.tsx — smaller-diff`
    - `resolve(collections): views/CollectionPageEdit/ModsEditPage.tsx — smaller-diff`
    - `resolve(collections): views/CollectionPageView/HealthDownvoteDialog.tsx — smaller-diff`
    - `resolve(collections): views/CollectionPageView/index.tsx — smaller-diff`
    - `resolve(collections): views/InstallDialog/InstallFinishedDialog.tsx — smaller-diff`
    - `resolve(collections): views/InstallDialog/InstallStartDialog.tsx — smaller-diff`
    - `resolve(collections): views/CollectionList/index.tsx — smaller-diff`
    - `resolve(collections): src/index.ts — smaller-diff (barrel)`

    Adjust the one-line stance based on actual region content (e.g. if a file has Rule-1 dup-import, use `... — Rule-1 dup-import (HEAD-empty)`).

    Per file: harness skip-mode exit 0 after each commit. Typecheck deferred to extension closeout (last commit body records "deferred to extension closeout commit").

    **At src/index.ts commit (extension closeout):**
    ```bash
    pnpm --filter collections typecheck 2>&1 | grep -E 'error TS' | grep -v TS1185 | wc -l
    ```
    Must be 0. Record in commit body. Fallback to `cd extensions/collections && pnpm tsc -p tsconfig.json` per RESEARCH §3.

    Per `feedback_minimize_upstream_diff.md`: do not reformat outside conflict regions.

  </action>
  <verify>
    <automated>
      cd /home/alex/src/Vortex && \
      ! git grep -l '^&lt;&lt;&lt;&lt;&lt;&lt;&lt; ' extensions/collections/ &amp;&amp; \
      bash .planning/phases/33-gamebryo-per-game-extensions-v2-0-1/scripts/grep-checkpoint.sh --skip-conflict-check &gt;/dev/null &amp;&amp; \
      TC=$(pnpm --filter collections typecheck 2>&amp;1 | grep -E 'error TS' | grep -v TS1185 | wc -l) &amp;&amp; \
      test "$TC" -eq 0 &amp;&amp; \
      git log -12 --pretty=%s | grep -c '^resolve(collections):' | grep -q '^12$' &amp;&amp; \
      for sha in $(git log -12 --pretty=%H); do git cat-file -p $sha | grep -q '^gpgsig ' || exit 1; done &amp;&amp; \
      echo OK
    </automated>
  </verify>
  <acceptance_criteria>
    - 12 files marker-free
    - 12 SSH-signed `resolve(collections): ...` commits
    - Harness skip-mode exits 0 after each commit
    - `pnpm --filter collections typecheck` returns 0 non-marker errors at closeout
    - build.mjs commit explicitly notes upstream-wins on nativeRemapPlugin
    - src/index.ts commit body records the per-extension typecheck count
  </acceptance_criteria>
  <done>collections resolved + per-extension typecheck GREEN; 12 signed commits on branch.</done>
</task>

<task type="auto">
  <name>Task 2: Wave C SUMMARY commit</name>
  <files>.planning/phases/33-gamebryo-per-game-extensions-v2-0-1/33-03-SUMMARY.md</files>
  <read_first>
    - 12 commit messages: `git log --oneline 33-02..HEAD -- extensions/collections/`
    - $HOME/.claude/get-shit-done/templates/summary.md
  </read_first>
  <action>
    Write `33-03-SUMMARY.md`. Sections:
    - Outcome: 1/1 collections extension resolved; 12 commits + 1 docs commit
    - Per-file table: file, regions, stance counts, commit SHA
    - Harness state: 12/12 GREEN
    - Affects: Wave D1/D2 per-game extensions referencing collection types via vortex-api see clean dependees
    - Provides: collections extension fully resolved
    - Issues encountered (if any)

    Add via `git add -f`. Title: `docs(33-03): summarize Wave C collections resolution (1 extension, 12 files, 12 commits)`.

  </action>
  <verify>
    <automated>
      cd /home/alex/src/Vortex && \
      test -f .planning/phases/33-gamebryo-per-game-extensions-v2-0-1/33-03-SUMMARY.md &amp;&amp; \
      git log -1 --pretty=%s | grep -q '^docs(33-03): summarize Wave C' &amp;&amp; \
      git cat-file -p HEAD | grep -q '^gpgsig ' &amp;&amp; \
      echo OK
    </automated>
  </verify>
  <acceptance_criteria>
    - 33-03-SUMMARY.md exists, committed via `git add -f`, SSH-signed
    - 12 `resolve(collections):` commits + 1 docs commit on Wave C
    - Conflict-marker files in `extensions/collections/`: 0
  </acceptance_criteria>
  <done>Wave C complete; summary committed; branch ready for Wave D1.</done>
</task>

</tasks>

<verification>
After all tasks:
- `git grep -l '^<<<<<<< ' extensions/collections/` returns empty
- `bash .planning/phases/33-gamebryo-per-game-extensions-v2-0-1/scripts/grep-checkpoint.sh --skip-conflict-check` exits 0
- `pnpm --filter collections typecheck` returns 0 non-marker errors
- 12 + 1 SSH-signed commits
</verification>

<success_criteria>

- collections extension fully resolved
- 12 + 1 SSH-signed commits
- Harness 12/12 GREEN
- Wave D1 unblocked
  </success_criteria>

<output>
Create `.planning/phases/33-gamebryo-per-game-extensions-v2-0-1/33-03-SUMMARY.md` per Task 2.
</output>
