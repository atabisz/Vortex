# Phase 14: Linux Case-Folding fs Wrapper - Context

**Gathered:** 2026-04-07
**Status:** Ready for planning

<domain>
## Phase Boundary

Promote `resolvePathCase` from `mod_management` into the renderer's `util/` (accessible via `vortex-api`), then transparently patch `util/fs.ts` so that `readFileAsync`, `writeFileAsync`, `statAsync`, and `watch` automatically resolve Wine prefix AppData path casing on Linux — eliminating per-callsite surgical fixes without touching any call sites.

Also: clean up the unstaged `PluginPersistor.ts` local fix (remove `resolvePluginsFilePath`, revert to `path.join(dir, 'plugins.txt')`) since the shim makes it redundant. Keep the watch handler `fileName.toLowerCase()` fix — that is permanent because inotify event filenames are outside the shim's reach.

</domain>

<decisions>
## Implementation Decisions

### Promotion Target
- **D-01:** `resolvePathCase` moves from `src/renderer/src/extensions/mod_management/util/resolvePathCase.ts` into `src/renderer/src/util/` (alongside `fs.ts`). It is then exported from `src/renderer/src/api.ts` as part of the `util` namespace — i.e., `util.resolvePathCase`.
- **D-02:** Bundled extensions access it as `import { util } from 'vortex-api'` then call `util.resolvePathCase(...)`. No new import paths, no new packages.
- **D-03:** The copy in `mod_management/util/resolvePathCase.ts` is removed; `mod_management`'s imports are updated to `util` from `vortex-api`.

### Shim Scope
- **D-04:** The shim applies **only** to paths containing both `/compatdata/` and `/pfx/` (Wine prefix markers). O(1) string check per call. Covers all Proton/Wine games (Skyrim SE, Fallout 4, any future Proton title).
- **D-05:** Non-Wine Linux paths (`~/.config/<game>`, `~/.local/share/<game>`, etc.) are **not** intercepted. That is a separate problem outside v4.0 scope.
- **D-06:** On Windows (`process.platform !== 'linux'`), the shim is a no-op — the existing Wine prefix check short-circuits immediately.

### Shim Integration
- **D-07:** The shim is implemented by wrapping `readFileAsync`, `writeFileAsync`, `statAsync`, and `watch` **directly inside `src/renderer/src/util/fs.ts`**. No new module, no new export. Existing callers — including all bundled extensions via `vortex-api` — automatically get case-aware behavior.
- **D-08:** Covered operations: `readFileAsync`, `writeFileAsync`, `statAsync`, `watch`. These are the four specified by the ROADMAP success criteria.
- **D-09:** The `dirCache` parameter from the existing `resolvePathCase` signature should be omitted at the shim layer (no cache per-call) — the shim is a safety net for scattered individual calls, not a deployment loop. Callers that do bulk operations (mod deployment) already use `resolvePathCase` directly with a cache.

### PluginPersistor Cleanup
- **D-10:** The unstaged `PluginPersistor.ts` change adds `resolvePluginsFilePath` and uses it in `serialize` and `deserialize`. After Phase 14's shim lands, this method is **removed** — `fs.readFileAsync(path.join(dir, 'plugins.txt'))` will transparently resolve the correct casing via the shim.
- **D-11:** The `fileName.toLowerCase()` fix in the watch handler **stays permanently**. The shim wraps `fs.watch` setup (the path argument), but the inotify event callback's `fileName` parameter comes from the OS and is outside the shim's reach.
- **D-12:** Phase 14 includes a commit to `extensions/gamebryo-plugin-management/` to remove `resolvePluginsFilePath` and revert the serialize/deserialize changes to simpler `path.join` calls.

### Claude's Discretion
- Exact wrapper implementation in `fs.ts`: How to intercept async functions while preserving the PromiseBB return type and all existing overloads. Claude chooses the wrapper pattern (inline guard, helper wrapper function, etc.) as long as it does not change the function signatures visible to callers.
- Test coverage: Claude should add Vitest tests verifying that (1) a Wine prefix path goes through `resolvePathCase`, (2) a non-Wine-prefix path is passed through unchanged, (3) Windows short-circuits without calling `resolvePathCase`.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Existing resolvePathCase Implementation
- `src/renderer/src/extensions/mod_management/util/resolvePathCase.ts` — the function to be promoted; read its full implementation and test file before moving
- `src/renderer/src/extensions/mod_management/util/resolvePathCase.test.ts` — existing tests that must migrate with the function

### fs Module (shim target)
- `src/renderer/src/util/fs.ts` — the module to patch; read `readFileAsync`, `writeFileAsync`, `statAsync`, and `watch` wrapper definitions (lines ~550–640) before modifying
- `src/renderer/src/api.ts` — exports `fs` and `util` from the renderer; `resolvePathCase` gets added to the `util` export here

### Call Sites in mod_management (update imports after promotion)
- `src/renderer/src/extensions/mod_management/LinkingDeployment.ts` — imports `resolvePathCase` from `./util/resolvePathCase` (lines 27, 748, 812); update to import from `util` via `vortex-api` or renderer util path
- `src/renderer/src/extensions/mod_management/InstallManager.ts` — imports `resolvePathCase` from `./util/resolvePathCase` (lines 208, 7843); same update

### PluginPersistor (cleanup target)
- `extensions/gamebryo-plugin-management/src/util/PluginPersistor.ts` — unstaged changes add `resolvePluginsFilePath`; Phase 14 removes this method and reverts serialize/deserialize to simple `path.join` calls; the `fileName.toLowerCase()` watch fix at line ~657 stays

### Requirements
- `.planning/REQUIREMENTS.md` — no explicit requirement ID for Phase 14 yet; check for any case-folding requirement added to v4.0

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `resolvePathCase(rootDir, relPath, dirCache?)`: already handles Linux case-insensitive matching with optional dir cache; returns the on-disk casing or the original segment if not found. Tested. Ready to promote.
- `fs.readdirAsync`: already used by `resolvePathCase` internally; no new fs dependencies needed.

### Established Patterns
- Platform guard: `if (process.platform === 'win32') { return path.join(rootDir, relPath); }` — already in `resolvePathCase`; the shim uses `process.platform !== 'linux'` as a fast early-return.
- `genFSWrapperAsync` pattern in `util/fs.ts`: existing wrappers use this helper to create PromiseBB-returning async functions; the shim must be compatible with this wrapper type.
- Bundled extensions import from `vortex-api` only — cannot import from `src/renderer/src/` directly (confirmed by `PluginPersistor.ts` using `import { fs, util } from 'vortex-api'`).

### Integration Points
- `src/renderer/src/api.ts` line 16: `export { actions, PromiseBB as Promise, fs, log, selectors, types, util }` — `resolvePathCase` goes into `util` here
- `util/fs.ts` lines ~550–640: the async wrapper block where `readFileAsync`, `writeFileAsync`, `statAsync`, `watch` are defined — shim logic goes here
- `mod_management/LinkingDeployment.ts` and `InstallManager.ts`: their local `resolvePathCase` imports become `util.resolvePathCase` from the renderer's util (or vortex-api for bundled extension style)

</code_context>

<specifics>
## Specific Ideas

- The shim's Wine prefix detection: `absPath.includes('/compatdata/') && absPath.includes('/pfx/')` — simple, no regex needed.
- `resolvePathCase` already has the right signature to call at the shim layer: `resolvePathCase(path.dirname(target), path.basename(target))` for leaf-file calls, or `resolvePathCase(root, relPath)` for relative-path calls. The shim wraps the absolute path by splitting at the Wine prefix root.
- No `dirCache` at the shim layer per D-09 — the overhead per individual call is acceptable; it's bulk deployment loops that need the cache, and those already call `resolvePathCase` directly.

</specifics>

<deferred>
## Deferred Ideas

- Native Linux game AppData case-folding (`~/.config/`, `~/.local/share/`) — different problem, v5.0+
- Extending shim to cover `lstatAsync`, `ensureDirAsync`, `moveAsync` — could be added if new issues surface; out of Phase 14 scope

</deferred>

---

*Phase: 14-linux-case-folding-fs-wrapper*
*Context gathered: 2026-04-07*
