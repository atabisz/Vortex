# Phase 22: Steam Deck Layout - Research

**Researched:** 2026-04-17
**Domain:** SCSS/CSS layout — viewport-clamped overlays and Bootstrap 3 modal flex layout
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**ONBRD-05a (Overlay fix):**
- D-01: Replace `height: 466px` with `max-height: calc(100vh - 80px)` on `.instructions-overlay.overlay-onboarding` in `dashlet.scss`. Add `overflow-y: auto`.
- D-02: `<iframe height="335">` in `Overlay.tsx` stays at its fixed height. No changes to `Overlay.tsx`.
- D-03: `InstructionsOverlay.tsx` `clamp()` position logic is unchanged. Only CSS changes needed.

**ONBRD-05b (Modal fix):**
- D-04: Apply a global rule covering all Bootstrap modals — not scoped to onboarding dialogs only.
- D-05: The fix lives in a **new file**: `src/stylesheets/vortex/dialog-steam-deck.scss`. Import after other `dialog-*.scss` files.
- D-06: Rules in `dialog-steam-deck.scss`:
  - `.modal-dialog { max-height: calc(100vh - 160px); overflow-y: auto; }`
  - `.modal-content { display: flex; flex-direction: column; height: 100%; }`
  - `.modal-footer { flex-shrink: 0; }`

**Platform Guard:**
- D-07: All CSS changes are unconditional — no Linux-only class or JS guard. Viewport-responsive CSS is correct on all platforms.

### Claude's Discretion

- Exact pixel offset in `calc(100vh - 80px)` — any value providing comfortable clearance from window chrome (~60–80px) is fine.
- Whether `overflow-y: auto` on `.modal-dialog` is sufficient or `.modal-body` also needs `overflow-y: auto` — planner should verify against `dialog-fomod.scss` which uses `flex: 1 0%` on `.modal-body`.
- Whether the SCSS import order matters for `dialog-steam-deck.scss` — add at end of import list.

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| ONBRD-05a | Onboarding overlay position clamped to viewport so it does not clip below 800px height | D-01/D-02/D-03 fully locked. Edit is one line in `dashlet.scss:561` — replace `height: 466px` with `max-height: calc(100vh - 80px)` and add `overflow-y: auto`. |
| ONBRD-05b | Bootstrap 3 modals have `max-height: calc(100vh - 160px)` and `flex-shrink: 0` on footer so buttons are accessible at 800px | D-04/D-05/D-06 fully locked. New file `dialog-steam-deck.scss` with three rules, imported in `style.scss` after line 497. |
</phase_requirements>

---

## Summary

Phase 22 is a pure CSS/SCSS fix phase. No TypeScript, no React, no new components. Two surfaces are in scope:

1. **ONBRD-05a** — The onboarding overlay in `dashlet.scss` uses a fixed `height: 466px`. On an 800px viewport this can clip below the visible area. The fix replaces this with `max-height: calc(100vh - 80px)` and adds `overflow-y: auto`. The position-clamp logic in `InstructionsOverlay.tsx` and the `<iframe>` in `Overlay.tsx` are untouched.

2. **ONBRD-05b** — Bootstrap 3 modals globally have no viewport-height constraint. At 800px the modal footer (action buttons) can be pushed off-screen. The fix adds a new `dialog-steam-deck.scss` with three rules: a `max-height` on `.modal-dialog`, a flex-column layout on `.modal-content`, and `flex-shrink: 0` on `.modal-footer` to pin buttons visible.

All implementation decisions are locked in CONTEXT.md. Research confirms exact file locations, import order, and the established SCSS patterns this phase must follow.

**Primary recommendation:** Make exactly three file changes — edit one line in `dashlet.scss`, create `dialog-steam-deck.scss`, add one `@import` line to `style.scss`.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Viewport-clamped overlay height | Browser / Client (SCSS) | — | Pure CSS max-height; no JS required beyond existing clamp() position logic |
| Modal footer visibility at 800px | Browser / Client (SCSS) | — | Bootstrap 3 flex-column pattern; footer pinned with flex-shrink: 0 |
| Import registration | Frontend Server (SCSS build) | — | `style.scss` is the SCSS bundle entry point compiled by SASS CLI at build time |

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| SCSS / SASS | 1.97.3 | Stylesheet authoring | Project standard; all Vortex styles are SCSS |
| Bootstrap 3.4.1 | 3.4.1 | Modal structure (`.modal-dialog`, `.modal-content`, `.modal-footer`) | Existing design system; all dialogs use Bootstrap 3 modal markup |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| react-bootstrap | 0.33.0 | React wrapper for Bootstrap 3 modals | Used by all existing dialog components; no changes here |

### Alternatives Considered

Not applicable — decisions are locked. No library choices needed for a SCSS-only edit.

**Installation:** No new packages required. [VERIFIED: codebase grep]

---

## Architecture Patterns

### System Architecture Diagram

```
SCSS Source Files
│
├── src/stylesheets/style.scss          ← bundle entry; @import list
│   ├── @import "vortex/dashlet"        ← ONBRD-05a: edit line 561
│   ├── @import "vortex/dialogs"        ← global modal base rules
│   ├── @import "vortex/dialog-fomod"   ← flex-column modal precedent
│   ├── @import "vortex/dialog-history" ← last dialog import (line 497)
│   └── @import "vortex/dialog-steam-deck"  ← NEW (ONBRD-05b)
│
└── SASS CLI compiles → renderer bundle CSS
```

Data flow: SASS CLI reads `style.scss`, processes all `@import` directives in order, outputs bundled CSS consumed by Electron renderer window.

### Recommended Project Structure

No new directory needed. Changes are in existing SCSS directories:

```
src/stylesheets/
├── style.scss                              # add one @import line (end of dialog imports)
└── vortex/
    ├── dashlet.scss                        # edit line 561 (ONBRD-05a)
    └── dialog-steam-deck.scss              # new file (ONBRD-05b)
```

### Pattern 1: Per-Dialog SCSS File

**What:** Each dialog has its own `dialog-{name}.scss` file scoped to that dialog's ID or class. The new file follows this convention but uses global Bootstrap selectors instead of a scoped ID.

**When to use:** Adding dialog-specific or cross-dialog CSS rules.

**Example (from `dialog-fomod.scss`):**
```scss
// Source: src/stylesheets/vortex/dialog-fomod.scss
#fomod-installer-dialog {
    .modal-content {
        height: 100%;
        width: 100%;
        display: flex;
        flex-direction: column;
    }

    .modal-body {
        flex: 1 0%;  // absorbs remaining space; footer stays pinned
    }

    .modal-footer {
        padding-top: 5px;
        padding-bottom: 5px;
    }
}
```

The new `dialog-steam-deck.scss` mirrors this flex-column pattern but applies it **globally** (no ID scope) so all modals benefit at 800px.

### Pattern 2: `max-height: calc(100vh - Npx)`

**What:** Viewport-relative height cap used in multiple existing SCSS files. N is chosen to clear window chrome.

**When to use:** When an element must not overflow the visible viewport area.

**Existing precedent:**
```scss
// Source: src/stylesheets/vortex/dialog-history.scss
.modal-body {
    height: 60vh;
    overflow: auto;
}

// Source: src/stylesheets/vortex/dialog-categories.scss
.categories-dialog {
    height: 75vh;
    display: flex;
    flex-direction: column;
}
```

The phase uses `calc(100vh - 160px)` for modals (accounts for Bootstrap modal header + footer chrome) and `calc(100vh - 80px)` for the overlay (accounts for Electron window title bar + OS chrome).

### Pattern 3: Overlay Fixed-Position with `clamp()`

**What:** `InstructionsOverlay.tsx` uses a JS `clamp()` on the `top`/`left` position values to keep the overlay within the container `#overlays` bounds. This is position clamping, not height clamping. It does NOT constrain the overlay height.

**When to use:** Understanding why a JS fix is NOT needed for ONBRD-05a — the overlay position is already clamped by JS; height clipping is a CSS concern only.

**Relevant source (InstructionsOverlay.tsx:69–88):**
```typescript
// Source: src/renderer/src/extensions/instructions_overlay/InstructionsOverlay.tsx
const applyPos = React.useCallback(
  (posIn: IPosition) => {
    if (ref.current !== null) {
      posIn.x = clamp(posIn.x, BORDER, container.clientWidth - ref.current.clientWidth - BORDER);
      posIn.y = clamp(posIn.y, BORDER, container.clientHeight - ref.current.clientHeight - BORDER);
    }
    ref.current.style.left = `${posIn.x}px`;
    ref.current.style.top  = `${posIn.y}px`;
    setPosImpl(posIn);
  },
  [setPosImpl],
);
```

**Key insight:** `clamp()` uses `ref.current.clientHeight` — the rendered height of the overlay element. If `height: 466px` causes the overlay to render taller than the container, `clientHeight` will be 466px and `clamp()` will compute a negative upper bound, allowing the overlay to clip. With `max-height: calc(100vh - 80px)` the rendered height shrinks to fit the viewport; `clamp()` then operates on a correct value.

### Anti-Patterns to Avoid

- **Scoping `dialog-steam-deck.scss` to an ID:** D-04 locks this as global. Per-dialog scoping would leave future modals unprotected.
- **Adding a platform guard JS class:** D-07 locks this as unconditional CSS. `max-height: calc(100vh - 160px)` is a no-op at 1024px+ viewport heights.
- **Editing `Overlay.tsx` or `InstructionsOverlay.tsx`:** D-02 and D-03 lock these as read-only. The iframe height and JS clamp logic are unchanged.
- **Adding `overflow-y: auto` to `.modal-body` without checking:** This is a discretion item. `dialog-fomod.scss` sets `flex: 1 0%` on `.modal-body`, which already makes the body absorb remaining space. A global `overflow-y: auto` on `.modal-body` may be needed if body content overflows; verify against fomd pattern before adding.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Viewport-responsive height | JS height calculation | CSS `max-height: calc(100vh - Npx)` | CSS handles viewport changes on resize; JS would require event listeners and re-render |
| Modal footer pinning | Custom modal wrapper component | `flex-shrink: 0` on `.modal-footer` | Bootstrap 3 flex layout already present in `common-dialog-wide`; one CSS rule is sufficient |
| Per-dialog height cap | Per-dialog SCSS `max-height` additions | Single global rule in `dialog-steam-deck.scss` | Global rule covers all current and future modals; per-dialog approach requires constant maintenance |

**Key insight:** The Bootstrap 3 flex-column modal pattern already exists in `dialog-fomod.scss` and `dialogs.scss` (`common-dialog-wide`). The phase applies the same pattern globally. No new abstractions needed.

---

## Common Pitfalls

### Pitfall 1: `.modal-content height: 100%` Requires Parent Height

**What goes wrong:** Setting `height: 100%` on `.modal-content` has no effect unless the parent `.modal-dialog` has an explicit or `max-height`-computed height.

**Why it happens:** `height: 100%` resolves against the parent's computed height. If `.modal-dialog` has no height constraint, the browser treats its height as `auto` and `100%` on `.modal-content` resolves to `auto` too.

**How to avoid:** The D-06 rules set `max-height: calc(100vh - 160px)` on `.modal-dialog` first, then `height: 100%` on `.modal-content`. This chain is correct — `max-height` gives `.modal-dialog` a computed height budget, making `.modal-content { height: 100% }` work.

**Warning signs:** If `.modal-footer` appears to be pushed off-screen despite the rules, check devtools to confirm `.modal-dialog` has a computed `max-height` applied (not overridden by a more specific rule).

### Pitfall 2: More-Specific Existing Rules Override Global Rules

**What goes wrong:** `dialogs.scss` already has `.modal-dialog { max-width: 60%; min-width: 400px; }`. Scoped dialog files (`#fomod-installer-dialog .modal-dialog { width: 60%; height: 60%; }`) have higher specificity.

**Why it happens:** CSS specificity — an ID-scoped rule beats a class-only rule.

**How to avoid:** The D-06 global rules use only class selectors (`.modal-dialog`, `.modal-content`, `.modal-footer`) — same specificity as existing rules in `dialogs.scss`. Import order determines cascade order. `dialog-steam-deck.scss` is imported last among dialog imports (after `dialog-history.scss`, line 497), so it wins over `dialogs.scss` for same-specificity conflicts. It does NOT override ID-scoped rules in `dialog-fomod.scss` — that is intentional; FOMD dialog already has its own flex layout.

**Warning signs:** If a specific dialog loses its custom height/width after this change, inspect whether the new global rule is overriding an ID-scoped rule. Fix by adding the appropriate ID scope to the global rule exclusion, or accepting the change if it's an improvement.

### Pitfall 3: `overflow-y: auto` on `.modal-dialog` vs `.modal-body`

**What goes wrong:** Placing `overflow-y: auto` on `.modal-dialog` causes the entire dialog to scroll as one block, including header and footer. The header/footer scroll out of view.

**Why it happens:** The scroll container is set at the wrong level.

**How to avoid:** The D-06 rules use `overflow-y: auto` on `.modal-dialog` as a fallback containment measure. The flex layout (`flex-direction: column` on `.modal-content`, `flex-shrink: 0` on `.modal-footer`) is what actually pins the footer. The preferred pattern is `overflow-y: auto` on `.modal-body` (see `dialog-fomod.scss`'s `flex: 1 0%` on `.modal-body`). If body content overflows within the clamped dialog, adding `overflow-y: auto` to `.modal-body` in `dialog-steam-deck.scss` is the correct fix (discretion item per CONTEXT.md).

### Pitfall 4: `@import` vs `@use` in SASS

**What goes wrong:** Using `@use` syntax when the file relies on globally available SCSS variables (`$brand-primary`, `$gutter-width`) from Bootstrap SCSS.

**Why it happens:** The project uses legacy `@import` throughout `style.scss`. `@use` creates a new namespace and variables are not globally visible.

**How to avoid:** Use `@import "vortex/dialog-steam-deck";` (matching the existing import style in `style.scss`). `dialog-steam-deck.scss` itself uses only plain CSS properties (no SCSS variables), so this is moot for the new file — but don't switch the import statement to `@use`. [VERIFIED: codebase — style.scss uses `@import` throughout]

---

## Code Examples

Verified patterns from official sources:

### ONBRD-05a: dashlet.scss edit

```scss
// Source: src/stylesheets/vortex/dashlet.scss line 561
// BEFORE:
.instructions-overlay.overlay-onboarding {
    height: 466px;
    width: 600px;
}

// AFTER:
.instructions-overlay.overlay-onboarding {
    max-height: calc(100vh - 80px);
    overflow-y: auto;
    width: 600px;
}
```

### ONBRD-05b: dialog-steam-deck.scss (new file)

```scss
// Source: CONTEXT.md D-06 + dialog-fomod.scss pattern
// Steam Deck Desktop Mode (1280×800) — prevent modal action buttons
// from being pushed below the visible area at 800px viewport height.
// max-height is a no-op at typical Windows viewport heights (1024px+).
.modal-dialog {
    max-height: calc(100vh - 160px);
    overflow-y: auto;
}

.modal-content {
    display: flex;
    flex-direction: column;
    height: 100%;
}

.modal-footer {
    flex-shrink: 0;
}
```

### ONBRD-05b: style.scss import registration

```scss
// Source: src/stylesheets/style.scss line 497 (existing)
@import "vortex/dialog-history";
// ADD immediately after:
@import "vortex/dialog-steam-deck";
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Fixed `height: 466px` on overlay | `max-height: calc(100vh - 80px)` + `overflow-y: auto` | Phase 22 | Overlay no longer clips at 800px viewport |
| No height constraint on Bootstrap modals | Global `max-height` + flex-column + `flex-shrink: 0` footer | Phase 22 | Modal buttons accessible at all viewport heights |

**No deprecated patterns introduced.** Both changes use plain CSS properties supported by all Chromium/Electron versions. [ASSUMED — flex and calc() have broad support; no specific version verification done]

---

## Runtime State Inventory

Not applicable — Phase 22 is a CSS-only change. No runtime state, databases, OS-registered items, or build artifacts are affected. No rename or migration involved.

---

## Environment Availability

Step 2.6: SKIPPED — Phase 22 is CSS/SCSS changes only. No external tools beyond the existing SASS CLI (already present in the project's `pnpm` devDependencies) are required.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.0 |
| Config file | `src/renderer/vitest.config.mts` |
| Quick run command | `pnpm run test --project src/renderer` |
| Full suite command | `pnpm run test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ONBRD-05a | `dashlet.scss` no longer contains `height: 466px` on `.instructions-overlay.overlay-onboarding` | Static assertion (grep) | `grep -c "height: 466px" src/stylesheets/vortex/dashlet.scss` should return 0 | ✅ (file exists; assertion is post-edit verification) |
| ONBRD-05a | `dashlet.scss` contains `max-height: calc(100vh - 80px)` on the overlay selector | Static assertion (grep) | `grep -c "max-height: calc(100vh - 80px)" src/stylesheets/vortex/dashlet.scss` should return 1 | ✅ |
| ONBRD-05b | `dialog-steam-deck.scss` exists and contains the three required rules | Static assertion (grep) | `grep -c "flex-shrink: 0" src/stylesheets/vortex/dialog-steam-deck.scss` should return 1 | ❌ Wave 0 (file to be created) |
| ONBRD-05b | `style.scss` imports `dialog-steam-deck` | Static assertion (grep) | `grep -c "dialog-steam-deck" src/stylesheets/style.scss` should return 1 | ❌ Wave 0 (line to be added) |

**Note:** This phase has no logic, no components, and no TypeScript — purely SCSS. Automated unit tests cannot verify visual rendering. The validation gate is:
1. Static grep assertions (above) confirm the rules exist in the right files.
2. Visual smoke test at 800px viewport (manual/UAT) confirms the fix works visually.

No Vitest test files need to be created. The SCSS compilation itself (checked via `pnpm run build` or the webpack renderer build) is the functional smoke test.

### Sampling Rate

- **Per task commit:** `grep -c "height: 466px" src/stylesheets/vortex/dashlet.scss` (should be 0 after ONBRD-05a commit)
- **Per wave merge:** `pnpm run build` (full SCSS compilation validates no SASS errors)
- **Phase gate:** Full suite green (`pnpm run test`) before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `src/stylesheets/vortex/dialog-steam-deck.scss` — to be created (covers ONBRD-05b rules)
- [ ] `@import "vortex/dialog-steam-deck"` in `style.scss` — to be added (covers ONBRD-05b registration)

*(No test file creation needed — SCSS changes are verified by build + grep)*

---

## Security Domain

Not applicable to this phase. ONBRD-05a and ONBRD-05b are pure visual/layout fixes. No authentication, session management, access control, input validation, cryptography, or data handling is involved.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `flex` and `calc()` CSS properties are supported in all Chromium/Electron versions used by this project | State of the Art | Negligible — both have been in Chromium since 2013; Electron 39 uses a very recent Chromium |
| A2 | The 80px clearance in `calc(100vh - 80px)` is sufficient for Electron title bar + OS window chrome on Steam Deck (SteamOS + KDE Plasma) | Standard Stack / Code Examples | If wrong, overlay still clips slightly — planner should treat 80px as starting point; UAT will confirm |
| A3 | The 160px clearance in `calc(100vh - 160px)` is sufficient to expose the modal footer at 800px viewport | Code Examples | If wrong, footer still clips — same UAT risk; value can be adjusted post-UAT |

---

## Open Questions (RESOLVED)

1. **Should `.modal-body` also get `overflow-y: auto`?**
   - What we know: `dialog-fomod.scss` uses `flex: 1 0%` on `.modal-body` which makes it absorb remaining space and implicitly clips content. Global rule does not set this.
   - What's unclear: Whether body content in non-FOMD dialogs (e.g., the onboarding steps dialog) overflows within the clamped `.modal-dialog` when `.modal-body` lacks `overflow-y: auto`.
   - Recommendation: Planner should add `overflow-y: auto` to `.modal-body` in `dialog-steam-deck.scss` as a precaution. CONTEXT.md explicitly permits this as a discretion item. Risk of adding it: minimal (existing dialogs with `flex: 1 0%` on body are unaffected). Risk of omitting it: body content scrolls outside the flex container boundary.
   - **RESOLVED:** Plan adds `.modal-body { overflow-y: auto; }` to `dialog-steam-deck.scss` per CONTEXT.md discretion authority. Risk is minimal; precautionary inclusion is correct.

2. **Does the `.modal-content { height: 100% }` rule conflict with `.common-dialog-regular .modal-dialog { height: 100 }` typo in `dialogs.scss`?**
   - What we know: `dialogs.scss:35` has `height: 100` (no unit) which is invalid CSS and ignored by browsers.
   - What's unclear: Whether this was intentional or a typo for `height: 100%`.
   - Recommendation: Planner should not fix this typo in Phase 22 (out of scope). The global rule `height: 100%` on `.modal-content` is safe regardless.
   - **RESOLVED:** `height: 100` (no unit) is invalid CSS and is browser-ignored. No conflict with `.modal-content { height: 100% }`. Typo is out of scope for Phase 22.

---

## Sources

### Primary (HIGH confidence)
- `src/stylesheets/vortex/dashlet.scss:561` — exact line with `height: 466px` verified by Read tool
- `src/stylesheets/vortex/dialog-fomod.scss` — flex-column modal pattern verified by Read tool
- `src/stylesheets/style.scss:488-497` — dialog import order verified by Read tool
- `src/stylesheets/vortex/dialogs.scss` — existing `.modal-dialog` rules verified by Read tool
- `src/renderer/src/extensions/instructions_overlay/InstructionsOverlay.tsx:69-88` — clamp() logic verified by Read tool
- `src/renderer/src/extensions/onboarding_dashlet/views/Overlay.tsx` — iframe height=335 verified by Read tool
- `.planning/phases/22-steam-deck-layout/22-CONTEXT.md` — all implementation decisions
- `.planning/phases/22-steam-deck-layout/22-UI-SPEC.md` — approved CSS change contract

### Secondary (MEDIUM confidence)
- `.planning/REQUIREMENTS.md §ONBRD-05a,05b` — requirement text and completion status

### Tertiary (LOW confidence)
- A1-A3 in Assumptions Log — CSS browser support and pixel clearance values (assumed from general knowledge)

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — SCSS version and Bootstrap version verified in CLAUDE.md and codebase
- Architecture: HIGH — all file locations and import order verified by direct file reads
- Pitfalls: HIGH — derived from actual code inspection, not training-data guesses
- Pixel clearance values (80px, 160px): MEDIUM — decisions locked in CONTEXT.md; exact values are discretion items pending UAT

**Research date:** 2026-04-17
**Valid until:** 2026-05-17 (stable — no external dependencies)
