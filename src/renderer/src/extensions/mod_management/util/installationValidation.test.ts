import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../util/fs", () => ({
  readdirAsync: vi.fn(),
  lstatAsync: vi.fn(),
}));

vi.mock("../../../util/log", () => ({
  log: vi.fn(),
}));

vi.mock("../../../util/selectors", () => ({
  activeGameId: vi.fn(() => "skyrimse"),
}));

vi.mock("../../../util/storeHelper", () => ({
  getSafe: vi.fn(),
}));

vi.mock("../../download_management/selectors", () => ({
  downloadPathForGame: vi.fn(() => "/downloads/skyrimse"),
}));

vi.mock("../../gamemode_management/util/getGame", () => ({
  getGame: vi.fn(() => ({
    getModPaths: (gamePath: string) => ({ "": `${gamePath}/Data` }),
  })),
}));

vi.mock("../selectors", () => ({
  installPathForGame: vi.fn(() => "/staging/skyrimse"),
}));

vi.mock("./activationStore", () => ({
  getManifest: vi.fn(),
}));

import * as fs from "../../../util/fs";
import { getSafe } from "../../../util/storeHelper";
import { getManifest } from "./activationStore";
import {
  validateArchiveToStaging,
  validateModInstallation,
  validateStagingToDeployed,
  verifyHardlink,
} from "./installationValidation";

const mockedFs = vi.mocked(fs);
const mockedGetSafe = vi.mocked(getSafe);
const mockedGetManifest = vi.mocked(getManifest);

function makeMockApi(archiveFiles?: string[]) {
  return {
    store: {
      getState: () => ({
        settings: {
          gameMode: {
            discovered: {
              skyrimse: { path: "/games/skyrimse" },
            },
          },
        },
      }),
    },
    openArchive: vi.fn().mockResolvedValue({
      readDir: vi.fn().mockResolvedValue(archiveFiles ?? []),
    }),
  } as any;
}

const TEST_MOD = {
  id: "test-mod",
  archiveId: "dl-001",
  installationPath: "test-mod-001",
  type: "",
  state: "installed",
  attributes: {},
};

describe("installationValidation", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("verifyHardlink", () => {
    it("returns true when inodes match and nlink > 1", async () => {
      mockedFs.lstatAsync
        .mockResolvedValueOnce({ nlink: 2, ino: 12345 } as any)
        .mockResolvedValueOnce({ nlink: 2, ino: 12345 } as any);

      expect(await verifyHardlink("/deployed/file.esp", "/staging/file.esp")).toBe(true);
    });

    it("returns false when inodes differ", async () => {
      mockedFs.lstatAsync
        .mockResolvedValueOnce({ nlink: 2, ino: 12345 } as any)
        .mockResolvedValueOnce({ nlink: 2, ino: 99999 } as any);

      expect(await verifyHardlink("/deployed/file.esp", "/staging/file.esp")).toBe(false);
    });

    it("returns false when nlink is 1", async () => {
      mockedFs.lstatAsync
        .mockResolvedValueOnce({ nlink: 1, ino: 12345 } as any)
        .mockResolvedValueOnce({ nlink: 2, ino: 12345 } as any);

      expect(await verifyHardlink("/deployed/file.esp", "/staging/file.esp")).toBe(false);
    });

    it("returns false on ENOENT", async () => {
      mockedFs.lstatAsync.mockRejectedValueOnce(new Error("ENOENT"));

      expect(await verifyHardlink("/deployed/missing.esp", "/staging/file.esp")).toBe(false);
    });
  });

  describe("validateArchiveToStaging", () => {
    it("reports valid when all archive files are in staging", async () => {
      const api = makeMockApi(["meshes/body.nif", "textures/skin.dds"]);

      mockedGetSafe
        .mockReturnValueOnce(TEST_MOD) // mod lookup
        .mockReturnValueOnce({ localPath: "test-mod.7z", state: "finished" }); // download

      // walkDirectory mock: staging has exactly those files
      mockedFs.readdirAsync
        .mockResolvedValueOnce(["meshes", "textures"]) // root
        .mockResolvedValueOnce(["body.nif"]) // meshes/
        .mockResolvedValueOnce(["skin.dds"]); // textures/

      mockedFs.lstatAsync
        .mockResolvedValueOnce({ isFile: () => false, isDirectory: () => true } as any) // meshes
        .mockResolvedValueOnce({ isFile: () => true, isDirectory: () => false } as any) // body.nif
        .mockResolvedValueOnce({ isFile: () => false, isDirectory: () => true } as any) // textures
        .mockResolvedValueOnce({ isFile: () => true, isDirectory: () => false } as any); // skin.dds

      const result = await validateArchiveToStaging(api, "skyrimse", "test-mod");

      expect(result.valid).toBe(true);
      expect(result.discrepancies).toHaveLength(0);
    });

    it("reports missing_in_staging when archive files are absent", async () => {
      const api = makeMockApi(["meshes/body.nif", "textures/skin.dds"]);

      mockedGetSafe
        .mockReturnValueOnce(TEST_MOD)
        .mockReturnValueOnce({ localPath: "test-mod.7z", state: "finished" });

      // Staging only has meshes/body.nif
      mockedFs.readdirAsync.mockResolvedValueOnce(["meshes"]).mockResolvedValueOnce(["body.nif"]);

      mockedFs.lstatAsync
        .mockResolvedValueOnce({ isFile: () => false, isDirectory: () => true } as any)
        .mockResolvedValueOnce({ isFile: () => true, isDirectory: () => false } as any);

      const result = await validateArchiveToStaging(api, "skyrimse", "test-mod");

      expect(result.valid).toBe(false);
      expect(result.discrepancies).toHaveLength(1);
      expect(result.discrepancies[0].kind).toBe("missing_in_staging");
      expect(result.discrepancies[0].filePath).toBe("textures/skin.dds");
      expect(result.discrepancies[0].severity).toBe("error");
    });

    it("downgrades to warning when installerChoices present", async () => {
      const modWithChoices = {
        ...TEST_MOD,
        attributes: { installerChoices: { someChoice: true } },
      };
      const api = makeMockApi(["optional/file.esp", "required/file.esp"]);

      mockedGetSafe
        .mockReturnValueOnce(modWithChoices)
        .mockReturnValueOnce({ localPath: "test-mod.7z", state: "finished" });

      // Staging only has required/
      mockedFs.readdirAsync.mockResolvedValueOnce(["required"]).mockResolvedValueOnce(["file.esp"]);

      mockedFs.lstatAsync
        .mockResolvedValueOnce({ isFile: () => false, isDirectory: () => true } as any)
        .mockResolvedValueOnce({ isFile: () => true, isDirectory: () => false } as any);

      const result = await validateArchiveToStaging(api, "skyrimse", "test-mod");

      expect(result.valid).toBe(true); // warnings don't fail validation
      const missing = result.discrepancies.filter((d) => d.kind === "missing_in_staging");
      expect(missing).toHaveLength(1);
      expect(missing[0].severity).toBe("warning");
    });

    it("reports extra_in_staging as info", async () => {
      const api = makeMockApi(["meshes/body.nif"]);

      mockedGetSafe
        .mockReturnValueOnce(TEST_MOD)
        .mockReturnValueOnce({ localPath: "test-mod.7z", state: "finished" });

      // Staging has an extra generated file
      mockedFs.readdirAsync
        .mockResolvedValueOnce(["meshes", "generated.ini"])
        .mockResolvedValueOnce(["body.nif"]);

      mockedFs.lstatAsync
        .mockResolvedValueOnce({ isFile: () => false, isDirectory: () => true } as any) // meshes dir
        .mockResolvedValueOnce({ isFile: () => true, isDirectory: () => false } as any) // body.nif
        .mockResolvedValueOnce({ isFile: () => true, isDirectory: () => false } as any); // generated.ini

      const result = await validateArchiveToStaging(api, "skyrimse", "test-mod");

      expect(result.valid).toBe(true);
      const extras = result.discrepancies.filter((d) => d.kind === "extra_in_staging");
      expect(extras).toHaveLength(1);
      expect(extras[0].severity).toBe("info");
    });

    it("matches archive backslash paths against staging forward-slash paths", async () => {
      // Archives packed on Windows use backslashes; extraction normalizes to forward-slash
      const api = makeMockApi(["Data\\SKSE\\Plugins\\foo.dll", "Data\\meshes\\body.nif"]);

      mockedGetSafe
        .mockReturnValueOnce(TEST_MOD)
        .mockReturnValueOnce({ localPath: "test-mod.7z", state: "finished" });

      // Staging has forward-slash normalized paths (depth-first walk order)
      mockedFs.readdirAsync
        .mockResolvedValueOnce(["Data"]) // root
        .mockResolvedValueOnce(["SKSE", "meshes"]) // Data/
        .mockResolvedValueOnce(["Plugins"]) // Data/SKSE/
        .mockResolvedValueOnce(["foo.dll"]) // Data/SKSE/Plugins/
        .mockResolvedValueOnce(["body.nif"]); // Data/meshes/

      // Depth-first: Data→SKSE→Plugins→foo.dll, then meshes→body.nif
      mockedFs.lstatAsync
        .mockResolvedValueOnce({ isFile: () => false, isDirectory: () => true } as any) // Data
        .mockResolvedValueOnce({ isFile: () => false, isDirectory: () => true } as any) // SKSE
        .mockResolvedValueOnce({ isFile: () => false, isDirectory: () => true } as any) // Plugins
        .mockResolvedValueOnce({ isFile: () => true, isDirectory: () => false } as any) // foo.dll
        .mockResolvedValueOnce({ isFile: () => false, isDirectory: () => true } as any) // meshes
        .mockResolvedValueOnce({ isFile: () => true, isDirectory: () => false } as any); // body.nif

      const result = await validateArchiveToStaging(api, "skyrimse", "test-mod");

      expect(result.valid).toBe(true);
      expect(result.discrepancies).toHaveLength(0);
    });

    it("matches case-different archive entries against staging after mergeCaseConflictingDirs", async () => {
      // Archive has mixed casing; extraction + mergeCaseConflictingDirs normalizes to one casing
      const api = makeMockApi(["Data/SKSE/Plugins/foo.dll", "Data/Meshes/Body.nif"]);

      mockedGetSafe
        .mockReturnValueOnce(TEST_MOD)
        .mockReturnValueOnce({ localPath: "test-mod.7z", state: "finished" });

      // After mergeCaseConflictingDirs, staging has lowercase (depth-first order)
      mockedFs.readdirAsync
        .mockResolvedValueOnce(["data"]) // root
        .mockResolvedValueOnce(["skse", "meshes"]) // data/
        .mockResolvedValueOnce(["plugins"]) // data/skse/
        .mockResolvedValueOnce(["foo.dll"]) // data/skse/plugins/
        .mockResolvedValueOnce(["body.nif"]); // data/meshes/

      // Depth-first: data→skse→plugins→foo.dll, then meshes→body.nif
      mockedFs.lstatAsync
        .mockResolvedValueOnce({ isFile: () => false, isDirectory: () => true } as any) // data
        .mockResolvedValueOnce({ isFile: () => false, isDirectory: () => true } as any) // skse
        .mockResolvedValueOnce({ isFile: () => false, isDirectory: () => true } as any) // plugins
        .mockResolvedValueOnce({ isFile: () => true, isDirectory: () => false } as any) // foo.dll
        .mockResolvedValueOnce({ isFile: () => false, isDirectory: () => true } as any) // meshes
        .mockResolvedValueOnce({ isFile: () => true, isDirectory: () => false } as any); // body.nif

      // Default caseInsensitive=true should handle this
      const result = await validateArchiveToStaging(api, "skyrimse", "test-mod");

      expect(result.valid).toBe(true);
      expect(result.discrepancies).toHaveLength(0);
    });

    it("reports mismatch when caseInsensitive is explicitly false on Linux-like fs", async () => {
      const api = makeMockApi(["Data/SKSE/Plugins/foo.dll"]);

      mockedGetSafe
        .mockReturnValueOnce(TEST_MOD)
        .mockReturnValueOnce({ localPath: "test-mod.7z", state: "finished" });

      // Staging has different casing
      mockedFs.readdirAsync
        .mockResolvedValueOnce(["data"])
        .mockResolvedValueOnce(["skse"])
        .mockResolvedValueOnce(["plugins"])
        .mockResolvedValueOnce(["foo.dll"]);

      mockedFs.lstatAsync
        .mockResolvedValueOnce({ isFile: () => false, isDirectory: () => true } as any)
        .mockResolvedValueOnce({ isFile: () => false, isDirectory: () => true } as any)
        .mockResolvedValueOnce({ isFile: () => false, isDirectory: () => true } as any)
        .mockResolvedValueOnce({ isFile: () => true, isDirectory: () => false } as any);

      // With caseInsensitive=false, the casing difference is flagged
      const result = await validateArchiveToStaging(api, "skyrimse", "test-mod", {
        caseInsensitive: false,
      });

      expect(result.valid).toBe(false);
      // Archive "Data/SKSE/Plugins/foo.dll" not found in staging as "data/skse/plugins/foo.dll"
      const missing = result.discrepancies.filter((d) => d.kind === "missing_in_staging");
      expect(missing).toHaveLength(1);
      const extra = result.discrepancies.filter((d) => d.kind === "extra_in_staging");
      expect(extra).toHaveLength(1);
    });

    it("handles mixed backslash and case differences together", async () => {
      // Real-world scenario: archive has Windows backslash + mixed case
      // Staging has forward-slash + normalized case from extraction pipeline
      const api = makeMockApi([
        "Data\\SKSE\\Plugins\\EngineFixes.dll",
        "Data\\SKSE\\Plugins\\EngineFixes.toml",
      ]);

      mockedGetSafe
        .mockReturnValueOnce(TEST_MOD)
        .mockReturnValueOnce({ localPath: "test-mod.7z", state: "finished" });

      // After normalizeBackslashPaths + mergeCaseConflictingDirs
      mockedFs.readdirAsync
        .mockResolvedValueOnce(["data"])
        .mockResolvedValueOnce(["skse"])
        .mockResolvedValueOnce(["plugins"])
        .mockResolvedValueOnce(["EngineFixes.dll", "EngineFixes.toml"]);

      mockedFs.lstatAsync
        .mockResolvedValueOnce({ isFile: () => false, isDirectory: () => true } as any)
        .mockResolvedValueOnce({ isFile: () => false, isDirectory: () => true } as any)
        .mockResolvedValueOnce({ isFile: () => false, isDirectory: () => true } as any)
        .mockResolvedValueOnce({ isFile: () => true, isDirectory: () => false } as any)
        .mockResolvedValueOnce({ isFile: () => true, isDirectory: () => false } as any);

      const result = await validateArchiveToStaging(api, "skyrimse", "test-mod");

      expect(result.valid).toBe(true);
      expect(result.discrepancies).toHaveLength(0);
    });

    it("filters directory-only entries from archive listing", async () => {
      // Archives often include directory entries (trailing / or \) that aren't real files
      const api = makeMockApi([
        "Data/",
        "Data\\",
        "Data/SKSE/",
        "Data/SKSE/Plugins/",
        "Data/SKSE/Plugins/foo.dll",
      ]);

      mockedGetSafe
        .mockReturnValueOnce(TEST_MOD)
        .mockReturnValueOnce({ localPath: "test-mod.7z", state: "finished" });

      // Staging only has the actual file
      mockedFs.readdirAsync
        .mockResolvedValueOnce(["Data"])
        .mockResolvedValueOnce(["SKSE"])
        .mockResolvedValueOnce(["Plugins"])
        .mockResolvedValueOnce(["foo.dll"]);

      mockedFs.lstatAsync
        .mockResolvedValueOnce({ isFile: () => false, isDirectory: () => true } as any)
        .mockResolvedValueOnce({ isFile: () => false, isDirectory: () => true } as any)
        .mockResolvedValueOnce({ isFile: () => false, isDirectory: () => true } as any)
        .mockResolvedValueOnce({ isFile: () => true, isDirectory: () => false } as any);

      const result = await validateArchiveToStaging(api, "skyrimse", "test-mod");

      expect(result.valid).toBe(true);
      expect(result.discrepancies).toHaveLength(0);
    });

    it("reports all archive files as missing when staging dir is empty", async () => {
      const api = makeMockApi(["meshes/body.nif", "textures/skin.dds", "mod.esp"]);

      mockedGetSafe
        .mockReturnValueOnce(TEST_MOD)
        .mockReturnValueOnce({ localPath: "test-mod.7z", state: "finished" });

      // Staging dir exists but is empty (stale staging dir scenario)
      mockedFs.readdirAsync.mockResolvedValueOnce([]);

      const result = await validateArchiveToStaging(api, "skyrimse", "test-mod");

      expect(result.valid).toBe(false);
      const missing = result.discrepancies.filter((d) => d.kind === "missing_in_staging");
      expect(missing).toHaveLength(3);
      expect(missing.every((d) => d.severity === "error")).toBe(true);
    });

    it("respects AbortSignal", async () => {
      const api = makeMockApi(["file1.esp"]);
      const controller = new AbortController();
      controller.abort();

      mockedGetSafe
        .mockReturnValueOnce(TEST_MOD)
        .mockReturnValueOnce({ localPath: "test-mod.7z", state: "finished" });

      mockedFs.readdirAsync.mockResolvedValueOnce(["file1.esp"]);
      mockedFs.lstatAsync.mockResolvedValueOnce({
        isFile: () => true,
        isDirectory: () => false,
      } as any);

      await expect(
        validateArchiveToStaging(api, "skyrimse", "test-mod", {
          signal: controller.signal,
        }),
      ).rejects.toThrow("Validation cancelled");
    });
  });

  describe("validateStagingToDeployed", () => {
    it("reports valid when all deployed links are intact", async () => {
      const api = makeMockApi();

      mockedGetSafe
        .mockReturnValueOnce(TEST_MOD) // mod lookup
        .mockReturnValueOnce({ path: "/games/skyrimse" }); // discovery

      mockedGetManifest.mockResolvedValueOnce({
        version: 1,
        instance: "test",
        files: [
          { relPath: "mod.esp", source: "test-mod-001", time: 1000 },
          { relPath: "mod.bsa", source: "test-mod-001", time: 1000 },
        ],
      } as any);

      const inodes: Record<string, number> = {
        "mod.esp": 100,
        "mod.bsa": 200,
      };
      mockedFs.lstatAsync.mockImplementation((filePath: string) => {
        const basename = filePath.split("/").pop()!;
        const ino = inodes[basename] ?? 999;
        return Promise.resolve({ nlink: 2, ino } as any);
      });

      const result = await validateStagingToDeployed(api, "skyrimse", "test-mod");

      expect(result.valid).toBe(true);
      expect(result.discrepancies).toHaveLength(0);
    });

    it("reports missing_in_deployment when file is gone", async () => {
      const api = makeMockApi();

      mockedGetSafe.mockReturnValueOnce(TEST_MOD).mockReturnValueOnce({ path: "/games/skyrimse" });

      mockedGetManifest.mockResolvedValueOnce({
        version: 1,
        instance: "test",
        files: [{ relPath: "mod.esp", source: "test-mod-001", time: 1000 }],
      } as any);

      // Source exists in staging, but deployed file is missing from game dir
      const stagingRoot = "/staging/skyrimse";
      const deployRoot = "/games/skyrimse/Data";
      mockedFs.lstatAsync.mockImplementation((filePath: string) => {
        if (filePath.startsWith(stagingRoot)) {
          return Promise.resolve({ nlink: 1, ino: 100 } as any);
        }
        if (filePath.startsWith(deployRoot)) {
          return Promise.reject(new Error("ENOENT"));
        }
        return Promise.reject(new Error("ENOENT"));
      });

      const result = await validateStagingToDeployed(api, "skyrimse", "test-mod");

      expect(result.valid).toBe(false);
      expect(result.discrepancies[0].kind).toBe("missing_in_deployment");
    });

    it("reports link_broken when inode mismatches", async () => {
      const api = makeMockApi();

      mockedGetSafe.mockReturnValueOnce(TEST_MOD).mockReturnValueOnce({ path: "/games/skyrimse" });

      mockedGetManifest.mockResolvedValueOnce({
        version: 1,
        instance: "test",
        files: [{ relPath: "mod.esp", source: "test-mod-001", time: 1000 }],
      } as any);

      // Both files exist but inodes differ (link is broken)
      const stagingRoot = "/staging/skyrimse";
      const deployRoot = "/games/skyrimse/Data";
      mockedFs.lstatAsync.mockImplementation((filePath: string) => {
        if (filePath.startsWith(stagingRoot)) {
          return Promise.resolve({ nlink: 2, ino: 100 } as any);
        }
        if (filePath.startsWith(deployRoot)) {
          return Promise.resolve({ nlink: 1, ino: 999 } as any);
        }
        return Promise.reject(new Error("ENOENT"));
      });

      const result = await validateStagingToDeployed(api, "skyrimse", "test-mod");

      expect(result.valid).toBe(true); // link_broken is warning, not error
      expect(result.discrepancies[0].kind).toBe("link_broken");
      expect(result.discrepancies[0].severity).toBe("warning");
    });

    it("normalizes backslash relPaths from Wine/Proton-era manifests", async () => {
      const api = makeMockApi();

      mockedGetSafe.mockReturnValueOnce(TEST_MOD).mockReturnValueOnce({ path: "/games/skyrimse" });

      // Wine/Proton manifests may store relPath with Windows backslashes
      mockedGetManifest.mockResolvedValueOnce({
        version: 1,
        instance: "test",
        files: [{ relPath: "Data\\SKSE\\Plugins\\foo.dll", source: "test-mod-001", time: 1000 }],
      } as any);

      // The normalized path (forward slashes) should be used for path.join
      const stagingRoot = "/staging/skyrimse";
      const deployRoot = "/games/skyrimse/Data";
      mockedFs.lstatAsync.mockImplementation((filePath: string) => {
        // Both paths should use forward slashes after normalization
        if (
          filePath === `${stagingRoot}/test-mod-001/Data/SKSE/Plugins/foo.dll` ||
          filePath === `${deployRoot}/Data/SKSE/Plugins/foo.dll`
        ) {
          return Promise.resolve({ nlink: 2, ino: 100 } as any);
        }
        // Reject paths that still contain backslashes (normalization failed)
        if (filePath.includes("\\")) {
          return Promise.reject(new Error("ENOENT - backslash path not normalized"));
        }
        return Promise.resolve({ nlink: 2, ino: 100 } as any);
      });

      const result = await validateStagingToDeployed(api, "skyrimse", "test-mod");

      expect(result.valid).toBe(true);
      expect(result.discrepancies).toHaveLength(0);
      // Verify the discrepancy filePath is also normalized
    });

    it("reports source_missing when staging file is gone", async () => {
      const api = makeMockApi();

      mockedGetSafe.mockReturnValueOnce(TEST_MOD).mockReturnValueOnce({ path: "/games/skyrimse" });

      mockedGetManifest.mockResolvedValueOnce({
        version: 1,
        instance: "test",
        files: [{ relPath: "mod.esp", source: "test-mod-001", time: 1000 }],
      } as any);

      // Source missing from staging, deployed exists
      const stagingRoot = "/staging/skyrimse";
      mockedFs.lstatAsync.mockImplementation((filePath: string) => {
        if (filePath.startsWith(stagingRoot)) {
          return Promise.reject(new Error("ENOENT"));
        }
        return Promise.resolve({ nlink: 1, ino: 100 } as any);
      });

      const result = await validateStagingToDeployed(api, "skyrimse", "test-mod");

      expect(result.valid).toBe(false);
      expect(result.discrepancies[0].kind).toBe("source_missing");
    });
  });

  describe("validateModInstallation", () => {
    it("combines both validation phases", async () => {
      const api = makeMockApi(["mod.esp"]);

      // First call for archive→staging
      mockedGetSafe
        .mockReturnValueOnce(TEST_MOD)
        .mockReturnValueOnce({ localPath: "test-mod.7z", state: "finished" });

      // Staging walk: directory contains mod.esp
      mockedFs.readdirAsync.mockResolvedValueOnce(["mod.esp"]);

      // Second call for staging→deployed
      mockedGetSafe.mockReturnValueOnce(TEST_MOD).mockReturnValueOnce({ path: "/games/skyrimse" });

      mockedGetManifest.mockResolvedValueOnce({
        version: 1,
        instance: "test",
        files: [{ relPath: "mod.esp", source: "test-mod-001", time: 1000 }],
      } as any);

      // Unified lstat mock: files are regular files, hardlinks valid
      mockedFs.lstatAsync.mockImplementation(() => {
        return Promise.resolve({
          nlink: 2,
          ino: 100,
          isFile: () => true,
          isDirectory: () => false,
        } as any);
      });

      const result = await validateModInstallation(api, "skyrimse", "test-mod");

      expect(result.valid).toBe(true);
      expect(result.discrepancies).toHaveLength(0);
    });
  });
});
