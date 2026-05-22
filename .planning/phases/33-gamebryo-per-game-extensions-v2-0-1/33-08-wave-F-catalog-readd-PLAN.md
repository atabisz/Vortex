---
phase: 33-gamebryo-per-game-extensions-v2-0-1
plan: 08
type: execute
wave: 8
depends_on:
    - 33-07
files_modified:
    - pnpm-workspace.yaml
    - pnpm-lock.yaml
    - .planning/phases/33-gamebryo-per-game-extensions-v2-0-1/33-08-SUMMARY.md
autonomous: true
requirements:
    - SYNC-33b
must_haves:
    truths:
        - "pnpm-workspace.yaml `catalog:` block contains entries for `esptk`, `exe-version`, `gamebryo-savegame`, `native-errors` post-resolve"
        - "gamebryo-savegame moved from `neverBuiltDependencies:` (line 24 pre-resolve) to `catalog:` block (or kept in both if pnpm requires the never-build flag — verify against upstream pattern)"
        - "Single combined SSH-signed commit `chore(catalog): re-add esptk + exe-version + gamebryo-savegame + native-errors per Wave F`"
        - "`pnpm install --frozen-lockfile=false` regenerates pnpm-lock.yaml with the 4 packages resolvable"
        - "Per-extension build for the 4 packages' top consumers passes (witcher3 + bg3 for exe-version; gamebryo-plugin-management for esptk; renderer for native-errors; gamebryo-savegame-management for gamebryo-savegame)"
        - "Harness 12 gates stay GREEN after the commit"
        - "Consumer evidence pre-audit returns ≥1 import for each of the 4 packages (mandatory verification before staging the catalog edit)"
    artifacts:
        - path: "pnpm-workspace.yaml"
          provides: "Workspace catalog entries for the 4 re-added packages"
          contains: "exe-version"
        - path: "pnpm-lock.yaml"
          provides: "Frozen lockfile with 4 packages re-resolved"
          contains: "exe-version"
    key_links:
        - from: "extensions/games/game-witcher3/src/scriptmerger.ts (×2 sites) + extensions/games/game-baldursgate3/src/{index.tsx,installers.ts} (×3 sites)"
          to: "exe-version"
          via: "named imports"
          pattern: "from .exe-version."
        - from: "src/renderer/src/renderer.tsx (line 70)"
          to: "native-errors"
          via: "namespace import (`import * as nativeErr from 'native-errors'`)"
          pattern: "from .native-errors."
---

<objective>
Wave F (final resolution wave). Re-add 4 packages to `pnpm-workspace.yaml` `catalog:` block that v2.0.1 either dropped or our Linux-rebased branch had moved out: `esptk`, `exe-version`, `gamebryo-savegame`, `native-errors`. Single combined commit per D-33-13.

Pre-resolution audit MUST verify each of the 4 packages has at least one consumer import in the working tree (post-Wave A-E resolution). Evidence already captured during D1 (witcher3 + bg3 exe-version) but Wave F enforces a fresh audit because Wave A may have changed gamebryo-plugin-management consumer paths and Wave E touched the renderer.

`gamebryo-savegame` currently sits in `pnpm-workspace.yaml` `neverBuiltDependencies:` (line 24 of current state per pre-flight verification) — needs verify-then-add to `catalog:` (the never-build flag stays if upstream's pattern requires it; otherwise migrate fully).

Output: 1 combined SSH-signed commit (catalog edit + lockfile regen in same commit) + 1 SUMMARY commit. Harness 12/12 GREEN at end.
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
@.planning/phases/33-gamebryo-per-game-extensions-v2-0-1/33-05-SUMMARY.md
@.planning/phases/33-gamebryo-per-game-extensions-v2-0-1/33-06-SUMMARY.md
@.planning/phases/33-gamebryo-per-game-extensions-v2-0-1/33-07-SUMMARY.md
@VORTEX-LINUX-MERGE-PLAYBOOK.md
@CLAUDE.md
@AGENTS.md
</context>

<consumer_evidence_audit>
Pre-resolve verification (MUST pass before staging catalog edit):

```bash
# 1. exe-version (D-33-13 evidence already captured in D1; re-verify):
EXE=$(git grep -cE "from ['\"]exe-version['\"]" extensions/ src/ 2>/dev/null | awk -F: '{s+=$2} END{print s}')
test "$EXE" -ge 5 || { echo "FAIL: exe-version consumers < 5 (expected ≥5: witcher3 ×2, bg3 ×3)"; exit 1; }

# 2. esptk (lazy-loaded per playbook §6 — search for require() AND import patterns):
ESPTK=$(git grep -cE "require\(['\"]esptk['\"]\)|from ['\"]esptk['\"]" extensions/ src/ 2>/dev/null | awk -F: '{s+=$2} END{print s}')
test "$ESPTK" -ge 1 || { echo "FAIL: esptk consumers < 1"; exit 1; }

# 3. gamebryo-savegame (consumer is gamebryo-savegame-management extension):
GSV=$(git grep -cE "require\(['\"]gamebryo-savegame['\"]\)|from ['\"]gamebryo-savegame['\"]" extensions/ src/ 2>/dev/null | awk -F: '{s+=$2} END{print s}')
test "$GSV" -ge 1 || { echo "FAIL: gamebryo-savegame consumers < 1"; exit 1; }

# 4. native-errors (renderer.tsx + possibly main):
NER=$(git grep -cE "require\(['\"]native-errors['\"]\)|from ['\"]native-errors['\"]" src/ extensions/ 2>/dev/null | awk -F: '{s+=$2} END{print s}')
test "$NER" -ge 1 || { echo "FAIL: native-errors consumers < 1 (expected ≥1: src/renderer/src/renderer.tsx line 70)"; exit 1; }

echo "PRE-AUDIT OK: exe-version=$EXE, esptk=$ESPTK, gamebryo-savegame=$GSV, native-errors=$NER"
```

If any of the 4 returns 0 consumers, the package should NOT be re-added — record in SUMMARY as "deferred (no consumers)" and proceed with the remainder. D-33-13 explicitly allows partial application.
</consumer_evidence_audit>

<package_versioning_rules>
For each package, determine the version to pin in `catalog:`:

1. **Check upstream Nexus-Mods/Vortex master** for whether the package was _retained_ in their catalog post-v2.0.1:

    ```bash
    git show fork/master:pnpm-workspace.yaml | grep -E "esptk|exe-version|gamebryo-savegame|native-errors" || echo "upstream removed all 4"
    ```

2. **For each package re-added:** preserve fork's existing pre-Wave-31 version (use git history):

    ```bash
    for pkg in esptk exe-version gamebryo-savegame native-errors; do
      git log --all --oneline -S "$pkg" pnpm-workspace.yaml 2>/dev/null | head -3
    done
    ```

    Use the version present in the most recent commit before the package was dropped.

3. **Format:** match the catalog entry style of existing entries (e.g., `exe-version: ^1.0.0` or `exe-version: git+https://github.com/Nexus-Mods/exe-version#<sha>`). Most Nexus-Mods native-addon packages are git+url pinned to a specific commit SHA.

4. **gamebryo-savegame special case:** currently in `neverBuiltDependencies: { gamebryo-savegame: true }` (line 24). Two possible disposition (per upstream pattern):
    - (a) Move entirely to `catalog:` — drop from `neverBuiltDependencies:`
    - (b) Keep in `neverBuiltDependencies:` AND add to `catalog:` (some pnpm setups require both)
    - Determine by checking whether other packages in upstream's catalog are simultaneously listed in `neverBuiltDependencies:` — `git show fork/master:pnpm-workspace.yaml`.
      </package_versioning_rules>

<active_gates>
Per RESEARCH §4: 0 of 12 gates active in Wave F. All gates passive.

**Indirect gate impact:** gate-9 (§10 native binaries) depends on `esptk.node` + `gamebryo-savegame.node` + native-errors `.node` artifacts existing on disk. Re-adding to catalog re-exposes the npm-side packages but does NOT re-build native artifacts. Native binaries are already on disk from Phase 27/28 carryover (RESEARCH §4 confirmed all 4 §10 binaries present). Gate-9 should remain GREEN.
</active_gates>

<stance_application_order>
Per D-33-02 — N/A in Wave F. This is not a conflict-region resolution; it's a staged catalog edit with lockfile regeneration. Stance hierarchy doesn't apply.
</stance_application_order>

<tasks>

<task type="auto">
  <name>Task 1: Pre-audit consumer evidence + determine versions + stage catalog edit</name>
  <files>
    pnpm-workspace.yaml
    pnpm-lock.yaml
  </files>
  <read_first>
    - Current `pnpm-workspace.yaml` (full file)
    - `git show fork/master:pnpm-workspace.yaml`
    - `git log --all --oneline -S 'exe-version' pnpm-workspace.yaml | head -10` (and same for the other 3 packages)
    - .planning/phases/33-gamebryo-per-game-extensions-v2-0-1/33-RESEARCH.md §3 (typecheck routes context for understanding which extensions need these packages at build time)
  </read_first>
  <action>
    **Step 1: Pre-audit consumer evidence.**
    Run the `<consumer_evidence_audit>` block exactly. If any package returns 0 consumers, drop it from this task's scope and record in SUMMARY as "deferred (no consumers)". Continue with remainder.

    **Step 2: Determine versions.**
    Apply `<package_versioning_rules>`. For each surviving package, capture the version string to pin (output a 4-row table: package | version | source-of-truth-commit-sha).

    **Step 3: Edit pnpm-workspace.yaml.**
    Add 4 new entries (or fewer if pre-audit dropped some) under the `catalog:` block, alphabetically sorted relative to existing siblings:
    ```yaml
    catalog:
      ...
      esptk: <version>
      exe-version: <version>
      gamebryo-savegame: <version>
      native-errors: <version>
      ...
    ```
    For `gamebryo-savegame`, follow the disposition determined in `<package_versioning_rules>` step 4.

    **Step 4: Regenerate lockfile.**
    ```bash
    pnpm install --frozen-lockfile=false 2>&1 | tee /tmp/wave-f-install.log
    ```
    Confirm: exit 0; lockfile updated; no peer-dep ERROR. Warnings are OK.

    **Step 5: Verify resolution.**
    For each re-added package:
    ```bash
    pnpm why exe-version 2>&1 | head -20
    test -d node_modules/exe-version || pnpm install
    ```
    Each package should resolve to its declared version.

    **Step 6: Smoke-build top consumers.**
    - `pnpm --filter game-witcher3 build` exit 0 (exe-version consumer)
    - `pnpm --filter game-baldursgate3 build` exit 0 (exe-version consumer)
    - `pnpm --filter gamebryo-plugin-management build` exit 0 (esptk consumer)
    - `pnpm --filter gamebryo-savegame-management build` exit 0 (gamebryo-savegame consumer)
    - `pnpm --filter @vortex/renderer build` OR `pnpm build` for renderer (native-errors consumer)

    **Step 7: Stage + commit (single combined commit).**
    ```bash
    git add pnpm-workspace.yaml pnpm-lock.yaml
    git commit -S -s -m "chore(catalog): re-add esptk + exe-version + gamebryo-savegame + native-errors per Wave F" \
      -m "$(cat <<'EOF'
    Re-adds 4 packages to pnpm-workspace.yaml catalog: that v2.0.1 dropped (or that
    were moved during Linux-rebased work). Consumers verified pre-resolve:

    - exe-version: <N> consumers (witcher3 ×2, bg3 ×3) — used for getProductVersionLocalized
    - esptk: <N> consumer (gamebryo-plugin-management lazy-load per playbook §6) — keep lazy-load wrapper to avoid silent extension-disappear bug (commit c219b460b)
    - gamebryo-savegame: <N> consumer (gamebryo-savegame-management) — disposition: <moved entirely to catalog: | kept in both catalog: and neverBuiltDependencies:>
    - native-errors: <N> consumer (src/renderer/src/renderer.tsx line 70 — `import * as nativeErr from 'native-errors'`)

    Versions:
    | package           | version           | source SHA |
    | esptk             | <v>               | <sha>      |
    | exe-version       | <v>               | <sha>      |
    | gamebryo-savegame | <v>               | <sha>      |
    | native-errors     | <v>               | <sha>      |

    Verification:
    - pnpm install --frozen-lockfile=false: exit 0
    - pnpm why <pkg> resolves for all 4
    - pnpm --filter game-witcher3 build: exit 0
    - pnpm --filter game-baldursgate3 build: exit 0
    - pnpm --filter gamebryo-plugin-management build: exit 0
    - pnpm --filter gamebryo-savegame-management build: exit 0
    - Renderer build (native-errors consumer): exit 0
    - Harness skip-mode: exit 0

    SSH-signed; --no-verify NOT used.
    EOF
    )"
    ```

  </action>
  <verify>
    <automated>
      cd /home/alex/src/Vortex && \
      grep -qE '^  esptk:' pnpm-workspace.yaml &amp;&amp; \
      grep -qE '^  exe-version:' pnpm-workspace.yaml &amp;&amp; \
      grep -qE '^  gamebryo-savegame:' pnpm-workspace.yaml &amp;&amp; \
      grep -qE '^  native-errors:' pnpm-workspace.yaml &amp;&amp; \
      test -f pnpm-lock.yaml &amp;&amp; \
      pnpm why exe-version 2&gt;/dev/null | head -1 | grep -q '\.' &amp;&amp; \
      bash .planning/phases/33-gamebryo-per-game-extensions-v2-0-1/scripts/grep-checkpoint.sh --skip-conflict-check &gt;/dev/null &amp;&amp; \
      git log -1 --pretty=%s | grep -q '^chore(catalog): re-add esptk + exe-version + gamebryo-savegame + native-errors' &amp;&amp; \
      git cat-file -p HEAD | grep -q '^gpgsig ' &amp;&amp; \
      echo OK
    </automated>
  </verify>
  <acceptance_criteria>
    - All 4 packages present under `catalog:` in pnpm-workspace.yaml
    - pnpm-lock.yaml regenerated and committed in same commit as workspace edit
    - `pnpm why <pkg>` resolves each of the 4
    - 5 consumer-build smoke checks pass (witcher3, bg3, gamebryo-plugin-management, gamebryo-savegame-management, renderer)
    - Single SSH-signed `chore(catalog): ...` commit with full body documenting consumer counts + versions + verification
    - Harness skip-mode exits 0
    - --no-verify NOT used
  </acceptance_criteria>
  <done>Catalog re-add complete; lockfile regenerated; all consumer extensions build cleanly.</done>
</task>

<task type="auto">
  <name>Task 2: Wave F SUMMARY commit</name>
  <files>.planning/phases/33-gamebryo-per-game-extensions-v2-0-1/33-08-SUMMARY.md</files>
  <read_first>
    - Wave F commit: `git log -1 --stat`
    - $HOME/.claude/get-shit-done/templates/summary.md
  </read_first>
  <action>
    Write `33-08-SUMMARY.md`. Required sections:
    - Outcome: catalog re-add complete; 1 combined commit + 1 docs commit
    - Per-package table: package | consumer count (pre-audit) | version pinned | source-of-truth commit | smoke-build status
    - **Disposition note for gamebryo-savegame:** record whether it was moved entirely to `catalog:` or kept dual-listed
    - Active gates: 0 (all passive); gate-9 native-binaries gate cross-checked by re-running existence sentinel
    - Harness state: 12/12 GREEN
    - Affects: Wave 9 done-gate (final verification phase)
    - Provides: pnpm catalog reflects all v2.0.1 + Linux-rebased package needs
    - Issues encountered (if any) — note any package deferred for "no consumers"

    Add via `git add -f`. Title: `docs(33-08): summarize Wave F catalog re-add (4 packages, 1 combined commit)`.

  </action>
  <verify>
    <automated>
      cd /home/alex/src/Vortex && \
      test -f .planning/phases/33-gamebryo-per-game-extensions-v2-0-1/33-08-SUMMARY.md &amp;&amp; \
      git log -1 --pretty=%s | grep -q '^docs(33-08): summarize Wave F' &amp;&amp; \
      git cat-file -p HEAD | grep -q '^gpgsig ' &amp;&amp; \
      echo OK
    </automated>
  </verify>
  <acceptance_criteria>
    - 33-08-SUMMARY.md exists, committed via `git add -f`, SSH-signed
    - 1 `chore(catalog):` commit + 1 docs commit on Wave F
    - All 4 catalog entries documented with version + consumer count
  </acceptance_criteria>
  <done>Wave F complete; summary committed; ready for done-gate (Wave 9).</done>
</task>

</tasks>

<verification>
After all tasks:
- `grep -E '^  (esptk|exe-version|gamebryo-savegame|native-errors):' pnpm-workspace.yaml | wc -l` returns 4 (or matches the deferred-package count if any were pre-audit-dropped)
- `pnpm install --frozen-lockfile=false` exits 0 (idempotent re-run)
- `pnpm why <pkg>` resolves all 4 packages
- 5 consumer-build smoke checks pass
- `bash .planning/phases/33-gamebryo-per-game-extensions-v2-0-1/scripts/grep-checkpoint.sh --skip-conflict-check` exits 0
- 1 + 1 SSH-signed commits on Wave F
</verification>

<success_criteria>

- 4 packages re-added to catalog (or N<4 with documented deferrals for any package without consumers)
- Lockfile regenerated and committed in same commit
- 5 consumer extensions build cleanly
- Harness 12/12 GREEN
- Wave 9 done-gate unblocked
  </success_criteria>

<output>
Create `.planning/phases/33-gamebryo-per-game-extensions-v2-0-1/33-08-SUMMARY.md` per Task 2.
</output>
