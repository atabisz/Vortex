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

## v8.0 snapshot (filled in Plan 29-05)

_Pending — captured at end of Plan 29-05._
