# Vortex Linux — Upstream Merge Playbook

Companion to [VORTEX-LINUX.md](VORTEX-LINUX.md). VORTEX-LINUX.md is the forward plan; this file is the post-merge checklist for keeping the fork working.

Everything in here is something we actually hit — not speculation. If it's in this file, it's bitten us at least once.

The numbered probes here are the canonical spec for [`scripts/linux-smoke.sh`](scripts/linux-smoke.sh), which the receiving-motion `rebase-upstream.yml` workflow runs against every upstream sync PR. When you add a new playbook entry, add its probe to the smoke script in the same commit — keep the two in lockstep.

---

## Why this file exists

Upstream `nexus-mods/Vortex` ships frequent changes to build scripts, webpack config, and extension scaffolding. A lot of them target Windows-only stuff (CI guards, native addon links, asar layout) and accidentally undo our Linux work. The reverts are usually **silent** — the build still succeeds on CI, tests still pass, and Linux only breaks at runtime (often several steps deep, e.g. "staging folder won't change" caused by "webpack alias preempted by `nodeExternals`" caused by "upstream re-ordered `externals` in the config").

Below: the checklist we run after every upstream merge and the things we've learned the hard way.

---

## Post-merge checklist

Run these **before** finalising any merge commit.

### 1. Platform guards on extension build scripts

```bash
grep -l "node -e.*process.platform" extensions/*/package.json extensions/games/*/package.json
```

If anything matches, upstream put an inline guard back. Replace each hit with the appropriate named-script form based on which platform should skip:

```json
"build": "node ../skip-on-windows.mjs && (pnpm run _build && node ../copy-extension.mjs)"
"build": "node ../skip-on-linux.mjs || (pnpm run _build && node ../copy-extension.mjs)"
```

Note the operator asymmetry — see "platform-guard operator direction" in Past gotchas for why. Quick rule: skip-on-windows uses `&&`, skip-on-linux uses `||`. Filename names the skipped platform.

Extensions with guards we know about:

- `extensions/gamestore-xbox/package.json` _(skip-on-linux — Windows-only registry/Game Pass integration)_

Previously skipped but now fixed (guards removed, CI rebuilds native deps):

- `extensions/gamebryo-plugin-management/package.json` — guard removed `ba23aee71`; uses `copy-native-loot.mjs` for platform-aware native copy (libloot.so.0 on Linux, libloot.dll on Windows)
- `extensions/gamebryo-bsa-support/package.json` — guard removed `833f02db0`; CI fetches bsatk source and rebuilds with node-gyp
- `extensions/gamebryo-archive-support/package.json` — guard removed `833f02db0`; has no native deps (pure TS + lz4js), guard was never needed
- `extensions/gamebryo-ba2-support/package.json` — guard removed `3452f94f1`; ba2tk is pure-TS (cb931f65e), no native deps to skip

Sentinels: `extensions/skip-on-windows.mjs` and `extensions/skip-on-linux.mjs` must exist (gamestore-xbox still uses the latter).

**Native addon CI pattern:** pnpm's isolated store hides addons from `@electron/rebuild`. For any native addon in an extension workspace, add an explicit rebuild step in both `main.yml` and `release-linux.yml` — resolve the package dir, fetch source if needed, then `npx node-gyp rebuild --target=<electron-version>`. Current explicit rebuilds: loot, bsatk, font-scanner.

### 2. Webpack externals allowlist for `winapi-bindings`

```bash
grep -A 5 "nodeExternals" src/renderer/webpack.config.cjs
```

The allowlist must include `winapi-bindings` on Linux:

```js
allowlist: [
  /@vortex\/shared/,
  ...(process.platform === "linux" ? ["winapi-bindings"] : []),
],
```

Without this, `nodeExternals` silently beats the `resolve.alias` redirect to `winapi-shim.ts`, and `winapi.GetVolumePathName is not a function` only pops up when a user changes the mod staging folder.

### 2.5. `rolldown.base.mjs` alias parameter for Linux winapi-shim

```bash
grep -n "alias" rolldown.base.mjs
grep -n "linuxAlias" src/main/build.mjs
```

`createConfig` must keep its 6th `alias` parameter and the conditional `...(alias !== undefined && { resolve: { alias } })` spread. `src/main/build.mjs` passes `linuxAlias = process.platform === "linux" ? { "winapi-bindings": SHIM_PATH } : undefined` as the 6th arg to swap winapi-bindings → `winapi-shim.ts` at bundle time. Drop the param "as unused" (easy to do during smaller-diff conflict resolution — happened in `155f7a68d`, restored in `8519f6d29`) and rolldown errors `UNRESOLVED_IMPORT: './build/Release/winapi'` on Linux. Pair gotcha with §2: same Linux winapi-shim mechanism, different bundler — alias for the main bundle, externals allowlist for the renderer.

### 3. LOOT call-site casing

```bash
grep -n "toLowerCase\|\\.filePath" extensions/gamebryo-plugin-management/src/autosort.ts | head -20
```

All LOOT calls (`loadPluginsAsync`, `getPluginMetadataAsync`, `getPluginAsync`, `sortPluginsAsync`) must use `path.basename(pluginList[id].filePath)` — the real on-disk filename — not `pluginName.toLowerCase()`. On ext4 without casefold, lowercased names don't match real filenames like `DLCCoast.esm`, so LOOT falls back to probing the `.ghost` variant and spits out the confusing `"… does not have a valid plugin header"` error naming a `.ghost` path the file never had on disk.

### 4. Transfer-path platform guard

```bash
grep -n "UnsupportedOperatingSystem\|platform !== \"win32\"" src/renderer/src/util/transferPath.ts
```

`testPathTransfer` must not reject non-Windows. `winapi.GetVolumePathName` is shimmed on Linux; `statfsSync` is POSIX; `turbowalk` has a Linux JS fallback. If the guard is back, users can't change their mod staging folder (symptom: "Unsupported operating system" alert plus staging-folder change silently failing).

Encoded as gate 13 in `.planning/milestones/v8.0/scripts/grep-checkpoint.sh` — the first NEGATIVE gate in the milestone (count must be 0). Proves the Windows-only reject in `transferPath.ts` was not re-introduced through any phase resolution.

### 5. Bundled plugins populated

```bash
ls src/main/build/bundledPlugins | wc -l   # expect ~132
```

If this is 0, upstream renamed the output path (`out` → `build` or the other way) and the extension `copy-extension.mjs` step wasn't re-run against the new path. Re-run:

```bash
pnpm run build:extensions
```

**Numerical floor:** ≥ 130. Phase 35 Wave 5 confirmed 132 against the v2.0.1 tree. If the count drops below floor on a fresh merge, an extension was silently lost from the build and `pnpm build:extensions` will succeed but the deb/AppImage will ship with missing UI. Capture command:

```bash
node -p 'require("./src/main/build/main.js").bundledPlugins?.length || "n/a"'
```

Run after `pnpm build`.

### 6. Staging-integrity guard in `doDownload`

```bash
grep -n "stagingDirHasFiles" src/renderer/src/extensions/mod_management/InstallManager.ts
```

Should return two hits: the import at the top and the call inside the `.then(async (downloadId) => { ... })` block in `doDownload`. Without these, a broken install that leaves an empty staging dir persists across every subsequent install attempt because `dep.mod != null` short-circuits re-extraction forever, and the "Redundant mods" dialog keeps flagging affected mods after every deploy. Sibling sentinel `src/renderer/src/extensions/mod_management/util/stagingIntegrity.ts` must exist. See "stale empty staging dir" in the case-sensitive filesystem section below for the full story.

### 7. Four-fix backslash/case cluster after extraction

Four call sites that must travel as a unit. Reverting ANY ONE of them surfaces as cryptic ENOENTs listing either literal backslashed paths OR forward-slash paths whose casing differs from disk. Upstream PR #22607 (merge `5f44c9fdb`) has reverted all four at once; `grep` for each and re-apply any that are missing.

**(a) On-disk rename of backslashed entries:**

```bash
grep -n "normalizeBackslashPaths" src/renderer/src/extensions/mod_management/InstallManager.ts
```

Expect three hits: import + two call sites (before each `buildFileList(tempPath)`). Sibling sentinel `src/renderer/src/extensions/mod_management/util/normalizeBackslashPaths.ts` must exist.

**(b) Merge case-duplicate sibling directories:**

```bash
grep -n "mergeCaseConflictingDirs" src/renderer/src/extensions/mod_management/InstallManager.ts
```

Expect three hits: import + two call sites (immediately after each `normalizeBackslashPaths(tempPath)`). Sibling sentinel `src/renderer/src/extensions/mod_management/util/mergeCaseConflictingDirs.ts` must exist.

**(c) Copy-instruction normalisation:**

```bash
grep -n 'replaceAll("\\\\\\\\", "/")' src/renderer/src/extensions/mod_management/InstallManager.ts
```

Expect two hits in the `extractArchive` copy loop (one for `source`, one for `destination`).

**(d) Case-insensitive src resolution in `extractArchive`:**

```bash
grep -n "resolvePathCase(tempPath" src/renderer/src/extensions/mod_management/InstallManager.ts
```

Expect one hit replacing `path.join(tempPath, source)` in the copy loop. Without this, installer override instructions (`vortex_override_instructions.json`) or FOMOD XML that hardcode one casing (`Data/...`) miss archive entries extracted at the opposite casing (`data/...`), even after the three previous fixes canonicalise the disk tree.

See the case-sensitive filesystem section for the cluster lesson — the four fixes address different layers (disk entry names, disk tree shape, instruction strings, runtime lookup) of the same root cause.

### 8. Proton launch logic in StarterInfo

```bash
grep -n "isPathPrefix\|shouldRunWithProton\|runToolWithProton" src/renderer/src/util/StarterInfo.ts
```

Expect three things:

- `isPathPrefix()` helper with path-boundary check (character after prefix must be `/` or `path.sep`). Without this, SKSE's Steam app (365720, `installdir: "skyrim"`) false-matches Skyrim SE's gamePath (`.../common/Skyrim Special Edition/...`) because bare `startsWith` doesn't enforce a boundary.
- `shouldRunWithProton()` that uses `isPathPrefix()` to find the matching game entry.
- `runToolWithProton()` call with hide-instead-of-quit behavior in `onSpawned`.

If upstream touches `StarterInfo.ts`'s tool-launch flow (which it does regularly), the Proton branch can silently disappear.

### 9. Steam library path resolution reads ALL roots

```bash
grep -n "findAllLinuxSteamPaths\|steamRoots" src/renderer/src/util/Steam.ts
```

`resolveSteamPaths()` must call `findAllLinuxSteamPaths()` and read `libraryfolders.vdf` from every Steam root (not just `basePath`). Without this, secondary libraries are missed when the detected `basePath` isn't the real installation (e.g. `~/.local/share/Steam` found before `~/.steam/debian-installation`).

### 10. Cross-compiled Linux native binaries

```bash
ls extensions/gamebryo-plugin-management/dist/{node-loot.node,libloot.so.0,libloot_wstring_stub.so}
ls extensions/gamebryo-bsa-support/dist/bsatk.node
```

These four files are **cross-compile artefacts** that shouldn't get rebuilt every run — `pnpm run build` for these extensions tries to relink native modules from source and fails on Linux because the build toolchain isn't set up for it. They've been around for months. If any of them disappear, check `dist/.gitignore` and the `dist` git-tracking state — we might need to un-ignore them explicitly, or document where they live.

**Workaround when `_native` fails:** run `copy-extension.mjs` directly to stage the pre-built `dist/` into `build/bundledPlugins/`:

```bash
cd extensions/gamebryo-plugin-management && pnpm exec node ../copy-extension.mjs
cd extensions/gamebryo-bsa-support && pnpm exec node ../copy-extension.mjs
```

> Build-time invariant — verified by AppImage/.deb CI, not `scripts/linux-smoke.sh`. Smoke runs on a fresh checkout before any build, so probing for `dist/*.node` would always skip; if a binary goes missing the failure surfaces loudly at `pnpm start` (dlopen error) or in the packaging job. The source-side risk lives in `scripts/manage-node-modules.js` and the extension `package.json` platform guards, both of which §1 already covers.

## §11 Deliberate test-runner divergences

Renderer uses Vitest exclusively. Upstream Jest scaffolding is dropped on every
sync. The following files MUST NOT exist on master:

- `src/renderer/jest.config.mjs`
- `src/renderer/src/__mocks__/` (directory)
- `src/renderer/src/__tests__/` (directory)
- `src/renderer/src/setupTests.js` (Jest+enzyme adapter — surfaced by Phase 25 Wave 1)
- `src/renderer/src/**/__mocks__/` (any nested `__mocks__/` directory under the renderer — surfaced by Phase 25 Wave 1; the original deny-list pattern only matched the flat path)
- Top-level `__tests__/` (Jest-era directory at repo root — surfaced by Phase 39/v2.0.2; orphan `__tests__/reducers.download_management.test.js` was dropped in `35bb18e67` after upstream relocated tests, both branches drifted on import paths, and the colocated vitest at `src/renderer/src/extensions/download_management/reducers/state.test.ts` covers the same surface)

Verification:

```bash
! test -f src/renderer/jest.config.mjs \
  && ! test -d src/renderer/src/__mocks__ \
  && ! test -d src/renderer/src/__tests__ \
  && ! test -f src/renderer/src/setupTests.js \
  && [ -z "$(find src/renderer/src -type d -name __mocks__ -print -quit 2>/dev/null)" ] \
  && ! test -d __tests__ \
  || { echo "Playbook §11 violation: Jest scaffolding present"; exit 1; }
```

Wider grep (mirrors the discovery-diff filter that future syncs use; checks the
working tree for any of the deny-list patterns surfacing again as fresh adds):

```bash
git grep -nE 'jest\.config\.mjs|src/renderer/src/__(mocks|tests)__|src/renderer/src/setupTests\.js|src/renderer/src/.*/__mocks__/|^__tests__/' \
  -- ':!VORTEX-LINUX-MERGE-PLAYBOOK.md' ':!.planning/' \
  || true
```

Rationale: fork migrated renderer to Vitest pre-v8.0; Jest config + `__mocks__/`
would shadow Vitest's `vi.mock` and produce silent test-runner ambiguity.
Phase 25 Wave 1 surfaced two paths that the original deny-list pattern missed:
top-level `setupTests.js` (enzyme + Jest adapter) and nested `__mocks__/`
directories like `src/renderer/src/util/__mocks__/log.ts` (uses
`jest.genMockFromModule`). The grep widening above catches both shapes.

Discovery-diff exclusion shape future syncs should use:

```bash
git diff --name-status <fork-branch> <upstream-parent-sha> \
  -- ':!src/renderer/src/__mocks__' \
     ':!src/renderer/src/__tests__' \
     ':!src/renderer/jest.config.mjs' \
     ':!src/renderer/src/setupTests.js' \
     ':!src/renderer/src/**/__mocks__'
```

Decided: Phase 25 (restore-dropped-scaffolding), 2026-05-15.

---

## §12 Path C forward-sync 3-way merge

When a long-lived feature branch's base SHA predates downstream work that already absorbed an upstream parent, `git rebase --rebase-merges` is the wrong tool — it halts with hundreds of conflicts at the central upstream-merge commit. The Phase 36 v8.1/config-bucket carry-forward hit this twice (rebase with 403-conflict halt at upstream-merge `aa3faf7e5`; surgical squash Stage A5 with the same mismatch) before settling on a forward-sync merge from `master` tip.

**Trigger condition.** "Branch base predates downstream work" anti-pattern. The feature branch was cut before `master` absorbed merge X; somewhere along the way `master` merged X. The feature branch never saw it. Memory `project_v8_1_base_mismatch.md` captures the v8.1 instance verbatim — `v8.1/config-bucket` branched from a commit pre-dating `v2.0.0-linux-rebased`, so the Phase 36 FF-to-master assumption never held.

**Symptoms.**

- `git rebase --rebase-merges <feature-branch>` halts with hundreds of conflicts at the central upstream-merge commit (the one whose 1st-parent ancestry differs between master and the feature branch).
- Surgical squash attempts ("just collapse the divergent range to a single commit and re-base") hit the same mismatch — the divergence is structural, not commit-shape.
- `git merge-base <feature-branch> master` returns a SHA that's NOT an ancestor of the upstream-merge commit on master.

**Diagnostic.**

```bash
git merge-base --is-ancestor <upstream-merge-1st-parent> master
echo $?   # 1 means the ancestry relationship is missing — Path C territory
```

**Resolution: 3-way merge.** From the `master` tip, `git merge --no-ff <feature-branch>`. Produces a merge commit with two parents — 1st parent = `master` tip, 2nd parent = feature-branch tip — and the post-divergence-resolution tree comes out byte-equivalent to what a clean rebase would have produced if the ancestry had matched. Both ancestries stay reachable; cherry-picking later uses `--no-merges` to filter (see §"Cherry-pick filter for forward-sync merges" below).

**Concrete example.** Phase 36 merge `c4d1b4555` — 1st parent `d494bcb7d` master, 2nd parent `f1425a5c8` v8.1/config-bucket. Two prior attempts failed (rebase 403-conflict halt at central upstream-merge `aa3faf7e5`; surgical squash Stage A5 same mismatch). The 3-way merge resolved the divergence cleanly with conflict count proportional to the actual cross-branch delta (not the inflated rebase view).

**Rollback-tag pattern (mandatory).** Before running the merge, snapshot both sides:

```bash
git tag phase{N}/master-pre-merge master
git tag phase{N}/pre-surgical-snapshot <feature-branch>
```

If anything goes sideways during conflict resolution, `git reset --hard phase{N}/master-pre-merge` puts master back where it was. The `pre-surgical-snapshot` tag preserves the feature-branch tip in case the merge is abandoned and the branch needs to be re-attempted from a different angle.

---

## §13 `fingerprints/dist` bundle ignored by oxfmt

```bash
grep -n "fingerprints/dist" .oxfmtrc.json
```

`.oxfmtrc.json` `ignorePatterns` must include `.github/actions/fingerprints/dist/**`. The fingerprints action bundle is upstream-Nexus-Mods-internal and gets regenerated by their CI on every release. Without this ignore, every routine sync trips oxfmt's `format:check` on lines we don't own and aren't going to format-check our way around. Added in `fe07ccee6` after v2.0.2 sync surfaced the breakage on PR #6.

Pair note: the workflows themselves (`.github/workflows/fingerprint-*.yml`) are disabled via the GitHub Actions API rather than YAML edits — see "Upstream `.github/workflows/fingerprint-*.yml`…" in the dist/CI gotchas section for that mechanism. Two layers, same upstream-only feature: workflow disable stops the runs; oxfmt ignore stops the format gate.

---

## What we've learned the hard way

These are the non-obvious things that cost real time during the 2026-05-08 merge, written down so they don't cost the same time twice.

### Upstream merges reverting our fixes is **the** biggest source of pain

Not a new bug, not a fresh regression — a straight revert of a fix we already landed, sometimes two or three merges ago. The fix → upstream revert → re-fix cycle has happened at least twice for the gamebryo `||` vs `&&` guard (commits `d8b60ab35`, `10d796278`, then re-reverted by upstream `0c49a66dc`, then re-fixed by `bafb67265` — which was itself wrong; see next lesson).

**What this means in practice:**

- Every after-merge session should start with the checklist above, not with "what broke?".
- Fork-local fixes should be named and structured to make reverts obvious in a diff, not buried inside inline `node -e "..."` one-liners that read identically either way.
- `git log -- <file>` is your first tool when a Linux-only thing stops working: the alternating `fix(linux): …` / `Update scripts` / `fix(linux): …` pattern is usually right there.

### The right fix for "extension skipped on Linux" is making the build work, not flipping guards

The original instinct was to flip skip-on-linux to skip-on-windows — that crashed CI because native deps weren't being built. The subsequent "fix" was to restore skip-on-linux — that hid the problem and left the extensions missing from packaged debs.

The actual fix (`ba23aee71`, `833f02db0`) was to make the extensions build on Linux by:

1. Making native copy scripts platform-aware (libloot.so.0 vs libloot.dll)
2. Adding explicit CI steps to fetch source and rebuild native addons that pnpm's isolation hides from @electron/rebuild

**Rule:** if an extension is needed on Linux, don't guard it out — make it build. Add CI rebuild steps for native addons that pnpm isolates. The pattern is: resolve → fetch source if needed → node-gyp rebuild with Electron headers.

### "Symptom at call site" is rarely the actual cause — always trace the import chain

Every real bug this session went something like:

- Symptom: `testPathTransfer` throws `UnsupportedOperatingSystem`.
- First "fix": remove the `if (platform !== "win32")` guard.
- New symptom: `winapi.GetVolumePathName is not a function`.
- Deeper cause: `winapi-bindings` externalised by `nodeExternals` before `resolve.alias` could redirect it to the shim.

Always follow the import chain to the bundle. `grep 'external ".*"' src/main/build/renderer.js` can tell you more than reading TypeScript sources when something "should be working".

### `winapi-bindings` on Linux is a shim, not a stub

Tempting to wrap every Windows-API call with `if (platform === 'win32')` guards. Don't. The shim in `src/renderer/src/util/winapi-shim.ts` has real Linux equivalents for the disk/path functions that matter (`GetDiskFreeSpaceEx`, `GetVolumePathName`, `GetNativeArch`). When removing a win32 guard, the question is "does this function only use shimmed APIs?" — not "does this mention winapi?". Most of the guards in the tree are more paranoid than they need to be.

### LOOT errors lie about ghost files

The Linux case-sensitivity bug surfaces as:

```
failed validation of input plugin paths: the file at "…/Data/dlccoast.esm.ghost" does not have a valid plugin header
```

The `.ghost` in that error is a **red herring** — LOOT probes `{name}` then `{name}.ghost` and spits out the last path it tried. The real issue is case. If you ever see this error on Linux, check the casing of the strings Vortex is handing LOOT before chasing anything ghost-related.

### pluginId (lowercase) ≠ filename (preserved case)

Vortex's internal `pluginId` is deliberately lowercased for case-insensitive identity. `pluginList[id].filePath` is the real on-disk path with preserved casing. Don't mix them up when handing strings to external tools that hit the filesystem. LOOT is one such tool; there are probably others.

### The renderer bundle lies about its input

`src/main/build/renderer.js` is webpack output. When debugging, confirm the **source** file you edited is actually the one that shaped the bundle by checking mtimes and re-running `pnpm -F @vortex/renderer run build`. The bundle caches aggressively and "source has the fix but bundle doesn't" is a common situation after git operations that touch source files (cherry-pick, stash-pop).

Quick check:

```bash
stat -c '%y %n' src/main/build/renderer.js src/renderer/src/util/<file>.ts
```

Source newer than bundle → rebuild.

### "Silent catch swallows error" + "state caches success" = stuck-forever state

Two-part hazard that's bitten us once and will again. The 2026-05-09 collection-install bug had both ingredients:

- **Silent swallow:** `extractArchive`'s `copyAsyncWrap` caught every `fs.copyAsync` error and threw away everything except two specific error strings. The outer flow resolved successfully even when zero files landed on disk.
- **Cached success:** The mod got recorded in Vortex state with `installationPath` set (i.e. "installed"), so `doDownload` short-circuited every future re-install at `dep.mod != null`. The broken state was self-perpetuating — every remedy the user tried (re-run collection, install mod directly, deploy again) hit the short-circuit and bypassed the code that would have healed it.

When writing any code that handles an irreversible side effect (extract, install, deploy, download), audit for both properties together: **can any error be silently swallowed?** AND **does a downstream system cache "done" based on state that could have been corrupted?** A "yes" on both is the shape of a bug class, not a specific bug. Add a loud-fail on the swallow path AND a integrity check before the downstream cache is trusted. One without the other only closes half the door.

### Merges can stack identical imports into a duplicate-identifier SyntaxError

After an upstream merge, `node --check` the top-level `.mjs` files (or run `pnpm install` end-to-end). A merge can concatenate identical imports from both sides into a duplicate-identifier SyntaxError that doesn't surface until runtime — `InstallAssets.mjs` post-merge `a918d52ef` carried two `import { glob } from "glob"` lines, fixed in `ff431e7c1`.

### Stray working-tree diffs will block cherry-picks

`etc/Dependency Report.md` and `packages/vortex-api/lib/api.d.ts` regenerate whenever the build runs and show up dirty in `git status`. They're out of scope for basically every Linux fix. Stash before `git checkout` / `git cherry-pick`, pop after:

```bash
git stash push -m "stray build churn" "etc/Dependency Report.md" packages/vortex-api/lib/api.d.ts
# … cherry-pick …
git stash pop
```

Doing this by reflex before any branch switch saved ~10 minutes of retries this session.

### Node version matters for `copy-extension.mjs`

The script uses `import.meta.dirname`, which needs Node ≥ 20. System `node` might be Node 18; `pnpm exec node` resolves to the Volta-pinned Node 22. Use `pnpm exec node ../copy-extension.mjs` when running it directly, not bare `node ../copy-extension.mjs`.

### Restart Vortex fully after every fix

Vortex caches extensions at startup. Editing source + rebuilding the renderer + re-running `copy-extension.mjs` has zero effect on a running instance. "My fix doesn't work" followed by "oh, did you restart?" getting a "no" happens at least once per session. Just restart.

### Stale notifications persist across runs

The bell alerts hang around across Vortex restarts — dismiss them manually after a fix, otherwise you're debugging a notification from two runs ago. "No deployment method available" on the page body is live; the same message in the bell might be stale. Check the log timestamp when in doubt.

### Bluebird Promise shadow — don't take upstream `:Promise<T>` annotations on async fns

In any file with `import Promise from "bluebird"` at the top, the `Promise` symbol is the bluebird Promise class — not the global. Async return-type annotations like `:Promise<void>` then resolve to the bluebird type, and TypeScript can't reconcile that with `async`'s required global Promise return — you get TS1064 "the return type of an async function or method must be the global Promise<T> type".

This bites every upstream merge: upstream's source has `:Promise<T>` on an async fn that they themselves added, but it compiles cleanly upstream because their type annotation matches their import shape, and we get the wider expression on the fork side via merge-driver. Going forward, scan each conflict file for the bluebird Promise import before accepting the upstream-side annotation. Either drop the annotation (TypeScript infers from `async`) or alias the bluebird import (`import { Promise as BluebirdPromise } from "bluebird"`) and only ever use the global `Promise` in type positions. Phase 27 hit this on at least four files; memory `feedback_bluebird_promise_trap.md` captures the rule.

### DEFERRED, not skipped — explicit deferral with Phase-N+1 acceptance text

When an acceptance gate can't physically run in its native phase (RC tag artefacts available, but the canonical tag they're supposed to validate doesn't exist yet), don't silently omit it. Mark **DEFERRED** in the evidence file with the acceptance text intact and an explicit Phase-N+1 cite for where it'll close. That keeps the chain of custody traceable — anyone reading the evidence trail later can see the gate, see why it didn't run in-phase, and see exactly where it ran instead.

Phase 29 SYNC-33-C (`.deb` install + desktop-entry launch on canonical artefacts) and SYNC-34 (4-screenshot Skyrim walkthrough on canonical AppImage) are the precedent — both deferred against the canonical tag's artefacts and closed in Phase 30 against the actual `v2.0.0-linux-rebased` build. As a bonus rule: real-usage evidence from the daily-driver's actual workflow beats a contrived walkthrough for daily-driver titles. The canonical AppImage running through a real Skyrim session is stronger evidence than a freshly-staged minimal repro.

### Force-with-lease over inline SSH URL needs an explicit lease pin

`git push --force-with-lease=<ref>:<verified-pre-push-sha> git@github.com:<user>/<repo>.git <local>:<remote>` is the only form that works when pushing via inline SSH URL. The implicit form (no value after `--force-with-lease`) compares against the remote-tracking branch — and an inline URL has no remote-tracking branch, so git defaults to "stale info" and rejects the push. The explicit lease pin tells git exactly what SHA to expect on the remote.

Verify the lease SHA via `git ls-remote git@github.com:<user>/<repo>.git refs/heads/<branch>` immediately before pushing. Drift between research-time and push-time SHAs is the single most common cause of force-with-lease failures — the upstream tip moved while you were preparing the push, and your stored lease points at a SHA that's now one commit back. Phases 28 + 29 + 30 all used this idiom uniformly; capturing the lease in a shell variable right before the push (`LIVE=$(git ls-remote ... | cut -f1)`) keeps the window between verification and push under a second.

### Lint deltas vs branch lineage

A negative lint count delta vs master means our branch has FEWER errors than master — that's not regression, that's the branch having less of something. Before treating any negative delta as a problem, check whether the missing errors are explained by branch-lineage (a file is absent on our side because v8.0 branched before master added it, not because we fixed it). If lineage explains it, **PASS** is the right call.

Restate: PASS condition for cross-branch lint comparison is **exit-0 + sane count comparison**, not zero-delta. A clean explanation for the count difference is part of "sane". Phase 29 SYNC-32 is the precedent — `downloader.test.ts` was −10 lint errors on v8.0 vs master because the file restoration came via master's Phase 25 SYNC-14 commit which post-dated the v8.0 branch point. We didn't fix anything; we just hadn't received the file yet. Same shape applies to TypeScript baseline drift, which is what made SYNC-32-D and SYNC-39 acceptable as documented deviations rather than blockers.

### Per-bucket typecheck gates — accept "5/6 buckets clean modulo deferred bucket N"

When aggregate `pnpm typecheck` exit-status is dominated by a single deferrable bucket, accept "5/6 buckets clean modulo deferred bucket N" as a pass shape with explicit Phase-N+1 close-out — rather than blocking the whole phase on the deferral. Phase 34's renderer-bucket carried 9 errors all in `extensions/download_management/`; Phase 35 Wave 1 closed them by dropping the dead `download_management/DownloadManager.ts` + `DownloadObserver.ts` files. Both phases shipped on-time because the gate was per-bucket, not aggregate.

Rule: per-bucket gates first, aggregate gate last, each bucket failure tied to a named scope. The named scope is what makes the deferral safe — anyone reading the gate output later can see exactly which bucket was deferred, why it was deferred, and which Phase-N+1 closed it. A bucket-anonymous deferral is a future archaeology problem.

### Cherry-pick filter for forward-sync merges — add `--no-merges`

After a Path C merge (see §12), cherry-picking the path-filtered Linux subset onto `linux-port` requires `--no-merges` to exclude the Wave 1 forward-sync merge AND any v8.x PR-merges in the 2nd-parent ancestry. Without `--no-merges`, the cherry candidates list inflates with merge commits whose payload is already represented by the underlying parents, and the loop wastes time on commits that produce empty cherries (or worse, duplicate the same payload).

Phase 36 numbers: 119 v8.1 PR-merges + Wave 1 forward-sync merge excluded by `--no-merges`; 407 candidates remained after `--no-merges` + `git cherry`/patch-id dedup. Of those: 52 clean cherries + 12 auto-resolved + 324 skipped (no-op or already on linux-port) + 2 fix-ups = 66 commits added to linux-port. Filter range: `merge-base(linux-port, master) = 538aef374..c4d1b4555`.

**Two cherry-induced fix-up patterns to recognise.**

(a) **Cherry-induced orphan.** A delete-cherry removes a file that a prior cherry preserved via `--ours`. Phase 36 hit this on `extensions/download_management/src/DownloadManager.ts` — a delete-cherry took out the file but a prior formatter cherry had already preserved its sibling `DownloadObserver.ts` via `--ours`, leaving `DownloadObserver.ts` referencing a deleted module. Fix: revert the delete-cherry, restore both files. Commit `31c8ad3e4` (master-only).

(b) **Cherry-induced dropped-hunk.** A cherry whose payload spans `pnpm-workspace.yaml` + `pnpm-lock.yaml` drops the lockfile hunks during the loop (often because the lockfile diff doesn't apply cleanly against an interim cherry-loop state). Symptom: `pnpm install` fails post-loop with version-mismatch errors against the workspace catalog. Fix: a manual workspace + lockfile bump in a follow-up commit. Phase 36's nexus-api 1.6.0 bump landed as commit `799ad300f` (master-only).

Both fix-up shapes ride atop the cherry-loop end SHA, both SSH-signed, both atomic — one file change per fix-up commit so the delta is obvious in `git log -p`.

---

## Past gotchas by subsystem

Each entry is a real bug we hit at least once — written down so the next merge that breaks the same thing is recognisable on sight. Sourced from the ~85-commit Linux-port history; every item has a commit ref for the full story.

### asar packaging

- **Native addons inside `app.asar` silently return `[]` from `readdirSync`.** `leveldown`'s `node-gyp-build` can't find prebuilds, `modmeta-db` silently exports `ModDB=undefined`, `connectMetaDB` crashes at runtime. Fix: add the whole chain (`modmeta-db`, `leveldown`, `levelup`, `encoding-down`) to `asarUnpack`. But `asarUnpack` globs only match packages that actually exist in `dist/node_modules/` — peerDeps of `modmeta-db` have to be promoted to direct deps of `@vortex/main` first, otherwise `pnpm install --dir=./dist` never installs them and the globs match nothing. Commits `538aef374`, `d7281c06c`.
- **bundledPlugins extensions can't `require()` into `app.asar`.** They run from `app.asar.unpacked/bundledPlugins/` and resolution only walks up to `app.asar.unpacked/node_modules/`. If a dep is inside the asar, the extension fails to load (`Cannot find module modmeta-db` in `mo-import` / `nmm-import-tool`). Same fix as above — unpack.
- **Adding something to `asarUnpack` that's already a direct dep causes `EEXIST` hardlink errors** in electron-builder (e.g. `bluebird`, picked up once by the direct-dep scan, again by `asarUnpack`). Workaround: `beforePack` hook copies `bluebird` into `dist/node_modules/modmeta-db/node_modules/bluebird/`, which rides along under the existing `modmeta-db/**` glob. Commit `90b8de750`.
- **`winapi-bindings` as a transitive native dep causes EEXIST on Linux packaging.** Pulled in by `exe-version`, `permissions`, `turbowalk`, `wholocks`, `vortex-parse-ini`. The Linux shim replaces the JS at build time, but the `.node` binary still ships unless we explicitly exclude it. Fix: `electron-builder.config.cjs` with a platform-conditional `files` array — `!**/winapi-bindings/**` on Linux. Commit `0ccaff0ed`.

### packages/paths exports missing — check master before reaching for new code

- **Aggregate typecheck surfaces a wave of "exports missing" errors from `@vortex/paths` (e.g. `pathLengthBucketRoot`, `BucketKey`, `getBucketKeyForPath`).** First instinct is to re-implement the missing exports against whatever the calling sites expect — that's wrong. The likely cause is the upstream feature branch dropped `packages/paths/src/` and `packages/paths-node/src/` inadvertently, while master still has them. Restore from master rather than re-implementing:
    ```bash
    git checkout master -- packages/paths/src/ packages/paths-node/src/
    ```
    Phase 35 Wave 2 cut the typecheck count 130 → 0 with this single restore. Commit `52ea1941b`. Rule: when the symptom is "exports missing" against a packages/\* export, check `git log master -- packages/<name>/src/` before reaching for a re-implementation — the file probably exists on master and the feature branch dropped it.

### native addon loading (loot, esptk, bsatk)

- **Static top-level `require('esptk')` can take down the whole extension.** If `esptk.node` fails to dlopen (wrong arch, missing deps), the whole `gamebryo-plugin-management` extension fails to register and the Plugins tab silently disappears. Fix: lazy-load via `require()` inside the functions that actually need it, with graceful degradation. Commit `c219b460b`.
- **`LD_LIBRARY_PATH` is not inherited by `fork()` by default** — Node forks clear path-adjacent env vars. `node-loot.node` has `RUNPATH $ORIGIN/../../loot_api` which is correct in the source tree but broken in the packaged deb/AppImage where `libloot.so.0` sits inside `bundledPlugins/gamebryo-plugin-management/`. Need both fixes: prepend `bundledPlugins/gamebryo-plugin-management` to `LD_LIBRARY_PATH` in `main.ts` at app startup (commit `3a6488b9b`), AND pass `LD_LIBRARY_PATH` explicitly in the loot subprocess `fork()` env block (commit `0875e3db2`).
- **loot's binding.gyp uses `-l../loot_api/libloot`, which `ld` can't resolve.** On Linux needs `-L../loot_api -llibloot` + RPATH. The patch lives in `patches/loot@6.2.1.patch`; a well-meaning rewrite of the patch to only carry IPC guards once dropped the binding.gyp hunk. Commit `6cc8cbf2a`. Rule: **never rewrite a patch file wholesale — additive hunks only.**
- **loot/bsatk `prebuild-install || node-gyp rebuild` fallback is easy to break.** A "helpful" `execSync` rewrite that throws on first failure strips the `|| node-gyp rebuild` fallback, so Windows CI fails because prebuild-install has no binaries for its napi version. Always keep the `||` fallback in the shell string and let `execSync` inspect the final exit code. Commits `ffe331d98`, `e49a4a5cd`.
- **loot's index.js / async.js hard-coded `\\?\pipe\loot-ipc-*`** (Windows named-pipe path) causes `EACCES` on Linux startup. Patched in `patches/loot@6.2.1.patch`. Commit `8fd69eab9`.

### case-sensitive filesystem (ext4 without casefold)

- **Game extension `requiredFiles` casing ≠ on-disk exe casing.** `verifyToolDir` stats the declared name (e.g. `oblivion.exe`) and fails with ENOENT when the disk has `Oblivion.exe`, which clears the active profile and dumps the UI back to the home screen. Fix: `resolvePathCase` before stat-ing. Applies to all games. Commit `e2c8ee6a8`.
- **`resolvePathCase` has to resolve every segment, including the filename.** The early version only case-resolved directories, so `removeDeployedFile` with a mismatched filename case would still `unlinkAsync` an ENOENT path (silently swallowed), leaving the file deployed. Extended to match every segment against parent `readdir`. Commit `bbf7c8f39`.
- **Windows archive extraction produces case-conflicting directory trees on Linux.** `7z` extracts entries literally, so a mod archive with mixed `Data/SKSE/plugins/` and `data/SKSE/plugins/` entries creates two separate directories. Fix: run `mergeCaseConflictingDirs()` right after `normalizeBackslashPaths()` in both extraction flows. Original commit `850a3cb40`; **reverted by upstream PR #22607 (merge `5f44c9fdb`)** as part of the same batch that took out `normalizeBackslashPaths` and `ca8e99941`. Re-applied as its own helper at `src/renderer/src/extensions/mod_management/util/mergeCaseConflictingDirs.ts`. This fix is part of the **three-fix backslash/case cluster** — all three must travel together or installs fail with cryptic ENOENTs (the current error will list either literal backslashed paths OR forward-slash paths whose casing differs from disk, depending on which of the three is missing). See commit index.
- **Filenames with backslashes in archives become filenames, not paths.** Windows-packaged archives using `\` as separator land as single filenames `Data\SKSE\plugins\foo.dll` on ext4. Normalise before building the file list. Original commit `728c91a85`; **reverted by upstream PR #22607 (merge `5f44c9fdb`)** and re-applied as its own helper at `src/renderer/src/extensions/mod_management/util/normalizeBackslashPaths.ts` (easier to spot in a diff next time). Two call sites before each `buildFileList(tempPath)` in `InstallManager.ts`. Re-apply commit: see commit index below.
- **The on-disk rename isn't enough — copy instructions still carry `\`.** `normalizeBackslashPaths` fixes the filesystem, but FOMOD XML or archive listings can still hand the installer `copy` instructions with Windows-style `\` in `source` / `destination` fields. Those get `path.join`'d verbatim in `extractArchive`, miss the normalised on-disk tree, and surface as the "Invalid installer" dialog listing literal backslashed paths. Fix: `replaceAll("\\", "/")` on both `source` and `destination` at the top of the copy loop; the `endsWith` directory check then only needs to test `/`. Original commit `ca8e99941`; **reverted by the same upstream merge as `normalizeBackslashPaths`**. Re-apply commit: see commit index below. Lesson: backslash normalisation is a paired invariant — disk layout AND instruction strings. Reverting one and leaving the other produces cryptic failures downstream.
- **`extractArchive` joins paths case-sensitively.** `path.join(tempPath, source)` fails if installer instructions (FOMOD XML or `vortex_override_instructions.json` from the archive) say `Data/skse/plugins/Foo.dll` but the archive contents are `data/skse/plugins/Foo.dll`. `mergeCaseConflictingDirs` may also have canonicalised to the opposite case. Use `resolvePathCase(tempPath, source, caseCache)` with a per-call `readdir` cache. Original commit `cbff6b891`; **reverted by the same upstream merge (PR #22607 / `5f44c9fdb`)** that took out the other three backslash/case fixes. This is actually a **four-fix cluster** — normalizeBackslashPaths + mergeCaseConflictingDirs + copy-instruction replaceAll + extractArchive resolvePathCase — all reverted together, all required together. The Engine Fixes mod ships a `vortex_override_instructions.json` with `Data\\...` paths while its archive entries are `data/...`; without this fourth fix the override-instruction flow surfaces as "Invalid installer" with forward-slash uppercase paths that miss lowercase disk contents.
- **`externalChanges` didn't case-resolve manifest paths.** Deploy manifests record the staging folder's casing (`SKSE/Plugins/...`) but files land on disk with whatever casing the game `Data/` tree already had (`skse/plugins/...`). `deployFile` already used `resolvePathCase` to find the target directory when creating hardlinks; `externalChanges` didn't, so `lstat` hit ENOENT on every manifest entry, flagged everything `destDeleted`, and popped the "External Changes" dialog on every deploy. Downstream symptom: the redundancy check saw zero deployed files from the affected mods and fired "Some mods are redundant" for every SKSE-plugin mod. Fix: `resolvePathCase` in `externalChanges` before `statLink`, with a per-call readdir cache (same pattern as FOMOD `extractArchive`). Commit `140a57217`.
- **Stale empty staging dirs persist across install attempts.** A partially-broken extract (e.g. the FOMOD execute-bit bug fixed in `053a30424`, or any silent `copyAsync` failure in `extractArchive`) leaves the mod's staging folder with parent directories only — no files — while Vortex state still records the mod as installed. `doDownload` then short-circuits re-install for every subsequent attempt because `dep.mod != null`, so the broken state perpetuates forever and the "Redundant mods" dialog keeps flagging affected mods at every deploy. The first-order cause (silent copy swallowing) was sibling to the case-mismatch bug above but orthogonal — fixing `externalChanges` didn't heal mods that already had zero files in staging. Two-part fix: (a) `extractArchive` throws `ArchiveBrokenError` when every intended copy/link failed (partial failures still resolve via existing notification path); (b) `doDownload` runs `stagingDirHasFiles` before the `dep.mod != null` short-circuit and clears `dep.mod` when the dir is empty, forcing the normal `queueInstallation` path to re-extract. Helper lives at `src/renderer/src/extensions/mod_management/util/stagingIntegrity.ts`. Commit `7e2c40e94` (master) / `be30e0c05` (linux-port).
- **LOOT is the cautionary tale.** See the lesson above — `toLowerCase()` on plugin names + ext4 + LOOT's ghost probe = the misleading `dlccoast.esm.ghost` error. Commit `324da1814`.

### Proton game launching & Snap Steam IPC

- **Path-prefix matching without boundary check causes false game-entry matches.** SKSE's Steam app (365720) has `installdir: "skyrim"`, producing gamePath `.../common/skyrim`. Case-insensitive `startsWith` matches `.../common/Skyrim Special Edition/skse64_loader.exe` — wrong game entry. Fix: `isPathPrefix()` that checks the character at `prefix.length` is a path separator or end-of-string. Commit `096b6376c`.
- **Snap-installed Steam isolates IPC from the host filesystem.** Direct Proton invocation needs `steam.pipe` and `steamclient.so` to communicate with the running Steam instance. Snap confines these to `~/snap/steam/common/.steam/`. Symptom: `SteamAPI_Init() failed` / `SteamAPI_IsSteamRunning() did not locate running Steam`. Fix: `ensureSteamSymlinks()` in `steamPaths.ts` auto-creates `~/.steam/{steam.pipe, steam.pid, steam, root, sdk64/steamclient.so, sdk32/steamclient.so}` pointing into the snap/flatpak control directory. Called from `findLinuxSteamPath()`. Commit `096b6376c`.
- **Proton needs `SteamAppId`/`SteamGameId` env vars for Steamworks initialization.** Without these, even with IPC accessible, the game can't identify itself to Steam. `buildProtonEnvironment()` must accept an optional `appId` and set both env vars. Commit `096b6376c`.
- **Vortex quitting kills Proton's process tree.** When `onStart === "close"`, Vortex called `getApplication().quit()` which terminated the spawned Proton process. For Proton launches, hide the window instead — Proton needs time to bootstrap Wine and start the game. Commit `096b6376c`.
- **Proton config name → folder mapping is non-trivial.** Steam's `config.vdf` uses names like `proton_experimental` but the install folder is `Proton - Experimental`. `resolveProtonPath()` handles this with: (1) exact match in `compatibilitytools.d/` (custom Proton like GE-Proton), (2) exact match in `steamapps/common/`, (3) fuzzy keyword match scanning `Proton*` folders. No hardcoded mapping table — self-maintaining. Commit `096b6376c`.
- **Global Proton default lives at config key `"0"`.** `getConfiguredProtonName()` must fall back to `mapping?.["0"]?.name` when no per-game entry exists. Without this fallback, games using the Steam-wide default Proton get `undefined` protonPath. Commit `096b6376c`.
- **`/usr/games/steam` is the steam-installer package, not the real Steam.** On Ubuntu with snap Steam, `/usr/games/steam` triggers a "Steam is not installed" dialog. The real binary is `/snap/bin/steam`. Always resolve the actual Steam binary from the discovered Steam path, not from PATH lookup.

### deployment manifests

- **Wine/Proton-era manifests have Windows-style paths.** `loadActivation` has to detect them (`isWineEraManifest()`), offer a purge dialog, and normalise backslashes before the instance-mismatch check otherwise runs. Commit `6f47dbf2b`.
- **Primary manifest can be missing when the backup's there.** Wine/Proton-era Vortex only wrote to the staging backup, never the game Data dir. If primary fails with ENOENT, fall through to backup2 (msgpack) and backup (JSON) before returning `emptyManifest`. Otherwise Wine-era detection in `loadActivation` never fires. Commit `7e4034b77`.
- **Synthesise a manifest when `loadActivation` returns `[]`.** Walk each mod's staging directory with `turbowalk` and confirm hardlinks into the game directory via inode comparison. Use the synthesised manifest as `lastActivation` so `deactivate()/finalize()` can diff and unlink properly. Commit `0748357d6`.
- **`deployMods` crashes with no mods installed.** Add a `?? {}` guard on the mods access. Trivial but real crash on a fresh Linux profile. Commit `7e4034b77`.

### NXM protocol & single-instance

- **`getVortexPath("package")` in dev returns `src/main/out/`, not `src/main/`.** Electron 37+ sets `app.getAppPath()` to the output directory. The second-instance lock uses this path; `src/main/out/` has no `package.json`, so the second Electron uses app name "Electron" with a different userData lock. The single-instance conflict never fires, the second-instance event never runs, and NXM downloads from the browser don't route. Fix: `path.dirname(getVortexPath("package"))` to walk up to `src/main/`. Commit `f2f6e06d6`.
- **Disabled guard that outlived its reason.** A `disabled={process.platform === 'linux'}` on the NXM Toggle hung around long after `xdg-settings`/`xdg-mime` support shipped. Check guards against what the code can actually do now, not what it used to. Commit `809d4b80a`.

### game discovery / game stores

- **`EpicGamesLauncher` exports `undefined` on Linux** (Windows-only). Any code that drops it into a `mKnownGameStores: [Steam, EpicGamesLauncher, ...]` array crashes `manualGameStoreSelection` with "Cannot read properties of undefined (reading 'id')". Filter undefined stores. Commit `04f5c9bf5`.
- **Game extensions calling `epicGamesLauncher.findByAppId()` unconditionally crash on Linux.** Epic Games Launcher is Windows-only. Guard with `process.platform !== 'win32'` early reject so discovery bails out cleanly with `ProcessCanceled`. Commit `ddaed178e` (game-untitledgoose).
- **Bundled game extensions `require('winapi-bindings')` at runtime** — bypasses the webpack compile-time alias to `winapi-shim.ts`, so `winapi.RegGetValue` ends up undefined. Fix: intercept `winapi-bindings` in `extensionRequire` on Linux and hand back the shim directly. Commit `ddaed178e` (survivingmars, modtype-gedosato).

### dist / CI config

- **VSCode passes `ELECTRON_RUN_AS_NODE=1` down to child shells.** Launching Vortex from VSCode's terminal runs the Electron binary as plain Node, `require('electron')` returns a string path instead of the API, and it crashes straight away. Fix: `ELECTRON_RUN_AS_NODE=` in the `start` script. Also guard `electron-context-menu` (loads at module import time, also calls `require('electron')`). Commit `e69ee23b5`.
- **`electron-builder` `neverBuiltDependencies` isn't enough to stop transitive native builds.** `winapi-bindings` still gets compiled as a transitive. Also add it to `pnpm-workspace.yaml`'s `neverBuiltDependencies` in `dist/`, AND use `electron-builder.config.cjs` with a `!**/winapi-bindings/**` files exclusion. Belt and braces. Commits `c0c4bf2a8`, `0ccaff0ed`.
- **`prepare-dist-package` catalog regex stops at blank lines.** `pnpm-workspace.yaml` has a blank line mid-catalog; a naive `((?:[ \t]+\S.*\n?)*)` drops everything after it from `dist/pnpm-workspace.yaml`, causing `ERR_PNPM_CATALOG_ENTRY_NOT_FOUND_FOR_SPEC` for deps listed after the blank line. Fix: allow indented-with-content or pure-whitespace lines, only stop on the next top-level key. Commit `f66a99962`.
- **Upstream `.github/workflows/fingerprint-*.yml` use `runs-on: [self-hosted]` targeting a Nexus-Mods-internal runner.** Forks have no such runner, so every tag push queues a `Fingerprints - Mark as released` job that sits pending until GitHub's 72-hour timeout kills it. Same story for `Fingerprints - Mark as fixed` on every merged PR and `Fingerprints - Manually resolve` on `workflow_dispatch`. Harmless (no effect on Release Linux or user-visible builds), but noisy in the Actions tab. Attempted fix #1: gate each `sync` job with `if: github.repository == 'Nexus-Mods/Vortex'` (commit `7fd37ff71`). Didn't work — GitHub queues the workflow waiting for a runner at `runs-on: [self-hosted]` BEFORE evaluating the job-level `if`. Attempted fix #2: conditional `runs-on: ${{ github.repository == 'Nexus-Mods/Vortex' && 'self-hosted' || 'ubuntu-latest' }}`. Also didn't work — runs still sat pending, suggesting GitHub's expression evaluation for `runs-on` doesn't fall back to `ubuntu-latest` the way you'd expect, or some other quirk. **What actually works: disable the three workflows via the GitHub API.** Run `gh api --method PUT "repos/<owner>/Vortex/actions/workflows/<id>/disable"` for each of the three workflow IDs (retrievable via `gh api "repos/<owner>/Vortex/actions/workflows"`). This is a per-fork setting persisted in GitHub's workflow state, not in the workflow YAML, so it survives upstream merges cleanly — but it also won't travel with the repo on a re-clone or to a new fork, so document it here as a step to re-run. Upstream workflow files stay untouched (no risk of breaking upstream CI). Re-enable via `gh api --method PUT "...actions/workflows/<id>/enable"` if needed. Workflow IDs for `atabisz/Vortex` as of 2026-05-09: `269710415` (fixed), `269710416` (released), `269710417` (resolve) — but these are fork-specific, always re-query.
- **pnpm 10's bundled `gyp_main.py` occasionally lands without an execute bit on GH runners.** Symptom: `font-scanner install: /bin/sh: 1: .../pnpm@10.x/.../node-gyp/gyp/gyp_main.py: Permission denied` during `pnpm install`, Makefile regeneration exits 126, kills the whole install step. Flaky — same workflow, same source, one runner hits it and the next doesn't. Fix: a `Fix pnpm-bundled node-gyp script permissions` step between the pnpm/Node setup and `pnpm install` that runs an idempotent `chmod +x` on the found path. Present in both `.github/workflows/main.yml` and `.github/workflows/release-linux.yml`. If an upstream workflow rewrite drops it, flaky installs come back immediately. Commit `f0a0d2178`.
- **`src/main/package.json` packaging scripts and `electron-builder.config.cjs` must both point at the same app directory as `prepare-dist-package.mjs`.** When upstream renamed the packaged app directory from `dist` → `build`, the `package` / `package:nosign` scripts (`pnpm install --dir=./build`) and the config file (`directories.app: './build'`, plus both `path.join(__dirname, 'build', …)` references in the `beforePack` hook) all had to move together. A merge that updates only some of them fails CI with `ENOENT: no such file or directory, lstat '/.../src/main/dist'`. Commit `4d1ea811b`.

### platform-guard operator direction

Platform guards in `package.json` scripts come in TWO forms — and they use OPPOSITE shell operators. Don't assume one pattern fits both:

| Guard intent                     | Predicate            | Correct operator                                                          |
| -------------------------------- | -------------------- | ------------------------------------------------------------------------- |
| Skip on Windows, build elsewhere | `exit(1)` if `win32` | `&&` (Windows exits 1, `&&` short-circuits; Linux exits 0, continues)     |
| Skip on Linux, build elsewhere   | `exit(0)` if `linux` | `\|\|` (Linux exits 0, `\|\|` short-circuits; Windows exits 1, continues) |

Both forms now have named-script equivalents: `skip-on-windows.mjs` (`&&`, `exit(1)` on Windows) and `skip-on-linux.mjs` (`||`, `exit(0)` on Linux). The operator follows the exit code which follows the skipped platform — the filename is the source of truth. The checklist now uses `grep "node -e.*process.platform"` (platform-agnostic) to catch inline guards in either direction. Commits `77fdabb67` (flip to `||` for savegame), `e8f05bedb`, `d8b60ab35`.

---

## Commit index

Durable references to the fork-local Linux fixes this file depends on. If any of these commits are missing from either branch after a merge, something got reverted.

| Fix                                                                                                           | master                                   | linux-port       |
| ------------------------------------------------------------------------------------------------------------- | ---------------------------------------- | ---------------- |
| ~~Three gamebryo extensions use `skip-on-linux.mjs`~~ — **superseded** by native CI rebuild                   | `c408173b9`                              | _SYNC-39 v8.1_   |
| Remove skip-on-linux from gamebryo-plugin-management + platform-aware native copy                             | `ba23aee71`                              | _SYNC-39 v8.1_   |
| Remove skip-on-linux from bsa-support + archive-support; CI rebuilds bsatk                                    | `833f02db0`                              | _SYNC-39 v8.1_   |
| Remove win32 guard from `testPathTransfer`                                                                    | `7cfe61602`                              | `8e8b13284`      |
| Allowlist `winapi-bindings` from `nodeExternals`                                                              | `e69401abf`                              | `0cccf116b`      |
| Pass real plugin filenames to LOOT + filter ghosts                                                            | `324da1814`                              | `72641450c`      |
| `resolvePathCase` in `externalChanges` (stops spurious "mods are redundant")                                  | `140a57217`                              | _SYNC-39 v8.1_   |
| Heal stale empty staging dirs across install attempts                                                         | `7e2c40e94`                              | `be30e0c05`      |
| Named `skip-on-linux.mjs` sibling guard (gamestore-xbox)                                                      | `5acb3d098`                              | `a41403030`      |
| `src/main` packaging points at `build/` (not `dist/`) after upstream rename                                   | `4d1ea811b`                              | _master-only_    |
| `chmod +x` pnpm-bundled `gyp_main.py` before `pnpm install` in CI                                             | `f0a0d2178`                              | _master-only_    |
| Gate `fingerprint-*.yml` workflows to `Nexus-Mods/Vortex` repo only                                           | `7fd37ff71`                              | _master-only_    |
| Direct Proton launch + Snap IPC symlinks + path-boundary matching                                             | `096b6376c`                              | _SYNC-39 v8.1_   |
| Phase 25 / SYNC-13: restore `packages/paths` + `packages/paths-node` from upstream v2.0.0                     | `f9d305d7d`                              | _master-only_    |
| Phase 25 / SYNC-12: restore `gamebryo-ba2-support` + ba2tk catalog + CI rebuild step                          | `b28d37e31`                              | _master-only_    |
| Phase 25 / SYNC-14: restore chunking + download_management spine + bsdiff-node test                           | `9a17907b6`                              | _master-only_    |
| Phase 25 / SYNC-15 + SYNC-16: restore four upstream CI workflows (deny-list provenance in body — see §11)     | `83995b611`                              | _master-only_    |
| Phase 25 / SYNC-15 + SYNC-16: restore docs (flatpak + AGENTS-DEBUGGING + structure) + add Playbook §11        | `83995b611`                              | _master-only_    |
| **Phase 30 (v2.0.0-linux-rebased) milestone closure** — FF-merge PR #4 + canonical tag + linux-port catch-up  | `f570149ea` (tag `v2.0.0-linux-rebased`) | `6a28945d1`      |
| Phase 35 Wave 2: restore `packages/paths{,-node}/src/` from master (typecheck 130 → 0)                        | `52ea1941b`                              | _master-only_    |
| Phase 36 Path C forward-sync 3-way merge (1st parent `d494bcb7d` master / 2nd parent `f1425a5c8`)             | `c4d1b4555`                              | _via 2nd-parent_ |
| Phase 36 Wave 5 fix-up: revert orphan delete-cherry (DownloadManager.ts restore)                              | `31c8ad3e4`                              | _master-only_    |
| Phase 36 Wave 5 fix-up: bump @nexusmods/nexus-api 1.6.0 (cherry-dropped lockfile hunks)                       | `799ad300f`                              | _master-only_    |
| **Phase 37 (v2.0.1-linux-rebased) milestone closure** — Path C merge + canonical tag + cherry-pick            | `c4d1b4555` (tag `v2.0.1-linux-rebased`) | `799ad300f`      |
| Phase 38 (v8.2) — config bucket (workspace + lockfile + root configs parse, pnpm-lock regen)                  | `84c3310a4`                              | _master-only_    |
| Phase 38–43 (v8.2) — thin-patch series resolving ~108 source files / ~234 regions on `sync/upstream-v2.0.2`   | PR #6 head `fe07ccee6`                   | _master-only_    |
| Phase 39–43 (v8.2) — drop orphan `__tests__/reducers.download_management.test.js` (Jest-era, post-relocation) | `35bb18e67`                              | _master-only_    |
| Phase 39–43 (v8.2) — fix-up: `rolldown.base.mjs` alias param restored after smaller-diff drop (see §2.5)      | `8519f6d29`                              | _master-only_    |
| Phase 39–43 (v8.2) — fix-up: `gamebryo-ba2-support` skip-on-windows guard removed (see §1)                    | `3452f94f1`                              | _master-only_    |
| Phase 39–43 (v8.2) — fix-up: `InstallAssets.mjs` duplicate `import { glob } from "glob"` (see merge-stack)    | `ff431e7c1`                              | _master-only_    |
| Phase 39–43 (v8.2) — fix-up: `.oxfmtrc.json` ignore `fingerprints/dist/**` (see §13)                          | `fe07ccee6`                              | _master-only_    |
| **v8.2 milestone closure** — merge `c4bd2afb7` of `sync/upstream-v2.0.2` + tag `v2.0.2-linux-rebased`         | `c4bd2afb7` (tag `ec12890c3`)            | _deferred_       |

Phase 36 cherry-pick filter range: `merge-base(linux-port, master) = 538aef374..c4d1b4555` with `--no-merges` + patch-id dedup → 407 candidates → 52 clean + 12 auto-resolved + 324 skipped + 2 fix-ups = 66 commits added to linux-port.

The `_SYNC-39 v8.1_` rows above are commits that exist on master but not on linux-port. They pre-date the Phase 30 cherry-pick range (`db8035192..f570149ea`) so the `--ours` cherry-pick policy couldn't carry them. Tracked as SYNC-39 — linux-port catch-up scoped for the v8.1 milestone, not Phase 30.

Earlier-era fixes that were reverted by upstream merges (kept for archaeology):

- `d8b60ab35` — first `||` → `&&` flip on gamebryo guards (wrong direction, see lesson above)
- `10d796278` — second `||` → `&&` flip after first revert (also wrong direction)
- `bafb67265` — third `||` → `&&` flip wrapped in `skip-on-windows.mjs` (still wrong; reverted by the fix above)
- `eb512442c` — restored Linux `libloot.so.0` + `wstring_stub.so` copy step in `_native`
