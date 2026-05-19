/* eslint-disable */
import path from "path";
<<<<<<< HEAD

import * as React from "react";
import { fs, types, FlexLayout, OptionsFilter, selectors, util } from "vortex-api";

import { GAME_ID, HALO_GAMES, MS_APPID, STEAM_ID, MODTYPE_PLUG_AND_PLAY } from "./common";
=======
import {
  fs,
  types,
  FlexLayout,
  OptionsFilter,
  selectors,
  util,
} from "vortex-api";

import * as React from "react";

import {
  GAME_ID,
  HALO_GAMES,
  MS_APPID,
  STEAM_ID,
  MODTYPE_PLUG_AND_PLAY,
} from "./common";
import { LauncherConfig } from "./types";
import { testPlugAndPlayModType } from "./modTypes";
>>>>>>> v2.0.1
import {
  installPlugAndPlay,
  testModConfigInstaller,
  testPlugAndPlayInstaller,
  installModConfig,
  install,
  testInstaller,
} from "./installers";
<<<<<<< HEAD
import { testPlugAndPlayModType } from "./modTypes";
import { testCEMP } from "./tests";
import { LauncherConfig } from "./types";
=======
import { testCEMP } from "./tests";
>>>>>>> v2.0.1
import { applyToManifest } from "./util";

// Master chef collection
class MasterChiefCollectionGame implements types.IGame {
  public context: types.IExtensionContext;
  public id: string;
  public name: string;
  public shortName: string;
  public logo: string;
  public api: types.IExtensionApi;
  public getGameVersion: (discoveryPath: string) => Promise<string>;
  public requiredFiles: string[];
  public supportedTools: any[];
  public environment: any;
  public details: any;
  public mergeMods: boolean;

  constructor(context) {
    this.context = context;
    this.id = GAME_ID;
    this.name = "Halo: The Master Chief Collection";
    this.shortName = "Halo: MCC";
    this.logo = "gameart.jpg";
    this.api = context.api;
<<<<<<< HEAD
    ((this.getGameVersion = resolveGameVersion), (this.requiredFiles = [this.executable()]));
=======
    ((this.getGameVersion = resolveGameVersion),
      (this.requiredFiles = [this.executable()]));
>>>>>>> v2.0.1
    this.supportedTools = [
      {
        id: "haloassemblytool",
        name: "Assembly",
        logo: "assemblytool.png",
        executable: () => "Assembly.exe",
        requiredFiles: ["Assembly.exe"],
        relative: true,
      },
    ];
    this.environment = {
      SteamAPPId: STEAM_ID,
    };
    this.details = {
      steamAppId: +STEAM_ID,
    };
    this.mergeMods = true;
  }

  queryModPath(gamePath) {
    return ".";
  }

  executable() {
    return "mcclauncher.exe";
  }

  public async prepare(discovery: types.IDiscoveryResult): Promise<void> {
    return Promise.resolve();
  }

  public queryPath() {
<<<<<<< HEAD
    return util.GameStoreHelper.findByAppId([STEAM_ID, MS_APPID]).then((game) => game.gamePath);
=======
    return util.GameStoreHelper.findByAppId([STEAM_ID, MS_APPID]).then(
      (game) => game.gamePath,
    );
>>>>>>> v2.0.1
  }

  public requiresLauncher = util.toBlue((gamePath: string, store: string) =>
    this.checkLauncher(gamePath, store),
  );
<<<<<<< HEAD
  public async checkLauncher(gamePath: string, store: string): LauncherConfig | undefined {
=======
  public async checkLauncher(
    gamePath: string,
    store: string,
  ): LauncherConfig | undefined {
>>>>>>> v2.0.1
    if (store === "xbox") {
      return Promise.resolve({
        launcher: "xbox",
        addInfo: {
          appId: MS_APPID,
          parameters: [{ appExecName: "HaloMCCShippingNoEAC" }],
        },
      });
    } else if (store === "steam") {
      return Promise.resolve({
        launcher: "steam",
        addInfo: {
          appId: STEAM_ID,
          parameters: ["option2"],
          launchType: "gamestore",
        },
      });
    }

    return Promise.resolve(undefined);
  }
}

// function getXboxId(internalId, filePath, encoding) {
//   // This function will return the xbox id of the last player
//   //  who ran the game. This can potentially be used to mod the game
//   //  only for specific xbox ids while leaving others in an untampered state. (WIP)
//   return fs.readFileAsync(filePath, { encoding })
//     .then(fileData => {
//       let xmlDoc;
//       try {
//         xmlDoc = parseXmlString(fileData);
//       } catch (err) {
//         return Promise.reject(err);
//       }

//       const generalData = xmlDoc.find('//CampaignCarnageReport/GeneralData');
//       if (generalData[0].attr('GameId').value() === internalId) {
//         const players = xmlDoc.find('//CampaignCarnageReport/Players/PlayerInfo');
//         const mainPlayer = players.find(player => player.attr('isGuest').value() === 'false');
//         const xboxId = mainPlayer.attr('mXboxUserId').value();
//         // The userId is prefixed with "0x" which is not needed.
//         return Promise.resolve(xboxId.substring(2));
//       } else {
//         return Promise.reject(new util.DataInvalid('Wrong internal gameId'));
//       }
//     });
// }

const resolveGameVersion = async (discoveryPath: string): Promise<string> => {
  const versionPath = path.join(discoveryPath, "build_tag.txt");
  return fs
    .readFileAsync(versionPath, { encoding: "utf8" })
    .then((res) => Promise.resolve(res.split("\r\n")[0].trim()));
};

module.exports = {
  default: (context: types.IExtensionContext) => {
    context.registerGame(new MasterChiefCollectionGame(context));

    // let collator;
    // const getCollator = (locale) => {
    //   if ((collator === undefined) || (locale !== lang)) {
    //     lang = locale;
    //     collator = new Intl.Collator(locale, { sensitivity: 'base' });
    //   }
    //   return collator;
    // };

    context.registerModType(
      MODTYPE_PLUG_AND_PLAY,
      15,
      (gameId: string) => gameId === GAME_ID,
      () => undefined,
      testPlugAndPlayModType as any,
      {
        deploymentEssential: false,
        mergeMods: true,
        name: "MCC Plug and Play mod",
        noConflicts: true,
      },
    );

    context.registerInstaller(
      "mcc-plug-and-play-installer",
      15,
      testPlugAndPlayInstaller as any,
      installPlugAndPlay as any,
    );

    context.registerInstaller(
      "masterchiefmodconfiginstaller",
      20,
      testModConfigInstaller as any,
      installModConfig as any,
    );

<<<<<<< HEAD
    context.registerInstaller("masterchiefinstaller", 25, testInstaller as any, install as any);
=======
    context.registerInstaller(
      "masterchiefinstaller",
      25,
      testInstaller as any,
      install as any,
    );
>>>>>>> v2.0.1

    context.registerTest(
      "mcc-ce-mp-test",
      "gamemode-activated",
      util.toBlue(() => testCEMP(context.api)),
    );

    context.registerTableAttribute("mods", {
      id: "gameType",
      name: "Game(s)",
      description: "Target Halo game(s) for this mod",
      icon: "inspect",
      placement: "table",
      customRenderer: (mod) => {
        const createImgDiv = (entry, idx) => {
          return React.createElement(
            "div",
            { className: "halo-img-div", key: `${entry.internalId}-${idx}` },
<<<<<<< HEAD
            React.createElement("img", { className: "halogameimg", src: `file://${entry.img}` }),
=======
            React.createElement("img", {
              className: "halogameimg",
              src: `file://${entry.img}`,
            }),
>>>>>>> v2.0.1
            React.createElement("span", {}, entry.name),
          );
        };

        const internalIds = util.getSafe(mod, ["attributes", "haloGames"], []);
        const haloEntries = Object.keys(HALO_GAMES)
          .filter((key) => internalIds.includes(HALO_GAMES[key].internalId))
          .map((key) => HALO_GAMES[key]);

        return React.createElement(
          FlexLayout,
          { type: "row" },
          React.createElement(
            FlexLayout.Flex,
            { className: "haloimglayout" },
            haloEntries.map((entry, idx) => createImgDiv(entry, idx)),
          ),
        );
      },
      calc: (mod) => util.getSafe(mod, ["attributes", "haloGames"], undefined),
      filter: new OptionsFilter(
        [].concat(
          [{ value: OptionsFilter.EMPTY, label: "<None>" }],
          Object.keys(HALO_GAMES).map((key) => {
<<<<<<< HEAD
            return { value: HALO_GAMES[key].internalId, label: HALO_GAMES[key].name };
=======
            return {
              value: HALO_GAMES[key].internalId,
              label: HALO_GAMES[key].name,
            };
>>>>>>> v2.0.1
          }),
        ),
        true,
        false,
      ),
      isToggleable: true,
      edit: {},
      isSortable: false,
      isGroupable: (mod) => {
        const internalIds = util.getSafe(mod, ["attributes", "haloGames"], []);
        const haloEntries = Object.keys(HALO_GAMES)
          .filter((key) => internalIds.includes(HALO_GAMES[key].internalId))
          .map((key) => HALO_GAMES[key]);

        if (haloEntries.length > 1) {
          return "Multiple";
        } else {
<<<<<<< HEAD
          return !!haloEntries && haloEntries.length > 0 ? haloEntries[0].name : "None";
=======
          return !!haloEntries && haloEntries.length > 0
            ? haloEntries[0].name
            : "None";
>>>>>>> v2.0.1
        }
      },
      isDefaultVisible: true,
      //sortFunc: (lhs, rhs) => getCollator(locale).compare(lhs, rhs),
      condition: () => {
<<<<<<< HEAD
        const activeGameId = selectors.activeGameId(context.api.store.getState());
=======
        const activeGameId = selectors.activeGameId(
          context.api.store.getState(),
        );
>>>>>>> v2.0.1
        return activeGameId === GAME_ID;
      },
    });

    context.once(() => {
<<<<<<< HEAD
      context.api.setStylesheet("masterchiefstyle", path.join(__dirname, "masterchief.scss"));
=======
      context.api.setStylesheet(
        "masterchiefstyle",
        path.join(__dirname, "masterchief.scss"),
      );
>>>>>>> v2.0.1
      context.api.onAsync("did-deploy", async (profileId: string) =>
        applyToManifest(context.api, true),
      );
      context.api.onAsync("did-purge", async (profileId: string) =>
        applyToManifest(context.api, false),
      );
    });
  },
};
