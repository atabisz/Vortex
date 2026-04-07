# Phase 11: Persistent Elevation Token - Context

**Gathered:** 2026-04-07
**Status:** Ready for planning

<domain>
## Phase Boundary

Deliver a polkit `.rules` file that grants `AUTH_ADMIN_KEEP` for `io.nexusmods.vortex.run-elevated`, bundled in the `.deb` package only. No changes to `runElevated()` call sites — polkit handles caching transparently once the rule is installed. AppImage users are explicitly not covered; that difference is documented in the README.

</domain>

<decisions>
## Implementation Decisions

### Rule File Format
- **D-01:** Use a polkit `.rules` JavaScript file (modern format, not `.pkla`). File: `build/linux/10-vortex.rules`. Polkit JS rules are supported on all target distros (Ubuntu 20.04+, Fedora 30+, Arch).
- **D-02:** File grants `polkit.Result.AUTH_ADMIN_KEEP` for action `io.nexusmods.vortex.run-elevated` when the subject is active.

### Packaging
- **D-03:** The `.rules` file ships via `deb.extraFiles` in `src/main/electron-builder.config.cjs` — **not** in `linux.extraFiles`. This restricts delivery to `.deb` only; AppImage does not get the rule file.
- **D-04:** Install path: `/etc/polkit-1/rules.d/10-vortex.rules` (numeric prefix `10` — runs early, before most system rules).
- **D-05:** Source asset path: `build/linux/10-vortex.rules` (alongside the existing `io.nexusmods.vortex.policy`).

### AppImage Limitation
- **D-06:** AppImage users do **not** get the persistent token. They continue to be prompted on each elevation call. This difference must be documented in the README (installation section, comparison table, or a dedicated note).

### No Code Changes to `runElevated()`
- **D-07:** The `runElevated()` function in `src/renderer/src/util/elevated.ts` does not need modification. Polkit applies `AUTH_ADMIN_KEEP` transparently when the rule file is present — no Vortex-side session tracking needed.

### Claude's Discretion
- Rule file content: Claude chooses whether to scope `AUTH_ADMIN_KEEP` to `subject.active` only, or add an `isInGroup("sudo")` guard. Recommend `subject.active` only (simpler, consistent with the existing `.policy` file's `<allow_active>auth_admin</allow_active>`).
- Session scoping behavior: `AUTH_ADMIN_KEEP` is desktop-session-scoped (not per-Vortex-launch). If the user relaunches Vortex within the polkit auth cache window (~5 min default), they won't be re-prompted. This is acceptable — success criterion 4 ("new session re-prompts") is met once the cache expires or the desktop session restarts.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/REQUIREMENTS.md` — ELEV-04 acceptance criteria (the requirement this phase satisfies)

### Existing Elevation Implementation
- `src/renderer/src/util/elevated.ts` — `runElevated()`: the Linux pkexec branch + `isSteamOS()` fallback; `_setSpawner` test seam; action spawned is `io.nexusmods.vortex.run-elevated`
- `src/renderer/src/util/elevated.test.ts` — existing Vitest test suite (7 tests); pattern for new tests

### Packaging Configuration
- `src/main/electron-builder.config.cjs` — `linux.extraFiles` contains the existing `.policy` file; new `.rules` file goes in the `deb` section (`deb.extraFiles`)
- `build/linux/io.nexusmods.vortex.policy` — existing polkit action file; action ID is `io.nexusmods.vortex.run-elevated`

### No external specs — polkit JS rules format is standard; requirements fully captured in decisions above.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `build/linux/io.nexusmods.vortex.policy`: Template for the new `10-vortex.rules` asset structure. Same `build/linux/` directory is the right home for the new file.
- `src/renderer/src/util/elevated.ts` `_setSpawner`: Test seam for mocking pkexec in Vitest — no changes needed, already supports unit testing the call path.

### Established Patterns
- `electron-builder extraFiles`: `{ from: "../../build/linux/<file>", to: "<system-path>" }` — exact pattern to replicate in `deb.extraFiles`.
- Platform guard pattern: `if (process.platform === 'linux') { ... }` — not needed for a static asset, but present context for any code changes.

### Integration Points
- No code integration needed — the `.rules` file is a static asset that polkit reads at auth time. The only integration is the `electron-builder.config.cjs` packaging config.

</code_context>

<specifics>
## Specific Ideas

- User explicitly requested README documentation of the `.deb` vs AppImage difference — this is not a "nice to have"; it's a deliverable of this phase.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 11-persistent-elevation-token*
*Context gathered: 2026-04-07*
