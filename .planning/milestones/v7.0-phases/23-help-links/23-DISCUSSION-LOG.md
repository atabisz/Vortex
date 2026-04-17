# Phase 23: Help Links - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-17
**Phase:** 23-help-links
**Areas discussed:** Linux target URL

---

## Linux Target URL

| Option | Description | Selected |
|--------|-------------|----------|
| Nexus Mods Linux wiki page | Use a Linux-specific page on https://wiki.nexusmods.com | |
| GitHub wiki Linux page | Point to Vortex GitHub wiki Linux-specific page | ✓ |
| Vortex repo README or docs | Link to fork/upstream repo docs page | |

**User's choice:** GitHub wiki — `https://github.com/Nexus-Mods/Vortex/wiki/Vortex-on-Linux` (new page to be created)

| Sub-option | Description | Selected |
|------------|-------------|----------|
| Single fallback only | All Linux wiki links → single Linux URL | ✓ |
| Add Linux entries to WIKI_TOPICS | Per-topic Linux-specific keys | |

**User's choice:** Single fallback only — no per-topic Linux overrides

---

## Browser Failure URL Display

| Option | Description | Selected |
|--------|-------------|----------|
| Redux notification with URL | Toast notification with visible URL via api.sendNotification() | ✓ |
| Dialog with copyable URL | Modal dialog with copyable text field | |
| Log only — Claude decides UX | Keep current silent log behavior | |

**User's choice:** Redux notification with URL

| Scope option | Description | Selected |
|--------------|-------------|----------|
| Any platform failure | Fire on any shell.openExternal() failure | ✓ |
| Linux-only | Only show notification on Linux | |

**User's choice:** Any platform — no Linux guard needed, clean upstream diff

---

## Claude's Discretion

- Exact notification text and type level
- IPC mechanism for main→renderer URL delivery on failure
- Whether `opn()` in `extensions/documentation/src/index.tsx` also needs the fix

## Deferred Ideas

- Per-topic Linux WIKI_TOPICS overrides — pending Linux wiki pages existing
- Creating Vortex-on-Linux GitHub wiki page content — documentation task outside phase scope
