# Phase 35 Research

**Researcher:** sonnet
**Date:** 2026-05-23
**Branch:** v8.1/config-bucket
**HEAD:** `e42807fae` (`docs(state): record phase 35 context session`)

---

## Headline finding

The renderer-side `DownloadManager.ts` (2882 lines) and `DownloadObserver.ts` (1272 lines) are **completely orphaned externally**. There is **zero non-test, non-comment external import** of `DownloadManager` / `DownloadObserver` / `FileAssembler` / `SpeedCalculator` symbols anywhere in `src/`. The 4154-line download-management spine carried over from upstream `8b5a9f675` is dead code waiting to be deleted.

**Branch A (delete-and-rewire) confirmed.** Σ(significant-difficulty callers) = 0. The "rewire" half of branch A is a no-op — there's nothing to rewire. The replacement spine (`src/main/src/downloading/manager.ts` + `src/renderer/src/IPCDownloadAdapter.ts`) is already wired into `ExtensionManager.ts:822` and is the live download path.

---

## 1. Download_management caller map

**Search method:**

```bash
rg -n "from ['\"]\\./(DownloadManager|DownloadObserver|FileAssembler|SpeedCalculator)['\"]" src/
rg -ln "DownloadManager|DownloadObserver|FileAssembler|SpeedCalculator" src/
```

| Importer file                                                            | Imported symbol                                                              | Usage summary                                                               | Upstream replacement                                                                        | Rewire difficulty                |
| ------------------------------------------------------------------------ | ---------------------------------------------------------------------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | -------------------------------- |
| `src/renderer/src/extensions/download_management/DownloadManager.ts:23`  | `FileAssembler` (default) from `./FileAssembler`                             | Internal use within the dead `DownloadManager` class — no external consumer | none — file is being deleted                                                                | **trivial** (delete with parent) |
| `src/renderer/src/extensions/download_management/DownloadManager.ts:24`  | `SpeedCalculator` (default) from `./SpeedCalculator`                         | Internal use within the dead `DownloadManager` class — no external consumer | none — file is being deleted                                                                | **trivial** (delete with parent) |
| `src/renderer/src/extensions/download_management/DownloadObserver.ts:11` | `type RedownloadMode` from `./DownloadManager`                               | Type-only import inside the dead `DownloadObserver` class                   | none — file is being deleted                                                                | **trivial** (delete with parent) |
| `src/renderer/src/extensions/download_management/DownloadObserver.ts:12` | `type DownloadManager` (default) from `./DownloadManager`                    | Type-only import; constructor parameter type                                | none — file is being deleted                                                                | **trivial** (delete with parent) |
| `src/renderer/src/extensions/download_management/DownloadObserver.ts:58` | `AlreadyDownloaded`, `DownloadIsHTML` value-imports from `./DownloadManager` | Used at lines 279, 349, 498 inside the dead `DownloadObserver`              | `@vortex/shared/errors` (already exported) — but file is being deleted, so no rewire needed | **trivial** (delete with parent) |
| **External callers of `DownloadManager` / `DownloadObserver`**           | —                                                                            | **NONE** — verified by `rg -ln` repo-wide                                   | —                                                                                           | —                                |

**External-reference audit (the critical evidence):**

```
$ rg -ln 'DownloadManager|DownloadObserver|FileAssembler|SpeedCalculator' src/
src/main/src/downloading/manager.test.integration.ts   ← upstream main-side DownloadManager class (different file)
src/main/src/downloading/manager.ts                    ← upstream main-side DownloadManager class
src/main/src/downloading/ipc.ts                        ← upstream main-side
src/main/src/main.ts                                   ← imports from "./downloading/manager", NOT renderer
src/shared/src/types/state.ts                          ← comment only (line 9)
src/shared/src/types/preload.ts                        ← comment only (line 451: "API for interacting with the DownloadManager in main")
src/renderer/src/IPCDownloadAdapter.ts                 ← comment only (line 407: "matching DownloadObserver behaviour")
src/renderer/src/extensions/browse_nexus/views/BrowseNexusPage.tsx  ← comment only (line 153)
src/renderer/src/extensions/download_management/DownloadManager.ts  ← self
src/renderer/src/extensions/download_management/DownloadObserver.ts  ← self
src/renderer/src/util/util.ts                          ← comment only (line 204)
src/renderer/src/extensions/nexus_integration/selectors.test.ts  ← comments only (lines 64, 82)
src/renderer/src/extensions/mod_management/InstallManager.ts  ← comment only (line 486)
```

Every non-self hit outside `src/main/src/downloading/` (which is the _upstream replacement spine_, a different `DownloadManager` class entirely) is a code comment. **No live external import exists.**

**Internal callers within `extensions/download_management/`:**

```
$ grep -rn 'DownloadManager\|DownloadObserver\|FileAssembler\|SpeedCalculator' \
    src/renderer/src/extensions/download_management/views/ \
    src/renderer/src/extensions/download_management/util/ \
    src/renderer/src/extensions/download_management/types/ \
    src/renderer/src/extensions/download_management/reducers/ \
    src/renderer/src/extensions/download_management/actions/ \
    src/renderer/src/extensions/download_management/selectors.ts \
    src/renderer/src/extensions/download_management/index.ts
(no output)
```

**The extension's own `index.ts` (1222 lines) does not import `DownloadManager` or `DownloadObserver` either.** The dead files are not registered into the extension manager via `index.ts`. They are pure orphans.

The only import site for the dead pair: `DownloadObserver.ts` imports `DownloadManager.ts`. That's it. Two files referencing each other, no third caller.

---

## 2. Upstream replacement map

The upstream replacement spine is **already on the branch and live**:

| Layer                | File                                                                                                       | Status                                                                                                              | Role                                                                                                                                 |
| -------------------- | ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Main spine           | `src/main/src/downloading/manager.ts` (1075 lines)                                                         | clean (Phase 34 D-34-14: main bucket = 0 errors)                                                                    | `class DownloadManager` (different from renderer) — IPC service backbone                                                             |
| Main IPC             | `src/main/src/downloading/ipc.ts`                                                                          | clean                                                                                                               | IPC channel wiring                                                                                                                   |
| Main support         | `src/main/src/downloading/{chunking,errors,progress,resolver,retry,downloader}.ts` + `cookies.electron.ts` | clean                                                                                                               | Chunking/progress/cookies/retry primitives                                                                                           |
| Main bootstrap       | `src/main/src/main.ts:48,283`                                                                              | clean                                                                                                               | Instantiates `new DownloadManager({ concurrency: 3 })` and registers IPC handlers                                                    |
| Renderer bridge      | `src/renderer/src/IPCDownloadAdapter.ts` (793 lines)                                                       | clean (Phase 34 renderer-filtered = 0)                                                                              | `class IPCDownloadAdapter` — full renderer-side download surface                                                                     |
| Renderer wiring      | `src/renderer/src/ExtensionManager.ts:37,711,822,1180`                                                     | clean                                                                                                               | `private mDownloadAdapter: IPCDownloadAdapter` — instantiated at constructor; `registerProtocol()` extension API forwards to adapter |
| Shared IPC contract  | `src/shared/src/types/preload.ts:451` (`DownloaderApi`)                                                    | clean                                                                                                               | Wire-format types (`WireDownloadState`, `WireResolvedResource`, `WireDownloadCheckpoint`)                                            |
| Shared error classes | `src/shared/src/types/errors.ts:257,281` (`AlreadyDownloaded`, `DownloadIsHTML`)                           | clean — already used by `IPCDownloadAdapter`, `DownloadView.tsx`, `nexus_integration/{eventHandlers,util,index}.ts` | The right import path: `@vortex/shared/errors`                                                                                       |

**Per-call rewire targets:** none required. Branch A is delete-only on the renderer side. The renderer extension's `index.ts` registers reducers/views/columns; the actual download IPC is handled by `IPCDownloadAdapter` instantiated by `ExtensionManager`. No glue code is needed.

**`IDownload.chunks` field disposition:** The shape mismatch (TS2339 errors at `DownloadObserver.ts:512,1066`) is irrelevant — those references die with the file. `IPCDownloadAdapter` does not consume `chunks` from `IDownload`; it consumes `WireDownloadState` from the IPC channel. The Phase 25 SYNC-14 D-25-11 deferral expires here cleanly.

**`extensions/download_management/types/IDownload.ts` evolution:** Not touched in scope. The type definition lives in `types/IDownload.ts` and continues to be used by the extension's own views (`DownloadView`, etc.) and by `IPCDownloadAdapter` (which imports `downloadProgress`, `setDownloadHash`, etc. from `extensions/download_management/actions/state`). The type is stable; the dead files were the only remaining `chunks`-dependent code.

---

## 3. Branch decision (D-35-01)

**Recommendation:** **Branch A — delete-and-rewire** (rewire half = no-op).

**Σ(significant) =** 0 (zero callers; 4 orphans with internal-only references)

**Rationale:**

1. The 4 dead files (`DownloadManager.ts`, `DownloadObserver.ts`, plus the already-missing `FileAssembler.ts` and `SpeedCalculator.ts` they reference) form a closed graph. `DownloadObserver` imports `DownloadManager`; nothing else imports either.
2. The extension's own `index.ts` does not register or instantiate them — confirmed by zero hits in `grep -n 'DownloadManager\|DownloadObserver' index.ts`. They are not part of the extension's public surface.
3. The upstream replacement (`IPCDownloadAdapter` + `src/main/src/downloading/manager.ts`) is already operational on the branch — Phase 34 D-34-14 confirmed main-bucket and renderer-filtered both at 0 errors.
4. `AlreadyDownloaded` / `DownloadIsHTML` consumers (`nexus_integration/eventHandlers.ts`, `util.ts`, `index.tsx`, `views/DownloadView.tsx`, `IPCDownloadAdapter.ts`) all already import from `@vortex/shared/errors` — they do **not** depend on the legacy re-export from `./DownloadManager`.

**Concrete changes:**

- **Delete:**
    - `src/renderer/src/extensions/download_management/DownloadManager.ts` (2882 lines)
    - `src/renderer/src/extensions/download_management/DownloadObserver.ts` (1272 lines)
- **Edit:** none required (the extension `index.ts` and all sibling files already do not reference the deleted symbols)
- **New:** none

**Estimated diff:** **−4154 LOC, +0 LOC** in a single `git rm` commit.

**Suggested commit shape:**

```
chore(download_management): drop dead DownloadManager + DownloadObserver — superseded by IPCDownloadAdapter
```

**Verification on completion:**

- `pnpm tsc -p src/renderer/tsconfig.json --noEmit 2>&1 | grep -v TS1185 | wc -l` → 0
- `git grep -n "from .*DownloadManager\|from .*DownloadObserver\|from .*FileAssembler\|from .*SpeedCalculator" src/` → only the now-deleted files (zero hits post-delete)

**Bluebird-trap audit (D-35-03):** N/A — branch A removes the bluebird-importing files entirely. No `:Promise<void>` annotations to add. Trap cannot fire.

---

## 4. Verification surface (Waves 2-7)

### Wave 2 — Typecheck (SYNC-35a)

- **Script:** `pnpm run typecheck` (root) → `pnpm nx run-many -t typecheck` → fans out to per-workspace `typecheck` scripts
- **Per-workspace pattern:** each workspace (`src/main`, `src/renderer`, `src/preload`, `src/shared`) has `"typecheck": "pnpm tsc"` or `"typecheck": "pnpm tsc -p tsconfig.json"`
- **6 buckets** (per Phase 34 D-34-14 evidence):
    1. `src/shared/tsconfig.json`
    2. `src/preload/tsconfig.json`
    3. `src/main/tsconfig.json`
    4. `src/renderer/tsconfig.json` ← **the bucket Phase 35 closes**
    5. `.github/actions/fingerprints/tsconfig.json`
    6. `packages/e2e/tsconfig.json`
- **Per-bucket command** (carried from Phase 34 L3 surface): `pnpm tsc -p <ws>/tsconfig.json --noEmit 2>&1 | grep -v TS1185 | wc -l == 0`
- **Phase 34 baseline (e42807fae anchor):** shared=0, preload=0, main=0, renderer=9 (all in `download_management/`), fingerprints=0, e2e=0
- **Post-Wave-1 expectation:** renderer=0; aggregate `pnpm run typecheck` exit 0

### Wave 3 — Lint (SYNC-35b)

- **Script:** root `pnpm lint` = `pnpm -r run lint`; per-workspace `lint` = `pnpm eslint --concurrency auto .` (in main, renderer, preload, shared)
- **CI variant:** `pnpm lint:ci` = `pnpm lint:quiet` = `pnpm -r run lint:quiet`
- **fork/master baseline capture:** **not yet measured.** Plan-phase needs to capture before any reconciliation work — recommended Wave 0 task: `git stash && git checkout fork/master 2>/dev/null || git checkout master; pnpm lint 2>&1 | tail -20`. Note: `fork/master` may not exist as a remote ref in sandbox — use `master` (defaultBase per `nx.json`).
- **Pass criterion (D-35-05):** `v8.1/config-bucket errors ≤ master baseline` AND `pnpm lint:ci` exit 0. Pre-existing master errors are not regressions.
- **Artifact:** `35-LINT-BASELINE.md` (mirrors v8.0 P29 — note: `.planning/milestones/v8.0-phases/29-build-verification/` is empty in current tree, so plan-phase should treat the v8.0 P29 reference as a structural-pattern hint, not a literal-file template; the pattern is "capture baseline + parity proof in a single artifact").

### Wave 4 — Test (SYNC-35c)

- **Script:** `pnpm test` = `pnpm vitest run --coverage`
- **Vitest projects** (from `vitest.config.ts` root):
    - `./src/**/vitest.config.ts` → matches `src/main/vitest.config.ts`, `src/renderer/vitest.config.mts`, `src/shared/vitest.config.ts`
    - `./src/main/vitest.downloader.config.ts` (additional explicit project — main downloader integration tests)
    - `./packages/**/vitest.config.ts`
    - `./extensions/**/vitest.config.ts`
    - `./scripts/vitest.config.ts`
- **Jest:** root `jest.config.mjs` exists (jsdom env, `testRegex: (/__tests__/.*|\.(test|spec))\.(js|jsx|ts|tsx)$`) **but is not invoked by `pnpm test`** — Phase 35 SYNC-35c says "Vitest + Jest", but the `pnpm test` script only runs Vitest. Two interpretations:
    - **Strict:** SYNC-35c requires invoking Jest separately (e.g. `pnpm exec jest`) and proving exit 0
    - **Pragmatic:** The Jest config is a vestige (R2 dropped `__mocks__/` in Phase 34 H1; `jest.config.mjs` references `<rootDir>/__mocks__/cheerio.js` etc. which were just deleted). Jest is no longer functional without those mocks; SYNC-35c effectively reduces to "Vitest exit 0".
- **Recommendation for plan-phase:** treat as **pragmatic** — note in plan that Jest is orphaned (followup R4 candidate for Phase 36+ cleanup). Phase 35 SYNC-35c PASS = Vitest exit 0 only. Document this disposition in 35-VERIFY-RESULTS.md.
- **E2E:** `packages/e2e` uses Playwright (`"test": "playwright test"`), not Vitest/Jest — separately invoked via `pnpm e2e`. **Out of scope** for SYNC-35c (CONTEXT § "Out of scope" defers UAT to Phase 999.1/37).

### Wave 5 — Build (SYNC-35d)

- **Script:** `pnpm build` = `pnpm run typecheck && pnpm --filter "@vortex/*" --filter "@nexusmods/*" --filter "./packages/**" --filter "!@vortex/e2e" --filter "!vortex-api" -r run build`
- **Composite:** `pnpm build:all` = `pnpm build && pnpm build:extensions && pnpm assets`
- **Per-workspace builders:**
    - `src/main`: `pnpm cross-env NODE_ENV=development node ./build.mjs` (rolldown)
    - `src/renderer`: `pnpm cross-env NODE_ENV=development pnpm webpack --config ./webpack.config.cjs`
    - `src/preload`: `node ./build.mjs`
    - `src/shared`: `pnpm tsdown`
    - `extensions/**`: per-extension `pnpm build` (133 `build: Done` markers in v8.0 P29)
- **bundledPlugins floor (D-35-08):** **CURRENT COUNT = 132** (verified just now: `ls src/main/build/bundledPlugins/ | wc -l == 132`). Floor = 130. **PASS condition holds with margin of 2.** Document in 35-VERIFY-RESULTS.md.
- **Native-dep webpack warnings:** `vortexmt` and similar native-only deps emit non-fatal warnings on `pnpm build` for renderer — same as v8.0 D-29-XX, ignore.

### Wave 6 — Orphan reconcile (SYNC-35e)

- **Pre-deletion check (D-35-04):**

```
$ rg -n "electron-builder.config.json" -g "!.planning/**" -g "!**/node_modules/**" -g "!**/out/**" -g "!**/dist/**"
structure.md:27:- `src/main/electron-builder.config.json`: electron-builder packaging config
flatpak/com.nexusmods.vortex.yaml:109:      - yarn electron-builder --config electron-builder-config.json --publish never --linux dir
```

- **Reference analysis:**
    - `structure.md:27` — **documentation reference only**, listing the file as "electron-builder packaging config". Plan-phase should update this line in the same commit as the `git rm` (delete the line, since the file no longer exists). Trivial follow-on edit.
    - `flatpak/com.nexusmods.vortex.yaml:109` — references **`electron-builder-config.json`** (hyphenated, not dotted). This is a **different filename** and not the orphan in question. Probably a separate stale flatpak reference but **out of scope** for SYNC-35e (the Phase 35 target is `electron-builder.config.json`, dotted).
- **Confirmation:** `src/main/package.json` `package` + `package:nosign` scripts both reference `./electron-builder.config.cjs` — never the `.json`. Genuinely orphan.
- **Concrete changes:**
    - `git rm src/main/electron-builder.config.json` (single file)
    - Update `structure.md:27` to remove the entry (or refresh to point to `.cjs` if doc accuracy is desired — minimize-diff favors removal)
- **Commit:** `chore(electron-builder): drop orphan v2.0.1 config.json — superseded by .cjs`

### Wave 7 — Done-gate

D-35-10 SYNC-35a–e checklist as written. No new surface to research.

---

## 5. Risks for the planner

1. **`pnpm test` Jest disposition** — SYNC-35c says "Vitest + Jest", but `pnpm test` only runs Vitest, and Jest's `jest.config.mjs` references `__mocks__/` files that Phase 34 H1 deleted. Plan-phase must explicitly choose "Vitest only (Jest orphaned, deferred to followup)" or add a separate `pnpm exec jest` invocation as part of Wave 4 — and decide whether a Jest run that errors on missing mocks is a Phase 35 blocker or a separate R4 cleanup. **Recommendation:** treat as pragmatic Vitest-only PASS, document Jest as orphan in 35-VERIFY-RESULTS.md, defer Jest config deletion to Phase 36+ followup. This is a **scope ambiguity risk**, not a technical risk.

2. **`fork/master` lint baseline drift** — `nx.json` says `defaultBase: master`, and the project memory notes only `master` and `linux-port` as fork branches. `fork/master` may not be a literal remote ref. Plan-phase should resolve this in Wave 0: capture baseline against whichever ref the team treats as canonical (almost certainly `master`). If `master` lint baseline has drifted significantly since v8.0 P29 (e.g. new oxfmt rules, new ESLint plugin), the parity comparison may surface deltas that look like regressions but are baseline shifts. **Recommendation:** capture baseline first thing in Wave 3 before any download_management deletion; the deletion changes lint surface (4154 lines of legacy code disappear), so post-delete count will naturally drop. Frame it as "v8.1 errors ≤ master baseline" not "v8.1 errors == master baseline".

3. **Renderer webpack build tolerance for the deletion** — `src/renderer/webpack.config.cjs` may have an entry-point or chunk reference that mentions `download_management/DownloadManager` or `DownloadObserver` (e.g. dynamic-import preload). Branch A trusts that webpack scans entry points for live imports only — which the rg evidence supports — but plan-phase should verify with a single `grep -n "DownloadManager\|DownloadObserver" src/renderer/webpack.config.cjs` before the delete commit. **Probability: very low** (no evidence of such reference in import audit), but a 30-second check costs nothing.

4. **`extensions/download_management/types/IDownload.ts` `chunks` field** — Phase 25 SYNC-14 restored these files at the moment when `IDownload.chunks` was the live shape; v2.0.1 dropped `chunks` from `IDownload`. The renderer `IDownload` shape is consumed by other extension code (selectors, views). **The current renderer-bucket = 9 evidence shows the `chunks` references are confined to `DownloadObserver.ts:512,1066`** (only inside the dead file). After deletion, no `IDownload.chunks` references remain. Plan-phase should verify post-delete with `rg -n '\.chunks\b' src/renderer/src/extensions/download_management/` returning 0 hits as a Wave 1 verify step. **Probability of additional surprise hits: low**, but a 30-second check costs nothing.

5. **Atomic-commit cadence vs parent CONTEXT estimate (5–15 commits across all waves)** — branch A collapses Wave 1 from "reconciliation" to a single delete commit. Plan-phase may end up with as few as **3–5 total commits** (Wave 1 delete + Wave 6 orphan delete + per-wave SUMMARYs + closeout). The Phase 34 cadence pattern suggests planning for `chore(state)` per-wave-complete markers anyway to maintain audit shape — but the work itself is much smaller than CONTEXT anticipated. **Recommendation:** plan-phase should adjust Wave 1 from "download_management reconciliation" to "download_management deletion + post-delete verification", and revise the commit-count target downward.

---

## Appendix: command transcripts used

```
$ rg -n "from ['\"]\\./(DownloadManager|DownloadObserver|FileAssembler|SpeedCalculator)['\"]" src/
src/renderer/src/extensions/download_management/DownloadManager.ts:23:import FileAssembler from "./FileAssembler";
src/renderer/src/extensions/download_management/DownloadManager.ts:24:import SpeedCalculator from "./SpeedCalculator";
src/renderer/src/extensions/download_management/DownloadObserver.ts:11:import type { RedownloadMode } from "./DownloadManager";
src/renderer/src/extensions/download_management/DownloadObserver.ts:12:import type DownloadManager from "./DownloadManager";
src/renderer/src/extensions/download_management/DownloadObserver.ts:58:import { AlreadyDownloaded, DownloadIsHTML } from "./DownloadManager";

$ rg -ln 'DownloadManager|DownloadObserver|FileAssembler|SpeedCalculator' src/
src/main/src/downloading/manager.test.integration.ts
src/main/src/downloading/manager.ts
src/main/src/downloading/ipc.ts
src/main/src/main.ts
src/shared/src/types/state.ts
src/shared/src/types/preload.ts
src/renderer/src/IPCDownloadAdapter.ts
src/renderer/src/extensions/download_management/DownloadManager.ts
src/renderer/src/extensions/browse_nexus/views/BrowseNexusPage.tsx
src/renderer/src/extensions/download_management/DownloadObserver.ts
src/renderer/src/util/util.ts
src/renderer/src/extensions/nexus_integration/selectors.test.ts
src/renderer/src/extensions/mod_management/InstallManager.ts

$ ls src/main/build/bundledPlugins/ | wc -l
132

$ rg -n "electron-builder.config.json" -g '!.planning/**' -g '!**/node_modules/**' -g '!**/out/**' -g '!**/dist/**'
structure.md:27:- `src/main/electron-builder.config.json`: electron-builder packaging config
flatpak/com.nexusmods.vortex.yaml:109:      - yarn electron-builder --config electron-builder-config.json --publish never --linux dir
```
