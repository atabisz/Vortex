import * as path from "path";

import { describe, it, expect, vi, beforeEach } from "vitest";

import * as fs from "../../../util/fs";
import { stagingDirHasFiles } from "./stagingIntegrity";

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

describe("stagingDirHasFiles", () => {
  const mockedReaddir = vi.mocked(fs.readdirAsync);
  const mockedLstat = vi.mocked(fs.lstatAsync);

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns false for a missing directory (ENOENT)", async () => {
    mockedReaddir.mockRejectedValueOnce(Object.assign(new Error("ENOENT"), { code: "ENOENT" }));
    expect(await stagingDirHasFiles("/fake/missing")).toBe(false);
  });

  it("returns false for a directory that contains only empty subdirectories", async () => {
    // /root -> [SKSE], /root/SKSE -> [Plugins], /root/SKSE/Plugins -> []
    const root = "/root";
    const skse = path.join(root, "SKSE");
    const plugins = path.join(skse, "Plugins");

    mockedReaddir.mockImplementation(((dir: string) => {
      if (dir === root) return Promise.resolve(["SKSE"]);
      if (dir === skse) return Promise.resolve(["Plugins"]);
      if (dir === plugins) return Promise.resolve([]);
      return Promise.reject(new Error("unexpected readdir"));
    }) as unknown as typeof fs.readdirAsync);

    mockedLstat.mockImplementation(((p: string) => {
      if (p === skse || p === plugins) return Promise.resolve(dirStat);
      return Promise.reject(new Error("unexpected lstat"));
    }) as unknown as typeof fs.lstatAsync);

    expect(await stagingDirHasFiles(root)).toBe(false);
  });

  it("returns true on the first regular file found in a nested tree", async () => {
    const root = "/root";
    const skse = path.join(root, "SKSE");
    const plugins = path.join(skse, "Plugins");
    const dll = path.join(plugins, "ActorLimitFix.dll");

    mockedReaddir.mockImplementation(((dir: string) => {
      if (dir === root) return Promise.resolve(["SKSE"]);
      if (dir === skse) return Promise.resolve(["Plugins"]);
      if (dir === plugins) return Promise.resolve(["ActorLimitFix.dll"]);
      return Promise.reject(new Error("unexpected readdir"));
    }) as unknown as typeof fs.readdirAsync);

    mockedLstat.mockImplementation(((p: string) => {
      if (p === skse || p === plugins) return Promise.resolve(dirStat);
      if (p === dll) return Promise.resolve(fileStat);
      return Promise.reject(new Error("unexpected lstat"));
    }) as unknown as typeof fs.lstatAsync);

    expect(await stagingDirHasFiles(root)).toBe(true);
  });

  it("returns true for a directory with a file at the top level", async () => {
    const root = "/root";
    const esp = path.join(root, "mod.esp");

    mockedReaddir.mockResolvedValueOnce(["mod.esp"] as never);
    mockedLstat.mockResolvedValueOnce(fileStat as never);

    expect(await stagingDirHasFiles(root)).toBe(true);
    // ensure no unexpected additional fs calls
    expect(mockedReaddir).toHaveBeenCalledTimes(1);
    expect(mockedLstat).toHaveBeenCalledWith(esp);
  });

  it("skips entries whose lstat fails and keeps scanning", async () => {
    const root = "/root";
    const broken = path.join(root, "broken");
    const good = path.join(root, "good.esp");

    mockedReaddir.mockResolvedValueOnce(["broken", "good.esp"] as never);
    mockedLstat.mockImplementation(((p: string) => {
      if (p === broken) return Promise.reject(new Error("EACCES"));
      if (p === good) return Promise.resolve(fileStat);
      return Promise.reject(new Error("unexpected lstat"));
    }) as unknown as typeof fs.lstatAsync);

    expect(await stagingDirHasFiles(root)).toBe(true);
  });
});
