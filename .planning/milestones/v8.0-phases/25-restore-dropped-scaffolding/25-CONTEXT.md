# Phase 25: Restore dropped scaffolding - Context

**Gathered:** 2026-05-15
**Status:** Ready for planning

<domain>
## Phase Boundary

Bring upstream `v2.0.0` files that PR #4's auto-merge dropped back onto the `v8.0/config-bucket` branch — `packages/paths`, `packages/paths-node`, `extensions/gamebryo-ba2-support`, the new download-path files (`chunking.ts`, `chunking.test.ts`, `downloader.test.ts`), the four missing CI workflows, and the dropped docs (`flatpak-*`, `AGENTS-DEBUGGING.md`) — while deliberately *not* restoring upstream's Jest scaffolding (the fork is Vitest-only). Output: tree contents on `v8.0/config-bucket` match upstream `v2.0.0` byte-for-byte except where the fork deliberately diverges; divergences documented in `VORTEX-LINUX-MERGE-PLAYBOOK.md` §11 with re-grep checks future syncs run.

**Files restored this phase (confirmed missing on `v8.0/config-bucket`, present on upstream parent `8b5a9f675`):**
- `packages/paths/` (49 files) + `packages/paths-node/` (8 files)
- `extensions/gamebryo-ba2-support/` (5 files) — new extension; ba2tk added to catalog
- `src/main/src/downloading/{chunking.ts, chunking.test.ts, downloader.test.ts}` — required by upstream's new DownloadManager
- `extensions/collections/__tests__/bsdiff-node.test.ts` (Vitest-compatible name)
- `.github/workflows/{package.yml, signing-test.yml, update-api-tag.yml, review-extension-issue-created.yml}`
- `docs/flatpak-maintenance.md`, `docs/flatpak-technical.md`, `AGENTS-DEBUGGING.md`
- Anything else surfaced by the discovery diff against upstream parent that isn't on the deliberate-drop list

**Deliberately NOT restored (deny-list):**
- `src/renderer/jest.config.mjs`
- `src/renderer/src/__mocks__/` (25 files)
- `src/renderer/src/__tests__/` (49 files)

**Out of scope this phase:** Source-conflict resolution (Phases 26–28). Linux-specific fixes inside restored files (e.g., `chunking.ts` backslash handling) — defer to Phase 26+ where Playbook §6/§7 work happens. Build verification (Phase 29).

</domain>

<decisions>
## Implementation Decisions

### Restore mechanism
- **D-25-01:** Canonical restoration command is `git checkout 8b5a9f675 -- <paths>` against the upstream-side parent of merge commit `138da2249`. Pinning the SHA explicitly (not `origin/master`) is reproducible — downstream agents can re-derive without ambiguity.
- **D-25-02:** Discovery diff runs first, before any restoration commits. Command:
  ```bash
  git diff --name-status v8.0/config-bucket 8b5a9f675 \
    -- ':!src/renderer/src/__mocks__' \
       ':!src/renderer/src/__tests__' \
       ':!src/renderer/jest.config.mjs' \
    | grep '^A'
  ```
  Output enumerates every file present upstream but missing on the branch (excluding the deny-list). User reviews surprises (anything not on the ROADMAP-listed restore set or the deny-list) before commits land. Files on the ROADMAP restore set auto-restore; files on the deny-list never restore; surprises get a per-file accept/reject.
- **D-25-03:** Pre-classified deny-list: `src/renderer/jest.config.mjs`, `src/renderer/src/__mocks__/**`, `src/renderer/src/__tests__/**`. The renderer is Vitest-only; Jest config never returns. Codified in playbook §11 (D-25-12).

### Restoration order + commits
- **D-25-04:** Five atomic commits on `v8.0/config-bucket`, in this order:
  1. `restore(packages): paths + paths-node from upstream v2.0.0` — `packages/paths/` + `packages/paths-node/` together (paths-node depends on `@vortex/paths`).
  2. `restore(extensions): gamebryo-ba2-support + ba2tk catalog entry + CI rebuild` — extension files + catalog entry + `release-linux.yml` step + (D-25-09 if accepted) `verify-addons.cjs` extension.
  3. `restore(downloading): chunking + downloader tests for v2.0.0 DownloadManager` — three files together.
  4. `restore(ci): missing upstream workflows` — four `.github/workflows/*.yml` files. Commit body enumerates the deliberate-drop list (Jest scaffolding) so per-phase provenance lives with the restoration, not just in the playbook.
  5. `restore(docs): flatpak + AGENTS-DEBUGGING` — three doc files.
- **D-25-05:** Commit-title format `restore(<area>): <thing> — <stance>`. Mirrors Phase 24's `resolve(config): ...` pattern. Each commit body cites the upstream parent SHA `8b5a9f675` and the restoration command used.
- **D-25-06:** `pnpm install` runs after commits 1, 2, and 5 (final). Each install must succeed before the next workspace-affecting commit. Commit 5 also runs `pnpm install --frozen-lockfile` as the phase done-gate, matching Phase 24's two-pass-install discipline.
- **D-25-07:** Push back to `fork/sync/upstream-v2.0.0` once at phase end with `--force-with-lease` (defends against the daily `rebase-upstream.yml` cron). Same pattern as Phase 24 D-02.

### ba2-support Linux pattern
- **D-25-08:** `extensions/gamebryo-ba2-support/package.json` scripts use the named-script form per ROADMAP success criterion 2:
  ```json
  "_native": "node ../copy-native.mjs ./node_modules/ba2tk/build/Release/ba2tk.node",
  "_build":  "node build.mjs && pnpm run _native && pnpm extractInfo",
  "build":   "node ../skip-on-windows.mjs && pnpm run _build && node ../copy-extension.mjs out",
  "dist":    "node ../skip-on-windows.mjs && pnpm run _build && node ../copy-extension.mjs dist",
  "typecheck": "pnpm tsc"
  ```
  No inline `node -e \"if(process.platform==='win32')process.exit(1)\"` guards (Playbook §1 prohibits inline `process.platform` checks). `extensions/skip-on-windows.mjs` already exists in the fork.
- **D-25-09:** `release-linux.yml` gets a ba2tk native-rebuild step modeled on the existing bsatk step. Resolves `ba2tk/package.json` from `extensions/gamebryo-ba2-support/node_modules`, runs `node fetch_ba2tk.js` if present, then `npx node-gyp rebuild --target=39.8.0 --arch=x64 --dist-url=https://electronjs.org/headers`. Add an assertion for `ba2tk` in `scripts/verify-addons.cjs` so the AppImage build fails loudly if the rebuild produces no usable `.node`.
- **D-25-10:** `ba2tk` is added to `pnpm-workspace.yaml` catalog. Version source: read upstream's `pnpm-lock.yaml` at `8b5a9f675` and pin to whatever upstream resolved. **Open question for the executor:** CLAUDE.md lists `node-ba2tk` as a custom-fork dependency. Before adding to the catalog, the executor must confirm whether the fork already vendors a custom `ba2tk` (grep `package.json` files for `node-ba2tk` or `atabisz/node-ba2tk`); if so, the catalog entry points at the fork's git URL, not upstream's npm version. This is a pre-commit-2 read, not a separate decision.

### Chunking files
- **D-25-11:** `chunking.ts`, `chunking.test.ts`, `downloader.test.ts` restored as-is (byte-for-byte from upstream parent). Linux-specific concerns (backslash handling, `process.platform` checks) are deferred to Phase 26 (mod_management hot zone) and Phase 28 (renderer + main spine) where Playbook §6/§7 work happens. Restoring as-is keeps Phase 25 a pure restore phase. If Phase 29 typecheck/test surfaces a breakage, fix forward there.

### Jest divergence documentation
- **D-25-12:** Add a new `## §11 Deliberate test-runner divergences` section to `VORTEX-LINUX-MERGE-PLAYBOOK.md` with the same shape as existing §1–§10 entries. Body must include:
  - Statement: renderer uses Vitest exclusively; upstream Jest scaffolding is dropped on every sync.
  - Files that MUST NOT exist on master: `src/renderer/jest.config.mjs`, `src/renderer/src/__mocks__/`, `src/renderer/src/__tests__/`.
  - Re-grep verification command (mirrors §1–§10 verification style):
    ```bash
    ! test -f src/renderer/jest.config.mjs \
      && ! test -d src/renderer/src/__mocks__ \
      && ! test -d src/renderer/src/__tests__ \
      || { echo "Playbook §11 violation: Jest scaffolding present"; exit 1; }
    ```
  - Rationale: fork migrated renderer to Vitest pre-v8.0; Jest config + `__mocks__/` would shadow Vitest's `vi.mock` and produce silent test-runner ambiguity.
- **D-25-13:** Append a new row to the playbook's commit-index table linking back to this phase's restoration commits (specifically commit 4, which has the deliberate-drop list in its body). Strongest provenance — a future maintainer chasing "why is Jest dropped?" can trace from playbook → commit-index → restoration commit body → this CONTEXT.md.
- **D-25-14:** Commit 4's body (`restore(ci): missing upstream workflows`) enumerates every file the executor *did not* restore from upstream parent and why. At minimum the deny-list (D-25-03); plus any surprises from the discovery diff that the user confirmed should stay dropped. Two-source provenance: playbook §11 for ongoing policy, commit body for this-phase decisions.

### Done gate
- **D-25-15:** Phase 25 done-gate is all five:
  1. `git checkout 8b5a9f675 -- <restored paths>` ran for every file enumerated in D-25-04 commits 1–5; `git diff v8.0/config-bucket 8b5a9f675 -- <those paths>` is empty (byte-for-byte match).
  2. `pnpm install` succeeds after commit 1 (paths workspaces resolve), after commit 2 (ba2-support workspace + ba2tk catalog resolve), and at end of phase.
  3. `pnpm install --frozen-lockfile` succeeds after commit 5 — lockfile internally consistent with all restored package.jsons.
  4. `pnpm typecheck -F @vortex/paths -F @vortex/paths-node` passes (matches ROADMAP success criterion 1 literal text).
  5. `git grep -nE 'jest\.config\.mjs|src/renderer/src/__(mocks|tests)__' v8.0/config-bucket -- ':!VORTEX-LINUX-MERGE-PLAYBOOK.md'` returns empty (deliberate-drop policy enforced; playbook itself is the only file allowed to mention these paths).

### Claude's discretion
- Per-rule merging inside `eslint.config.mjs` files isn't in scope (Phase 24 territory).
- Whether `node-ba2tk` is a fork-vendored custom dep or upstream's npm `ba2tk` — left to the executor to grep and confirm before commit 2 (D-25-10 documents the check).
- Discovery diff "surprises" handling — executor surfaces the list to the user before commit 5 (workflows + docs); user accepts/rejects; rejected files get noted in commit 5's body alongside the Jest deny-list.
- Whether to add a `scripts/verify-addons.cjs` ba2tk assertion in commit 2 (D-25-09) or as a separate small commit if it grows beyond a one-liner — left to executor.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project / milestone scope
- `.planning/PROJECT.md` — fork constraints (Windows CI green, additive Linux changes, no large refactors)
- `.planning/REQUIREMENTS.md` — v8.0 requirements catalog; Phase 25 owns SYNC-11..16
- `.planning/ROADMAP.md` — v8.0 milestone (Phases 24–30) and Phase 25 success criteria
- `.planning/milestones/v8.0-SCOPE-PROPOSAL.md` — bucket inventory (A–J), 365 conflict regions, "Files dropped by the auto-merge that need restoring" list
- `.planning/phases/24-config-bucket/24-CONTEXT.md` — Phase 24 decisions (branch strategy, atomic-commit norm, force-with-lease pattern, two-pass install)
- `.planning/phases/24-config-bucket/24-DISCUSSION-LOG.md` — Phase 24 question-by-question record (for context on decision rationale)
- `.planning/STATE.md` — current position

### Linux fork preservation
- `VORTEX-LINUX-MERGE-PLAYBOOK.md` — 10 items the fork must keep; **this phase ADDS §11 (Deliberate test-runner divergences)** per D-25-12. Re-grep checks for §1, §3, §6, §7 must still pass after restoration (chunking restoration must not regress them).
- `.planning/codebase/ARCHITECTURE.md` — fork's three-tier process model
- `.planning/codebase/STRUCTURE.md` — fork directory layout

### Upstream PR + reproducibility anchors
- `https://github.com/atabisz/Vortex/pull/4` — PR #4 (`chore: sync upstream v2.0.0 into master`); Phase 25 push lands here via force-with-lease.
- **Upstream parent SHA `8b5a9f675`** — second parent of merge commit `138da2249` on `v8.0/config-bucket`. Canonical restoration source per D-25-01. Verify with `git rev-parse 138da2249^2` before each restoration command.
- `fork/sync/upstream-v2.0.0` — current PR head; Phase 25 will be pushed here.

### Tooling references
- `extensions/skip-on-windows.mjs` — fork's existing Linux-friendly platform guard helper. Used by D-25-08.
- `extensions/copy-native.mjs` — fork's helper for copying native `.node` artifacts during build. Referenced in D-25-08 `_native` script.
- `.github/workflows/release-linux.yml` — existing AppImage + .deb build workflow. D-25-09 extends with ba2tk rebuild step modeled on the existing `bsatk` step.
- `scripts/verify-addons.cjs` — existing native-addon load-check script. D-25-09 extends with `ba2tk` assertion.
- `extensions/gamebryo-bsa-support/package.json` — closest analog for `gamebryo-ba2-support` package.json shape. Referenced by D-25-08.
- `AGENTS.md` + `AGENTS-DIRECTORIES.md` — repo navigation rules
- `CLAUDE.md` (project) — Branch Strategy section, GSD Workflow Enforcement section. Lists `node-ba2tk` as a custom-fork dep — relevant to D-25-10's open executor question.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable assets
- **`extensions/skip-on-windows.mjs`** — Linux-friendly named-script guard helper. Replaces inline `node -e \"if(process.platform==='win32')...\"` patterns. Used by D-25-08.
- **`extensions/copy-native.mjs`** — fork's helper for copying native `.node` artifacts during build. Same pattern bsa-support uses.
- **`extensions/gamebryo-bsa-support/`** — closest analog for ba2-support. bsa-support's package.json already uses named-script form (no inline platform guard at all). ba2-support's restored package.json follows the same shape per D-25-08, with `skip-on-windows.mjs` added to the build/dist scripts because ba2-support is new on Linux and we want explicit "skip on Windows" semantics rather than bsa-support's "always build".
- **`.github/workflows/release-linux.yml`** — fork's existing AppImage + .deb build. The native-rebuild section already has a bsatk step; ba2tk rebuild step (D-25-09) is appended after it with identical shape.
- **`scripts/verify-addons.cjs`** — fork's native-addon smoke test invoked at end of `release-linux.yml`. Adding `ba2tk` to the assertion list is a one-liner.

### Established patterns
- **Atomic commits per logical unit** — Phase 24 used 12-13 atomic commits (one per resolved file); Phase 25 uses 5 atomic commits (one per category) because restoration is purely additive and per-file commits would produce noise. Both fit the GSD atomic-commit norm; the unit of atomicity is "one verifiable thing", not "one file".
- **Force-with-lease pushes to fork** — `rebase-upstream.yml` daily cron writes to `sync/upstream-*` branches; lease check refuses if the cron raced us. Phase 24 D-02 established the pattern; Phase 25 D-25-07 inherits it.
- **Two-pass `pnpm install` discipline** — first pass writes/updates lockfile; second pass with `--frozen-lockfile` validates. Phase 24 D-17 established it; Phase 25 D-25-06 / D-25-15 inherit.
- **`{{thing}}` named-script pattern over inline guards** — Playbook §1; D-25-08 applies it to ba2-support.
- **Pinning upstream parent by SHA** — restoration source is `8b5a9f675` (the second parent of merge commit `138da2249`), not `origin/master`. Master moves; SHA is forever. D-25-01.

### Integration points
- **Commit 1 (paths workspaces) ↔ Phase 24 lockfile** — Phase 24's regenerated lockfile assumed `packages/paths` and `packages/paths-node` were *missing*. Commit 1's `pnpm install` re-resolves the workspace graph and updates the lockfile. The lockfile delta from commit 1 should be additive (new entries for `@vortex/paths` and `@vortex/paths-node` workspace links) — if it's larger than that, drift surfaced and the executor should investigate before continuing.
- **Commit 2 (ba2-support + ba2tk catalog) ↔ Phase 24 catalog** — adding `ba2tk` to `pnpm-workspace.yaml` catalog and bumping `pnpm-lock.yaml` is the only catalog/lockfile-touching commit in Phase 25. Frozen-lockfile checks in subsequent commits assume catalog stability after this point.
- **CI rebuild step (D-25-09) ↔ Phase 29 verification** — Phase 29 success criterion 4 ("AppImage and .deb produced via `release-linux.yml` boot from a clean install") depends on the ba2tk rebuild producing a usable Linux `.node`. If Phase 29 fails on this, fix is one of: ba2tk Linux-build broken upstream → patch + upstream PR → defer; or fork's CI step is wrong → fix in Phase 29 with normal merge-style commit.
- **Chunking restoration ↔ Phases 26 + 28** — `chunking.ts` and `downloader.test.ts` are restored as-is (D-25-11). If they reference Linux-incompatible patterns (backslash literals, `process.platform === 'win32'` without guards), Phases 26/28 will surface the issue during their playbook re-grep and fix forward there.
- **Playbook §11 (D-25-12) ↔ all future syncs** — every future `chore: sync upstream v...` PR's auto-merge will silently re-add `jest.config.mjs` and `__mocks__/` and `__tests__/`. §11's grep check is what catches that. Future agents running `/gsd:phase` against the next sync milestone will see §11 in the playbook and know to drop them again.

</code_context>

<specifics>
## Specific Ideas

- **Discovery diff command (run BEFORE commit 1):**
  ```bash
  git diff --name-status v8.0/config-bucket 8b5a9f675 \
    -- ':!src/renderer/src/__mocks__' \
       ':!src/renderer/src/__tests__' \
       ':!src/renderer/jest.config.mjs' \
    | grep '^A'
  ```
  Output is the canonical "files to restore" list, with the deny-list pre-filtered. Surface to user before any restoration commits land. Already-listed files (paths/, paths-node/, ba2-support/, chunking*, .github/workflows/*.yml, docs/flatpak-*, AGENTS-DEBUGGING.md) auto-restore. Anything else gets accept/reject from user.

- **Upstream parent SHA verification:**
  ```bash
  EXPECTED=8b5a9f675
  ACTUAL=$(git rev-parse 138da2249^2 | head -c 9)
  [ "$EXPECTED" = "$ACTUAL" ] || { echo "Upstream parent drift!"; exit 1; }
  ```
  Run before commit 1. If `138da2249` ever changes (history rewrite), the SHA pin breaks loudly instead of silently.

- **ba2-support package.json — exact form per D-25-08:**
  ```json
  {
    "name": "gamebryo-ba2-support",
    "version": "0.0.1",
    "scripts": {
      "_native": "node ../copy-native.mjs ./node_modules/ba2tk/build/Release/ba2tk.node",
      "_build":  "node build.mjs && pnpm run _native && pnpm extractInfo",
      "build":   "node ../skip-on-windows.mjs && pnpm run _build && node ../copy-extension.mjs out",
      "dist":    "node ../skip-on-windows.mjs && pnpm run _build && node ../copy-extension.mjs dist",
      "typecheck": "pnpm tsc"
    }
  }
  ```
  This is the form to ship after restoration — upstream's inline-guard build/dist scripts get rewritten to the named-script form before commit 2 lands.

- **release-linux.yml ba2tk rebuild step (append after existing bsatk step):**
  ```yaml
  - name: Rebuild ba2tk for Linux
    run: |
      BA2TK_DIR=$(node -e "process.stdout.write(require('path').dirname(require.resolve('ba2tk/package.json', {paths: ['extensions/gamebryo-ba2-support/node_modules', 'node_modules']})))")
      echo "Rebuilding ba2tk at: $BA2TK_DIR"
      cd "$BA2TK_DIR"
      [ -f fetch_ba2tk.js ] && node fetch_ba2tk.js || true
      npx node-gyp rebuild --target=39.8.0 --arch=x64 --dist-url=https://electronjs.org/headers
  ```

- **Playbook §11 entry shape (D-25-12) — append to `VORTEX-LINUX-MERGE-PLAYBOOK.md`:**
  ```
  ## §11 Deliberate test-runner divergences

  Renderer uses Vitest exclusively. Upstream Jest scaffolding is dropped on every
  sync. The following files MUST NOT exist on master:

  - `src/renderer/jest.config.mjs`
  - `src/renderer/src/__mocks__/` (directory)
  - `src/renderer/src/__tests__/` (directory)

  Verification:
  ```bash
  ! test -f src/renderer/jest.config.mjs \
    && ! test -d src/renderer/src/__mocks__ \
    && ! test -d src/renderer/src/__tests__ \
    || { echo "Playbook §11 violation: Jest scaffolding present"; exit 1; }
  ```

  Rationale: fork migrated renderer to Vitest pre-v8.0; Jest config + `__mocks__/`
  would shadow Vitest's `vi.mock` and produce silent test-runner ambiguity.

  Decided: Phase 25 (restore-dropped-scaffolding), 2026-05-15.
  ```

- **Commit 4 body (workflows restore) — must enumerate the deliberate-drop list:**
  Body should explicitly list `src/renderer/jest.config.mjs`, `src/renderer/src/__mocks__/`, `src/renderer/src/__tests__/` as "intentionally not restored from upstream parent 8b5a9f675; see VORTEX-LINUX-MERGE-PLAYBOOK.md §11". Plus any discovery-diff surprises the user said keep dropped.

</specifics>

<deferred>
## Deferred Ideas

- **Linux-specific fixes inside `chunking.ts` and `downloader.test.ts`** — Playbook §6/§7 territory. Surfacing during Phase 25 would bleed Phase 26/28 work into Phase 25; defer to whichever phase's playbook re-grep catches it.
- **Jest-Vitest dual-runner shim** — SCOPE-PROPOSAL "decisions awaiting input" #2 floated this. Rejected — Jest scaffolding stays dropped per D-25-03 + D-25-12. Revisit only if a future upstream sync introduces a test that genuinely needs Jest semantics Vitest can't provide; would be a new milestone, not a v8.0 patch.
- **Extending discovery-diff classification beyond the deny-list** — currently the deny-list is exactly Jest scaffolding. If a future sync drops Linux-incompatible files we want to keep dropped (e.g., a Windows-only test), the deny-list grows in playbook §11; the discovery-diff command grows a corresponding `:!` exclusion.
- **Fork-managed `node-ba2tk`** — if the fork already vendors a custom `node-ba2tk` (CLAUDE.md mentions it), the catalog entry in D-25-10 points at the fork's git URL rather than upstream's npm `ba2tk`. The executor confirms via grep before commit 2; if a fork-vendored version is found, document that decision in commit 2's body.

</deferred>

---

*Phase: 25-restore-dropped-scaffolding*
*Context gathered: 2026-05-15*
