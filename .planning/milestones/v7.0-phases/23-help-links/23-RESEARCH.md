# Phase 23: Help Links - Research

**Researched:** 2026-04-17
**Domain:** Electron IPC, Vortex extension event system, shell.openExternal
**Confidence:** HIGH

## Summary

Phase 23 is a two-requirement phase with no new dependencies. ONBRD-06a routes Linux users
to a Linux-specific wiki URL when the knowledge base is opened. ONBRD-06b surfaces a
notification containing the URL when the browser launcher fails, so users on systems
without a configured browser (e.g., SteamOS Game Mode) see a recoverable message rather
than a silent error.

Both changes are surgical: ONBRD-06a is a single `process.platform === 'linux'` guard in
`extensions/documentation/src/index.tsx`, and ONBRD-06b is an IPC flow change in
`src/main/src/open.ts` that pushes a warning notification to the renderer on failure.

The architectural question for ONBRD-06b — how main sends failure back to renderer — is
answered by the existing `betterIpcMain.send(webContents, channel, ...)` pattern used in
`mainPersistence.ts`. Adding a new typed `MainChannels` entry (`"shell:openUrlFailed"`)
and a renderer listener is the approach most consistent with existing patterns.

**Primary recommendation:** Two-file change (plus IPC type declaration). ONBRD-06a: one
guard in the extension. ONBRD-06b: new `MainChannels` entry in `ipc.ts`, push in
`open.ts`, listener in the renderer-side `opn.ts` or a dedicated handler.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Linux fallback URL is `https://github.com/Nexus-Mods/Vortex/wiki/Vortex-on-Linux`.
- **D-02:** Single fallback only — no per-topic Linux overrides. All `wikiId` lookups on Linux that fail `generateUrl()` fall back to the Linux wiki URL.
- **D-03:** Existing `WIKI_TOPICS` and `WIKI_URL` remain unchanged. A new `LINUX_WIKI_URL` constant (or inline guard) selects between URLs using `process.platform === 'linux'`.
- **D-04:** When `shell.openExternal()` fails, show a Vortex notification via `api.sendNotification()` or equivalent, containing the target URL.
- **D-05:** Browser-failure notification fires on any platform — no platform guard. Upstream diff stays clean.
- **D-06:** Fix lives in `src/main/src/open.ts` — the `openUrl()` `.catch()` handler dispatches a notification or sends a message back to the renderer with the URL.

### Claude's Discretion

- Exact notification text and type (resolved by UI-SPEC: `"warning"`, title `"Could not open browser"`, message `"Visit: {{url}}"`, id `"open-url-failed"`).
- Mechanism for `open.ts` to send URL back to renderer — IPC channel or callback from call site. Planner picks pattern most consistent with `ipcHandlers.ts`.
- Whether the `opn()` path in `extensions/documentation/src/index.tsx` also needs ONBRD-06b coverage (in addition to `open.ts`).

### Deferred Ideas (OUT OF SCOPE)

- Per-topic Linux `WIKI_TOPICS` overrides — deferred until Linux wiki pages exist.
- Creating the actual GitHub wiki page content for `Vortex-on-Linux` — documentation task outside this phase.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| ONBRD-06a | `open-knowledge-base` handler uses Linux URL branch on Linux | Confirmed: single platform guard in `extensions/documentation/src/index.tsx:122`; `process.platform === 'linux'` pattern established throughout codebase |
| ONBRD-06b | `opn()` failure on SteamOS (no browser set) shows target URL inline | Confirmed: `shell.openExternal()` rejection caught in `open.ts:8`; IPC push mechanism exists via `betterIpcMain.send()`; `sendNotification` available in renderer extension API |
</phase_requirements>

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Linux URL routing (ONBRD-06a) | Renderer (extension) | — | `open-knowledge-base` event fires in renderer; `util.opn()` is renderer-side; no main process involvement needed |
| Browser failure notification (ONBRD-06b) | Main process (error detection) + Renderer (notification display) | — | `shell.openExternal()` runs in main; failure must propagate to renderer via IPC for `sendNotification()` |

---

## Standard Stack

### Core (already present — no new installs)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `electron.shell.openExternal` | Electron 39.8.0 | Opens URLs in default browser | Already used; this phase adds error handling |
| `api.sendNotification()` | vortex-api (workspace) | Push Redux notification to user | Established pattern throughout all extensions |
| `process.platform` | Node.js built-in | Platform guard | Used consistently in 20+ places in this codebase (`process.platform === 'linux'`) |
| `betterIpcMain.send()` | `src/main/src/ipc.ts` | Push typed message from main to renderer | Used in `mainPersistence.ts:196` — established main→renderer push pattern |

**Installation:** None required. All dependencies already present. [VERIFIED: direct file inspection]

---

## Architecture Patterns

### System Architecture Diagram

```
User clicks "Help Centre"
        |
        v
HelpSection.tsx
  api.events.emit("open-knowledge-base")
        |
        v
extensions/documentation/src/index.tsx
  open-knowledge-base listener (line 118)
  [ONBRD-06a]
  isModernLayout?
    YES → url = generateUrl(wikiId)
               ?? (linux ? LINUX_WIKI_URL : WIKI_URL)
          util.opn(url)
    NO  → show in-app Knowledge Base page
              |
              v
         util.opn(url)  [renderer-side, opn.ts]
              |
              v
         preload: shell.openUrl(url)  [IPC send, one-way]
              |
              v
         ipcHandlers.ts: shell:openUrl handler
              |
              v
         open.ts: openUrl(url)
              |
              v
         shell.openExternal(url)
              |
         success? ──YES──> browser opens, no further action
              |
              NO
              |
         [ONBRD-06b]
         .catch(err)
           log("error", ...)     [existing, unchanged]
           betterIpcMain.send(   [NEW]
             win.webContents,
             "shell:openUrlFailed",
             url.toString()
           )
              |
              v
         Renderer listener (opn.ts or dedicated handler)
              |
              v
         api.sendNotification({
           type: "warning",
           id: "open-url-failed",
           title: "Could not open browser",
           message: "Visit: {{url}}",
           replace: { url }
         })
              |
              v
         Vortex notification panel shows URL to user
```

### Recommended Project Structure

No new directories. Changes span existing files:

```
extensions/documentation/src/
  index.tsx                    # ONBRD-06a: add LINUX_WIKI_URL, update handler

src/main/src/
  open.ts                      # ONBRD-06b: push MainChannel on failure

src/shared/src/types/
  ipc.ts                       # ONBRD-06b: add "shell:openUrlFailed" to MainChannels

src/renderer/src/util/
  opn.ts                       # ONBRD-06b: listen for "shell:openUrlFailed" and notify

src/preload/src/
  index.ts                     # ONBRD-06b: expose onOpenUrlFailed listener if needed
```

### Pattern 1: Linux Platform Guard (ONBRD-06a)

**What:** Select between two string constants based on `process.platform`.
**When to use:** Any time a renderer extension needs platform-specific behavior.

```typescript
// Source: direct inspection of extensions/documentation/src/index.tsx
// Pattern established in 20+ files (e.g., src/renderer/src/extensions/mod_management/*)

const WIKI_URL = "https://github.com/Nexus-Mods/Vortex/wiki";
const LINUX_WIKI_URL = "https://github.com/Nexus-Mods/Vortex/wiki/Vortex-on-Linux";

// In open-knowledge-base handler (line 122):
const fallbackUrl = process.platform === 'linux' ? LINUX_WIKI_URL : WIKI_URL;
const url = generateUrl(wikiId) ?? fallbackUrl;
util.opn(url).catch(() => null);
```

[VERIFIED: confirmed `process.platform === 'linux'` pattern in codebase via prior phases]

### Pattern 2: Main→Renderer Push via betterIpcMain.send (ONBRD-06b)

**What:** Main process pushes a typed message to all renderer windows using an established IPC utility.
**When to use:** Main process detects an event and needs to notify the renderer without being in a request-response context.

```typescript
// Source: direct inspection of src/main/src/store/mainPersistence.ts:194-198
// Established pattern — iterates all windows, sends to non-destroyed ones

for (const win of BrowserWindow.getAllWindows()) {
  if (!win.isDestroyed()) {
    betterIpcMain.send(win.webContents, "persist:push", hive, operations);
  }
}
```

For ONBRD-06b, `open.ts` must add this push after logging the error. The channel
`"shell:openUrlFailed"` must be declared in `MainChannels` in `ipc.ts`.

[VERIFIED: direct inspection of mainPersistence.ts]

### Pattern 3: Renderer Listener for MainChannels (ONBRD-06b)

**What:** Renderer listens for a typed MainChannels message via the preload API.
**When to use:** Renderer needs to react to a push from the main process.

```typescript
// Source: direct inspection of src/preload/src/index.ts (rendererOn / rendererOff)
// Example from same file: persist:hydrate, persist:push, window:event:close

// In preload/src/index.ts — expose a listener function in the shell namespace:
shell: {
  openUrl: (url) => betterIpcRenderer.send("shell:openUrl", url),
  openFile: (filePath) => betterIpcRenderer.send("shell:openFile", filePath),
  onOpenUrlFailed: (callback) => betterIpcRenderer.on("shell:openUrlFailed", (_, url) => callback(url)),
}
```

Then in the renderer (e.g., `opn.ts` or an extension), register the listener:

```typescript
// In extensions/documentation/src/index.tsx context.once():
// OR in renderer.tsx startup — wherever api is available
getPreloadApi().shell.onOpenUrlFailed((url: string) => {
  api.sendNotification({
    type: "warning",
    id: "open-url-failed",
    title: "Could not open browser",
    message: "Visit: {{url}}",
    replace: { url },
  });
});
```

[VERIFIED: preload pattern from direct inspection of src/preload/src/index.ts]

### Alternative for ONBRD-06b: invoke-based (Option A)

Instead of adding a new MainChannels push, convert `shell:openUrl` from `betterIpcMain.on`
(fire-and-forget RendererChannels) to `betterIpcMain.handle` (InvokeChannels), returning
`{ success: boolean; url: string }`. The renderer then handles the failure directly in
`opn.ts` after awaiting the result.

**Why NOT recommended:** `opn.ts` is marked `@deprecated`, resolves `PromiseBB.resolve()`
unconditionally, and does not await the preload call. Changing this would require
touching more call sites, changing the deprecated function's contract, and risking
regression. The push pattern is more additive and does not disrupt existing callers.
The planner should choose the push pattern (Pattern 2 + 3 above) unless a strong reason
exists to prefer invoke.

[ASSUMED: "more additive" judgment — the architectural analysis is based on code inspection,
but the final call belongs to the planner]

### Anti-Patterns to Avoid

- **Modifying `WIKI_TOPICS` keys or adding Linux-specific entries:** Out of scope (D-02).
- **Using `process.platform === 'win32'` as the else-arm:** Only guard the Linux arm; let all other platforms fall through to `WIKI_URL` for correct behavior on macOS, etc.
- **Making `opn()` await the IPC call:** The deprecated `opn.ts` intentionally fire-and-forgets; changing its return type breaks all 20+ call sites.
- **Dispatching the notification from main process:** Notifications are a Redux concern in the renderer. Main cannot call `api.sendNotification()` directly — only the renderer extension API has access.
- **Using `ipcMain.emit` or dynamic channel strings:** The typed `betterIpcMain.send` is the established safe pattern; raw `ipcMain.emit` bypasses type safety and trusted-sender assertions.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Notification display | Custom UI component | `api.sendNotification()` | Already implemented; Redux state + existing renderer component |
| Main→renderer push | Custom IPC transport | `betterIpcMain.send(win.webContents, ...)` | Type-safe; established pattern; handles window lifecycle |
| Platform detection | `os.platform()` calls | `process.platform === 'linux'` | Same result; consistent with existing codebase convention |

**Key insight:** Both requirements are wiring fixes that plug into already-built systems.
No new infrastructure is needed.

---

## Common Pitfalls

### Pitfall 1: Notification dispatched from main, not renderer

**What goes wrong:** Developer adds notification logic directly in `open.ts` using
`Notification` from Electron OS notifications instead of the Vortex notification system.
**Why it happens:** `open.ts` is already in the main process and has access to Electron's
native `Notification` API. But the requirement specifies Vortex notification panel.
**How to avoid:** The Vortex notification system is Redux-based in the renderer.
`api.sendNotification()` only exists in the renderer extension context.
Push the URL to renderer, let renderer call `api.sendNotification()`.
**Warning signs:** If you find yourself importing `Notification` from `electron` in
`open.ts`, you are using OS notifications, not the Vortex notification panel.

### Pitfall 2: opn.ts two-path issue

**What goes wrong:** Fix is applied to `src/main/src/open.ts` but not the
`extensions/documentation/src/index.tsx` path, which calls `util.opn(url).catch(() => null)`.
Since `opn.ts` returns `PromiseBB.resolve()` unconditionally (never rejects), and the
`.catch(() => null)` swallows any rejection, the notification will NOT fire if the
failure happens via this call path when the listener is registered in `open.ts` only.
**Why it happens:** The context.md says the fix is in `open.ts`, but `opn.ts` is the
wrapper that the documentation extension calls. Both ultimately reach `shell.openExternal`
via the IPC chain, so the main-process fix in `open.ts` DOES cover this path.
**Verification:** The call chain is:
`util.opn()` → `getPreloadApi().shell.openUrl(url)` → IPC send → `ipcHandlers.ts:shell:openUrl` → `openUrl(new URL(url))` in `open.ts` → `shell.openExternal(url).catch(...)`.
The fix in `open.ts` is at the bottom of this chain and covers all callers that route
through `shell:openUrl`. No separate fix in `opn.ts` is required.
**Warning signs:** If the planner adds a `.catch` to `util.opn()` in addition to the
`open.ts` fix, that is double-handling and unnecessary.

### Pitfall 3: `BrowserWindow.getAllWindows()` empty at call time

**What goes wrong:** When `shell.openExternal` fails, `BrowserWindow.getAllWindows()`
might theoretically be empty if called during shutdown.
**Why it happens:** Edge case; in practice the user triggered a URL open from the UI so
a window exists.
**How to avoid:** The `persist:push` pattern already uses `!win.isDestroyed()` guard.
Use the same guard; no special handling needed.
**Warning signs:** TypeScript will not catch this; the guard is defensive runtime code.

### Pitfall 4: Forgetting to declare the new MainChannels entry

**What goes wrong:** Adding `betterIpcMain.send(win.webContents, "shell:openUrlFailed", url)`
in `open.ts` without declaring `"shell:openUrlFailed": (url: string) => void` in
`MainChannels` in `src/shared/src/types/ipc.ts`.
**Why it happens:** TypeScript will error on the `betterIpcMain.send` call, so this
pitfall is caught at compile time. However, the preload listener type also needs updating
(the `PreloadWindow` type and the `contextBridge` exposure in `index.ts`).
**Warning signs:** TypeScript compile error on `betterIpcMain.send`.

### Pitfall 5: Linux URL fallback applied to the wrong branch

**What goes wrong:** The `isModernLayout: false` branch in the `open-knowledge-base`
handler does NOT open a URL — it shows the in-app Knowledge Base view. Applying the
Linux URL guard here is a no-op at best, confusing at worst.
**How to avoid:** Only apply `LINUX_WIKI_URL` in the `isModernLayout: true` arm (line 122).
The `isModernLayout: false` arm never calls `util.opn()`, so no URL guard is needed.
**Warning signs:** Code that sets `const fallbackUrl = ...` before the `if (isModernLayout)`
check and then only uses it in the `else` block.

---

## Code Examples

### Verified: sendNotification shape (from UI-SPEC)

```typescript
// Source: 23-UI-SPEC.md + IExtensionContext.ts inspection
api.sendNotification({
  type: "warning",
  id: "open-url-failed",
  title: "Could not open browser",
  message: "Visit: {{url}}",
  replace: { url },   // url is the string passed to shell.openExternal
});
```

### Verified: MainChannels new entry (ipc.ts)

```typescript
// Source: direct inspection of src/shared/src/types/ipc.ts
// Add to MainChannels interface:
"shell:openUrlFailed": (url: string) => void;
```

### Verified: open.ts after fix

```typescript
// Source: direct inspection of src/main/src/open.ts + mainPersistence.ts pattern
import { shell, BrowserWindow } from "electron";
import { betterIpcMain } from "./ipc";
import { log } from "./logging";

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

### Verified: ONBRD-06a guard in documentation extension

```typescript
// Source: direct inspection of extensions/documentation/src/index.tsx
const WIKI_URL = "https://github.com/Nexus-Mods/Vortex/wiki";
const LINUX_WIKI_URL = "https://github.com/Nexus-Mods/Vortex/wiki/Vortex-on-Linux";

// In the open-knowledge-base handler, isModernLayout branch:
const fallbackUrl = process.platform === 'linux' ? LINUX_WIKI_URL : WIKI_URL;
const url = generateUrl(wikiId) ?? fallbackUrl;
util.opn(url).catch(() => null);
```

---

## State of the Art

| Old Approach | Current Approach | Notes |
|--------------|------------------|-------|
| Silent `.catch(() => null)` on URL open | Push failure + URL to renderer for notification | This phase introduces the new approach |
| Generic wiki fallback URL for all platforms | Platform-specific wiki fallback on Linux | This phase introduces |

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | The push pattern (new MainChannels entry) is more consistent than the invoke refactor | Architecture Patterns — Alternative | Planner may need to use invoke pattern instead; either works |
| A2 | `getPreloadApi().shell` can be extended with `onOpenUrlFailed` without type conflicts in PreloadWindow | Code Examples — preload listener | Requires verifying `PreloadWindow` type in `@vortex/shared/preload` |

---

## Open Questions

1. **Where in the renderer does the `shell:openUrlFailed` listener register?**
   - What we know: The listener needs access to `api.sendNotification()`. This is only available inside an extension context (after `context.once()`) or in renderer.tsx via the extension API.
   - What's unclear: The `opn.ts` utility has no access to `api` — it is a low-level utility. The `extensions/documentation/src/index.tsx` already handles `open-knowledge-base` and has `context.api` available.
   - Recommendation: Register the `shell:openUrlFailed` listener in `extensions/documentation/src/index.tsx` inside `context.once()`, alongside the existing `open-knowledge-base` listener. This keeps all URL-failure notification logic in the documentation extension and avoids polluting the low-level `opn.ts` utility.

2. **Does `PreloadWindow` type need updating?**
   - What we know: `src/preload/src/index.ts` exposes typed APIs via `contextBridge`. The shell namespace currently has `openUrl` and `openFile` only.
   - What's unclear: The `PreloadWindow` type definition location (likely `@vortex/shared/preload`).
   - Recommendation: Planner should locate `PreloadWindow` type and add `onOpenUrlFailed: (callback: (url: string) => void) => void` to the `shell` namespace. Then expose it in `index.ts` using `betterIpcRenderer.on`.

---

## Environment Availability

Step 2.6: SKIPPED — no external dependencies identified. This phase is code/config changes only.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.0 (main) / Jest 29.7.0 (renderer) |
| Config file (main) | `src/main/vitest.config.ts` — `include: ["src/**/*.test.ts"]` |
| Config file (extension) | None — `extensions/documentation` has no vitest config |
| Quick run command (main) | `pnpm vitest run --project @vortex/main` |
| Full suite command | `pnpm run test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ONBRD-06a | `generateUrl(wikiId) ?? LINUX_WIKI_URL` on linux | unit | `pnpm vitest run --project @vortex/main` (if test added) | ❌ Wave 0 |
| ONBRD-06a | `WIKI_URL` used as fallback on non-linux | unit | same | ❌ Wave 0 |
| ONBRD-06b | `shell:openUrlFailed` pushed when `shell.openExternal` rejects | unit | `pnpm vitest run --project @vortex/main` | ❌ Wave 0 |
| ONBRD-06b | Notification shown with correct shape on failure | integration / manual | manual verification | N/A |

### Sampling Rate

- **Per task commit:** `pnpm vitest run --project @vortex/main`
- **Per wave merge:** `pnpm run test`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `src/main/src/open.test.ts` — covers ONBRD-06b (unit test for `openUrl()` failure push)
- [ ] `extensions/documentation/src/index.test.ts` — covers ONBRD-06a (url selection logic) — **low priority**: the documentation extension has no vitest config; a focused unit test for the URL selection helper is optional but recommended

Note: The documentation extension has no test infrastructure at all. If a test is added,
a `vitest.config.ts` must also be created for that package (follows the pattern of other
extensions that have vitest configs under `extensions/*/vitest.config.ts`).

---

## Security Domain

This phase has no security-sensitive surfaces:

- No authentication, sessions, or tokens
- No user input that reaches a filesystem or database
- No privilege escalation
- `shell.openExternal()` already validates URLs via Electron's built-in protocol filter

ASVS categories: Not applicable for this phase. The only external call (`shell.openExternal`)
is Electron's own sandboxed shell API.

---

## Sources

### Primary (HIGH confidence)
- Direct inspection: `extensions/documentation/src/index.tsx` — confirmed current state of WIKI_TOPICS, generateUrl, open-knowledge-base handler
- Direct inspection: `src/main/src/open.ts` — confirmed current silent catch pattern
- Direct inspection: `src/main/src/ipc.ts` — confirmed betterIpcMain.send signature and MainChannels mechanism
- Direct inspection: `src/main/src/store/mainPersistence.ts:194-198` — confirmed BrowserWindow.getAllWindows() push pattern
- Direct inspection: `src/shared/src/types/ipc.ts` — confirmed MainChannels, RendererChannels, InvokeChannels interface structure
- Direct inspection: `src/preload/src/index.ts` — confirmed shell namespace and betterIpcRenderer.on pattern
- Direct inspection: `.planning/phases/23-help-links/23-UI-SPEC.md` — confirmed notification shape, copy, and id

### Secondary (MEDIUM confidence)
- Prior phases decision log (STATE.md) — confirms `process.platform === 'linux'` as the established guard pattern

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all relevant files inspected directly
- Architecture: HIGH — IPC flow traced end-to-end through actual source files
- Pitfalls: HIGH — derived from actual code structure, not training assumptions
- Test infrastructure: HIGH — vitest config and extension package.json inspected

**Research date:** 2026-04-17
**Valid until:** 2026-05-17 (stable codebase; no external dependencies)
