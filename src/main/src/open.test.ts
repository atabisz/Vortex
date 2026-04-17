import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("electron", () => ({
  shell: {
    openExternal: vi.fn(),
  },
  BrowserWindow: {
    getAllWindows: vi.fn(),
  },
}));

vi.mock("./ipc", () => ({
  betterIpcMain: {
    send: vi.fn(),
  },
}));

vi.mock("./logging", () => ({
  log: vi.fn(),
}));

import { shell, BrowserWindow } from "electron";
import { betterIpcMain } from "./ipc";
import { openUrl } from "./open";

describe("openUrl", () => {
  const mockWebContents = { id: 1 };
  const mockWindow = {
    isDestroyed: vi.fn().mockReturnValue(false),
    webContents: mockWebContents,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(BrowserWindow.getAllWindows).mockReturnValue(
      [mockWindow] as any,
    );
  });

  it("pushes shell:openUrlFailed to all windows when openExternal rejects", async () => {
    vi.mocked(shell.openExternal).mockRejectedValue(
      new Error("no browser"),
    );

    openUrl(new URL("https://example.com"));
    await vi.waitFor(() => {
      expect(betterIpcMain.send).toHaveBeenCalledWith(
        mockWebContents,
        "shell:openUrlFailed",
        "https://example.com/",
      );
    });
  });

  it("does not push when openExternal resolves", async () => {
    vi.mocked(shell.openExternal).mockResolvedValue();

    openUrl(new URL("https://example.com"));
    await new Promise((r) => setTimeout(r, 50));
    expect(betterIpcMain.send).not.toHaveBeenCalled();
  });

  it("skips destroyed windows", async () => {
    vi.mocked(shell.openExternal).mockRejectedValue(
      new Error("no browser"),
    );
    mockWindow.isDestroyed.mockReturnValue(true);

    openUrl(new URL("https://example.com"));
    await vi.waitFor(() => {
      expect(betterIpcMain.send).not.toHaveBeenCalled();
    });
  });
});
