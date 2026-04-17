---
phase: 23-help-links
reviewed: 2026-04-17T00:00:00Z
depth: standard
files_reviewed: 6
files_reviewed_list:
  - src/main/src/open.test.ts
  - src/shared/src/types/ipc.ts
  - src/shared/src/types/preload.ts
  - src/preload/src/index.ts
  - src/main/src/open.ts
  - extensions/documentation/src/index.tsx
findings:
  critical: 0
  warning: 3
  info: 3
  total: 6
status: issues_found
---

# Phase 23: Code Review Report

**Reviewed:** 2026-04-17
**Depth:** standard
**Files Reviewed:** 6
**Status:** issues_found

## Summary

This phase adds a help-links feature: a new `openUrl` / `openFile` main-process module, an IPC channel (`shell:openUrlFailed`) to notify the renderer when `shell.openExternal` fails, and a Linux-aware wiki URL fallback in the documentation extension. The implementation is clean and small. Three warning-level issues were found — one real listener-leak bug in the preload that is reflected as a type inconsistency across two files, one unreliable test pattern, and one path-resolution risk in `openFile`. Three info-level items cover a copy-paste JSDoc, a redundant expression, and a bypassed typed interface.

---

## Warnings

### WR-01: `onOpenUrlFailed` has no unsubscribe path — listener leak risk

**File:** `src/preload/src/index.ts:48-51` and `src/shared/src/types/preload.ts:109`

**Issue:** Every other `on*` registration method in the preload (e.g., `onClose`, `onFocus`, `onMaximized`) returns an unsubscribe `() => void` function. `onOpenUrlFailed` calls `betterIpcRenderer.on(...)` but returns nothing and is typed as `void`. If a renderer component (or extension) registers this handler more than once across the page lifecycle — e.g., on hot-reload or re-mount — IPC listeners accumulate and the callback fires multiple times per event. Electron warns about this with a "MaxListenersExceededWarning" above the default cap of 10 listeners.

**Fix:** Return the ipcRenderer listener and expose an unsubscribe function, consistent with the rest of the API:

In `src/preload/src/index.ts`:
```typescript
onOpenUrlFailed: (callback: (url: string) => void) => {
  const listener = (_: Electron.IpcRendererEvent, url: string) =>
    callback(url);
  ipcRenderer.on("shell:openUrlFailed", listener);
  return () => ipcRenderer.removeListener("shell:openUrlFailed", listener);
},
```

In `src/shared/src/types/preload.ts`:
```typescript
export interface Shell {
  openUrl(url: string): void;
  openFile(filePath: string): void;
  /** Register listener for shell.openExternal failure events from main process. */
  onOpenUrlFailed(callback: (url: string) => void): () => void;
}
```

The call site in `extensions/documentation/src/index.tsx` line 140 would then receive the unsubscribe handle, which can be stored for cleanup if needed.

---

### WR-02: `openFile` resolves relative paths against unpredictable `cwd()`

**File:** `src/main/src/open.ts:25-27`

**Issue:** For non-absolute paths, `path.resolve(filePath)` is called, which resolves against `process.cwd()`. In the Electron main process, `cwd()` is whatever directory the OS sets when launching the application binary — not the app directory, not the user-data directory, and definitely not consistent across platforms or launch methods (e.g., clicking .desktop file vs. terminal). A relative path like `"config.yaml"` will resolve to an unexpected location and silently open the wrong file or fail.

**Fix:** Either reject relative paths outright (safest), or resolve against a known application directory:
```typescript
export function openFile(filePath: string): void {
  if (!path.isAbsolute(filePath)) {
    log("error", "openFile: relative path not allowed", { filePath });
    return;
  }
  shell
    .openPath(filePath)
    // ...
}
```

If relative paths must be supported, document the explicit base directory and use it:
```typescript
const resolvedPath = path.isAbsolute(filePath)
  ? filePath
  : path.resolve(app.getAppPath(), filePath);
```

---

### WR-03: Negative assertion in test uses fixed 50ms timeout — flaky on slow CI

**File:** `src/main/src/open.test.ts:59`

**Issue:** The test "does not push when openExternal resolves" polls for 50ms and then asserts `betterIpcMain.send` was NOT called. This is a time-based negative assertion: if the CI runner is under load, the 50ms may expire before the resolved promise microtask runs, making the test pass for the wrong reason. It can also be brittle in the other direction if the environment schedules timers differently. All other tests in this file use `vi.waitFor` for positive assertions; the negative case should use fake timers for determinism.

**Fix:**
```typescript
it("does not push when openExternal resolves", async () => {
  vi.mocked(shell.openExternal).mockResolvedValue();
  vi.useFakeTimers();

  openUrl(new URL("https://example.com"));
  await vi.runAllTimersAsync();

  expect(betterIpcMain.send).not.toHaveBeenCalled();
  vi.useRealTimers();
});
```

Alternatively, flush microtasks explicitly with `await Promise.resolve()` a couple of times to let the `.catch()` chain settle without relying on wall-clock time.

---

## Info

### IN-01: JSDoc for `openUrl` says "Opens the file" — copy-paste error

**File:** `src/main/src/open.ts:7`

**Issue:** The function comment reads `/** Opens the file using the default application registered for the protocol */`. This is the same text as the comment for `openFile` and is incorrect for `openUrl`.

**Fix:**
```typescript
/** Opens the URL using the default application registered for the protocol */
export function openUrl(url: URL): void {
```

---

### IN-02: `|| undefined` is redundant in `generateUrl`

**File:** `extensions/documentation/src/index.tsx:33`

**Issue:** `const topicId = WIKI_TOPICS[wikiId] || undefined` — when a property is absent from an object index lookup in JavaScript, the result is already `undefined`. The `|| undefined` is a no-op and adds visual noise.

**Fix:**
```typescript
const topicId = WIKI_TOPICS[wikiId];
```

---

### IN-03: `(window as any).api` bypasses the typed preload interface

**File:** `extensions/documentation/src/index.tsx:140`

**Issue:** `(window as any).api.shell.onOpenUrlFailed(...)` casts to `any`, silencing TypeScript's type checking for this call. The preload exposes a fully typed interface via `PreloadWindow`. Using `as any` here means a rename or signature change on `onOpenUrlFailed` would not produce a compile error in this call site.

**Fix:**
```typescript
import type { PreloadWindow } from "@vortex/shared/preload";

(window as unknown as PreloadWindow).api.shell.onOpenUrlFailed((url: string) => {
  // ...
});
```

Or, if a typed accessor is already established elsewhere in the extension codebase, use it instead of casting.

---

_Reviewed: 2026-04-17_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
