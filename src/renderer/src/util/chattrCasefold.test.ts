import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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
    ensureDir: vi.fn().mockResolvedValue(undefined),
    default: {
      ...base,
      ensureDir: vi.fn().mockResolvedValue(undefined),
    },
  };
});

// Mock node:fs/promises for statfs, readdir, writeFile, access, unlink
vi.mock("node:fs/promises", async (importOriginal) => {
  const actual = await importOriginal<
    typeof import("node:fs/promises")
  >();
  return {
    ...actual,
    statfs: vi.fn(),
    readdir: vi.fn(),
    writeFile: vi.fn(),
    access: vi.fn(),
    unlink: vi.fn().mockResolvedValue(undefined),
  };
});

import * as fsPromises from "node:fs/promises";
import * as fs from "./fs";

describe("applyChattrCasefold", () => {
  let originalPlatform: PropertyDescriptor;
  const TEST_DIR = "/staging/mods";

  beforeEach(() => {
    originalPlatform = Object.getOwnPropertyDescriptor(process, "platform")!;
    fs._resetChattrState();
    vi.clearAllMocks();

    // Default: linux platform, empty dir, ext4, chattr available + succeeds,
    // casefold verify succeeds. Override per test as needed.
    setPlatform("linux");
    vi.mocked(fsPromises.readdir).mockResolvedValue([] as any);
    vi.mocked(fsPromises.statfs).mockResolvedValue({ type: 0xef53 } as any);
    vi.mocked(fsPromises.writeFile).mockResolvedValue(undefined);
    vi.mocked(fsPromises.access).mockResolvedValue(undefined);
    vi.mocked(fsPromises.unlink).mockResolvedValue(undefined);
  });

  afterEach(() => {
    Object.defineProperty(process, "platform", originalPlatform);
    delete process.env.FLATPAK_ID;
    // Reset chattr to a no-op so tests don't leave a broken mock installed
    fs._setChattr((_cmd, _args, cb) => cb(null, "", ""));
    fs._setChattrNotifier(undefined);
  });

  function setPlatform(platform: string) {
    Object.defineProperty(process, "platform", {
      value: platform,
      writable: true,
      configurable: true,
    });
  }

  // CASE-08: Windows platform guard
  it("resolves without calling chattr when platform is win32", async () => {
    setPlatform("win32");
    const mockChattr = vi.fn();
    fs._setChattr(mockChattr);

    await expect(fs.applyChattrCasefold(TEST_DIR)).resolves.toBeUndefined();
    expect(mockChattr).not.toHaveBeenCalled();
  });

  // CASE-09: Flatpak guard
  it("resolves without calling chattr when FLATPAK_ID is set", async () => {
    setPlatform("linux");
    process.env.FLATPAK_ID = "org.test.App";
    const mockChattr = vi.fn();
    fs._setChattr(mockChattr);

    await expect(fs.applyChattrCasefold(TEST_DIR)).resolves.toBeUndefined();
    expect(mockChattr).not.toHaveBeenCalled();
  });

  // CASE-05/CASE-06: Non-ext4 filesystem — no chattr
  it("resolves without calling chattr when statfs type is not ext4", async () => {
    vi.mocked(fsPromises.statfs).mockResolvedValue({ type: 0x9123683e } as any); // btrfs
    const mockChattr = vi.fn();
    fs._setChattr(mockChattr);

    await expect(fs.applyChattrCasefold(TEST_DIR)).resolves.toBeUndefined();
    expect(mockChattr).not.toHaveBeenCalled();
  });

  // CASE-06: Non-empty directory guard
  it("resolves without calling chattr when directory is non-empty", async () => {
    vi.mocked(fsPromises.readdir).mockResolvedValue(["mod.esm"] as any);
    const mockChattr = vi.fn();
    fs._setChattr(mockChattr);

    await expect(fs.applyChattrCasefold(TEST_DIR)).resolves.toBeUndefined();
    expect(mockChattr).not.toHaveBeenCalled();
  });

  // CASE-06: Happy path — chattr is called on ext4 + empty dir + linux + no Flatpak
  it("calls chattr +F when ext4 empty dir linux no Flatpak", async () => {
    // which succeeds, chattr succeeds
    const mockChattr = vi.fn().mockImplementation(
      (
        cmd: string,
        _args: string[],
        cb: (err: Error | null, stdout: string, stderr: string) => void,
      ) => {
        cb(null, "", ""); // success for both which and chattr
      },
    );
    fs._setChattr(mockChattr);

    await expect(fs.applyChattrCasefold(TEST_DIR)).resolves.toBeUndefined();
    // which call + chattr +F call
    expect(mockChattr).toHaveBeenCalledTimes(2);
    expect(mockChattr).toHaveBeenNthCalledWith(
      1,
      "which",
      ["chattr"],
      expect.any(Function),
    );
    expect(mockChattr).toHaveBeenNthCalledWith(
      2,
      "chattr",
      ["+F", TEST_DIR],
      expect.any(Function),
    );
  });

  // CASE-07: chattr exits code 1 (EOPNOTSUPP) — silent fallback, never rejects
  it("resolves (no rejection) when chattr exits with error code", async () => {
    const chattrError = new Error("chattr: Operation not supported");
    (chattrError as NodeJS.ErrnoException).code = "1" as any;

    fs._setChattr(
      (
        cmd: string,
        _args: string[],
        cb: (err: Error | null, stdout: string, stderr: string) => void,
      ) => {
        if (cmd === "which") {
          cb(null, "/usr/bin/chattr", "");
        } else {
          cb(chattrError, "", "chattr: Operation not supported");
        }
      },
    );

    await expect(fs.applyChattrCasefold(TEST_DIR)).resolves.toBeUndefined();
  });

  // CASE-07: which-chattr not found — silent fallback, never rejects
  it("resolves when which-chattr is not found", async () => {
    const whichError = new Error("which: no chattr in PATH");

    fs._setChattr(
      (
        _cmd: string,
        _args: string[],
        cb: (err: Error | null, stdout: string, stderr: string) => void,
      ) => {
        cb(whichError, "", "");
      },
    );

    await expect(fs.applyChattrCasefold(TEST_DIR)).resolves.toBeUndefined();
  });

  // CASE-10: After chattr exit 0, verify writes uppercase and reads lowercase
  it("calls writeFile and access for casefold verify after chattr exit 0", async () => {
    // which + chattr both succeed
    fs._setChattr(
      (
        _cmd: string,
        _args: string[],
        cb: (err: Error | null, stdout: string, stderr: string) => void,
      ) => cb(null, "", ""),
    );

    await expect(fs.applyChattrCasefold(TEST_DIR)).resolves.toBeUndefined();

    // writeFile should have been called with uppercase filename
    expect(fsPromises.writeFile).toHaveBeenCalledWith(
      expect.stringContaining("__VORTEX_CASEFOLD_VERIFY"),
      "",
    );
    // access should have been called with lowercase filename
    expect(fsPromises.access).toHaveBeenCalledWith(
      expect.stringContaining("__vortex_casefold_verify"),
    );
  });

  // CASE-10: After chattr exit 0 + verify success → logs INFO
  it("resolves successfully after chattr exit 0 and verify success", async () => {
    fs._setChattr(
      (
        _cmd: string,
        _args: string[],
        cb: (err: Error | null, stdout: string, stderr: string) => void,
      ) => cb(null, "", ""),
    );
    vi.mocked(fsPromises.access).mockResolvedValue(undefined); // verify succeeds

    await expect(fs.applyChattrCasefold(TEST_DIR)).resolves.toBeUndefined();
  });

  // CASE-10: After chattr exit 0 + verify fail (ENOENT) — still resolves
  it("resolves when chattr exit 0 but verify fails (ENOENT)", async () => {
    fs._setChattr(
      (
        _cmd: string,
        _args: string[],
        cb: (err: Error | null, stdout: string, stderr: string) => void,
      ) => cb(null, "", ""),
    );
    const enoentError = Object.assign(new Error("ENOENT"), { code: "ENOENT" });
    vi.mocked(fsPromises.access).mockRejectedValue(enoentError);

    await expect(fs.applyChattrCasefold(TEST_DIR)).resolves.toBeUndefined();
  });

  // CASE-11: EOPNOTSUPP on ext4 fires notification exactly once per session
  it("fires notification exactly once on EOPNOTSUPP-on-ext4", async () => {
    const chattrError = Object.assign(new Error("Operation not supported"), {
      code: 1,
    });
    fs._setChattr(
      (
        cmd: string,
        _args: string[],
        cb: (err: Error | null, stdout: string, stderr: string) => void,
      ) => {
        if (cmd === "which") {
          cb(null, "", "");
        } else {
          cb(chattrError, "", "");
        }
      },
    );

    const notifier = vi.fn();
    fs._setChattrNotifier(notifier);

    await fs.applyChattrCasefold(TEST_DIR);

    expect(notifier).toHaveBeenCalledTimes(1);
    expect(notifier).toHaveBeenCalledWith(
      expect.objectContaining({ type: "info" }),
    );
  });

  // CASE-11: Second EOPNOTSUPP call does NOT fire notification again
  it("does NOT fire notification on second EOPNOTSUPP call (session dedup)", async () => {
    const chattrError = Object.assign(new Error("Operation not supported"), {
      code: 1,
    });
    fs._setChattr(
      (
        cmd: string,
        _args: string[],
        cb: (err: Error | null, stdout: string, stderr: string) => void,
      ) => {
        if (cmd === "which") {
          cb(null, "", "");
        } else {
          cb(chattrError, "", "");
        }
      },
    );

    const notifier = vi.fn();
    fs._setChattrNotifier(notifier);

    // Clear statfs cache between calls by calling a second dir
    await fs.applyChattrCasefold(TEST_DIR);
    await fs.applyChattrCasefold(TEST_DIR + "/second");

    // Notification should only have fired once total, not twice
    expect(notifier).toHaveBeenCalledTimes(1);
  });

  // CASE-11: non-ext4 EOPNOTSUPP does NOT fire notification
  it("does NOT fire notification on non-ext4 filesystem", async () => {
    vi.mocked(fsPromises.statfs).mockResolvedValue({ type: 0x9123683e } as any); // btrfs
    const chattrError = Object.assign(new Error("Operation not supported"), {
      code: 1,
    });
    fs._setChattr(
      (
        _cmd: string,
        _args: string[],
        cb: (err: Error | null, stdout: string, stderr: string) => void,
      ) => cb(chattrError, "", ""),
    );

    const notifier = vi.fn();
    fs._setChattrNotifier(notifier);

    await fs.applyChattrCasefold(TEST_DIR);

    expect(notifier).not.toHaveBeenCalled();
  });
});
