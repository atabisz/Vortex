import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import getDriveList, {
  _resetDrivelistLoader,
  _setDrivelistLoader,
} from "./getDriveList";

const mockApi: any = {
  showErrorNotification: vi.fn(),
};

describe("getDriveList platform fallbacks", () => {
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
    _resetDrivelistLoader();
  });

  function setPlatform(platform: string) {
    Object.defineProperty(process, "platform", {
      value: platform,
      writable: true,
      configurable: true,
    });
  }

  // --- .catch() path: list() rejects ---

  it("returns ['/'] on linux when drivelist.list() rejects", async () => {
    setPlatform("linux");
    _setDrivelistLoader(
      () => vi.fn().mockRejectedValue(new Error("disk error")) as any,
    );

    const result = await getDriveList(mockApi);
    expect(result).toEqual(["/"]);
    expect(mockApi.showErrorNotification).not.toHaveBeenCalled();
  });

  it("returns ['C:'] on win32 when drivelist.list() rejects", async () => {
    setPlatform("win32");
    _setDrivelistLoader(
      () => vi.fn().mockRejectedValue(new Error("disk error")) as any,
    );

    const result = await getDriveList(mockApi);
    expect(result).toEqual(["C:"]);
    expect(mockApi.showErrorNotification).toHaveBeenCalledTimes(1);
  });

  it("does not call api.showErrorNotification on linux for .catch() path", async () => {
    setPlatform("linux");
    _setDrivelistLoader(
      () => vi.fn().mockRejectedValue(new Error("disk error")) as any,
    );

    await getDriveList(mockApi);
    expect(mockApi.showErrorNotification).not.toHaveBeenCalled();
  });

  it("calls api.showErrorNotification on win32 for .catch() path", async () => {
    setPlatform("win32");
    _setDrivelistLoader(
      () => vi.fn().mockRejectedValue(new Error("disk error")) as any,
    );

    await getDriveList(mockApi);
    expect(mockApi.showErrorNotification).toHaveBeenCalledTimes(1);
  });

  // --- module-load-fail path: typeof list !== "function" ---
  // Simulate a broken/missing drivelist by returning a non-function from the loader.

  it("returns ['/'] on linux when drivelist module has no list function", async () => {
    setPlatform("linux");
    _setDrivelistLoader(() => "not-a-function" as any);

    const result = await getDriveList(mockApi);
    expect(result).toEqual(["/"]);
    expect(mockApi.showErrorNotification).not.toHaveBeenCalled();
  });

  it("returns ['C:'] on win32 when drivelist module has no list function", async () => {
    setPlatform("win32");
    _setDrivelistLoader(() => "not-a-function" as any);

    const result = await getDriveList(mockApi);
    expect(result).toEqual(["C:"]);
    expect(mockApi.showErrorNotification).toHaveBeenCalledTimes(1);
  });

  it("does not call api.showErrorNotification on linux for module-load-fail", async () => {
    setPlatform("linux");
    _setDrivelistLoader(() => "not-a-function" as any);

    await getDriveList(mockApi);
    expect(mockApi.showErrorNotification).not.toHaveBeenCalled();
  });

  it("calls api.showErrorNotification on win32 for module-load-fail", async () => {
    setPlatform("win32");
    _setDrivelistLoader(() => "not-a-function" as any);

    await getDriveList(mockApi);
    expect(mockApi.showErrorNotification).toHaveBeenCalledTimes(1);
  });
});
