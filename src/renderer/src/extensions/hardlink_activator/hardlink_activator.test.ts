import { beforeEach, describe, expect, it, vi } from "vitest";

// vi.mock is hoisted — must appear before imports
vi.mock("winapi-bindings", () => ({
  GetVolumePathName: vi.fn(() => "C:\\"),
  default: {
    GetVolumePathName: vi.fn(() => "C:\\"),
  },
}));

vi.mock("../../util/fs", () => ({
  statSync: vi.fn(),
  accessSync: vi.fn(),
  writeFileSync: vi.fn(),
  linkSync: vi.fn(),
  removeSync: vi.fn(),
  removeAsync: vi.fn(() => Promise.resolve()),
  constants: { W_OK: 2 },
  default: {},
}));

vi.mock("@vortex/shared", () => ({
  getErrorCode: vi.fn(() => "ENOENT"),
  getErrorMessageOrDefault: vi.fn((e: unknown) => String(e)),
  unknownToError: vi.fn((e: unknown) => e as Error),
}));

vi.mock("../../util/selectors", () => ({
  installPathForGame: vi.fn(
    () => "/home/user/.local/share/Vortex/skyrimse/mods",
  ),
}));

vi.mock("../gamemode_management/util/getGame", () => ({
  getGame: vi.fn(() => ({
    getModPaths: vi.fn(() => ({
      "": "/home/user/.steam/steamapps/common/Skyrim Special Edition/Data",
    })),
  })),
}));

vi.mock("../../logging", () => ({
  log: vi.fn(),
}));

vi.mock("../../actions/session", () => ({
  setSettingsPage: vi.fn(() => ({ type: "SET_SETTINGS_PAGE" })),
}));

vi.mock("bluebird", () => ({
  default: {
    delay: vi.fn(() => Promise.resolve()),
    resolve: vi.fn((v: unknown) => Promise.resolve(v)),
  },
}));

vi.mock("turbowalk", () => ({
  default: vi.fn(() => Promise.resolve()),
}));

vi.mock("../mod_management/LinkingDeployment", () => ({
  default: class MockLinkingDeployment {
    constructor(..._args: unknown[]) {}
  },
}));

// Imports after all vi.mock declarations
import { getErrorCode } from "@vortex/shared";
import * as fsModule from "../../util/fs";
import init from "./index";

// ---- helpers ----

function createMockState(gameId: string): unknown {
  return {
    settings: {
      gameMode: {
        discovered: {
          [gameId]: {
            path: "/home/user/.steam/steamapps/common/Skyrim Special Edition",
          },
        },
      },
    },
  };
}

function getDeploymentMethod(): unknown {
  let method: unknown;
  const mockContext: {
    registerDeploymentMethod: (m: unknown) => void;
    api: {
      events: { on: ReturnType<typeof vi.fn>; emit: ReturnType<typeof vi.fn> };
      store: {
        dispatch: ReturnType<typeof vi.fn>;
        getState: ReturnType<typeof vi.fn>;
      };
      translate: (s: string) => string;
    };
  } = {
    registerDeploymentMethod: (m: unknown) => {
      method = m;
    },
    api: {
      events: { on: vi.fn(), emit: vi.fn() },
      store: { dispatch: vi.fn(), getState: vi.fn() },
      translate: (s: string) => s,
    },
  };
  init(mockContext as Parameters<typeof init>[0]);
  return method;
}

// ---- tests ----

describe("hardlink_activator isSupported", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let dm: any;

  beforeEach(() => {
    dm = getDeploymentMethod();
    vi.clearAllMocks();
    // Default: accessSync passes (writable), statSync throws (staging dir missing)
    vi.mocked(fsModule.accessSync).mockImplementation(() => undefined);
    vi.mocked(fsModule.statSync).mockImplementation(() => {
      throw new Error("ENOENT: no such file or directory");
    });
  });

  it("returns undefined when staging dir statSync throws ENOENT", () => {
    vi.mocked(getErrorCode).mockReturnValue("ENOENT");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = (dm as any).isSupported(
      createMockState("skyrimse"),
      "skyrimse",
      "",
    );

    // Currently FAILS: current code returns { description: ... } for all errors.
    // After fix, ENOENT returns undefined (supported).
    expect(result).toBeUndefined();
  });

  it("returns not-initialized reason for non-ENOENT stat errors", () => {
    vi.mocked(getErrorCode).mockReturnValue("EACCES");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = (dm as any).isSupported(
      createMockState("skyrimse"),
      "skyrimse",
      "",
    );

    expect(result).toBeDefined();
    expect(result).toHaveProperty("description");
    expect(typeof result.description).toBe("function");
  });
});

describe("symlink_activator isGamebryoGame blocklist", () => {
  it("symlink_activator isGamebryoGame list includes skyrimse", () => {
    const { readFileSync } = require("fs");
    const { resolve } = require("path");

    const src = readFileSync(
      resolve(__dirname, "../symlink_activator/index.ts"),
      "utf8",
    );
    expect(src).toContain('"skyrimse"');

    // Verify "skyrimse" appears inside the isGamebryoGame method definition.
    // Search for the private method definition (not the call site).
    const defIndex = src.indexOf("private isGamebryoGame");
    expect(defIndex).toBeGreaterThan(-1);
    const funcBody = src.slice(defIndex, defIndex + 600);
    expect(funcBody).toContain('"skyrimse"');
  });
});
