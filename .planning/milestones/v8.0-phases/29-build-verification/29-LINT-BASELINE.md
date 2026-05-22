# Phase 29 — `pnpm lint:ci` baseline (master)

Captured 2026-05-22 to support SYNC-32 ("passes — or surfaces only pre-existing warnings — diff vs. master") per D-29-05.

## Master snapshot

**Commit:** `db8035192034ba6ee786e88dfdb708956200308c` — `docs(phase-26): correct 140a57217 file/method confusion in plans 01/06/07`
**Branch:** `master`
**Command:** `pnpm lint:ci` (delegates to `pnpm run lint:quiet` → `pnpm -r run lint:quiet`)
**Wall-clock:** ~3 min
**Exit code:** **1** (pre-existing; not a blocker — see SYNC-32 wording)

## Per-workspace results

| Workspace              | Status | Errors | Warnings |
| ---------------------- | ------ | -----: | -------: |
| `packages/adaptor-api` | Done   |      0 |        0 |
| `src/shared`           | Done   |      0 |        0 |
| `src/preload`          | Done   |      0 |        0 |
| `src/renderer`         | Done   |      0 |        0 |
| **`src/main`**         | Failed | **10** |        0 |
| (other 141 workspaces) | Done   |      0 |        0 |
| **Total**              |        | **10** |    **0** |

## Baseline error inventory (`src/main`)

All 10 errors are in **`src/main/src/downloading/downloader.test.ts`** — all `@typescript-eslint/no-unsafe-argument` / `no-unsafe-return` flavour, against test scaffolding that uses `any`-typed mocks for `TestServer`:

```
59:41   error  Unsafe argument of type `any` assigned to a parameter of type `TestServer`  @typescript-eslint/no-unsafe-argument
71:41   error  Unsafe argument of type `any` assigned to a parameter of type `TestServer`  @typescript-eslint/no-unsafe-argument
83:41   error  Unsafe argument of type `any` assigned to a parameter of type `TestServer`  @typescript-eslint/no-unsafe-argument
95:41   error  Unsafe argument of type `any` assigned to a parameter of type `TestServer`  @typescript-eslint/no-unsafe-argument
116:39  error  Unsafe argument of type `any` assigned to a parameter of type `TestServer`  @typescript-eslint/no-unsafe-argument
139:39  error  Unsafe argument of type `any` assigned to a parameter of type `TestServer`  @typescript-eslint/no-unsafe-argument
161:11  error  Unsafe return of a value of type error                                      @typescript-eslint/no-unsafe-return
164:30  error  Unsafe argument of type `any` assigned to a parameter of type `TestServer`  @typescript-eslint/no-unsafe-argument
186:11  error  Unsafe return of a value of type error                                      @typescript-eslint/no-unsafe-return
189:30  error  Unsafe argument of type `any` assigned to a parameter of type `TestServer`  @typescript-eslint/no-unsafe-argument
```

**Note:** `downloader.test.ts` was restored under SYNC-14 in Phase 25. The errors above predate Phase 29 and exist on `master` HEAD. They are **pre-existing** under the SYNC-32 baseline rule.

## SYNC-32 diff threshold (locked)

Phase 29-05 will rerun `pnpm lint:ci` on `v8.0/config-bucket` HEAD. The PASS criterion per D-29-05:

- **PASS:** v8.0 errors ≤ 10 AND same file (`src/main/src/downloading/downloader.test.ts`)
- **FLAG:** v8.0 errors ≤ 10 BUT new file surfaces an error (different rule allowance — but capture the diff for SYNC-39 playbook update)
- **FAIL:** v8.0 errors > 10, OR new error categories appear in any other workspace

## v8.0/config-bucket result

**Captured:** 2026-05-22
**Commit:** `17c56ad15` — `docs(29-04): SYNC-31 — pnpm test (Vitest)`
**Branch:** `v8.0/config-bucket`
**Command:** `pnpm lint:ci`
**Wall-clock:** 34.8s (real)
**Exit code:** **0**

### Per-workspace results

| Workspace              | Status | Errors | Warnings |
| ---------------------- | ------ | -----: | -------: |
| `packages/adaptor-api` | Done   |      0 |        0 |
| `src/shared`           | Done   |      0 |        0 |
| `src/preload`          | Done   |      0 |        0 |
| `src/renderer`         | Done   |      0 |        0 |
| `src/main`             | Done   |      0 |        0 |
| (other 139 workspaces) | Done   |      0 |        0 |
| **Total**              |        |  **0** |    **0** |

Full log:

```
> @vortex/monorepo@1.16.8 lint:ci /home/alex/src/Vortex
> pnpm run lint:quiet


> @vortex/monorepo@1.16.8 lint:quiet /home/alex/src/Vortex
> pnpm -r run lint:quiet

Scope: 144 of 145 workspace projects
packages/adaptor-api lint:quiet$ pnpm eslint --concurrency auto --quiet .
src/shared lint:quiet$ pnpm eslint --concurrency auto --quiet .
packages/adaptor-api lint:quiet: Done
src/shared lint:quiet: Done
src/preload lint:quiet$ pnpm eslint --concurrency auto --quiet .
src/renderer lint:quiet$ pnpm eslint --concurrency auto --quiet .
src/preload lint:quiet: Done
src/renderer lint:quiet: Done
src/main lint:quiet$ pnpm eslint --concurrency auto --quiet .
src/main lint:quiet: Done
```

## Delta vs master

| Workspace              | Master errors | v8.0 errors | Δ errors | Master warnings | v8.0 warnings | Δ warnings |
| ---------------------- | ------------: | ----------: | -------: | --------------: | ------------: | ---------: |
| `packages/adaptor-api` |             0 |           0 |        0 |               0 |             0 |          0 |
| `src/shared`           |             0 |           0 |        0 |               0 |             0 |          0 |
| `src/preload`          |             0 |           0 |        0 |               0 |             0 |          0 |
| `src/renderer`         |             0 |           0 |        0 |               0 |             0 |          0 |
| **`src/main`**         |        **10** |       **0** |  **−10** |               0 |             0 |          0 |
| (other 139 workspaces) |             0 |           0 |        0 |               0 |             0 |          0 |
| **Total**              |        **10** |       **0** |  **−10** |               0 |             0 |          0 |

### Why the delta is −10 (not 0)

The 10 `@typescript-eslint/no-unsafe-*` errors in master's `src/main/src/downloading/downloader.test.ts` don't appear on v8.0 because **the file doesn't exist on `v8.0/config-bucket`**.

`master` and `v8.0/config-bucket` diverged at commit `d4c0d0da5` (merge-base). Master is +20 commits ahead of v8.0 along a different lineage; among those 20 is `9a17907b6` (Phase 25 SYNC-14 — `restore(downloading): chunking + download_management spine + bsdiff-node test from upstream 8b5a9f675`), which is the commit that re-introduced `downloader.test.ts` from upstream. That restore work was done on `master` after `v8.0/config-bucket` branched off, so v8.0's tree never received it.

For the SYNC-32 gate, this is unambiguously PASS: v8.0 lint errors (0) ≤ master baseline errors (10). The −10 delta is not a regression — it's a side-effect of the file simply not being present on the branch we're verifying.

Phase 30 forward-port note: when v8.0 lands as `v2.0.0-linux-rebased` and gets merged forward (PR #4), the SYNC-14 restore commit either lands as part of that merge or needs to be cherry-picked separately. Either way, the 10 pre-existing errors come back along with the file. They remain pre-existing under the SYNC-32 baseline philosophy.

**SYNC-32 verdict: PASS** — `pnpm lint:ci` exit 0 on v8.0/config-bucket; v8.0 errors (0) ≤ master baseline errors (10) per D-29-05.
