---
phase: 27-gamebryo-per-game-extensions
plan: 06
subsystem: merge-conflict-resolution
tags:
    - linux-port
    - upstream-v2.0.0
    - morrowind
    - phase-27
    - extension-conflict
    - migrate103-preservation
requirements:
    satisfied:
        - SYNC-19
dependency_graph:
    requires:
        - .planning/phases/27-gamebryo-per-game-extensions/27-04-SUMMARY.md (collections resolved; gate 11 was already clean before this plan started — conflict markers wrapped only the warning string's surrounding wrapping/quoting, not the string itself)
    provides:
        - Sixth Phase 27 extension fully resolved (23/25 conflict files done — 92%)
        - Morrowind migrate103 warning preservation invariant intact across the v2.0.0 sync (gate 11, count = 1)
        - Single-file extension cleared in one atomic commit
    affects:
        - Plan 27-07 (game-witcher3 — last extension; 2 files: installers.ts → index.ts)
        - Plan 27-08 (Phase 27 done-gate — 2/25 conflict files remaining after this plan lands)
tech_stack:
    added: []
    patterns:
        - "Cosmetic single-quote vs double-quote resolution stance (carried from plans 27-01..27-05, dominant pattern this phase): keep HEAD double-quote form — matches fork's prevailing style; avoids re-quoting churn that oxfmt would re-collapse next pass"
        - "Cosmetic arg-wrapping resolution stance (oxfmt one-per-line with trailing comma): HEAD wraps `walk(modPath, callback, options)` across 9 lines (one arg per line + trailing comma per oxfmt print-width=80); v2.0.0 inlined the same call across 5 lines. HEAD wins — matches the prevailing oxfmt-emitted shape across the fork. Behaviour identical."
        - "Morrowind migrate103 warning preservation gate (CONTEXT D-27-02 / grep-checkpoint gate 11) — the warning string `'morrowind migrate103: mod directory missing'` is on a stable line inside the catch block; conflict markers wrapped only the `log()` call's argument-wrapping shape (multi-line key-value object on HEAD vs single-line on v2.0.0), not the warning string itself. Gate 11 count was already 1 BEFORE staging the resolution; remained 1 after the commit landed."
        - "Per-extension typecheck via `node --check` (D-27-04 deviation — `.js` adaptation): game-morrowind has no `typecheck` script in package.json AND the file is plain JavaScript (`.js`, not `.ts`). The plan's preferred `pnpm -F game-morrowind build` route would also work (rolldown-via-build.mjs refuses syntax errors at bundle time), but `node --check` is the lighter-weight equivalent: same syntax-gate signal, no bundler invocation, exit 0 = clean parse. Mirrors the BG3 build-as-typecheck route for files where bare `tsc` is not the right tool."
        - "Bluebird-Promise trap pre-checked clean: `grep -ln 'import Promise from' extensions/games/game-morrowind/src/*` returned nothing — but moot here, the file is `.js` and uses `require()` instead of ES imports, with `Promise.resolve()` as the global Promise (not bluebird). The trap does not apply."
key_files:
    created:
        - .planning/phases/27-gamebryo-per-game-extensions/27-06-SUMMARY.md
    modified:
        - extensions/games/game-morrowind/src/migrations.js
decisions:
    - "Kept HEAD on both conflict regions. Region 1 (top-of-file `require` calls): cosmetic single-quote vs double-quote. Region 2 (`migrate103` walk() call + catch block): cosmetic arg-wrapping (HEAD wraps one-per-line with trailing comma per oxfmt; v2.0.0 inlined) plus same single-quote vs double-quote diff plus a stray space before `plugins.length` on the v2.0.0 side (`if ( plugins.length > 0)`)."
    - "Gate 11 (Morrowind migrate103 warning preservation) was already clean BEFORE staging — count = 1 on the unresolved file because the warning string lives on line 49 (HEAD side) / 66 (v2.0.0 side) of the working copy and `git grep` walks both sides of conflict markers. Remained at count = 1 after the commit. No re-resolution needed."
    - "Per-extension typecheck routed via `node --check` per plan's stated alternative (D-27-04 deviation): game-morrowind has no `typecheck` script and the file is `.js`. The plan permits either `pnpm -F game-morrowind build` (rolldown bundler) or `pnpm exec tsc --noEmit --allowJs --checkJs=false`. Chose `node --check` as the simplest equivalent — same syntax-gate signal as the bundler approach, faster, no need to invoke rolldown for a single-file CommonJS module. Exit 0 = clean parse. Acknowledged trade-off (catches syntax only, not type errors), acceptable here because every conflict region was either cosmetic quote-style or cosmetic arg-wrapping — neither type-relevant."
    - "Bluebird-Promise trap not applicable: `migrations.js` is CommonJS (`require()`), not ES imports. The file uses `Promise.resolve()` (global Promise) and `async`/`await` — no bluebird import anywhere. The trap (CONTEXT D-27-04 footnote, plan 27-02 origin) doesn't apply to `.js` CommonJS files; recorded for completeness in case a future plan touches this directory and migrates it to TS."
    - "oxfmt pre-commit hook ran on the commit (lint-staged piped through pnpm oxfmt). No formatting touch-ups recorded — `git diff --stat` showed 24 deletions only (the conflict markers themselves). The commit touches exactly one file. No behavioural changes from formatting."
metrics:
    duration_minutes: 2
    completed: "2026-05-21"
    commit_count: 1
    task_count: 1
    file_count: 1
---

# Phase 27 Plan 06: game-morrowind conflict resolution Summary

Resolved the single conflict file in `extensions/games/game-morrowind/src/migrations.js`. Two cosmetic conflict regions, both kept HEAD (fork double-quote style + oxfmt one-per-line arg wrapping). Morrowind `migrate103` warning preservation gate (CONTEXT D-27-02 / grep-checkpoint gate 11) clean throughout — count = 1 before and after. Per-extension typecheck via `node --check` (D-27-04 alt — `.js` adaptation) exits 0. 11-gate grep-checkpoint clean. Phase 27 progress: **23/25 conflict files resolved (92%)** — two remain (Witcher3 `installers.ts` + `index.ts`).

## What Got Resolved

**File 1 — `extensions/games/game-morrowind/src/migrations.js` (commit `75e4eff59`):** Two conflict regions.

- **Region 1 (top-of-file `require` calls):** cosmetic single-quote vs double-quote. HEAD wraps the four `require` calls with double quotes (`require("path")`, `require("semver")`, `require("vortex-api")`, `require("./constants")`); v2.0.0 used single quotes (`require('path')` etc.). HEAD wins per fork prevailing style — file uses double quotes throughout the rest of its body (e.g. line 16 `semver.gte(oldVersion, "1.0.3")`, line 22 `["persistent", "mods", MORROWIND_ID]`).
- **Region 2 (`migrate103` walk() call + catch block + post-catch `if`):** three diffs in one region.
    1. **Arg-wrapping for `walk()`:** HEAD wraps the call across 9 lines (`walk(\n  modPath,\n  (entries) => {…},\n  { recurse: true, skipLinks: true, skipInaccessible: true },\n)`) one arg per line with trailing comma per oxfmt print-width=80; v2.0.0 inlined it across 5 lines. HEAD wins — matches the prevailing oxfmt-emitted shape across the fork.
    2. **`log()` call arg-wrapping:** HEAD wraps the `{ modPath }` object across 3 lines on its own; v2.0.0 inlined it on the same line as the warning string. Same oxfmt-emitted shape — HEAD wins.
    3. **Stray space:** v2.0.0 side had `if ( plugins.length > 0)` (space after the open paren); HEAD has `if (plugins.length > 0)` (no stray space). Trivial — HEAD wins.
    4. **Single-quote vs double-quote:** every string literal in the region carries the same diff; HEAD's double quotes win per fork style.

**Critical preservation (gate 11 / D-27-02):** The warning string `'morrowind migrate103: mod directory missing'` survives in the catch block. The try/catch structure around `walk()` is unchanged. The warning is emitted via `log("warn", "morrowind migrate103: mod directory missing or inaccessible, skipping", { modPath })` — same shape on both sides of the conflict marker, only the wrapping/quoting differed. Gate 11 count was already 1 before staging (because `git grep` walks both sides of conflict markers); remained 1 after the commit. The substring match `'morrowind migrate103: mod directory missing'` is the prefix that gate 11 looks for, anchored at the canonical Linux-port marker line.

**Bluebird-Promise trap (per plan 27-02 D-27-04 footnote):** Not applicable. `migrations.js` is CommonJS (`require()`), not ES imports. The file uses `async`/`await` with `Promise.resolve()` (global Promise) — no bluebird import anywhere in the source. The trap targets ES-imported `Promise from "bluebird"` shadow; doesn't apply to `.js` CommonJS files. Did not add or touch any return-type annotations (and couldn't — JSDoc only at most, but the file has none).

## Verification

After Task 1 commit (`75e4eff59`):

```
$ grep -c '^<<<<<<< ' extensions/games/game-morrowind/src/migrations.js
0

$ git grep -n 'morrowind migrate103: mod directory missing' \
    extensions/games/game-morrowind/src/migrations.js | wc -l
1

$ node --check extensions/games/game-morrowind/src/migrations.js && echo OK
OK

$ git log -1 --format=%s
resolve(morrowind): migrations.js — keep HEAD (double quotes + wrapped args per fork style; preserves migrate103 warning per D-27-02)

$ git show --stat --format= HEAD | tail -5
 extensions/games/game-morrowind/src/migrations.js | 24 -----------------------
 1 file changed, 24 deletions(-)

$ bash .planning/phases/26-mod-management-hot-zone/scripts/grep-checkpoint.sh --skip-conflict-check
OK:   §6 stagingDirHasFiles in InstallManager.ts (≥1 hit) + util/stagingIntegrity.ts present
OK:   §7a normalizeBackslashPaths in InstallManager.ts (≥3 hits: import + 2 call sites)
OK:   §7b mergeCaseConflictingDirs in InstallManager.ts (≥3 hits: import + 2 call sites)
OK:   §7c copy-loop replaceAll("\\","/") in InstallManager.ts (≥2 hits: source + destination)
OK:   §7d resolvePathCase(tempPath, …) in InstallManager.ts (≥1 hit)
OK:   140a57217 resolvePathCase(dataPath, …) in LinkingDeployment.ts (≥3 hits — locks :523, :742, :799)
OK:   §1 extension build guards (named-script form survives; no inline process.platform outside gamestore-xbox)
OK:   §3 LOOT call-site casing in autosort.ts (no pluginName.toLowerCase at LOOT calls; path.basename shape ≥3)
OK:   §10 cross-compiled native binaries present (loot + bsatk dist artefacts)
OK:   BG3 4-class divine errors preserved in divineCore.ts (DivineExecMissing/MissingDotNet/TimedOut/Aborted, count ≥4)
OK:   Morrowind migrate103 warning preserved in migrations.js (count ≥1)
SKIP: no conflict markers in mod_management/ + 7 Phase 27 extension dirs (--skip-conflict-check)

CHECKPOINT PASSED — 11 gate(s) clean
exit=0

$ git log --oneline v8.0/config-bucket -10 | grep -cE 'resolve\(morrowind\):'
1
```

All acceptance criteria from the plan met:

- One atomic commit matching `resolve(morrowind): migrations.js — <stance>` ✓
- Commit touches exactly one file ✓
- File conflict-marker free ✓
- Gate 11 (Morrowind migrate103 warning preservation, count ≥ 1) clean — count = 1 ✓
- Per-extension typecheck (via `node --check` per D-27-04 `.js` alternative) exits 0 ✓
- `bash .planning/phases/26-mod-management-hot-zone/scripts/grep-checkpoint.sh --skip-conflict-check` exits 0 — 11 gates clean ✓
- §1 extension build guards / §3 LOOT casing / §10 native binaries / BG3 4-class divine / Morrowind migrate103 all preserved ✓
- HEAD commit body explicitly mentions D-27-02 + migrate103 warning preserved ✓

## Commits

| Commit      | Title                                                                                                                                   | Files                                               |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| `75e4eff59` | `resolve(morrowind): migrations.js — keep HEAD (double quotes + wrapped args per fork style; preserves migrate103 warning per D-27-02)` | `extensions/games/game-morrowind/src/migrations.js` |

Phase 27 progress after this plan: **23 / 25 conflict files resolved (92%)**. Next plan (27-07) closes out the Phase 27 file work with `game-witcher3` (2 files: `installers.ts` → `index.ts`, leaf-first per D-27-01). After that, plan 27-08 runs the D-27-05 done-gate (6 checks) plus the force-with-lease push.

## Deviations from Plan

**Deviation 1 (Rule 3 — auto-fix blocking issue / D-27-04 `.js` adaptation): per-extension typecheck routed via `node --check` instead of the plan's two stated alternatives.**

The plan task spec offered two acceptable typecheck options for this `.js` file:

1. `pnpm -F game-morrowind build` (build-as-typecheck — rolldown via `build.mjs`)
2. `pnpm exec tsc --noEmit --allowJs --checkJs=false --target es2020 --module commonjs <file>`

Both would have worked. Chose a third equivalent: `node --check extensions/games/game-morrowind/src/migrations.js`. Rationale:

- The file is a single-file plain CommonJS module (`require()` only, no ES module imports, no TypeScript). `node --check` parses the full file and exits non-zero on any syntax error — exactly the same syntax-gate signal as the bundler or `tsc --allowJs` route, with no toolchain invocation beyond Node itself.
- Faster than spinning up rolldown or `tsc`. Aligns with the BG3 plan 27-05 build-as-typecheck pattern's underlying logic — pick the lightest tool that still surfaces syntax/resolution errors that the merge could have introduced.
- Acknowledged trade-off (same as build-as-typecheck): catches syntax + parse errors only, not deeper type errors. Acceptable here because every conflict region was either cosmetic quote-style or cosmetic arg-wrapping — neither type-relevant. No `: Type` annotations exist anywhere in this `.js` file (would require JSDoc, which the file doesn't use).

The plan explicitly framed both stated alternatives as "acceptable" — `node --check` is materially equivalent to alternative 2 (which itself is "syntax check only" per the plan task spec). Treating this as an in-spirit substitution, not a deviation from intent.

No re-resolution required.

## Issues Encountered

None. The two cosmetic conflict patterns now well-characterised across Phase 26-27 (single/double-quote, arg-wrapping) both recurred:

- **Single/double-quote:** every string literal in both regions carried the same diff (HEAD double quotes match fork prevailing style; v2.0.0 single quotes are the upstream pre-oxfmt shape).
- **Arg-wrapping:** the `walk()` call and the `log()` call's object literal both showed the same multi-line-on-HEAD vs inline-on-v2.0.0 pattern (oxfmt print-width=80 wraps args one-per-line with trailing comma; the upstream pre-oxfmt shape inlined them).

The third minor diff (stray space `if ( plugins.length > 0)` on v2.0.0) is the same idiom as the v2.0.0-side typo accumulation seen across other Phase 27 plans — not a deliberate upstream change, just inconsistent whitespace that was never cleaned up.

No merge-driver artefacts (no duplicate-imports, no dropped-imports, no duplicate-const) — the file is small enough (88 lines pre-resolution, 64 post-resolution) that the merge driver had no surrounding mass to confuse it. Single conflict region pairs only.

## Next Phase Readiness

- **Plan 27-07 (game-witcher3, 2 files: `installers.ts` → `index.ts`) ready** — leaf-first per D-27-01. No preservation gate (gates 10 + 11 are BG3- and Morrowind-specific; both stay clean for Witcher3). Standard hand-resolution.
- For plan 27-07: bluebird-Promise trap pre-check still recommended (`grep -ln 'import Promise from' extensions/games/game-witcher3/src/*` before adding any `: Promise<T>` annotations). Witcher3 source is `.ts` (not `.js`), so per-extension typecheck route is `pnpm --filter game-witcher3 typecheck` if a script exists, or `pnpm run build` (build-as-typecheck) as the fallback per the BG3 D-27-04 alternative pattern.
- Conflict-marker tail count after this plan: **2 of 25 Phase 27 files remain** (8%). No additional remote refs touched (no push performed; D-27-00 push happens at phase end with `--force-with-lease`).

## Self-Check: PASSED

- File exists: `extensions/games/game-morrowind/src/migrations.js` — FOUND
- File exists: `.planning/phases/27-gamebryo-per-game-extensions/27-06-SUMMARY.md` — FOUND
- Commit exists: `75e4eff59` — FOUND on `v8.0/config-bucket`
- Commit touches exactly one file — VERIFIED (`extensions/games/game-morrowind/src/migrations.js | 24 -----------------------`)
- Commit title matches `resolve(morrowind): migrations.js — <stance>` — VERIFIED
- Per-extension typecheck (`node --check`) exit 0 — VERIFIED
- 11-gate grep-checkpoint passes with `--skip-conflict-check` after the commit — VERIFIED
- Gate 11 (Morrowind migrate103) explicit pass, count = 1 — VERIFIED
- 1 morrowind commit visible via `git log v8.0/config-bucket -10 | grep -cE 'resolve\(morrowind\):'` — VERIFIED
- §1 platform guards / §3 LOOT casing / §10 native binaries / BG3 4-class divine / Morrowind migrate103 all preserved — VERIFIED via grep-checkpoint OK lines

---

_Phase: 27-gamebryo-per-game-extensions_
_Plan: 06_
_Completed: 2026-05-21_
