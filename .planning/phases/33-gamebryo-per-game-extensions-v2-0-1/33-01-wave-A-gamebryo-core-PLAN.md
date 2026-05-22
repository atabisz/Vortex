---
phase: 33-gamebryo-per-game-extensions-v2-0-1
plan: 01
type: execute
wave: 1
depends_on:
    - 33-00
files_modified:
    - extensions/gamebryo-savegame-management/tsconfig.json
    - extensions/gamebryo-savegame-management/build.mjs
    - extensions/gamebryo-savegame-management/src/actions/session.ts
    - extensions/gamebryo-savegame-management/src/index.ts
    - extensions/gamebryo-plugin-management/build.mjs
    - extensions/gamebryo-plugin-management/src/util/gameSupport.ts
    - extensions/gamebryo-plugin-management/src/util/PluginPersistor.ts
    - extensions/gamebryo-plugin-management/src/views/PluginList.tsx
    - extensions/gamebryo-plugin-management/src/index.ts
    - extensions/gamebryo-archive-support/build.mjs
    - extensions/gamebryo-bsa-support/build.mjs
    - .planning/phases/33-gamebryo-per-game-extensions-v2-0-1/33-01-SUMMARY.md
autonomous: true
requirements:
    - SYNC-33a
must_haves:
    truths:
        - "All 4 gamebryo core extensions (savegame-mgmt 4f, plugin-mgmt 5f, archive-support 1f, bsa-support 1f) marker-free"
        - "11 atomic SSH-signed `resolve(<ext-slug>): ...` commits on `v8.1/config-bucket`"
        - "Per-extension typecheck (Pattern P4 Route 1: pnpm --filter <name> typecheck) returns 0 non-marker errors per extension at extension closeout"
        - "Harness skip-mode stays GREEN (12 gates: §1+§3+§6/§7a-d+§10+140a57217+BG3+Morrowind+gate-12) after every commit"
        - "§3 LOOT casing gate stays GREEN throughout — autosort.ts is NOT in this plan's file list (passive)"
        - "§10 native binaries on disk untouched throughout (gate-9 stays GREEN — dist/** is .gitignore'd-tracked, src/** resolution doesn't restage dist)"
        - "Phase 32 / Phase 26 / 140a57217 invariants held (gates 1-6 + LinkingDeployment single host) — passive in this plan"
    artifacts:
        - path: "extensions/gamebryo-plugin-management/src/index.ts"
          provides: "Gamebryo plugin-management extension entry point post-v2.0.1 oxfmt reflow"
          contains: "registerExtension"
        - path: "extensions/gamebryo-savegame-management/src/index.ts"
          provides: "Gamebryo savegame-management extension entry point post-v2.0.1 oxfmt reflow"
          contains: "registerExtension"
        - path: "extensions/gamebryo-{archive,bsa}-support/build.mjs"
          provides: "Rolldown build wrapper with nativeRemapPlugin (upstream-side new-feature scaffolding)"
          contains: "nativeRemapPlugin"
    key_links:
        - from: "extensions/gamebryo-plugin-management/build.mjs"
          to: "scripts/extensions-rolldown.mjs (nativeRemapPlugin export)"
          via: "import { createConfig, bundle, nativeRemapPlugin } from"
          pattern: "nativeRemapPlugin"
        - from: "extensions/gamebryo-plugin-management/src/util/PluginPersistor.ts"
          to: "extensions/gamebryo-plugin-management/src/util/gameSupport.ts"
          via: "intra-extension import (leaf-first ordering: gameSupport.ts before PluginPersistor.ts)"
          pattern: "from .*util/gameSupport"
---

<objective>
Wave A. Resolve all 11 conflict files across the 4 gamebryo core extensions, leaf-first within each extension, with each extension dispatched as its own background Engineer agent in parallel per D-33-12. Every region default-stance is HEAD-wins (formatter reflow per RESEARCH §2), with one notable exception per extension's `build.mjs`: the `nativeRemapPlugin` import addition is upstream-wins (D-33-02 tier-3 — new-feature scaffolding outside playbook surface).

Purpose: gamebryo core extensions are the dependees for downstream waves (collections, BG3 plugin-mgmt indirectly, Witcher3 indirectly via vortex-api). Get them clean and per-extension-typechecking GREEN before any per-game wave starts.

Output: 11 SSH-signed `resolve(<ext-slug>): ...` commits + 1 docs SUMMARY commit. All 12 harness gates GREEN at end. Per-extension typecheck = 0 non-marker errors for all 4 extensions.
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
@VORTEX-LINUX-MERGE-PLAYBOOK.md
@CLAUDE.md
@AGENTS.md
</context>

<files_in_scope>
| Extension | Files | Region count | Leaf-first order | Typecheck route (Pattern P4) | Active gates |
|-----------|-------|--------------|------------------|------------------------------|--------------|
| gamebryo-savegame-management | 4 | ~12 | tsconfig.json → build.mjs → src/actions/session.ts → src/index.ts | `pnpm --filter gamebryo-savegame-management typecheck` (Route 1: has tsconfig + typecheck script) | none (passive: §1, §3, §6, §7a-d, §10, 140a57217, BG3, Morrowind) |
| gamebryo-plugin-management | 5 | ~30 | build.mjs → src/util/gameSupport.ts → src/util/PluginPersistor.ts → src/views/PluginList.tsx → src/index.ts | `pnpm --filter gamebryo-plugin-management typecheck` (Route 1) | none (passive — autosort.ts NOT in scope per RESEARCH §4) |
| gamebryo-archive-support | 1 | 1 | build.mjs | `pnpm --filter gamebryo-archive-support typecheck` (Route 1) | none |
| gamebryo-bsa-support | 1 | 1 | build.mjs | `pnpm --filter gamebryo-bsa-support typecheck` (Route 1) | none (gate-9 §10 verifies dist/bsatk.node on disk passively) |

**Note on extension slugs in commit titles** (per D-33-07): use the short slug `savegame-mgmt`, `plugin-mgmt`, `archive-support`, `bsa-support` (not the full directory name).

**Note on packagename for `pnpm --filter`:** RESEARCH §3 documented `pnpm --filter <pkg-name> typecheck` as the verified Phase 27 form (NOT `pnpm --filter @vortex/<pkg> typecheck` and NOT `pnpm typecheck -F @vortex/<pkg>` which fails TS5023/TS5083 on this Nx monorepo per D-32-06). Executor verifies the exact `name` field in each extension's `package.json` before invoking; the directory-name slug usually matches but is not guaranteed.

**Total:** 11 files, ~44 conflict regions, ~95% formatter reflow per RESEARCH §2 → tier-5 smaller-diff (HEAD-wins) by default. Exception: `nativeRemapPlugin` import on each `build.mjs` (4 of 11 files) is tier-3 upstream-wins per D-33-02. PRE-FLIGHT: planner already verified `nativeRemapPlugin` is exported from `scripts/extensions-rolldown.mjs` — if the executor finds otherwise, STOP and surface (Wave 0' prereq).
</files_in_scope>

<active_gates>
Per RESEARCH §4: 0 of 12 gates active during Wave A resolution (10 passive playbook gates + 2 active gates BG3/Morrowind, neither of which appear in Wave A files).

- All harness assertions are post-commit only (no pre/post sentinel grep needed for these files — that pattern is reserved for divineCore.ts and migrations.js in Wave D1/D2).
- §10 gate-9 verifies dist/** binaries; src/** resolution does NOT touch dist/ — gate stays passively green.
- D-33-10 single-host invariant: gate verifies `LinkingDeployment.ts` is sole 140a57217 host; Wave A doesn't add a second host.
  </active_gates>

<stance_application_order>
Per D-33-02 (5-tier hierarchy):

1. **Playbook-surface (§1/§3/§10/BG3/Morrowind):** fork-wins — N/A in Wave A (no playbook-surface lines in these 11 files per RESEARCH §4).
2. **Linux platform guard (`process.platform === 'win32'` etc.):** fork-wins — RESEARCH §4 lists 1 hit in `gamebryo-plugin-management/src/util/gameSupport.ts`. If a region touches that line, fork-wins; record in commit body.
3. **New v2.0.1 feature scaffolding outside playbook surface:** upstream-wins. Apply to:
    - `nativeRemapPlugin` import on all 4 `build.mjs` files (savegame, plugin, archive, bsa) — RESEARCH §6 documents the upstream-side import addition.
4. **Rule-1 dup-import avoidance:** when upstream side merely duplicates an import already in HEAD → HEAD-empty. Watch for this in `index.ts` files — RESEARCH §2 sample classified Phase 32 hit ~5 instances; expect similar density here.
5. **Default — smaller-diff (formatter reflow):** ~95% of regions per RESEARCH §2 — HEAD-wins.
   </stance_application_order>

<shared_per_task_workflow>
Same scaffold as Phase 32 plans 02-04, with extension-aware amendments per D-33-06 (per-extension typecheck cadence — NOT per-file). For each file:

1. **Capture master analog** (Pattern P1):

    ```bash
    F=<full path>
    git show fork/master:$F > /tmp/$(basename $F).master 2>/dev/null || echo "(file new on master path)"
    ```

2. **Read current file + master analog side-by-side** to understand the conflict shape.

3. **Hand-resolve all regions** per the stance hierarchy. NO blanket `git checkout --ours/--theirs` (D-33-03).

4. **Verify zero markers**:

    ```bash
    git diff --check $F
    ! grep -q '^<<<<<<< ' $F
    ```

5. **Bluebird trap spot-check** (R5 from RESEARCH §7) for files importing from `'bluebird'`:

    ```bash
    grep -n 'from .bluebird.' $F
    ```

    If non-zero AND any region taken from upstream side has `:Promise<void>` annotations on async fns, prefer fork-side per `feedback_bluebird_promise_trap.md`.

6. **Run harness** (Pattern P3):

    ```bash
    bash .planning/phases/33-gamebryo-per-game-extensions-v2-0-1/scripts/grep-checkpoint.sh --skip-conflict-check
    echo "exit=$?"
    ```

    Must exit 0 (all 11 non-marker gates GREEN).

7. **Per-extension typecheck — DEFERRED to extension closeout commit** per D-33-06. On intermediate file commits, body records "deferred to extension closeout commit". On the LAST file of an extension, run:

    ```bash
    pnpm --filter <pkg-name> typecheck 2>&1 | grep -E 'error TS' | grep -v TS1185 | wc -l
    ```

    Must be 0. If pnpm --filter fails with TS5023/TS5083, fall back to:

    ```bash
    cd extensions/<slug> && pnpm tsc -p tsconfig.json 2>&1 | grep -v TS1185 | wc -l
    ```

8. **Stage + commit signed**:

    ```bash
    git add $F
    git commit -m "resolve(<ext-slug>): $(basename $F) — <one-line stance>"
    ```

    Body per Pattern P5 / D-33-08. SSH-sign per `feedback_ssh_signing.md` (commit.gpgsign=true ensures it).

9. **Verify signed**:

    ```bash
    git cat-file -p HEAD | grep -c '^gpgsig '   # ≥1
    ```

10. **DO NOT push** — `feedback_git_push_ssh.md`.

Per `feedback_minimize_upstream_diff.md`: do not reformat outside conflict regions.
</shared_per_task_workflow>

<tasks>

<task type="auto">
  <name>Task 1: Resolve gamebryo-savegame-management (4 files leaf-first; closeout typecheck)</name>
  <files>
    extensions/gamebryo-savegame-management/tsconfig.json
    extensions/gamebryo-savegame-management/build.mjs
    extensions/gamebryo-savegame-management/src/actions/session.ts
    extensions/gamebryo-savegame-management/src/index.ts
  </files>
  <read_first>
    - All 4 files current state
    - `git show fork/master:extensions/gamebryo-savegame-management/{tsconfig.json,build.mjs,src/actions/session.ts,src/index.ts}` for each
    - extensions/gamebryo-savegame-management/package.json (capture exact `name` field for `pnpm --filter`)
    - scripts/extensions-rolldown.mjs (verify `nativeRemapPlugin` is exported)
    - .planning/phases/33-gamebryo-per-game-extensions-v2-0-1/33-RESEARCH.md §2 + §6
  </read_first>
  <action>
    Dispatch as background Engineer agent per D-33-12 (parallel-safe with sister extensions in this Task list). Sequential within: tsconfig.json → build.mjs → src/actions/session.ts → src/index.ts.

    For each file run shared_per_task_workflow steps 1-10. Specific notes:

    - **tsconfig.json (1 region — JSON):** Smallest possible conflict. Likely a `strict` flag or a path mapping. Apply tier-5 smaller-diff. Title: `resolve(savegame-mgmt): tsconfig.json — smaller-diff (single JSON region)`.

    - **build.mjs (1 region):** Upstream side adds `nativeRemapPlugin` import. Tier-3 upstream-wins per D-33-02 + RESEARCH §6. Title: `resolve(savegame-mgmt): build.mjs — upstream-wins on nativeRemapPlugin import (new v2.0.1 scaffolding)`. Verify with `node --check extensions/gamebryo-savegame-management/build.mjs` (Pattern P4 Route 3).

    - **src/actions/session.ts:** Likely formatter reflow. Tier-5 smaller-diff per region. Spot-check bluebird (RESEARCH §7 R5).

    - **src/index.ts (BARREL — last):** Likely formatter reflow + possible Rule-1 dup-import in import block. Tier-4 if upstream duplicates a HEAD import. Tier-5 otherwise.

    **At src/index.ts commit (extension closeout):** run per-extension typecheck:
    ```bash
    pnpm --filter gamebryo-savegame-management typecheck 2>&1 | grep -E 'error TS' | grep -v TS1185 | wc -l
    ```
    Must be 0. Record count in commit body. If non-zero, investigate (likely a region was mis-resolved); fix and amend. If errors are pre-existing (not introduced by Phase 33), document as "Pre-existing — not introduced by Phase 33" and proceed (Phase 27 done-gate precedent per RESEARCH §1).

    Commit body for src/index.ts MUST include the per-extension typecheck count.

  </action>
  <verify>
    <automated>
      cd /home/alex/src/Vortex && \
      ! git grep -l '^&lt;&lt;&lt;&lt;&lt;&lt;&lt; ' extensions/gamebryo-savegame-management/ &amp;&amp; \
      bash .planning/phases/33-gamebryo-per-game-extensions-v2-0-1/scripts/grep-checkpoint.sh --skip-conflict-check &gt;/dev/null &amp;&amp; \
      TC=$(pnpm --filter gamebryo-savegame-management typecheck 2>&amp;1 | grep -E 'error TS' | grep -v TS1185 | wc -l) &amp;&amp; \
      test "$TC" -eq 0 &amp;&amp; \
      git log -4 --pretty=%s | grep -c '^resolve(savegame-mgmt):' | grep -q '^4$' &amp;&amp; \
      for sha in $(git log -4 --pretty=%H); do git cat-file -p $sha | grep -q '^gpgsig ' || exit 1; done &amp;&amp; \
      echo OK
    </automated>
  </verify>
  <acceptance_criteria>
    - 4 files marker-free
    - 4 SSH-signed `resolve(savegame-mgmt): ...` commits
    - Harness skip-mode exit 0 after each commit
    - `pnpm --filter gamebryo-savegame-management typecheck` returns 0 non-marker errors at the src/index.ts commit
    - Closeout commit body records the typecheck count; intermediate commit bodies record "deferred to extension closeout"
    - build.mjs commit body explicitly notes upstream-wins on nativeRemapPlugin import (D-33-02 tier-3)
  </acceptance_criteria>
  <done>gamebryo-savegame-management resolved + per-extension typecheck GREEN; 4 signed commits on branch.</done>
</task>

<task type="auto">
  <name>Task 2: Resolve gamebryo-plugin-management (5 files leaf-first; closeout typecheck)</name>
  <files>
    extensions/gamebryo-plugin-management/build.mjs
    extensions/gamebryo-plugin-management/src/util/gameSupport.ts
    extensions/gamebryo-plugin-management/src/util/PluginPersistor.ts
    extensions/gamebryo-plugin-management/src/views/PluginList.tsx
    extensions/gamebryo-plugin-management/src/index.ts
  </files>
  <read_first>
    - All 5 files current state
    - `git show fork/master:<path>` for each
    - extensions/gamebryo-plugin-management/package.json (`name` field for `pnpm --filter`)
    - scripts/extensions-rolldown.mjs (`nativeRemapPlugin`)
    - .planning/phases/33-gamebryo-per-game-extensions-v2-0-1/33-RESEARCH.md §2 + §4 (gameSupport.ts has 1 process.platform hit — fork-wins if any region touches it)
  </read_first>
  <action>
    Dispatch as background Engineer agent per D-33-12 (parallel with savegame-mgmt). Sequential within: build.mjs → util/gameSupport.ts → util/PluginPersistor.ts → views/PluginList.tsx → src/index.ts.

    Per-file specifics:

    - **build.mjs (~1 region):** Tier-3 upstream-wins on `nativeRemapPlugin`. Title: `resolve(plugin-mgmt): build.mjs — upstream-wins on nativeRemapPlugin import`.

    - **src/util/gameSupport.ts:** RESEARCH §4 records 1 `process.platform` hit. If a conflict region overlaps that line, tier-2 fork-wins. Otherwise tier-5 smaller-diff. Spot-check bluebird (file imports it commonly in plugin-mgmt area).

    - **src/util/PluginPersistor.ts:** Tier-5 default. Bluebird spot-check.

    - **src/views/PluginList.tsx (6 regions per RESEARCH §2):** All formatter reflow expected → tier-5 smaller-diff. Watch for JSX line-wraps.

    - **src/index.ts (12 regions per RESEARCH §2 — heaviest in this extension; BARREL — last):** Likely formatter reflow + Rule-1 dup-import candidates in import block. Per-region judgement under D-33-02. Spot-check that `extensions/gamebryo-plugin-management/dist/{node-loot.node,libloot.so.0,libloot_wstring_stub.so}` are still on disk after this commit (gate-9 verifies; should stay green).

    **At src/index.ts commit (extension closeout):**
    ```bash
    pnpm --filter gamebryo-plugin-management typecheck 2>&1 | grep -E 'error TS' | grep -v TS1185 | wc -l
    ```
    Must be 0. Record in commit body. Same fallback rules as Task 1 if pnpm --filter fails.

  </action>
  <verify>
    <automated>
      cd /home/alex/src/Vortex && \
      ! git grep -l '^&lt;&lt;&lt;&lt;&lt;&lt;&lt; ' extensions/gamebryo-plugin-management/ &amp;&amp; \
      bash .planning/phases/33-gamebryo-per-game-extensions-v2-0-1/scripts/grep-checkpoint.sh --skip-conflict-check &gt;/dev/null &amp;&amp; \
      TC=$(pnpm --filter gamebryo-plugin-management typecheck 2>&amp;1 | grep -E 'error TS' | grep -v TS1185 | wc -l) &amp;&amp; \
      test "$TC" -eq 0 &amp;&amp; \
      git log -5 --pretty=%s | grep -c '^resolve(plugin-mgmt):' | grep -q '^5$' &amp;&amp; \
      test -f extensions/gamebryo-plugin-management/dist/node-loot.node &amp;&amp; \
      test -f extensions/gamebryo-plugin-management/dist/libloot.so.0 &amp;&amp; \
      test -f extensions/gamebryo-plugin-management/dist/libloot_wstring_stub.so &amp;&amp; \
      echo OK
    </automated>
  </verify>
  <acceptance_criteria>
    - 5 files marker-free
    - 5 SSH-signed `resolve(plugin-mgmt): ...` commits
    - Harness skip-mode exit 0 after each commit
    - `pnpm --filter gamebryo-plugin-management typecheck` returns 0 non-marker errors at src/index.ts commit
    - All 3 native binaries (node-loot.node, libloot.so.0, libloot_wstring_stub.so) still on disk
    - build.mjs commit explicitly notes upstream-wins on nativeRemapPlugin
    - Any process.platform-touching region documented as tier-2 fork-wins
  </acceptance_criteria>
  <done>gamebryo-plugin-management resolved + per-extension typecheck GREEN; 5 signed commits on branch.</done>
</task>

<task type="auto">
  <name>Task 3: Resolve gamebryo-archive-support + gamebryo-bsa-support (1 file each; both build.mjs)</name>
  <files>
    extensions/gamebryo-archive-support/build.mjs
    extensions/gamebryo-bsa-support/build.mjs
  </files>
  <read_first>
    - Both files current state
    - `git show fork/master:extensions/gamebryo-{archive,bsa}-support/build.mjs` for each
    - Both extensions' package.json (`name` field)
    - scripts/extensions-rolldown.mjs (`nativeRemapPlugin`)
  </read_first>
  <action>
    Dispatch as TWO parallel background Engineer agents (one per extension) — these are fully independent. Each is a single file, single commit.

    Both files: tier-3 upstream-wins on `nativeRemapPlugin` import per D-33-02 + RESEARCH §6.

    For each file:
    1. Capture master analog (Pattern P1)
    2. Hand-resolve the single region — upstream-wins on the import block
    3. `git diff --check`; `! grep -q '^<<<<<<< '`
    4. `node --check <file>` (Pattern P4 Route 3 — vanilla ESM syntax check)
    5. `bash .planning/phases/33-gamebryo-per-game-extensions-v2-0-1/scripts/grep-checkpoint.sh --skip-conflict-check`
    6. Per-extension typecheck (closeout — only file in extension):
       ```bash
       pnpm --filter gamebryo-archive-support typecheck 2>&1 | grep -E 'error TS' | grep -v TS1185 | wc -l
       pnpm --filter gamebryo-bsa-support typecheck 2>&1 | grep -E 'error TS' | grep -v TS1185 | wc -l
       ```
       Both must be 0.
    7. Commit signed:
       - `resolve(archive-support): build.mjs — upstream-wins on nativeRemapPlugin import (new v2.0.1 scaffolding)`
       - `resolve(bsa-support): build.mjs — upstream-wins on nativeRemapPlugin import (new v2.0.1 scaffolding)`
    8. Verify gate-9 still green (bsatk.node + 3 plugin-mgmt binaries on disk).

  </action>
  <verify>
    <automated>
      cd /home/alex/src/Vortex && \
      ! git grep -l '^&lt;&lt;&lt;&lt;&lt;&lt;&lt; ' extensions/gamebryo-archive-support/ extensions/gamebryo-bsa-support/ &amp;&amp; \
      bash .planning/phases/33-gamebryo-per-game-extensions-v2-0-1/scripts/grep-checkpoint.sh --skip-conflict-check &gt;/dev/null &amp;&amp; \
      TC1=$(pnpm --filter gamebryo-archive-support typecheck 2>&amp;1 | grep -E 'error TS' | grep -v TS1185 | wc -l) &amp;&amp; \
      TC2=$(pnpm --filter gamebryo-bsa-support typecheck 2>&amp;1 | grep -E 'error TS' | grep -v TS1185 | wc -l) &amp;&amp; \
      test "$TC1" -eq 0 -a "$TC2" -eq 0 &amp;&amp; \
      git log -2 --pretty=%s | grep -E '^resolve\((archive-support|bsa-support)\):' | wc -l | grep -q '^2$' &amp;&amp; \
      test -f extensions/gamebryo-bsa-support/dist/bsatk.node &amp;&amp; \
      echo OK
    </automated>
  </verify>
  <acceptance_criteria>
    - 2 files marker-free
    - 2 SSH-signed commits (one per extension), both with upstream-wins on nativeRemapPlugin
    - Per-extension typecheck = 0 non-marker errors for both
    - bsatk.node still on disk (gate-9 stays green)
  </acceptance_criteria>
  <done>archive-support + bsa-support resolved + per-extension typecheck GREEN; 2 signed commits on branch.</done>
</task>

<task type="auto">
  <name>Task 4: Wave A SUMMARY commit</name>
  <files>.planning/phases/33-gamebryo-per-game-extensions-v2-0-1/33-01-SUMMARY.md</files>
  <read_first>
    - All 11 commit messages: `git log --oneline 33-00..HEAD -- extensions/gamebryo-{savegame,plugin,archive,bsa}-*`
    - $HOME/.claude/get-shit-done/templates/summary.md
    - .planning/phases/33-gamebryo-per-game-extensions-v2-0-1/33-00-SUMMARY.md (Wave 0 baseline)
  </read_first>
  <action>
    Write `33-01-SUMMARY.md` summarising Wave A. Required sections:
    - **Outcome:** 4/4 gamebryo core extensions resolved; 11 atomic resolution commits + 1 docs commit on `v8.1/config-bucket`
    - **Per-extension table:** extension slug, files, total regions, fork-side count, upstream-side count (note: nativeRemapPlugin = 4 upstream-wins across the 4 build.mjs files), smaller-diff count, Rule-1 dup-import count, closing typecheck count
    - **Harness state:** all 12 gates GREEN in skip-mode after the 11th commit; gate-9 §10 binaries still on disk
    - **Affects:** Wave C (collections imports from gamebryo via vortex-api re-exports — clean dependees), Wave D (per-game extensions use vortex-api which transitively touched these workspaces)
    - **Provides:** 4 fully resolved gamebryo core extensions; nativeRemapPlugin scaffolding folded in; baseline for waves B–F
    - **Issues encountered:** any commit needing amend, any per-extension typecheck producing pre-existing errors (Phase 33 doesn't introduce them; document and proceed)

    Add via `git add -f`. Commit title: `docs(33-01): summarize Wave A gamebryo core resolution (4 extensions, 11 files, 11 commits)`.

  </action>
  <verify>
    <automated>
      cd /home/alex/src/Vortex && \
      test -f .planning/phases/33-gamebryo-per-game-extensions-v2-0-1/33-01-SUMMARY.md &amp;&amp; \
      bash .planning/phases/33-gamebryo-per-game-extensions-v2-0-1/scripts/grep-checkpoint.sh --skip-conflict-check &gt;/dev/null &amp;&amp; \
      git log -1 --pretty=%s | grep -q '^docs(33-01): summarize Wave A' &amp;&amp; \
      git cat-file -p HEAD | grep -q '^gpgsig ' &amp;&amp; \
      echo OK
    </automated>
  </verify>
  <acceptance_criteria>
    - 33-01-SUMMARY.md exists, committed via `git add -f`, SSH-signed
    - 11 `resolve(<ext-slug>):` commits + 1 docs commit on Wave A
    - Final harness skip-mode exits 0 with all 12 gates GREEN
    - Conflict-marker files in `extensions/gamebryo-*` directories: 0
  </acceptance_criteria>
  <done>Wave A complete; summary committed; branch ready for Wave B.</done>
</task>

</tasks>

<verification>
After all tasks:
- `git grep -l '^<<<<<<< ' extensions/gamebryo-{savegame,plugin,archive,bsa}-*` returns empty
- `bash .planning/phases/33-gamebryo-per-game-extensions-v2-0-1/scripts/grep-checkpoint.sh --skip-conflict-check` exits 0
- 4 per-extension typecheck commands all return 0 non-marker errors
- 11 + 1 SSH-signed commits on `v8.1/config-bucket`
- §10 native binaries (bsatk.node, node-loot.node, libloot.so.0, libloot_wstring_stub.so) all on disk
</verification>

<success_criteria>

- 4 gamebryo core extensions fully resolved
- 11 SSH-signed `resolve(<ext-slug>): ...` commits + 1 SUMMARY commit
- Harness 12/12 gates GREEN
- Per-extension typecheck = 0 non-marker errors for all 4 extensions
- Wave B unblocked (modtype-bepinex)
  </success_criteria>

<output>
Create `.planning/phases/33-gamebryo-per-game-extensions-v2-0-1/33-01-SUMMARY.md` per Task 4.
</output>
