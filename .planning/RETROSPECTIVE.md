# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

---

## Milestone: v1.0 — Linux Port Phase 1

**Shipped:** 2026-03-31
**Phases:** 5 | **Plans:** 10 | **Tasks:** 16

### What Was Built

- winapi-bindings 48-export Linux shim — single config alias covers all 21 import sites, zero source edits
- libloot 0.29.1 built from source via cmake+cargo; all 5 C++ native addons CI-compiled and verified on Linux
- FOMOD TCP transport validated end-to-end; Linux ELF binaries unpacked from asar
- `getIPCPath()` utility; all 4 IPC sites patched for Unix sockets; serialisation trap closed
- Elevation audit: pkexec confirmed absent from all startup paths, deferred to v2 with full documentation

### What Worked

- **Alias approach for winapi-bindings:** One webpack + rolldown config change covered all 21 import sites without any source edits — the highest-leverage change in the milestone
- **TDD with vi.resetModules() + dynamic import():** Caught the XDG `??` vs `||` edge case before integration; the test design matched the actual platform-branching code path
- **Audit-first for elevation:** Investing a plan in the elevation audit before implementing pkexec paid off immediately — confirmed zero startup-path elevation, saved a full phase of work
- **Phase ordering:** Research-verified dependency graph (runtime → winapi → native addons → FOMOD → IPC) prevented blocking at each handoff
- **Commit-per-task discipline:** Atomic commits per task made bisect trivial and kept the Windows CI signal clean throughout

### What Was Inefficient

- **loot RPATH:** Two attempts needed (patch-package RPATH then LD_LIBRARY_PATH in-process) — the cmake `PREFIX=` behavior (producing `libloot.so.0` not `liblibloot.so`) wasn't anticipated in the plan
- **IPC serialisation trap:** The `.toString()` closure path required a second pass — source grep alone was insufficient and the plan had to be extended to inspect the stringified child code path
- **Phase 4 ROADMAP status:** Checkbox for `04-02-PLAN.md` wasn't updated in ROADMAP.md despite SUMMARY.md existing on disk — caused a minor discrepancy at milestone close

### Patterns Established

- **Platform guard pattern:** `if (process.platform === 'linux') { ... }` before Windows path — used consistently across all 5 phases; serves as the canonical pattern for future Linux additions
- **Summary-based one-liner extraction:** SUMMARY.md `one_liner` field enables automated milestone archival; invest in the one-liner quality at plan-close time
- **verify-addons.cjs smoke test:** ldd-based verification (not require()) for native addons — avoids V8 ABI mismatch between plain node and Electron headers
- **Static import + vi.spyOn for node16 moduleResolution:** Dynamic `import()` in test files breaks under node16 — static import + spyOn is the correct pattern

### Key Lessons

1. **Alias at the build boundary, not the source.** Replacing a Windows-only native module with a shim works best at the webpack/rolldown resolver level — avoids touching every callsite and is 100% platform-isolated.
2. **Serialised closures are a hidden second call site.** Any `.toString()`'d function that references platform-specific values needs its own patch; source grep will miss it.
3. **Audit before implementing.** For elevation and pkexec: investing a plan in characterising the scope before coding saved significant implementation work. Pattern generalises to any uncertain-scope requirement.
4. **cmake library naming surprises.** cmake `PREFIX=` affects the `.so` filename; always verify the actual output filename matches the linker `-l` flag in `binding.gyp`.

### Cost Observations

- Model mix: Sonnet 4.6 (primary execution), Opus 4.6 (planning/research agents)
- Sessions: ~5 sessions across 1 day (2026-03-30 → 2026-03-31)
- Notable: High-leverage alias approach (Phase 2) and audit-first approach (Phase 5) each saved an estimated full phase of implementation work

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Sessions | Phases | Key Change |
|-----------|----------|--------|------------|
| v1.0 | ~5 | 5 | First milestone; research-verified dependency graph; audit-first for uncertain scope |

### Cumulative Quality

| Milestone | Tests Added | Zero-Dep Linux Additions | CI Platforms |
|-----------|-------------|--------------------------|--------------|
| v1.0 | 22+ (Vitest) | 5 phases, 0 Windows regressions | ubuntu-latest + windows-latest |

### Top Lessons (Verified Across Milestones)

1. **Alias at the build boundary** — resolve module substitutions in webpack/rolldown config, not in source files
2. **Audit before implementing** — characterise scope of uncertain requirements before coding; often reveals the requirement is smaller than assumed
