# Phase 13: Save Transfer - Context

**Gathered:** 2026-04-07
**Status:** Ready for planning

<domain>
## Phase Boundary

Make the existing save game transfer UI work end-to-end on Linux for Skyrim SE and Fallout 4 (Wine prefix paths). The transfer UI, transfer logic, and Linux-aware `mygamesPath()` already exist from Phases 10 and 14. This phase closes two remaining gaps: case-folding coverage for copy/rename/ensureDir operations, and empty-state UX in the transfer picker when no eligible source profiles exist.

No new UI features, no new game support. Extend what exists.

</domain>

<decisions>
## Implementation Decisions

### Case-Folding Coverage for Copy Operations

- **D-01:** Extend the Phase 14 `fs.ts` wrapper to apply `resolvePathCase` to `copyAsync`, `renameAsync`, and `ensureDirAsync` — same pattern as the existing `statAsync`/`readFileAsync`/`writeFileAsync` wrapping. This is a centralised fix; all future callers benefit automatically, not just the save transfer path.
- **D-02:** `ensureDirAsync` edge case: when the destination profile save directory does not yet exist (first transfer to a local-saves profile), `resolvePathCase` returns the input unchanged and `ensureDirAsync` creates it fresh. No special walk-up logic needed — the parent Wine prefix directory is already correctly cased via `mygamesPath()`.

### Empty-State UX in Transfer Picker

- **D-03:** When `profileOptions` is empty AND the global option is unavailable (current profile lacks `local_saves: true`), render a small italicised helper message below the `<FormControl>` dropdown in `renderTransfer()`:
  > *"No profiles with local saves found. Enable local saves in Profile Settings to use save transfer."*
  No button, no modal — just a contextual note. The i18n key must be new (do not reuse).

### Claude's Discretion
- Exact `resolvePathCase` call site placement inside `copyAsync`/`renameAsync`/`ensureDirAsync` (resolve `src` path before passing to underlying `fs.copy`/`fs.rename`/`fs.ensureDir`)
- Whether to add Vitest tests for the new copy/rename case-folding in `fs.test.ts` or in the gamebryo extension's own test suite — research should recommend
- Translation string key name for the empty-state message

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Core Save Transfer Logic
- `extensions/gamebryo-savegame-management/src/util/transferSavegames.ts` — uses `fs.copyAsync`/`renameAsync`; target of D-01 impact
- `extensions/gamebryo-savegame-management/src/index.ts` — `onTransferSavegames()` orchestrator; uses `fs.ensureDirAsync` (D-01) and calls `mygamesPath()`
- `extensions/gamebryo-savegame-management/src/util/gameSupport.ts` — `mygamesPath()` async Linux Proton branch (Phase 10); source of truth for save base paths
- `extensions/gamebryo-savegame-management/src/util/profileSavePath.ts` — `profileSavePath()` returns relative `"Saves/"` or `"Saves/<profileId>/"` suffix

### Transfer UI
- `extensions/gamebryo-savegame-management/src/views/SavegameList.tsx` — `renderTransfer()` builds profile dropdown; `profileOptions` filter is the target for D-03 empty-state message

### Phase 14 fs Wrapper (to extend)
- `src/renderer/src/util/fs.ts` — `copyAsync`, `renameAsync`, `ensureDirAsync` are the three functions to extend with `resolvePathCase` per D-01
- `src/renderer/src/util/resolvePathCase.ts` — `resolvePathCase(dir, base)` async utility; already imported in `fs.ts`

### Requirements & Prior Work
- `.planning/REQUIREMENTS.md` §SAVE-05 — acceptance criterion for this phase
- `.planning/milestones/v3.0-phases/10-save-ui-validation-steamos-polkit/10-01-SUMMARY.md` — async `mygamesPath()` pattern; decisions about `getSteamEntry` and bundled-extension constraints (no renderer src imports)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `resolvePathCase` (already imported in `fs.ts` at line 52): use the same import for the new copy/rename/ensureDir wrapping
- `renderTransfer()` in `SavegameList.tsx` already handles the `profileOptions`/`activeHasLocalSaves` logic — only add a conditional block for the empty case
- `fs.ensureDirAsync` is called directly in `onTransferSavegames` in `index.ts` (not in `transferSavegames.ts`)

### Established Patterns
- Phase 14 fs wrapper pattern: wrap the underlying call with `await resolvePathCase(path.dirname(p), path.basename(p))` before forwarding to `fs.copy`/etc.
- `bluebird.PromiseBB` used throughout; `copyAsync`/`renameAsync`/`ensureDirAsync` must stay as PromiseBB returns
- `t()` i18n function available in `SavegameList.tsx` via `this.props.t`

### Integration Points
- `fs.ts` is in `src/renderer/src/util/` — part of the renderer build; no bundled-extension constraints
- `SavegameList.tsx` is the only consumer of `renderTransfer()` — no spread impact from the empty-state message change

</code_context>

<specifics>
## Specific Ideas

- Empty-state message text: *"No profiles with local saves found. Enable local saves in Profile Settings to use save transfer."*
- The message should be italicised (`<i>` or equivalent Bootstrap/React-Bootstrap styling), not a warning banner
- The check is: `profileOptions.length === 0 && !activeHasLocalSaves` (no global option either)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 13-save-transfer*
*Context gathered: 2026-04-07*
