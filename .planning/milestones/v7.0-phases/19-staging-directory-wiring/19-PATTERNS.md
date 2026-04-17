# Phase 19: Staging Directory Wiring - Pattern Map

**Mapped:** 2026-04-16
**Files analyzed:** 7 (5 modified source files + 1 updated test + 3 new test files)
**Analogs found:** 7 / 7

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `src/renderer/src/extensions/firststeps_dashlet/todos.tsx` | utility/condition-fn | request-response | self (existing file, one-line flip) | exact |
| `src/renderer/src/extensions/firststeps_dashlet/todos.test.ts` | test | — | self (update existing assertion) | exact |
| `src/renderer/src/extensions/mod_management/stagingDirectory.ts` | service | request-response | self (existing file, replace winapi block) | exact |
| `src/renderer/src/extensions/gamemode_management/util/discovery.ts` | utility/service | request-response | self (existing `idModPath` pattern in same file) | exact |
| `src/renderer/src/extensions/mod_management/texts.ts` | utility/i18n | request-response | self (existing file, ternary inside `t()`) | exact |
| `src/renderer/src/extensions/mod_management/views/Settings.tsx` | component | request-response | self (existing file, tooltip + suggestPath guard) | exact |
| `src/renderer/src/extensions/mod_management/stagingDirectory.test.ts` | test | — | `src/renderer/src/extensions/firststeps_dashlet/todos.test.ts` | role-match |
| `src/renderer/src/extensions/mod_management/texts.test.ts` | test | — | `src/renderer/src/extensions/firststeps_dashlet/todos.test.ts` | role-match |
| `src/renderer/src/extensions/gamemode_management/util/discovery.test.ts` | test | — | `src/renderer/src/extensions/gamemode_management/GameModeManager.test.ts` | role-match |

---

## Pattern Assignments

### `todos.tsx` — ONBRD-02a: minDiskSpace condition flip

**Analog:** Self — `src/renderer/src/extensions/firststeps_dashlet/todos.tsx`

**Current code to change** (lines 20-24):
```typescript
function minDiskSpace(required: number, key: string) {
  return (props) => {
    if (process.platform !== "win32") {
      return false;  // <-- flip to: return true;
    }
```

**Target pattern after change** — copy the existing `manual-scan` condition guard (line 171) as the style reference:
```typescript
// todos.tsx line 171 — established pattern for always-true on linux
condition: (props) =>
  process.platform === "linux" ? true : props.searchPaths !== undefined,
```

**Rule:** `return true` inside the `process.platform !== "win32"` guard. No other changes to the function.

---

### `todos.test.ts` — ONBRD-02a: update existing assertion

**Analog:** Self — existing test at `src/renderer/src/extensions/firststeps_dashlet/todos.test.ts`

**Test structure to copy** (lines 1-66 — full header including hoisted mocks and `setPlatform` helper):
```typescript
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("winapi-bindings", () => ({
  GetDiskFreeSpaceEx: vi.fn(() => ({ freeToCaller: 100 * 1024 * 1024 * 1024 })),
  GetVolumePathName: vi.fn(() => "C:"),
  default: { ... },
}));
// ... other vi.mock calls ...

describe("todos platform guards", () => {
  let originalPlatform: PropertyDescriptor;

  beforeEach(() => {
    originalPlatform = Object.getOwnPropertyDescriptor(process, "platform")!;
    vi.clearAllMocks();
    // ... reset mock return values ...
  });

  afterEach(() => {
    Object.defineProperty(process, "platform", originalPlatform);
  });

  function setPlatform(platform: string) {
    Object.defineProperty(process, "platform", {
      value: platform,
      writable: true,
      configurable: true,
    });
  }
```

**Line to update** (line 78):
```typescript
// BEFORE:
expect(result).toBe(false);

// AFTER:
expect(result).toBe(true);
```

**Also update** the test description string (line 70) from:
```typescript
it("minDiskSpace returns false on linux without calling winapi.GetDiskFreeSpaceEx", () => {
```
to:
```typescript
it("minDiskSpace returns true on linux without calling winapi.GetDiskFreeSpaceEx", () => {
```

---

### `stagingDirectory.ts` — ONBRD-02b: partition-exists check

**Analog:** Self — `src/renderer/src/extensions/mod_management/stagingDirectory.ts`

**Imports already present** (lines 1-14) — no new imports needed; `path` and `fs` already imported:
```typescript
import * as path from "path";
// ...
import * as fs from "../../util/fs";
// ...
import { isErrorWithSystemCode, unknownToError } from "@vortex/shared";
```

**Current code to replace** (lines 155-167):
```typescript
let partitionExists = true;
try {
  winapi.GetVolumePathName(instPath);
} catch (err) {
  // On Windows, error number 2 (0x2) translates to ERROR_FILE_NOT_FOUND.
  if (isErrorWithSystemCode(err) && err.systemCode === 2) {
    partitionExists = false;
  }
}
```

**Target pattern after change** — copy the guard shape from `manual-scan` condition in `todos.tsx` (win32 first, else Linux), plus the recursive walk shape from `idModPath` in `discovery.ts` lines 841-852:
```typescript
let partitionExists = true;
if (process.platform === "win32") {
  try {
    winapi.GetVolumePathName(instPath);
  } catch (err) {
    // On Windows, error number 2 (0x2) translates to ERROR_FILE_NOT_FOUND.
    if (isErrorWithSystemCode(err) && err.systemCode === 2) {
      partitionExists = false;
    }
  }
} else {
  // Linux: walk up until an accessible ancestor is found or root is reached
  const findAccessibleAncestor = async (checkPath: string): Promise<boolean> => {
    try {
      await fs.statAsync(checkPath);
      return true;
    } catch {
      const parent = path.dirname(checkPath);
      if (parent === checkPath) {
        // Reached filesystem root with no accessible directory
        return false;
      }
      return findAccessibleAncestor(parent);
    }
  };
  partitionExists = await findAccessibleAncestor(instPath);
}
```

**Key constraint:** `ensureStagingDirectoryImpl` is already `async` (line 132), so `await` works without any signature change.

---

### `discovery.ts` — ONBRD-02d: device-aware suggestStagingPath

**Analog:** Self — `src/renderer/src/extensions/gamemode_management/util/discovery.ts`, specifically the existing `idModPath` helper (lines 841-852) and the `if` block at lines 859-870.

**Existing `idModPath` pattern** (lines 841-852) — use as the skeleton for the mountpoint walk:
```typescript
const idModPath = async (testPath: string) => {
  try {
    statModPath = await fs.statAsync(testPath);
  } catch (err) {
    const code = getErrorCode(err);
    if (code === "ENOENT") {
      await idModPath(path.dirname(testPath));
    } else {
      throw err;
    }
  }
};
```

**Current condition to replace** (lines 859-870):
```typescript
if (statModPath.dev === statUserData.dev || process.platform !== "win32") {
  // main mod folder is on same drive as userdata, use a subdirectory below that
  suggestion = path.join("{USERDATA}", "{game}", "mods");
} else {
  // different drives, suggest path on same drive
  const volume = winapi.GetVolumePathName(modPaths[""]);
  suggestion = path.join(
    volume,
    state.settings.mods.suggestInstallPathDirectory,
    "{game}",
  );
}
```

**Target pattern after change** — three-branch split:
```typescript
if (statModPath.dev === statUserData.dev) {
  // same device — use userData subdirectory (Linux and Windows)
  suggestion = path.join("{USERDATA}", "{game}", "mods");
} else if (process.platform !== "win32") {
  // Linux, different device — find mountpoint of game drive via stat.dev walk
  let mountpoint = modPaths[""];
  // walk up until stat.dev changes
  while (true) {
    const parent = path.dirname(mountpoint);
    if (parent === mountpoint) break; // reached root
    const parentStat = await fs.statAsync(parent);
    if (parentStat.dev !== statModPath.dev) break;
    mountpoint = parent;
  }
  suggestion = path.join(
    mountpoint,
    state.settings.mods.suggestInstallPathDirectory,
    "{game}",
  );
} else {
  // Windows, different drive
  const volume = winapi.GetVolumePathName(modPaths[""]);
  suggestion = path.join(
    volume,
    state.settings.mods.suggestInstallPathDirectory,
    "{game}",
  );
}
```

**Note on loop vs recursion:** Use a `while` loop (not recursion) for the mountpoint walk — clearer termination condition and avoids any tail-call concerns. This deviates from `idModPath`'s recursion style but is Claude's discretion per CONTEXT.md.

**No new imports needed** — `fs`, `path`, `winapi`, `getVortexPath`, `state.settings.mods.suggestInstallPathDirectory` all already present in the function.

---

### `texts.ts` — ONBRD-02c: Linux path examples

**Analog:** Self — `src/renderer/src/extensions/mod_management/texts.ts`

**Import pattern** (line 1) — unchanged, no new imports:
```typescript
import type { TFunction } from "../../util/i18n";
```

**Ternary-inside-t() pattern** — established by CONTEXT.md D-09; copy the exact shape from RESEARCH.md:

```typescript
// texts.ts lines 85-99 — downloadspath case
case "downloadspath": {
  return t(
    process.platform === "linux"
      ? "The downloads folder holds all mod archives you have downloaded with Vortex. " +
        "It is shared across all games and includes a subfolder for each of them. " +
        "e.g. if your downloads folder is set to\n" +
        '"~/.local/share/Vortex/downloads", archive files for Skyrim will be ' +
        'stored in: "~/.local/share/Vortex/downloads/skyrim".\n' +
        "By default Vortex will select a user data directory that is guaranteed " +
        "to have write access.\n" +
        "When changing the Downloads Folder, the downloads for all your games will " +
        "be moved to the new location automatically. Make sure the new location has " +
        "plenty of available space and that you have permission to write files to it.\n" +
        'You can use "variables" to save yourself some typing:\n' +
        " - {USERDATA} is replaced with your user data directory.\n" +
        "e.g. {USERDATA} is ~/.local/share/Vortex so {USERDATA}/downloads will be: " +
        "~/.local/share/Vortex/downloads"
      : "The downloads folder holds all mod archives..." // UNCHANGED Windows text
  );
}
```

**Anti-pattern to avoid:** Do NOT edit the Windows string byte-for-byte — wrap it as the `else` branch. The Windows arm must be identical to the current source.

**modspath case** — same ternary pattern; Linux arm replaces `d:\vortex_mods\{GAME}` example with `~/.local/share/Vortex/mods/{GAME}`. Windows arm unchanged.

---

### `Settings.tsx` — ONBRD-02c tooltip + ONBRD-02b suggestPath guard

**Analog:** Self — `src/renderer/src/extensions/mod_management/views/Settings.tsx`

**Tooltip — current code** (lines 220-233):
```typescript
{t(
  "Usually, when you first manage a game, the staging folder is initially set to be in " +
    '"c:\\Users\\<username>\\AppData\\Roaming\\Vortex\\<game>" because that\'s ' +
    "guaranteed to exist and have the necessary file permissions set up.\n\n" +
    "If you enable this option, it will instead put the staging folder on the same drive " +
    "as the primary mod folder of each game, in <drive>:\\{{suggestionPattern}}\\<game id>.\n" +
    "This should usually work fine for most users and ensures deployment is possible.",
  {
    replace: {
      suggestionPattern: suggestInstallPathDirectory,
    },
  },
)}
```

**Target pattern — ternary wrapping the entire string argument** (D-09 shape):
```typescript
{t(
  process.platform === "linux"
    ? "Usually, when you first manage a game, the staging folder is initially set to be in " +
      '"~/.local/share/Vortex/<game>" because that\'s ' +
      "guaranteed to exist and have the necessary file permissions set up.\n\n" +
      "If you enable this option, it will instead put the staging folder on the same " +
      "device as the primary mod folder of each game, " +
      "in /{{suggestionPattern}}/<game id>.\n" +
      "This should usually work fine for most users and ensures deployment is possible."
    : "Usually, when you first manage a game, the staging folder is initially set to be in " +
      '"c:\\Users\\<username>\\AppData\\Roaming\\Vortex\\<game>" because that\'s ' +
      "guaranteed to exist and have the necessary file permissions set up.\n\n" +
      "If you enable this option, it will instead put the staging folder on the same drive " +
      "as the primary mod folder of each game, in <drive>:\\{{suggestionPattern}}\\<game id>.\n" +
      "This should usually work fine for most users and ensures deployment is possible.",
  {
    replace: {
      suggestionPattern: suggestInstallPathDirectory,
    },
  },
)}
```

**suggestPath() — current code** (lines 1140-1166) — has its own `winapi.GetVolumePathName` call at line 1156:
```typescript
private suggestPath = async () => {
  const { modPaths, onShowError, suggestInstallPathDirectory } = this.props;
  try {
    const [modPathStats, userDataStats] = await Promise.all([
      fs.statAsync(path.parse(modPaths[""]).root),
      window.api.app
        .getPath("userData")
        .then((userDataPath) => fs.statAsync(userDataPath)),
    ]);

    let suggestion: string;
    if (modPathStats.dev === userDataStats.dev) {
      suggestion = path.join("{USERDATA}", "{game}", "mods");
    } else {
      const volume = winapi.GetVolumePathName(modPaths[""]);  // <-- Linux crash risk
      suggestion = path.join(volume, suggestInstallPathDirectory, "{game}");
    }
    this.changePath(suggestion);
  } catch (err) {
    if (err instanceof UserCanceled) {
      return;
    }
    onShowError("Failed to suggest path", err);
  }
};
```

**Target pattern** — add Linux arm using mountpoint walk (mirrors `discovery.ts` logic):
```typescript
} else if (process.platform !== "win32") {
  // Linux: find mountpoint boundary via stat.dev walk
  let mountpoint = modPaths[""];
  while (true) {
    const parent = path.dirname(mountpoint);
    if (parent === mountpoint) break;
    const parentStat = await fs.statAsync(parent);
    if (parentStat.dev !== modPathStats.dev) break;
    mountpoint = parent;
  }
  suggestion = path.join(mountpoint, suggestInstallPathDirectory, "{game}");
} else {
  const volume = winapi.GetVolumePathName(modPaths[""]);
  suggestion = path.join(volume, suggestInstallPathDirectory, "{game}");
}
```

**Note:** `modPathStats` here is the stat of `path.parse(modPaths['']).root` (volume root), not modPaths itself — the walk must use a fresh `statAsync(modPaths[''])` for the `dev` baseline (or accept that volume root stat.dev equals the mod path stat.dev, which it always does on the same device). Use `modPathStats.dev` as the baseline since it's already computed.

---

### New test files — Wave 0 gaps

These three test files do not exist yet. Copy structure from `todos.test.ts` for the platform-guard + `setPlatform` helper pattern, and from `GameModeManager.test.ts` for `vi.mock("../../util/fs", ...)`.

#### `stagingDirectory.test.ts`

**Closest analog:** `src/renderer/src/extensions/firststeps_dashlet/todos.test.ts`

**Mock header to copy** (adapted):
```typescript
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("winapi-bindings", () => ({
  GetVolumePathName: vi.fn(() => "C:\\"),
  default: { GetVolumePathName: vi.fn(() => "C:\\") },
}));

vi.mock("../../util/fs", () => ({
  statAsync: vi.fn(),
  // add other used fns as needed
}));

vi.mock("shortid", () => ({ generate: vi.fn(() => "test-id") }));
// ... other transitive mocks as required
```

**setPlatform helper** (copy verbatim from `todos.test.ts` lines 60-66):
```typescript
function setPlatform(platform: string) {
  Object.defineProperty(process, "platform", {
    value: platform,
    writable: true,
    configurable: true,
  });
}
```

**Test cases to cover (RESEARCH.md validation map):**
- `partitionExists` is `false` when `statAsync` rejects all the way to root on Linux
- `partitionExists` is `true` when `statAsync` resolves for an ancestor on Linux
- Windows partition check path (winapi) is still taken when platform is `win32`

#### `texts.test.ts`

**Closest analog:** `src/renderer/src/extensions/firststeps_dashlet/todos.test.ts`

**Mock header:**
```typescript
import { describe, expect, it, vi } from "vitest";

// texts.ts only imports TFunction — no heavy mocks needed
import getText from "../texts"; // adjust import path
```

**Test cases:**
- `getText("downloadspath", t)` on Linux returns string containing `~/.local/share/Vortex/downloads`
- `getText("downloadspath", t)` on win32 returns string containing `C:\\Users\\Mike`
- `getText("modspath", t)` on Linux returns string containing `~/.local/share/Vortex/mods`
- `getText("modspath", t)` on win32 returns string containing `d:\\vortex_mods`

#### `discovery.test.ts`

**Closest analog:** `src/renderer/src/extensions/gamemode_management/GameModeManager.test.ts`

**Mock header to copy** (lines 1-54 of GameModeManager.test.ts, adapted for suggestStagingPath):
```typescript
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../util/fs", () => ({
  statAsync: vi.fn(),
  default: {},
}));

vi.mock("winapi-bindings", () => ({
  GetVolumePathName: vi.fn(() => "D:\\"),
  default: { GetVolumePathName: vi.fn(() => "D:\\") },
}));

vi.mock("../../../util/application", () => ({
  getVortexPath: vi.fn((key: string) => key === "userData" ? "/home/user/.local/share/Vortex" : "/tmp"),
}));
```

**Test cases (RESEARCH.md validation map):**
- `suggestStagingPath()` returns `{USERDATA}/{game}/mods` when `statModPath.dev === statUserData.dev` on Linux
- `suggestStagingPath()` returns `{mountpoint}/vortex_mods/{game}` when `stat.dev` differs on Linux
- `suggestStagingPath()` returns `{USERDATA}/{game}/mods` when `stat.dev` is same on win32
- `suggestStagingPath()` returns volume-based path when `stat.dev` differs on win32

---

## Shared Patterns

### Platform Guard
**Source:** `src/renderer/src/extensions/firststeps_dashlet/todos.tsx` lines 22-24 and 101-103 and 171
**Apply to:** All five modified source files

```typescript
// Form 1: condition block (stagingDirectory.ts ONBRD-02b)
if (process.platform === "win32") {
  // ... Windows path unchanged
} else {
  // ... Linux path
}

// Form 2: ternary return (todos.tsx ONBRD-02a)
if (process.platform !== "win32") {
  return true;
}

// Form 3: inline ternary condition (todos.tsx line 171)
condition: (props) =>
  process.platform === "linux" ? true : props.searchPaths !== undefined,

// Form 4: ternary inside t() (texts.ts, Settings.tsx ONBRD-02c)
return t(
  process.platform === "linux"
    ? "Linux string..."
    : "Windows string (unchanged)"
);
```

### statAsync Parent Walk
**Source:** `src/renderer/src/extensions/gamemode_management/util/discovery.ts` lines 841-852 (`idModPath`)
**Apply to:** `stagingDirectory.ts` (ONBRD-02b), `discovery.ts` (ONBRD-02d), `Settings.tsx` (suggestPath fix)

```typescript
// Recursive form (idModPath in discovery.ts lines 841-852) — use for ONBRD-02b:
const idModPath = async (testPath: string) => {
  try {
    statModPath = await fs.statAsync(testPath);
  } catch (err) {
    const code = getErrorCode(err);
    if (code === "ENOENT") {
      await idModPath(path.dirname(testPath));
    } else {
      throw err;
    }
  }
};

// Loop form (preferred for ONBRD-02d mountpoint walk — Claude's discretion):
let mountpoint = startPath;
while (true) {
  const parent = path.dirname(mountpoint);
  if (parent === mountpoint) break; // root reached
  const parentStat = await fs.statAsync(parent);
  if (parentStat.dev !== baselineDev) break;
  mountpoint = parent;
}
```

### Vitest Mock Pattern for winapi + fs
**Source:** `src/renderer/src/extensions/firststeps_dashlet/todos.test.ts` lines 1-11 and `src/renderer/src/extensions/gamemode_management/GameModeManager.test.ts` lines 49-54
**Apply to:** All three new test files

```typescript
// winapi mock (todos.test.ts lines 4-11)
vi.mock("winapi-bindings", () => ({
  GetDiskFreeSpaceEx: vi.fn(() => ({ freeToCaller: 100 * 1024 * 1024 * 1024 })),
  GetVolumePathName: vi.fn(() => "C:"),
  default: {
    GetDiskFreeSpaceEx: vi.fn(() => ({ freeToCaller: 100 * 1024 * 1024 * 1024 })),
    GetVolumePathName: vi.fn(() => "C:"),
  },
}));

// fs mock (GameModeManager.test.ts lines 49-54)
vi.mock("../../util/fs", () => ({
  default: {},
  statAsync: vi.fn(),
  ensureDirWritableAsync: vi.fn(),
}));
```

### setPlatform Helper
**Source:** `src/renderer/src/extensions/firststeps_dashlet/todos.test.ts` lines 41-66
**Apply to:** All three new test files and todos.test.ts (already present)

```typescript
let originalPlatform: PropertyDescriptor;

beforeEach(() => {
  originalPlatform = Object.getOwnPropertyDescriptor(process, "platform")!;
  vi.clearAllMocks();
});

afterEach(() => {
  Object.defineProperty(process, "platform", originalPlatform);
});

function setPlatform(platform: string) {
  Object.defineProperty(process, "platform", {
    value: platform,
    writable: true,
    configurable: true,
  });
}
```

### i18n String Pattern
**Source:** `src/renderer/src/extensions/mod_management/texts.ts` lines 85-99
**Apply to:** `texts.ts` (ONBRD-02c), `Settings.tsx` tooltip (ONBRD-02c)

```typescript
// Rule: ternary is INSIDE t(), not outside. Both arms pass through t().
return t(
  process.platform === "linux"
    ? "Linux-specific text..."
    : "Windows text unchanged byte-for-byte"
);

// When t() has a second argument (replace params), keep it:
{t(
  process.platform === "linux" ? "Linux string {{param}}" : "Windows string {{param}}",
  { replace: { param: value } },
)}
```

---

## No Analog Found

All files have close analogs in the codebase. No entries.

---

## Metadata

**Analog search scope:** `src/renderer/src/extensions/firststeps_dashlet/`, `src/renderer/src/extensions/mod_management/`, `src/renderer/src/extensions/gamemode_management/`, `src/renderer/src/util/`
**Files scanned:** 10 source files read directly
**Pattern extraction date:** 2026-04-16

**Critical constraint reminder:** Windows arms of every platform guard must be byte-for-byte identical to the current source. Only additive Linux arms are added. This keeps the upstream diff minimal per CLAUDE.md and CONTEXT.md.
