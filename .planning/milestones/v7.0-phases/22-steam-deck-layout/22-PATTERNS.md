# Phase 22: Steam Deck Layout - Pattern Map

**Mapped:** 2026-04-17
**Files analyzed:** 3 new/modified files
**Analogs found:** 3 / 3

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `src/stylesheets/vortex/dashlet.scss` (edit line 561) | stylesheet | transform | `src/stylesheets/vortex/instructions-overlay.scss` | exact — same overlay element, sibling selector |
| `src/stylesheets/vortex/dialog-steam-deck.scss` (new) | stylesheet | transform | `src/stylesheets/vortex/dialog-fomod.scss` | exact — same role (per-dialog SCSS file), same flex-column modal pattern |
| `src/stylesheets/style.scss` (add import line after 497) | config | transform | `src/stylesheets/style.scss` lines 488-497 | exact — same file, same import block pattern |

---

## Pattern Assignments

### `src/stylesheets/vortex/dashlet.scss` — edit line 561 (stylesheet, transform)

**Analog:** `src/stylesheets/vortex/instructions-overlay.scss`

**The target selector** (dashlet.scss lines 561-564):
```scss
.instructions-overlay.overlay-onboarding {
    height: 466px;
    width: 600px;
}
```

**Secondary analog — `max-height: calc()` pattern from `instructions-overlay.scss` lines 77-78:**
```scss
.instructions-overlay-content {
    max-height: 36vh;
    /* ... */
}
```

**Secondary analog — `max-height: calc()` with viewport units from `dialog-history.scss` lines 5-16:**
```scss
.modal-body {
    height: 60vh;
    overflow: auto;
}
```

**Core edit pattern** — replace fixed `height` with viewport-clamped `max-height` + scroll:
```scss
// BEFORE (dashlet.scss line 561):
.instructions-overlay.overlay-onboarding {
    height: 466px;
    width: 600px;
}

// AFTER (D-01 decision — preserves width, removes fixed height):
.instructions-overlay.overlay-onboarding {
    max-height: calc(100vh - 80px);
    overflow-y: auto;
    width: 600px;
}
```

**Key constraint:** `width: 600px` is NOT changed. Only `height: 466px` is replaced. D-02 locks `Overlay.tsx` as read-only — no component changes.

---

### `src/stylesheets/vortex/dialog-steam-deck.scss` — new file (stylesheet, transform)

**Analog:** `src/stylesheets/vortex/dialog-fomod.scss`

**File header pattern** (dialog-about.scss line 1 — comment convention):
```scss
// about dialog
```

**Flex-column modal pattern from analog** (dialog-fomod.scss lines 1-23):
```scss
#fomod-installer-dialog {
    .modal-dialog {
        width: 60%;
        height: 60%;
    }

    .modal-content {
        height: 100%;
        width: 100%;
        display: flex;
        flex-direction: column;
    }

    .modal-body {
        flex: 1 0%;
        display: flex;
        padding: $half-gutter $gutter-width;
    }

    .modal-footer {
        padding-top: 5px;
        padding-bottom: 5px;
    }
}
```

**Existing global `.modal-dialog` rules in `dialogs.scss` lines 1-4** (rules the new file must coexist with):
```scss
.modal-dialog {
    max-width: 60%;
    min-width: 400px;
}
```

**`common-dialog-wide` flex pattern from `dialogs.scss` lines 39-66** (second analog — same flex-column approach):
```scss
.common-dialog-wide {
    .modal-dialog {
        height: 80%;
        width: auto;
    }

    .modal-content {
        height: 100%;
        width: 100%;
        display: flex;
        flex-direction: column;
    }

    .modal-body {
        flex: 1 0%;
        display: flex;
        padding: $half-gutter $gutter-width;
    }
}
```

**Core pattern for new file** (D-06 decision — global, unscoped selectors):
```scss
// Steam Deck Desktop Mode (1280x800) -- prevent modal action buttons
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

**Discretion item — `.modal-body` overflow:** The CONTEXT.md permits adding `overflow-y: auto` to `.modal-body` in this file. The `dialog-fomod.scss` analog uses `flex: 1 0%` on `.modal-body` which absorbs remaining space and clips content. For non-FOMD dialogs that lack this, body content can overflow within the clamped dialog. The safe pattern (from `dialogs.scss` lines 69-73) is:
```scss
.dialog-container {
    max-height: 60vh;
    overflow-y: auto;
}
```
Planner should add `.modal-body { overflow-y: auto; }` to `dialog-steam-deck.scss` as a precaution (CONTEXT.md explicitly permits this; risk of adding is minimal since `flex: 1 0%` dialogs are unaffected).

**Specificity note:** The new file uses only class selectors (`.modal-dialog`, `.modal-content`, `.modal-footer`) — same specificity as the existing rules in `dialogs.scss`. ID-scoped rules in `dialog-fomod.scss` (e.g., `#fomod-installer-dialog .modal-content`) have higher specificity and will NOT be overridden. This is intentional — FOMD already has its own flex layout.

---

### `src/stylesheets/style.scss` — add `@import` line after line 497 (config, transform)

**Analog:** `src/stylesheets/style.scss` lines 488-497

**Existing import block pattern** (style.scss lines 488-497):
```scss
@import "vortex/dialog-about";
@import "vortex/dialog-categories";
@import "vortex/dialog-diagnostic-files";
@import "vortex/dialog-extensions";
@import "vortex/dialog-external-change";
@import "vortex/dialog-fix-deployment";
@import "vortex/dialog-fomod";
@import "vortex/dialog-login";
@import "vortex/dialog-search-paths";
@import "vortex/dialog-history";
```

**Core edit pattern** — add new import at end of dialog block (after line 497):
```scss
@import "vortex/dialog-history";
@import "vortex/dialog-steam-deck";    // ADD THIS LINE
```

**CRITICAL syntax note:** Use `@import` (NOT `@use`). The project uses `@import` throughout `style.scss`. `@use` creates a new namespace and breaks access to globally available SCSS variables. `dialog-steam-deck.scss` uses only plain CSS properties so this is doubly moot, but the import line in `style.scss` must use `@import` to match existing convention.

**Import order significance:** Importing last among the dialog files means `dialog-steam-deck.scss` rules win over same-specificity rules in earlier files (e.g., `dialogs.scss`) for cascade tie-breaking. This is intentional — the new global `max-height` on `.modal-dialog` needs to take precedence over the existing global rules in `dialogs.scss` which set only `max-width` and `min-width`.

---

## Shared Patterns

### Pattern: `max-height: calc(100vh - Npx)` for viewport-clamped heights

**Source:** Multiple files — `dialog-history.scss` (60vh), `dialog-categories.scss` (75vh), `instructions-overlay.scss` (36vh), `dialogs.scss` (.dialog-container at 60vh)

**Apply to:** Both ONBRD-05a (overlay) and ONBRD-05b (modal)

```scss
// Overlay (dashlet.scss):
max-height: calc(100vh - 80px);    // 80px clears Electron title bar + OS chrome

// Modal dialog (dialog-steam-deck.scss):
max-height: calc(100vh - 160px);   // 160px clears modal header + OS chrome at 800px
```

---

### Pattern: Flex-column modal layout with pinned footer

**Source:** `src/stylesheets/vortex/dialog-fomod.scss` (ID-scoped) and `src/stylesheets/vortex/dialogs.scss` `.common-dialog-wide` (class-scoped)

**Apply to:** `dialog-steam-deck.scss`

The pattern chain is:
1. Parent (`.modal-dialog`) gets explicit height budget via `max-height`
2. Child (`.modal-content`) gets `height: 100%` + `flex-direction: column` — this works because parent has computed height from `max-height`
3. Body (`.modal-body`) gets `flex: 1 0%` or `overflow-y: auto` to absorb remaining space
4. Footer (`.modal-footer`) gets `flex-shrink: 0` — prevents it from being squeezed off-screen

```scss
// From dialog-fomod.scss — the canonical chain:
.modal-dialog { height: 60%; }           // gives parent computed height
.modal-content { height: 100%; display: flex; flex-direction: column; }
.modal-body { flex: 1 0%; }              // absorbs space, pins footer below
.modal-footer { padding-top: 5px; }      // footer stays at bottom naturally
```

---

### Pattern: Per-dialog SCSS file structure

**Source:** `src/stylesheets/vortex/dialog-fomod.scss`, `dialog-about.scss`, `dialog-history.scss`

**Apply to:** `dialog-steam-deck.scss` (structure/header convention)

Convention:
- Optional comment header line describing the dialog: `// steam deck layout fixes`
- No blank line between file header comment and first rule
- All rules inside a single outermost scope (ID or global class selectors)
- Use `$half-gutter`, `$gutter-width`, `$brand-*` SCSS variables from Bootstrap theme if needed (though `dialog-steam-deck.scss` uses only plain CSS — no SCSS variables required)

---

### Pattern: `@import` syntax for SCSS bundle entry

**Source:** `src/stylesheets/style.scss` (entire file uses `@import` throughout)

**Apply to:** The import line added to `style.scss`

```scss
// Correct (matches project convention):
@import "vortex/dialog-steam-deck";

// Wrong (do NOT use):
@use "vortex/dialog-steam-deck";
```

---

## No Analog Found

None. All three file changes have direct analogs in the codebase.

---

## Metadata

**Analog search scope:** `src/stylesheets/vortex/`, `src/stylesheets/style.scss`
**Files scanned:** 6 SCSS files read in full
**Pattern extraction date:** 2026-04-17

**Verified source locations:**
- `src/stylesheets/vortex/dashlet.scss` line 561 — target selector confirmed by Read tool
- `src/stylesheets/vortex/dialog-fomod.scss` lines 1-23 — flex-column analog confirmed by Read tool
- `src/stylesheets/vortex/dialogs.scss` lines 1-66 — existing global `.modal-dialog` rules confirmed by Read tool
- `src/stylesheets/vortex/instructions-overlay.scss` lines 77-78 — `max-height` precedent confirmed by Read tool
- `src/stylesheets/style.scss` lines 488-497 — import block and insertion point confirmed by Read tool
- `src/stylesheets/vortex/dialog-history.scss` lines 5-16 — `vh`-unit height precedent confirmed by Read tool
- `src/stylesheets/vortex/dialog-categories.scss` lines 11-15 — `vh`-unit flex precedent confirmed by Read tool
