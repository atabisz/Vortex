# Phase 22: Steam Deck Layout - Context

**Gathered:** 2026-04-17
**Status:** Ready for planning

<domain>
## Phase Boundary

Fix onboarding overlay and Bootstrap modal layout so all content and action buttons are accessible at 1280×800 (Steam Deck Desktop Mode). Two surfaces are in scope:

1. **ONBRD-05a** — The onboarding overlay (`.instructions-overlay.overlay-onboarding`) currently has a fixed `height: 466px` that can clip below an 800px viewport. Fix with CSS `max-height`.
2. **ONBRD-05b** — Bootstrap modals globally can push action buttons below the visible area at 800px. Fix with a global `max-height` + `flex-shrink: 0` on modal footer.

**Out of scope:** Responsive layout beyond 800px min-height, Gaming Mode (full-screen Steam Deck UI), any new UI components.

</domain>

<decisions>
## Implementation Decisions

### Overlay Fix (ONBRD-05a)

- **D-01:** Replace `height: 466px` with `max-height: calc(100vh - 80px)` on `.instructions-overlay.overlay-onboarding` in `dashlet.scss`. Add `overflow-y: auto` to allow scrolling if content exceeds the constrained height.
- **D-02:** The `<iframe height="335">` in `Overlay.tsx` stays at its fixed height. The overlay scrolls if needed — no changes to the iframe or `Overlay.tsx`.
- **D-03:** The existing `clamp()` position logic in `InstructionsOverlay.tsx` is unchanged — it already keeps the overlay within container bounds. Only CSS changes needed for ONBRD-05a.

### Modal Fix (ONBRD-05b)

- **D-04:** Apply a global rule covering **all** Bootstrap modals — not scoped to onboarding dialogs only. Hunting per-dialog is harder to maintain and future modals would be unprotected.
- **D-05:** The fix lives in a **new file**: `src/stylesheets/vortex/dialog-steam-deck.scss`. Import it alongside other `dialog-*.scss` files in the main stylesheet bundle. Clean separation; easy to find and remove if ever needed.
- **D-06:** Rules in `dialog-steam-deck.scss`:
  - `.modal-dialog { max-height: calc(100vh - 160px); overflow-y: auto; }`
  - `.modal-content { display: flex; flex-direction: column; height: 100%; }`
  - `.modal-footer { flex-shrink: 0; }` — prevents footer (buttons) from being pushed off-screen

### Platform Guard

- **D-07:** All CSS changes are **unconditional** — no Linux-only class or JS guard. At typical Windows viewport height (1024px+) the `max-height` rules have no visible effect. Viewport-responsive CSS is correct on all platforms.

### Claude's Discretion

- Exact pixel offset in `calc(100vh - 80px)` — any value that provides comfortable clearance from the top window chrome (title bar + OS chrome is typically 60–80px) is fine.
- Whether `overflow-y: auto` on `.modal-dialog` is sufficient or `.modal-body` also needs `overflow-y: auto` — planner should verify with the fomd dialog pattern (`dialog-fomod.scss` uses `flex: 1 0%` on `.modal-body`).
- Whether the SCSS import order matters for `dialog-steam-deck.scss` — add at end of import list.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase Requirements
- `.planning/REQUIREMENTS.md` §Steam Deck Layout (ONBRD-05) — ONBRD-05a and ONBRD-05b

### Key Source Files
- `src/stylesheets/vortex/dashlet.scss:561` — `.instructions-overlay.overlay-onboarding { height: 466px; width: 600px; }` — the line to fix for ONBRD-05a
- `src/stylesheets/vortex/instructions-overlay.scss` — base `.instructions-overlay` styles (position: absolute, z-index, border-radius)
- `src/renderer/src/extensions/instructions_overlay/InstructionsOverlay.tsx` — JS `clamp()` position logic (read to confirm no height constraint needed there)
- `src/renderer/src/extensions/onboarding_dashlet/views/Overlay.tsx` — contains `<iframe height="335">` (read-only reference — no changes here)
- `src/renderer/src/extensions/onboarding_dashlet/index.ts:50` — where `className: "overlay-onboarding"` is set on the overlay registration

### Modal Patterns to Follow
- `src/stylesheets/vortex/dialog-fomod.scss` — best existing example of flex modal layout (`modal-content: flex-column`, `modal-body: flex: 1 0%`, `modal-footer`)
- `src/stylesheets/vortex/globals.scss` — contains `.modal-open` blur rule; check import order before adding new file

No external specs — requirements fully captured in decisions above.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `InstructionsOverlay.tsx` `clamp()`: already constrains overlay *position* within container bounds — no changes needed, just verify it works with `max-height` applied
- `dialog-fomod.scss` flex-column pattern: the correct approach for making modal footer stick at bottom — mirrors what `dialog-steam-deck.scss` should do globally

### Established Patterns
- Per-dialog SCSS files (`dialog-fomod.scss`, `dialog-about.scss`, etc.) imported in the main stylesheet — `dialog-steam-deck.scss` follows this pattern
- CSS `max-height: calc(100vh - Npx)` already used in `dialog-history.scss` (60vh) and `dialog-categories.scss` (75vh) — `calc(100vh - 160px)` is consistent with this style

### Integration Points
- `src/stylesheets/vortex/` — add `dialog-steam-deck.scss` here
- Main SCSS import file (find via `grep -r "dialog-fomod\|@import\|@use" src/stylesheets/vortex.scss`) — add import for new file
- `dashlet.scss:561` — single-line change to `.instructions-overlay.overlay-onboarding`

</code_context>

<specifics>
## Specific Ideas

- No specific visual references — standard viewport-clamped layout
- The 80px clearance in `calc(100vh - 80px)` should account for the Electron window title bar + OS decorations
- The 160px clearance in `calc(100vh - 160px)` for modals accounts for modal chrome (header + footer) on top of the viewport budget

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 22-steam-deck-layout*
*Context gathered: 2026-04-17*
