import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// vi.mock is hoisted — must appear before imports
vi.mock("winapi-bindings", () => ({
  GetDiskFreeSpaceEx: vi.fn(() => ({ freeToCaller: 100 * 1024 * 1024 * 1024 })),
  GetVolumePathName: vi.fn(() => "C:"),
  default: {
    GetDiskFreeSpaceEx: vi.fn(() => ({ freeToCaller: 100 * 1024 * 1024 * 1024 })),
    GetVolumePathName: vi.fn(() => "C:"),
  },
}));

// Mock modules that todos.tsx transitively needs
vi.mock("../../actions/session", () => ({
  setSettingsPage: vi.fn(),
}));
vi.mock("../../util/selectors", () => ({
  activeGameId: vi.fn(),
  downloadPath: vi.fn(() => "C:\\Downloads"),
  installPath: vi.fn(() => "C:\\Mods"),
}));
vi.mock("../settings_interface/actions/interface", () => ({
  setProfilesVisible: vi.fn(),
}));

import type { TFunction } from "i18next";
import * as winapi from "winapi-bindings";
import todos from "./todos";

// Minimal mock api matching what todos() uses
const mockApi: any = {
  store: { dispatch: vi.fn() },
  events: { emit: vi.fn() },
  translate: (s: string) => s,
  highlightControl: vi.fn(),
};

const mockT = ((s: string) => s) as TFunction;

describe("todos platform guards", () => {
  let originalPlatform: PropertyDescriptor;

  beforeEach(() => {
    originalPlatform = Object.getOwnPropertyDescriptor(
      process,
      "platform",
    )!;
    vi.clearAllMocks();
    // Reset winapi mocks to their default return values after clearAllMocks
    vi.mocked(winapi.GetDiskFreeSpaceEx).mockReturnValue({
      freeToCaller: 100 * 1024 * 1024 * 1024,
    } as any);
    vi.mocked(winapi.GetVolumePathName).mockReturnValue("C:");
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

  // --- minDiskSpace / download-location condition ---

  it("minDiskSpace returns false on linux without calling winapi.GetDiskFreeSpaceEx", () => {
    setPlatform("linux");
    const todoList = todos(mockApi);
    const dlTodo = todoList.find((t) => t.id === "download-location")!;
    expect(dlTodo).toBeDefined();
    expect(dlTodo.condition).toBeDefined();

    const result = dlTodo.condition!({ dlPath: "/home/user/downloads" });
    expect(result).toBe(false);
    expect(winapi.GetDiskFreeSpaceEx).not.toHaveBeenCalled();
  });

  it("minDiskSpace calls winapi.GetDiskFreeSpaceEx on win32", () => {
    setPlatform("win32");
    const todoList = todos(mockApi);
    const dlTodo = todoList.find((t) => t.id === "download-location")!;
    expect(dlTodo.condition).toBeDefined();

    // freeToCaller is 100 GB — below 200 GB threshold → condition returns true
    vi.mocked(winapi.GetDiskFreeSpaceEx).mockReturnValue({
      freeToCaller: 100 * 1024 * 1024 * 1024,
    } as any);
    const result = dlTodo.condition!({ dlPath: "C:\\Downloads" });
    expect(winapi.GetDiskFreeSpaceEx).toHaveBeenCalledWith("C:\\Downloads");
    expect(typeof result).toBe("boolean");
  });

  // --- download-location value ---

  it("download-location value returns props.dlPath on linux without calling winapi.GetVolumePathName", () => {
    setPlatform("linux");
    const todoList = todos(mockApi);
    const dlTodo = todoList.find((t) => t.id === "download-location")!;
    expect(dlTodo.value).toBeDefined();

    const result = (dlTodo.value as Function)(mockT, {
      dlPath: "/home/user/downloads",
    });
    expect(result).toBe("/home/user/downloads");
    expect(winapi.GetVolumePathName).not.toHaveBeenCalled();
  });

  it("download-location value returns t('<No download folder>') on linux when dlPath is undefined", () => {
    setPlatform("linux");
    const todoList = todos(mockApi);
    const dlTodo = todoList.find((t) => t.id === "download-location")!;

    const result = (dlTodo.value as Function)(mockT, { dlPath: undefined });
    expect(result).toBe("<No download folder>");
    expect(winapi.GetVolumePathName).not.toHaveBeenCalled();
  });

  // --- mod-location value ---

  it("mod-location value returns props.instPath on linux without calling winapi.GetVolumePathName", () => {
    setPlatform("linux");
    const todoList = todos(mockApi);
    const modTodo = todoList.find((t) => t.id === "mod-location")!;
    expect(modTodo.value).toBeDefined();

    const result = (modTodo.value as Function)(mockT, {
      instPath: "/home/user/mods",
    });
    expect(result).toBe("/home/user/mods");
    expect(winapi.GetVolumePathName).not.toHaveBeenCalled();
  });

  it("mod-location value returns t('<No staging folder>') on linux when instPath is undefined", () => {
    setPlatform("linux");
    const todoList = todos(mockApi);
    const modTodo = todoList.find((t) => t.id === "mod-location")!;

    const result = (modTodo.value as Function)(mockT, { instPath: undefined });
    expect(result).toBe("<No staging folder>");
    expect(winapi.GetVolumePathName).not.toHaveBeenCalled();
  });

  // --- manual-scan condition ---

  it("manual-scan condition returns true on linux regardless of searchPaths", () => {
    setPlatform("linux");
    const todoList = todos(mockApi);
    const scanTodo = todoList.find((t) => t.id === "manual-scan")!;
    expect(scanTodo.condition).toBeDefined();

    // No searchPaths — should still return true on Linux
    const result = scanTodo.condition!({});
    expect(result).toBe(true);
  });

  it("manual-scan condition returns false on win32 when searchPaths is undefined", () => {
    setPlatform("win32");
    const todoList = todos(mockApi);
    const scanTodo = todoList.find((t) => t.id === "manual-scan")!;

    const result = scanTodo.condition!({ searchPaths: undefined });
    expect(result).toBe(false);
  });

  it("manual-scan condition returns true on win32 when searchPaths is defined", () => {
    setPlatform("win32");
    const todoList = todos(mockApi);
    const scanTodo = todoList.find((t) => t.id === "manual-scan")!;

    const result = scanTodo.condition!({ searchPaths: ["/"] });
    expect(result).toBe(true);
  });
});
