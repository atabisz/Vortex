import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

let mockData: Buffer;

// Mock resolvePathCase before fs.ts loads (vi.mock is hoisted)
vi.mock("./resolvePathCase", () => ({
  resolvePathCase: vi.fn(),
}));

vi.mock("fs-extra", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  // fs-extra is CJS, so named exports may be on the default export
  const base = (actual.default ?? actual) as Record<string, unknown>;
  return {
    ...base,
    copy: vi.fn().mockResolvedValue(undefined),
    rename: vi.fn().mockResolvedValue(undefined),
    ensureDir: vi.fn().mockResolvedValue(undefined),
    link: vi.fn().mockResolvedValue(undefined),
    stat: vi.fn().mockResolvedValue({ ino: 1n }),
    default: {
      ...base,
      copy: vi.fn().mockResolvedValue(undefined),
      rename: vi.fn().mockResolvedValue(undefined),
      ensureDir: vi.fn().mockResolvedValue(undefined),
      link: vi.fn().mockResolvedValue(undefined),
      stat: vi.fn().mockResolvedValue({ ino: 1n }),
      readFile: (...args: unknown[]) => {
        if (args.length <= 1 || typeof args[args.length - 1] !== "function") {
          return Promise.resolve(mockData);
        }
        // callback style
        (args[args.length - 1] as (err: null, data: Buffer) => void)(
          null,
          mockData,
        );
      },
    },
    readFile: (...args: unknown[]) => {
      if (args.length <= 1 || typeof args[args.length - 1] !== "function") {
        return Promise.resolve(mockData);
      }
      (args[args.length - 1] as (err: null, data: Buffer) => void)(
        null,
        mockData,
      );
    },
  };
});

import { resolvePathCase } from "./resolvePathCase";
import * as fs from "./fs";

describe("readFileBOM", () => {
  it("supports files without BOM", async () => {
    mockData = Buffer.from([0x66, 0x6f, 0x6f]);
    await expect(fs.readFileBOM("", "utf8")).resolves.toBe("foo");
    await expect(fs.readFileBOM("", "utf8")).resolves.toBe("foo");
  });
  it("supports utf8 BOM", async () => {
    mockData = Buffer.from([0xef, 0xbb, 0xbf, 0x66, 0x6f, 0x6f]);
    await expect(fs.readFileBOM("", "utf8")).resolves.toBe("foo");
  });
  it("supports utf16 big endian BOM", async () => {
    mockData = Buffer.from([0xfe, 0xff, 0x00, 0x66, 0x00, 0x6f, 0x00, 0x6f]);
    await expect(fs.readFileBOM("", "utf8")).resolves.toBe("foo");
  });
  it("supports utf16 little endian BOM", async () => {
    mockData = Buffer.from([0xff, 0xfe, 0x66, 0x00, 0x6f, 0x00, 0x6f, 0x00]);
    await expect(fs.readFileBOM("", "utf8")).resolves.toBe("foo");
  });
  it("supports utf32 big endian BOM", async () => {
    mockData = Buffer.from([
      0x00, 0x00, 0xfe, 0xff, 0x00, 0x00, 0x00, 0x66, 0x00, 0x00, 0x00, 0x6f,
      0x00, 0x00, 0x00, 0x6f,
    ]);
    await expect(fs.readFileBOM("", "utf8")).resolves.toBe("foo");
  });
  it("supports utf32 little endian BOM", async () => {
    mockData = Buffer.from([
      0xff, 0xfe, 0x00, 0x00, 0x66, 0x00, 0x00, 0x00, 0x6f, 0x00, 0x00, 0x00,
      0x6f, 0x00, 0x00, 0x00,
    ]);
    await expect(fs.readFileBOM("", "utf8")).resolves.toBe("foo");
  });
});

// Wine prefix path used in tests
const WINE_PATH =
  "/home/user/.steam/steam/steamapps/compatdata/489830/pfx/drive_c/Users/steamuser/AppData/Local/Skyrim Special Edition/plugins.txt";
const NORMAL_PATH = "/home/user/.config/game/settings.ini";

describe("fs.ts Wine prefix case-folding shim", () => {
  let originalPlatform: PropertyDescriptor;

  beforeEach(() => {
    originalPlatform = Object.getOwnPropertyDescriptor(process, "platform")!;
    vi.clearAllMocks();
    // Default: resolvePathCase returns a resolved path
    vi.mocked(resolvePathCase).mockImplementation(
      async (dir: string, base: string) => dir + "/" + base,
    );
    // Restore mockData so readFileBOM tests don't interfere
    mockData = Buffer.from([]);
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

  describe("readFileAsync", () => {
    it("calls resolvePathCase for Wine prefix paths on Linux", async () => {
      setPlatform("linux");
      await fs.readFileAsync(WINE_PATH).catch(() => {});
      expect(vi.mocked(resolvePathCase)).toHaveBeenCalled();
    });

    it("does NOT call resolvePathCase for non-Wine paths on Linux", async () => {
      setPlatform("linux");
      await fs.readFileAsync(NORMAL_PATH).catch(() => {});
      expect(vi.mocked(resolvePathCase)).not.toHaveBeenCalled();
    });

    it("does NOT call resolvePathCase on Windows", async () => {
      setPlatform("win32");
      // On Windows, compatdata/pfx won't appear in normal paths but the guard
      // checks process.platform first, so any path should skip case-folding.
      await fs.readFileAsync(NORMAL_PATH).catch(() => {});
      expect(vi.mocked(resolvePathCase)).not.toHaveBeenCalled();
    });
  });

  describe("writeFileAsync", () => {
    it("calls resolvePathCase for Wine prefix paths on Linux", async () => {
      setPlatform("linux");
      await fs.writeFileAsync(WINE_PATH, "data").catch(() => {});
      expect(vi.mocked(resolvePathCase)).toHaveBeenCalled();
    });

    it("does NOT call resolvePathCase for non-Wine paths on Linux", async () => {
      setPlatform("linux");
      await fs.writeFileAsync(NORMAL_PATH, "data").catch(() => {});
      expect(vi.mocked(resolvePathCase)).not.toHaveBeenCalled();
    });
  });

  describe("statAsync", () => {
    it("calls resolvePathCase for Wine prefix paths on Linux", async () => {
      setPlatform("linux");
      await fs.statAsync(WINE_PATH).catch(() => {});
      expect(vi.mocked(resolvePathCase)).toHaveBeenCalled();
    });

    it("does NOT call resolvePathCase for non-Wine paths on Linux", async () => {
      setPlatform("linux");
      await fs.statAsync(NORMAL_PATH).catch(() => {});
      expect(vi.mocked(resolvePathCase)).not.toHaveBeenCalled();
    });
  });

  describe("copyAsync", () => {
    it("calls resolvePathCase for Wine prefix src on Linux", async () => {
      setPlatform("linux");
      await fs.copyAsync(WINE_PATH, "/tmp/dest", { noSelfCopy: true }).catch(
        () => {},
      );
      expect(vi.mocked(resolvePathCase)).toHaveBeenCalled();
    });

    it("does NOT call resolvePathCase for non-Wine src on Linux", async () => {
      setPlatform("linux");
      await fs.copyAsync(NORMAL_PATH, "/tmp/dest", { noSelfCopy: true }).catch(
        () => {},
      );
      expect(vi.mocked(resolvePathCase)).not.toHaveBeenCalled();
    });

    it("does NOT call resolvePathCase on Windows", async () => {
      setPlatform("win32");
      await fs.copyAsync(WINE_PATH, "/tmp/dest", { noSelfCopy: true }).catch(
        () => {},
      );
      expect(vi.mocked(resolvePathCase)).not.toHaveBeenCalled();
    });
  });

  describe("renameAsync", () => {
    it("calls resolvePathCase for Wine prefix sourcePath on Linux", async () => {
      setPlatform("linux");
      await fs.renameAsync(WINE_PATH, "/tmp/dest").catch(() => {});
      expect(vi.mocked(resolvePathCase)).toHaveBeenCalled();
    });

    it("does NOT call resolvePathCase for non-Wine sourcePath on Linux", async () => {
      setPlatform("linux");
      await fs.renameAsync(NORMAL_PATH, "/tmp/dest").catch(() => {});
      expect(vi.mocked(resolvePathCase)).not.toHaveBeenCalled();
    });

    it("does NOT call resolvePathCase on Windows", async () => {
      setPlatform("win32");
      await fs.renameAsync(WINE_PATH, "/tmp/dest").catch(() => {});
      expect(vi.mocked(resolvePathCase)).not.toHaveBeenCalled();
    });
  });

  describe("ensureDirAsync", () => {
    it("calls resolvePathCase for Wine prefix dirPath on Linux", async () => {
      setPlatform("linux");
      await fs
        .ensureDirAsync(WINE_PATH)
        .catch(() => {});
      expect(vi.mocked(resolvePathCase)).toHaveBeenCalled();
    });

    it("does NOT call resolvePathCase for non-Wine dirPath on Linux", async () => {
      setPlatform("linux");
      await fs.ensureDirAsync(NORMAL_PATH).catch(() => {});
      expect(vi.mocked(resolvePathCase)).not.toHaveBeenCalled();
    });

    it("does NOT call resolvePathCase on Windows", async () => {
      setPlatform("win32");
      await fs.ensureDirAsync(WINE_PATH).catch(() => {});
      expect(vi.mocked(resolvePathCase)).not.toHaveBeenCalled();
    });
  });
});

describe("raiseUACDialog platform-guarded message (static)", () => {
  // Verify the source file contains both platform arms.
  // This is a static analysis test — the ternary is trivially correct
  // and testing it at runtime would require exporting a private function
  // or mocking showMessageBox + forcePerm chain.
  // NOTE: import.meta.url is not file:// in happy-dom; use path.resolve instead.

  it("source contains Linux arm with pkexec-appropriate copy", async () => {
    const { readFileSync } = await import("node:fs");
    const { resolve } = await import("node:path");
    const source = readFileSync(
      resolve(__dirname, "./fs.ts"),
      "utf-8",
    );
    expect(source).toContain("You will be asked for your password.");
    expect(source).toContain('process.platform === "linux"');
  });

  it("source preserves Windows arm unchanged", async () => {
    const { readFileSync } = await import("node:fs");
    const { resolve } = await import("node:path");
    const source = readFileSync(
      resolve(__dirname, "./fs.ts"),
      "utf-8",
    );
    expect(source).toContain("Windows will show an UAC dialog.");
  });
});

describe("confirmElevate platform-guarded strings (static)", () => {
  it("source contains Linux arm for dialog text", async () => {
    const { readFileSync } = await import("node:fs");
    const { resolve } = await import("node:path");
    const source = readFileSync(
      resolve(
        __dirname,
        "../extensions/download_management/views/Settings.tsx",
      ),
      "utf-8",
    );
    expect(source).toContain(
      "This directory is not writable. Vortex can create it with elevated permissions.",
    );
    expect(source).toContain('process.platform === "linux"');
  });

  it("source preserves Windows arm unchanged", async () => {
    const { readFileSync } = await import("node:fs");
    const { resolve } = await import("node:path");
    const source = readFileSync(
      resolve(
        __dirname,
        "../extensions/download_management/views/Settings.tsx",
      ),
      "utf-8",
    );
    expect(source).toContain(
      "This directory is not writable to the current windows user account.",
    );
  });

  it("source contains Linux arm for button label", async () => {
    const { readFileSync } = await import("node:fs");
    const { resolve } = await import("node:path");
    const source = readFileSync(
      resolve(
        __dirname,
        "../extensions/download_management/views/Settings.tsx",
      ),
      "utf-8",
    );
    expect(source).toContain("Create with elevated permissions");
    expect(source).toContain("Create as Administrator");
  });
});
