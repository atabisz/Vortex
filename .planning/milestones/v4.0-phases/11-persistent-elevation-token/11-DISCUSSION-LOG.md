# Phase 11: Persistent Elevation Token - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-07
**Phase:** 11-persistent-elevation-token
**Areas discussed:** Packaging

---

## Packaging

| Option | Description | Selected |
|--------|-------------|----------|
| Bundled in .deb only | Ship the .rules file via electron-builder extraFiles (deb section). AppImage users don't get persistent token. Simple, no runtime writes. | ✓ |
| Bundled in both .deb and AppImage | AppImage ships the .rules file too, but AppImage has no install step — rule would need to be written on first launch via a pkexec-guarded write. More complex. | |
| Programmatic at first elevation | Vortex detects missing rule on first pkexec call and writes it. Requires elevation to write — chicken-and-egg. Works for any install method. | |

**User's choice:** Bundled in .deb only
**Notes:** "make sure the readme contains this difference between the packages" — documenting .deb vs AppImage limitation in README is a required deliverable, not optional.

---

## Rule Format (follow-up)

| Option | Description | Selected |
|--------|-------------|----------|
| .rules (JS) | Modern polkit JS rules file at /etc/polkit-1/rules.d/10-vortex.rules. Supported polkit 0.106+. Returns polkit.Result.AUTH_ADMIN_KEEP. | ✓ |
| .pkla (INI-style) | Legacy Local Authority format. Deprecated in newer polkit. ResultAny=auth_admin_keep. | |

**User's choice:** .rules (JS) — Recommended

---

## File Priority Prefix (follow-up)

| Option | Description | Selected |
|--------|-------------|----------|
| 10-vortex.rules | Low numeric prefix — runs early. Standard practice. | ✓ |
| 50-vortex.rules | Mid-priority. Only matters if other rules files for same action exist. | |

**User's choice:** 10-vortex.rules — Recommended

---

## Claude's Discretion

- Rule JS content: whether to use `subject.active` only vs add `isInGroup("sudo")` guard — delegated to Claude
- Session scoping strictness: auth_admin_keep is desktop-session-scoped; per-Vortex-launch re-prompt not strictly enforced — accepted implicitly

## Deferred Ideas

None.
