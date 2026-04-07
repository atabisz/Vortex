# Phase 13: Save Transfer - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-07
**Phase:** 13-save-transfer
**Areas discussed:** Copy/ensureDir case-folding gap, Empty-state UX

---

## Copy/ensureDir case-folding gap

| Option | Description | Selected |
|--------|-------------|----------|
| Extend Phase 14 wrapper | Add resolvePathCase to copyAsync, renameAsync, and ensureDirAsync in fs.ts — same pattern as existing stat/readFile wrapping. One place, covers all future callers too. | ✓ |
| Fix inline in transferSavegames.ts | Resolve source/dest paths with resolvePathCase inside transferSavegames.ts itself. Targeted, keeps the change minimal but doesn't protect other callers. | |
| Skip — trust Wine path casing | Steam's Proton creates 'Documents', 'Saves' with standard Windows casing. Accept the risk rather than expanding Phase 14's surface area. | |

**User's choice:** Extend Phase 14 wrapper

---

## ensureDirAsync edge case confirmation

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, that's correct (non-existent → unchanged → create fresh) | Non-existent path → resolvePathCase returns it unchanged → ensureDirAsync creates it. The existing docs/saves parent is already case-resolved by the mygamesPath() call. | ✓ |
| Actually, resolve up to the last existing component | Walk up the path until you find a component that exists, resolve its casing, then reconstruct. More robust but more complex. | |

**User's choice:** Simple behavior is correct; no walk-up logic needed.

---

## Empty-state UX when no profiles have local_saves

| Option | Description | Selected |
|--------|-------------|----------|
| Show a helper message below the dropdown | When profileOptions is empty and global is unavailable, render a small italicized note: 'No profiles with local saves found. Enable local saves in Profile Settings to use save transfer.' No button needed. | ✓ |
| Keep current behavior — empty dropdown is clear enough | The dropdown just stays empty. Power users will figure it out. Less code, no UI change. | |
| Disable the transfer button with a tooltip | Grey out the 'Transfer' button when no sources are available. Tooltip explains why. More effort but standard disabled-control UX. | |

**User's choice:** Show helper message below dropdown (italicised, no button)

---

## Claude's Discretion

- Exact resolvePathCase call site placement within the fs.ts wrapper functions
- Whether to add Vitest tests for the new copy/rename wrapping
- Translation key name for the empty-state message

## Deferred Ideas

None.
