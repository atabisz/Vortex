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

// eslint-disable-next-line @typescript-eslint/unbound-method
const { getAllWindows } = BrowserWindow;
// eslint-disable-next-line @typescript-eslint/unbound-method
const { openExternal } = shell;
const { send: ipcSend } = betterIpcMain;

describe("openUrl", () => {
  const mockIsDestroyed = vi.fn().mockReturnValue(false);
  const mockWebContents = { id: 1 };
  const mockWindow = {
    isDestroyed: mockIsDestroyed,
    webContents: mockWebContents,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getAllWindows).mockReturnValue(
      [mockWindow] as unknown as ReturnType<typeof getAllWindows>,
    );
  });

  it("pushes shell:openUrlFailed to all windows when openExternal rejects", async () => {
    vi.mocked(openExternal).mockRejectedValue(new Error("no browser"));

    openUrl(new URL("https://example.com"));
    await vi.waitFor(() => {
      expect(vi.mocked(ipcSend)).toHaveBeenCalledWith(
        mockWebContents,
        "shell:openUrlFailed",
        "https://example.com/",
      );
    });
  });

  it("does not push when openExternal resolves", async () => {
    vi.mocked(openExternal).mockResolvedValue();

    openUrl(new URL("https://example.com"));
    await new Promise((r) => setTimeout(r, 50));
    expect(vi.mocked(ipcSend)).not.toHaveBeenCalled();
  });

  it("skips destroyed windows", async () => {
    vi.mocked(openExternal).mockRejectedValue(new Error("no browser"));
    mockIsDestroyed.mockReturnValue(true);

    openUrl(new URL("https://example.com"));
    await vi.waitFor(() => {
      expect(vi.mocked(ipcSend)).not.toHaveBeenCalled();
    });
  });
});
