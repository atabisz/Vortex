const Promise = require("bluebird");
const path = require("path");
const winapi = require("winapi-bindings");
const { actions, fs, util } = require("vortex-api");

const STRACKER_FILES = ["loader-config.json", "loader.dll"];
const GAME_ID = "monsterhunterworld";
const RESHADE_DIRNAME = "reshade-shaders";

// Monster Hunter: World mods are consistently contained within
//  the 'nativePC' folder. We're going to depend on this folder
//  existing within the archive when trying to decide whether the
//  mod is supported or not.
const NATIVE_PC_FOLDER = "nativePC";

// We can rely on the steam uninstall registry key when
//  figuring out the install location for MH:W; but this is
//  of course only valid for steam installations.
//  TODO: Find and test a regkey which does not depend
//  on steam to cater for non-steam installations.
<<<<<<< HEAD
const steamReg = "SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\Steam App 582010";
=======
const steamReg =
  "SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\Steam App 582010";
>>>>>>> v2.0.1

const MHW_EXEC = "MonsterHunterWorld.exe";

const I18N_NAMESPACE = "game-monster-hunter-world";

function findGame() {
  try {
<<<<<<< HEAD
    const instPath = winapi.RegGetValue("HKEY_LOCAL_MACHINE", steamReg, "InstallLocation");
=======
    const instPath = winapi.RegGetValue(
      "HKEY_LOCAL_MACHINE",
      steamReg,
      "InstallLocation",
    );
>>>>>>> v2.0.1
    if (!instPath) {
      throw new Error("empty registry key");
    }
    return Promise.resolve(instPath.value);
  } catch (err) {
<<<<<<< HEAD
    return util.steam.findByName("MONSTER HUNTER: WORLD").then((game) => game.gamePath);
=======
    return util.steam
      .findByName("MONSTER HUNTER: WORLD")
      .then((game) => game.gamePath);
>>>>>>> v2.0.1
  }
}

const tools = [
  {
    id: "HunterPie",
    name: "HunterPie",
    logo: "HunterPie.png",
    executable: () => "HunterPie.exe",
    requiredFiles: ["HunterPie.exe"],
  },
  {
    id: "SmartHunter",
    name: "SmartHunter",
    logo: "SmartHunter.png",
    executable: () => "SmartHunter.exe",
    requiredFiles: ["SmartHunter.exe"],
  },
  {
    id: "MHWTransmog",
    name: "MHW Transmog",
    logo: "MHWTransmog.png",
    executable: () => "MHWTransmog.exe",
    requiredFiles: ["MHWTransmog.exe"],
    shell: true,
  },
];

function prepareForModding(discovery, api) {
  const notifId = "missing-stracker-notif";
  const missingStracker = () =>
    api.sendNotification({
      id: notifId,
      type: "warning",
      message: api.translate('"Stracker\'s Loader" not installed/configured', {
        ns: I18N_NAMESPACE,
      }),
      allowSuppress: true,
      actions: [
        {
          title: "More",
          action: () => {
            api.showDialog(
              "question",
              "Action required",
              {
                text:
                  'Monster Hunter: World requires "Stracker\'s Loader" for most mods to install and function correctly.\n' +
                  "Vortex is able to install Stracker's Loader automatically (as a mod) but please ensure it is enabled\n" +
                  "and deployed at all times.",
              },
              [
                { label: "Continue", action: (dismiss) => dismiss() },
                {
                  label: "Go to Stracker's Loader mod page",
                  action: (dismiss) => {
                    util
<<<<<<< HEAD
                      .opn("https://www.nexusmods.com/monsterhunterworld/mods/1982")
=======
                      .opn(
                        "https://www.nexusmods.com/monsterhunterworld/mods/1982",
                      )
>>>>>>> v2.0.1
                      .catch((err) => undefined);
                    dismiss();
                  },
                },
              ],
            );
          },
        },
      ],
    });

  const raiseNotif = () => {
    missingStracker();
    return Promise.resolve();
  };

  // Check whether Stracker's Loader is installed.
  return fs
<<<<<<< HEAD
    .ensureDirWritableAsync(path.join(discovery.path, NATIVE_PC_FOLDER), () => Promise.resolve())
=======
    .ensureDirWritableAsync(path.join(discovery.path, NATIVE_PC_FOLDER), () =>
      Promise.resolve(),
    )
>>>>>>> v2.0.1
    .then(() =>
      Promise.each(STRACKER_FILES, (file) => {
        const assemblyPath = path.join(discovery.path, file);
        return fs.statAsync(assemblyPath);
      })
        .then(() => Promise.resolve())
<<<<<<< HEAD
        .catch((err) => (err.code === "ENOENT" ? raiseNotif() : Promise.reject(err))),
=======
        .catch((err) =>
          err.code === "ENOENT" ? raiseNotif() : Promise.reject(err),
        ),
>>>>>>> v2.0.1
    );
}

function main(context) {
  const missingReshade = (api) =>
    new Promise((resolve, reject) => {
      api.store.dispatch(
        actions.showDialog(
          "warning",
          "Action required",
          {
            message: api.translate(
              "You're attempting to install what appears to be a ReShade mod, but " +
                "Vortex is unable to confirm whether\n ReShade is installed. \n\nThe mod " +
                "will still be installed, but please keep in mind that this mod will " +
                "not function without ReShade.",
              { ns: I18N_NAMESPACE },
            ),
          },
          [
            { label: "Continue", action: () => resolve() },
            {
              label: "Download ReShade",
              action: () => {
                util.opn("https://reshade.me").catch((err) => undefined);
                resolve();
              },
            },
          ],
        ),
      );
    });

  const getDiscoveryPath = (api) => {
    const store = api.store;
    const state = store.getState();
    const discovery = util.getSafe(
      state,
      ["settings", "gameMode", "discovered", GAME_ID],
      undefined,
    );
    if (discovery === undefined || discovery.path === undefined) {
      // should never happen.
      log("error", "monster hunter: world was not discovered");
      return undefined;
    }

    return discovery.path;
  };

  context.registerGame({
    id: GAME_ID,
    name: "Monster Hunter: World",
    mergeMods: true,
    queryPath: findGame,
    supportedTools: tools,
    queryModPath: () => NATIVE_PC_FOLDER,
    logo: "gameart.jpg",
    executable: () => MHW_EXEC,
    requiredFiles: [MHW_EXEC],
    environment: {
      SteamAPPId: "582010",
    },
    details: {
      steamAppId: 582010,
    },
    setup: (discovery) => prepareForModding(discovery, context.api),
  });

  const getPath = (game) => {
    const state = context.api.store.getState();
    const discovery = state.settings.gameMode.discovered[game.id];
    if (discovery !== undefined) {
      return discovery.path;
    } else {
      return undefined;
    }
  };

  const testStracker = (instructions) => {
    const filtered = instructions.filter((instr) => instr.type === "copy");

    const matches = filtered.filter((instr) =>
      STRACKER_FILES.includes(path.basename(instr.source).toLowerCase()),
    );
    return Promise.resolve(matches.length === STRACKER_FILES.length);
  };

  const testReshade = (instructions) => {
    const filtered = instructions.filter(
      (instr) =>
        instr.type === "copy" &&
        path.extname(instr.source) === ".ini" &&
<<<<<<< HEAD
        instr.source.toLowerCase().indexOf(NATIVE_PC_FOLDER.toLowerCase()) === -1,
=======
        instr.source.toLowerCase().indexOf(NATIVE_PC_FOLDER.toLowerCase()) ===
          -1,
>>>>>>> v2.0.1
    );
    return Promise.resolve(filtered.length > 0);
  };

  context.registerModType(
    "mhwstrackermodloader",
    25,
    (gameId) => gameId === GAME_ID,
    getPath,
    testStracker,
  );
<<<<<<< HEAD
  context.registerModType("mhwreshade", 25, (gameId) => gameId === GAME_ID, getPath, testReshade);
  context.registerInstaller("monster-hunter-mod", 25, isSupported, installContent);
=======
  context.registerModType(
    "mhwreshade",
    25,
    (gameId) => gameId === GAME_ID,
    getPath,
    testReshade,
  );
  context.registerInstaller(
    "monster-hunter-mod",
    25,
    isSupported,
    installContent,
  );
>>>>>>> v2.0.1
  context.registerInstaller(
    "mhwreshadeinstaller",
    24,
    isReshadeMod,
    (files, destinationPath, gameId, progressDelegate) => {
      const filtered = files.filter((file) => path.extname(file) === ".ini");
      const instructions = filtered.map((file) => {
        return {
          type: "copy",
          source: file,
          destination: path.basename(file),
        };
      });

      return fs
        .statAsync(path.join(getDiscoveryPath(context.api), RESHADE_DIRNAME))
        .then(() => Promise.resolve({ instructions }))
<<<<<<< HEAD
        .catch(() => missingReshade(context.api).then(() => Promise.resolve({ instructions })));
=======
        .catch(() =>
          missingReshade(context.api).then(() =>
            Promise.resolve({ instructions }),
          ),
        );
>>>>>>> v2.0.1
    },
  );

  return true;
}

function installContent(files, destinationPath, gameId, progressDelegate) {
  // Grab any modfile that is nested withing 'nativePC'.
  const modFile = files.find(
    (file) => file.toLowerCase().indexOf(NATIVE_PC_FOLDER.toLowerCase()) !== -1,
  );

  // Find the index of the natives folder + natives folder length + path.sep; going
  //  to remove everything preceding that point in the filepath.
  const idx =
<<<<<<< HEAD
    modFile.toLowerCase().indexOf(NATIVE_PC_FOLDER.toLowerCase()) + NATIVE_PC_FOLDER.length + 1;
=======
    modFile.toLowerCase().indexOf(NATIVE_PC_FOLDER.toLowerCase()) +
    NATIVE_PC_FOLDER.length +
    1;
>>>>>>> v2.0.1

  // Filter out unwanted files.
  const filtered = files.filter(
    (file) =>
      path.extname(file) !== "" &&
<<<<<<< HEAD
      path.dirname(file.toLowerCase()).indexOf(NATIVE_PC_FOLDER.toLowerCase()) !== -1,
=======
      path
        .dirname(file.toLowerCase())
        .indexOf(NATIVE_PC_FOLDER.toLowerCase()) !== -1,
>>>>>>> v2.0.1
  );

  const instructions = filtered.map((file) => {
    return {
      type: "copy",
      source: file,
      destination: file.substr(idx),
    };
  });

  return Promise.resolve({ instructions });
}

function isReshadeMod(files, gameId) {
  const filtered = files.filter(
    (file) =>
      file
        .split(path.sep)
        .map((element) => element.toLowerCase())
<<<<<<< HEAD
        .indexOf(NATIVE_PC_FOLDER.toLowerCase()) === -1 && path.extname(file) === ".ini",
=======
        .indexOf(NATIVE_PC_FOLDER.toLowerCase()) === -1 &&
      path.extname(file) === ".ini",
>>>>>>> v2.0.1
  );

  const supported = gameId === GAME_ID && filtered.length > 0;
  return Promise.resolve({
    supported,
    requiredFiles: [],
  });
}

function isSupported(files, gameId) {
<<<<<<< HEAD
  const strackerFiles = STRACKER_FILES.filter((stracker) => files.includes(stracker));
=======
  const strackerFiles = STRACKER_FILES.filter((stracker) =>
    files.includes(stracker),
  );
>>>>>>> v2.0.1
  if (strackerFiles.length > 0) {
    return Promise.resolve({ supported: false, requiredFiles: [] });
  }
  // Ensure that the archive structure has the nativePC Folder present.
  const supported =
    gameId === GAME_ID &&
<<<<<<< HEAD
    files.find((file) => file.toLowerCase().indexOf(NATIVE_PC_FOLDER.toLowerCase()) !== -1) !==
      undefined;
=======
    files.find(
      (file) =>
        file.toLowerCase().indexOf(NATIVE_PC_FOLDER.toLowerCase()) !== -1,
    ) !== undefined;
>>>>>>> v2.0.1
  return Promise.resolve({
    supported,
    requiredFiles: [],
  });
}

module.exports = {
  default: main,
};
