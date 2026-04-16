import { afterEach, beforeEach, describe, expect, it } from "vitest";
import getText from "./texts";

// texts.ts only imports TFunction — no heavy mocks needed
const mockT = ((s: string) => s) as any;

describe("texts platform-specific path examples", () => {
  let originalPlatform: PropertyDescriptor;

  beforeEach(() => {
    originalPlatform = Object.getOwnPropertyDescriptor(
      process,
      "platform",
    )!;
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

  // RED TEST: downloadspath returns Linux path example on linux.
  // This test FAILS because the current code always returns the Windows text
  // (no platform branch for downloadspath).
  it("downloadspath returns Linux path example on linux", () => {
    setPlatform("linux");
    const result = getText("downloadspath", mockT);
    expect(result).toBeDefined();
    expect(result).toContain("~/.local/share/Vortex/downloads");
  });

  // GREEN REGRESSION GUARD: downloadspath returns Windows path example on win32.
  // This test should PASS with current code.
  it("downloadspath returns Windows path example on win32", () => {
    setPlatform("win32");
    const result = getText("downloadspath", mockT);
    expect(result).toBeDefined();
    expect(result).toContain("C:\\Users\\Mike");
  });

  // RED TEST: modspath returns Linux path example on linux.
  // This test FAILS because the current code always returns the Windows text
  // (no platform branch for modspath).
  it("modspath returns Linux path example on linux", () => {
    setPlatform("linux");
    const result = getText("modspath", mockT);
    expect(result).toBeDefined();
    expect(result).toContain("~/.local/share/Vortex/mods");
  });

  // GREEN REGRESSION GUARD: modspath returns Windows path example on win32.
  // This test should PASS with current code.
  it("modspath returns Windows path example on win32", () => {
    setPlatform("win32");
    const result = getText("modspath", mockT);
    expect(result).toBeDefined();
    expect(result).toContain("d:\\vortex_mods");
  });
});
