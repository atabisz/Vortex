# Phase 16: chattr+F Filesystem Layer - Context

**Gathered:** 2026-04-15
**Status:** Ready for planning

<domain>
## Phase Boundary

Apply kernel casefold (`chattr +F`) to new mod staging directories on ext4 filesystems with the casefold feature enabled. All other filesystems (btrfs, XFS, ZFS, non-casefold ext4) fall back silently to the existing Wine-prefix userspace shim. Windows and Flatpak sandboxes never invoke chattr. The existing shim in `fs.ts` is unchanged — chattr+F and the Wine-prefix shim cover orthogonal path namespaces.

</domain>

<decisions>
## Implementation Decisions

### Injection Point
- **D-01:** `applyChattrCasefold(dirPath)` is inserted as a `.then()` call inside `ensureDirWritableAsync` in `src/renderer/src/util/fs.ts`, immediately after `fs.ensureDir(dirPath)` and before the canary write. Ordering is mandatory: `ensureDir → chattr+F → canary write`.
- **D-02:** `applyChattrCasefold` always resolves (never rejects). It handles all failure modes internally and falls back silently. `ensureDirWritableAsync` callers are unaffected.
- **D-03:** chattr+F is only applied to freshly created, empty directories. If the directory was pre-existing and non-empty, skip the chattr call entirely — the kernel rejects chattr+F on non-empty dirs.

### Platform and Sandbox Guards
- **D-04:** Platform guard: `process.platform !== 'linux'` early return in `applyChattrCasefold`. Windows CI matrix stays green with zero code reached.
- **D-05:** Flatpak guard: check `process.env.FLATPAK_ID` — if set, skip chattr attempt entirely. chattr is unavailable inside the Flatpak sandbox.

### Filesystem Detection
- **D-06:** Use `fs.promises.statfs(dirPath)` (Node 22 built-in, added v18.17.0) to detect ext4 via magic number `0xEF53`. No text parsing of `/proc/mounts`.
- **D-07:** Module-level `Map<string, boolean>` cache in `fs.ts` stores the statfs result per staging directory path. Avoids repeated statfs() syscalls across mod installs in the same session. Cache key = staging dir path, value = whether ext4 casefold is supported at that path.

### chattr Invocation
- **D-08:** Use `child_process.execFile('chattr', ['+F', dirPath])` — argument array (not shell string) to avoid path injection. Zero new npm dependencies.
- **D-09:** Pre-flight check: `commandExists('chattr')` before any invocation. If the binary is absent (minimal Docker, custom container), skip and activate shim. Use `execFile('which', ['chattr'])` or equivalent — not a shell `which` command.
- **D-10:** Catch all non-zero exits (EOPNOTSUPP, EINVAL, ENOENT, any other code) and fall back silently to the existing userspace shim. EOPNOTSUPP is the COMMON case (most ext4 partitions lack the casefold feature) — fallback is the default path, not an exceptional one.

### Runtime Verification (CASE-10)
- **D-11:** After `chattr +F` exits 0, verify casefold is active: write an uppercase filename, attempt to read it back lowercase. If the verify test fails (NFS/FUSE false positive), fall back to shim silently.

### Logging and Notifications (CASE-11)
- **D-12:** Log at INFO level when chattr+F succeeds and verifies. Log at DEBUG level on any fallback. No user-visible error dialog for normal fallback on unsupported filesystems.
- **D-13:** Informational notification fires **only** when the filesystem is confirmed ext4 (statfs magic = 0xEF53) but `chattr +F` returns EOPNOTSUPP. This means ext4 is present but the casefold feature (`-O casefold`) was not enabled at mkfs time. Notification is educational: the user could theoretically reformat with casefold. btrfs/XFS/ZFS users get NO notification — they can never enable it, so notifying would be permanent noise.
- **D-14:** Notification is shown at most once per session. Session flag: module-level `let hasShownCasefoldNotification = false` in `fs.ts`. Set to true after first fire.
- **D-15:** Notification dispatch uses an injectable `_setNotifier(fn)` seam in `fs.ts`, injected by the renderer bootstrap. Mirrors the `_setNotifier` pattern in `elevated.ts` (Phase 12). Before injection, notification calls are no-ops. This keeps `fs.ts` Redux-free and makes the notification path testable.

### Test Seam Architecture
- **D-16:** chattr execFile call uses an injectable `_setChattr(fn)` seam in `fs.ts`. Same pattern as `_setSpawner` in `elevated.ts` and `_setNotifier` in `elevated.ts`. Tests inject a mock function; production leaves the default `child_process.execFile`.
- **D-17:** statfs mock in tests uses `vi.spyOn(fs.promises, 'statfs')`. Consistent with how fs operations are mocked in `resolvePathCase.test.ts`. No separate injectable seam for statfs.

### Out of Scope (Confirmed Deferred)
- btrfs casefold: not supported in any released kernel as of April 2026 — CASE-13 deferred to v2+
- Migration of existing non-empty staging directories — CASE-12 deferred to v2+

### Claude's Discretion
- Exact implementation of `commandExists('chattr')` pre-flight check: `execFile('which', ...)` vs `execFile('chattr', ['--version'], ...)` — Claude picks the more reliable approach
- Exact verify-casefold logic (uppercase write + lowercase read) within the CASE-10 requirement
- Test case selection: Claude writes Vitest tests covering (1) ext4+casefold success path, (2) EOPNOTSUPP fallback, (3) non-ext4 filesystem bypass, (4) Flatpak guard bypass, (5) Windows platform guard bypass, (6) notification fires on first EOPNOTSUPP-on-ext4 only

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Injection Target
- `src/renderer/src/util/fs.ts` — `ensureDirWritableAsync` (line ~1224); `applyChattrCasefold` inserted here; read full function before modifying
- `src/renderer/src/util/fs.ts` — existing Wine-prefix shim (`isWinePrefixPath`, `resolveCaseIfWinePrefix`) — understand shim scope to confirm non-intersection with staging dir paths

### Seam Patterns (must mirror exactly)
- `src/renderer/src/util/elevated.ts` — `_setSpawner` injectable seam pattern; `_setNotifier` injectable seam pattern — D-15 and D-16 must follow these exactly

### Requirements
- `.planning/REQUIREMENTS.md` §Filesystem Layer — CASE-05 through CASE-11 are the acceptance criteria for this phase
- `.planning/ROADMAP.md` §Phase 16 — success criteria items 1–5

### Research
- `.planning/STATE.md` §Research Context (v6.0) — pre-validated architectural decisions including injection ordering, EOPNOTSUPP as common case, btrfs deferral, commandExists pre-flight, runtime verification pattern

### Test Reference
- `src/renderer/src/util/fs.test.ts` — existing 22 Vitest tests for the fs shim; new chattr+F tests go in this file or a sibling `chattrCasefold.test.ts`
- `src/renderer/src/util/resolvePathCase.test.ts` — vi.spyOn(fs.promises, ...) pattern reference for statfs mocking

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `ensureDirWritableAsync` in `fs.ts` (line ~1224): the exact insertion point for `applyChattrCasefold`. Already handles `fs.ensureDir` + canary write + elevation fallback — the chattr call slots in between ensureDir and the canary.
- `_setSpawner` / `_setNotifier` pattern in `elevated.ts`: injectable seam template — copy this pattern for `_setChattr` and `_setNotifier` in `fs.ts`.
- `isWinePrefixPath()` three-way conjunction: demonstrates the guard pattern for fs.ts utility functions (`platform === 'linux' && path.includes('/compatdata/') && path.includes('/pfx/')`).

### Established Patterns
- Platform guard: `if (process.platform !== 'linux') return;` — used consistently across Phase 14 shim additions; same for chattr+F
- Injectable seams: `let _spawner = defaultSpawner; export function _setSpawner(fn) { _spawner = fn; }` — mirror this for `_setChattr`
- PromiseBB: all fs.ts async functions return `PromiseBB<T>` — `applyChattrCasefold` must be compatible; wrap with `PromiseBB.resolve(...)`
- isSteamOS module-level cache: `let _isSteamOS: boolean | undefined = undefined;` pattern — mirror for `hasShownCasefoldNotification` and the statfs cache Map

### Integration Points
- `src/renderer/src/util/fs.ts` line ~1232: `PromiseBB.resolve(fs.ensureDir(dirPath))` — `.then(() => applyChattrCasefold(dirPath))` inserted here, before `.then(() => { const canary = ...`
- Renderer bootstrap: wherever `_setSpawner` is injected for `elevated.ts` — `_setNotifier` for the chattr notification must be injected at the same site

</code_context>

<specifics>
## Specific Ideas

- `fs.promises.statfs(path)` returns `{type: number, ...}` — compare `type === 0xEF53` for ext4. No string parsing.
- The EOPNOTSUPP notification message suggestion: "Your mod staging directory is on an ext4 filesystem without the casefold feature. Case-insensitive mod filenames will use the compatibility fallback. To enable kernel-level casefold, reformat with `mkfs.ext4 -O casefold`." (informational only, not an error)
- Verify-casefold implementation: write `path.join(dirPath, '__VORTEX_CASEFOLD_VERIFY')`, then attempt `fs.access(path.join(dirPath, '__vortex_casefold_verify'))` (lowercase). If access succeeds: casefold active. If ENOENT: false positive, fall back to shim.

</specifics>

<deferred>
## Deferred Ideas

- btrfs casefold support (CASE-13) — kernel support not confirmed in any released kernel as of April 2026; revisit when btrfs casefold lands in stable
- Migration path for pre-existing staging directories (CASE-12) — blocked by kernel empty-dir constraint; high complexity, defer to v2+
- Drift-detection notifications after many consecutive fallbacks — low value, not requested

None from discussion scope creep.

</deferred>

---

*Phase: 16-chattr-f-filesystem-layer*
*Context gathered: 2026-04-15*
