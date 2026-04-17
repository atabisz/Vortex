---
phase: 22-steam-deck-layout
reviewed: 2026-04-17T00:00:00Z
depth: standard
files_reviewed: 3
files_reviewed_list:
  - src/stylesheets/vortex/dashlet.scss
  - src/stylesheets/vortex/dialog-steam-deck.scss
  - src/stylesheets/style.scss
findings:
  critical: 0
  warning: 3
  info: 2
  total: 5
status: issues_found
---

# Phase 22: Code Review Report

**Reviewed:** 2026-04-17
**Depth:** standard
**Files Reviewed:** 3
**Status:** issues_found

## Summary

Three files were reviewed: the new `dialog-steam-deck.scss`, the modified `dashlet.scss`, and the modified `style.scss`. Cross-referencing was done against `dialogs.scss`, `dialog-fomod.scss`, `dialog-external-change.scss`, `dialog-login.scss`, `dialog-history.scss`, `instructions-overlay.scss`, and `bootstrap-override.scss`.

The dashlet change is clean. The import in `style.scss` is correctly placed. The main concern is in `dialog-steam-deck.scss`: the global `.modal-content` flex rule (`display: flex; flex-direction: column; height: 100%`) is applied unconditionally to every modal in the application. Several existing dialogs already set their own flex model on `.modal-content` scoped inside a parent ID, but the global baseline introduced here will silently affect every modal that does not have a specific override — including "regular" dialogs rendered by `common-dialog-regular` (which have no height constraint on `.modal-content`). There is also a missing `flex: 1` on `.modal-body` that breaks the intended column layout, and a `max-height` + `overflow-y` applied to `.modal-dialog` (not `.modal-content`) that adds a second scroll container above the body-level scroll.

---

## Warnings

### WR-01: `.modal-content` flex rule applied globally, breaks unconstrained dialogs

**File:** `src/stylesheets/vortex/dialog-steam-deck.scss:9-13`

**Issue:** The rule

```css
.modal-content {
    display: flex;
    flex-direction: column;
    height: 100%;
}
```

is a global, unscoped selector. `height: 100%` on `.modal-content` is meaningful only when its parent (`.modal-dialog`) has a definite height. For modals rendered via `.common-dialog-regular` (dialogs.scss line 27), `.modal-dialog` has `height: 100` (unitless, a pre-existing no-op), so `height: 100%` resolves to 0 — the content collapses. For `.common-dialog-wide` and `#fomod-installer-dialog`, those already set `height: 100%` on `.modal-content` scoped inside a parent selector, so there is no conflict there. However, all other non-wide, non-scoped modals now inherit this rule. The `height: 100%` on `.modal-content` with no parent height is harmless on Windows (content dictates height), but is a latent fragility and diverges from the existing pattern where height is always scoped to a parent class or ID.

**Fix:** Scope the rule to apply only when a height constraint is already present, or add a max-height rather than height. The safest pattern matching existing conventions:

```scss
// Only clamp when the dialog has a height constraint (Steam Deck modal viewport fix)
.modal-dialog {
    max-height: calc(100vh - 160px);
    overflow-y: auto;
}

// Only apply flex column when .modal-dialog has the Steam Deck max-height active
// (i.e., when dialog height is bounded); use a wrapper class to scope it
// OR rely solely on max-height+overflow on .modal-dialog without touching .modal-content
```

If the intent is for `.modal-body` to scroll and `.modal-footer` to stay pinned, the fix also requires `height: 100%` on `.modal-dialog` (not just `max-height`), which leads to WR-02.

---

### WR-02: Missing `flex: 1` on `.modal-body` breaks the scroll-pin-footer layout

**File:** `src/stylesheets/vortex/dialog-steam-deck.scss:15-17`

**Issue:** The file sets up a flex column layout on `.modal-content` and uses `flex-shrink: 0` on `.modal-footer` to keep it pinned. However, `.modal-body` has only `overflow-y: auto` — there is no `flex: 1 1 0` or `flex-grow: 1` to make it expand and fill remaining space. Without it, `.modal-body` shrinks to its natural content height, the flex column does not create the intended "body scrolls, footer pins" layout, and the `overflow-y: auto` on `.modal-body` will never activate (the body is never height-constrained relative to the container). The scroll is handled instead by `overflow-y: auto` on `.modal-dialog`, meaning the entire dialog scrolls as a unit — the footer scrolls off-screen exactly as it would without this fix.

Note: `#fomod-installer-dialog` and `.common-dialog-wide` set `flex: 1 0%` on `.modal-body` inside a scoped parent, but those are unaffected by the global `.modal-body` rule here.

**Fix:**

```scss
.modal-body {
    flex: 1 1 0;
    overflow-y: auto;
}
```

---

### WR-03: Double scroll container — `overflow-y: auto` on `.modal-dialog` AND `.modal-body`

**File:** `src/stylesheets/vortex/dialog-steam-deck.scss:4-7`

**Issue:** The file adds `overflow-y: auto` to `.modal-dialog`. If WR-02 is fixed (`.modal-body` also gets `overflow-y: auto`), there will be two independent scroll containers on the same content path. In the corrected layout the outer `.modal-dialog` scroll would never activate (content fits within `max-height`) and the inner `.modal-body` scroll would handle overflow. However, the `.modal-dialog` scroll is the only thing currently working (without the `.modal-body` flex fix), so removing it before fixing WR-02 would regress the feature. The two should be resolved together.

The clean end state is:
- `.modal-dialog`: `max-height: calc(100vh - 160px)` only, no `overflow-y`
- `.modal-content`: `display: flex; flex-direction: column; height: 100%` (already present)
- `.modal-body`: `flex: 1 1 0; overflow-y: auto` (needs to be added)
- `.modal-footer`: `flex-shrink: 0` (already present)

**Fix:** Remove `overflow-y: auto` from `.modal-dialog` once `.modal-body` has `flex: 1 1 0; overflow-y: auto`.

```scss
.modal-dialog {
    max-height: calc(100vh - 160px);
    // overflow-y: auto; -- remove this; scroll handled by .modal-body
}
```

---

## Info

### IN-01: Commented-out code in `dashlet.scss`

**File:** `src/stylesheets/vortex/dashlet.scss:179, 213, 219, 394-395`

**Issue:** Several lines contain commented-out CSS properties (`//margin-right: 6px;`, `//margin-right: 8px;`, `//justify-content: space-between;`, `//padding: 8px !important;`, `//overflow-x: auto;`). These are pre-existing rather than introduced by this phase, but they are present in the reviewed file.

**Fix:** Remove commented-out rules or replace with a `// TODO:` explaining intent if the value is meaningful.

---

### IN-02: No-op unitless `height: 100` in `dialogs.scss` `.common-dialog-regular`

**File:** `src/stylesheets/vortex/dialogs.scss:35`

**Issue:** `.common-dialog-regular .modal-dialog` sets `height: 100` with no unit. This is a pre-existing bug (not introduced by this phase) but it means the `height: 100%` added globally to `.modal-content` by dialog-steam-deck.scss has no resolved parent height in `common-dialog-regular` contexts. This makes the WR-01 concern above specifically relevant to that dialog class.

**Fix:** This is out of scope for the Steam Deck phase but should be noted — either the `height: 100` should be removed or corrected to `height: 100%` as part of any cleanup.

---

_Reviewed: 2026-04-17_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
