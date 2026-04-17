---
phase: 19-staging-directory-wiring
reviewed: 2026-04-16T11:11:41Z
depth: standard
files_reviewed: 9
files_reviewed_list:
  - src/renderer/src/extensions/firststeps_dashlet/todos.tsx
  - src/renderer/src/extensions/firststeps_dashlet/todos.test.ts
  - src/renderer/src/extensions/gamemode_management/util/discovery.ts
  - src/renderer/src/extensions/gamemode_management/util/discovery.test.ts
  - src/renderer/src/extensions/mod_management/stagingDirectory.ts
  - src/renderer/src/extensions/mod_management/stagingDirectory.test.ts
  - src/renderer/src/extensions/mod_management/texts.ts
  - src/renderer/src/extensions/mod_management/texts.test.ts
  - src/renderer/src/extensions/mod_management/views/Settings.tsx
findings:
  critical: 0
  warning: 3
  info: 3
  total: 6
status: issues_found
---

# Phase 19: Code Review Report

**Reviewed:** 2026-04-16T11:11:41Z
**Depth:** standard
**Files Reviewed:** 9
**Status:** issues_found

## Summary

This phase adds Linux-aware staging directory wiring: a `findAccessibleAncestor` helper in `stagingDirectory.ts`, device-aware path suggestion in `discovery.ts` (`suggestStagingPath`), a duplicate mountpoint-walk in `Settings.tsx` `suggestPath`, Linux platform guards in `todos.tsx`, and platform-split help text in `texts.ts`. All new code is additive and properly guarded. Three warnings and three info findings are present; no security or data-loss issues were found.

## Warnings

### WR-01: Missing mock for `../../logging` in `stagingDirectory.test.ts`

**File:** `src/renderer/src/extensions/mod_management/stagingDirectory.test.ts:40`
**Issue:** `stagingDirectory.ts` imports `log` from `../../logging` (line 10), which calls `window.api.log(...)` at runtime. The test file mocks `../../util/log` instead — a different module path. The `../../logging` module is never mocked, so any test path that exercises the two `log(...)` calls in `ensureStagingDirectoryImpl` (lines 235, 237) will attempt to call `window.api.log` in the Happy-DOM environment. Happy-DOM does not expose `window.api`, so those calls throw `TypeError: Cannot read properties of undefined (reading 'log')`, making those test branches unreliable if additional coverage is added later.
**Fix:** Add the correct mock before the import block:
```ts
vi.mock("../../logging", () => ({
  log: vi.fn(),
}));
```
Remove or keep the `../../util/log` mock only if other transitive imports need it.

---

### WR-02: `idModPath` recurses without a depth guard — stack overflow on deep paths

**File:** `src/renderer/src/extensions/gamemode_management/util/discovery.ts:841-848`
**Issue:** `idModPath` is a recursive async function that walks up the directory tree via `path.dirname`. On a file system with an extremely deep path, or if `path.dirname` does not converge (which should not happen in practice, but the loop has no explicit termination guard beyond root), each recursive call creates a new stack frame. Node's async stack is shallow enough that a few hundred levels of nesting can trigger a stack overflow. The existing test (discovery.test.ts line 172-184) mocks only 5 levels, so this is not exercised.
**Fix:** Convert the recursion to an iterative loop, matching the pattern used in `suggestStagingPath`'s own mountpoint walk:
```ts
const idModPath = async (testPath: string) => {
  let current = testPath;
  while (true) {
    try {
      statModPath = await fs.statAsync(current);
      return;
    } catch (err) {
      const code = getErrorCode(err);
      if (code !== "ENOENT") throw err;
      const parent = path.dirname(current);
      if (parent === current) return; // reached root, give up
      current = parent;
    }
  }
};
```

---

### WR-03: `suggestPath` in `Settings.tsx` duplicates the mountpoint-walk from `suggestStagingPath` — divergence risk

**File:** `src/renderer/src/extensions/mod_management/views/Settings.tsx:1148-1183`
**Issue:** The private `suggestPath` method in `Settings` (lines 1148-1183) contains a full copy of the three-branch device-aware path suggestion logic (same device → `{USERDATA}`, Linux different device → mountpoint walk, Windows → `GetVolumePathName`). This logic is identical to `suggestStagingPath` in `discovery.ts` (lines 832-888). Two independent implementations of the same algorithm will diverge: a future fix in one place will not be reflected in the other. This is not merely a style concern — the correctness of path suggestion for Linux users depends on both code paths being equivalent.
**Fix:** Call `suggestStagingPath` from `Settings.suggestPath` instead of re-implementing the logic. Import it and delegate:
```ts
private suggestPath = async () => {
  const { gameMode, onShowError } = this.props;
  try {
    const suggestion = await suggestStagingPath(this.context.api, gameMode);
    this.changePath(suggestion);
  } catch (err) {
    if (err instanceof UserCanceled) return;
    onShowError("Failed to suggest path", err);
  }
};
```
The `suggestStagingPath` function in `discovery.ts` already reads `modPathsForGame` and `getVortexPath("userData")` from the api state, so the props that `suggestPath` currently reads (`modPaths`, `suggestInstallPathDirectory`) become unnecessary for this method.

---

## Info

### IN-01: `manual-scan` condition prop `searchPaths` is read but never provided

**File:** `src/renderer/src/extensions/firststeps_dashlet/todos.tsx:170-171`
**Issue:** The `manual-scan` condition references `props.searchPaths` (line 171), but the `props` selector for that todo (line 167-169) only maps `discoveryRunning` — it never includes `searchPaths`. On Windows, `props.searchPaths` is therefore always `undefined`, making the condition always return `false` on Windows regardless of whether search paths are actually configured. This was presumably present before this phase but the new Linux guard (`process.platform === "linux" ? true : ...`) makes it more visible since the Windows path is now the explicit fallback.
**Fix:** Either add `searchPaths` to the props selector:
```ts
props: (state) => ({
  discoveryRunning: state.session.discovery.running,
  searchPaths: state.settings.gameMode.searchPaths,
}),
```
or clarify in a comment that the condition is intentionally always-false on Windows (i.e. the todo is always hidden there).

---

### IN-02: `validateModPath` path length check uses a hardcoded magic number

**File:** `src/renderer/src/extensions/mod_management/views/Settings.tsx:1018-1025`
**Issue:** The values `100` and `200` on lines 1019 and 1020 are magic numbers for the staging path length warning/error thresholds. While not new to this phase, they are present in the reviewed file.
**Fix:** Extract to named constants near the top of the file:
```ts
const STAGING_PATH_WARN_LENGTH = 100;
const STAGING_PATH_ERROR_LENGTH = 200;
```

---

### IN-03: `discovery.test.ts` win32 different-device test is permanently `todo`

**File:** `src/renderer/src/extensions/gamemode_management/util/discovery.test.ts:236-238`
**Issue:** The test at line 236 is marked `it.todo(...)` with a comment stating it "passes in isolation" but fails due to `process.platform` mutation cross-contamination between test suites. This is a known test isolation defect that will silently allow a regression in the Windows different-device path to go undetected. The comment mentions "Plan 02 will wire this correctly", so this is intentionally deferred, but it should be tracked.
**Fix:** The `it.todo` marker is appropriate as a placeholder. When the test is activated, use `vi.isolateModules` or move platform mutation into a `beforeAll`/`afterAll` scoped block to prevent cross-test contamination.

---

_Reviewed: 2026-04-16T11:11:41Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
