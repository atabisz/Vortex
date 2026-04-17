# Phase 18: First-Run Dashboard Foundation - Pattern Map

**Mapped:** 2026-04-16
**Files analyzed:** 9 (4 modified source files + 4 new test files + 1 implicit test infra read)
**Analogs found:** 9 / 9

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `src/renderer/src/extensions/firststeps_dashlet/todos.tsx` | utility/config | request-response | `src/renderer/src/util/elevated.ts` | role-match (platform-guard pattern) |
| `src/renderer/src/extensions/gamemode_management/util/getDriveList.ts` | utility | CRUD | `src/renderer/src/util/elevated.ts` (catch+fallback) | role-match |
| `src/renderer/src/extensions/gamemode_management/views/NoGameDashlet.tsx` | component | request-response | `src/renderer/src/views/AppLayout.test.tsx` (connect pattern) | exact (ComponentEx/connect) |
| `src/renderer/src/util/GameStoreHelper.ts` | service | event-driven | `src/renderer/src/util/GameStoreHelper.ts` (reloadGames method) | self-analog |
| `src/renderer/src/extensions/firststeps_dashlet/todos.test.ts` | test | — | `src/renderer/src/util/chattrCasefold.test.ts` | exact (platform-guard unit test) |
| `src/renderer/src/extensions/gamemode_management/util/getDriveList.test.ts` | test | — | `src/renderer/src/util/chattrCasefold.test.ts` | exact (platform-guard unit test) |
| `src/renderer/src/extensions/gamemode_management/views/NoGameDashlet.test.tsx` | test | — | `src/renderer/src/views/AppLayout.test.tsx` | exact (React component vitest test) |
| `src/renderer/src/util/GameStoreHelper.test.ts` | test | — | `src/renderer/src/util/elevated.test.ts` | exact (async utility vitest test) |

---

## Pattern Assignments

### `src/renderer/src/extensions/firststeps_dashlet/todos.tsx` (utility, request-response)

**Analog:** `src/renderer/src/util/elevated.ts`

**Platform guard — early return pattern** (elevated.ts lines 238–281):
```typescript
// Pattern: check process.platform before any Windows-only call
if (process.platform === "linux") {
  // Linux-specific path
  return resolve(tmpPath);
}
// Windows-only code follows
winapi.ShellExecuteEx({ ... });
```

**Apply to minDiskSpace (D-01) — guard at top of returned closure:**
```typescript
// todos.tsx lines 20-39: minDiskSpace returns a closure; guard must be FIRST in closure
function minDiskSpace(required: number, key: string) {
  return (props) => {
    if (process.platform !== 'win32') {
      return false;
    }
    const checkPath = props[key];
    if (checkPath === undefined) {
      return false;
    }
    // ... existing winapi.GetDiskFreeSpaceEx call ...
  };
}
```

**Apply to value renderers (D-02) — inline branch before winapi call:**
```typescript
// todos.tsx lines 97-104 (download-location value): wrap before winapi.GetVolumePathName
value: (t: TFunction, props: any) => {
  if (process.platform !== 'win32') {
    return props.dlPath ?? t('<No download folder>');
  }
  try {
    return winapi.GetVolumePathName(props.dlPath);
  } catch (err) {
    err["dlPath"] = props.dlPath;
    throw err;
  }
},
// todos.tsx lines 127-135 (mod-location value): same pattern
value: (t: TFunction, props: any) => {
  if (process.platform !== 'win32') {
    return props.instPath ?? t('<No staging folder>');
  }
  try {
    if (props.instPath === undefined) {
      return t("<No staging folder>");
    }
    return winapi.GetVolumePathName(props.instPath);
  } catch (err) {
    return t("<Invalid Drive>");
  }
},
```

**Apply to manual-scan condition (D-05) — replace line 161:**
```typescript
// todos.tsx line 161: current condition
condition: (props) => props.searchPaths !== undefined,
// Replace with:
condition: (props) =>
  process.platform === 'linux' ? true : props.searchPaths !== undefined,
```

---

### `src/renderer/src/extensions/gamemode_management/util/getDriveList.ts` (utility, CRUD)

**Analog:** `src/renderer/src/util/elevated.ts` (platform-branching in catch/fallback)

**Current file structure** (getDriveList.ts lines 1-50 — full file, ~50 lines):

Two separate fallback sites must both be patched (Pitfall 1 in RESEARCH.md):

**Site 1 — module-load fail path (line 22):**
```typescript
// Current:
return Promise.resolve(["C:"]);
// Replace with:
if (process.platform === 'linux') {
  log('debug', 'drivelist module unavailable on Linux, using root fallback', err);
  return Promise.resolve(['/']);
}
api.showErrorNotification(
  "Failed to query list of system drives",
  { message: "...", error: err },
  { allowReport: false },
);
return Promise.resolve(["C:"]);
```

**Site 2 — .catch() path (lines 39-47):**
```typescript
// Current:
.catch((err) => {
  api.showErrorNotification("Failed to determine list of disk drives...", err, { allowReport: false });
  return ["C:"];
});
// Replace with:
.catch((err) => {
  if (process.platform === 'linux') {
    log('debug', 'drivelist failed on Linux, using root fallback', err);
    return ['/'];
  }
  api.showErrorNotification("Failed to determine list of disk drives...", err, { allowReport: false });
  return ["C:"];
});
```

**Log import** — `log` is already imported in sibling files via:
```typescript
import { log } from "../../../util/log";
```
Verify getDriveList.ts imports; add if missing.

---

### `src/renderer/src/extensions/gamemode_management/views/NoGameDashlet.tsx` (component, request-response)

**Analog:** `src/renderer/src/extensions/gamemode_management/views/NoGameDashlet.tsx` (self — existing structure to extend)

**Existing IConnectedProps and mapStateToProps** (NoGameDashlet.tsx lines 1-141):
```typescript
// Current IConnectedProps (line 16-19):
interface IConnectedProps {
  knownGames: IGameStored[];
  discoveredGames: { [id: string]: IDiscoveryResult };
}

// Current mapStateToProps (lines 127-132):
function mapStateToProps(state: IState): IConnectedProps {
  return {
    knownGames: state.session.gameMode.known,
    discoveredGames: state.settings.gameMode.discovered,
  };
}
```

**Add discoveryRunning (D-10) — extend both:**
```typescript
interface IConnectedProps {
  knownGames: IGameStored[];
  discoveredGames: { [id: string]: IDiscoveryResult };
  discoveryRunning: boolean;                          // ADD
}

function mapStateToProps(state: IState): IConnectedProps {
  return {
    knownGames: state.session.gameMode.known,
    discoveredGames: state.settings.gameMode.discovered,
    discoveryRunning: state.session.discovery.running, // ADD
  };
}
```

**IDiscoveryState import** — already imported at line 2:
```typescript
import { IDiscoveryState } from "../../../types/IState";
```

**render() props destructuring** (line 46 — add discoveryRunning):
```typescript
const { t, discoveredGames, knownGames, discoveryRunning } = this.props;
```

**Linux empty-state block (D-07/D-08) — insert after games filter, before return:**
```typescript
// After: const games: IGameStored[] = knownGames.filter(...)
const linuxEmptyState =
  process.platform === 'linux' &&
  games.length === 0 &&
  !discoveryRunning ? (
    <div className="no-game-linux-empty-state">
      <h4 className="empty-state-heading">{t('No Steam games detected')}</h4>
      <p className="empty-state-body">
        {t('Make sure Steam has finished loading, then click Refresh.')}
      </p>
      <Button bsStyle="primary" onClick={this.onRefresh}>
        {t('Refresh')}
      </Button>
    </div>
  ) : null;
```

**onRefresh handler** — matches existing event-emit pattern (see openGames at line 88-90):
```typescript
private onRefresh = () => {
  this.context.api.events.emit('start-discovery');
};
```

**Button import** — follow react-bootstrap usage already in sibling components:
```typescript
import { Button } from "react-bootstrap";
```

---

### `src/renderer/src/util/GameStoreHelper.ts` (service, event-driven)

**Analog:** Self — existing `reloadGames()` method (lines 348-377) and `Bluebird` already imported (line 1)

**reloadGames() existing signature** (lines 348-377):
```typescript
public reloadGames(api?: IExtensionApi): Bluebird<void> {
  if (!!api && !this.mApi) {
    this.mApi = api;
  }
  // ... iterates stores and calls store.reloadGames() on each
  return Bluebird.each(stores, (store: IGameStore) => ...).then(() => {
    this.mApi?.dismissNotification?.("gamestore-reload");
    return Bluebird.resolve();
  });
}
```

**One-shot retry pattern (D-09)** — place at the discovery trigger call site. From RESEARCH.md the hook point is after initial `allGames()` returns empty. The pattern from elevated.ts + GameStoreHelper's own Bluebird usage:
```typescript
// After initial discovery returns empty on Linux (at the call site in GameStoreHelper):
if (process.platform === 'linux') {
  Bluebird.delay(2000).then(() => {
    log('debug', 'Steam detection retry after initial empty result');
    return instance.reloadGames(api);
  });
}
```

**Critical:** `Bluebird.delay()` is already in scope (line 1: `import Bluebird from "bluebird"`). `log` is already imported (line 15: `import { log } from "./log"`).

---

## Test File Patterns

### `src/renderer/src/extensions/firststeps_dashlet/todos.test.ts` (new test)

**Analog:** `src/renderer/src/util/chattrCasefold.test.ts`

**File header — vi.mock hoisting + platform override pattern** (chattrCasefold.test.ts lines 1-73):
```typescript
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock winapi-bindings BEFORE importing todos.tsx
vi.mock("winapi-bindings", () => ({
  GetDiskFreeSpaceEx: vi.fn(),
  GetVolumePathName: vi.fn(),
  default: { GetDiskFreeSpaceEx: vi.fn(), GetVolumePathName: vi.fn() },
}));

import * as winapi from "winapi-bindings";
// import todos from "./todos";

describe("todos platform guards", () => {
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

  it("minDiskSpace returns false on linux without calling winapi", () => {
    setPlatform("linux");
    // ...
    expect(vi.mocked(winapi.GetDiskFreeSpaceEx)).not.toHaveBeenCalled();
  });
});
```

---

### `src/renderer/src/extensions/gamemode_management/util/getDriveList.test.ts` (new test)

**Analog:** `src/renderer/src/util/chattrCasefold.test.ts`

**Mock pattern for CJS require()** — use vi.mock to stub drivelist:
```typescript
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("drivelist", () => ({
  list: vi.fn(),
}));

// Mock api object:
const mockApi = {
  showErrorNotification: vi.fn(),
};

// Platform override helper (same as chattrCasefold pattern):
function setPlatform(platform: string) {
  Object.defineProperty(process, "platform", {
    value: platform, writable: true, configurable: true,
  });
}
```

---

### `src/renderer/src/extensions/gamemode_management/views/NoGameDashlet.test.tsx` (new test)

**Analog:** `src/renderer/src/views/AppLayout.test.tsx`

**React component test header** (AppLayout.test.tsx lines 1-119):
```typescript
import type * as ReactTypes from "react";
import { vi, it, expect, describe, beforeEach, afterEach } from "vitest";

// Mock ComponentEx / connect / translate (heavy dependencies)
vi.mock("../../../controls/ComponentEx", async () => {
  const React = await vi.importActual<typeof ReactTypes>("react");
  return {
    ComponentEx: class extends React.Component {},
    connect: () => (component: unknown) => component,
    translate: () => (component: unknown) => component,
  };
});

vi.mock("react-i18next", () => ({
  withTranslation: () => (component: unknown) => component,
  translate: () => (component: unknown) => component,
  useTranslation: () => ({ t: (key: string) => key }),
}));

import { render } from "@testing-library/react";
import React from "react";
// import Dashlet from "./NoGameDashlet";

// Platform override helper:
function setPlatform(platform: string) {
  Object.defineProperty(process, "platform", {
    value: platform, writable: true, configurable: true,
  });
}
```

**Test environment:** `happy-dom` (set in `src/renderer/vitest.config.mts` line 9 — no per-file config needed).

---

### `src/renderer/src/util/GameStoreHelper.test.ts` (new test)

**Analog:** `src/renderer/src/util/elevated.test.ts`

**Async utility test with vi.mock and Bluebird** (elevated.test.ts lines 1-35):
```typescript
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("winapi-bindings", () => ({
  GetProcessList: vi.fn(() => []),
  default: { GetProcessList: vi.fn(() => []) },
}));

vi.mock("bluebird", async (importOriginal) => {
  const actual = await importOriginal<typeof import("bluebird")>();
  return {
    ...actual,
    delay: vi.fn().mockResolvedValue(undefined),
  };
});

import Bluebird from "bluebird";

// Fake reloadGames:
const mockReloadGames = vi.fn().mockResolvedValue(undefined);
```

---

## Shared Patterns

### Platform Guard (process.platform check)
**Source:** `src/renderer/src/util/elevated.ts` lines 238–281
**Apply to:** todos.tsx (minDiskSpace, value renderers), getDriveList.ts (both fallback sites), NoGameDashlet.tsx (empty-state condition), GameStoreHelper.ts (retry trigger)
```typescript
if (process.platform === 'linux') {
  // Linux code path
}
// or:
if (process.platform !== 'win32') {
  return safeValue;
}
```

### Silent Fallback with Debug Log
**Source:** `src/renderer/src/util/elevated.ts` + chattrCasefold pattern (fs.ts)
**Apply to:** getDriveList.ts catch blocks (both sites)
```typescript
// In catch block, no user notification, debug log only:
log('debug', 'descriptive context message', err);
return safeValue;
```

### Injectable Test Seam (_setX)
**Source:** `src/renderer/src/util/elevated.ts` lines 16–21 (_setSpawner) and `src/renderer/src/util/fs.ts` lines 72–77 (_setChattr)
**Apply to:** GameStoreHelper.ts retry if testability requires — export `_setRetryDelay(fn)` for test injection. However, since `Bluebird.delay` can be mocked with `vi.mock`, this may not be needed. The planner should assess complexity.
```typescript
// Pattern: module-level mutable with underscore-prefixed setter
let _delayFn: (ms: number) => Bluebird<void> = (ms) => Bluebird.delay(ms);
/** @internal Override delay function for testing. */
export function _setDelayFn(fn: typeof _delayFn): void { _delayFn = fn; }
```

### Vitest Platform Override in Tests
**Source:** `src/renderer/src/util/chattrCasefold.test.ts` lines 44–73
**Apply to:** todos.test.ts, getDriveList.test.ts, NoGameDashlet.test.tsx, GameStoreHelper.test.ts
```typescript
let originalPlatform: PropertyDescriptor;
beforeEach(() => {
  originalPlatform = Object.getOwnPropertyDescriptor(process, "platform")!;
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

### ComponentEx / Redux Connect Pattern
**Source:** `src/renderer/src/extensions/gamemode_management/views/NoGameDashlet.tsx` lines 1-141
**Apply to:** NoGameDashlet.tsx modifications
```typescript
// Props interface split:
export interface IBaseProps {}
interface IConnectedProps { /* Redux state fields */ }
interface IActionProps {}
type IProps = IBaseProps & IConnectedProps & IActionProps;

// Wire at bottom of file:
export default translate(["common"])(
  connect(mapStateToProps, mapDispatchToProps)(Dashlet),
) as React.ComponentClass<{}>;
```

### Bluebird One-Shot Delay
**Source:** `src/renderer/src/util/GameStoreHelper.ts` line 1 + `src/renderer/src/extensions/gamemode_management/views/NoGameDashlet.tsx` line 11
**Apply to:** GameStoreHelper.ts retry (D-09)
```typescript
import Bluebird from "bluebird";
// ...
Bluebird.delay(2000).then(() => instance.reloadGames(api));
```

### winapi-bindings Mock in Tests
**Source:** `src/renderer/src/util/elevated.test.ts` lines 17-20
**Apply to:** todos.test.ts
```typescript
vi.mock("winapi-bindings", () => ({
  default: { GetDiskFreeSpaceEx: vi.fn(), GetVolumePathName: vi.fn(), ShellExecuteEx: vi.fn() },
  GetDiskFreeSpaceEx: vi.fn(),
  GetVolumePathName: vi.fn(),
  ShellExecuteEx: vi.fn(),
}));
```

---

## No Analog Found

All files have analogs. No entries in this section.

---

## Metadata

**Analog search scope:** `src/renderer/src/` — extensions, util, views, controls
**Files scanned:** todos.tsx, getDriveList.ts, NoGameDashlet.tsx, GameStoreHelper.ts (reloadGames section), elevated.ts, fs.ts, chattrCasefold.test.ts, elevated.test.ts, AppLayout.test.tsx, reducers.test.ts, ProcessMonitor.test.ts, vitest.config.mts, test-setup.ts
**Pattern extraction date:** 2026-04-16
