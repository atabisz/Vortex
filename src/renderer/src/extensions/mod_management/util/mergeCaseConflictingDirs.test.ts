import * as path from "path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import * as fs from "../../../util/fs";
import { mergeCaseConflictingDirs } from "./mergeCaseConflictingDirs";

vi.mock("../../../util/fs");

interface FakeStats {
  isFile: () => boolean;
  isDirectory: () => boolean;
}

const fileStat: FakeStats = { isFile: () => true, isDirectory: () => false };
const dirStat: FakeStats = { isFile: () => false, isDirectory: () => true };

describe("mergeCaseConflictingDirs", () => {
  const mockedReaddir = vi.mocked(fs.readdirAsync);
  const mockedStat = vi.mocked(fs.statAsync);
  const mockedRename = vi.mocked(fs.renameAsync);
  const mockedRmdir = vi.mocked(fs.rmdirAsync);
  const originalPlatform = process.platform;

  beforeEach(() => {
    vi.resetAllMocks();
    Object.defineProperty(process, "platform", { value: "linux", configurable: true });
  });

  afterEach(() => {
    Object.defineProperty(process, "platform", { value: originalPlatform, configurable: true });
  });

  it("is a no-op on win32", async () => {
    Object.defineProperty(process, "platform", { value: "win32", configurable: true });
    await mergeCaseConflictingDirs("/root");
    expect(mockedReaddir).not.toHaveBeenCalled();
    expect(mockedRename).not.toHaveBeenCalled();
  });

  it("merges files from duplicate-cased sibling into the canonical (first-seen) dir", async () => {
    const root = "/root";
    const dataUpper = path.join(root, "Data");
    const dataLower = path.join(root, "data");

    mockedReaddir.mockImplementation(((dir: string) => {
      if (dir === root) return Promise.resolve(["Data", "data"]);
      if (dir === dataUpper) return Promise.resolve([]);
      if (dir === dataLower) return Promise.resolve(["Foo.dll"]);
      return Promise.reject(new Error("unexpected readdir"));
    }) as unknown as typeof fs.readdirAsync);

    mockedStat.mockImplementation(((p: string) => {
      if (p === dataUpper || p === dataLower) return Promise.resolve(dirStat);
      if (p === path.join(dataUpper, "Foo.dll")) {
        return Promise.reject(new Error("ENOENT"));
      }
      return Promise.reject(new Error("unexpected stat"));
    }) as unknown as typeof fs.statAsync);

    mockedRename.mockResolvedValue(undefined as never);
    mockedRmdir.mockResolvedValue(undefined as never);

    await mergeCaseConflictingDirs(root);

    expect(mockedRename).toHaveBeenCalledWith(
      path.join(dataLower, "Foo.dll"),
      path.join(dataUpper, "Foo.dll"),
    );
    expect(mockedRmdir).toHaveBeenCalledWith(dataLower);
  });

  it("drops duplicate files that already exist in the canonical dir", async () => {
    const root = "/root";
    const dataUpper = path.join(root, "Data");
    const dataLower = path.join(root, "data");

    mockedReaddir.mockImplementation(((dir: string) => {
      if (dir === root) return Promise.resolve(["Data", "data"]);
      if (dir === dataUpper) return Promise.resolve(["Foo.dll"]);
      if (dir === dataLower) return Promise.resolve(["Foo.dll"]);
      return Promise.reject(new Error("unexpected readdir"));
    }) as unknown as typeof fs.readdirAsync);

    mockedStat.mockImplementation(((p: string) => {
      if (p === dataUpper || p === dataLower) return Promise.resolve(dirStat);
      if (p === path.join(dataUpper, "Foo.dll")) return Promise.resolve(fileStat);
      return Promise.reject(new Error("unexpected stat"));
    }) as unknown as typeof fs.statAsync);

    mockedRmdir.mockResolvedValue(undefined as never);

    await mergeCaseConflictingDirs(root);

    // canonical already has the file; no rename issued
    expect(mockedRename).not.toHaveBeenCalled();
  });

  it("leaves directories without case-duplicate siblings alone", async () => {
    const root = "/root";
    const data = path.join(root, "Data");

    mockedReaddir.mockImplementation(((dir: string) => {
      if (dir === root) return Promise.resolve(["Data"]);
      if (dir === data) return Promise.resolve([]);
      return Promise.reject(new Error("unexpected readdir"));
    }) as unknown as typeof fs.readdirAsync);

    mockedStat.mockImplementation(((p: string) => {
      if (p === data) return Promise.resolve(dirStat);
      return Promise.reject(new Error("unexpected stat"));
    }) as unknown as typeof fs.statAsync);

    await mergeCaseConflictingDirs(root);

    expect(mockedRename).not.toHaveBeenCalled();
    expect(mockedRmdir).not.toHaveBeenCalled();
  });

  it("returns quietly on readdir failure at the base", async () => {
    mockedReaddir.mockRejectedValueOnce(new Error("ENOENT"));
    await expect(mergeCaseConflictingDirs("/nope")).resolves.toBeUndefined();
    expect(mockedRename).not.toHaveBeenCalled();
  });

  it("recurses into canonical dir before merging siblings", async () => {
    const root = "/root";
    const dataUpper = path.join(root, "Data");
    const dataLower = path.join(root, "data");
    const nestedUpper = path.join(dataUpper, "SKSE");
    const nestedLower = path.join(dataUpper, "skse");

    mockedReaddir.mockImplementation(((dir: string) => {
      if (dir === root) return Promise.resolve(["Data", "data"]);
      if (dir === dataUpper) return Promise.resolve(["SKSE", "skse"]);
      if (dir === nestedUpper) return Promise.resolve([]);
      if (dir === nestedLower) return Promise.resolve(["Plug.dll"]);
      if (dir === dataLower) return Promise.resolve([]);
      return Promise.reject(new Error("unexpected readdir"));
    }) as unknown as typeof fs.readdirAsync);

    mockedStat.mockImplementation(((p: string) => {
      if ([dataUpper, dataLower, nestedUpper, nestedLower].includes(p)) {
        return Promise.resolve(dirStat);
      }
      if (p === path.join(nestedUpper, "Plug.dll")) {
        return Promise.reject(new Error("ENOENT"));
      }
      return Promise.reject(new Error("unexpected stat"));
    }) as unknown as typeof fs.statAsync);

    mockedRename.mockResolvedValue(undefined as never);
    mockedRmdir.mockResolvedValue(undefined as never);

    await mergeCaseConflictingDirs(root);

    // file from nested lowercase dir moves into nested uppercase dir first
    expect(mockedRename).toHaveBeenCalledWith(
      path.join(nestedLower, "Plug.dll"),
      path.join(nestedUpper, "Plug.dll"),
    );
    expect(mockedRmdir).toHaveBeenCalledWith(nestedLower);
    expect(mockedRmdir).toHaveBeenCalledWith(dataLower);
  });
});
