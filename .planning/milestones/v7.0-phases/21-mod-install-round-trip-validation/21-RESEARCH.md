# Phase 21: Mod Install Round-Trip Validation - Research

**Researched:** 2026-04-16
**Domain:** Deployment method selection — hardlink_activator isSupported path on Linux for Skyrim SE
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Phase 21 is a code-fix phase. Focus is deploy-method selection: ensure hardlink_activator is available and correctly selected as the default for Skyrim SE on Linux. Same surgical platform-guard pattern as Phases 18–20.
- **D-02:** If the deploy-method code path turns out to already be clean (no blocker found), fallback is "trace + document" — produce a code-complete verification note and add ONBRD-04 UAT steps to Phase 999.1 backlog. Mirrors ELEV-04/05/SAVE-05 precedent.
- **D-03:** Target game is Skyrim SE (`skyrimse`). Already validated for save paths (STAM-03/05) and FOMOD install (Phase 15). Skyrim SE is in the `isGamebryoGame` blocklist in symlink_activator, so hardlink_activator (priority 5) is the natural and expected deploy method on Linux.
- **D-04:** Mod files deploy into the Proton prefix path (`compatdata/<appid>/pfx/drive_c/...`). The case-folding shim from Phase 14 handles Wine prefix path casing. The researcher must verify `getModPaths` for `skyrimse` on Linux returns the correct Proton-prefix-relative path.
- **D-05:** Scope is limited to the deploy-method-selection step.
- **D-06:** hardlink_activator has priority 5 (highest — first in sorted list). symlink_activator has priority 10. Research should confirm whether symlink_activator is correctly excluded on Linux for Gamebryo games and whether hardlink_activator's `isSupported` passes.
- **D-07:** Phase 21 is done when: (a) any deploy-method-selection blockers are fixed with surgical platform guards, AND (b) ONBRD-04 UAT steps are added to the Phase 999.1 backlog entry. ONBRD-04 is marked code-complete (hardware UAT pending) in REQUIREMENTS.md.
- **D-08:** UAT checklist lives in Phase 999.1 backlog (`.planning/phases/999.1-*` or equivalent) — same location as ELEV-04, ELEV-05, SAVE-05 entries. Not a separate checklist file in the phase dir.

### Claude's Discretion

- Exact line(s) that need platform-guarding in hardlink_activator or deploymentMethods.ts.
- Whether `allTypesSupported` needs a Linux-aware path or whether the issue is upstream in `isSupported`.
- Exact wording of the ONBRD-04 UAT steps added to 999.1 backlog.

### Deferred Ideas (OUT OF SCOPE)

- Post-deploy INI/config file writes for Skyrim SE on Linux.
- Symlink activator Linux admin behavior (`ensureAdmin()` on user-owned directories).
- Full E2E hardware UAT pass for ONBRD-04 — tracked in Phase 999.1 backlog.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| ONBRD-04 | User can install a mod, deploy it, and enable it for one Proton game — end-to-end, no config file edits required (human UAT; gates on ONBRD-01 + ONBRD-02) | Code-trace of deploy-method selection chain identifies one real blocker in hardlink_activator.isSupported that fires on first run. Fix path is surgical platform guard. UAT entry goes to 999.1 ROADMAP backlog. |
</phase_requirements>

---

## Summary

Phase 21 is a code-fix + documentation phase. The research traced the full deploy-method-selection chain for Skyrim SE on Linux and found **one real code blocker** and **one clean path** (symlink already correctly excluded).

**Blocker found — hardlink_activator.isSupported, device check, first-run path:**
`hardlink_activator.isSupported` (line 148) calls `fs.statSync(installationPath)` to compare device numbers. `installationPath` is the staging directory resolved via `installPathForGame(state, gameId)`. On first run for a new game, this directory does not exist yet — it is created later inside `ensureStagingDirectory()`, which is called _after_ `getSupportedActivators()` in `onGameModeActivated`. The `statSync` throws ENOENT, the catch block returns `{ description: t("Game not fully initialized yet...") }`, and `getSupportedActivators` returns an empty list. With an empty supported list, no activator is auto-selected, and the deploy button is blocked until the user manually visits Settings → Mods.

**Clean path — symlink_activator:** `symlink_activator.isSupported` checks `isGamebryoGame(gameId)` first and returns an IUnavailableReason immediately for `skyrimse` (it is in the blocklist). The `ensureAdmin()` symlink test is never reached. Symlink is correctly excluded for Skyrim SE on all platforms. No fix needed here.

**winapi import in hardlink_activator:** `winapi.GetVolumePathName` is called only in the "different device" error branch inside the `solution()` callback — a lazy format function, not a blocker path. It is also wrapped in a try/catch. The webpack alias routes `winapi-bindings` to `winapi-shim.ts` on Linux, which provides a working `GetVolumePathName` implementation. Not a blocker.

**`getModPaths` for skyrimse on Linux:** `queryModPath: () => 'Data'` in the game extension returns the relative path `Data`. `getGame()` proxy resolves this to `path.resolve(gamePath, 'Data')` where `gamePath` is the Steam installation path (e.g., `~/.steam/steam/steamapps/common/Skyrim Special Edition`). This is a real Linux filesystem path, not a Proton prefix path. D-04's note about `compatdata/...` applies to save-game and INI paths; the mod deployment target is the game's native `Data/` directory on the Linux filesystem, reachable from the Proton runtime. No fix needed here.

**Primary recommendation:** Add a `process.platform === 'linux'` (or more precisely: a "staging dir may not exist yet") guard in `hardlink_activator.isSupported` so that a missing staging directory on Linux does not cause hardlink to appear unsupported. The simplest fix is to skip the device-check (return `undefined` = supported) when `fs.statSync(installationPath)` throws ENOENT on Linux, deferring the actual device check to when the staging dir is created.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Deployment method selection | Renderer (Redux/Extension) | — | `getSupportedActivators` / `getCurrentActivator` live in the renderer extension system; state is Redux-resident |
| hardlink isSupported check | Renderer (Extension: hardlink_activator) | — | Synchronous check against filesystem state at activator-selection time |
| Staging directory creation | Renderer (Extension: mod_management) | — | `ensureStagingDirectory` creates the dir; called from `onGameModeActivated` initProm chain |
| Mod paths (getModPaths) | Renderer (Extension: gamemode_management) | — | `getGame()` proxy wraps `queryModPath` + registered mod type extensions |
| Wine prefix path casing | Renderer (fs shim, Phase 14) | — | `resolvePathCase` handles case-folding in `LinkingDeployment`; not relevant to isSupported |
| UAT backlog entry | Planning / ROADMAP | — | ROADMAP.md 999.1 backlog section |

---

## Standard Stack

No new libraries are introduced. Phase 21 uses the existing deployment extension infrastructure.

### Core
| Component | Location | Purpose |
|-----------|----------|---------|
| `hardlink_activator` | `src/renderer/src/extensions/hardlink_activator/index.ts` | Hardlink deployment (priority 5) |
| `symlink_activator` | `src/renderer/src/extensions/symlink_activator/index.ts` | Symlink deployment (priority 10) — blocked for Gamebryo |
| `deploymentMethods.ts` | `src/renderer/src/extensions/mod_management/util/deploymentMethods.ts` | `getSupportedActivators`, `getCurrentActivator`, priority sort |
| `allTypesSupported.ts` | `src/renderer/src/extensions/mod_management/util/allTypesSupported.ts` | Per-type error/warning aggregation |
| `eventHandlers.ts` | `src/renderer/src/extensions/mod_management/eventHandlers.ts` | `onGameModeActivated` — triggers activator selection |
| `winapi-shim.ts` | `src/renderer/src/util/winapi-shim.ts` | Linux-functional `GetVolumePathName` equivalent |
| `renderer/webpack.config.cjs` | `src/renderer/webpack.config.cjs` | `process.platform === 'linux'` alias: `winapi-bindings` → `winapi-shim.ts` |

**No installation step.** All packages already present.

---

## Architecture Patterns

### Activator Selection Chain

```
onGameModeActivated (eventHandlers.ts:289)
  ├── getSupportedActivators(state)          ← L298: evaluates isSupported for all activators
  │     └── allTypesSupported(act, state, gameId, modTypes)
  │           └── act.isSupported(state, gameId, typeId)
  ├── getCurrentActivator(state, gameId, true) ← L302: picks first supported (priority sort)
  └── initProm()                             ← L525: called AFTER selection
        └── ensureStagingDirectory()         ← staging dir created HERE (too late)
```

**The timing gap:** `getSupportedActivators` evaluates `isSupported` synchronously before `ensureStagingDirectory` runs. On first run, the staging directory does not exist yet.

### hardlink_activator.isSupported — Linux Path Analysis

```
isSupported(state, gameId, typeId):
  1. discovery?.path == null?              → "Game not discovered" [EXIT]
  2. modPaths[typeId] === undefined?       → return undefined (= supported) [EXIT]
  3. fs.accessSync(modPaths[typeId], W_OK) → throw → "Can't write to output directory" [EXIT]
  4. fs.statSync(installationPath).dev     → *** THROWS ENOENT if staging dir missing ***
     vs fs.statSync(modPaths[typeId]).dev  → → "Game not fully initialized yet" [EXIT] ← BLOCKER
  5. canary hardlink test                  → "Filesystem doesn't support hard links" [EXIT]
  6. return undefined (= supported)
```

**Blocker detail:** Step 4 — `installationPath` = `installPathForGame(state, gameId)`. Default value on Linux: `~/.local/share/Vortex/skyrimse/mods`. This directory is created by `ensureStagingDirectory()` but that function runs after `isSupported` is called. On first run (or after staging dir deletion), `fs.statSync` throws `ENOENT`, the outer `catch` fires, and `isSupported` returns a "not initialized" IUnavailableReason, making hardlink appear unsupported.

### Fix Pattern (Platform-Guard)

Following the established surgical pattern from Phases 18–20: add a Linux-aware branch to the catch block in `hardlink_activator.isSupported`:

```typescript
// Source: hardlink_activator/index.ts — existing catch block at ~line 188
} catch (err) {
  // this can happen when managing the game for the first time
  log("info", "failed to stat. directory missing?", {
    dir1: installationPath || "undefined",
    dir2: modPaths[typeId],
    err: util.inspect(err),
  });
  if (process.platform === "linux" && getErrorCode(err) === "ENOENT") {
    // On Linux, staging dir is created by ensureStagingDirectory() which runs
    // after isSupported is evaluated. Skip device check — hardlinks will be
    // validated when the canary test runs after the dir is created.
    // Fall through to the canary test below.
  } else {
    return {
      description: (t) =>
        t("Game not fully initialized yet, this should disappear soon."),
    };
  }
}
```

**Alternative (simpler):** Change the `catch` to only return "not initialized" on non-ENOENT errors. On ENOENT (directory doesn't exist yet), fall through to the canary test. The canary test will also fail (ENOENT for `installationPath`), but that error is caught separately and treated as "Filesystem doesn't support hard links." This means a second guard is needed in the canary test too.

**Preferred fix:** Treat ENOENT of `installationPath` as "not yet initialized but supported" — return `undefined` (supported) directly when the staging path doesn't exist yet. This is the most correct signal: we don't know if hardlinks are supported yet, but we also can't say they are NOT supported. Returning `undefined` means "no reason to be unsupported."

```typescript
// Correct pattern — in the catch at line 188:
} catch (err) {
  const code = getErrorCode(err);
  if (code === "ENOENT") {
    // Staging directory doesn't exist yet — can't compare devices.
    // Assume supported until proven otherwise (canary test will confirm).
    return undefined;
  }
  log("info", "failed to stat. directory missing?", { ... });
  return {
    description: (t) =>
      t("Game not fully initialized yet, this should disappear soon."),
  };
}
```

Note: `getErrorCode` is already imported from `@vortex/shared` in `hardlink_activator/index.ts`. No new imports needed.

### Recommended Project Structure

No new files. The fix is a single-file edit in `hardlink_activator/index.ts`.

### Anti-Patterns to Avoid

- **Platform-specific guard on a cross-platform bug:** The ENOENT timing issue exists on Windows too (it's caught and reported as "not initialized"). However, on Windows the staging directory is typically created by the profile management step before `onGameModeActivated` fires. On Linux, this timing is different. A cross-platform ENOENT fix (removing the `process.platform === 'linux'` restriction) would be safer and smaller diff. The planner should consider whether to make the fix platform-neutral.
- **Canary test ENOENT secondary issue:** The canary test at line 201 uses `path.join(installationPath, "__vortex_canary.tmp")`. If `installationPath` doesn't exist, `fs.writeFileSync` throws, returning "Filesystem doesn't support hard links." If we return `undefined` at the device-check catch, we still need the canary test to not falsely fail. But since we return `undefined` early in the device-check catch, we never reach the canary test — so the canary secondary issue doesn't apply to the preferred fix.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead |
|---------|-------------|-------------|
| Error code extraction | `err.code === 'ENOENT'` directly | `getErrorCode(err)` from `@vortex/shared` (already used in same file) |
| Platform detection | Environment variable checks | `process.platform === 'linux'` (established pattern in codebase) |

---

## Common Pitfalls

### Pitfall 1: Making the Fix Platform-Specific When It Isn't

**What goes wrong:** Adding `process.platform === 'linux'` to the ENOENT catch makes the fix only apply on Linux. But the same first-run timing issue theoretically exists on Windows too.
**Why it happens:** Following the Phase 18–20 platform-guard pattern reflexively.
**How to avoid:** Assess whether the bug is Linux-specific (timing) or cross-platform (logic). In this case, the ENOENT case is arguably a cross-platform logic fix: "ENOENT means staging dir doesn't exist yet, not that hardlinks are unsupported" is platform-agnostic. However, making it platform-neutral increases the diff against upstream. Decide based on the surgical principle.
**Warning signs:** The phrase "not fully initialized yet" in the existing error suggests upstream already considered this a transient state.

### Pitfall 2: Returning `undefined` Without Canary Fallback

**What goes wrong:** If `undefined` is returned for ENOENT in the device-check, the canary test is never reached. But `undefined` means "supported" — the activator is selected. At actual deploy time, `isSupported` is called again (now with the staging dir existing), and if the device check would have failed (different devices), the deploy fails with a confusing error.
**Why it happens:** The `isSupported` call at selection time is an optimization hint; the actual deploy path calls `getCurrentActivator(state, gameId, false)` which also calls `isSupported`.
**How to avoid:** The staging dir exists by deploy time (created in initProm). The second call to `isSupported` at deploy time will have the dir available and the device check will run correctly then. The ENOENT-skip is only needed at the initial selection moment.
**Warning signs:** This is acceptable behavior — it matches the comment "this should disappear soon" which implies the condition is transient.

### Pitfall 3: Modifying `allTypesSupported.ts` Instead of `isSupported`

**What goes wrong:** Trying to fix the issue at the `allTypesSupported` level by skipping device-check errors.
**Why it happens:** Confusing where the fix belongs.
**How to avoid:** The fix belongs in `hardlink_activator.isSupported`. `allTypesSupported` is a generic aggregator that just checks whether `isSupported` returned a reason or not. The right place to say "ENOENT is not a real unsupported reason" is in `isSupported` itself.

### Pitfall 4: Forgetting the 999.1 UAT Backlog Entry

**What goes wrong:** Phase completes with only a code fix and no 999.1 entry, leaving ONBRD-04 in an ambiguous state.
**Why it happens:** The code fix feels complete.
**How to avoid:** D-07 is explicit: 999.1 backlog entry is required for phase completion. The format follows ELEV-04/SAVE-05 precedent.

---

## Code Examples

### Existing Catch Block (Blocker)

```typescript
// Source: src/renderer/src/extensions/hardlink_activator/index.ts ~line 188
} catch (err) {
  // this can happen when managing the the game for the first time
  log("info", "failed to stat. directory missing?", {
    dir1: installationPath || "undefined",
    dir2: modPaths[typeId],
    err: util.inspect(err),
  });
  return {
    description: (t) =>
      t("Game not fully initialized yet, this should disappear soon."),
  };
}
```

### Fixed Catch Block

```typescript
// Source: hardlink_activator/index.ts — proposed fix
} catch (err) {
  if (getErrorCode(err) === "ENOENT") {
    // Staging directory doesn't exist yet (first-run or just removed).
    // Can't compare devices — assume supported; actual canary test will run
    // once the directory is created by ensureStagingDirectory().
    return undefined;
  }
  log("info", "failed to stat. directory missing?", {
    dir1: installationPath || "undefined",
    dir2: modPaths[typeId],
    err: util.inspect(err),
  });
  return {
    description: (t) =>
      t("Game not fully initialized yet, this should disappear soon."),
  };
}
```

### 999.1 Backlog Entry Format (from ROADMAP.md)

```markdown
### Phase 999.1: Manual UAT — ELEV-05/ELEV-06 Desktop Linux + Steam Deck Elevation (BACKLOG)

**Goal:** ...
**Requirements:** ELEV-05, ELEV-06, ONBRD-04

ONBRD-04: Install a mod, deploy via hardlink_activator, enable for Skyrim SE on
Proton — end-to-end, no terminal required — code-complete (Phase 21); hardware UAT pending
```

### winapi Mock Pattern for Tests

```typescript
// Source: src/renderer/src/extensions/mod_management/stagingDirectory.test.ts
vi.mock("winapi-bindings", () => ({
  GetVolumePathName: vi.fn(() => "C:\\"),
  default: {
    GetVolumePathName: vi.fn(() => "C:\\"),
  },
}));
```

### REQUIREMENTS.md Update Format

```markdown
- [x] **ONBRD-04**: User can install a mod, deploy it, and enable it for one Proton game
  — end-to-end, no config file edits required — code-complete (Phase 21);
  hardware UAT pending (Phase 999.1)
```

---

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| `hardlink.isSupported` returns "not initialized" on any statSync throw | `hardlink.isSupported` returns `undefined` (supported) on ENOENT specifically | Hardlink is auto-selected on first run |

---

## Runtime State Inventory

> Not applicable — this is a code-fix phase with no rename/rebrand/migration.

---

## Environment Availability

Step 2.6: SKIPPED — Phase 21 is a code-fix + documentation phase. No external tools or services beyond the existing build environment are required. All dependencies (Node.js, pnpm, Vitest) are already confirmed available from prior phases.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.0 |
| Config file | `src/renderer/vitest.config.mts` |
| Quick run command | `pnpm run test --project src/renderer` |
| Full suite command | `pnpm run test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ONBRD-04 | `hardlink_activator.isSupported` returns `undefined` (supported) when staging dir is missing (ENOENT) | unit | `pnpm run test --project src/renderer -- --reporter=verbose src/renderer/src/extensions/hardlink_activator/hardlink_activator.test.ts` | ❌ Wave 0 |
| ONBRD-04 | symlink_activator returns IUnavailableReason for skyrimse (Gamebryo blocklist) | unit | (same file) | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `pnpm run test --project src/renderer`
- **Per wave merge:** `pnpm run test`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `src/renderer/src/extensions/hardlink_activator/hardlink_activator.test.ts` — covers ONBRD-04 hardlink isSupported logic
- [ ] Test assertions: (a) ENOENT in staging dir → returns `undefined`; (b) skyrimse in symlink Gamebryo blocklist → returns IUnavailableReason; (c) non-ENOENT stat error → returns "not initialized" reason

---

## Security Domain

Phase 21 makes no changes to authentication, session management, access control, input validation, or cryptography. The ENOENT guard is a filesystem path check — no new attack surface.

| ASVS Category | Applies |
|---------------|---------|
| V2 Authentication | no |
| V3 Session Management | no |
| V4 Access Control | no |
| V5 Input Validation | no |
| V6 Cryptography | no |

---

## Open Questions

1. **Cross-platform vs. Linux-specific fix**
   - What we know: ENOENT in the device-check catch is a timing issue; on Windows the staging dir is generally created earlier in profile management, so the issue is less likely to manifest.
   - What's unclear: Whether fixing cross-platform (remove platform guard) would break any Windows behavior that relies on the "not initialized" message.
   - Recommendation: Make the fix cross-platform (ENOENT → `undefined`) since the "not initialized" message was already transient anyway. This keeps the upstream diff minimal. Planner can decide.

2. **Canary test on non-existent staging dir**
   - What we know: If we return `undefined` at the ENOENT catch (device check), we never reach the canary test. The staging dir gets created by `ensureStagingDirectory()` later. At deploy time, `isSupported` is called again with the dir existing, and the canary test runs properly.
   - What's unclear: Nothing — the flow is understood.
   - Recommendation: No secondary fix needed for the canary test.

3. **Whether activator re-evaluation happens after `initProm` creates the staging dir**
   - What we know: `onGameModeActivated` evaluates `getSupportedActivators` before `initProm()`. After `initProm()` runs, there is no automatic re-evaluation of activator support.
   - What's unclear: Whether the Redux state change triggered by `setActivator(gameId, ...)` at line 502/511 causes a re-render that re-evaluates support. The Settings.tsx view does re-read `getSupportedActivators` on each render.
   - Recommendation: The fix in `isSupported` (ENOENT → `undefined`) is the right solution regardless. Without the fix, the staging dir's absence at selection time causes no activator to be selected, and the user must manually set it in Settings. With the fix, hardlink is auto-selected on first game activation.

---

## Sources

### Primary (HIGH confidence — verified by code trace)

All findings from direct source code inspection:
- `src/renderer/src/extensions/hardlink_activator/index.ts` — full `isSupported` path traced
- `src/renderer/src/extensions/symlink_activator/index.ts` — `isGamebryoGame` check confirmed
- `src/renderer/src/extensions/mod_management/util/deploymentMethods.ts` — selection chain
- `src/renderer/src/extensions/mod_management/util/allTypesSupported.ts` — aggregator
- `src/renderer/src/extensions/mod_management/eventHandlers.ts` — `onGameModeActivated` sequence
- `src/renderer/src/extensions/mod_management/selectors.ts` — `installPathForGame`
- `src/renderer/src/extensions/mod_management/util/getInstallPath.ts` — default staging path
- `src/renderer/src/extensions/mod_management/stagingDirectory.ts` — creation timing
- `src/renderer/src/util/winapi-shim.ts` — `GetVolumePathName` Linux implementation
- `src/renderer/webpack.config.cjs` — `winapi-bindings` alias confirmed Linux-only
- `extensions/games/game-skyrimse/src/index.js` — `queryModPath: () => 'Data'` confirmed
- `src/renderer/src/extensions/gamemode_management/util/getGame.ts` — `getModPaths` proxy

### Secondary (verified from prior phase documentation)

- Phase 14 case-folding shim — active for Proton prefix paths, not mod Data dir
- Phase 19 ONBRD-02d — `suggestStagingPath()` guides same-device staging selection
- Phase 20 accumulated decisions — `winapi` alias confirmed working in renderer

---

## Assumptions Log

> No assumed claims. All findings verified by direct code inspection.

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| — | — | — | — |

**If this table is empty:** All claims in this research were verified or cited — no user confirmation needed.

---

## Metadata

**Confidence breakdown:**
- Blocker identification: HIGH — code path traced end-to-end
- Fix pattern: HIGH — matches existing `getErrorCode` usage in same file; established catch pattern
- symlink-clean path: HIGH — `isGamebryoGame` check verified in source
- 999.1 UAT format: HIGH — format cross-referenced against ROADMAP.md and PROJECT.md

**Research date:** 2026-04-16
**Valid until:** 60 days (stable code, no external dependencies)
