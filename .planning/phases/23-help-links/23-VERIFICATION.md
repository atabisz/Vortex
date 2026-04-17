---
phase: 23-help-links
verified: 2026-04-17T11:05:00Z
status: human_needed
score: 7/7
overrides_applied: 0
human_verification:
  - test: "Launch Vortex on Linux, click Help > Knowledge Base in modern layout"
    expected: "Browser opens https://github.com/Nexus-Mods/Vortex/wiki/Vortex-on-Linux (not the generic wiki URL)"
    why_human: "Runtime platform guard — process.platform === 'linux' only evaluates correctly on an actual Linux system; cannot verify browser navigation programmatically"
  - test: "On a system with no default browser configured, trigger any Help link that calls shell.openExternal"
    expected: "A warning notification appears in the Vortex notification panel showing 'Could not open browser' with the target URL displayed"
    why_human: "IPC push and notification rendering require Electron runtime; cannot invoke shell.openExternal failure path without a running app instance"
---

# Phase 23: Help Links Verification Report

**Phase Goal:** Linux users reach Linux-specific documentation when using help features, and get the target URL inline if the browser launcher fails
**Verified:** 2026-04-17T11:05:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Linux user clicking Knowledge Base (modern layout) is routed to Linux-specific wiki page | VERIFIED | `extensions/documentation/src/index.tsx` line 125-127: `process.platform === "linux" ? LINUX_WIKI_URL : WIKI_URL` in `open-knowledge-base` handler with `LINUX_WIKI_URL = "https://github.com/Nexus-Mods/Vortex/wiki/Vortex-on-Linux"` |
| 2 | Non-Linux user clicking Knowledge Base continues to get generic wiki URL (no regression) | VERIFIED | Same ternary: non-linux arm returns `WIKI_URL = "https://github.com/Nexus-Mods/Vortex/wiki"` unchanged |
| 3 | User on SteamOS or no-browser system sees the target URL inline instead of silent failure | VERIFIED | IPC push chain confirmed wired end-to-end: `open.ts` catch handler → `betterIpcMain.send("shell:openUrlFailed")` → preload `onOpenUrlFailed` → `sendNotification({type:"warning", id:"open-url-failed", message:"Visit: {{url}}"})` |
| 4 | When shell.openExternal rejects, every non-destroyed BrowserWindow receives the IPC message | VERIFIED | `open.ts` lines 11-19: `BrowserWindow.getAllWindows()` loop with `isDestroyed()` guard. Unit test confirms push fires on reject and is skipped for destroyed windows. All 3 Vitest tests pass. |
| 5 | Preload bridge exposes onOpenUrlFailed on the shell namespace | VERIFIED | `preload/index.ts` lines 48-51: `onOpenUrlFailed: (callback) => betterIpcRenderer.on("shell:openUrlFailed", (_, url) => callback(url))` |
| 6 | TypeScript compiles without errors across shared, preload, and main packages | VERIFIED | SUMMARY-01 documents all three TS projects compile clean after `pnpm --filter @vortex/shared build`; commits ba3014a45 and a7ddfbd3c are present and green |
| 7 | Warning notification fires on any platform (no platform guard on failure notification) | VERIFIED | `onOpenUrlFailed` callback in `index.tsx` lines 140-148 has no platform guard — fires whenever the IPC message arrives, regardless of platform |

**Score:** 7/7 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/shared/src/types/ipc.ts` | `shell:openUrlFailed` MainChannels entry | VERIFIED | Line 172: `"shell:openUrlFailed": (url: string) => void;` present in `MainChannels` interface |
| `src/shared/src/types/preload.ts` | `onOpenUrlFailed` method on Shell interface | VERIFIED | Lines 108-109: `onOpenUrlFailed(callback: (url: string) => void): void;` on `Shell` interface |
| `src/preload/src/index.ts` | `onOpenUrlFailed` preload bridge wiring | VERIFIED | Lines 48-51: `onOpenUrlFailed` using `betterIpcRenderer.on("shell:openUrlFailed", ...)` |
| `src/main/src/open.ts` | `betterIpcMain.send` on openUrl failure | VERIFIED | Lines 1-21: `BrowserWindow.getAllWindows()` loop with `betterIpcMain.send(win.webContents, "shell:openUrlFailed", url.toString())` in `.catch()` handler |
| `src/main/src/open.test.ts` | Unit test for openUrl failure push behavior | VERIFIED | 3 Vitest tests: push on reject (pass), no-push on resolve (pass), skip destroyed windows (pass) — all pass |
| `extensions/documentation/src/index.tsx` | LINUX_WIKI_URL constant, platform guard, and onOpenUrlFailed listener | VERIFIED | Lines 28-29: constant; lines 125-127: guard; lines 140-148: listener — all three present |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/main/src/open.ts` | `src/shared/src/types/ipc.ts` | `betterIpcMain.send` typed against MainChannels | WIRED | `betterIpcMain.send(win.webContents, "shell:openUrlFailed", ...)` at lines 13-17 — split across lines so gsd-tools pattern match failed, but manually confirmed present |
| `src/preload/src/index.ts` | `src/shared/src/types/ipc.ts` | `betterIpcRenderer.on` typed against MainChannels | WIRED | `betterIpcRenderer.on("shell:openUrlFailed", ...)` at line 49 — manually confirmed |
| `extensions/documentation/src/index.tsx` | preload `shell.onOpenUrlFailed` | `window.api.shell.onOpenUrlFailed` callback in `context.once()` | WIRED | gsd-tools confirmed: pattern found in source (line 140) |
| `extensions/documentation/src/index.tsx` | `context.api.sendNotification` | notification dispatch inside `onOpenUrlFailed` callback | WIRED | `sendNotification({type:"warning", id:"open-url-failed", ...})` at lines 141-147 — multiline call; gsd-tools pattern missed it but manually confirmed |

**Note on gsd-tools false negatives:** The key-link tool reported 3 of 4 links as "not found." All 3 were due to multiline call formatting where the channel name and the call site are on different lines. Manual grep confirmed all links are correctly wired.

### Data-Flow Trace (Level 4)

The documentation extension does not maintain its own data store. The notification is a fire-and-forget call to `context.api.sendNotification` with a URL received from the IPC event. No persistent state involved.

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|--------------|--------|--------------------|--------|
| `extensions/documentation/src/index.tsx` | `url` in `onOpenUrlFailed` callback | `betterIpcMain.send(win.webContents, "shell:openUrlFailed", url.toString())` in `open.ts` — URL originates from the `URL` object passed to `openUrl()` | Yes — URL is the actual URL that failed to open | FLOWING |
| `extensions/documentation/src/index.tsx` | `fallbackUrl` in `open-knowledge-base` handler | `LINUX_WIKI_URL` or `WIKI_URL` constant selected by `process.platform` at runtime | Yes — compile-time constants, not empty | FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| `open.test.ts` all 3 unit tests pass | `pnpm vitest run --project @vortex/main src/main/src/open.test.ts` | `3 passed (3)` | PASS |
| `shell:openUrlFailed` present in ipc.ts, open.ts, preload/index.ts | `grep -c "shell:openUrlFailed" src/shared/src/types/ipc.ts src/main/src/open.ts src/preload/src/index.ts` | `1`, `1`, `1` | PASS |
| `LINUX_WIKI_URL` present and used in documentation extension | `grep -c "LINUX_WIKI_URL" extensions/documentation/src/index.tsx` | `2` (definition + usage) | PASS |
| `onOpenUrlFailed` present in documentation extension | `grep -c "onOpenUrlFailed" extensions/documentation/src/index.tsx` | `1` | PASS |
| Linux platform guard is the correct ternary form | `grep "process.platform" extensions/documentation/src/index.tsx` | `process.platform === "linux" ? LINUX_WIKI_URL : WIKI_URL` | PASS |
| Linux runtime routing in browser | Requires running Vortex on Linux | N/A | ? SKIP (human needed) |
| Browser failure notification displays correctly | Requires Electron runtime with simulated no-browser | N/A | ? SKIP (human needed) |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| ONBRD-06a | 23-02-PLAN.md | `open-knowledge-base` handler uses Linux URL branch on Linux | SATISFIED | `process.platform === "linux" ? LINUX_WIKI_URL : WIKI_URL` in `index.tsx` line 125-126; `LINUX_WIKI_URL` routes to `https://github.com/Nexus-Mods/Vortex/wiki/Vortex-on-Linux` |
| ONBRD-06b | 23-01-PLAN.md, 23-02-PLAN.md | `opn()` failure shows URL inline rather than silently failing | SATISFIED | Full IPC chain from `open.ts` catch → `shell:openUrlFailed` push → preload bridge → `onOpenUrlFailed` → `sendNotification` with URL in message body |

**Note on ONBRD-06a wording:** REQUIREMENTS.md describes this as "WIKI_TOPICS includes Linux-specific entries" but CONTEXT.md explicitly descoped per-topic WIKI_TOPICS overrides (D-02) in favor of a single fallback URL platform guard. The ROADMAP success criteria (the binding contract) requires "User who clicks 'Get Help' on Linux is routed to a Linux-specific wiki page" — this is satisfied by the fallback URL guard. The REQUIREMENTS.md description predates the final design decision.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `extensions/documentation/src/index.tsx` | 8, 52-54 | `TODO_GROUP` references | Info | Pre-existing code, not introduced by Phase 23; these are variable/constant names for existing tutorial functionality, not stub markers |

No blockers found.

### Human Verification Required

#### 1. Linux Wiki URL Routing

**Test:** Launch Vortex on Linux (`pnpm run start`). Click Help in the header, then "Knowledge Base" (or equivalent in modern layout). Confirm the browser opens.
**Expected:** Browser navigates to `https://github.com/Nexus-Mods/Vortex/wiki/Vortex-on-Linux`, not to the generic `https://github.com/Nexus-Mods/Vortex/wiki`
**Why human:** The `process.platform === "linux"` guard only evaluates to `true` at runtime on a Linux system. Cannot verify browser navigation without running the app.

#### 2. Browser Failure Notification

**Test:** On a system with no default browser, or by temporarily unsetting `$BROWSER`, trigger a help link that calls `shell.openExternal`. Alternatively, patch `open.ts` to force-reject and rebuild.
**Expected:** A warning notification appears in the Vortex notification panel with title "Could not open browser" and the target URL displayed in the message body.
**Why human:** IPC event dispatch and notification rendering require the full Electron runtime. Cannot invoke the `shell.openExternal` failure path without a running app instance.

**Note from SUMMARY:** Plan 02 Task 2 was a `checkpoint:human-verify` gate that was approved on 2026-04-17. The approver confirmed both items above. This verification report preserves those items as human-needed because the independent verifier cannot reconfirm runtime behavior.

### Gaps Summary

No automated gaps found. All 7 must-have truths verified, all 6 artifacts pass all three levels (exists, substantive, wired), and the data-flow trace confirms real URL values flow through the notification path.

The `human_needed` status reflects 2 runtime behaviors that require a live Linux Electron environment to confirm independently. The phase author's human-verify checkpoint was approved during execution, but independent runtime confirmation is recommended before closing the milestone.

---

_Verified: 2026-04-17T11:05:00Z_
_Verifier: Claude (gsd-verifier)_
