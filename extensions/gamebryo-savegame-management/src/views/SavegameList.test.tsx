/**
 * Unit tests for SavegameList.tsx renderTransfer() — Phase 13 addition.
 *
 * Tests the profileOptions filter and empty-state condition added in Phase 13
 * (SAVE-05: save profile transfer picker UX).
 *
 * Empty-state shows when: profileOptions.length === 0 && !activeHasLocalSaves
 */
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

// ── Mocks ────────────────────────────────────────────────────────────────────
// All vi.mock calls must come before component imports (vitest hoists them).

vi.mock("react-bootstrap", async () => {
  const ReactModule = await vi.importActual<any>("react");
  const R = ReactModule.default ?? ReactModule;
  const Panel: any = ({ children }: any) => R.createElement("div", null, children);
  Panel.Body = ({ children }: any) => R.createElement("div", null, children);
  return {
    Alert: ({ children }: any) => R.createElement("div", null, children),
    FormControl: ({ children, onChange }: any) =>
      R.createElement("select", { onChange }, children),
    Panel,
  };
});

vi.mock("react-i18next", () => ({
  withTranslation: () => (component: unknown) => component,
}));

vi.mock("react-redux", () => ({
  connect: () => (component: unknown) => component,
}));

vi.mock("vortex-api", async () => {
  const ReactModule = await vi.importActual<any>("react");
  const R = ReactModule.default ?? ReactModule;

  const storeHelper = await vi.importActual<any>(
    "../../../../src/renderer/src/util/storeHelper",
  );

  class ComponentEx extends R.Component {
    public nextState: any;
    protected initState(value: any) {
      this.state = JSON.parse(JSON.stringify(value));
      this.nextState = value;
    }
  }

  const MainPage: any = ({ children }: any) =>
    R.createElement("div", null, children);
  MainPage.Header = ({ children }: any) =>
    R.createElement("div", { "data-testid": "transfer-header" }, children);
  MainPage.Body = ({ children }: any) =>
    R.createElement("div", null, children);

  return {
    ComponentEx,
    MainPage,
    FlexLayout: ({ children }: any) => R.createElement("div", null, children),
    IconBar: () => null,
    Table: () => null,
    Spinner: () => null,
    tooltip: {
      IconButton: ({ id }: any) => R.createElement("button", { id }),
    },
    selectors: { activeProfile: vi.fn() },
    actions: { showDialog: vi.fn() },
    types: {},
    util: {
      getSafe: storeHelper.getSafe,
      getSafeCI: storeHelper.getSafe,
      showError: vi.fn(),
      ProcessCanceled: class ProcessCanceled extends Error {},
    },
  };
});

vi.mock("../savegameAttributes", () => ({ default: () => [] }));

vi.mock("../actions/session", () => ({
  showTransferDialog: vi.fn(() => ({ type: "TRANSFER" })),
}));

// ── Component import (after mocks) ───────────────────────────────────────────
import SavegameList from "./SavegameList";

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeProfile(id: string, gameId: string, localSaves: boolean) {
  return {
    id,
    gameId,
    name: `Profile ${id}`,
    features: { local_saves: localSaves },
  };
}

const baseProps = {
  t: (key: string) => key,
  i18n: {} as any,
  tReady: true,
  saves: {},
  savesTruncated: false,
  activity: [],
  showTransfer: true,
  onRefresh: vi.fn(),
  onLoadSaves: vi.fn(),
  onRestorePlugins: vi.fn(),
  onRemoveSavegames: vi.fn(),
  onTransferSavegames: vi.fn(),
  getInstalledPlugins: vi.fn(),
  onHideTransfer: vi.fn(),
  onShowDialog: vi.fn(),
  onShowError: vi.fn(),
};

afterEach(cleanup);

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("SavegameList renderTransfer — profileOptions filter and empty-state", () => {
  it("shows empty-state when no profiles have local saves and active profile has none", () => {
    const currentProfile = makeProfile("c1", "skyrim", false);
    const profiles = {
      c1: currentProfile,
      other: makeProfile("other", "skyrim", false),
    };

    render(
      React.createElement(SavegameList as any, {
        ...baseProps,
        currentProfile,
        profiles,
      }),
    );

    expect(
      screen.getByText(
        "No profiles with local saves found. Enable local saves in Profile Settings to use save transfer.",
      ),
    ).toBeInTheDocument();
  });

  it("shows Global option and hides empty-state when current profile has local saves", () => {
    const currentProfile = makeProfile("c1", "skyrim", true);
    const profiles = { c1: currentProfile };

    render(
      React.createElement(SavegameList as any, {
        ...baseProps,
        currentProfile,
        profiles,
      }),
    );

    expect(screen.getByText("Global")).toBeInTheDocument();
    expect(
      screen.queryByText(/No profiles with local saves found/),
    ).not.toBeInTheDocument();
  });

  it("includes only same-game local-save profiles and excludes current profile", () => {
    const currentProfile = makeProfile("c1", "skyrim", false);
    const profiles = {
      c1: currentProfile,
      crossgame: makeProfile("crossgame", "fallout4", true),
      eligible: makeProfile("eligible", "skyrim", true),
    };

    render(
      React.createElement(SavegameList as any, {
        ...baseProps,
        currentProfile,
        profiles,
      }),
    );

    // eligible (same game, local saves) appears as an option
    expect(screen.getByText("Profile: Profile eligible")).toBeInTheDocument();
    // cross-game profile must not appear
    expect(
      screen.queryByText("Profile: Profile crossgame"),
    ).not.toBeInTheDocument();
    // current profile must not appear as an option
    expect(
      screen.queryByText("Profile: Profile c1"),
    ).not.toBeInTheDocument();
    // empty-state hidden because eligible profile exists
    expect(
      screen.queryByText(/No profiles with local saves found/),
    ).not.toBeInTheDocument();
  });
});
