---
phase: 22-steam-deck-layout
plan: 01
subsystem: ui
tags: [scss, css, steam-deck, modal, onboarding, viewport]

requires: []
provides:
  - "Onboarding overlay viewport-clamped (max-height: calc(100vh - 80px), overflow-y: auto)"
  - "Global Bootstrap modal viewport clamp via dialog-steam-deck.scss"
  - "Modal flex-column layout with pinned footer (flex-shrink: 0)"
affects: []

tech-stack:
  added: []
  patterns:
    - "max-height + overflow-y pattern for viewport-constrained overlays"
    - "Flex-column modal layout with pinned footer via global SCSS"

key-files:
  created:
    - src/stylesheets/vortex/dialog-steam-deck.scss
  modified:
    - src/stylesheets/vortex/dashlet.scss
    - src/stylesheets/style.scss

key-decisions:
  - "Unconditional CSS (no platform guard) — max-height is a no-op at typical Windows viewport heights (1024px+)"
  - "Global class selectors for modal rules so all Bootstrap dialogs benefit; ID-scoped rules (dialog-fomod) retain higher specificity"
  - "Added .modal-body { overflow-y: auto } per RESEARCH.md Open Question 1 — harmless for dialogs with existing flex: 1 0%"

patterns-established:
  - "Viewport-clamped overlay: replace fixed height with max-height: calc(100vh - N) + overflow-y: auto"
  - "Global modal flex-column layout: .modal-content display:flex + flex-direction:column + height:100%; .modal-footer flex-shrink:0"

requirements-completed:
  - ONBRD-05a
  - ONBRD-05b

duration: 10min
completed: 2026-04-17
---

# Phase 22-01: Steam Deck Layout Summary

**Replaced fixed 466px overlay height and added global modal viewport clamp so all content and action buttons are accessible at 1280×800 (Steam Deck Desktop Mode).**

## Performance

- **Duration:** ~10 min
- **Completed:** 2026-04-17
- **Tasks:** 2
- **Files modified:** 2 (dashlet.scss, style.scss) + 1 created (dialog-steam-deck.scss)

## Accomplishments

### Task 1: Clamp onboarding overlay (ONBRD-05a)

Replaced `height: 466px` with `max-height: calc(100vh - 80px)` and `overflow-y: auto` on `.instructions-overlay.overlay-onboarding` in `dashlet.scss`. The overlay now contracts at 800px viewport height instead of clipping below the visible area.

### Task 2: Global modal viewport clamp (ONBRD-05b)

Created `src/stylesheets/vortex/dialog-steam-deck.scss` with:
- `.modal-dialog { max-height: calc(100vh - 160px); overflow-y: auto }` — prevents modal from exceeding viewport
- `.modal-content { display: flex; flex-direction: column; height: 100% }` — enables flex layout
- `.modal-body { overflow-y: auto }` — body scrolls within constrained height
- `.modal-footer { flex-shrink: 0 }` — footer/action buttons always pinned at bottom

Registered the import in `style.scss` after `dialog-history`, before `window-controls`.

## Self-Check: PASSED

- `grep -c "height: 466px" dashlet.scss` → 0 ✓
- `grep -c "max-height: calc(100vh - 80px)" dashlet.scss` → 1 ✓
- `dialog-steam-deck.scss` exists ✓
- `grep -c "max-height: calc(100vh - 160px)" dialog-steam-deck.scss` → 1 ✓
- `grep -c "flex-shrink: 0" dialog-steam-deck.scss` → 1 ✓
- `grep -c "overflow-y: auto" dialog-steam-deck.scss` → 2 ✓
- `grep -c "dialog-steam-deck" style.scss` → 1 ✓
- No ID selectors in dialog-steam-deck.scss ✓
- No TypeScript/React files modified ✓
