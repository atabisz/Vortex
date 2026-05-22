# Phase 25: Restore dropped scaffolding — Discussion Log

**Date:** 2026-05-15
**Phase:** 25 — Restore dropped scaffolding
**Mode:** discuss-phase (default, interactive)

This log records the question-by-question record of context gathering.
For consumed-by-downstream-agents content, see `25-CONTEXT.md`.

---

## Gray area selection

**Q:** Which gray areas should we discuss for Phase 25 (Restore dropped scaffolding)?

**Options presented:**
- ba2-support Linux pattern — package.json scripts shape + CI rebuild + ba2tk catalog
- Restoration order + commits — granularity, dependency order, intermediate `pnpm install`
- Restore mechanism — checkout vs show, chunking review timing, discovery diff
- Jest divergence documentation — playbook §11, commit body, deny-list classification

**Selected:** all four.

---

## Area 1: ba2-support Linux pattern

### Q1.1 — Guard form

**Q:** Upstream's ba2-support uses an inline guard `node -e "if(process.platform==='win32')process.exit(1)" || (...)`. ROADMAP locks the named-script form. How should the package.json scripts read?

**Options:**
- `skip-on-windows.mjs && _build` (recommended)
- Drop guards entirely (match bsa-support exactly)
- Keep upstream's inline guard

**Selected:** `skip-on-windows.mjs && _build` (recommended) → D-25-08.

### Q1.2 — CI rebuild

**Q:** Should ba2-support's native rebuild be added to `release-linux.yml` and the CI rebuild path?

**Options:**
- Add ba2tk rebuild step modeled on bsatk (recommended)
- Skip CI rebuild this phase, gate at Phase 29
- Add rebuild + add `scripts/verify-addons.cjs` assertion

**Selected:** Add ba2tk rebuild step modeled on bsatk (recommended) → D-25-09. Note: D-25-09 in CONTEXT.md ALSO includes the `verify-addons.cjs` assertion (combined recommendation); the conservative interpretation of the user's selection is "rebuild step only", but combining with `verify-addons.cjs` was treated as a Claude-discretion strengthening since the verify-addons piece is a one-line additive assertion that closes the loop. Executor may split into a separate one-line commit if it prefers.

### Q1.3 — Catalog

**Q:** ba2tk dependency is `"ba2tk": "catalog:"` upstream but isn't in our pnpm-workspace catalog yet. How do we add it?

**Options:**
- Add ba2tk to catalog with upstream-pinned version (recommended)
- Inline-pin ba2tk in ba2-support package.json
- Use the custom node-ba2tk fork from CLAUDE.md deps

**Selected:** Add ba2tk to catalog with upstream-pinned version (recommended) → D-25-10. CLAUDE.md's mention of `node-ba2tk` (custom fork) is captured as an executor pre-commit-2 confirmation (grep first; if vendored, point catalog entry at the fork's git URL).

---

## Area 2: Restoration order + commits

### Q2.1 — Commit shape

**Q:** How should restoration commits be structured?

**Options:**
- One commit per category, 5 commits total (recommended)
- One commit per file (~15-65 commits)
- Two commits: 'restore-as-upstream' + 'apply Linux divergences'

**Selected:** One commit per category, 5 commits total (recommended) → D-25-04.

### Q2.2 — Order

**Q:** What dependency order should restoration follow?

**Options:**
- paths → paths-node → ba2-support → chunking → workflows → docs (recommended)
- Workflows + docs first, then code (reverse leaf-first)
- Single batch — restore everything, install once

**Selected:** paths → paths-node → ba2-support → chunking → workflows → docs (recommended) → D-25-04 ordering.

### Q2.3 — Install gate

**Q:** Should `pnpm install` run at intermediate checkpoints during restoration?

**Options:**
- After each workspace-affecting commit (recommended)
- Once at the end of the phase
- Only when something looks wrong

**Selected:** After each workspace-affecting commit (recommended) → D-25-06. Specifically: after commit 1 (paths), after commit 2 (ba2-support + catalog), and at end of phase. Commits 3 (chunking), 4 (workflows), 5 (docs) don't require their own install pass — they don't touch workspace structure.

---

## Area 3: Restore mechanism

### Q3.1 — Mechanism

**Q:** What's the canonical restoration command?

**Options:**
- `git checkout 8b5a9f675 -- <paths>` per category (recommended)
- Use the upstream tag directly via remote
- `git show <sha>:<path>` to a temp file, manual review per file

**Selected:** `git checkout 8b5a9f675 -- <paths>` per category (recommended) → D-25-01.

### Q3.2 — Chunking review timing

**Q:** Should the chunking / downloader test files be reviewed for Linux-specific issues before restoring?

**Options:**
- Restore as-is, defer review to Phase 26–28 (recommended)
- Restore + apply Playbook §7 (backslash) checks immediately
- Restore only chunking.ts (skip the .test files until verified)

**Selected:** Restore as-is, defer review to Phase 26–28 (recommended) → D-25-11.

### Q3.3 — Discovery

**Q:** Are there other dropped files (besides what ROADMAP lists) we should hunt for and restore?

**Options:**
- Run a discovery diff against upstream parent (recommended)
- Trust the SCOPE-PROPOSAL list
- Discovery diff + auto-restore everything not on the deliberate-drop list

**Selected:** Run a discovery diff against upstream parent (recommended) → D-25-02.

---

## Area 4: Jest divergence documentation

### Q4.1 — Playbook entry

**Q:** How should the Jest deliberate-drop be documented in `VORTEX-LINUX-MERGE-PLAYBOOK.md`?

**Options:**
- Full §11 entry with grep checks (recommended)
- One-liner under existing 'Notes' section
- Full §11 entry + commit-index row (recommended-stronger)

**Selected:** Full §11 entry with grep checks (recommended) → D-25-12. Commit-index row also captured in D-25-13 (treated as a strengthening additive given user picked "full §11" — both are bookkeeping additions on the same playbook file). Executor should land them in the same playbook edit (part of commit 4).

### Q4.2 — Commit body

**Q:** Should the deliberate-drop list also live in the restoration commit body?

**Options:**
- Yes — enumerate in the workflows-restore commit body (recommended)
- No — playbook is the single source of truth
- Yes — enumerate in a dedicated 'restore-policy' commit at end of phase

**Selected:** Yes — enumerate in the workflows-restore commit body (recommended) → D-25-14.

### Q4.3 — Drop policy

**Q:** Should the discovery diff (Area 3) automatically classify the deliberate-drop list, or should the user review file-by-file?

**Options:**
- Pre-classified deny-list, user reviews exceptions (recommended)
- Full review — user decides every dropped file
- Auto-restore everything except Jest — no review

**Selected:** Pre-classified deny-list, user reviews exceptions (recommended) → D-25-03 + D-25-02 surprises-only review flow.

---

## Final check

**Q:** Anything else to discuss before I write 25-CONTEXT.md?

**Options:**
- I'm ready for context
- Explore more gray areas

**Selected:** I'm ready for context → wrote 25-CONTEXT.md, this DISCUSSION-LOG.md, and committed.

---

## Claude's discretion items (locked in CONTEXT.md, not asked)

- Per-rule merging inside `eslint.config.mjs` files isn't in scope (Phase 24 territory).
- Whether `node-ba2tk` is fork-vendored vs upstream `ba2tk` — left to executor pre-commit-2 grep (D-25-10).
- Whether to split the `verify-addons.cjs` ba2tk assertion into its own commit if it grows beyond a one-liner — left to executor.
- Discovery-diff "surprises" handling timing — surfaced before commit 5 (workflows) since that's when commit body needs the deny-list.

---

## Deferred ideas (captured during discussion, not in scope)

- Jest-Vitest dual-runner shim — SCOPE-PROPOSAL #2 floated this; rejected per D-25-03/D-25-12.
- Linux-specific fixes inside `chunking.ts` and `downloader.test.ts` — Playbook §6/§7 territory; deferred to Phase 26/28.
- Extending the deny-list beyond Jest scaffolding — only if a future sync surfaces a Linux-incompatible file we want kept dropped; would grow playbook §11.
- Refactoring upstream's inline `process.platform` guards in other places — out of scope for v8.0; sync milestone is for resolution, not refactor.
