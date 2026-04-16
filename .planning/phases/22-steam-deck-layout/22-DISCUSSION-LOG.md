# Phase 22: Steam Deck Layout - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-17
**Phase:** 22-steam-deck-layout
**Areas discussed:** Overlay fix approach, Modal scope, Platform guard

---

## Overlay fix approach

| Option | Description | Selected |
|--------|-------------|----------|
| CSS max-height only | Change `height: 466px` → `max-height: calc(100vh - 80px)` in dashlet.scss. JS clamp() already handles position. | ✓ |
| JS clamp in InstructionsOverlay.tsx | Keep CSS height, add height cap in `applyPos()`. Touches generic overlay logic. | |
| Both: CSS max-height + overflow-y: auto | Belt-and-suspenders with scrollable content. | |

**User's choice:** CSS max-height only

---

## Iframe height (follow-up)

| Option | Description | Selected |
|--------|-------------|----------|
| Iframe stays fixed, overlay scrolls | Keep `<iframe height="335">`, add overflow-y: auto to overlay. One CSS rule. | ✓ |
| Iframe height responsive via CSS | Replace inline height attribute so iframe shrinks. Requires touching Overlay.tsx. | |

**User's choice:** Iframe stays fixed, overlay scrolls

---

## Modal scope

| Option | Description | Selected |
|--------|-------------|----------|
| Global `.modal-dialog` rule | One rule covering all Bootstrap modals. No per-dialog hunting. | ✓ |
| Onboarding dialogs only | Scope to parent class, lower blast-radius but harder to maintain. | |

**User's choice:** Global `.modal-dialog` rule

---

## Modal fix file location

| Option | Description | Selected |
|--------|-------------|----------|
| New file: dialog-steam-deck.scss | Clean separation alongside other dialog-*.scss files. | ✓ |
| Add to globals.scss | Fewer files but mixed with unrelated global rules. | |

**User's choice:** New file: dialog-steam-deck.scss

---

## Platform guard

| Option | Description | Selected |
|--------|-------------|----------|
| Unconditional CSS | Applies everywhere; at Windows heights the max-height has no effect. No JS needed. | ✓ |
| Linux-only via JS class | Body class on Linux, CSS scoped under it. Matches platform-guard pattern but complex. | |

**User's choice:** Unconditional CSS

---

## Claude's Discretion

- Exact pixel offset in `calc(100vh - 80px)` for overlay clearance
- Whether `overflow-y: auto` goes on `.modal-dialog` or `.modal-body`
- SCSS import order for `dialog-steam-deck.scss`

## Deferred Ideas

None.
