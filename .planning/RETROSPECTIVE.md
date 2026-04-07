# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

---

## Milestone: v1.0 — Linux Port Phase 1

**Shipped:** 2026-03-31
**Phases:** 5 | **Plans:** 10 | **Tasks:** 16

### What Was Built

- winapi-bindings 48-export Linux shim — single config alias covers all 21 import sites, zero source edits
- libloot 0.29.1 built from source via cmake+cargo; all 5 C++ native addons CI-compiled and verified on Linux
- FOMOD TCP transport validated end-to-end; Linux ELF binaries unpacked from asar
- `getIPCPath()` utility; all 4 IPC sites patched for Unix sockets; serialisation trap closed
- Elevation audit: pkexec confirmed absent from all startup paths, deferred to v2 with full documentation

### What Worked

- **Alias approach for winapi-bindings:** One webpack + rolldown config change covered all 21 import sites without any source edits — the highest-leverage change in the milestone
- **TDD with vi.resetModules() + dynamic import():** Caught the XDG `??` vs `||` edge case before integration; the test design matched the actual platform-branching code path
- **Audit-first for elevation:** Investing a plan in the elevation audit before implementing pkexec paid off immediately — confirmed zero startup-path elevation, saved a full phase of work
- **Phase ordering:** Research-verified dependency graph (runtime → winapi → native addons → FOMOD → IPC) prevented blocking at each handoff
- **Commit-per-task discipline:** Atomic commits per task made bisect trivial and kept the Windows CI signal clean throughout

### What Was Inefficient

- **loot RPATH:** Two attempts needed (patch-package RPATH then LD_LIBRARY_PATH in-process) — the cmake `PREFIX=` behavior (producing `libloot.so.0` not `liblibloot.so`) wasn't anticipated in the plan
- **IPC serialisation trap:** The `.toString()` closure path required a second pass — source grep alone was insufficient and the plan had to be extended to inspect the stringified child code path
- **Phase 4 ROADMAP status:** Checkbox for `04-02-PLAN.md` wasn't updated in ROADMAP.md despite SUMMARY.md existing on disk — caused a minor discrepancy at milestone close

### Patterns Established

- **Platform guard pattern:** `if (process.platform === 'linux') { ... }` before Windows path — used consistently across all 5 phases; serves as the canonical pattern for future Linux additions
- **Summary-based one-liner extraction:** SUMMARY.md `one_liner` field enables automated milestone archival; invest in the one-liner quality at plan-close time
- **verify-addons.cjs smoke test:** ldd-based verification (not require()) for native addons — avoids V8 ABI mismatch between plain node and Electron headers
- **Static import + vi.spyOn for node16 moduleResolution:** Dynamic `import()` in test files breaks under node16 — static import + spyOn is the correct pattern

### Key Lessons

1. **Alias at the build boundary, not the source.** Replacing a Windows-only native module with a shim works best at the webpack/rolldown resolver level — avoids touching every callsite and is 100% platform-isolated.
2. **Serialised closures are a hidden second call site.** Any `.toString()`'d function that references platform-specific values needs its own patch; source grep will miss it.
3. **Audit before implementing.** For elevation and pkexec: investing a plan in characterising the scope before coding saved significant implementation work. Pattern generalises to any uncertain-scope requirement.
4. **cmake library naming surprises.** cmake `PREFIX=` affects the `.so` filename; always verify the actual output filename matches the linker `-l` flag in `binding.gyp`.

### Cost Observations

- Model mix: Sonnet 4.6 (primary execution), Opus 4.6 (planning/research agents)
- Sessions: ~5 sessions across 1 day (2026-03-30 → 2026-03-31)
- Notable: High-leverage alias approach (Phase 2) and audit-first approach (Phase 5) each saved an estimated full phase of implementation work

---

## Milestone: v2.0 — Usable on Linux

**Shipped:** 2026-04-01
**Phases:** 3 | **Plans:** 7 | **Tasks:** 11

### What Was Built

- Multi-root Steam scanning (native + Flatpak) with oslist-based Proton detection for never-launched Windows-only games
- `{mygames}` Wine prefix path resolution fixed: `PROTON_USERNAME = "steamuser"` constant, `getMyGamesPath()` helper, async `iniFiles()` with Linux guard; "My Documents" → "Documents" bug corrected
- Top-4 game extensions (Skyrim SE, Fallout 4, Cyberpunk 2077, Stardew Valley) confirmed Linux-compatible; dead `winapi-bindings` require removed from Fallout 4
- electron-builder configured for AppImage + .deb targets; auto-updater gated behind `process.env.APPIMAGE`; `latest-linux.yml` auto-generated
- GitHub Actions `build-linux` parallel CI job alongside Windows — Rust toolchain → apt deps → pnpm → `package:nosign` → validate → release
- `ensureAppImageDesktopEntry()` writes `.desktop` + wrapper script before `xdg-settings`; `kbuildsycoca6` refresh for KDE Plasma; `mPendingDownload` cold-start NXM buffer in `Application.ts`

### What Worked

- **PROTON_USERNAME constant:** Documenting the "steamuser" pitfall in CONTEXT before coding prevented a hard-to-diagnose bug — the Username in Wine prefix is never the OS username
- **Parallel CI job (no needs:):** Parallel sibling job was the right call; zero sequencing overhead, no Windows job changes needed
- **Surgical NXM changes:** Phase 8 required only 3 targeted lines in `Application.ts` and one new function in `nxm.ts` — the pre-phase research (CONTEXT.md) made the scope clear before touching code
- **Cold-start buffer pattern:** `mPendingDownload` field is idiomatic Electron startup-phase coordination; clean, testable, and self-documenting
- **Additive functions for Steam paths:** `findAllLinuxSteamPaths()` as a new function alongside the existing `findLinuxSteamPath()` preserved backward compat with zero regression risk

### What Was Inefficient

- **Phase 7-02 missing SUMMARY.md:** Plan was executed and committed but SUMMARY.md was never created — caught at milestone close; required reconstructing from commit message. Post-execution doc step needs better enforcement.
- **Phase 6 ROADMAP checkbox:** Phase 6 wasn't marked `[x]` in the ROADMAP despite all summaries and verification passing — same issue as v1.0's Phase 4 checkbox. The `phase complete` CLI didn't update the phase-level entry in the `<details>` block.
- **Phase ordering:** Phases 7 and 8 were executed before Phase 6's ROADMAP was marked complete — the state counter showed `completed_phases: 2/3` at milestone close even though all work was done.

### Patterns Established

- **PROTON_USERNAME constant:** Never use `os.userInfo().username` for Wine prefix paths — always `steamuser`
- **AppImage desktop entry before xdg-settings:** `ensureAppImageDesktopEntry()` must run before `setDefaultUrlSchemeHandler()` — xdg-settings requires the `.desktop` file to exist first
- **KDE graceful degradation:** `kbuildsycoca6 --noincremental` catch on ENOENT — silently skip on non-KDE desktops
- **CI parallel Linux job pattern:** `build-linux` with no `needs:`, replicated version parsing in bash, `pnpm run package:nosign`

### Key Lessons

1. **Document the platform-specific constants.** `PROTON_USERNAME = "steamuser"` seems obvious in retrospect but would have been a multi-hour debug. Getting this into CONTEXT.md before the plan runs makes it explicit.
2. **SUMMARY.md is a first-class deliverable.** Phase 7-02 had commits but no summary — the plan itself said "create SUMMARY.md" in its `<output>` block. This gap surfaced at milestone close. Treat missing SUMMARYs as incomplete plans.
3. **Checkpoint on ROADMAP checkbox after each phase complete.** Two milestones in a row have had a phase-level checkbox discrepancy. The `phase complete` CLI updates plan-level `[x]` entries but not the phase-level bold entry. Manual verification needed until the CLI is fixed.
4. **Research pays off at the AppImage boundary.** The cold-start NXM and desktop entry pitfalls were both documented in CONTEXT.md from the research phase — the execution plans were precise because the research was thorough.

### Cost Observations

- Model mix: Sonnet 4.6 (primary execution + verification), Sonnet 4.6 (planning agents)
- Sessions: ~4 sessions across 1 day (2026-04-01)
- Notable: Phase 8 was the leanest phase (2 plans, 11 tasks total) due to high-quality CONTEXT.md reducing scope uncertainty to near-zero

---

## Milestone: v3.0 — Save Games + Elevation

**Shipped:** 2026-04-01
**Phases:** 2 | **Plans:** 4 | **Tasks:** 7

### What Was Built

- gamebryo-savegame pnpm patch: `MoreInfoException` base changed to `std::runtime_error`, `binding.gyp` gains `OS=="linux"` lz4/zlib linker flags, CHAR_WIDTH fmt macro undef for GCC 13
- pkexec Linux branch in `runElevated()` with injectable spawner seam; socket-before-spawn ordering enforced; 7 Vitest tests covering all exit code paths including UserCanceled (exit 126), auth failure (exit 127), and ECONNREFUSED
- `mygamesPath()` and `iniPath()` made async with Linux Proton branch; `getSteamEntry()` helper via `GameStoreHelper`; all callers in `index.ts` await-updated; SAVE-02/03/04 fixed
- `isSteamOS()` detection via `/etc/os-release` with module-level caching; `sudo -n` fallback before pkexec on SteamOS; graceful `UserCanceled` on both failures
- `io.nexusmods.vortex.policy` polkit action file at `/usr/share/polkit-1/actions/` shipped in `.deb` via `electron-builder extraFiles`

### What Worked

- **pnpm patch pattern:** Established in v1.0 for loot — applied cleanly for gamebryo-savegame. The exact-version-pin requirement was documented from prior experience, preventing silent skip.
- **Injectable spawner seam:** Designing `runElevated()` with a `spawner` parameter for CI testability made the 7-test suite possible without mock pollution. Clean separation of concerns.
- **Cached isSteamOS():** Module-level caching of `/etc/os-release` read was identified in research as a pitfall (repeated file reads on every elevation). The fix was designed into the plan before execution.
- **CONTEXT.md depth on SteamOS:** The research documented the "pkexec hangs without polkit agent in Game Mode" pitfall explicitly — this drove the `sudo -n` fallback design before any code was written.
- **Bundled extension constraint navigation:** The `GameStoreHelper` / `ILocalSteamEntry` pattern for bundled extensions (can't import from renderer src/) was resolved in the plan phase with the right abstraction.

### What Was Inefficient

- **09-01/09-02 SUMMARY.md one-liners missing:** Both phase-09 summaries used placeholder `"One-liner:"` text — the gsd-tools summary-extract returned blanks. Required manual correction at milestone close. Same pattern as v2.0 Phase 7-02 gap.
- **Phase 9 ROADMAP checkbox:** Phase 9's phase-level entry (`- [ ] **Phase 9:**`) wasn't updated to `[x]` — the progress table showed `In Progress` at milestone close. Consistent v1.0/v2.0 pattern; CLI still doesn't update phase-level `<details>` entries.
- **ELEV-01 REQUIREMENTS.md checkbox:** ELEV-01 remained unchecked in REQUIREMENTS.md despite being complete per PROJECT.md and SUMMARY.md. Surfaced at milestone audit step. A minor paperwork gap but created a false alarm at close.

### Patterns Established

- **Vitest for native Electron code:** `elevated.test.ts` pattern — injectable spawner seam + `vi.spyOn(process)` + `vi.restoreAllMocks()` teardown — is the canonical test structure for OS-calling utility code
- **isSteamOS() caching pattern:** Module-level `_isSteamOS: boolean | undefined` with lazy-init on first call — portable to any `/etc/os-release`-based detection
- **polkit action file delivery:** `extraFiles` in `electron-builder.yml` with platform-scoped `filter: ["*.policy"]` — no postinstall hook needed; electron-builder handles placement
- **Bundled extension GameStoreHelper pattern:** When a bundled extension needs Steam data, use `GameStoreHelper.getGameStore('steam').then(...)` and define a local `ILocalSteamEntry` interface

### Key Lessons

1. **SUMMARY.md one-liners need attention at plan-close time.** Three milestones in a row have had placeholder one-liners. The one-liner is extracted by gsd-tools for MILESTONES.md — a bad one-liner degrades the milestone record permanently. Write it properly when closing the plan.
2. **Phase-level ROADMAP checkboxes need manual verification.** The `[ ]` to `[x]` update for phase-level entries in the `<details>` block is not automated. Add a manual check at phase-complete time.
3. **REQUIREMENTS.md checkbox discipline.** Keep REQUIREMENTS.md in sync with PROJECT.md — if a requirement is validated in PROJECT.md, check it off in REQUIREMENTS.md too. Discrepancies surface as false alarms at milestone close.
4. **Research-driven design prevents implementation surprises.** Both major pitfalls (pkexec hang on SteamOS, pnpm patch silent-skip on version bump) were documented in research/SUMMARY.md before coding. Zero surprises during execution.

### Cost Observations

- Model mix: Sonnet 4.6 (execution), Opus 4.6 (planning agents)
- Sessions: ~3 sessions on 2026-04-01
- Notable: Phase 10 was executed in a single session with zero blockers — CONTEXT.md quality and research depth drove this. Phase 9 required a targeted fix (inverted platform guard) post-execution.

---

## Milestone: v4.0 — Elevation Hardening + Save Transfer

**Shipped:** 2026-04-07
**Phases:** 4 | **Plans:** 5 | **Tasks:** 13 feat/test commits

### What Was Built

- Polkit rules file `10-vortex.rules` granting `AUTH_ADMIN_KEEP` — `.deb` installs persistent session token; AppImage correctly excluded
- `_setNotifier`/`rejectWithSteamOSNotification` injectable seam in `elevated.ts`; wired in `renderer.tsx`; Steam Deck Game Mode failure fires Redux notification with recovery path — 21 Vitest tests pass
- `resolvePathCase` promoted from `mod_management` to `src/renderer/src/util/`; exported as `util.resolvePathCase` from vortex-api
- fs.ts transparent Wine prefix case-folding shim: `readFileAsync`, `writeFileAsync`, `statAsync`, `watch`, `copyAsync`, `renameAsync`, `ensureDirAsync` — 22 fs.test.ts tests pass
- `PluginPersistor.resolvePluginsFilePath` per-callsite workaround removed; shim handles transparently
- Save transfer picker: empty-state italicised message when no eligible profiles; transfer path resolves Wine prefix casing end-to-end

### What Worked

- **Fs shim pattern:** Wrapping at the `fs.ts` level with a three-way `isWinePrefixPath()` guard (platform + compatdata + pfx) was the right abstraction — all future callers get case-folding automatically, zero callsite changes
- **TDD RED/GREEN commits:** All three fs wrapper tasks used explicit failing-test then passing-implementation commits — clean signal, easy bisect, verified behaviour before closing plans
- **Phase 14 before Phase 13:** Executing Phase 14 (fs shim) before Phase 13 (save transfer) meant Phase 13 could simply use the shim rather than duplicate the case-folding logic. Dependency-aware execution ordering paid off.
- **Integration chain verification:** All 6 cross-phase integration checks PASSED — source tracing confirmed end-to-end wiring before archiving. Zero integration surprises.
- **_setNotifier mirrors _setSpawner:** Consistent injectable seam pattern across `elevated.ts` — discoverable, testable, and defensive with optional chaining

### What Was Inefficient

- **Phase 11 and 12 SUMMARY one-liners blank:** `gsd-tools summary-extract` returned empty for Phase 11 and 12 — same pattern as v2.0 and v3.0. The YAML frontmatter in those summaries uses `provides:` not `one_liner:` field. Three milestones in a row with this gap.
- **lib/api.d.ts stale:** `resolvePathCase` was added to the source but the pre-generated `packages/vortex-api/lib/api.d.ts` was not regenerated. TypeScript consumers won't see the type until the next full build. A build step was omitted.
- **VALIDATION.md missing for phases 11/13/14:** Nyquist compliance was not assessed for 3 of 4 phases. Phase 12 had a VALIDATION.md but `nyquist_compliant: false`. Validation infrastructure exists but was not wired into execution for these phases.

### Patterns Established

- **Wine prefix path scope guard:** `isWinePrefixPath()` three-way conjunction (platform + `/compatdata/` + `/pfx/`) is the canonical pattern for scoping Linux-only Wine path operations
- **Fs shim at module level:** Wrap at `fs.ts` source level, not per-callsite — avoids drift as new callers are added
- **TDD commit pair:** RED commit (failing tests) then GREEN commit (implementation) — every fs wrapper task used this pattern; it's the right approach for shim-level work
- **`fileName.toLowerCase()` in watch handlers:** inotify event filenames arrive from OS outside the shim — `.toLowerCase()` in watch handlers must stay permanently (D-11)

### Key Lessons

1. **SUMMARY.md one-liners — fourth milestone with this gap.** The `one_liner:` field is not populated when summaries use the new YAML schema with `provides:` instead. Either standardise on `one_liner:` or update gsd-tools to extract from `provides:`. Address before v5.0.
2. **Regenerate .d.ts files when promoting code to vortex-api.** Adding a function to `util/api.ts` requires `packages/vortex-api/lib/api.d.ts` to be regenerated. This is a build step, not a code step — it needs to be in the plan's task list explicitly.
3. **VALIDATION.md should be created at plan-start, not retroactively.** Three phases had no VALIDATION.md. The Nyquist workflow (`/gsd-validate-phase`) creates it retroactively, but the value is in having it during execution. Include VALIDATION.md creation as the first task in every plan.
4. **Transparent shims > per-callsite fixes.** The `resolvePluginsFilePath` workaround in PluginPersistor was the right surgical fix for v3.0, but a transparent fs shim in v4.0 made it obsolete and eliminated 7+ future per-callsite patches. Design for the shim layer when the problem is cross-cutting.

### Cost Observations

- Model mix: Sonnet 4.6 (primary execution + verification + integration check), Opus 4.6 (planning)
- Sessions: ~4 sessions on 2026-04-07
- Notable: Phase 14 and Phase 13 were executed in a single day with zero blockers; integration checker confirmed all 6 cross-phase wiring points clean

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Sessions | Phases | Key Change |
|-----------|----------|--------|------------|
| v1.0 | ~5 | 5 | First milestone; research-verified dependency graph; audit-first for uncertain scope |
| v2.0 | ~4 | 3 | CONTEXT.md quality drove Phase 8 precision; SUMMARY.md enforcement gap surfaced |
| v3.0 | ~3 | 2 | Research-driven design eliminated all execution surprises; injectable seam pattern for testability |
| v4.0 | ~4 | 4 | Fs shim pattern over per-callsite fixes; TDD RED/GREEN commit pairs; integration checker confirmed all wiring |

### Cumulative Quality

| Milestone | Tests Added | Zero-Dep Linux Additions | CI Platforms |
|-----------|-------------|--------------------------|--------------|
| v1.0 | 22+ (Vitest) | 5 phases, 0 Windows regressions | ubuntu-latest + windows-latest |
| v2.0 | 16 (desktop escaping) + main process suite | 3 phases, 0 Windows regressions | ubuntu-latest + windows-latest |
| v3.0 | 7 (elevated.test.ts) + gameSupport stubs | 2 phases, 0 Windows regressions | ubuntu-latest + windows-latest |
| v4.0 | 21 (elevated) + 22 (fs) + 6 (resolvePathCase) = 49 | 4 phases, 0 Windows regressions | ubuntu-latest + windows-latest |

### Top Lessons (Verified Across Milestones)

1. **Alias at the build boundary** — resolve module substitutions in webpack/rolldown config, not in source files
2. **Audit before implementing** — characterise scope of uncertain requirements before coding; often reveals the requirement is smaller than assumed
3. **SUMMARY.md is a first-class deliverable** — missing summaries surface as gaps at milestone close; write the one-liner properly at plan-close time
4. **Document platform-specific constants** — `steamuser`, `compatdata`, `steamapps` naming conventions belong in CONTEXT.md before execution, not discovered during debugging
5. **Research-driven design eliminates surprises** — pitfalls documented in CONTEXT.md/RESEARCH.md before coding are pitfalls avoided; all v3.0 major pitfalls were pre-documented
6. **Injectable seams for OS-calling code** — spawner parameter in `runElevated()` enables clean Vitest coverage without mock pollution; generalises to any platform-dependent utility
7. **Transparent shims > per-callsite fixes** — when a cross-cutting problem affects N callsites, design the shim layer first; per-callsite workarounds become obsolete automatically
8. **SUMMARY.md one-liner field** — four milestones with blank one-liners due to schema mismatch; standardise `one_liner:` field or update gsd-tools extraction before v5.0
