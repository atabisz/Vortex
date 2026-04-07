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
    default: {
      ...base,
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
});
