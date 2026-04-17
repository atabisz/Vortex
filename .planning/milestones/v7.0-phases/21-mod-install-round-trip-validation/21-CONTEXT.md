# Phase 21: Mod Install Round-Trip Validation - Context

**Gathered:** 2026-04-16
**Status:** Ready for planning

<domain>
## Phase Boundary

Trace the full install → deploy → enable code path for Skyrim SE on Linux, fix any deploy-method-selection blockers surgically, and produce a UAT checklist added to Phase 999.1 backlog. This is a code-fix phase focused specifically on ensuring hardlink_activator is available and correctly selected as the default deployment method for Skyrim SE on Linux. Other round-trip blockers (post-deploy INI writes, mod enable steps) are out of scope for Phase 21.

**In scope:** ONBRD-04 (code-complete + 999.1 UAT entry)
**Out of scope:** INI/config post-deploy fixes (new phase if needed), full E2E hardware UAT (999.1 backlog), other games besides Skyrim SE

</domain>

<decisions>
## Implementation Decisions

### Phase nature

- **D-01:** Phase 21 is a code-fix phase. The primary focus is deploy-method selection: ensure hardlink_activator is available and correctly selected as the default for Skyrim SE on Linux. Same surgical platform-guard pattern as Phases 18–20.
- **D-02:** If the deploy-method code path turns out to already be clean (no blocker found), fallback is "trace + document" — produce a code-complete verification note and add ONBRD-04 UAT steps to Phase 999.1 backlog. Mirrors ELEV-04/05/SAVE-05 precedent.

### Target game

- **D-03:** Target game is Skyrim SE (`skyrimse`). Already validated for save paths (STAM-03/05) and FOMOD install (Phase 15). Skyrim SE is in the `isGamebryoGame` blocklist in symlink_activator, so hardlink_activator (priority 5) is the natural and expected deploy method on Linux.
- **D-04:** Mod files deploy into the Proton prefix path (`compatdata/<appid>/pfx/drive_c/...`). The case-folding shim from Phase 14 handles Wine prefix path casing. The researcher must verify `getModPaths` for `skyrimse` on Linux returns the correct Proton-prefix-relative path.

### Deploy method selection

- **D-05:** Scope is limited to the deploy-method-selection step. If hardlink_activator is not being offered as the default (or is being incorrectly filtered as unsupported) for Skyrim SE on Linux, fix that specifically. Do not expand scope to the full round-trip.
- **D-06:** hardlink_activator has priority 5 (highest — first in the sorted list). symlink_activator has priority 10. On Linux, symlink_activator's `ensureAdmin()` check may return false (no UAC; symlinks may require elevated privileges), which would make hardlink the only supported option. The researcher should confirm whether symlink_activator is correctly excluded on Linux for Gamebryo games and whether hardlink_activator's `isSupported` passes.

### Done criteria

- **D-07:** Phase 21 is done when: (a) any deploy-method-selection blockers are fixed with surgical platform guards, AND (b) ONBRD-04 UAT steps are added to the Phase 999.1 backlog entry. ONBRD-04 is marked code-complete (hardware UAT pending) in REQUIREMENTS.md.
- **D-08:** UAT checklist lives in Phase 999.1 backlog (`.planning/phases/999.1-*` or equivalent) — same location as ELEV-04, ELEV-05, SAVE-05 entries. Not a separate checklist file in the phase dir.

### Claude's Discretion

- Exact line(s) that need platform-guarding in hardlink_activator or deploymentMethods.ts (researcher determines by code trace).
- Whether `allTypesSupported` needs a Linux-aware path or whether the issue is upstream in `isSupported`.
- Exact wording of the ONBRD-04 UAT steps added to 999.1 backlog.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase Requirements
- `.planning/REQUIREMENTS.md` §Mod Install Round-Trip (ONBRD-04) — single requirement; code-complete with 999.1 UAT entry

### Key Source Files
- `src/renderer/src/extensions/mod_management/util/deploymentMethods.ts` — `getSupportedActivators`, `getCurrentActivator`, `getAllActivators`; activator priority sorting
- `src/renderer/src/extensions/mod_management/util/allTypesSupported.ts` — per-type supported check called by `getSupportedActivators`
- `src/renderer/src/extensions/hardlink_activator/index.ts` — `isSupported` for hardlink; `enrichLinuxEntries` Linux fallback; priority 5
- `src/renderer/src/extensions/symlink_activator/index.ts` — `isSupported` for symlink; `isGamebryoGame` list (includes `skyrimse`, `fallout4`); `ensureAdmin()` symlink test; priority 10
- `src/renderer/src/extensions/mod_management/eventHandlers.ts` — `getSupportedActivators` call at deploy time; activator selection flow

### Prior Phase Context
- Phase 14 CONTEXT.md — `resolvePathCase`, fs shim for Wine prefix path casing; active for `compatdata/` paths
- Phase 15 CONTEXT.md — FOMOD installer Linux path normalization; round-trip already partially validated

No external specs — requirements fully captured in decisions above.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `hardlink_activator`: already has `enrichLinuxEntries` for Linux inode metadata — Linux-aware code exists
- `symlink_activator`: `isGamebryoGame` list correctly excludes `skyrimse` and `fallout4` — symlink is already blocked for Skyrim SE regardless of admin status
- `deploymentMethods.ts`: `getSupportedActivators` returns activators sorted by priority where `allTypesSupported` has zero errors — hardlink (priority 5) will be first if supported

### Established Patterns
- Platform guard: `if (process.platform === 'linux') { ... }` or ternary — used throughout codebase
- `isSupported` returns `IUnavailableReason | undefined` — `undefined` means supported; any object means unsupported with reason
- ELEV-04/SAVE-05 precedent: code-complete + 999.1 hardware UAT entry = done for features requiring real hardware

### Integration Points
- `getSupportedActivators(state)` → `allTypesSupported(act, state, gameId, modTypes)` → `act.isSupported(state, gameId, typeId)` — the full selection chain
- `getCurrentActivator(state, gameId, allowDefault: true)` uses same chain for auto-selection
- Any fix is most likely surgical: a missing Linux branch in `isSupported`, or a Windows-only check in `allTypesSupported`

</code_context>

<specifics>
## Specific Ideas

- **Deploy method research focus:** The researcher should trace `hardlink_activator.isSupported` → `allTypesSupported` for `skyrimse` on Linux and confirm it returns `undefined` (supported). If it returns a reason, that's the blocker to fix.
- **symlink_activator on Linux:** `ensureAdmin()` attempts `fs.symlinkSync` — on Linux without elevated privileges this may succeed (user can create symlinks in their own directories). This means symlink_activator may NOT be filtered out on Linux, giving the user two options. The research should verify whether this is confusing or correct.
- **999.1 UAT entry format:** The existing 999.1 backlog entries (ELEV-04, ELEV-05, SAVE-05) follow the pattern: `ONBRD-04: [description] — code-complete; hardware UAT pending`. Match that format.

</specifics>

<deferred>
## Deferred Ideas

- Post-deploy INI/config file writes for Skyrim SE on Linux — if the round-trip reveals INI write failures, that's Phase 21.x or Phase 22+
- Symlink activator Linux admin behavior (whether `ensureAdmin()` passes on user-owned directories) — if it causes UX confusion, address in a follow-on phase
- Full E2E hardware UAT pass for ONBRD-04 — tracked in Phase 999.1 backlog

</deferred>

---

*Phase: 21-mod-install-round-trip-validation*
*Context gathered: 2026-04-16*
