import * as path from "path";

import { afterEach, describe, it, expect, vi, beforeEach } from "vitest";

import * as fs from "../../../util/fs";
import { normalizeBackslashPaths } from "./normalizeBackslashPaths";

vi.mock("../../../util/fs");

interface FakeStats {
  isFile: () => boolean;
  isDirectory: () => boolean;
}

const fileStat: FakeStats = {
  isFile: () => true,
  isDirectory: () => false,
};
const dirStat: FakeStats = {
  isFile: () => false,
  isDirectory: () => true,
};

describe("normalizeBackslashPaths", () => {
  const mockedReaddir = vi.mocked(fs.readdirAsync);
  const mockedStat = vi.mocked(fs.statAsync);
  const mockedEnsureDir = vi.mocked(fs.ensureDirAsync);
  const mockedRename = vi.mocked(fs.renameAsync);
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
    await normalizeBackslashPaths("/root");
    expect(mockedReaddir).not.toHaveBeenCalled();
    expect(mockedRename).not.toHaveBeenCalled();
  });

  it("renames a backslash-containing entry into a nested path", async () => {
    const root = "/root";
    const badEntry = "Data\\SKSE\\plugins\\Foo.dll";

    mockedReaddir.mockResolvedValueOnce([badEntry] as never);
    mockedEnsureDir.mockResolvedValue(undefined as never);
    mockedRename.mockResolvedValue(undefined as never);

    await normalizeBackslashPaths(root);

    const expectedSrc = path.join(root, badEntry);
    const expectedDst = path.join(root, "Data/SKSE/plugins/Foo.dll");
    expect(mockedEnsureDir).toHaveBeenCalledWith(path.dirname(expectedDst));
    expect(mockedRename).toHaveBeenCalledWith(expectedSrc, expectedDst);
  });

  it("leaves already-nested directories alone and recurses into them", async () => {
    const root = "/root";
    const data = path.join(root, "Data");
    const skse = path.join(data, "SKSE");

    mockedReaddir.mockImplementation(((dir: string) => {
      if (dir === root) return Promise.resolve(["Data"]);
      if (dir === data) return Promise.resolve(["SKSE"]);
      if (dir === skse) return Promise.resolve([]);
      return Promise.reject(new Error("unexpected readdir"));
    }) as unknown as typeof fs.readdirAsync);

    mockedStat.mockImplementation(((p: string) => {
      if (p === data || p === skse) return Promise.resolve(dirStat);
      return Promise.reject(new Error("unexpected stat"));
    }) as unknown as typeof fs.statAsync);

    await normalizeBackslashPaths(root);

    expect(mockedRename).not.toHaveBeenCalled();
    expect(mockedEnsureDir).not.toHaveBeenCalled();
  });

  it("handles mixed tree: renames siblings with backslashes and recurses into real dirs", async () => {
    const root = "/root";
    const realDir = path.join(root, "meshes");
    const badEntry = "Data\\SKSE\\plugins\\Foo.dll";

    mockedReaddir.mockImplementation(((dir: string) => {
      if (dir === root) return Promise.resolve([badEntry, "meshes"]);
      if (dir === realDir) return Promise.resolve([]);
      return Promise.reject(new Error("unexpected readdir"));
    }) as unknown as typeof fs.readdirAsync);

    mockedStat.mockImplementation(((p: string) => {
      if (p === realDir) return Promise.resolve(dirStat);
      return Promise.reject(new Error("unexpected stat"));
    }) as unknown as typeof fs.statAsync);

    mockedEnsureDir.mockResolvedValue(undefined as never);
    mockedRename.mockResolvedValue(undefined as never);

    await normalizeBackslashPaths(root);

    expect(mockedRename).toHaveBeenCalledTimes(1);
    expect(mockedRename).toHaveBeenCalledWith(
      path.join(root, badEntry),
      path.join(root, "Data/SKSE/plugins/Foo.dll"),
    );
  });

  it("leaves plain files (no backslash) alone", async () => {
    const root = "/root";

    mockedReaddir.mockResolvedValueOnce(["Foo.esp"] as never);
    mockedStat.mockResolvedValueOnce(fileStat as never);

    await normalizeBackslashPaths(root);

    expect(mockedRename).not.toHaveBeenCalled();
    expect(mockedEnsureDir).not.toHaveBeenCalled();
  });

  it("swallows statAsync errors for entries that disappear during iteration", async () => {
    const root = "/root";

    mockedReaddir.mockResolvedValueOnce(["transient"] as never);
    mockedStat.mockRejectedValueOnce(new Error("ENOENT"));

    await expect(normalizeBackslashPaths(root)).resolves.toBeUndefined();
    expect(mockedRename).not.toHaveBeenCalled();
  });
});
