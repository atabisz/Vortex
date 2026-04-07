# Phase 14: Linux Case-Folding fs Wrapper - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-07
**Phase:** 14-linux-case-folding-fs-wrapper
**Areas discussed:** Promotion target, Shim scope definition, Shim integration point, PluginPersistor fate

---

## Promotion Target

| Option | Description | Selected |
|--------|-------------|----------|
| src/renderer/src/util/ + re-export via vortex-api | Add to renderer util/, export from api.ts → vortex-api as util.resolvePathCase | ✓ |
| @vortex/shared package | Add to src/shared/src/ — clean separation but requires new fs dependency | |
| @vortex/fs package | Add to packages/fs/ — fs-focused but bundled extensions don't import from it | |

**User's choice:** `src/renderer/src/util/` + re-export via vortex-api as `util.resolvePathCase`

---

## How to expose from vortex-api

| Option | Description | Selected |
|--------|-------------|----------|
| Add to the util export | util.resolvePathCase — consistent with existing util import pattern | ✓ |
| Named export directly from vortex-api | import { resolvePathCase } from 'vortex-api' — simpler call site | |

**User's choice:** Add to the `util` export

---

## Shim Scope Definition

| Option | Description | Selected |
|--------|-------------|----------|
| Wine prefix substring check | Path contains '/compatdata/' and '/pfx/' — O(1) per call, covers all Proton games | ✓ |
| Registered roots | Extensions call shimFs.registerRoot() — flexible but requires all extensions to opt-in | |
| All paths on Linux | Apply to every fs call — simplest code, potential perf impact on hot paths | |

**User's choice:** Wine prefix substring check (`/compatdata/` + `/pfx/`)

---

## Wine prefix scope breadth

| Option | Description | Selected |
|--------|-------------|----------|
| Proton/Wine only — /compatdata/ + /pfx/ | Matches the actual problem space: Skyrim SE, Fallout 4, any Proton game | ✓ |
| Any game AppData path on Linux | Broader: also intercept ~/.config/<game> etc. — harder to define precisely | |

**User's choice:** Proton/Wine only

---

## Shim Integration Point

| Option | Description | Selected |
|--------|-------------|----------|
| Patch util/fs.ts directly — transparent to callers | Wrap readFileAsync, writeFileAsync, statAsync, watch in util/fs.ts — zero call site changes | ✓ |
| New shimmedFs export — opt-in at call sites | Separate shimmedFs object, extensions import it explicitly | |
| Higher-level wrapper per game extension | Each extension wraps its own calls — still per-callsite, exactly what Phase 14 avoids | |

**User's choice:** Patch `util/fs.ts` directly

---

## Which fs operations to intercept

| Option | Description | Selected |
|--------|-------------|----------|
| readFile, writeFile, stat, watch | All four — symmetric read+write ensures no duplicate files on disk | ✓ |
| readFile and stat only | Simpler but write would still use literal path — could create duplicate-cased files | |

**User's choice:** `readFile`, `writeFile`, `stat`, `watch`

---

## PluginPersistor Fate

| Option | Description | Selected |
|--------|-------------|----------|
| Remove resolvePluginsFilePath — shim handles it | Shim makes the method redundant; cleaner code; Phase 14 includes gamebryo commit | ✓ |
| Keep as belt-and-suspenders | Redundant — confuses future contributors about which mechanism is authoritative | |
| Commit it now, remove in Phase 14 execution | Two-commit approach: fix now, clean up later | |

**User's choice:** Remove — shim handles it transparently. Phase 14 includes a cleanup commit to gamebryo-plugin-management.

---

## Watch handler toLowerCase() fix

| Option | Description | Selected |
|--------|-------------|----------|
| Keep .toLowerCase() watch fix permanently | inotify event fileName is outside the shim's reach — this fix is necessary regardless | ✓ |
| Remove it — shim will handle it | Incorrect: shim wraps setup path, not event callback filenames | |

**User's choice:** Keep permanently

---

## Claude's Discretion

- Exact wrapper pattern in `fs.ts` for PromiseBB compatibility
- Test coverage design (Wine prefix path → resolvePathCase; non-Wine path → passthrough; Windows → short-circuit)

## Deferred Ideas

- Native Linux game AppData case-folding (~/.config/, ~/.local/share/) — v5.0+
- Extending shim to lstatAsync, ensureDirAsync, moveAsync — if new issues surface
