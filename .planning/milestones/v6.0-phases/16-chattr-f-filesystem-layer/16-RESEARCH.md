# Phase 16: chattr+F Filesystem Layer - Research

**Researched:** 2026-04-15
**Domain:** Linux kernel casefold (chattr +F), Node.js fs.promises.statfs, child_process.execFile, injectable test seams
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Injection Point**
- D-01: `applyChattrCasefold(dirPath)` inserted as `.then()` inside `ensureDirWritableAsync` in `src/renderer/src/util/fs.ts`, immediately after `fs.ensureDir(dirPath)` and before the canary write. Ordering is mandatory: `ensureDir → chattr+F → canary write`.
- D-02: `applyChattrCasefold` always resolves (never rejects). It handles all failure modes internally and falls back silently. `ensureDirWritableAsync` callers are unaffected.
- D-03: chattr+F is only applied to freshly created, empty directories. If the directory was pre-existing and non-empty, skip the chattr call entirely — the kernel rejects chattr+F on non-empty dirs.

**Platform and Sandbox Guards**
- D-04: Platform guard: `process.platform !== 'linux'` early return in `applyChattrCasefold`. Windows CI matrix stays green with zero code reached.
- D-05: Flatpak guard: check `process.env.FLATPAK_ID` — if set, skip chattr attempt entirely. chattr is unavailable inside the Flatpak sandbox.

**Filesystem Detection**
- D-06: Use `fs.promises.statfs(dirPath)` (Node 22 built-in, added v18.17.0) to detect ext4 via magic number `0xEF53`. No text parsing of `/proc/mounts`.
- D-07: Module-level `Map<string, boolean>` cache in `fs.ts` stores the statfs result per staging directory path. Avoids repeated statfs() syscalls across mod installs in the same session. Cache key = staging dir path, value = whether ext4 casefold is supported at that path.

**chattr Invocation**
- D-08: Use `child_process.execFile('chattr', ['+F', dirPath])` — argument array (not shell string) to avoid path injection. Zero new npm dependencies.
- D-09: Pre-flight check: `commandExists('chattr')` before any invocation. If the binary is absent (minimal Docker, custom container), skip and activate shim. Use `execFile('which', ['chattr'])` or equivalent — not a shell `which` command.
- D-10: Catch all non-zero exits (EOPNOTSUPP, EINVAL, ENOENT, any other code) and fall back silently to the existing userspace shim. EOPNOTSUPP is the COMMON case (most ext4 partitions lack the casefold feature) — fallback is the default path, not an exceptional one.

**Runtime Verification (CASE-10)**
- D-11: After `chattr +F` exits 0, verify casefold is active: write an uppercase filename, attempt to read it back lowercase. If the verify test fails (NFS/FUSE false positive), fall back to shim silently.

**Logging and Notifications (CASE-11)**
- D-12: Log at INFO level when chattr+F succeeds and verifies. Log at DEBUG level on any fallback. No user-visible error dialog for normal fallback on unsupported filesystems.
- D-13: Informational notification fires **only** when the filesystem is confirmed ext4 (statfs magic = 0xEF53) but `chattr +F` returns EOPNOTSUPP. Notification is educational about mkfs casefold option. btrfs/XFS/ZFS users get NO notification.
- D-14: Notification is shown at most once per session. Session flag: module-level `let hasShownCasefoldNotification = false` in `fs.ts`.
- D-15: Notification dispatch uses an injectable `_setNotifier(fn)` seam in `fs.ts`, injected by the renderer bootstrap. Mirrors the `_setNotifier` pattern in `elevated.ts`. Before injection, notification calls are no-ops.

**Test Seam Architecture**
- D-16: chattr execFile call uses an injectable `_setChattr(fn)` seam in `fs.ts`. Same pattern as `_setSpawner` in `elevated.ts`. Tests inject a mock function; production leaves the default `child_process.execFile`.
- D-17: statfs mock in tests uses `vi.spyOn(fs.promises, 'statfs')`. Consistent with how fs operations are mocked in `resolvePathCase.test.ts`. No separate injectable seam for statfs.

### Claude's Discretion
- Exact implementation of `commandExists('chattr')` pre-flight check: `execFile('which', ...)` vs `execFile('chattr', ['--version'], ...)` — Claude picks the more reliable approach
- Exact verify-casefold logic (uppercase write + lowercase read) within the CASE-10 requirement
- Test case selection: Claude writes Vitest tests covering (1) ext4+casefold success path, (2) EOPNOTSUPP fallback, (3) non-ext4 filesystem bypass, (4) Flatpak guard bypass, (5) Windows platform guard bypass, (6) notification fires on first EOPNOTSUPP-on-ext4 only

### Deferred Ideas (OUT OF SCOPE)
- btrfs casefold support (CASE-13) — kernel support not confirmed in any released kernel as of April 2026
- Migration path for pre-existing staging directories (CASE-12) — blocked by kernel empty-dir constraint
- Drift-detection notifications after many consecutive fallbacks
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CASE-05 | Detect whether a new mod staging directory is on ext4 using `fs.statfs()` magic number before attempting kernel casefold | `fs.promises.statfs()` verified: returns `{type: 0xef53, ...}` for ext4; available since Node 18.17.0; Node 22.22.0 in use |
| CASE-06 | Apply `chattr +F` to a new, empty mod staging directory on supported ext4 filesystems at creation time, before any files are written | D-01 injection point after `ensureDir`, before canary; D-08 `execFile('chattr', ['+F', dirPath])`; D-03 empty-dir gate |
| CASE-07 | Fall back silently to existing userspace Wine-prefix shim when `chattr +F` fails (EOPNOTSUPP, EINVAL, ENOENT, non-ext4, any non-zero exit) | Verified: chattr exits code 1 on EOPNOTSUPP; D-02 always-resolves contract; D-10 catch all non-zero |
| CASE-08 | chattr+F call is a no-op on Windows (`process.platform !== 'linux'`) — Windows CI stays green | D-04 platform guard; pattern from `isWinePrefixPath()` in fs.ts |
| CASE-09 | chattr+F call is skipped when running inside Flatpak sandbox (`FLATPAK_ID` env var is set) | D-05 Flatpak guard; `process.env.FLATPAK_ID` check pattern |
| CASE-10 | After successful `chattr +F`, verify casefold is active by writing uppercase filename and reading it back lowercase — falls back to shim if verify fails | D-11 verify logic; verified: `fs.access(lowerFile)` returns ENOENT on non-casefold; verified by test on ext4 without casefold |
| CASE-11 | Log INFO on success; log DEBUG on fallback; no user-visible error for normal fallback; informational notification once per session on EOPNOTSUPP-on-ext4 | D-12/D-13/D-14/D-15; `_setNotifier` seam injected from renderer.tsx at line ~635 alongside elevated.ts injection |
</phase_requirements>

---

## Summary

Phase 16 adds kernel-level case-insensitivity for mod staging directories created on ext4-casefold filesystems, via a single new function `applyChattrCasefold(dirPath)` inserted into `ensureDirWritableAsync` in `src/renderer/src/util/fs.ts`. All decisions are locked in CONTEXT.md. The implementation is a pure additive change to one file with one new test file (or additions to the existing `fs.test.ts`).

The core architectural insight is that EOPNOTSUPP is the **default** path: most ext4 partitions lack the casefold feature (`mkfs.ext4 -O casefold` is not a default option). The function must treat fallback as normal, not exceptional. All error conditions silently resolve, and the existing Wine-prefix userspace shim covers the fallback path transparently.

The seam architecture (injectable `_setChattr` + `_setNotifier`) follows `elevated.ts` exactly, giving full test coverage without real subprocess or filesystem calls.

**Primary recommendation:** Implement as a single focused PR to `linux-port` branch. The entire change is `applyChattrCasefold` (~80 lines in `fs.ts`) + test coverage (~120 lines in a new `chattrCasefold.test.ts`).

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Filesystem type detection (statfs) | Renderer (fs.ts utility) | — | fs.ts owns all filesystem operations; statfs is a synchronous-equivalent OS call |
| chattr subprocess invocation | Renderer (fs.ts utility) | — | Renderer process handles mod deployment; elevated.ts pattern shows subprocess spawning from renderer |
| Platform / sandbox guards | Renderer (fs.ts utility) | — | Guards live at the call site; no IPC needed — all logic is local to the renderer process |
| Notification dispatch | Renderer (Redux via seam) | — | `_setNotifier` injected from renderer bootstrap routes through `sendNotification` on the API |
| Casefold verification | Renderer (fs.ts utility) | — | Pure filesystem I/O; stays in fs.ts alongside the chattr call |
| Test seam injection | Test infrastructure | Renderer bootstrap | `_setChattr` used by tests; production binary injected nowhere (uses default) |

---

## Standard Stack

### Core (all built-in — zero new dependencies)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `node:child_process` `.execFile` | Node 22.22.0 built-in | Invoke chattr subprocess | Argument-array form prevents shell injection; already used in codebase via elevated.ts spawn pattern |
| `node:fs.promises.statfs` | Node 22.22.0 built-in (available since 18.17.0) | Detect ext4 via magic number 0xEF53 | No parsing `/proc/mounts`; single syscall; returns `{type: number, ...}` |
| `bluebird` `PromiseBB` | 3.7.2 (already in repo) | Return type compatibility with fs.ts | All fs.ts async functions return `PromiseBB<T>` |
| `child_process.execFile` (via injectable seam) | Node built-in | `_setChattr` injectable type | Same seam shape as `_setSpawner` in elevated.ts |

**Version verification:** [VERIFIED: confirmed locally via `node -e "const {statfs}=require('fs').promises; console.log(typeof statfs)"` → `function`]

**Installation:** No new packages. All dependencies are Node built-ins or already in `pnpm-lock.yaml`.

---

## Architecture Patterns

### System Architecture Diagram

```
ensureDirWritableAsync(dirPath)
         │
         ▼
  fs.ensureDir(dirPath)        ← fs-extra, creates dir if absent
         │
         ▼
  applyChattrCasefold(dirPath) ← NEW — always resolves
         │
    ┌────┴─────────────────────────────────────────────┐
    │ Guard: platform !== 'linux'  →  resolve() (noop) │
    │ Guard: FLATPAK_ID set        →  resolve() (noop) │
    │ Guard: dir non-empty         →  resolve() (noop) │
    └────┬─────────────────────────────────────────────┘
         │
         ▼
  statfs(dirPath).type === 0xEF53?
         │
    No → resolve() (noop, silent fallback)
         │
    Yes ↓
  _chattrFn('chattr', ['+F', dirPath]) callback
         │
    err(code≠0) → fallback path:
         │          ├── statfs is ext4 + EOPNOTSUPP?
         │          │    └── _notifier (once/session, informational)
         │          └── log DEBUG "chattr+F failed, using shim"
         │          └── resolve()
    exit(0) → verify casefold:
         │     write __VORTEX_CASEFOLD_VERIFY (uppercase)
         │     fs.access __vortex_casefold_verify (lowercase)
         │          │
         │     ENOENT → false positive → log DEBUG → resolve()
         │     success → log INFO "chattr+F active" → resolve()
         ▼
  canary write (existing)
         │
         ▼
  ensureDirWritableAsync resolves
```

### Recommended Project Structure

No new directories. All changes in:

```
src/renderer/src/util/
├── fs.ts                        # Modified: applyChattrCasefold + seams + cache
├── fs.test.ts                   # Existing: leave intact (22 tests)
└── chattrCasefold.test.ts       # New: chattr+F specific Vitest tests
```

And one injection site:

```
src/renderer/src/
└── renderer.tsx                 # Modified: import + inject _setNotifier for fs.ts
```

### Pattern 1: Injectable Seam (mirror elevated.ts exactly)

**What:** Module-level function pointer replaced at bootstrap or test setup time
**When to use:** Whenever a fs.ts utility calls an OS-level side effect (subprocess, notification)

```typescript
// Source: src/renderer/src/util/elevated.ts lines 15-33 (VERIFIED by codebase read)

// --- In fs.ts (new additions, mirroring elevated.ts) ---

import { execFile as execFileNative } from "child_process";

// ExecFileFn matches the callback signature of child_process.execFile
type ExecFileFn = (
  cmd: string,
  args: string[],
  callback: (err: Error | null, stdout: string, stderr: string) => void,
) => void;

let _chattr: ExecFileFn = execFileNative;

/** @internal Override the execFile function for testing. Do not call in production. */
export function _setChattr(fn: ExecFileFn): void {
  _chattr = fn;
}

// Separate notifier seam for fs.ts (NOT the same as elevated.ts _setNotifier)
import type { INotification } from "../types/INotification";
type NotifierFn = (notification: INotification) => void;
let _chattrNotifier: NotifierFn | undefined;

/** @internal Register a notification handler for casefold info messages. */
export function _setChattrNotifier(fn: NotifierFn | undefined): void {
  _chattrNotifier = fn;
}
```

**CRITICAL NOTE:** The `_setNotifier` name is already used by elevated.ts (imported and called in renderer.tsx at line 635). The fs.ts notifier MUST use a distinct export name (e.g., `_setChattrNotifier`) to avoid collision. The planner must inject BOTH in renderer.tsx.

### Pattern 2: statfs Cache Map

**What:** Module-level Map storing ext4 detection result per path
**When to use:** Repeated calls to `ensureDirWritableAsync` for the same staging directory

```typescript
// Source: [VERIFIED by codebase read — isSteamOS cache in elevated.ts line 35]
// and statfs API verified via: node -e "const {statfs}=require('fs').promises; statfs('/').then(s=>console.log(s.type.toString(16)))"

// Module-level in fs.ts
const ext4CasefoldCache = new Map<string, boolean>();
let hasShownCasefoldNotification = false;

async function isExt4Filesystem(dirPath: string): Promise<boolean> {
  if (ext4CasefoldCache.has(dirPath)) {
    return ext4CasefoldCache.get(dirPath)!;
  }
  try {
    const stats = await fsPromises.statfs(dirPath);
    const result = stats.type === 0xef53;
    ext4CasefoldCache.set(dirPath, result);
    return result;
  } catch {
    ext4CasefoldCache.set(dirPath, false);
    return false;
  }
}
```

### Pattern 3: applyChattrCasefold Always-Resolves Contract

**What:** The function NEVER rejects — all errors are caught internally
**When to use:** Always — D-02 is a hard requirement; callers of `ensureDirWritableAsync` must not see chattr errors

```typescript
// Source: [ASSUMED — pattern based on D-01 through D-15 from CONTEXT.md]
// Verified seam shape from elevated.ts

async function applyChattrCasefold(dirPath: string): Promise<void> {
  // D-04: Platform guard
  if (process.platform !== "linux") {
    return;
  }
  // D-05: Flatpak guard
  if (process.env.FLATPAK_ID) {
    return;
  }
  // D-03: Non-empty directory guard (kernel rejects chattr +F on non-empty dirs)
  try {
    const entries = await fsPromises.readdir(dirPath);
    if (entries.length > 0) {
      return;
    }
  } catch {
    return;
  }
  // D-06: ext4 detection via statfs magic number
  const isExt4 = await isExt4Filesystem(dirPath);
  if (!isExt4) {
    log("debug", "chattr+F skipped: filesystem is not ext4", { dirPath });
    return;
  }
  // D-08/D-09: Pre-flight check then invoke chattr
  return new Promise<void>((resolve) => {
    _chattr("which", ["chattr"], (whichErr) => {
      if (whichErr) {
        // chattr binary not found — D-09
        log("debug", "chattr not found, using Wine-prefix shim fallback", { dirPath });
        resolve();
        return;
      }
      _chattr("chattr", ["+F", dirPath], (err) => {
        if (err) {
          // D-10: Any non-zero exit → silent fallback
          // D-13: Inform user once if ext4 lacks casefold feature
          if (!hasShownCasefoldNotification) {
            hasShownCasefoldNotification = true;
            _chattrNotifier?.({
              type: "info",
              id: "casefold-unavailable",
              title: "Case-insensitive filesystem unavailable",
              message:
                "Your mod staging directory is on an ext4 filesystem without the casefold " +
                "feature. Case-insensitive mod filenames will use the compatibility fallback. " +
                "To enable kernel-level casefold, reformat with `mkfs.ext4 -O casefold`.",
            });
          }
          log("debug", "chattr+F failed, falling back to Wine-prefix shim", {
            dirPath,
            exitCode: (err as NodeJS.ErrnoException).code,
          });
          resolve();
          return;
        }
        // D-11: Verify casefold is actually active (catches NFS/FUSE false positives)
        verifyCasefold(dirPath).then((active) => {
          if (active) {
            log("info", "chattr+F casefold enabled for staging directory", { dirPath });
          } else {
            log("debug", "chattr+F verify failed (NFS/FUSE false positive?), using shim", { dirPath });
          }
          resolve();
        });
      });
    });
  });
}

async function verifyCasefold(dirPath: string): Promise<boolean> {
  const upperFile = path.join(dirPath, "__VORTEX_CASEFOLD_VERIFY");
  const lowerFile = path.join(dirPath, "__vortex_casefold_verify");
  try {
    await fsPromises.writeFile(upperFile, "");
    await fsPromises.access(lowerFile);
    await fsPromises.unlink(upperFile);
    return true;
  } catch {
    try { await fsPromises.unlink(upperFile); } catch { /* best-effort cleanup */ }
    return false;
  }
}
```

### Pattern 4: Injection in renderer.tsx

**What:** The `_setChattrNotifier` must be wired at the same bootstrap site as `_setNotifier` from elevated.ts
**When to use:** renderer.tsx, immediately after the existing `_setNotifier` injection at line ~635

```typescript
// Source: [VERIFIED: renderer.tsx line 127 + 635 by codebase read]

// At top of renderer.tsx (with existing import):
import { _setNotifier } from "./util/elevated";
import { _setChattrNotifier } from "./util/fs";  // ADD THIS

// In bootstrap, near line 635 (after setStore()):
_setNotifier((notification) => {
  extensions.getApi().sendNotification?.(notification);
});
_setChattrNotifier((notification) => {   // ADD THIS
  extensions.getApi().sendNotification?.(notification);
});
```

### Anti-Patterns to Avoid

- **Shell-string form `exec('chattr +F ' + dirPath)`:** Vulnerable to path injection if dirPath contains spaces or special chars. Use `execFile('chattr', ['+F', dirPath])` only.
- **Rejecting on chattr failure:** D-02 is absolute — `applyChattrCasefold` must never reject. If it rejects, `ensureDirWritableAsync` callers will see unexpected failures.
- **Calling `chattr +F` on non-empty directories:** The kernel (ext4 casefold) returns EINVAL, not EOPNOTSUPP, for non-empty dirs. Always check D-03 guard first.
- **Treating EOPNOTSUPP as an error worth logging at WARN/ERROR:** EOPNOTSUPP is the normal case for most ext4 partitions. Log at DEBUG only.
- **Using `spawn` instead of `execFile` for chattr:** `spawn` streams output and doesn't buffer; `execFile` collects stdout/stderr and calls back on exit. For a simple command with no streaming needed, `execFile` is correct.
- **Sharing `_setNotifier` name with elevated.ts:** Two different modules, two different notifier variables. The fs.ts notifier MUST have a distinct export name.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Filesystem type detection | Custom `/proc/mounts` parser | `fs.promises.statfs().type === 0xEF53` | statfs is a single syscall; parsing text files is fragile, locale-dependent, requires extra I/O |
| Command availability check | Full path search logic | `execFile('which', ['chattr'], callback)` | POSIX-standard; works across all distros; already resolved to `/usr/bin/which` on Ubuntu/Debian/Arch |
| Case-insensitive test | Read directory listings | Write uppercase, access lowercase via `fs.promises.access` | Direct kernel test; readdir-based logic can't detect casefold without case-collision |
| Promise wrapping of callback API | Custom promisify | `util.promisify(execFile)` or inline Promise constructor | Node built-in; consistent with existing patterns in codebase |
| Notification deduplication | Complex session state | Module-level `let hasShownCasefoldNotification = false` | One boolean, reset on process restart; matches D-14 exactly |

**Key insight:** The entire implementation avoids new dependencies by combining three Node built-ins (`statfs`, `execFile`, `fs.promises.access`) with one injectable seam. The complexity budget is tiny.

---

## Runtime State Inventory

> Phase is greenfield addition (no rename/refactor). No runtime state concerns.

| Category | Items Found | Action Required |
|----------|-------------|-----------------|
| Stored data | None — chattr+F adds no persisted state | None |
| Live service config | None — no daemon, no external service | None |
| OS-registered state | None | None |
| Secrets/env vars | `FLATPAK_ID` (read-only check, not set) | None |
| Build artifacts | None | None |

---

## Common Pitfalls

### Pitfall 1: `execFile` error.code is an exit code integer, not an EOPNOTSUPP string

**What goes wrong:** Developer checks `err.code === 'EOPNOTSUPP'` expecting a POSIX error string — but `execFile` (unlike `fs.*` APIs) returns the subprocess exit code as the numeric `code` field.
**Why it happens:** `fs.access` sets `err.code = 'ENOENT'` (POSIX string). But `execFile` sets `err.code` = exit code number (e.g., `1`). chattr outputs EOPNOTSUPP to stderr but exits with code 1.
**How to avoid:** Catch ALL non-zero exits with `if (err)` — do not test `err.code` value. The stderr message "Operation not supported" is informational only and not needed for logic.
**Warning signs:** [VERIFIED: `node -e "execFile('chattr', ['+F', tmpDir], (err)=>console.log(err.code))"` → prints `1`, not `'EOPNOTSUPP'`]

### Pitfall 2: chattr +F on non-empty directory returns EINVAL (not EOPNOTSUPP)

**What goes wrong:** If `applyChattrCasefold` is called on a directory that already contains files, chattr exits with a different error than on non-casefold filesystems.
**Why it happens:** The kernel casefold implementation rejects non-empty dirs at the VFS level — it cannot retrofit casefold onto existing dentries.
**How to avoid:** D-03 guard — check `readdir(dirPath).length === 0` before calling chattr. This guard runs after `ensureDir` ensures the dir exists; the directory was just created so it SHOULD be empty, but pre-existing paths must be skipped.
**Warning signs:** `err.message` contains "Invalid argument" instead of "Operation not supported".

### Pitfall 3: `_setNotifier` name collision between elevated.ts and fs.ts

**What goes wrong:** Both files export a function named `_setNotifier`. If renderer.tsx imports from the wrong module or doesn't import from fs.ts at all, the notification for EOPNOTSUPP-on-ext4 is silently dropped.
**Why it happens:** Copy-paste from elevated.ts pattern without renaming the export.
**How to avoid:** Use `_setChattrNotifier` as the export name in `fs.ts`. renderer.tsx must import and inject BOTH.
**Warning signs:** Test for D-13 notification passes (mock injected) but production user never sees notification.

### Pitfall 4: `vi.spyOn(fsPromises, 'statfs')` may fail in Vitest happy-dom environment

**What goes wrong:** `fs.promises` is a getter on the `fs` module object; `vi.spyOn` on getters requires the target to be writable.
**Why it happens:** The Vitest happy-dom environment shims some Node.js module exports; `fs.promises.statfs` may be non-configurable in the test context.
**How to avoid:** In test files, spy on the inner `statfs` at module scope by importing `* as fsPromises from 'fs'` and then `vi.spyOn(fsPromises.promises, 'statfs')`. Alternatively, use a direct `vi.mock('node:fs', ...)` factory. Check that `resolvePathCase.test.ts` `vi.mock('fs', ...)` pattern works with `statfs` too.
**Warning signs:** Test error "Cannot spy on a non-existent property" or "Cannot assign to read only property".

### Pitfall 5: `util.promisify(execFile)` type issues with the injectable seam

**What goes wrong:** The injectable `_setChattr` expects a callback-form signature; `util.promisify` wraps it to return a Promise — but you can't inject a promisified function where a callback form is expected.
**Why it happens:** `ExecFileFn` is defined as callback-style to match the injectable seam contract.
**How to avoid:** Keep the seam as callback-style (`_chattr(cmd, args, callback)`). Inside `applyChattrCasefold`, wrap in an explicit `new Promise()` constructor. Do NOT use `promisify` on the seam.
**Warning signs:** TypeScript error `Argument of type '... Promise' is not assignable to type 'ExecFileFn'`.

### Pitfall 6: Module-level cache state leaks between Vitest tests

**What goes wrong:** `ext4CasefoldCache` (Map) and `hasShownCasefoldNotification` (boolean) persist across test cases within the same test file, causing test ordering to affect results.
**Why it happens:** Module-level variables are not reset between test cases unless explicitly cleared.
**How to avoid:** Export `_resetChattrState()` (or per-variable resets) for test use. Call in `beforeEach` or `afterEach`. Pattern: `export function _resetChattrState() { ext4CasefoldCache.clear(); hasShownCasefoldNotification = false; }`. Tagged `@internal`.
**Warning signs:** Test 2 (notification-once) fails when run after Test 1 sets `hasShownCasefoldNotification = true` without reset.

---

## Code Examples

### execFile pre-flight + chattr invocation (verified pattern)

```typescript
// Source: [VERIFIED: chattr behavior confirmed via local execFile test]
// chattr exits code 1 on EOPNOTSUPP; err.code is numeric exit code, NOT a POSIX error string

_chattr("which", ["chattr"], (whichErr) => {
  if (whichErr) {
    // chattr binary not found — skip entirely, shim handles case resolution
    log("debug", "chattr not available in PATH, using shim", { dirPath });
    resolve();
    return;
  }
  _chattr("chattr", ["+F", dirPath], (chattrErr) => {
    if (chattrErr) {
      // All non-zero exits: EOPNOTSUPP (code 1 on non-casefold ext4),
      // EINVAL (code 1 on non-empty dir), ENOENT (code 1 on missing dir), etc.
      // chattrErr.code is the numeric exit code (1), NOT a string like 'EOPNOTSUPP'
      handleChattrFailure(chattrErr, dirPath, isExt4);
      resolve();
      return;
    }
    // exit code 0 → chattr accepted the flag; now verify it's actually active
    verifyCasefold(dirPath).then((active) => { ... resolve(); });
  });
});
```

### statfs ext4 detection (verified)

```typescript
// Source: [VERIFIED: node -e "require('fs').promises.statfs('/').then(s=>console.log(s.type.toString(16)))" → ef53]
// Node 22.22.0 (project lockfile); statfs available since Node 18.17.0

const EXT4_MAGIC = 0xef53;

const stats = await fsPromises.statfs(dirPath);
const isExt4 = stats.type === EXT4_MAGIC;
// On this machine: type=61267 decimal = 0xef53 hex = ext4 confirmed
```

### Casefold verify pattern (verified)

```typescript
// Source: [VERIFIED: fs.access on lowercase returns ENOENT on non-casefold ext4]

async function verifyCasefold(dirPath: string): Promise<boolean> {
  const verifyFileName = "__VORTEX_CASEFOLD_VERIFY";
  const upperFile = path.join(dirPath, verifyFileName);
  const lowerFile = path.join(dirPath, verifyFileName.toLowerCase());
  try {
    await fsPromises.writeFile(upperFile, "");
    // On casefold-enabled dir: lowercase access succeeds (kernel maps it)
    // On non-casefold dir or NFS/FUSE: ENOENT returned
    await fsPromises.access(lowerFile, fsConstants.F_OK);
    return true;
  } catch {
    return false;
  } finally {
    // Best-effort cleanup — file may not exist on failure path
    fsPromises.unlink(upperFile).catch(() => {});
  }
}
```

### Vitest test structure for chattrCasefold.test.ts

```typescript
// Source: [VERIFIED: mirrors fs.test.ts + resolvePathCase.test.ts patterns from codebase]

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock child_process before importing fs.ts
vi.mock("./resolvePathCase", () => ({ resolvePathCase: vi.fn() }));
vi.mock("fs-extra", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  const base = (actual.default ?? actual) as Record<string, unknown>;
  return {
    ...base,
    ensureDir: vi.fn().mockResolvedValue(undefined),
    default: { ...base, ensureDir: vi.fn().mockResolvedValue(undefined) },
  };
});

import * as fs from "./fs";
// _setChattr, _setChattrNotifier, _resetChattrState exported from fs.ts

describe("applyChattrCasefold", () => {
  let originalPlatform: PropertyDescriptor;

  beforeEach(() => {
    originalPlatform = Object.getOwnPropertyDescriptor(process, "platform")!;
    fs._resetChattrState();
    vi.clearAllMocks();
  });

  afterEach(() => {
    Object.defineProperty(process, "platform", originalPlatform);
    delete process.env.FLATPAK_ID;
  });

  function setPlatform(p: string) {
    Object.defineProperty(process, "platform", {
      value: p, writable: true, configurable: true,
    });
  }

  it("skips chattr on Windows (platform guard)", async () => {
    setPlatform("win32");
    const mockChattr = vi.fn();
    fs._setChattr(mockChattr);
    // Call through ensureDirWritableAsync or expose applyChattrCasefold directly
    // assert mockChattr never called
    expect(mockChattr).not.toHaveBeenCalled();
  });

  it("skips chattr in Flatpak sandbox", async () => {
    setPlatform("linux");
    process.env.FLATPAK_ID = "org.test.App";
    const mockChattr = vi.fn();
    fs._setChattr(mockChattr);
    // ... call and assert mockChattr not called
    expect(mockChattr).not.toHaveBeenCalled();
  });

  it("skips chattr on non-ext4 filesystem", async () => {
    setPlatform("linux");
    vi.spyOn(require("fs").promises, "statfs").mockResolvedValue({ type: 0x9123683e }); // btrfs
    // ... assert chattr not called
  });

  it("falls back silently on EOPNOTSUPP (chattr exit code 1)", async () => {
    // Mock: statfs returns ext4, chattr exits with code 1
    // Assert: function resolves (no rejection), log('debug') called
  });

  it("verifies casefold after chattr exit 0", async () => {
    // Mock: statfs ext4, chattr exits 0, fs.access succeeds (casefold active)
    // Assert: log('info') called
  });

  it("shows notification once per session on EOPNOTSUPP-on-ext4", async () => {
    // Call twice with mocked EOPNOTSUPP on ext4
    // Assert: notification fired once, not twice
  });
});
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Text-parse `/proc/mounts` for filesystem type | `fs.promises.statfs().type` magic number | Node 18.17.0 (2023) | Single syscall; no text parsing; no locale issues |
| `exec('chattr +F ...')` shell form | `execFile('chattr', ['+F', ...])` arg array | Node best practice always | Eliminates shell injection on paths with spaces/special chars |
| chattr invoked without pre-flight | `which chattr` pre-flight + empty-dir check | This phase | Prevents EINVAL on non-empty dirs; graceful degradation in containers |

**Deprecated/outdated:**
- `spawn` for one-shot commands: `execFile` is the correct API when you need stdout/stderr buffered and a single callback on exit.
- Checking `err.code === 'EOPNOTSUPP'` after execFile: use `if (err)` only — exit code is numeric, not a POSIX error string.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| `chattr` CLI | CASE-06 (chattr+F invocation) | YES on Ubuntu (`/usr/bin/chattr`) | e2fsprogs 1.46+ | D-09 `which chattr` pre-flight skips gracefully |
| `fs.promises.statfs` | CASE-05 (ext4 detection) | YES | Node 22.22.0 (available since 18.17.0) | — (built-in, no fallback needed) |
| `child_process.execFile` | D-08 (chattr subprocess) | YES | Node built-in | — |
| ext4 casefold kernel feature | CASE-06 | Platform-dependent | Linux 5.2+ (feature flag) | EOPNOTSUPP → silent fallback (D-10) |
| Vitest 4.1.0 | Test execution | YES | 4.1.0 (in repo) | — |

**Missing dependencies with no fallback:** None — all are Node built-ins or have explicit fallbacks baked in.

**Environment note:** `chattr +F` on non-casefold ext4 [VERIFIED: exits code 1, stderr "chattr: Operation not supported while setting flags on <path>"]. This is the expected behavior for ~99% of Linux ext4 users.

**Flatpak note:** When `FLATPAK_ID` is set, chattr is unavailable inside the sandbox (the binary exists on the host but is not accessible to Flatpak-sandboxed processes). D-05 guard prevents invocation entirely. [ASSUMED — based on Flatpak security model; not tested in Flatpak sandbox directly]

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.0 |
| Config file | `src/renderer/vitest.config.mts` |
| Quick run command | `pnpm --filter renderer vitest run src/renderer/src/util/chattrCasefold.test.ts` |
| Full suite command | `pnpm vitest run` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CASE-05 | statfs returns 0xEF53 for ext4, triggers chattr path | unit | `pnpm --filter renderer vitest run src/renderer/src/util/chattrCasefold.test.ts` | ❌ Wave 0 |
| CASE-05 | statfs returns non-ext4 magic, skips chattr | unit | same | ❌ Wave 0 |
| CASE-06 | chattr execFile called on fresh empty ext4 dir | unit | same | ❌ Wave 0 |
| CASE-06 | chattr NOT called on non-empty dir | unit | same | ❌ Wave 0 |
| CASE-07 | chattr exit code 1 → silent fallback, resolves | unit | same | ❌ Wave 0 |
| CASE-07 | which-not-found → silent fallback, resolves | unit | same | ❌ Wave 0 |
| CASE-08 | platform=win32 → chattr never invoked | unit | same | ❌ Wave 0 |
| CASE-09 | FLATPAK_ID set → chattr never invoked | unit | same | ❌ Wave 0 |
| CASE-10 | chattr exits 0, fs.access lowercase succeeds → log INFO | unit | same | ❌ Wave 0 |
| CASE-10 | chattr exits 0, fs.access lowercase fails (ENOENT) → fallback | unit | same | ❌ Wave 0 |
| CASE-11 | EOPNOTSUPP on ext4 → notifier called once | unit | same | ❌ Wave 0 |
| CASE-11 | EOPNOTSUPP on ext4 called twice → notifier called once total | unit | same | ❌ Wave 0 |
| CASE-11 | Success path → log INFO, no user notification | unit | same | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `pnpm --filter renderer vitest run src/renderer/src/util/chattrCasefold.test.ts`
- **Per wave merge:** `pnpm vitest run`
- **Phase gate:** Full suite green (including pre-existing 22 fs.test.ts tests) before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `src/renderer/src/util/chattrCasefold.test.ts` — covers CASE-05 through CASE-11 (13 test cases)
- [ ] Export `_resetChattrState()` from `fs.ts` — needed by test beforeEach to clear module-level cache and flag

*(Existing test infrastructure in `fs.test.ts` is sufficient for the framework — no new config needed)*

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | — |
| V3 Session Management | no | — |
| V4 Access Control | no | — |
| V5 Input Validation | yes | `execFile` argument array (D-08) — prevents shell injection from dirPath |
| V6 Cryptography | no | — |

### Known Threat Patterns for subprocess invocation + filesystem path handling

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Shell injection via dirPath with spaces/special chars | Tampering | `execFile(cmd, [arg1, arg2])` never `exec(cmd + ' ' + path)` — D-08 enforced |
| TOCTOU between statfs check and chattr call | Tampering | Low risk — chattr on wrong dir type is caught by EOPNOTSUPP/EINVAL and handled gracefully |
| Privilege escalation via chattr abuse | Elevation | `chattr +F` only sets casefold attribute; cannot gain write access; only valid on dirs current user owns |
| Flatpak container escape attempt | Boundary | D-05 guard prevents any subprocess invocation inside Flatpak |

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `_setChattrNotifier` as distinct name from elevated.ts `_setNotifier` is the correct approach | Architecture Patterns — Pattern 1 | If wrong name used: name collision, notification silently dropped in production |
| A2 | Flatpak blocks chattr access (D-05 guard is defensive) | Environment Availability | If wrong: chattr attempt in Flatpak would return ENOENT or EPERM → caught by D-10 fallback anyway |
| A3 | `vi.spyOn(require('fs').promises, 'statfs')` works in Vitest happy-dom | Validation Architecture | If wrong: tests fail with spy error; alternative is `vi.mock('node:fs', ...)` factory |

**Verified claims (not assumed):**
- `fs.promises.statfs('/').type === 0xef53` on ext4 [VERIFIED: local test]
- chattr exits code 1 on non-casefold ext4, stderr "Operation not supported" [VERIFIED: local test]
- `which chattr` via execFile succeeds when chattr is installed [VERIFIED: local test]
- `fs.access(lowerFile)` returns ENOENT on non-casefold ext4 after writing uppercase file [VERIFIED: local test]
- `fs.promises.statfs` is available as `function` in Node.js 18.19.1+ (project uses 22.22.0) [VERIFIED: local test]
- elevated.ts `_setNotifier` injection site is `renderer.tsx` lines 127+635 [VERIFIED: codebase read]

---

## Open Questions

1. **Should `applyChattrCasefold` be exported for direct testing or only tested via `ensureDirWritableAsync`?**
   - What we know: D-16 provides `_setChattr` seam; injectable seam tests suffice
   - What's unclear: Exporting the function directly simplifies test setup (no need to wire full `ensureDirWritableAsync` mock)
   - Recommendation: Export `applyChattrCasefold` as `/** @internal */` — same pattern as other testable utilities in fs.ts

2. **Is `fs.promises.readdir` the right emptiness check or should we use `fs.promises.opendir` (more efficient)?**
   - What we know: D-03 requires empty check; `readdir` returns string array (0 entries = empty)
   - What's unclear: `opendir` would be more efficient for large directories but adds complexity
   - Recommendation: Use `fs.promises.readdir` — simplest, consistent with existing fs.ts patterns, and the checked directory was just created (should always be empty or nearly empty)

---

## Sources

### Primary (HIGH confidence — VERIFIED by tool calls this session)

- Local execFile test: chattr +F behavior on non-casefold ext4 (exit code 1, stderr "Operation not supported")
- Local statfs test: `fs.promises.statfs('/').type === 0xef53` confirmed on ext4 host
- Local fs.access test: uppercase write + lowercase access returns ENOENT on non-casefold ext4
- Local `which chattr` test: confirms pre-flight check approach works
- Codebase read: `src/renderer/src/util/elevated.ts` lines 1-80 — exact `_setSpawner` / `_setNotifier` seam pattern
- Codebase read: `src/renderer/src/util/fs.ts` lines 1-200, 585-615, 1224-1310 — injection point and isWinePrefixPath pattern
- Codebase read: `src/renderer/src/util/fs.test.ts` lines 1-180 — test structure and mock patterns
- Codebase read: `src/renderer/src/renderer.tsx` lines 620-650 — `_setNotifier` injection site
- Codebase read: `src/renderer/src/types/INotification.ts` — `NotificationType` values confirmed

### Secondary (MEDIUM confidence — from official Node.js docs / built-in behavior)

- Node.js `fs.promises.statfs` API: available since Node 18.17.0, returns `{type, bsize, blocks, bfree, bavail, files, ffree}` [CITED: nodejs.org/api/fs.html#fspromisesstatfspath-options]
- Node.js `child_process.execFile` error behavior: `err.code` is the numeric exit code for subprocess failures (not a POSIX error string) [CITED: nodejs.org/api/child_process.html#child_processexecfilefile-args-options-callback]

### Tertiary (LOW confidence — documented but not tested in Flatpak sandbox)

- Flatpak sandbox blocks chattr subprocess: [ASSUMED based on Flatpak security model documentation]

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all built-ins verified locally
- Architecture: HIGH — seam patterns verified from codebase; injection point confirmed
- Pitfalls: HIGH — chattr error shape and statfs type verified by running actual commands
- Test patterns: HIGH — mirrors existing test files read directly from codebase

**Research date:** 2026-04-15
**Valid until:** 2026-05-15 (stable APIs — statfs and execFile are not going to change)
