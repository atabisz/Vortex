# Phase 23: Help Links - Context

**Gathered:** 2026-04-17
**Status:** Ready for planning

<domain>
## Phase Boundary

Route Linux users to Linux-specific documentation when using help features. When the browser launcher fails on any platform (notably SteamOS with no browser configured), surface the target URL inline via a Redux notification instead of silently logging an error.

Two requirements in scope:
- **ONBRD-06a**: On Linux, `open-knowledge-base` handler uses a Linux-specific GitHub wiki URL instead of the generic Windows-targeted one.
- **ONBRD-06b**: `shell.openExternal()` failure shows the target URL in a Vortex notification (any platform, not Linux-only).

**Out of scope:** Creating the GitHub wiki page content, per-topic Linux `WIKI_TOPICS` entries, any changes to `WIKI_TOPICS` keys, i18n.

</domain>

<decisions>
## Implementation Decisions

### Linux Target URL (ONBRD-06a)

- **D-01:** On Linux, the fallback URL for the `open-knowledge-base` handler is `https://github.com/Nexus-Mods/Vortex/wiki/Vortex-on-Linux`. This replaces the current `WIKI_URL` constant (`https://github.com/Nexus-Mods/Vortex/wiki`) for Linux users.
- **D-02:** Single fallback only — no per-topic Linux overrides. All `wikiId` lookups on Linux that fail `generateUrl()` fall back to the Linux wiki URL. No new keys added to `WIKI_TOPICS`.
- **D-03:** Existing `WIKI_TOPICS` entries and the existing `WIKI_URL` constant remain unchanged. A new `LINUX_WIKI_URL` constant (or equivalent inline guard) selects between the two URLs at runtime using `process.platform === 'linux'`.

### Browser Failure — Show URL Inline (ONBRD-06b)

- **D-04:** When `shell.openExternal()` fails, show a Vortex notification (via `api.sendNotification()` or equivalent) containing the target URL. The notification should make the URL visible so the user can manually navigate to it.
- **D-05:** This behavior fires on **any platform** where the browser launch fails — not Linux-only. No platform guard needed; this is universally correct defensive behavior and keeps the upstream diff clean.
- **D-06:** The fix lives in `src/main/src/open.ts` — the `openUrl()` function currently logs the error silently. After the fix, the `.catch()` handler also dispatches a notification or sends a message back to the renderer with the URL.

### Claude's Discretion

- Exact notification text and type (e.g., `"warning"` vs `"error"` level, copy of message body).
- Mechanism for `open.ts` (main process) to send the URL back to the renderer — either via IPC channel or by passing a callback from the call site. Planner should pick the pattern most consistent with existing error-to-renderer flows (see `ipcHandlers.ts`).
- Whether to also fix the `opn()` path in `extensions/documentation/src/index.tsx` (which calls `util.opn(url).catch(() => null)` and swallows errors silently) in addition to `open.ts` — planner should check if both paths need the fix for full ONBRD-06b coverage.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase Requirements
- `.planning/REQUIREMENTS.md` §Help Links (ONBRD-06) — ONBRD-06a and ONBRD-06b

### Key Source Files
- `extensions/documentation/src/index.tsx` — sole file for ONBRD-06a; contains `WIKI_URL`, `WIKI_TOPICS`, `generateUrl()`, and the `open-knowledge-base` event listener
- `src/main/src/open.ts` — `openUrl()` function; currently logs failure silently; fix point for ONBRD-06b
- `src/main/src/ipcHandlers.ts:200` — `shell:openUrl` IPC handler that calls `openUrl()`; reference for main→renderer notification patterns
- `src/renderer/src/util/opn.ts` — renderer-side `opn()` wrapper (deprecated); also calls `openUrl` via preload; check if ONBRD-06b fix is also needed here
- `src/renderer/src/views/components/Header/HelpSection.tsx` — emits `open-knowledge-base`; no changes needed here

### Reference Patterns
- `src/renderer/src/util/message.ts` — existing `api.sendNotification()` usage patterns (how errors are surfaced to users in the renderer)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `api.sendNotification()` — existing pattern for surfacing errors/warnings to users; used throughout the codebase (e.g. `message.ts:276`)
- `util.opn()` — deprecated renderer-side URL opener; delegates to preload `shell.openUrl` → main `openUrl()`

### Established Patterns
- `process.platform === 'linux'` guard — used in multiple extensions and utilities for platform-specific branches; consistent pattern for ONBRD-06a
- Error logging via `log("error", ...)` in `open.ts` stays; notification is additive, not a replacement

### Integration Points
- `open-knowledge-base` event listener in `extensions/documentation/src/index.tsx:118` — primary change point for ONBRD-06a
- `openUrl()` in `src/main/src/open.ts:7` — primary change point for ONBRD-06b; needs to surface the URL to the renderer on failure

</code_context>

<specifics>
## Specific Ideas

- Linux URL: `https://github.com/Nexus-Mods/Vortex/wiki/Vortex-on-Linux` — dedicated Linux landing page. If the page doesn't yet exist, planner should add a task to stub it (or note it as a TODO comment in code).
- ONBRD-06b notification: message like "Could not open browser. Visit: \<url\>" — URL visible, selectable if possible.

</specifics>

<deferred>
## Deferred Ideas

- Per-topic Linux `WIKI_TOPICS` overrides (e.g. `deployment-methods-linux`) — deferred until Linux wiki pages exist for each topic.
- Creating the actual GitHub wiki page content for `Vortex-on-Linux` — documentation task outside this phase's scope.

</deferred>

---

*Phase: 23-help-links*
*Context gathered: 2026-04-17*
