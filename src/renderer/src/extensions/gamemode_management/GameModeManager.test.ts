<<<<<<< HEAD
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Use vi.hoisted so these are available inside vi.mock factory functions
const { mockReloadGames, mockQuickDiscovery, mockQuickDiscoveryTools, mockGetNormalizeFunc } =
  vi.hoisted(() => {
    const Bluebird = require("bluebird") as typeof import("bluebird");
    return {
      mockReloadGames: vi.fn().mockReturnValue(Bluebird.resolve()),
      mockQuickDiscovery: vi.fn().mockReturnValue(Bluebird.resolve(undefined)),
      mockQuickDiscoveryTools: vi.fn().mockReturnValue(Bluebird.resolve()),
      mockGetNormalizeFunc: vi.fn().mockReturnValue(Bluebird.resolve((value: string) => value)),
    };
  });

// Mock GameStoreHelper
vi.mock("../../util/GameStoreHelper", () => ({
  default: { reloadGames: mockReloadGames },
}));

// Mock quickDiscovery
vi.mock("./util/discovery", () => ({
  quickDiscovery: mockQuickDiscovery,
  quickDiscoveryTools: mockQuickDiscoveryTools,
  searchDiscovery: vi.fn(),
  discoverRelativeTools: vi.fn(),
  assertToolDir: vi.fn(),
}));

// Mock getGame/getGameStores
vi.mock("./util/getGame", () => ({
  getGame: vi.fn(() => undefined),
  getGameStores: vi.fn(() => []),
}));

// Mock log
vi.mock("../../util/log", () => ({
  log: vi.fn(),
}));

// Mock Steam and EpicGamesLauncher
vi.mock("../../util/Steam", () => ({
  default: null,
}));
vi.mock("../../util/EpicGamesLauncher", () => ({
  default: null,
}));

// Mock fs
vi.mock("../../util/fs", () => ({
  default: {},
  statAsync: vi.fn(),
  ensureDirWritableAsync: vi.fn(),
}));

// Mock getNormalizeFunc
vi.mock("../../util/api", () => ({
  getNormalizeFunc: mockGetNormalizeFunc,
}));

// Mock selectors
vi.mock("../../util/selectors", () => ({
  activeProfile: vi.fn(() => undefined),
  discoveryByGame: vi.fn(() => ({})),
}));

// Mock util
vi.mock("../../util/util", () => ({
  batchDispatch: vi.fn(),
  truthy: vi.fn((v: unknown) => !!v),
}));

// Mock actions
vi.mock("../../actions", () => ({
  setNextProfile: vi.fn(() => ({ type: "SET_NEXT_PROFILE" })),
}));

vi.mock("../../actions/notifications", () => ({
  addNotification: vi.fn(() => ({ type: "ADD_NOTIFICATION" })),
  showDialog: vi.fn(() => ({ type: "SHOW_DIALOG" })),
}));

vi.mock("./actions/discovery", () => ({
  discoveryFinished: vi.fn(() => ({ type: "DISCOVERY_FINISHED" })),
  discoveryProgress: vi.fn(() => ({ type: "DISCOVERY_PROGRESS" })),
  setPhaseCount: vi.fn(() => ({ type: "SET_PHASE_COUNT" })),
}));

vi.mock("./actions/session", () => ({
  clearGameDisabled: vi.fn(() => ({ type: "CLEAR_GAME_DISABLED" })),
  setGameDisabled: vi.fn(() => ({ type: "SET_GAME_DISABLED" })),
  setKnownGames: vi.fn(() => ({ type: "SET_KNOWN_GAMES" })),
}));

vi.mock("./actions/settings", () => ({
  addDiscoveredGame: vi.fn(() => ({ type: "ADD_DISCOVERED_GAME" })),
  addDiscoveredTool: vi.fn(() => ({ type: "ADD_DISCOVERED_TOOL" })),
  clearDiscoveredGame: vi.fn(() => ({ type: "CLEAR_DISCOVERED_GAME" })),
}));

vi.mock("../starter_dashlet/actions", () => ({
  setPrimaryTool: vi.fn(() => ({ type: "SET_PRIMARY_TOOL" })),
}));

import Bluebird from "bluebird";

import GameModeManager from "./GameModeManager";

function setPlatform(platform: string) {
  Object.defineProperty(process, "platform", {
    value: platform,
    writable: true,
    configurable: true,
  });
}

function makeStore(discoveredGames: Record<string, any> = {}) {
  return {
    getState: vi.fn(() => ({
      settings: {
        gameMode: { discovered: discoveredGames },
      },
      session: {
        discovery: { running: false },
      },
    })),
    dispatch: vi.fn(),
  } as any;
}

function makeManager(store: any) {
  const manager = new GameModeManager(
    {} as any, // api
    [], // extensionGames
    [], // gameStubs
    [], // gameStoreExtensions
    vi.fn(), // onGameModeActivated
  );
  manager.attachToStore(store);
  // reloadStoreGames walks the known stores itself since upstream 2.8, so count its calls
  reloadSpy = vi.spyOn(manager as any, "reloadStoreGames").mockResolvedValue(undefined);
  return manager;
}

let reloadSpy: ReturnType<typeof vi.spyOn>;

describe("GameModeManager.startQuickDiscovery", () => {
  let originalPlatform: PropertyDescriptor;

  beforeEach(() => {
    originalPlatform = Object.getOwnPropertyDescriptor(process, "platform")!;
    vi.clearAllMocks();
    mockReloadGames.mockReturnValue(Bluebird.resolve());
    mockQuickDiscovery.mockReturnValue(Bluebird.resolve(undefined));
  });

  afterEach(() => {
    Object.defineProperty(process, "platform", originalPlatform);
    vi.useRealTimers();
  });

  it("calls reloadStoreGames with delay on linux when discovery returns 0 games", async () => {
    setPlatform("linux");
    vi.useFakeTimers();

    // Store returns no discovered games (empty)
    const store = makeStore({});
    const manager = makeManager(store);

    // Run startQuickDiscovery — fire-and-forget retry will be triggered by timer
    const result = manager.startQuickDiscovery();

    // Await the initial discovery to complete
    await result;

    // Advance fake timers to trigger the 2000ms delay
    vi.advanceTimersByTime(3000);

    // Flush Bluebird promise microtasks
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    // reloadGames should have been called at least twice:
    // once in the initial flow, once in the retry after delay
    expect(reloadSpy.mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  it("does NOT retry on win32 when discovery returns 0 games", async () => {
    setPlatform("win32");
    vi.useFakeTimers();

    const store = makeStore({});
    const manager = makeManager(store);

    await manager.startQuickDiscovery();
    vi.advanceTimersByTime(3000);
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    // reloadGames should only be called once (no retry on Windows)
    expect(reloadSpy.mock.calls.length).toBe(1);
  });

  it("does NOT retry when games are found on linux", async () => {
    setPlatform("linux");
    vi.useFakeTimers();

    // Store returns a discovered game with a path
    const store = makeStore({
      skyrimse: { path: "/home/user/.steam/steamapps/common/Skyrim SE" },
    });
    const manager = makeManager(store);

    await manager.startQuickDiscovery();
    vi.advanceTimersByTime(3000);
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    // reloadGames should only be called once (game found, no retry needed)
    expect(reloadSpy.mock.calls.length).toBe(1);
=======
import { GameDomain, GameId, VortexGameId } from "@vortex/shared";
import { describe, it, expect, vi } from "vitest";

import type { IGame } from "@/types/IGame";

import { setKnownGames } from "./actions/session";
import { GameModeManager } from "./GameModeManager";
import { makeTierZeroGame } from "./tiered/tierZero";
import type { IGameStored } from "./types/IGameStored";

// util/Steam reads paths at import time and there is no ApplicationData here
vi.mock("../../util/getVortexPath", () => ({ default: vi.fn(() => "/tmp") }));

function makeKnownGame(id: string, overrides: Partial<IGame> = {}): IGame {
  return {
    id,
    name: `Game ${id}`,
    queryModPath: () => ".",
    executable: () => "game.exe",
    requiredFiles: [],
    ...overrides,
  } satisfies IGame;
}

function makeTierZeroEntry(domain: string) {
  return {
    gameId: GameId(1234),
    domain: GameDomain(domain),
    name: "Some Game",
    storeIDs: { steam: [], gog: [], epic: [] },
  };
}

function makeManager(extensionGames: IGame[]): { manager: GameModeManager; dispatched: any[] } {
  const dispatched: any[] = [];
  const manager = new GameModeManager({} as any, extensionGames, [], () => undefined);
  manager.attachToStore({ dispatch: (action: any) => dispatched.push(action) } as any);
  return { manager, dispatched };
}

function dispatchedKnownGames(dispatched: any[]): IGameStored[] {
  const actions = dispatched.filter((action) => action.type === setKnownGames.getType());
  return actions[actions.length - 1]?.payload ?? [];
}

describe("GameModeManager addGames", () => {
  it("makes the game visible in the registry and the manager snapshot", () => {
    const registry: IGame[] = [makeKnownGame("existing")];
    const { manager } = makeManager(registry);

    const game = makeKnownGame("added");
    manager.addGames([game]);

    expect(manager.games.some((iter) => iter.id === "added")).toBe(true);
    expect(registry.some((iter) => iter.id === "added")).toBe(true);
  });

  it("re-dispatches the known games including the added one", () => {
    const { manager, dispatched } = makeManager([makeKnownGame("existing")]);

    const game = makeTierZeroGame(makeTierZeroEntry("somegame"));
    manager.addGames([game]);

    const known = dispatchedKnownGames(dispatched);
    expect(known.map((iter) => iter.id)).toEqual(["existing", "somegame"]);
    // the synthesized game passes the validity shape check despite the
    // empty placeholder executable
    expect(known[1].executable).toBe("");
  });

  it("ignores games whose id is already known", () => {
    const registry: IGame[] = [makeKnownGame("existing")];
    const { manager, dispatched } = makeManager(registry);

    manager.addGames([makeKnownGame("existing", { name: "Different Object" })]);

    expect(manager.games).toHaveLength(1);
    expect(manager.games[0].name).not.toBe("Different Object");
    expect(dispatched).toHaveLength(1); // only the attachToStore dispatch
  });

  it("does not dispatch when nothing was added", () => {
    const { manager, dispatched } = makeManager([]);

    manager.addGames([]);

    expect(dispatched).toHaveLength(1);
  });

  it("works before the store is attached without dispatching", () => {
    const manager = new GameModeManager({} as any, [], [], () => undefined);
    expect(() => manager.addGames([makeKnownGame("added")])).not.toThrow();
    expect(manager.games).toHaveLength(1);
  });
});

describe("GameModeManager removeGames", () => {
  it("removes the game from the registry and the manager snapshot", () => {
    const game = makeKnownGame("removable");
    const registry: IGame[] = [makeKnownGame("existing"), game];
    const { manager } = makeManager(registry);

    manager.removeGames([VortexGameId("removable")]);

    expect(manager.games.some((iter) => iter.id === "removable")).toBe(false);
    expect(registry.some((iter) => iter.id === "removable")).toBe(false);
  });

  it("re-dispatches the known games without the removed one", () => {
    const { manager, dispatched } = makeManager([
      makeKnownGame("existing"),
      makeKnownGame("removable"),
    ]);

    manager.removeGames([VortexGameId("removable")]);

    expect(dispatchedKnownGames(dispatched).map((iter) => iter.id)).toEqual(["existing"]);
  });

  it("does not dispatch for unknown domains", () => {
    const { manager, dispatched } = makeManager([makeKnownGame("existing")]);

    manager.removeGames([VortexGameId("unknown")]);

    expect(dispatched).toHaveLength(1);
    expect(manager.games).toHaveLength(1);
>>>>>>> v2.10.1
  });
});
