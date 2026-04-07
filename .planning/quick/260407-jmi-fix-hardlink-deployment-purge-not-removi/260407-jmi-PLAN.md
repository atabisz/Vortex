---
phase: quick
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/renderer/src/extensions/hardlink_activator/index.ts
autonomous: true
requirements: []
must_haves:
  truths:
    - "Hardlink purge removes all deployed mod files from the game directory on Linux"
    - "Hardlink purge continues to work identically on Windows"
    - "Switching to an empty profile and purging leaves a vanilla game directory"
  artifacts:
    - path: "src/renderer/src/extensions/hardlink_activator/index.ts"
      provides: "Linux-aware purgeLinks that augments turbowalk entries with stat data"
      contains: "process.platform"
  key_links:
    - from: "purgeLinks"
      to: "fs.statAsync / fs.lstatAsync"
      via: "Linux branch enriches turbowalk entries with ino/nlink"
      pattern: "process\\.platform.*linux"
---

<objective>
Fix hardlink deployment purge silently skipping all files on Linux.

Purpose: On Linux, turbowalk falls back to a pure-JS walker (`walk.js`) that only provides
`filePath`, `isDirectory`, `size`, and `mtime`. It does NOT provide `idStr`, `linkCount`,
or `id` -- those come from `winapi.WalkDir` on Windows only. The `purgeLinks()` method in
the hardlink activator checks `entry.linkCount > 1 && entry.idStr !== undefined` for both
the staging-path scan and the game-directory scan, so on Linux both checks evaluate to
false for every file, the inode set is always empty, and zero files are removed.

Output: A patched `purgeLinks()` that, on Linux, augments turbowalk entries with
`fs.lstatSync` / `fs.lstatAsync` data (providing `nlink` and `ino` as string) so inode
matching works correctly. Windows path unchanged.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/STATE.md
@src/renderer/src/extensions/hardlink_activator/index.ts
@src/renderer/src/extensions/mod_management/LinkingDeployment.ts

<interfaces>
From turbowalk/index.d.ts:
```typescript
export interface IEntry {
  filePath: string;
  isDirectory: boolean;
  isReparsePoint: boolean;
  size: number;
  mtime: number;
  isTerminator?: boolean;
  id?: number;
  idStr?: string;
  linkCount?: number;
}
```

From turbowalk/index.js (Linux branch, line 46-48):
```javascript
// Linux fallback uses walk.js which calls fs.lstat() but only returns
// filePath, isDirectory, size, mtime -- NO idStr, linkCount, or id.
walk = (target, callback, options) =>
  Promise.resolve(require('./walk').default(target, callback, options));
```

From src/renderer/src/util/fs.ts (relevant exports):
```typescript
export function lstatAsync(path: string): Promise<fs.Stats>;
export function unlinkAsync(path: string): Promise<void>;
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Trace and confirm root cause, then fix purgeLinks for Linux</name>
  <files>src/renderer/src/extensions/hardlink_activator/index.ts</files>
  <action>
The root cause is confirmed by code trace:

1. `turbowalk/index.js` line 9: `if (process.platform === 'win32')` uses `winapi.WalkDir`
   which populates `idStr` and `linkCount`. The `else` branch (line 46) uses `walk.js`.
2. `turbowalk/walk.js` line 25-30: callback entries contain only `filePath`, `isDirectory`,
   `size`, `mtime`. No `idStr`, no `linkCount`, no `id`.
3. `purgeLinks()` line 263: `if (entry.linkCount > 1 && entry.idStr !== undefined)` --
   both are undefined on Linux, so the staging inode set stays empty.
4. `purgeLinks()` line 297-299: same check on game directory entries -- also always false.
5. Result: zero files matched, zero files removed.

**Fix:** Add a Linux-only helper that enriches turbowalk entries with stat data, then use
it in `purgeLinks`. The Windows path must remain untouched.

In `src/renderer/src/extensions/hardlink_activator/index.ts`:

A) Add a module-level helper (above the class):

```typescript
/**
 * On Linux, turbowalk's JS fallback does not provide linkCount or idStr.
 * Enrich each entry with lstat data so inode-based purge works.
 */
async function enrichLinuxEntries(entries: IEntry[]): Promise<void> {
  if (process.platform !== "linux") return;
  await Promise.all(
    entries.map(async (entry) => {
      if (entry.isDirectory) return;
      try {
        const stat = await fs.lstatAsync(entry.filePath);
        entry.linkCount = stat.nlink;
        entry.idStr = String(stat.ino);
      } catch {
        // File may have been removed between walk and stat -- skip.
      }
    }),
  );
}
```

Import `IEntry` from turbowalk at the top if not already imported (it IS imported on line 2).

B) In `purgeLinks()`, after the `turbowalk(installationPath, ...)` callback on line 256-266,
   call the enrichment before adding to the set. Replace the callback body:

```typescript
installEntryProm = turbowalk(
  installationPath,
  async (entries) => {
    if (this.mInstallationFiles === undefined) {
      return;
    }
    await enrichLinuxEntries(entries);
    entries.forEach((entry) => {
      if (entry.linkCount > 1 && entry.idStr !== undefined) {
        this.mInstallationFiles.add(entry.idStr);
      }
    });
  },
  {
    details: true,
    skipHidden: false,
  },
)
```

C) Similarly, in the game-directory turbowalk (line 291-317), enrich entries before checking:

```typescript
return turbowalk(
  dataPath,
  (entries) => {
    queue = queue.then(async () => {
      await enrichLinuxEntries(entries);
      await PromiseBB.map(entries, (entry) => {
        if (
          entry.linkCount > 1 &&
          entry.idStr !== undefined &&
          inos.has(entry.idStr)
        ) {
          ++purged;
          if (purged % 1000 === 0) {
            onProgress?.(purged, total);
          }
          return fs
            .unlinkAsync(entry.filePath)
            .catch((err) =>
              log("warn", "failed to remove", entry.filePath),
            );
        } else {
          return PromiseBB.resolve();
        }
      }).then(() => undefined);
    });
  },
  { details: true, skipHidden: false },
).then(() => queue);
```

**Important constraints:**
- Do NOT modify any code that runs when `process.platform === "win32"`. The enrichment
  helper exits immediately on non-Linux.
- Keep the `details: true` option -- it has no effect on the JS fallback but is correct
  for Windows.
- The `turbowalk` callback on Windows is synchronous but the native walker handles async
  callbacks. On Linux the walk.js fallback also awaits the callback. So making the callback
  async is safe on both platforms -- on Windows `enrichLinuxEntries` returns immediately.
  </action>
  <verify>
    <automated>cd /home/alex/src/Vortex && npx tsc --noEmit --project src/renderer/tsconfig.json 2>&1 | head -30</automated>
  </verify>
  <done>
  - `purgeLinks()` enriches turbowalk entries with `lstatAsync` data on Linux before
    checking `linkCount` and `idStr`
  - The `enrichLinuxEntries` helper is guarded by `process.platform !== "linux"` early return
  - Windows code path is completely unchanged (no behavioral difference)
  - TypeScript compiles without errors
  </done>
</task>

<task type="auto">
  <name>Task 2: Build, lint, and format the changed file</name>
  <files>src/renderer/src/extensions/hardlink_activator/index.ts</files>
  <action>
Run the standard quality gates on the modified file:

1. `pnpm run lint` (or the renderer-specific lint if available)
2. `pnpm run format` to apply oxfmt formatting
3. `pnpm run build` to confirm the full build succeeds

Fix any lint warnings or formatting issues that arise.
  </action>
  <verify>
    <automated>cd /home/alex/src/Vortex && pnpm run build 2>&1 | tail -20</automated>
  </verify>
  <done>
  - File passes lint with no new warnings
  - File is formatted per oxfmt rules
  - Full build succeeds
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

No new trust boundaries introduced. This change modifies an internal purge routine that
operates entirely on local filesystem paths already controlled by Vortex.

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-quick-01 | T (Tampering) | enrichLinuxEntries | accept | Files are in user-owned staging/game directories; stat races are benign (TOCTOU between walk and stat caught by try/catch) |
</threat_model>

<verification>
1. Deploy mods via hardlink to a game directory on Linux
2. Switch to an empty profile or click Purge
3. Verify all mod files are removed from the game directory
4. On Windows, verify deployment and purge behavior is identical to before
</verification>

<success_criteria>
- Hardlink purge removes all deployed files on Linux (no orphans)
- Windows hardlink purge behavior unchanged
- TypeScript compiles, lint passes, build succeeds
</success_criteria>

<output>
After completion, create `.planning/quick/260407-jmi-fix-hardlink-deployment-purge-not-removi/260407-jmi-SUMMARY.md`
</output>
