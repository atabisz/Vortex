# Plan: Prevent stale empty staging dirs from persisting across installs

## Context

On Linux, installing the "Essential Mods for Skyrim" collection (then installing individual mods from it) leaves 14 staging directories with parent-folder skeletons but zero files (`/media/alex/intel/Vortex/SkyrimSE/<mod>/SKSE/Plugins/` — empty), then triggers a "Redundant mods" dialog at the end of deployment. Windows doesn't hit this because the initial install succeeds.

Two root causes compound:

1. **Silent extract failure** — [`src/renderer/src/extensions/mod_management/InstallManager.ts:6951-7044`](src/renderer/src/extensions/mod_management/InstallManager.ts#L6951-L7044) (`extractArchive`). `copyAsyncWrap` silently swallows every `fs.copyAsync` error except two specific strings. The outer flow resolves successfully even when zero files actually landed. A partially-broken install (FOMOD-bit issue, concurrency, anything) produces a mod that is recorded in state as "installed" but whose staging dir has only `ensureDirAsync`-created parents.

2. **Stale-state short-circuit** — [`InstallManager.ts:6038`](src/renderer/src/extensions/mod_management/InstallManager.ts#L6038) (`doDownload`). On re-install (collection or dep-driven), `dep.mod != null` makes the function skip `queueInstallation`. The broken state perpetuates across every subsequent install attempt until the user manually removes + re-downloads the mod.

The FOMOD fix (commit `053a30424`, 2026-05-09) repaired the _forward_ path but did nothing for users already in the broken state. This plan closes both doors.

## Approach

### Change 1 — Fail loudly in `extractArchive`

File: `src/renderer/src/extensions/mod_management/InstallManager.ts`

Goal: when the installer produced copy instructions but zero files landed on disk, reject with `ArchiveBrokenError` so the caller sees a real failure instead of treating it as a successful install.

- In `copyAsyncWrap` (line 6951), track copy failures. Add a captured set `copyFailures: Set<string>` populated when the catch path is hit for any reason that isn't `SelfCopyCheckError` / "and destination must". Log `log("warn", "copy fallback failed", { src, dst, code, message })` before swallowing, so future diagnosis has a trail.
- In the `jobs` hardlink loop (lines 6994-7013), push to the same `copyFailures` set when the ENOENT path runs (`missingFiles.add(job.src)` stays, but also record it as a failure). This way `missingFiles` continues to feed the existing notification, while the new integrity check uses the broader set.
- After the hardlink loop, before `return Promise.resolve()` at line 7034, add:
    ```
    if (jobs.length > 0 && (missingFiles.size + copyFailures.size) === jobs.length) {
      throw new ArchiveBrokenError(
        path.basename(archivePath),
        `No files were installed — ${missingFiles.size} missing, ${copyFailures.size} copy failures`
      );
    }
    ```
    i.e. throw only when _every_ intended job failed. A partial failure (some files landed, some didn't) stays as the existing notification path — don't regress that.
- `ArchiveBrokenError` already imported from `@vortex/shared/errors` (re-exported via `src/renderer/src/util/CustomErrors.ts:2`). Verify with `grep "ArchiveBrokenError" src/renderer/src/extensions/mod_management/InstallManager.ts` — it's used at line 3539.

The surrounding install path already handles `ArchiveBrokenError` (see `extractWithRetry` at 3539) so bubbling this up hands control to the existing error-notification code.

### Change 2 — Validate staging before short-circuit

File: same.

Goal: in `doDownload`, when `dep.mod != null`, verify the mod's staging dir actually contains files before trusting the "already installed" state. If it's empty or missing, clear `dep.mod` so the normal `queueInstallation` path re-extracts.

- Inside the `.then((downloadId: string) => { ... })` block that contains the `dep.mod == null` check at line 6038, insert a validation step _before_ that ternary:

    ```
    if (dep.mod != null && dep.mod.installationPath) {
      const modStagingPath = path.join(stagingPath, dep.mod.installationPath);
      try {
        const entries = await fs.readdirAsync(modStagingPath);
        const hasFiles = entries.length > 0 &&
          (await Promise.all(entries.map(async (e) => {
            const s = await fs.statAsync(path.join(modStagingPath, e)).catch(() => null);
            return s?.isFile() ?? false;
          }))).some(Boolean);
        // shallow check is sufficient — if the top level has no files, a recursive
        // check isn't needed; we'd still re-extract. But empty dirs like SKSE/Plugins/
        // DO have subdirs, so we need to recurse. Use buildFileList equivalent or walk.
      } catch (err) {
        // dir missing → definitely broken, clear
      }
    }
    ```

    **Correction to the inline sketch above:** a shallow check is insufficient because the broken state looks like `SKSE/Plugins/` (one subdir, no files). Use `walk` from `src/renderer/src/util/walk` which the file already knows about (line 116 import), or a cheap recursive readdir. Short-circuit as soon as one file is found so the happy path stays fast.

- When the check fails, log `log("warn", "mod recorded as installed but staging dir is empty — clearing to force re-extract", { modId: dep.mod.id, stagingPath: modStagingPath })` and set `dep.mod = undefined`. Then the existing ternary at line 6038 falls through to `queueInstallation`.

- Gate the check behind a `try`/`catch` that never throws to the caller — if `readdirAsync` fails for any reason we can't diagnose (permission, filesystem transient), log and fall through to the original behaviour. We don't want this safety net to _create_ new failures.

- **Keep the patches branch as-is** (lines 6034-6036 already clear `dep.mod` for patched mods) — this new check runs in addition, not in place of.

## Critical files

- `src/renderer/src/extensions/mod_management/InstallManager.ts` — both changes land here.
- `src/renderer/src/extensions/mod_management/InstallManager.test.ts` — vitest file; add two tests (one per change).

## Existing utilities reused

- `installPathForGame(state, gameId)` — already used in `doInstallDependenciesPhase`'s closure (line 5645 exposes `stagingPath`). No new state lookup needed.
- `fs.readdirAsync` / `fs.statAsync` — from `src/renderer/src/util/fs` (imported at line 93).
- `walk` — from `src/renderer/src/util/walk` (imported at line 116). Use for the short-circuit file search if shallow readdir is insufficient.
- `ArchiveBrokenError` — from `@vortex/shared/errors` via `src/renderer/src/util/CustomErrors.ts`.
- `path.join` — already imported.
- `log` — standard pattern: `log("warn", "message string", { contextObject })`. Examples: lines 916, 1991, 2030.

## Tests to add

In `InstallManager.test.ts` (vitest, already set up):

1. **`extractArchive` throws when every copy fails.** Mock `fs.linkAsync` to reject with `ENOENT` for every job, assert the returned promise rejects with `ArchiveBrokenError`.
2. **`extractArchive` resolves on partial failure.** Mock one job success + one ENOENT, assert promise resolves (current behaviour preserved, `missingFiles` notification still fires — verify via `api.showErrorNotification` mock).
3. **`doDownload` clears `dep.mod` for empty staging dir.** Mock `fs.readdirAsync` to return `[]` for the mod's staging path. Verify `queueInstallation` is called (not short-circuited).
4. **`doDownload` respects `dep.mod` for populated staging dir.** Mock `fs.readdirAsync` to return non-empty list with a file. Verify short-circuit still fires.

## Branch strategy

Per project CLAUDE.md: develop on `master`. After merge, cherry-pick the Linux-compatible portion to `linux-port`. Both changes here are platform-neutral (hardlink semantics work identically on Windows; the bug just bites Linux more), so both branches should get them.

## Verification

1. **Unit**: `pnpm --filter @vortex/renderer run test src/renderer/src/extensions/mod_management/InstallManager.test.ts` — new tests pass, existing tests still pass.
2. **Type check**: `pnpm run typecheck` on the renderer package.
3. **Manual Linux repro against current broken state**:
    - With the current broken state still present (14 empty staging dirs listed in prior dialog), start Vortex with the patched build.
    - Click "Install" on one of the 14 flagged mods directly from Nexus Mods.
    - Observe: should now extract (look for `installing to` and `extracting mod archive` log entries, and new `mod recorded as installed but staging dir is empty — clearing to force re-extract` warn log).
    - Staging dir should contain the expected `.dll` / `.json` files afterwards.
    - Deploy and confirm the "Redundant mods" dialog no longer lists that mod.
4. **Simulate broken extract**: Manually empty one mod's staging dir after install (`rm -rf <mod>/*`), leave state untouched, trigger a re-install via the mod list. Confirm re-extraction fires.
5. **Windows regression**: Install any mod on Windows — staging dir populated, no warnings, no behaviour change (the readdirAsync check fires but finds files and falls through to the original ternary).
