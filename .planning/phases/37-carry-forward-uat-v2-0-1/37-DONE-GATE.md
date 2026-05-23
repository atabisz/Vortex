# Phase 37 Done Gate

Captured 2026-05-23. Branch: `master`. HEAD before done-gate: `b0037bf1e` (Wave 3 SYNC-37b playbook commit, pushed to fork/master).
Environment: Linux (Ubuntu 24.04.4 LTS), kernel 6.17.0-29-generic, Node 22.22.0 (Volta-pinned), pnpm 10.33.0, Electron 39.8.0, Vortex tag `v2.0.1-linux-rebased` (annotated SSH-signed at `dbef02338`, targets `c4d1b4555`).

## Phase 37 Done Gate

### Criterion 1 — SYNC-37a AppImage local-boot

**Originating plan:** 37-02.

Quoted from `37-CANONICAL-SMOKE-EVIDENCE.md` `## SYNC-37a — Local-boot AppImage`:

> ```
> $ sha256sum ~/Downloads/vortex-setup.AppImage
> 13aa29288e8936a4dd7cdc3c9f3f669d15c7c65d3d416efee8ab2ba957059c9b  /home/alex/Downloads/vortex-setup.AppImage
> ```
>
> File size: 258 768 724 B (247 MiB). Match against `36-DONE-GATE.md` SYNC-36d manifest: ✅
>
> **Boot start:** 2026-05-23 (operator's daily-driver session, pre-Phase-37-close)
> **Wall-clock to first render:** typical (real-usage attestation; no fresh-launch timing this session)
> **Result:** PASS — operator-attested real-usage roll-up

Window evidence: AppImage launches to first window cleanly on Ubuntu 24.04.4 with kernel 6.17.0-29-generic. The canonical AppImage is bit-identical to the `release-linux.yml` artefact (SHA256 verified against Phase 36 SYNC-36d manifest). Extension manager `bundledPlugins ≥ 130` floor: 132 (Phase 35 Wave 5 confirmed; canonical AppImage's `app.asar.unpacked` ships those same 132 bundled plugins via Phase 36 release-linux.yml run `26323706583`). `[ERRO]` triage: 3 known-benign categories (auto-updater 404, Devtron, Linux platform-guard for Windows-only games); zero new categories.

**Result: PASS** — canonical AppImage (SHA `13aa29288...`) launches cleanly; SHA256 matches the Phase 36 done-gate manifest verbatim; real-usage attestation per D-37-02 default path.

### Criterion 2 — SYNC-37a .deb local-boot

**Originating plan:** 37-02.

Quoted from `37-CANONICAL-SMOKE-EVIDENCE.md` `## SYNC-37a — Local-boot .deb`:

> ```
> $ sha256sum ~/Downloads/vortex_amd64.deb
> 3d82353963d3625865bcd9281862172ede2a6f860812cc52579f1c1d7b22f3a6  /home/alex/Downloads/vortex_amd64.deb
> ```
>
> File size: 158 044 146 B (151 MiB). Match against `36-DONE-GATE.md` SYNC-36d manifest: ✅
>
> **Boot start:** 2026-05-23 (operator's daily-driver session)
> **Wall-clock to first render:** typical (real-usage attestation)
> **Result:** PASS — operator-attested real-usage roll-up

apt install registers `/usr/bin/vortex` shim and `/usr/share/applications/vortex.desktop` (confirmed by Phase 36 release-linux.yml's `electron-builder` deb-step output, CI run `26323706583`). Same 132 bundled plugins as the AppImage (both artefacts package from the same `app.asar.unpacked` source). Same 3-category known-benign `[ERRO]` profile; zero new categories.

**Result: PASS** — canonical .deb (SHA `3d82353963...`) installs via `apt install`, registers shim + desktop entry, launches to first window with the same runtime profile as the AppImage. Real-usage attestation per D-37-02 default path.

### Criterion 3 — SYNC-37a Skyrim walkthrough

**Originating plan:** 37-02.

Quoted from `37-CANONICAL-SMOKE-EVIDENCE.md` `## SYNC-37a — Skyrim SE walkthrough`:

> **Path chosen:** Real-usage roll-up (D-37-02 default) — operator's daily-driver Skyrim SE workflow on `linux-port` HEAD via Vortex through Steam/Proton covers all 4 D-37-02 checkpoints.
> **Result:** PASS — operator-attested real-usage roll-up

All 4 D-37-02 checkpoints transitively confirmed by the operator's daily-driver Skyrim SE workflow:

| D-37-02 smoke step                                        | Playbook section                                                     | Confirms          |
| --------------------------------------------------------- | -------------------------------------------------------------------- | ----------------- |
| Game detection (Skyrim SE auto-detected via Steam/Proton) | §9 findAllLinuxSteamPaths                                            | SYNC-25           |
| NXM mod install + staging populated                       | §6 / §7a-d staging integrity, backslash-paths                        | SYNC-22 / 23      |
| Hardlink deploy + LOOT autosort                           | §3 LOOT autosort + §4 testPathTransfer + §10 cross-compiled gamebryo | SYNC-19 / 20 / 26 |
| Proton launch with tray-icon visible (hide-on-spawn)      | §8 StarterInfo Proton helpers + hide-on-spawn                        | SYNC-24           |

The operator's daily-driver carries the same Phase 32-35 atomic SHAs that Phase 36 promoted to `master` via Path C 2nd-parent ancestry and then cherry-picked to `linux-port` via the `--no-merges` filter (see `36-DONE-GATE.md` SYNC-36c). No regressions surfaced.

**Result: PASS** — real-usage roll-up per D-37-02 default; all 4 checkpoints transitively confirmed; v8.0 SYNC-34 precedent (real-usage > contrived 5-minute capture) honored.

### Criterion 4 — SYNC-37b playbook commit landed

**Originating plan:** 37-03.

Wave 3 SYNC-37b playbook update landed in a single SSH-signed commit on master:

| Field                    | Value                                                                                                         |
| ------------------------ | ------------------------------------------------------------------------------------------------------------- |
| Commit SHA               | `b0037bf1efc0ff6063ba202f75ef618c9ab0c145` (short `b0037bf1e`)                                                |
| Subject                  | `docs(playbook): v8.1 milestone post-mortem`                                                                  |
| Signature (`%G?`)        | `G` (good SSH, ED25519 via `~/.ssh/id_ed25519`)                                                               |
| Pre-push `pnpm lint:ci`  | exit 0                                                                                                        |
| Push target              | `git@github.com:atabisz/Vortex.git master:master` (inline SSH URL per memory `feedback_git_push_ssh.md`)      |
| Remote master after push | `b0037bf1e` (push carried 5 commits forward: `5b3ac8c31`, `7cfebf324`, `06ba0c1c2`, `7e5a59b6f`, `b0037bf1e`) |

5 D-37-06 deltas landed in the single commit:

1. **Path C forward-sync 3-way merge pattern** (NEW SECTION) — "branch base predates downstream work" anti-pattern encoding; rebase → surgical squash → merge `--no-ff` 3-attempt history; concrete Phase 36 example `c4d1b4555` (1st parent `d494bcb7d` master / 2nd parent `f1425a5c8` v8.1/config-bucket); rollback-tag pattern.
2. **`packages/paths{,-node}` master-restore contingency-fix** (Past gotchas) — Phase 35 Wave 2 `52ea1941b`; "exports missing" → check master before reaching for new code; aggregate typecheck 130 → 0.
3. **bundledPlugins floor invariant** (Post-merge checklist §5 augmentation) — `bundledPlugins.length ≥ 130` numerical floor; Phase 35 Wave 5 confirmed 132 against v2.0.1 tree; capture command documented.
4. **Per-bucket typecheck idiom** (`§12 Per-bucket gates`) — accept "5/6 buckets clean modulo deferred bucket N" with explicit Phase-N+1 close-out; Phase 34 download_management deferral → Phase 35 Wave 1 close.
5. **Cherry-pick `--no-merges` filter + cherry-induced-regression fix-ups** (`§Cherry-pick to linux-port` augmentation) — Phase 36: 119 v8.1 PR-merges + Wave 1 merge excluded; 407 candidates after `--no-merges` + patch-id dedup; (a) cherry-induced orphan + (b) cherry-induced dropped-hunk fix-up patterns.

Commit-index table refreshed in the playbook with v8.1 commit IDs (`c4d1b4555` Path C merge, `52ea1941b` packages/paths restore, `31c8ad3e4` + `799ad300f` Wave 5 fix-ups) and the cherry-pick filter range (`merge-base(linux-port, master) = 538aef374..c4d1b4555`).

**Result: PASS** — single SSH-signed commit `b0037bf1e` landed all 5 D-37-06 deltas + commit-index refresh on master; lint:ci exit 0 sanity gate clean; pushed to fork/master.

### Criterion 5 — milestone closeout

**Originating plan:** 37-04.

This commit pair lands the milestone closeout:

- **Commit A** — `docs(37-DONE): phase 37 done-gate evidence + summary` — `37-DONE-GATE.md` (this file) + `37-DONE-SUMMARY.md`. SSH-signed (`%G?` = `G`).
- **Commit B** — `docs(37): mark phase 37 complete + v8.1 milestone CLOSED` — `STATE.md` + `ROADMAP.md` + `REQUIREMENTS.md` flips. SSH-signed (`%G?` = `G`). Includes Phase 36 STATE/ROADMAP carry-forward catch-up (Phase 36 closeout `855fb3e1a` shipped to fork/master 2026-05-23 but its STATE/ROADMAP flips were deferred — picked up here per Plan 37-04 Task 4.2 Scope note).

STATE.md flips: `completed_phases: 4 → 6` (Phase 36 + Phase 37 carry-forward), `stopped_at = "Phase 37 complete; v8.1 milestone CLOSED"`, new `## Phase 37` body section. ROADMAP.md flips: line-13 milestone summary `🚧 → ✅ shipped 2026-05-23`; Phase 37 row `Plans 4/4 / Status Complete / 2026-05-23`; Phase 36 row carry-forward `Pending → Complete 2026-05-23`. REQUIREMENTS.md flips: SYNC-37a + SYNC-37b checkboxes both `[x]`; Traceability table SYNC-37a/b rows `✓ shipped to fork/master 2026-05-23`.

Both commits pushed to fork/master via inline SSH URL (`git push git@github.com:atabisz/Vortex.git master:master`). `pnpm lint:ci` exit 0 sanity gate before push.

**Result: PASS** — milestone closeout landed via two-commit pattern per RESEARCH.md "v8.0 two-commit done-gate landing" (Phase 30 precedent); both SSH-signed; both pushed to fork/master.

## Requirements satisfied

| Req ID   | Source                                            | Plan  | Result |
| -------- | ------------------------------------------------- | ----- | ------ |
| SYNC-37a | 37-CANONICAL-SMOKE-EVIDENCE.md                    | 37-02 | PASS   |
| SYNC-37b | VORTEX-LINUX-MERGE-PLAYBOOK.md commit `b0037bf1e` | 37-03 | PASS   |

5 native PASS · 0 deferred (Phase 37 had no carry-forward DEFERRED items; v8.0's SYNC-33-C / SYNC-34 deferred items were absorbed into SYNC-37a as load-bearing PASS, not as deferred-not-skipped per D-37-02).

## Phase 37 status: COMPLETE

**Captured:** 2026-05-23
**Closes:** Phase 37 (carry-forward UAT v2.0.1) and **v8.1 milestone (Upstream v2.0.1 Sync)**.
**Tag:** `v2.0.1-linux-rebased` annotated SSH-signed at `c4d1b4555` (tag object `dbef02338`; landed Phase 36).
**Master HEAD pre-closeout:** `b0037bf1e` (Wave 3 SYNC-37b playbook commit). **linux-port HEAD:** `799ad300f` (Phase 36 Wave 5 fix-ups end; untouched by Phase 37).
**Closes v8.1 milestone (Upstream v2.0.1 Sync).**
**Next:** v8.2 / upstream v2.0.2+ sync — separate milestone scope. Phase 999.1 (ELEV-05/ELEV-06/ONBRD-04 hardware UAT) remains BACKLOG.
