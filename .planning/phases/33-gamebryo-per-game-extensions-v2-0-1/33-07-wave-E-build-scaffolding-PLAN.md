---
phase: 33-gamebryo-per-game-extensions-v2-0-1
plan: 07
type: execute
wave: 7
depends_on:
    - 33-06
files_modified:
    - extensions/copy-extension.mjs
    - extensions/copy-native.mjs
    - extensions/gamestore-gog/src/index.ts
    - extensions/gamestore-uplay/src/index.ts
    - extensions/gamestore-xbox/src/index.ts
    - extensions/local-gamesettings/src/index.ts
    - extensions/mod-dependency-manager/src/index.tsx
    - extensions/mod-dependency-manager/src/util/blacklist.ts
    - extensions/mod-dependency-manager/src/views/ConflictEditor.tsx
    - extensions/mod-dependency-manager/src/views/OverrideEditor.tsx
    - extensions/theme-switcher/build.mjs
    - extensions/theme-switcher/src/SettingsDebug.tsx
    - .planning/phases/33-gamebryo-per-game-extensions-v2-0-1/33-07-SUMMARY.md
autonomous: true
requirements:
    - SYNC-33a
must_haves:
    truths:
        - "All 12 build-scaffolding files marker-free across copy-extension.mjs + copy-native.mjs + 5 misc extensions"
        - "12 atomic SSH-signed `resolve(<slug>): ...` commits"
        - "copy-extension.mjs: TARGET-constant → runtime-arg API change applied (tier-3 upstream-wins on signature; preserve fork's CWD inference fallback)"
        - "copy-native.mjs: tier-2 fork-wins on the dist-fallback block (MUST preserve fork's `console.log('Source binaries missing but dist/ already has them — skipping copy')` early-return)"
        - "Each touched extension: per-extension typecheck/build returns 0 non-marker errors at closeout"
        - "Harness 12 gates stay GREEN after every commit"
        - "0 active gates in Wave E (no §1/§3/§10/BG3/Morrowind/process.platform hits per RESEARCH §4)"
    artifacts:
        - path: "extensions/copy-extension.mjs"
          provides: "Build-time bundledPlugins copy script with v2.0.1 runtime-arg target signature"
          contains: "process.argv"
        - path: "extensions/copy-native.mjs"
          provides: "Build-time native-binary copy script with fork's dist-fallback skip-on-missing behavior"
          contains: "Source binaries missing but dist/ already has them"
    key_links:
        - from: "extensions/copy-extension.mjs"
          to: "all extensions/*/build.mjs that invoke `node ../copy-extension.mjs`"
          via: "Node CLI invocation"
          pattern: "copy-extension.mjs"
        - from: "extensions/copy-native.mjs"
          to: "extensions/gamebryo-{archive,bsa,plugin-management,savegame-management}/build.mjs"
          via: "post-build native-copy step"
          pattern: "copy-native.mjs"
---

<objective>
Wave E. Resolve build scaffolding outside per-game / collections / bepinex / gamebryo-* scopes. 12 files across 7 extensions — most importantly the two `copy-*.mjs` scripts that v2.0.1 reshaped.

The `copy-extension.mjs` API changed from a hardcoded `const TARGET = "build"` to a runtime-arg `target` parameter — must take upstream's signature (tier-3 upstream-wins on scaffolding, per D-33-02 step 3) while keeping fork's CWD-inference fallback. The `copy-native.mjs` v2.0.1 dropped fork's dist-fallback skip-on-missing block — must keep fork side (tier-2 fork-wins on the skip-on-missing branch, per the missing-file path that gamebryo-archive/bsa/savegame native re-build paths rely on).

Other 10 files in Wave E are tier-5 smaller-diff baseline.

Output: 12 SSH-signed commits + 1 SUMMARY commit. Harness 12/12 GREEN at end.
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
@.planning/phases/33-gamebryo-per-game-extensions-v2-0-1/33-06-SUMMARY.md
@VORTEX-LINUX-MERGE-PLAYBOOK.md
@CLAUDE.md
@AGENTS.md
</context>

<files_in_scope>
| # | Extension/script | Files | Slug | Stance baseline |
|---|------------------|-------|------|-----------------|
| 1 | extensions/copy-extension.mjs | 1 | copy-ext | tier-3 upstream-wins on `target`-as-runtime-arg signature; preserve fork's CWD-inference fallback |
| 2 | extensions/copy-native.mjs | 1 | copy-native | tier-2 fork-wins on dist-fallback skip-on-missing block |
| 3 | extensions/gamestore-gog | 1 (src/index.ts) | gog | tier-5 smaller-diff |
| 4 | extensions/gamestore-uplay | 1 (src/index.ts) | uplay | tier-5 smaller-diff |
| 5 | extensions/gamestore-xbox | 1 (src/index.ts) | xbox | tier-5 smaller-diff |
| 6 | extensions/local-gamesettings | 1 (src/index.ts) | local-gs | tier-5 smaller-diff |
| 7a | extensions/mod-dependency-manager/src/util/blacklist.ts | 1 | mdm | tier-5 smaller-diff |
| 7b | extensions/mod-dependency-manager/src/views/ConflictEditor.tsx | 1 | mdm | tier-5 smaller-diff |
| 7c | extensions/mod-dependency-manager/src/views/OverrideEditor.tsx | 1 | mdm | tier-5 smaller-diff |
| 7d | extensions/mod-dependency-manager/src/index.tsx | 1 | mdm | tier-5 smaller-diff (barrel — last in mdm) |
| 8a | extensions/theme-switcher/build.mjs | 1 | theme-switcher | tier-3 upstream-wins on nativeRemapPlugin (if region exists; otherwise tier-5) |
| 8b | extensions/theme-switcher/src/SettingsDebug.tsx | 1 | theme-switcher | tier-5 smaller-diff |

**Total:** 12 files across 7 extensions/scripts.

**Typecheck routes (Pattern P4):**

- copy-extension.mjs, copy-native.mjs: Route 3 — `node --check <file>` (vanilla ESM, no tsconfig)
- gamestore-gog, gamestore-uplay, gamestore-xbox, local-gamesettings: Route 2 — `pnpm --filter <name> build` (extensions are rolldown-built; use package.json `name` field)
- mod-dependency-manager: Route 1 if it has tsconfig+typecheck script, else Route 2. Confirm via `cat extensions/mod-dependency-manager/package.json | grep -E '"typecheck"' || echo "no typecheck script — Route 2"`
- theme-switcher: Route 1 if tsconfig+typecheck script present, else Route 2. Confirm same way.
  </files_in_scope>

<active_gates>
Per RESEARCH §4: 0 of 12 gates active in Wave E. All 12 gates passive post-commit assertions.

**Note:** copy-native.mjs IS the path through which gates 9 (§10 native binaries) and 7 (§1 build guards) get exercised at _build time_ (not at conflict-resolution time). The harness checks the binaries _exist on disk_ — which they do today. Wave E's copy-native.mjs resolution must NOT regress that path; the tier-2 fork-wins on the dist-fallback block is the critical mechanism.
</active_gates>

<stance_application_order>
Per D-33-02:

1. Playbook-surface: N/A in Wave E
2. Linux platform guard: N/A in Wave E (RESEARCH §4 records 0 process.platform hits)
3. **New v2.0.1 feature scaffolding: tier-3 upstream-wins on `copy-extension.mjs` `target`-runtime-arg API + on `theme-switcher/build.mjs` nativeRemapPlugin (if region exists)**
4. **Linux dist-fallback preservation: tier-2 fork-wins on `copy-native.mjs` skip-on-missing dist-fallback block (Linux-rebased v2.0.0 introduced this; v2.0.1 dropped it; must keep fork side)**
5. Rule-1 dup-import: tier-4 HEAD-empty for any duplicated import region (watch the import block of copy-native.mjs — RESEARCH §2 flagged a likely dup-import there: HEAD has fs/path/execSync; upstream rearranged to fs/execSync only, missing path)
6. Smaller-diff: tier-5 default for everything else (gamestore-\*, local-gamesettings, mdm, theme-switcher SettingsDebug)
   </stance_application_order>

<copy_extension_protocol>
Specific resolution recipe for `extensions/copy-extension.mjs`:

**API change (RESEARCH note):** v2.0.1 made `target` a parameter to `copyExtension(extension, target)` instead of a top-level constant. Fork side has `const TARGET = "build"` and uses `TARGET` inside the function. Upstream side has bare `target` reference (the parameter).

**Resolution recipe:**

1. Take upstream's `target` parameter signature (tier-3 upstream-wins on scaffolding signature).
2. Remove fork's top-level `const TARGET = "build";` line.
3. Inside the function, use `target` (the parameter), not `TARGET`.
4. **Preserve fork's CWD-inference fallback** at the bottom (`if (extensionArg)` → infer-from-CWD branch). v2.0.1 added a small refinement (`extensionArg !== "out" && extensionArg !== "dist"` guard) — take it.
5. The call site that consumes copy-extension.mjs (each `extensions/*/build.mjs` that invokes `node ../copy-extension.mjs`) MUST be unaffected because they were already passing `extension` as `process.argv[2]`. The new `target` parameter defaults to "build" if not passed — verify by reading the post-resolve file.

**Verify post-resolve:**

```bash
F=extensions/copy-extension.mjs
node --check "$F"
# Confirm signature: copyExtension(extension, target = "build") OR similar default
grep -nE 'function copyExtension\(' "$F"
# Confirm no orphan TARGET reference remains
! grep -n '\bTARGET\b' "$F" || { echo "FAIL: TARGET constant still referenced"; exit 1; }
# Confirm dist-fallback CWD inference branch survives
grep -n 'process.cwd\|inferred from CWD\|relative.EXTENSIONS_DIR' "$F" || { echo "FAIL: CWD inference removed"; exit 1; }
```

**Commit title:** `resolve(copy-ext): copy-extension.mjs — upstream-wins on target-runtime-arg API + preserve fork CWD inference`

Commit body MUST document: (a) which side won which region, (b) the API change behavior, (c) verification command results.
</copy_extension_protocol>

<copy_native_protocol>
Specific resolution recipe for `extensions/copy-native.mjs`:

**Critical fork-side block (do NOT lose):**

```javascript
if (missingFiles.length > 0) {
  const destDir = "dist";
  const allInDist = missingFiles.every((f) =>
    fs.existsSync(path.join(destDir, path.basename(f))),
  );
  if (allInDist) {
    console.log("Source binaries missing but dist/ already has them — skipping copy");
    process.exit(0);
  }
  console.error("Missing native files:");
  ...
}
```

This dist-fallback branch is required for incremental rebuild paths where source binaries were already copied in a prior build but the source artifacts have since been cleaned. Upstream v2.0.1 dropped this entirely. Tier-2 fork-wins.

**Import-block region (top of file):** likely Rule-1 dup-import territory — HEAD has `execSync, fs, path` (alphabetical); upstream has `fs, execSync` (different order, missing `path`). Apply tier-4 HEAD-empty if upstream's region IS just a duplicate of imports HEAD already has → keep HEAD side (which still has `path`, which is needed by the dist-fallback block).

**Resolution recipe:**

1. **Import block:** keep HEAD imports (fs, path, execSync — all three needed). Tier-4 HEAD-empty: take HEAD region, drop upstream's redundant rearrangement.
2. **`copyFlags` line:** tier-5 smaller-diff (formatter reflow only).
3. **Dist-fallback block:** tier-2 fork-wins. Keep the `if (missingFiles.length > 0) { const destDir = "dist"; const allInDist = ...; if (allInDist) { console.log(...); process.exit(0); } ...` block exactly as fork had it.

**Verify post-resolve:**

```bash
F=extensions/copy-native.mjs
node --check "$F"
# Confirm dist-fallback sentinel string survives
grep -F "Source binaries missing but dist/ already has them" "$F" \
  || { echo "FAIL: fork's dist-fallback sentinel lost"; exit 1; }
# Confirm path is still imported (used by dist-fallback)
grep -nE 'import path|from .node:path.' "$F" \
  || { echo "FAIL: path import lost (dist-fallback uses path.basename)"; exit 1; }
# Confirm no orphan upstream-only structure
grep -c '<<<<<<<\|>>>>>>>\|=======' "$F" | grep -q '^0$'
```

**Commit title:** `resolve(copy-native): copy-native.mjs — fork-wins on dist-fallback + Rule-1 HEAD-empty on import block`

Commit body MUST document: (a) which fork-side block was preserved (verbatim string), (b) HEAD-empty for import-block, (c) `node --check` exit, (d) sentinel grep result.
</copy_native_protocol>

<shared_per_task_workflow>
Same as 33-01 (Wave A). Steps 1-10. Per-extension typecheck deferred to last commit per extension.

**Bluebird trap** (R5): spot-check applies to `.tsx`/`.ts` files in mod-dependency-manager, theme-switcher, gamestore-\*, local-gamesettings.

**Vanilla `.mjs` files (copy-extension, copy-native):** Route 3 only — `node --check <file>` per file post-commit. No build/typecheck step (these scripts are invoked at extension build-time but are themselves untyped Node modules).
</shared_per_task_workflow>

<tasks>

<task type="auto">
  <name>Task 1: Resolve copy-extension.mjs (tier-3 upstream-wins on API; tier-5 elsewhere)</name>
  <files>extensions/copy-extension.mjs</files>
  <read_first>
    - Current file state (especially the function signature region + CWD-inference branch)
    - `git show fork/master:extensions/copy-extension.mjs`
    - Read every `extensions/*/build.mjs` that invokes `node ../copy-extension.mjs` to confirm call site (`grep -lr 'copy-extension.mjs' extensions/*/build.mjs`)
  </read_first>
  <action>
    Apply `<copy_extension_protocol>` block above. Single resolution, single commit.

    Title: `resolve(copy-ext): copy-extension.mjs — upstream-wins on target-runtime-arg API + preserve fork CWD inference`

    Verify: see protocol's verify block — `node --check`, no orphan TARGET, CWD inference survives.

  </action>
  <verify>
    <automated>
      cd /home/alex/src/Vortex && \
      ! git grep -l '^&lt;&lt;&lt;&lt;&lt;&lt;&lt; ' extensions/copy-extension.mjs &amp;&amp; \
      node --check extensions/copy-extension.mjs &amp;&amp; \
      ! grep -n '\bTARGET\b' extensions/copy-extension.mjs &amp;&amp; \
      grep -nE 'process.cwd|relative.*EXTENSIONS_DIR' extensions/copy-extension.mjs &gt;/dev/null &amp;&amp; \
      git log -1 --pretty=%s | grep -q '^resolve(copy-ext): copy-extension.mjs' &amp;&amp; \
      git cat-file -p HEAD | grep -q '^gpgsig ' &amp;&amp; \
      echo OK
    </automated>
  </verify>
  <acceptance_criteria>
    - copy-extension.mjs marker-free
    - `node --check` passes
    - No `TARGET` constant remains; `target` parameter signature in place
    - CWD-inference fallback preserved
    - Commit body documents API change behavior + verification results
  </acceptance_criteria>
  <done>copy-extension.mjs API change applied.</done>
</task>

<task type="auto">
  <name>Task 2: Resolve copy-native.mjs (tier-2 fork-wins on dist-fallback; tier-4 HEAD-empty on imports)</name>
  <files>extensions/copy-native.mjs</files>
  <read_first>
    - Current file state (every conflict region)
    - `git show fork/master:extensions/copy-native.mjs`
    - .planning/phases/33-gamebryo-per-game-extensions-v2-0-1/33-RESEARCH.md (cross-reference §10 native-binaries gate dependency)
  </read_first>
  <action>
    Apply `<copy_native_protocol>` block above. Single resolution, single commit.

    Title: `resolve(copy-native): copy-native.mjs — fork-wins on dist-fallback + Rule-1 HEAD-empty on import block`

    Verify: see protocol's verify block — `node --check`, dist-fallback sentinel string survives, path import survives.

  </action>
  <verify>
    <automated>
      cd /home/alex/src/Vortex && \
      ! git grep -l '^&lt;&lt;&lt;&lt;&lt;&lt;&lt; ' extensions/copy-native.mjs &amp;&amp; \
      node --check extensions/copy-native.mjs &amp;&amp; \
      grep -F "Source binaries missing but dist/ already has them" extensions/copy-native.mjs &gt;/dev/null &amp;&amp; \
      grep -nE 'import path|from .node:path.' extensions/copy-native.mjs &gt;/dev/null &amp;&amp; \
      git log -1 --pretty=%s | grep -q '^resolve(copy-native): copy-native.mjs' &amp;&amp; \
      git cat-file -p HEAD | grep -q '^gpgsig ' &amp;&amp; \
      echo OK
    </automated>
  </verify>
  <acceptance_criteria>
    - copy-native.mjs marker-free
    - `node --check` passes
    - Dist-fallback sentinel string preserved verbatim
    - `path` import preserved
    - Commit body documents fork-wins region + Rule-1 HEAD-empty + verification results
  </acceptance_criteria>
  <done>copy-native.mjs Linux-rebased dist-fallback preserved.</done>
</task>

<task type="auto">
  <name>Task 3: Resolve 3 gamestore-* extensions in parallel (gog, uplay, xbox)</name>
  <files>
    extensions/gamestore-gog/src/index.ts
    extensions/gamestore-uplay/src/index.ts
    extensions/gamestore-xbox/src/index.ts
  </files>
  <read_first>
    - All 3 files current state
    - `git show fork/master:<path>` for each
  </read_first>
  <action>
    3 parallel Engineer agents (one per extension; fully independent per RESEARCH §6). Each agent: 1 file, tier-5 smaller-diff baseline. Bluebird spot-check.

    Titles:
    - `resolve(gog): src/index.ts — smaller-diff`
    - `resolve(uplay): src/index.ts — smaller-diff`
    - `resolve(xbox): src/index.ts — smaller-diff`

    Per extension closeout: `pnpm --filter gamestore-<name> build` exit 0 (Route 2; verify by reading package.json `name` field first).

  </action>
  <verify>
    <automated>
      cd /home/alex/src/Vortex && \
      ! git grep -l '^&lt;&lt;&lt;&lt;&lt;&lt;&lt; ' extensions/gamestore-gog/ extensions/gamestore-uplay/ extensions/gamestore-xbox/ &amp;&amp; \
      git log --since='1 hour ago' --pretty=%s | grep -cE '^resolve\((gog|uplay|xbox)\):' | grep -q '^3$' &amp;&amp; \
      echo OK
    </automated>
  </verify>
  <acceptance_criteria>
    - 3 files marker-free; 3 SSH-signed commits
    - Each gamestore-* extension's build returns exit 0
  </acceptance_criteria>
  <done>3 gamestore-* extensions resolved.</done>
</task>

<task type="auto">
  <name>Task 4: Resolve local-gamesettings (1 file)</name>
  <files>extensions/local-gamesettings/src/index.ts</files>
  <read_first>
    - File current state
    - `git show fork/master:extensions/local-gamesettings/src/index.ts`
  </read_first>
  <action>
    Engineer agent (parallel with Task 3, 5, 6). Single file, tier-5 smaller-diff.

    Title: `resolve(local-gs): src/index.ts — smaller-diff`

    Closeout: `pnpm --filter local-gamesettings build` exit 0 (verify package.json `name`).

  </action>
  <verify>
    <automated>
      cd /home/alex/src/Vortex && \
      ! git grep -l '^&lt;&lt;&lt;&lt;&lt;&lt;&lt; ' extensions/local-gamesettings/ &amp;&amp; \
      git log --since='1 hour ago' --pretty=%s | grep -q '^resolve(local-gs): src/index.ts' &amp;&amp; \
      echo OK
    </automated>
  </verify>
  <acceptance_criteria>
    - File marker-free; SSH-signed commit
    - Build exit 0
  </acceptance_criteria>
  <done>local-gamesettings resolved.</done>
</task>

<task type="auto">
  <name>Task 5: Resolve mod-dependency-manager (4 files leaf-first → barrel-last)</name>
  <files>
    extensions/mod-dependency-manager/src/util/blacklist.ts
    extensions/mod-dependency-manager/src/views/ConflictEditor.tsx
    extensions/mod-dependency-manager/src/views/OverrideEditor.tsx
    extensions/mod-dependency-manager/src/index.tsx
  </files>
  <read_first>
    - All 4 files current state
    - `git show fork/master:<path>` for each
    - extensions/mod-dependency-manager/package.json (`name` + `typecheck` script presence — Route 1 vs Route 2)
  </read_first>
  <action>
    Engineer agent (parallel with Tasks 3, 4, 6). Sequential within extension, dependees-first → barrel-last:
    util/blacklist.ts → views/ConflictEditor.tsx → views/OverrideEditor.tsx → src/index.tsx.

    All tier-5 smaller-diff baseline. Bluebird spot-check on each.

    Titles:
    - `resolve(mdm): util/blacklist.ts — smaller-diff`
    - `resolve(mdm): views/ConflictEditor.tsx — smaller-diff`
    - `resolve(mdm): views/OverrideEditor.tsx — smaller-diff`
    - `resolve(mdm): src/index.tsx — smaller-diff (barrel)` (or appropriate stance if dup-import)

    **At src/index.tsx commit (extension closeout):**
    Route detection:
    ```bash
    if grep -q '"typecheck"' extensions/mod-dependency-manager/package.json; then
      pnpm --filter mod-dependency-manager typecheck 2>&1 | grep -E 'error TS' | grep -v TS1185 | wc -l
    else
      pnpm --filter mod-dependency-manager build 2>&1 | grep -E 'error TS' | grep -v TS1185 | wc -l
    fi
    ```
    Must be 0. Record route + count in commit body.

  </action>
  <verify>
    <automated>
      cd /home/alex/src/Vortex && \
      ! git grep -l '^&lt;&lt;&lt;&lt;&lt;&lt;&lt; ' extensions/mod-dependency-manager/ &amp;&amp; \
      git log --since='1 hour ago' --pretty=%s | grep -c '^resolve(mdm):' | grep -q '^4$' &amp;&amp; \
      echo OK
    </automated>
  </verify>
  <acceptance_criteria>
    - 4 files marker-free; 4 SSH-signed `resolve(mdm): ...` commits
    - Per-extension typecheck (Route 1 or Route 2) returns 0 non-marker errors at closeout
    - Closeout commit body records route used + count
  </acceptance_criteria>
  <done>mod-dependency-manager resolved.</done>
</task>

<task type="auto">
  <name>Task 6: Resolve theme-switcher (2 files: build.mjs + src/SettingsDebug.tsx)</name>
  <files>
    extensions/theme-switcher/build.mjs
    extensions/theme-switcher/src/SettingsDebug.tsx
  </files>
  <read_first>
    - Both files current state
    - `git show fork/master:<path>` for each
    - extensions/theme-switcher/package.json (`name` + `typecheck` script presence)
    - scripts/extensions-rolldown.mjs (`nativeRemapPlugin` for build.mjs reference)
  </read_first>
  <action>
    Engineer agent (parallel with Tasks 3, 4, 5). Sequential: build.mjs → SettingsDebug.tsx.

    - **build.mjs (1 region):** if region overlaps `nativeRemapPlugin` import → tier-3 upstream-wins. Otherwise tier-5 smaller-diff. `node --check build.mjs` post-resolve.
      Title: `resolve(theme-switcher): build.mjs — upstream-wins on nativeRemapPlugin import` OR `... — smaller-diff` based on actual content.

    - **src/SettingsDebug.tsx (1 region):** tier-5 smaller-diff (formatter reflow). Bluebird spot-check.
      Title: `resolve(theme-switcher): src/SettingsDebug.tsx — smaller-diff`

    **At SettingsDebug.tsx commit (extension closeout):**
    Same Route 1/Route 2 detection as Task 5. Must be 0 non-marker errors.

  </action>
  <verify>
    <automated>
      cd /home/alex/src/Vortex && \
      ! git grep -l '^&lt;&lt;&lt;&lt;&lt;&lt;&lt; ' extensions/theme-switcher/ &amp;&amp; \
      node --check extensions/theme-switcher/build.mjs &amp;&amp; \
      git log --since='1 hour ago' --pretty=%s | grep -c '^resolve(theme-switcher):' | grep -q '^2$' &amp;&amp; \
      echo OK
    </automated>
  </verify>
  <acceptance_criteria>
    - 2 files marker-free; 2 SSH-signed `resolve(theme-switcher): ...` commits
    - `node --check build.mjs` passes
    - Per-extension typecheck closeout = 0 non-marker errors
  </acceptance_criteria>
  <done>theme-switcher resolved.</done>
</task>

<task type="auto">
  <name>Task 7: Wave E SUMMARY commit</name>
  <files>.planning/phases/33-gamebryo-per-game-extensions-v2-0-1/33-07-SUMMARY.md</files>
  <read_first>
    - All Wave E commits: `git log --oneline 33-06..HEAD -- extensions/`
    - $HOME/.claude/get-shit-done/templates/summary.md
  </read_first>
  <action>
    Write `33-07-SUMMARY.md`. Required sections:
    - Outcome: 7/7 build-scaffolding extensions/scripts resolved; 12 commits + 1 docs commit
    - Per-file table: file, stance, commit SHA, verification result
    - **API change documentation:** copy-extension.mjs target-runtime-arg signature + CWD inference preservation
    - **Linux-rebased preservation:** copy-native.mjs dist-fallback skip-on-missing block
    - Active gates: 0 (all passive in Wave E)
    - Harness state: 12/12 GREEN
    - Affects: Wave F catalog re-add (consumer evidence already captured in D1+D2)
    - Provides: Build scaffolding fully reconciled with v2.0.1 API
    - Issues encountered (if any)

    Add via `git add -f`. Title: `docs(33-07): summarize Wave E build-scaffolding resolution (7 extensions/scripts, 12 files, 12 commits)`.

  </action>
  <verify>
    <automated>
      cd /home/alex/src/Vortex && \
      test -f .planning/phases/33-gamebryo-per-game-extensions-v2-0-1/33-07-SUMMARY.md &amp;&amp; \
      git log -1 --pretty=%s | grep -q '^docs(33-07): summarize Wave E' &amp;&amp; \
      git cat-file -p HEAD | grep -q '^gpgsig ' &amp;&amp; \
      echo OK
    </automated>
  </verify>
  <acceptance_criteria>
    - 33-07-SUMMARY.md exists, committed via `git add -f`, SSH-signed
    - 12 `resolve(<slug>):` commits + 1 docs commit on Wave E
    - Conflict-marker files in 7 Wave E extensions: 0
  </acceptance_criteria>
  <done>Wave E complete; summary committed; branch ready for Wave F.</done>
</task>

</tasks>

<verification>
After all tasks:
- `git grep -l '^<<<<<<< ' extensions/` minus per-game / collections / bepinex / gamebryo-* paths returns empty
- `bash .planning/phases/33-gamebryo-per-game-extensions-v2-0-1/scripts/grep-checkpoint.sh --skip-conflict-check` exits 0
- copy-extension.mjs has no `TARGET` constant; `target` parameter in place; CWD inference preserved
- copy-native.mjs has fork's dist-fallback sentinel string; `path` import preserved
- All 7 extensions' typecheck/build closeout returns 0 non-marker errors
- 12 + 1 SSH-signed commits on Wave E
</verification>

<success_criteria>

- 7 build-scaffolding extensions/scripts fully resolved
- 12 + 1 SSH-signed commits
- copy-extension.mjs API change applied without losing CWD inference
- copy-native.mjs Linux-rebased dist-fallback preserved
- Harness 12/12 GREEN
- Wave F unblocked
  </success_criteria>

<output>
Create `.planning/phases/33-gamebryo-per-game-extensions-v2-0-1/33-07-SUMMARY.md` per Task 7.
</output>
