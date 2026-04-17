# Phase 21: Mod Install Round-Trip Validation - Pattern Map

**Mapped:** 2026-04-17
**Files analyzed:** 4 (1 modified source, 1 new test, 2 documentation updates)
**Analogs found:** 4 / 4

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/renderer/src/extensions/hardlink_activator/index.ts` | service / deployment activator | request-response (isSupported sync check) | `src/renderer/src/extensions/symlink_activator/index.ts` | exact — same base class, same isSupported contract, same getErrorCode pattern |
| `src/renderer/src/extensions/hardlink_activator/hardlink_activator.test.ts` | test | unit | `src/renderer/src/extensions/mod_management/stagingDirectory.test.ts` | exact — same vi.mock pattern for winapi-bindings + fs + @vortex/shared; same platform override helper |
| `.planning/REQUIREMENTS.md` | planning doc | — | `.planning/REQUIREMENTS.md` (existing ONBRD-03a–03d entries) | exact — same checkbox format |
| `.planning/ROADMAP.md` | planning doc | — | `.planning/ROADMAP.md` (Phase 999.1 backlog block) | exact — same backlog entry format |

---

## Pattern Assignments

### `src/renderer/src/extensions/hardlink_activator/index.ts` (service, request-response)

**Analog:** `src/renderer/src/extensions/symlink_activator/index.ts`

**Imports pattern** (lines 1–33, hardlink_activator/index.ts):
```typescript
import { getErrorCode, getErrorMessageOrDefault, unknownToError } from "@vortex/shared";
import * as util from "util";
import * as winapi from "winapi-bindings";
// ... other imports
import { log } from "../../logging";
import * as fs from "../../util/fs";
import { installPathForGame } from "../../util/selectors";
```

Key: `getErrorCode` is already imported from `@vortex/shared` at line 4 — **no new import needed** for the fix. The `getErrorCode(err)` call at line 218 (in the canary block) shows the established pattern for checking error codes.

**isSupported contract** (lines 100–104, hardlink_activator/index.ts):
```typescript
public isSupported(
  state: IState,
  gameId: string,
  typeId: string,
): IUnavailableReason {
```
Return type `IUnavailableReason`: `undefined` means supported; any object means unsupported. The caller (`allTypesSupported`) treats `undefined` as "no problem" — this is the key invariant for the fix.

**Existing catch block to modify** (lines 188–199, hardlink_activator/index.ts):
```typescript
} catch (err) {
  // this can happen when managing the the game for the first time
  log("info", "failed to stat. directory missing?", {
    dir1: installationPath || "undefined",
    dir2: modPaths[typeId],
    err: util.inspect(err),
  });
  return {
    description: (t) =>
      t("Game not fully initialized yet, this should disappear soon."),
  };
}
```
This is the **exact block to modify**. The fix adds an ENOENT-specific branch before the log+return.

**Fixed pattern** (using established `getErrorCode` pattern from same file):
```typescript
} catch (err) {
  if (getErrorCode(err) === "ENOENT") {
    // Staging directory doesn't exist yet (first-run or just removed).
    // Can't compare devices — assume supported; canary test will confirm
    // once the directory is created by ensureStagingDirectory().
    return undefined;
  }
  // this can happen when managing the the game for the first time
  log("info", "failed to stat. directory missing?", {
    dir1: installationPath || "undefined",
    dir2: modPaths[typeId],
    err: util.inspect(err),
  });
  return {
    description: (t) =>
      t("Game not fully initialized yet, this should disappear soon."),
  };
}
```

**getErrorCode usage pattern** (line 218–220, hardlink_activator/index.ts — existing canary block):
```typescript
const code = getErrorCode(err);
if (code !== "EMFILE") {
  res = { description: (t) => t("Filesystem doesn't support hard links.") };
}
```
This is the direct pattern to copy: call `getErrorCode(err)`, compare to a string literal.

**IUnavailableReason return pattern** — `undefined` for supported (lines 116–118):
```typescript
if (modPaths[typeId] === undefined) {
  return undefined;
}
```

**IUnavailableReason return pattern** — object with `description` for unsupported (lines 128–130):
```typescript
return {
  description: (t) => t("Can't write to output directory."),
  order: 3,
  solution: (t) => t("..."),
};
```

**Platform guard pattern** — from symlink_activator/index.ts lines 301–306 (closest isUnsupportedGame usage):
```typescript
private isUnsupportedGame(gameId: string): boolean {
  const unsupportedGames =
    process.platform === "win32"
      ? ["nomanssky", "stateofdecay", "factorio"]
      : ["nomanssky", "stateofdecay"];
  return unsupportedGames.indexOf(gameId) !== -1;
}
```
Also from hardlink_activator enrichLinuxEntries (lines 40–41):
```typescript
async function enrichLinuxEntries(entries: IEntry[]): Promise<void> {
  if (process.platform !== "linux") return;
```
Note: Per RESEARCH.md open question 1, the ENOENT fix is cross-platform logic (not Linux-specific), so **no `process.platform` guard is needed** — the fix is unconditional on ENOENT.

---

### `src/renderer/src/extensions/hardlink_activator/hardlink_activator.test.ts` (test, unit)

**Analog:** `src/renderer/src/extensions/mod_management/stagingDirectory.test.ts`

This is a **new file** (Wave 0 red-test stubs). The stagingDirectory test is the closest analog: same tech stack (Vitest), same module under test (a deployment extension), same mocking requirements (winapi-bindings, fs, @vortex/shared, selectors).

**File header / vi.mock pattern** (lines 1–9, stagingDirectory.test.ts):
```typescript
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// vi.mock is hoisted — must appear before imports
vi.mock("winapi-bindings", () => ({
  GetVolumePathName: vi.fn(() => "C:\\"),
  default: {
    GetVolumePathName: vi.fn(() => "C:\\"),
  },
}));
```
For hardlink_activator tests, `winapi-bindings` mock is needed because `winapi.GetVolumePathName` is called inside the "different device" solution callback (line 160 of index.ts). The mock prevents import failures on Linux.

**@vortex/shared mock pattern** (lines 24–29, stagingDirectory.test.ts):
```typescript
vi.mock("@vortex/shared", () => ({
  isErrorWithSystemCode: vi.fn(() => true),
  unknownToError: vi.fn((e: unknown) => e as Error),
  getErrorCode: vi.fn(() => "ENOENT"),
  getErrorMessageOrDefault: vi.fn((e: unknown) => String(e)),
}));
```
For hardlink_activator tests, `getErrorCode` must be controllable per test (to simulate ENOENT vs. other errors). Override the return value per test using `vi.mocked(getErrorCode).mockReturnValueOnce(...)`.

**fs mock pattern** (lines 11–17, stagingDirectory.test.ts):
```typescript
vi.mock("../../util/fs", () => ({
  statAsync: vi.fn(),
  readFileAsync: vi.fn(),
  writeFileAsync: vi.fn(),
  ensureDirWritableAsync: vi.fn(),
  default: {},
}));
```
For hardlink_activator tests, the fs mock needs `statSync`, `accessSync`, `writeFileSync`, `linkSync`, `removeSync`, and `constants`:
```typescript
vi.mock("../../util/fs", () => ({
  statSync: vi.fn(),
  accessSync: vi.fn(),
  writeFileSync: vi.fn(),
  linkSync: vi.fn(),
  removeSync: vi.fn(),
  constants: { W_OK: 2 },
  default: {},
}));
```

**selectors mock pattern** (lines 35–38, stagingDirectory.test.ts):
```typescript
vi.mock("../../util/selectors", () => ({
  activeGameId: vi.fn(() => "skyrim"),
  installPathForGame: vi.fn(() => "/home/user/.local/share/Vortex/skyrim/mods"),
}));
```
For hardlink_activator, use `skyrimse` as gameId and the Linux staging path:
```typescript
vi.mock("../../util/selectors", () => ({
  installPathForGame: vi.fn(() => "/home/user/.local/share/Vortex/skyrimse/mods"),
}));
```

**Platform override helper** (lines 72–89, stagingDirectory.test.ts):
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
Copy this pattern verbatim into hardlink_activator.test.ts.

**Mock imports after vi.mock declarations** (lines 66–68, stagingDirectory.test.ts):
```typescript
// Import after mocks are declared
import * as fsUtil from "../../util/fs";
import * as stagingDirectory from "./stagingDirectory";
```
For hardlink_activator.test.ts:
```typescript
// Import after mocks are declared
import { getErrorCode } from "@vortex/shared";
import * as fsModule from "../../util/fs";
// Import the DeploymentMethod class — not exported by default; test via init context
```

**Additional mock requirements** — hardlink_activator imports more than stagingDirectory:
```typescript
vi.mock("bluebird", () => ({
  default: { delay: vi.fn(() => Promise.resolve()), resolve: vi.fn(() => Promise.resolve()) },
}));

vi.mock("turbowalk", () => ({ default: vi.fn(() => Promise.resolve()) }));

vi.mock("../gamemode_management/util/getGame", () => ({
  getGame: vi.fn(() => ({
    getModPaths: vi.fn(() => ({ "": "/home/user/.steam/skyrimse/Data" })),
  })),
}));

vi.mock("../../actions/session", () => ({
  setSettingsPage: vi.fn(() => ({ type: "SET_SETTINGS_PAGE" })),
}));

vi.mock("../mod_management/LinkingDeployment", () => ({
  default: class {
    constructor(...args: any[]) {}
    ensureDir = vi.fn(() => Promise.resolve());
  },
}));
```

**Test structure for ONBRD-04 behavioral contracts** (three required assertions per RESEARCH.md):
```typescript
describe("hardlink_activator isSupported", () => {
  // (a) ENOENT in staging dir → returns undefined (supported)
  it("returns undefined when installationPath statSync throws ENOENT", () => { ... });

  // (b) skyrimse in symlink Gamebryo blocklist → symlink returns IUnavailableReason
  // (lives in this file as a cross-activator check, or in a separate symlink test)
  it("symlink_activator returns IUnavailableReason for skyrimse", () => { ... });

  // (c) non-ENOENT stat error → returns "not initialized" reason
  it("returns not-initialized reason for non-ENOENT stat errors", () => { ... });
});
```

---

### `.planning/REQUIREMENTS.md` (planning doc)

**Analog:** Existing ONBRD-03a–03d entries (lines 25–28)

**Checkbox format to copy:**
```markdown
- [x] **ONBRD-03a**: `fs.ts` `raiseUACDialog` shows pkexec-specific message on Linux (platform-guarded alongside unchanged Windows UAC text)
```

**ONBRD-04 target update** (line 32):
```markdown
- [ ] **ONBRD-04**: User can install a mod, deploy it, and enable it for one Proton game — end-to-end, no config file edits required (human UAT; gates on ONBRD-01 + ONBRD-02)
```
Changes to:
```markdown
- [x] **ONBRD-04**: User can install a mod, deploy it, and enable it for one Proton game
  — end-to-end, no config file edits required — code-complete (Phase 21);
  hardware UAT pending (Phase 999.1)
```

**Traceability table update** (line 80):
```markdown
| ONBRD-04 | Phase 21 | Pending |
```
Changes to:
```markdown
| ONBRD-04 | Phase 21 | Complete |
```

---

### `.planning/ROADMAP.md` (planning doc — 999.1 backlog entry)

**Analog:** Phase 999.1 block (lines 156–161)

**Existing 999.1 block structure:**
```markdown
### Phase 999.1: Manual UAT — ELEV-05/ELEV-06 Desktop Linux + Steam Deck Elevation (BACKLOG)

**Goal:** Manually validate Phase 12 elevation UX on real hardware — ...
**Context:** ...
**Requirements:** ELEV-05, ELEV-06
**Plans:** 2/2 plans complete
```

**Pattern for appending ONBRD-04** — add to the `Requirements:` line and append a UAT checklist entry after the existing content:
```markdown
**Requirements:** ELEV-05, ELEV-06, ONBRD-04

ONBRD-04: Install a mod, deploy via hardlink_activator, enable for Skyrim SE on
Proton — end-to-end, no terminal required — code-complete (Phase 21); hardware UAT pending
```

---

## Shared Patterns

### getErrorCode Usage (cross-cutting)
**Source:** `src/renderer/src/extensions/hardlink_activator/index.ts` lines 4–7 and 218–220
**Apply to:** The fix in hardlink_activator/index.ts catch block
```typescript
import { getErrorCode } from "@vortex/shared";
// ...
const code = getErrorCode(err);
if (code !== "EMFILE") { ... }
```
`getErrorCode` is already imported — no new import required. Pattern: call it, compare with `===` to string literal.

### IUnavailableReason Contract
**Source:** `src/renderer/src/extensions/hardlink_activator/index.ts` lines 100–104
**Apply to:** Any `isSupported` modification in activator files
- `undefined` = supported (no reason to be unavailable)
- `{ description: (t) => t("...") }` = unsupported with reason
- Optional fields: `order`, `solution`, `fixCallback`

### vi.mock Hoisting (test files)
**Source:** `src/renderer/src/extensions/mod_management/stagingDirectory.test.ts` lines 3–9
**Apply to:** `hardlink_activator.test.ts`
```typescript
// vi.mock is hoisted — must appear before imports
vi.mock("winapi-bindings", () => ({ ... }));
// ALL vi.mock calls must come before any import statements
```

### Platform Override in Tests
**Source:** `src/renderer/src/extensions/mod_management/stagingDirectory.test.ts` lines 72–89
**Apply to:** `hardlink_activator.test.ts` (for any platform-conditional test branches)
```typescript
function setPlatform(platform: string) {
  Object.defineProperty(process, "platform", {
    value: platform,
    writable: true,
    configurable: true,
  });
}
```

### ROADMAP Phase Entry Format
**Source:** `.planning/ROADMAP.md` lines 124–132 (Phase 21 entry)
**Apply to:** Phase 21 Plans field update after planning
```markdown
### Phase 21: Mod Install Round-Trip Validation
**Goal**: ...
**Requirements**: ONBRD-04
**Plans**: N plans
Plans:
- [ ] 21-00-PLAN.md — [description]
- [ ] 21-01-PLAN.md — [description]
```

---

## No Analog Found

All files in Phase 21 have close analogs in the codebase. No files require falling back to RESEARCH.md patterns exclusively.

| File | Role | Data Flow | Notes |
|------|------|-----------|-------|
| (none) | — | — | All analogs found |

---

## Metadata

**Analog search scope:** `src/renderer/src/extensions/hardlink_activator/`, `src/renderer/src/extensions/symlink_activator/`, `src/renderer/src/extensions/mod_management/`, `.planning/`
**Files scanned:** 10 source files, 2 planning docs
**Pattern extraction date:** 2026-04-17
