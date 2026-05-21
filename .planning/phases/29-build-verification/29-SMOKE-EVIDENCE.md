# Phase 29 — Smoke evidence

Captured 2026-05-22 on `v8.0/config-bucket` per D-29-06.

| Field               | Value                           |
| ------------------- | ------------------------------- |
| Branch              | `v8.0/config-bucket`            |
| HEAD at run         | `a89e1b6be` (post 29-05 commit) |
| Vortex version      | 1.16.8                          |
| Electron            | 42.0.0                          |
| Platform            | Linux (Ubuntu 24.04.4 LTS)      |
| Node (pnpm runtime) | v22.22.1                        |

---

## SYNC-33 part A — `pnpm run start` (from source)

**Command:** `pnpm run start` (from package.json: `pnpm -F @vortex/main run start` → electron 42 + LD_LIBRARY_PATH gamebryo path)
**Boot start:** 2026-05-22 09:15:46 (log timestamp `2026-05-21T23:15:46.965Z` UTC)
**Wall-clock to first render:** ~16 s (last render-side log line at 23:16:02 — `gamemode-activated` for skyrimse)
**Result:** **PASS**

### Window evidence

Vortex main window opened. `wmctrl -l` confirms a window titled "Vortex" came up alongside the existing IDE/Steam tabs:

```
0x03000009  0 Rome Vortex
```

Screenshot: skipped per Alex's call (window-open evidence already captured via `wmctrl -l` + 132 extensions in the boot log + `gamemode-activated` for skyrimse). The D-29-06 screenshot capture stays optional for from-source boots; AppImage + .deb boots in 29-08 and the Skyrim SE smoke in 29-09 are where visual evidence is load-bearing.

### Extension manager — `≥130` floor cleared

```
$ grep -c 'loaded extension' /tmp/boot-29-06.log
132
```

132 extensions loaded — matches the `bundledPlugins/` count from SYNC-21 (Plan 29-03). First three + last three:

```
2026-05-21T23:15:51.622Z [DEBG] [RENDERER] loaded extension {"name":"changelog-dashlet",...}
2026-05-21T23:15:51.623Z [DEBG] [RENDERER] loaded extension {"name":"collections",...}
2026-05-21T23:15:51.623Z [DEBG] [RENDERER] loaded extension {"name":"common-interpreters",...}
...
2026-05-21T23:15:51.655Z [DEBG] [RENDERER] loaded extension {"name":"test-setup",...}
2026-05-21T23:15:51.656Z [DEBG] [RENDERER] loaded extension {"name":"theme-switcher",...}
2026-05-21T23:15:51.656Z [DEBG] [RENDERER] loaded extension {"name":"titlebar-launcher",...}
```

### Error/warning summary (first 30 s of boot)

| Severity                           | Count | Notes                                                                                                     |
| ---------------------------------- | ----: | --------------------------------------------------------------------------------------------------------- |
| Renderer crash / fatal / unhandled | **0** | Zero `fatal`/`unhandled`/`crashed`/`stack trace` lines.                                                   |
| `[ERRO]` lines                     |    13 | All in 3 known-benign categories — see below.                                                             |
| `[WARN]` lines                     |    26 | Informational (linux non-nxm protocol guard, hotkey collisions, missing GeDoSaTo registry on Linux, etc.) |

#### `[ERRO]` triage — all known-benign on Linux

1. **Auto-updater 404 (1 occurrence)** — `Cannot find latest-linux.yml in the latest release artifacts (https://github.com/Nexus-Mods/Vortex/releases/download/v2.0.2/latest-linux.yml)`. Upstream Nexus-Mods/Vortex does not publish Linux release metadata; the auto-updater is checking against the upstream URL the fork inherited. Caught as `HttpError 404`, not a renderer crash. Phase 30 forward-port note: a Linux update channel (or just disabling the upstream check on Linux) is candidate hotfix material outside Phase 29 scope.

2. **`error installing dev tools "install is not a function"` (1 occurrence)** — pre-existing devtron / Electron 42 incompatibility. Dev-tools are an opt-in nicety; failing to install them does not affect the running app.

3. **`failed to use game support plugin` — Windows-only games (11 occurrences)** — game-support extensions explicitly throw `"Currently only discovered on windows"` for: `dragonage`, `dragonage2`, `neverwinter2`, `nwn`, `stardewvalley`, `survivingmars`, `thesims3`, `thesims4`, `witcher`, `witcher2`, `worldoftanks`. **This is the Linux platform guard pattern working as designed** — these games rely on Windows-only registry / installer detection and refuse to register a discovery handler on Linux. The errors are caught at the extension-manager level and the rest of the extensions load normally.

None of the 13 errors prevent the main window from rendering or interaction. Skyrim SE was successfully `gamemode-activated` at the end of the boot block — confirms full-stack activation works for at least one Linux-supported gamebryo title.

### Boot tail (last 5 lines)

```
2026-05-21T23:16:02.408Z [DEBG] [RENDERER] [checking staging folder] {"gameMode":"skyrimse"}
2026-05-21T23:16:02.408Z [DEBG] [RENDERER] [checking staging folder] {"stagingPath":"/media/alex/intel/Vortex/SkyrimSE","vortexPath":"/home/alex/src/Vortex/src/main","gamePath":"/media/alex/intel/SteamLibrary/steamapps/common/Skyrim Special Edition"}
2026-05-21T23:16:02.431Z [DEBG] [RENDERER] all checks completed {"event":"settings-changed"}
2026-05-21T23:16:02.492Z [INFO] [MAIN] Update channel changed {"channel":"stable","manual":false}
2026-05-21T23:16:02.630Z [DEBG] [RENDERER] all checks completed {"event":"gamemode-activated"}
```

### Verdict

**SYNC-33 part A: PASS** — `pnpm run start` from `v8.0/config-bucket` HEAD `a89e1b6be` boots Vortex on Linux. Main window opens, 132 extensions load (≥130 floor cleared), zero renderer crashes, and Skyrim SE auto-activates from prior session state. The 13 `[ERRO]` lines are all known-benign categories (upstream-Linux gap + Windows-only-game guards).

---

## SYNC-33 part B — AppImage CI build

_To be filled by Plan 29-07._

---

## SYNC-33 part C — AppImage + .deb local boot

_To be filled by Plan 29-08._

---

## SYNC-34 — Skyrim SE 5-min smoke

_To be filled by Plan 29-09._
