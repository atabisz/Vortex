import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// vi.mock is hoisted — must appear before imports
vi.mock("winapi-bindings", () => ({
  GetVolumePathName: vi.fn(() => "C:\\"),
  default: {
    GetVolumePathName: vi.fn(() => "C:\\"),
  },
}));

vi.mock("../../util/fs", () => ({
  statAsync: vi.fn(),
  readFileAsync: vi.fn(),
  writeFileAsync: vi.fn(),
  ensureDirWritableAsync: vi.fn(),
  default: {},
}));

vi.mock("shortid", () => ({
  generate: vi.fn(() => "test-id"),
  default: { generate: vi.fn(() => "test-id") },
}));

vi.mock("@vortex/shared", () => ({
  isErrorWithSystemCode: vi.fn(() => true),
  unknownToError: vi.fn((e: unknown) => e as Error),
  getErrorCode: vi.fn(() => "ENOENT"),
  getErrorMessageOrDefault: vi.fn((e: unknown) => String(e)),
}));

vi.mock("../../util/application", () => ({
  getApplication: vi.fn(() => ({ quit: vi.fn() })),
}));

vi.mock("../../util/selectors", () => ({
  activeGameId: vi.fn(() => "skyrim"),
  installPathForGame: vi.fn(() => "/home/user/.local/share/Vortex/skyrim/mods"),
}));

vi.mock("../../util/log", () => ({
  log: vi.fn(),
}));

vi.mock("../../util/storeHelper", () => ({
  getSafe: vi.fn(() => undefined),
}));

vi.mock("../gamemode_management/util/discovery", () => ({
  suggestStagingPath: vi.fn(() => Promise.resolve("{USERDATA}/skyrim/mods")),
}));

vi.mock("./actions/settings", () => ({
  setInstallPath: vi.fn(() => ({ type: "SET_INSTALL_PATH" })),
}));

vi.mock("./util/activationStore", () => ({
  fallbackPurge: vi.fn(() => Promise.resolve()),
}));

vi.mock("./util/getInstallPath", () => ({
  resolveInstallPath: vi.fn(
    (p: string) => p.replace("{USERDATA}", "/home/user/.local/share/Vortex"),
  ),
}));

// Import after mocks are declared
import * as fsUtil from "../../util/fs";
import * as stagingDirectory from "./stagingDirectory";

describe("stagingDirectory Linux partition check", () => {
  let originalPlatform: PropertyDescriptor;

  beforeEach(() => {
    originalPlatform = Object.getOwnPropertyDescriptor(
      process,
      "platform",
    )!;
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

  // RED TEST: Plan 01 Task 2 will export findAccessibleAncestor as a named
  // export from stagingDirectory.ts for testability. This test FAILS because
  // the current code does not export findAccessibleAncestor.
  it("on Linux, findAccessibleAncestor returns true when statAsync resolves for the path itself", async () => {
    setPlatform("linux");

    // findAccessibleAncestor will be exported by Plan 01 Task 2
    const { findAccessibleAncestor } = stagingDirectory as any;
    expect(findAccessibleAncestor).toBeDefined();

    // Mock statAsync to resolve (path is accessible)
    vi.mocked(fsUtil.statAsync).mockResolvedValueOnce(
      { dev: 1 } as any,
    );

    const result = await findAccessibleAncestor("/home/user/.local/share/Vortex/mods");
    expect(result).toBe(true);
  });

  // RED TEST: Plan 01 Task 2 will export findAccessibleAncestor. This test
  // FAILS because the current code does not export findAccessibleAncestor.
  it("on Linux, findAccessibleAncestor returns false when statAsync rejects all the way to root", async () => {
    setPlatform("linux");

    const { findAccessibleAncestor } = stagingDirectory as any;
    expect(findAccessibleAncestor).toBeDefined();

    // Mock statAsync to always reject (no accessible ancestor)
    vi.mocked(fsUtil.statAsync).mockRejectedValue(
      Object.assign(new Error("ENOENT"), { code: "ENOENT" }),
    );

    const result = await findAccessibleAncestor("/nonexistent/partition/mods");
    expect(result).toBe(false);
  });

  // GREEN REGRESSION GUARD: ensureStagingDirectory is already exported and
  // accessible. This test should PASS with current code.
  it("ensureStagingDirectory function is exported from stagingDirectory module", () => {
    expect(typeof stagingDirectory.ensureStagingDirectory).toBe("function");
  });
});
