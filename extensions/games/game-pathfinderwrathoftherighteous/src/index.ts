const path = require("path");
const { fs, types, util } = require("vortex-api");

const GAME_ID = "pathfinderwrathoftherighteous";
const NAME = "Pathfinder: Wrath\tof the Righteous";
const STEAM_ID = "1184370";
const GOG_ID = "1207187357";

function findGame() {
<<<<<<< HEAD
  return util.GameStoreHelper.findByAppId([STEAM_ID, GOG_ID]).then((game) => game.gamePath);
=======
  return util.GameStoreHelper.findByAppId([STEAM_ID, GOG_ID]).then(
    (game) => game.gamePath,
  );
>>>>>>> v2.0.1
}

function setup(discovery) {
  return fs.ensureDirWritableAsync(path.join(discovery.path, "Mods"));
}

async function resolveGameVersion(discoveryPath: string) {
<<<<<<< HEAD
  const versionFilepath = path.join(discoveryPath, "Wrath_Data", "StreamingAssets", "Version.info");
=======
  const versionFilepath = path.join(
    discoveryPath,
    "Wrath_Data",
    "StreamingAssets",
    "Version.info",
  );
>>>>>>> v2.0.1
  try {
    const data = await fs.readFileAsync(versionFilepath, { encoding: "utf8" });
    const segments = data.split(" ");
    return segments[3]
      ? Promise.resolve(segments[3])
      : Promise.reject(new util.DataInvalid("Failed to resolve version"));
  } catch (err) {
    return Promise.reject(err);
  }
}

function main(context) {
  context.requireExtension("modtype-umm");
  context.registerGame({
    id: GAME_ID,
    name: NAME,
    logo: "gameart.jpg",
    mergeMods: true,
    queryPath: findGame,
    queryModPath: () => "Mods",
    executable: () => "Wrath.exe",
    getGameVersion: resolveGameVersion,
    requiredFiles: ["Wrath.exe"],
    environment: {
      SteamAPPId: STEAM_ID,
    },
    details: {
      steamAppId: +STEAM_ID,
    },
    setup,
  });
  context.once(() => {
    if (context.api.ext.ummAddGame !== undefined) {
      context.api.ext.ummAddGame({
        gameId: GAME_ID,
        autoDownloadUMM: true,
      });
    }
  });

  return true;
}

module.exports = {
  default: main,
};
