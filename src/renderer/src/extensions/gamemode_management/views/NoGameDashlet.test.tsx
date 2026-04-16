import type * as ReactTypes from "react";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockEmit = vi.fn();

vi.mock("../../../controls/ComponentEx", async () => {
  const React = await vi.importActual<typeof ReactTypes>("react");
  class ComponentExMock extends React.Component<any, any> {
    static contextType = undefined;
    context: any = { api: { events: { emit: mockEmit } } };

    protected initState(value: any) {
      this.state = value;
    }

    get nextState(): any {
      return this.state;
    }
  }
  return {
    ComponentEx: ComponentExMock,
    connect: () => (component: unknown) => component,
    translate: () => (component: unknown) => component,
  };
});

vi.mock("react-i18next", () => ({
  withTranslation: () => (component: unknown) => component,
  translate: () => (component: unknown) => component,
}));

vi.mock("../../../util/storeHelper", () => ({
  getSafe: vi.fn((obj: any, path: string[], fallback: any) => {
    let result = obj;
    for (const key of path) {
      result = result?.[key];
      if (result === undefined) return fallback;
    }
    return result ?? fallback;
  }),
}));

// GameThumbnail uses many heavy dependencies — mock it out
vi.mock("./GameThumbnail", () => ({
  default: () => null,
}));

// bluebird used in component
vi.mock("bluebird", () => ({
  default: class {
    constructor(fn: any) {
      fn(
        () => {},
        () => {},
      );
    }
  },
}));

import React from "react";
import { render } from "@testing-library/react";

import Dashlet from "./NoGameDashlet";

function setPlatform(platform: string) {
  Object.defineProperty(process, "platform", {
    value: platform,
    writable: true,
    configurable: true,
  });
}

describe("NoGameDashlet", () => {
  let originalPlatform: PropertyDescriptor;

  beforeEach(() => {
    originalPlatform = Object.getOwnPropertyDescriptor(process, "platform")!;
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    Object.defineProperty(process, "platform", originalPlatform);
    vi.useRealTimers();
  });

  describe("Linux empty-state block", () => {
    it("renders empty-state block on linux when games=0 and discoveryRunning=false", () => {
      setPlatform("linux");
      const { container } = render(
        <Dashlet
          knownGames={[]}
          discoveredGames={{}}
          discoveryRunning={false}
          t={(s: string) => s}
        />,
      );
      expect(
        container.querySelector(".no-game-linux-empty-state"),
      ).not.toBeNull();
    });

    it('empty-state block contains "No Steam games detected" heading', () => {
      setPlatform("linux");
      const { container } = render(
        <Dashlet
          knownGames={[]}
          discoveredGames={{}}
          discoveryRunning={false}
          t={(s: string) => s}
        />,
      );
      const emptyState = container.querySelector(".no-game-linux-empty-state");
      expect(emptyState).not.toBeNull();
      expect(emptyState!.textContent).toContain("No Steam games detected");
    });

    it('empty-state block contains "Make sure Steam has finished loading" guidance', () => {
      setPlatform("linux");
      const { container } = render(
        <Dashlet
          knownGames={[]}
          discoveredGames={{}}
          discoveryRunning={false}
          t={(s: string) => s}
        />,
      );
      const emptyState = container.querySelector(".no-game-linux-empty-state");
      expect(emptyState).not.toBeNull();
      expect(emptyState!.textContent).toContain(
        "Make sure Steam has finished loading",
      );
    });

    it("empty-state block contains a Refresh button", () => {
      setPlatform("linux");
      const { container } = render(
        <Dashlet
          knownGames={[]}
          discoveredGames={{}}
          discoveryRunning={false}
          t={(s: string) => s}
        />,
      );
      const emptyState = container.querySelector(".no-game-linux-empty-state");
      expect(emptyState).not.toBeNull();
      const btn = emptyState!.querySelector("button");
      expect(btn).not.toBeNull();
      expect(btn!.textContent).toContain("Refresh");
    });

    it("does NOT render empty-state when discoveryRunning=true on linux", () => {
      setPlatform("linux");
      const { container } = render(
        <Dashlet
          knownGames={[]}
          discoveredGames={{}}
          discoveryRunning={true}
          t={(s: string) => s}
        />,
      );
      expect(container.querySelector(".no-game-linux-empty-state")).toBeNull();
    });

    it("does NOT render empty-state on win32 even when games=0 and discoveryRunning=false", () => {
      setPlatform("win32");
      const { container } = render(
        <Dashlet
          knownGames={[]}
          discoveredGames={{}}
          discoveryRunning={false}
          t={(s: string) => s}
        />,
      );
      expect(container.querySelector(".no-game-linux-empty-state")).toBeNull();
    });

    it("does NOT render empty-state when games > 0 on linux", () => {
      setPlatform("linux");
      const game = {
        id: "skyrimse",
        name: "Skyrim SE",
        shortName: "Skyrim SE",
        logo: "",
        extensionPath: "",
        parameters: [],
        requiredFiles: [],
        supportedTools: [],
        executable: "SkyrimSE.exe",
        environment: {},
        details: {},
        shell: false,
        contributed: undefined,
        final: false,
      } as any;
      const discoveredGames = {
        skyrimse: { path: "/home/user/.steam/steamapps/common/Skyrim SE" },
      };
      const { container } = render(
        <Dashlet
          knownGames={[game]}
          discoveredGames={discoveredGames}
          discoveryRunning={false}
          t={(s: string) => s}
        />,
      );
      expect(container.querySelector(".no-game-linux-empty-state")).toBeNull();
    });
  });
});
