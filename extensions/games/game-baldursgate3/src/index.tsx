import * as path from "path";

/* eslint-disable */
/**
 * Important - although we no longer define the info panel here,
 *  we still need to keep the index file's '.tsx' extension.
 *  At least while our update process for bundled plugins remains
 *  through the 'release' branch.
 *
 * Removing files from bundled plugins without stubbing the extension
 *  can potentially break the extension on the user's end.
 */
import Bluebird from "bluebird";
<<<<<<< HEAD
import { getProductVersionLocalized } from "exe-version";
import * as _ from "lodash";
=======
import * as _ from "lodash";
import * as path from "path";
>>>>>>> v2.0.1
import * as React from "react";
import { fs, selectors, types, util } from "vortex-api";

import PakInfoCache from "./cache";
import {
  GAME_ID,
  IGNORE_PATTERNS,
  MOD_TYPE_BG3SE,
  MOD_TYPE_LOOSE,
  MOD_TYPE_LSLIB,
  MOD_TYPE_REPLACER,
} from "./common";
<<<<<<< HEAD
import { abortDivineOperations } from "./divineWrapper";
import * as gitHubDownloader from "./githubDownloader";
import { InfoPanelWrap } from "./InfoPanel";
import {
  testLSLib,
  testBG3SE,
  testEngineInjector,
  testModFixer,
  testReplacer,
  installLSLib,
  installBG3SE,
  installEngineInjector,
  installModFixer,
  installReplacer,
} from "./installers";
import {
  deserialize,
  importModSettingsFile,
  importModSettingsGame,
  importFromBG3MM,
  serialize,
  exportToGame,
  exportToFile,
  validate,
  getNodes,
} from "./loadOrder";
import { migrate } from "./migrations";
import { isBG3SE, isLSLib, isLoose, isReplacer } from "./modTypes";
import reducer from "./reducers";
import Settings from "./Settings";
=======
import * as gitHubDownloader from "./githubDownloader";
import Settings from "./Settings";
import reducer from "./reducers";
import { migrate } from "./migrations";

>>>>>>> v2.0.1
import {
  logDebug,
  forceRefresh,
  getLatestInstalledLSLibVer,
  getGameDataPath,
  getGamePath,
  globalProfilePath,
  modsPath,
  getLatestLSLibMod,
  getOwnGameVersion,
  readStoredLO,
  getDefaultModSettings,
  getDefaultModSettingsFormat,
  getActivePlayerProfile,
  profilesPath,
  convertV6toV7,
  convertToV8,
} from "./util";

<<<<<<< HEAD
const STOP_PATTERNS = ["[^/]*\\.pak$"];

=======
import {
  testLSLib,
  testBG3SE,
  testEngineInjector,
  testModFixer,
  testReplacer,
  installLSLib,
  installBG3SE,
  installEngineInjector,
  installModFixer,
  installReplacer,
} from "./installers";

import { abortDivineOperations } from "./divineWrapper";

import { isBG3SE, isLSLib, isLoose, isReplacer } from "./modTypes";

import {
  deserialize,
  importModSettingsFile,
  importModSettingsGame,
  importFromBG3MM,
  serialize,
  exportToGame,
  exportToFile,
  validate,
  getNodes,
} from "./loadOrder";

import { InfoPanelWrap } from "./InfoPanel";
import PakInfoCache from "./cache";

const STOP_PATTERNS = ["[^/]*\\.pak$"];

>>>>>>> v2.0.1
const GOG_ID = "1456460669";
const STEAM_ID = "1086940";

function toWordExp(input) {
  return "(^|/)" + input + "(/|$)";
}

function findGame(): any {
<<<<<<< HEAD
  return util.GameStoreHelper.findByAppId([GOG_ID, STEAM_ID]).then((game) => game.gamePath);
=======
  return util.GameStoreHelper.findByAppId([GOG_ID, STEAM_ID]).then(
    (game) => game.gamePath,
  );
>>>>>>> v2.0.1
}

async function ensureGlobalProfile(
  api: types.IExtensionApi,
  discovery: types.IDiscoveryResult,
) {
  if (discovery?.path) {
    const profilePath = await globalProfilePath(api);
    try {
      await fs.ensureDirWritableAsync(profilePath);
      const modSettingsFilePath = path.join(profilePath, "modsettings.lsx");
      try {
        await fs.statAsync(modSettingsFilePath);
      } catch (err) {
        const defaultModSettings = await getDefaultModSettings(api);
<<<<<<< HEAD
        await fs.writeFileAsync(modSettingsFilePath, defaultModSettings, { encoding: "utf8" });
=======
        await fs.writeFileAsync(modSettingsFilePath, defaultModSettings, {
          encoding: "utf8",
        });
>>>>>>> v2.0.1
      }
    } catch (err) {
      return Promise.reject(err);
    }
  }
}

async function prepareForModding(api: types.IExtensionApi, discovery) {
  const mp = modsPath();

  const format = await getDefaultModSettingsFormat(api);
  if (!["v7", "v8"].includes(format)) {
    showFullReleaseModFixerRecommendation(api);
  }

  return fs
    .statAsync(mp)
    .catch(() => fs.ensureDirWritableAsync(mp, () => Bluebird.resolve() as any))
    .finally(() => ensureGlobalProfile(api, discovery));
}

function showFullReleaseModFixerRecommendation(api: types.IExtensionApi) {
  // check to see if mod is installed first?
  const mods = api.store.getState().persistent?.mods?.baldursgate3;
  if (mods !== undefined) {
    const modArray: types.IMod[] = mods ? Object.values(mods) : [];
    logDebug("modArray", modArray);

    const modFixerInstalled: boolean =
      modArray.filter((mod) => !!mod?.attributes?.modFixer).length != 0;
    logDebug("modFixerInstalled", modFixerInstalled);

    // if we've found an installed modfixer, then don't bother showing notification
    if (modFixerInstalled) {
      return;
    }
  }

  // no mods found
  api.sendNotification({
    type: "warning",
    title: "Recommended Mod",
    message: "Most mods require this mod.",
    id: "bg3-recommended-mod",
    allowSuppress: true,
    actions: [
      {
        title: "More",
        action: (dismiss) => {
          api
            .showDialog(
              "question",
              "Recommended Mods",
              {
                text:
                  "We recommend installing \"Baldur's Gate 3 Mod Fixer\" to be able to mod Baldur's Gate 3.\n\n" +
                  'This can be downloaded from Nexus Mods and installed using Vortex by pressing "Open Nexus Mods',
              },
<<<<<<< HEAD
              [{ label: "Dismiss" }, { label: "Open Nexus Mods", default: true }],
=======
              [
                { label: "Dismiss" },
                { label: "Open Nexus Mods", default: true },
              ],
>>>>>>> v2.0.1
            )
            .then((result) => {
              dismiss();
              if (result.action === "Open Nexus Mods") {
                util
<<<<<<< HEAD
                  .opn("https://www.nexusmods.com/baldursgate3/mods/141?tab=description")
=======
                  .opn(
                    "https://www.nexusmods.com/baldursgate3/mods/141?tab=description",
                  )
>>>>>>> v2.0.1
                  .catch(() => null);
              } else if (result.action === "Cancel") {
                // dismiss anyway
              }
              return Promise.resolve();
            });
        },
      },
    ],
  });
}

async function onCheckModVersion(
  api: types.IExtensionApi,
  gameId: string,
  mods: types.IMod[],
) {
  const profile = selectors.activeProfile(api.getState());
  if (profile.gameId !== GAME_ID || gameId !== GAME_ID) {
    return;
  }

  const latestVer: string = getLatestInstalledLSLibVer(api);

  if (latestVer === "0.0.0") {
    // Nothing to update.
    return;
  }

  const newestVer: string = await gitHubDownloader.checkForUpdates(
    api,
    latestVer,
  );
  if (!newestVer || newestVer === latestVer) {
    return;
  }
}

async function onGameModeActivated(api: types.IExtensionApi, gameId: string) {
  if (gameId !== GAME_ID) {
    // Cancel any divine.exe operations still in flight from the previous game
    // context so they don't surface errors or overwrite caches for a game the
    // user has since left.
    abortDivineOperations();
    PakInfoCache.getInstance(api).save();
    return;
  }
  try {
    await migrate(api);
    const bg3ProfileId = await getActivePlayerProfile(api);
<<<<<<< HEAD
    const gameSettingsPath: string = path.join(profilesPath(), bg3ProfileId, "modsettings.lsx");
    let nodes = await getNodes(gameSettingsPath);
    const { modsNode, modsOrderNode } = nodes;
    if (modsNode.children === undefined || (modsNode.children[0] as any) === "") {
=======
    const gameSettingsPath: string = path.join(
      profilesPath(),
      bg3ProfileId,
      "modsettings.lsx",
    );
    let nodes = await getNodes(gameSettingsPath);
    const { modsNode, modsOrderNode } = nodes;
    if (
      modsNode.children === undefined ||
      (modsNode.children[0] as any) === ""
    ) {
>>>>>>> v2.0.1
      modsNode.children = [{ node: [] }];
    }

    const format = await getDefaultModSettingsFormat(api);
    if (modsOrderNode === undefined && ["v7", "v8"].includes(format)) {
      const convFunc = format === "v7" ? convertV6toV7 : convertToV8;
<<<<<<< HEAD
      const data = await fs.readFileAsync(gameSettingsPath, { encoding: "utf8" });
=======
      const data = await fs.readFileAsync(gameSettingsPath, {
        encoding: "utf8",
      });
>>>>>>> v2.0.1
      const newData = await convFunc(data);
      await fs.removeAsync(gameSettingsPath).catch((err) => Promise.resolve());
      await fs.writeFileAsync(gameSettingsPath, newData, { encoding: "utf8" });
    }
  } catch (err) {
    api.showErrorNotification("Failed to migrate", err, {
      //message: 'Please run the game before you start modding',
      allowReport: false,
    });
  }

  try {
    await readStoredLO(api);
    PakInfoCache.getInstance(api);
  } catch (err) {
    api.showErrorNotification("Failed to read load order", err, {
      message: "Please run the game before you start modding",
      allowReport: false,
    });
  }

  const latestVer: string = getLatestInstalledLSLibVer(api);
  if (latestVer === "0.0.0") {
    await gitHubDownloader.downloadDivine(api);
  }
}

async function getGameVersion(gamePath: string) {
  return Promise.resolve(getProductVersionLocalized(path.join(gamePath, "bin", "bg3.exe")));
}

function main(context: types.IExtensionContext) {
  context.registerReducer(["settings", "baldursgate3"], reducer);

  context.registerGame({
    id: GAME_ID,
    name: "Baldur's Gate 3",
    mergeMods: true,
    queryPath: findGame,
    supportedTools: [
      {
        id: "exevulkan",
        name: "Baldur's Gate 3 (Vulkan)",
        executable: () => "bin/bg3.exe",
        requiredFiles: ["bin/bg3.exe"],
        relative: true,
      },
    ],
    queryModPath: modsPath,
    logo: "gameart.jpg",
    executable: () => "bin/bg3_dx11.exe",
    setup: (discovery) => prepareForModding(context.api, discovery) as any,
<<<<<<< HEAD
    getGameVersion,
=======
>>>>>>> v2.0.1
    requiredFiles: ["bin/bg3_dx11.exe"],
    environment: {
      SteamAPPId: STEAM_ID,
    },
    details: {
      steamAppId: +STEAM_ID,
      stopPatterns: STOP_PATTERNS.map(toWordExp),
      ignoreConflicts: IGNORE_PATTERNS,
      ignoreDeploy: IGNORE_PATTERNS,
    },
  });

  context.registerAction(
    "mod-icons",
    300,
    "settings",
    {},
    "Re-install LSLib/Divine",
    () => {
      const state = context.api.getState();
      const mods: { [modId: string]: types.IMod } = util.getSafe(
        state,
        ["persistent", "mods", GAME_ID],
        {},
      );
<<<<<<< HEAD
      const lslibs = Object.keys(mods).filter((mod) => mods[mod].type === "bg3-lslib-divine-tool");
=======
      const lslibs = Object.keys(mods).filter(
        (mod) => mods[mod].type === "bg3-lslib-divine-tool",
      );
>>>>>>> v2.0.1
      context.api.events.emit("remove-mods", GAME_ID, lslibs, (err) => {
        if (err !== null) {
          context.api.showErrorNotification(
            "Failed to reinstall lslib",
            "Please re-install manually",
            { allowReport: false },
          );
          return;
        }
        gitHubDownloader.downloadDivine(context.api);
      });
    },
    () => {
      const state = context.api.store.getState();
      const gameMode = selectors.activeGameId(state);
      return gameMode === GAME_ID;
    },
  );

<<<<<<< HEAD
  context.registerInstaller("bg3-lslib-divine-tool", 15, testLSLib as any, installLSLib as any);
  context.registerInstaller("bg3-bg3se", 15, testBG3SE as any, installBG3SE as any);
=======
  context.registerInstaller(
    "bg3-lslib-divine-tool",
    15,
    testLSLib as any,
    installLSLib as any,
  );
  context.registerInstaller(
    "bg3-bg3se",
    15,
    testBG3SE as any,
    installBG3SE as any,
  );
>>>>>>> v2.0.1
  context.registerInstaller(
    "bg3-engine-injector",
    20,
    testEngineInjector as any,
    installEngineInjector as any,
  );
<<<<<<< HEAD
  context.registerInstaller("bg3-replacer", 25, testReplacer as any, installReplacer as any);
  context.registerInstaller("bg3-modfixer", 25, testModFixer as any, installModFixer as any);
=======
  context.registerInstaller(
    "bg3-replacer",
    25,
    testReplacer as any,
    installReplacer as any,
  );
  context.registerInstaller(
    "bg3-modfixer",
    25,
    testModFixer as any,
    installModFixer as any,
  );
>>>>>>> v2.0.1

  context.registerModType(
    MOD_TYPE_LSLIB,
    15,
    (gameId) => gameId === GAME_ID,
    () => undefined,
    isLSLib as any,
    { name: "BG3 LSLib", noConflicts: true },
  );

  context.registerModType(
    MOD_TYPE_BG3SE,
    15,
    (gameId) => gameId === GAME_ID,
    () => path.join(getGamePath(context.api), "bin"),
    isBG3SE as any,
    { name: "BG3 BG3SE" },
  );

  context.registerModType(
    MOD_TYPE_LOOSE,
    20,
    (gameId) => gameId === GAME_ID,
    () => getGameDataPath(context.api),
    isLoose as any,
    { name: "BG3 Loose" } as any,
  );

  context.registerModType(
    MOD_TYPE_REPLACER,
    25,
    (gameId) => gameId === GAME_ID,
    () => getGameDataPath(context.api),
    (instructions) => isReplacer(context.api, instructions) as any,
    { name: "BG3 Replacer" } as any,
  );

  context.registerLoadOrder({
    clearStateOnPurge: false,
    gameId: GAME_ID,
    deserializeLoadOrder: () => deserialize(context),
    serializeLoadOrder: (loadOrder, prev) => serialize(context, loadOrder),
    validate,
    toggleableEntries: false,
    usageInstructions: (() => (
      <InfoPanelWrap
        api={context.api}
        getOwnGameVersion={getOwnGameVersion}
        readStoredLO={readStoredLO}
        installLSLib={onGameModeActivated}
        getLatestLSLibMod={getLatestLSLibMod}
      />
    )) as any,
  });

  const isBG3 = () => {
    const state = context.api.getState();
    const activeGame = selectors.activeGameId(state);
    return activeGame === GAME_ID;
  };

  context.registerAction(
    "fb-load-order-icons",
    150,
    "changelog",
    {},
    "Export to Game",
    () => {
      exportToGame(context.api);
    },
    isBG3,
  );
  context.registerAction(
    "fb-load-order-icons",
    151,
    "changelog",
    {},
    "Export to File...",
    () => {
      exportToFile(context.api);
    },
    isBG3,
  );
  context.registerAction(
    "fb-load-order-icons",
    160,
    "import",
    {},
    "Import from Game",
    () => {
      importModSettingsGame(context.api);
    },
    isBG3,
  );
  context.registerAction(
    "fb-load-order-icons",
    161,
    "import",
    {},
    "Import from File...",
    () => {
      importModSettingsFile(context.api);
    },
    isBG3,
  );
  context.registerAction(
    "fb-load-order-icons",
    170,
    "import",
    {},
    "Import from BG3MM...",
    () => {
      importFromBG3MM(context);
    },
    isBG3,
  );
  context.registerAction(
    "fb-load-order-icons",
    190,
    "open-ext",
    {},
    "Open Load Order File",
    () => {
      getActivePlayerProfile(context.api).then((bg3ProfileId) => {
<<<<<<< HEAD
        const gameSettingsPath: string = path.join(profilesPath(), bg3ProfileId, "modsettings.lsx");
=======
        const gameSettingsPath: string = path.join(
          profilesPath(),
          bg3ProfileId,
          "modsettings.lsx",
        );
>>>>>>> v2.0.1
        util.opn(gameSettingsPath).catch(() => null);
      });
    },
    isBG3,
  );

  context.registerSettings("Mods", Settings, undefined, isBG3, 150);

  context.once(() => {
<<<<<<< HEAD
    context.api.onStateChange(["session", "base", "toolsRunning"], (prev: any, current: any) => {
      // when a tool exits, re-read the load order from disk as it may have been
      // changed
      const gameMode = selectors.activeGameId(context.api.getState());
      if (gameMode === GAME_ID && Object.keys(current).length === 0) {
        readStoredLO(context.api).catch((err) => {
          context.api.showErrorNotification("Failed to read load order", err, {
            message: "Please run the game before you start modding",
            allowReport: false,
          });
        });
      }
    });
=======
    context.api.onStateChange(
      ["session", "base", "toolsRunning"],
      (prev: any, current: any) => {
        // when a tool exits, re-read the load order from disk as it may have been
        // changed
        const gameMode = selectors.activeGameId(context.api.getState());
        if (gameMode === GAME_ID && Object.keys(current).length === 0) {
          readStoredLO(context.api).catch((err) => {
            context.api.showErrorNotification(
              "Failed to read load order",
              err,
              {
                message: "Please run the game before you start modding",
                allowReport: false,
              },
            );
          });
        }
      },
    );
>>>>>>> v2.0.1

    context.api.onAsync("did-deploy", async (profileId: string, deployment) => {
      const profile = selectors.profileById(context.api.getState(), profileId);
      if (profile?.gameId === GAME_ID) {
        forceRefresh(context.api);
      }
      await PakInfoCache.getInstance(context.api).save();
      return Promise.resolve();
    });

<<<<<<< HEAD
    context.api.events.on("check-mods-version", (gameId: string, mods: types.IMod[]) =>
      onCheckModVersion(context.api, gameId, mods),
=======
    context.api.events.on(
      "check-mods-version",
      (gameId: string, mods: types.IMod[]) =>
        onCheckModVersion(context.api, gameId, mods),
>>>>>>> v2.0.1
    );

    context.api.events.on("gamemode-activated", async (gameMode: string) =>
      onGameModeActivated(context.api, gameMode),
    );
  });

  return true;
}

export default main;
