import * as path from "node:path";

import { vi } from "vitest";

// Mock for vortex-api used by extension tests
// Re-exports the real storeHelper utilities from the renderer
import { setSafe, deleteOrNop } from "../../../src/renderer/src/util/storeHelper";

// Mock GameStoreHelper — getSteamEntry calls util.GameStoreHelper.findByAppId(steamAppId, "steam").
// Tests set the Steam library via mockAllGames; the mock resolves the first entry, as the real
// Steam store would for the game's app id, and rejects like GameEntryNotFound when it's empty.
export const mockAllGames = vi.fn().mockResolvedValue([]);

const mockGameStoreHelper = {
  findByAppId: vi.fn(async (_appId: string, storeId?: string) => {
    const entries = storeId === "steam" ? await mockAllGames() : [];
    if (entries.length === 0) {
      throw new Error("game entry not found");
    }
    return entries[0];
  }),
};

// Mock getGame — getSteamEntry reads the game's steamAppId
export const mockGetGame = vi.fn((_gameId: string) => ({ details: { steamAppId: 489830 } }));

// Mock getVortexPath
export const mockGetVortexPath = vi.fn((key: string) => {
  if (key === "documents") return "/home/testuser/Documents";
  return "/tmp/vortex";
});

// Mock selectors.discoveryByGame
export const mockDiscoveryByGame = vi.fn().mockReturnValue(undefined);

export const util = {
  setSafe,
  deleteOrNop,
  GameStoreHelper: mockGameStoreHelper,
  getGame: mockGetGame,
  getVortexPath: mockGetVortexPath,
  makeOverlayableDictionary: vi.fn(
    (
      dict: Record<string, any>,
      overlays?: Record<string, any>,
      selector?: (gameId: string) => string | undefined,
    ) => {
      const instance = {
        get: (gameId: string, field: string): any => {
          // Apply overlay via selector if available
          const store = selector ? selector(gameId) : undefined;
          if (store && overlays?.[store]?.[gameId]?.[field] !== undefined) {
            return overlays[store][gameId][field];
          }
          return dict[gameId]?.[field];
        },
      };
      return instance;
    },
  ),
};

export const selectors = {
  discoveryByGame: mockDiscoveryByGame,
};

export const types = {};
