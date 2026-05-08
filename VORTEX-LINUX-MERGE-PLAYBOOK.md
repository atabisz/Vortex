# Vortex Linux — Upstream Merge Playbook

Companion to [VORTEX-LINUX.md](VORTEX-LINUX.md). VORTEX-LINUX.md is the strategic forward plan; this file is the tactical playbook for keeping the fork working after every upstream merge.

Every entry here is a hard-won lesson from a real incident — not speculation. If something lands in this file, it has already bitten.

---

## Why this file exists

The upstream `nexus-mods/Vortex` repo ships frequent changes to build scripts, webpack configuration, and extension scaffolding. Many of these changes target Windows-only concerns (CI guards, native addon links, asar layout) and inadvertently undo our Linux compatibility work. The reverts are usually **silent** — the build still succeeds on CI, tests still pass, and the regression only surfaces at runtime on Linux (often several interactions deep, e.g. "staging folder won't change" caused by "webpack alias preempted by `nodeExternals`" caused by "upstream re-ordered `externals` in the config").

The playbook below is the checklist we run after every upstream merge and the principles we apply when Linux support regresses.

---

## Post-merge checklist

Run these **before** finalising any merge commit.

### 1. Platform guards on gamebryo extension build scripts

```bash
grep -l "node -e.*process.platform.*win32" extensions/gamebryo-*/package.json
```

If anything matches, upstream reintroduced the inline guard. Replace each hit with the named-script form:

```json
"build": "node ../skip-on-windows.mjs && (pnpm run _build && node ../copy-extension.mjs)"
```

Watched files:
- `extensions/gamebryo-plugin-management/package.json`
- `extensions/gamebryo-bsa-support/package.json` *(has both `build` and `dist`)*
- `extensions/gamebryo-archive-support/package.json`

Sentinel: `extensions/skip-on-windows.mjs` must exist and be referenced by each of the three package.jsons above.

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

Without this, the `resolve.alias` redirect to `winapi-shim.ts` is silently preempted by `nodeExternals`, and `winapi.GetVolumePathName is not a function` surfaces only when a user changes the mod staging folder.

### 3. LOOT call-site casing

```bash
grep -n "toLowerCase\|\\.filePath" extensions/gamebryo-plugin-management/src/autosort.ts | head -20
```

All LOOT calls (`loadPluginsAsync`, `getPluginMetadataAsync`, `getPluginAsync`, `sortPluginsAsync`) must use `path.basename(pluginList[id].filePath)` — the real on-disk filename — not `pluginName.toLowerCase()`. On ext4 without casefold, lowercased names don't match real filenames like `DLCCoast.esm`, and LOOT falls back to probing the `.ghost` variant, producing the misleading `"… does not have a valid plugin header"` error that names a `.ghost` path the file never had on disk.

### 4. Transfer-path platform guard

```bash
grep -n "UnsupportedOperatingSystem\|platform !== \"win32\"" src/renderer/src/util/transferPath.ts
```

`testPathTransfer` must not reject non-Windows. `winapi.GetVolumePathName` is shimmed on Linux; `statfsSync` is POSIX; `turbowalk` has a Linux JS fallback. If the guard is back, users can't change their mod staging folder (symptom: "Unsupported operating system" alert + staging-folder change silently fails).

### 5. Bundled plugins populated

```bash
ls src/main/build/bundledPlugins | wc -l   # expect ~132
```

If this is 0, upstream renamed the output path (`out` → `build` or vice versa) and the extension `copy-extension.mjs` step wasn't re-run against the new path. Re-run:

```bash
pnpm run build:extensions
```

### 6. Cross-compiled Linux native binaries

```bash
ls extensions/gamebryo-plugin-management/dist/{node-loot.node,libloot.so.0,libloot_wstring_stub.so}
ls extensions/gamebryo-bsa-support/dist/bsatk.node
```

These four files are **cross-compile artefacts** that shouldn't be rebuilt on every run — `pnpm run build` for these extensions tries to relink native modules from source and fails on Linux because the build toolchain isn't configured for it. They predate this session by months. If any of these disappear, check the `dist/.gitignore` and `dist` git-tracking state — we may need to un-ignore them explicitly, or document where they live.

**Workaround when `_native` fails:** run `copy-extension.mjs` directly to stage the existing pre-built `dist/` into `build/bundledPlugins/`:

```bash
cd extensions/gamebryo-plugin-management && pnpm exec node ../copy-extension.mjs
cd extensions/gamebryo-bsa-support && pnpm exec node ../copy-extension.mjs
```

---

## Principles earned

These are the non-obvious things that cost real time during the 2026-05-08 merge, captured so they don't cost the same time again.

### Upstream merges reverting our fixes is **the** dominant failure mode

Not a new bug, not a fresh regression — a direct revert of a fix we already landed, sometimes two or three merges ago. The fix → upstream revert → re-fix cycle has happened at least twice for the gamebryo `||` vs `&&` guard (commits `d8b60ab35`, `10d796278`, then re-reverted by upstream `0c49a66dc`, then re-fixed by `bafb67265`).

**Practical consequences:**
- Every after-merge session should start with the checklist above, not with "what broke?".
- Fork-local fixes should be named/structured to make reverts visible in diff, not buried inside inline `node -e "..."` one-liners that read identically in either direction.
- `git log -- <file>` is your first diagnostic tool when a Linux-only thing stops working: the alternating `fix(linux): …` / `Update scripts` / `fix(linux): …` pattern is usually right there.

### "Symptom at call site" is rarely the root cause — always trace the import chain

Every significant bug this session took a path like:
- Symptom: `testPathTransfer` throws `UnsupportedOperatingSystem`.
- First "fix": remove the `if (platform !== "win32")` guard.
- New symptom: `winapi.GetVolumePathName is not a function`.
- Deeper cause: `winapi-bindings` externalised by `nodeExternals` before `resolve.alias` could redirect it to the shim.

Always follow the import chain to the bundle. `grep 'external ".*"' src/main/build/renderer.js` can be more informative than reading TypeScript sources when something "should be working".

### `winapi-bindings` on Linux is a shim, not a stub

It's tempting to assume Windows-API calls should be wholesale wrapped with `if (platform === 'win32')` guards. Don't. The shim in `src/renderer/src/util/winapi-shim.ts` implements real Linux equivalents for the disk/path functions that matter (`GetDiskFreeSpaceEx`, `GetVolumePathName`, `GetNativeArch`). When removing a win32 guard, the question is "does this function use only shimmed APIs?" — not "does this mention winapi?". Most of the guards in the tree are over-cautious.

### LOOT errors lie about ghost files

The Linux case-sensitivity bug surfaces as:

```
failed validation of input plugin paths: the file at "…/Data/dlccoast.esm.ghost" does not have a valid plugin header
```

The `.ghost` in that error is a **red herring** — LOOT probes `{name}` then `{name}.ghost` and emits the last path it tried. The real issue is case. If you ever see this error on Linux, check the casing of the strings Vortex passes to LOOT before debugging anything ghost-related.

### pluginId (lowercase) ≠ filename (preserved case)

Vortex's internal `pluginId` is intentionally lowercase for case-insensitive identity. `pluginList[id].filePath` is the real on-disk path with preserved casing. The two must not be confused when handing strings to external tools that hit the filesystem. LOOT is one such tool; there may be others.

### The renderer bundle lies about its input

`src/main/build/renderer.js` is webpack output. When debugging, confirm the **source** file you edited is the one that shaped the bundle by checking mtimes and re-running `pnpm -F @vortex/renderer run build`. The bundle caches aggressively and a "source has the fix but bundle doesn't" situation is common after git operations that touch source files (cherry-pick, stash-pop).

Diagnostic snippet:

```bash
stat -c '%y %n' src/main/build/renderer.js src/renderer/src/util/<file>.ts
```

Source newer than bundle → rebuild.

### Stray working-tree diffs will block cherry-picks

`etc/Dependency Report.md` and `packages/vortex-api/lib/api.d.ts` regenerate whenever the build runs and show up as dirty in `git status`. They're out of scope for almost every Linux fix. Stash before `git checkout` / `git cherry-pick`, pop after:

```bash
git stash push -m "stray build churn" "etc/Dependency Report.md" packages/vortex-api/lib/api.d.ts
# … cherry-pick …
git stash pop
```

Doing this reflexively before any branch switch saved ~10 minutes of retries during this session.

### Node version matters for `copy-extension.mjs`

The script uses `import.meta.dirname`, which requires Node ≥ 20. System `node` may be Node 18; `pnpm exec node` resolves to the Volta-pinned Node 22. Use `pnpm exec node ../copy-extension.mjs` when running the script directly, not bare `node ../copy-extension.mjs`.

### Restart Vortex fully after every fix

Vortex caches extensions at startup. Editing source + rebuilding the renderer + re-running `copy-extension.mjs` has no effect on a running instance. A "my fix doesn't work" report followed by "oh, did you restart?" answered "no" at least once per session. Just restart.

### Stale notifications persist across runs

The bell alerts are sticky across Vortex restarts — dismiss them manually after a fix, otherwise you're debugging a notification from two runs ago. "No deployment method available" on the page body is live; the same message in the bell might be stale. Check the log timestamp when in doubt.

---

## Commit index

Durable references to the fork-local Linux fixes this file depends on. If any of these commits are missing from either branch after a merge, something reverted them.

| Fix | master | linux-port |
|-----|--------|-----------|
| Named `skip-on-windows.mjs` guard for gamebryo scripts | `bafb67265` | `52ea4ae3a` |
| Remove win32 guard from `testPathTransfer` | `7cfe61602` | `8e8b13284` |
| Allowlist `winapi-bindings` from `nodeExternals` | `e69401abf` | `0cccf116b` |
| Pass real plugin filenames to LOOT + filter ghosts | `324da1814` | `72641450c` |

Earlier-era fixes that were reverted by upstream merges (kept for archaeology):
- `d8b60ab35` — first `||` → `&&` flip on gamebryo guards
- `10d796278` — second `||` → `&&` flip after first revert
- `eb512442c` — restored Linux `libloot.so.0` + `wstring_stub.so` copy step in `_native`
