# Phase 21: Mod Install Round-Trip Validation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-16
**Phase:** 21-mod-install-round-trip-validation
**Areas discussed:** Phase nature, Target game selection, Blocker handling scope, Done criteria

---

## Phase nature

| Option | Description | Selected |
|--------|-------------|----------|
| Code-fix phase | Run through the round-trip mentally/with code analysis, identify known blockers in the deploy path, and fix them surgically — same as prior phases. Human UAT happens informally at end. | ✓ |
| Pure UAT script | Produce a step-by-step human test script with expected results. No code changes — just documents the walkthrough. | |
| Discover-and-fix | Start by tracing the full deploy code path to find known blockers, fix those, then document a UAT checklist. Hybrid approach. | |

**User's choice:** Code-fix phase

---

| Option | Description | Selected |
|--------|-------------|----------|
| Deploy method selection | On Linux, the deploy settings UI may show no supported activator or a confusing choice — hardlink activator is expected to be the default but may need a Linux-aware default selection. | ✓ |
| Mod path resolution | The Proton game's mod directory path (inside compatdata) may not resolve correctly for the deploy step. | |
| Post-deploy INI/config edits | Some games require writing INI file entries after mod deploy — this may need a Linux-specific path or may fail silently. | |
| Not sure yet — research it | Let the research agent trace the full code path and surface what needs fixing. | |

**User's choice:** Deploy method selection

---

## Target game selection

| Option | Description | Selected |
|--------|-------------|----------|
| Skyrim SE | skyrimse — already validated for save paths, FOMOD-tested in Phase 15, well-known mod ecosystem. In the symlink_activator Gamebryo blocklist, so hardlink is the natural deploy method. | ✓ |
| Fallout 4 | fallout4 — also validated for save paths, also Gamebryo-blocked for symlinks. | |
| Any non-Gamebryo Proton game | Wider deploy method coverage but less prior validation in this repo. | |

**User's choice:** Skyrim SE

---

| Option | Description | Selected |
|--------|-------------|----------|
| Proton prefix path | Mods deploy into compatdata/<appid>/pfx/drive_c/... inside the Wine prefix — same as where saves live. The case-folding shim from Phase 14 handles this. | ✓ |
| Native Linux path | Some games expose a native Linux mod directory outside the Wine prefix. Skyrim SE does not. | |
| Not sure — let the research agent determine | Let the researcher check getModPaths for skyrimse. | |

**User's choice:** Proton prefix path

---

## Blocker handling scope

| Option | Description | Selected |
|--------|-------------|----------|
| Fix deploy method only | Scope limited to ensuring hardlink_activator is available and correctly selected as default for Skyrim SE on Linux. Other blockers deferred. | ✓ |
| Fix full round-trip end-to-end | Fix whatever it takes for install → deploy → enable to complete. | |
| Fix small, defer large | Fix blockers touching ≤2 files; open a new phase for larger fixes. | |

**User's choice:** Fix deploy method only

---

| Option | Description | Selected |
|--------|-------------|----------|
| Trace + document | If the code path is already clean, produce a code-complete verification note and add ONBRD-04 UAT steps to Phase 999.1 backlog. Mirrors ELEV-04/05 precedent. | ✓ |
| Find something else to fix | Keep digging until a real blocker is found. | |
| Declare done immediately | If no code changes needed, mark done with verification note. | |

**User's choice:** Trace + document

---

## Done criteria

| Option | Description | Selected |
|--------|-------------|----------|
| Code-complete + UAT checklist | Any deploy-method blockers fixed surgically. A UAT checklist added to Phase 999.1 backlog documents the install → deploy → enable steps for human validation. Mirrors ELEV-04/05 precedent. | ✓ |
| Code-complete only | Blockers fixed, ONBRD-04 marked code-complete. No UAT checklist. | |
| Hardware UAT pass required | Phase 21 doesn't close until someone physically runs the round-trip on Linux hardware. | |

**User's choice:** Code-complete + UAT checklist

---

| Option | Description | Selected |
|--------|-------------|----------|
| Phase 999.1 backlog | Add ONBRD-04 UAT steps to the existing Phase 999.1 backlog entry — same place as ELEV-04, ELEV-05, SAVE-05 hardware UAT items. | ✓ |
| Committed markdown in phase dir | Write a 21-UAT-CHECKLIST.md in the phase directory. | |
| Both | Commit the checklist to the phase dir AND add a pointer to Phase 999.1 backlog. | |

**User's choice:** Phase 999.1 backlog

---

## Claude's Discretion

- Exact line(s) needing platform-guarding in hardlink_activator or deploymentMethods.ts
- Whether `allTypesSupported` needs a Linux-aware path or the issue is upstream in `isSupported`
- Exact wording of ONBRD-04 UAT steps added to 999.1 backlog

## Deferred Ideas

- Post-deploy INI/config fixes for Skyrim SE on Linux — future phase if needed
- Symlink activator Linux `ensureAdmin()` behavior — follow-on if UX confusion found
- Full E2E hardware UAT pass — tracked in Phase 999.1 backlog
