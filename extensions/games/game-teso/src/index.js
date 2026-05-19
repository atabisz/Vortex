const { log, util } = require("vortex-api");

<<<<<<< HEAD
const { remote } = require("electron");
=======
>>>>>>> v2.0.1
const path = require("path");
const winapi = require("winapi-bindings");

function findGame() {
  try {
    let regKey =
      process.arch === "x32"
        ? "Software\\Zenimax_Online\\Launcher"
        : "Software\\Wow6432Node\\Zenimax_Online\\Launcher";

    const instPath = winapi.RegGetValue("HKEY_LOCAL_MACHINE", regKey, "InstallPath");
    if (!instPath) {
      throw new Error("empty registry key");
    }
    return Promise.resolve(path.join(instPath.value, "Launcher"));
  } catch (err) {
    return util.steam.findByName("The Elder Scrolls Online").then((game) => game.gamePath);
  }
}

function modPath() {
<<<<<<< HEAD
  return path.join(remote.app.getPath("documents"), "Elder Scrolls Online", "live", "Addons");
=======
  return path.join(util.getVortexPath("documents"), "Elder Scrolls Online", "live", "Addons");
>>>>>>> v2.0.1
}

function main(context) {
  context.registerGame({
    id: "teso",
    name: "The Elder Scrolls Online",
    mergeMods: true,
    queryPath: findGame,
    queryModPath: modPath,
    logo: "gameart.jpg",
    executable: () => "Bethesda.net_Launcher.exe",
<<<<<<< HEAD
    requiredFiles: ["Bethesda.net_Launcher.exe"],
=======
    requiredFiles: [],
>>>>>>> v2.0.1
    environment: {
      SteamAPPId: "306130",
    },
    details: {
      steamAppId: 306130,
      nexusPageId: "elderscrollsonline",
      hashFiles: [
        "../The Elder Scrolls Online/game/game_player.version",
        "../The Elder Scrolls Online/depot/depot.version",
        "Bethesda.net_Launcher.version",
      ],
    },
  });

  return true;
}

module.exports = {
  default: main,
};
