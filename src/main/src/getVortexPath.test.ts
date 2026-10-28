import * as nodeOs from "node:os";
import * as nodePath from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

// Mock electron before importing getVortexPath
vi.mock("electron", () => ({
  app: {
    getAppPath: () => "/fake/app/path",
    getPath: (id: string) => {
      const paths: Record<string, string> = {
        appData: "/fake/appData",
        userData: "/fake/userData",
        temp: "/fake/temp",
        home: "/fake/home",
        documents: "/fake/documents",
        exe: "/fake/exe",
        desktop: "/fake/desktop",
      };
      return paths[id] ?? "/fake/unknown";
    },
    setPath: vi.fn(),
  },
}));

// Mock node:os to provide a predictable homedir
vi.mock("node:os", () => ({
  homedir: () => "/home/testuser",
}));

// Imported once: re-importing per test (vi.resetModules) loads a second @vortex/shared, which
// its duplicate-module guard rejects. getVortexPath reads platform and env at call time.
import { getVortexPath } from "./getVortexPath";

describe("getVortexPath - localAppData", () => {
  const originalPlatform = process.platform;

  afterEach(() => {
    Object.defineProperty(process, "platform", {
      value: originalPlatform,
      writable: true,
      configurable: true,
    });
    vi.unstubAllEnvs();
  });

  it("returns XDG_DATA_HOME on Linux when set", () => {
    Object.defineProperty(process, "platform", {
      value: "linux",
      writable: true,
      configurable: true,
    });
    vi.stubEnv("XDG_DATA_HOME", "/custom/data");
    vi.stubEnv("LOCALAPPDATA", "");

    expect(getVortexPath("localAppData")).toBe("/custom/data");
  });

  it("returns ~/.local/share on Linux when XDG_DATA_HOME is unset", () => {
    Object.defineProperty(process, "platform", {
      value: "linux",
      writable: true,
      configurable: true,
    });
    // Delete XDG_DATA_HOME so the ?? fallback triggers
    delete process.env["XDG_DATA_HOME"];
    vi.stubEnv("LOCALAPPDATA", "");

    const result = getVortexPath("localAppData");
    expect(result).toBe(nodePath.join(nodeOs.homedir(), ".local", "share"));
  });

  it("returns LOCALAPPDATA on Windows (unchanged behavior)", () => {
    Object.defineProperty(process, "platform", {
      value: "win32",
      writable: true,
      configurable: true,
    });
    vi.stubEnv("LOCALAPPDATA", "C:\\Users\\Test\\AppData\\Local");
    vi.stubEnv("XDG_DATA_HOME", "");

    expect(getVortexPath("localAppData")).toBe("C:\\Users\\Test\\AppData\\Local");
  });
});
