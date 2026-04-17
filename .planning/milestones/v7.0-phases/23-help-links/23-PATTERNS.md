# Phase 23: Help Links - Pattern Map

**Mapped:** 2026-04-17
**Files analyzed:** 5 modified files (0 new files)
**Analogs found:** 5 / 5

## File Classification

| Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---------------|------|-----------|----------------|---------------|
| `extensions/documentation/src/index.tsx` | extension/event-handler | request-response | `extensions/mod-dependency-manager/src/index.tsx` | role-match |
| `src/main/src/open.ts` | utility | event-driven (failure push) | `src/main/src/store/mainPersistence.ts` | data-flow-match |
| `src/shared/src/types/ipc.ts` | config/types | n/a | itself (extend in place) | exact |
| `src/shared/src/types/preload.ts` | config/types | n/a | itself (extend in place) | exact |
| `src/preload/src/index.ts` | IPC bridge | request-response | itself (extend in place) | exact |

## Pattern Assignments

### `extensions/documentation/src/index.tsx` (extension, request-response)

**Change:** ONBRD-06a — add `LINUX_WIKI_URL` constant and platform guard in the
`open-knowledge-base` listener's `isModernLayout` branch (line 122).

**Analog:** `extensions/documentation/src/index.tsx` (self — the existing handler is the
direct model) + `extensions/script-extender-installer/src/githubDownloader.ts` (for
`sendNotification` shape with `replace:`) + `extensions/gamebryo-plugin-management/src/autosort.ts`
(for `process.platform === "linux"` ternary spread pattern).

**Existing constants block** (`extensions/documentation/src/index.tsx`, lines 13-26):
```typescript
const WIKI_TOPICS = {
  ["adding-games"]: "MODDINGWIKI-Users-UI-Games-section",
  // ... (unchanged)
};

const WIKI_URL = "https://github.com/Nexus-Mods/Vortex/wiki";
```

**New constant to add** (after line 26):
```typescript
const LINUX_WIKI_URL = "https://github.com/Nexus-Mods/Vortex/wiki/Vortex-on-Linux";
```

**Existing handler** (`extensions/documentation/src/index.tsx`, lines 118-133):
```typescript
context.api.events.on("open-knowledge-base", (wikiId?: string) => {
  const state = context.api.store.getState();
  const isModernLayout = state.settings?.window?.useModernLayout;
  if (isModernLayout) {
    const url = generateUrl(wikiId) ?? WIKI_URL;   // <-- line 122: CHANGE THIS
    util.opn(url).catch(() => null);
  } else {
    context.api.events.emit("show-main-page", "Knowledge base");
    const url = generateUrl(wikiId);
    if (url !== undefined) {
      setTimeout(() => {
        context.api.events.emit("navigate-knowledgebase", url);
      }, 2000);
    }
  }
});
```

**Pattern to apply** (line 122 replacement):
```typescript
const fallbackUrl = process.platform === "linux" ? LINUX_WIKI_URL : WIKI_URL;
const url = generateUrl(wikiId) ?? fallbackUrl;
```

**Platform guard analog** (`extensions/gamebryo-plugin-management/src/autosort.ts`, lines 925-935):
```typescript
...(process.platform === "linux"
  ? {
      LD_PRELOAD: path.join(...),
      LD_LIBRARY_PATH: [...],
    }
  : {}),
```
The guard in this phase is simpler — a ternary on a string constant, not a spread.

**Listener location note:** The `shell:openUrlFailed` listener (ONBRD-06b renderer side)
should be registered inside this same `context.once()` block at
`extensions/documentation/src/index.tsx` line 96, because `context.api` (which gives
access to `sendNotification`) is available here. `src/renderer/src/util/opn.ts` has no
access to `api` and cannot call `sendNotification`.

**sendNotification pattern** (`extensions/script-extender-installer/src/githubDownloader.ts`, lines 74-86):
```typescript
api.sendNotification({
  type: "info",
  id: `scriptextender-update-${gameId}`,
  noDismiss: true,
  allowSuppress: true,
  title: "Update for {{name}}",
  message: "Latest: {{latest}}, Installed: {{current}}",
  replace: {
    name: gameSupport.name,
    latest,
    current,
  },
  // ...
});
```

For ONBRD-06b, the shape to copy from this (using `type: "warning"`, no `noDismiss`):
```typescript
context.api.sendNotification({
  type: "warning",
  id: "open-url-failed",
  title: "Could not open browser",
  message: "Visit: {{url}}",
  replace: { url },
});
```

---

### `src/main/src/open.ts` (utility, event-driven / failure push)

**Change:** ONBRD-06b — in the `.catch()` handler of `openUrl()`, push
`"shell:openUrlFailed"` to all renderer windows via `betterIpcMain.send()` after logging.

**Analog:** `src/main/src/store/mainPersistence.ts` (lines 194-198) — the established
pattern for pushing a typed `MainChannels` message to all non-destroyed windows.

**Current file** (`src/main/src/open.ts`, lines 1-11):
```typescript
import { shell } from "electron";
import path from "node:path";

import { log } from "./logging";

/** Opens the file using the default application registered for the protocol */
export function openUrl(url: URL): void {
  shell.openExternal(url.toString()).catch((err: unknown) => {
    log("error", "failed to open URL", { url: url.toString(), error: err });
  });
}
```

**BrowserWindow push pattern to copy** (`src/main/src/store/mainPersistence.ts`, lines 194-198):
```typescript
for (const win of BrowserWindow.getAllWindows()) {
  if (!win.isDestroyed()) {
    betterIpcMain.send(win.webContents, "persist:push", hive, operations);
  }
}
```

**After the fix — `openUrl()` should become:**
```typescript
import { shell, BrowserWindow } from "electron";
import path from "node:path";

import { betterIpcMain } from "./ipc";
import { log } from "./logging";

/** Opens the file using the default application registered for the protocol */
export function openUrl(url: URL): void {
  shell.openExternal(url.toString()).catch((err: unknown) => {
    log("error", "failed to open URL", { url: url.toString(), error: err });
    for (const win of BrowserWindow.getAllWindows()) {
      if (!win.isDestroyed()) {
        betterIpcMain.send(win.webContents, "shell:openUrlFailed", url.toString());
      }
    }
  });
}
```

**Import pattern for `betterIpcMain`** (`src/main/src/ipcHandlers.ts` or any main-process
file): `import { betterIpcMain } from "./ipc";`

---

### `src/shared/src/types/ipc.ts` (config/types)

**Change:** ONBRD-06b — add `"shell:openUrlFailed"` entry to the `MainChannels` interface.

**Analog:** The existing `MainChannels` interface in this same file (lines 133-170).
All entries follow the same doc-comment + signature pattern.

**Existing `MainChannels` entries to copy pattern from** (`src/shared/src/types/ipc.ts`, lines 133-145):
```typescript
/** Type containing all known channels used by the main process to send messages to a renderer process */
export interface MainChannels {
  // NOTE(erri120): Parameters must be serializable and return values must be void.

  // Examples:
  "example:main_foo": () => void;
  "example:main_bar": (data: string) => void;

  // Persistence: Send hydration data to renderer on startup
  "persist:hydrate": (hive: PersistedHive, data: Serializable) => void;

  // Persistence: Push state changes from main process to renderer
  "persist:push": (hive: PersistedHive, operations: DiffOperation[]) => void;
```

**New entry to add** (after the last `shell:` entry or grouped with other shell entries):
```typescript
  // Shell: Notify renderer that shell.openExternal failed with the attempted URL
  "shell:openUrlFailed": (url: string) => void;
```

---

### `src/shared/src/types/preload.ts` (config/types)

**Change:** ONBRD-06b — add `onOpenUrlFailed` method to the `Shell` interface so the
type-checker validates the preload and renderer usage.

**Existing `Shell` interface** (`src/shared/src/types/preload.ts`, lines 101-107):
```typescript
export interface Shell {
  /** Opens the URL using the default application registered for the protocol */
  openUrl(url: string): void;

  /** Opens the file using the default application for the file extension */
  openFile(filePath: string): void;
}
```

**Pattern:** Each method has a JSDoc comment above it. New method follows the same shape
as `onMenuClick` in the `Menu` interface (line 285-287) which also returns void and takes
a callback parameter:
```typescript
export interface Menu {
  /** Register listener for menu item clicks. Returns unsubscribe function. */
  onMenuClick(callback: (menuItemId: string) => void): () => void;
  // ...
}
```

**New method to add to `Shell`:**
```typescript
  /** Register listener for shell.openExternal failure events from main process. */
  onOpenUrlFailed(callback: (url: string) => void): void;
```

Note: This does NOT return an unsubscribe function (unlike `onMenuClick`), consistent with
`persist.onPush` and `persist.onHydrate` which also return void. Keep consistent with
the persistence listeners since this is a one-time registration in `context.once()`.

---

### `src/preload/src/index.ts` (IPC bridge, request-response)

**Change:** ONBRD-06b — expose `onOpenUrlFailed` on the `shell` object in `contextBridge`.

**Analog:** The existing `persist.onPush` and `persist.onHydrate` in this same file
(lines 62-66) — same pattern of wrapping `betterIpcRenderer.on` into a callback-style
method.

**Existing `persist.onPush` pattern** (`src/preload/src/index.ts`, lines 62-66):
```typescript
onPush: (callback) =>
  betterIpcRenderer.on("persist:push", (_, hive, operations) =>
    callback(hive, operations),
  ),
```

**Existing `shell` object** (`src/preload/src/index.ts`, lines 44-48):
```typescript
shell: {
  openUrl: (url) => betterIpcRenderer.send("shell:openUrl", url),
  openFile: (filePath) =>
    betterIpcRenderer.send("shell:openFile", filePath),
},
```

**New entry to add to `shell`:**
```typescript
  onOpenUrlFailed: (callback: (url: string) => void) =>
    betterIpcRenderer.on("shell:openUrlFailed", (_, url) => callback(url)),
```

**`rendererOn` signature** (`src/preload/src/index.ts`, lines 316-324):
```typescript
function rendererOn<C extends keyof MainChannels>(
  channel: C,
  listener: (
    event: Electron.IpcRendererEvent,
    ...args: SerializableArgs<Parameters<MainChannels[C]>>
  ) => void,
): void {
  ipcRenderer.on(channel, listener);
}
```
`betterIpcRenderer.on` is `rendererOn` — it accepts only `MainChannels` keys, so the
`"shell:openUrlFailed"` entry in `MainChannels` (`ipc.ts`) must be added first or the
TypeScript call will error.

---

## Shared Patterns

### Platform Guard (ONBRD-06a)
**Source:** `extensions/gamebryo-plugin-management/src/autosort.ts` line 925;
`extensions/local-gamesettings/src/util/gameSupport.ts` line 150
**Apply to:** `extensions/documentation/src/index.tsx` line 122
```typescript
process.platform === "linux"   // string literal, not 'linux'
```
Note: Always use double quotes to match ESLint / oxfmt config. The platform string is
`"linux"`, guard only the Linux arm, let all other platforms fall through to the default.

### Main→Renderer Push Pattern (ONBRD-06b)
**Source:** `src/main/src/store/mainPersistence.ts` lines 194-198
**Apply to:** `src/main/src/open.ts` catch handler
```typescript
for (const win of BrowserWindow.getAllWindows()) {
  if (!win.isDestroyed()) {
    betterIpcMain.send(win.webContents, "CHANNEL_NAME", ...args);
  }
}
```

### sendNotification with replace (ONBRD-06b)
**Source:** `extensions/script-extender-installer/src/githubDownloader.ts` lines 74-86
**Apply to:** `extensions/documentation/src/index.tsx` inside `context.once()` as the
`shell:openUrlFailed` renderer listener
```typescript
api.sendNotification({
  type: "warning",
  id: "open-url-failed",
  title: "Could not open browser",
  message: "Visit: {{url}}",
  replace: { url },
});
```

### context.once() Listener Registration (ONBRD-06b)
**Source:** `extensions/documentation/src/index.tsx` lines 96-134
**Apply to:** Register `shell:openUrlFailed` in the same `context.once(() => { ... })`
block, after the existing `open-knowledge-base` listener.
```typescript
context.once(() => {
  // ... existing listeners ...

  getPreloadApi().shell.onOpenUrlFailed((url: string) => {
    context.api.sendNotification({
      type: "warning",
      id: "open-url-failed",
      title: "Could not open browser",
      message: "Visit: {{url}}",
      replace: { url },
    });
  });
});
```
`getPreloadApi()` is imported from `src/renderer/src/util/preloadAccess.ts`; check if
it is already available in the documentation extension's import scope or use
`window.api.shell.onOpenUrlFailed(...)` as the direct alternative.

---

## No Analog Found

None. All 5 modified files have either exact or strong role/data-flow analogs in the codebase.

---

## Key Implementation Notes for Planner

1. **Type declaration order matters:** `ipc.ts` must be updated before `preload.ts` and
   `index.ts`, because `betterIpcRenderer.on` is typed against `MainChannels`. TypeScript
   will error at `preload/src/index.ts` if `"shell:openUrlFailed"` is not in `MainChannels`.

2. **Listener registration location:** The `shell:openUrlFailed` renderer listener belongs
   in `extensions/documentation/src/index.tsx` inside `context.once()` — not in `opn.ts`
   (which has no access to `api`). This is the only extension that already owns all URL
   open and knowledge-base behavior.

3. **opn.ts is not a change point:** `src/renderer/src/util/opn.ts` does NOT need a fix
   for ONBRD-06b. The call chain routes through `shell:openUrl` IPC → `ipcHandlers.ts` →
   `openUrl()` in `open.ts`, so the fix in `open.ts` covers all callers.

4. **Test file gap:** `src/main/src/open.test.ts` does not exist. The research identified
   this as a Wave 0 gap. Planner should include a task to create it with a Vitest unit test
   for `openUrl()` failure push behavior.

---

## Metadata

**Analog search scope:** `extensions/`, `src/main/src/`, `src/shared/src/types/`, `src/preload/src/`, `src/renderer/src/util/`
**Files scanned:** 8 files directly read; additional grep across all extensions
**Pattern extraction date:** 2026-04-17
