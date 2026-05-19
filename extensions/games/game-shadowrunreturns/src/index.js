const path = require("path");
const { fs, util } = require("vortex-api");

function findGame() {
<<<<<<< HEAD
  return util.steam.findByName("Shadowrun Returns").then((game) => game.gamePath);
=======
  return util.steam
    .findByName("Shadowrun Returns")
    .then((game) => game.gamePath);
>>>>>>> v2.0.1
}

function modPath() {
  return path.join("Shadowrun_Data", "StreamingAssets", "ContentPacks");
}

function prepareForModding(discovery) {
<<<<<<< HEAD
  return fs.ensureDirWritableAsync(path.join(discovery.path, modPath()), () => Promise.resolve());
=======
  return fs.ensureDirWritableAsync(path.join(discovery.path, modPath()), () =>
    Promise.resolve(),
  );
>>>>>>> v2.0.1
}
const supportedTools = [
  {
    id: "shadowruneditor",
    name: "Editor",
    logo: "auto",
    executable: () => "ShadowrunEditor.exe",
    requiredFiles: ["ShadowrunEditor.exe"],
    relative: true,
  },
];

function main(context) {
  context.registerGame({
    id: "shadowrunreturns",
    name: "Shadowrun Returns",
    mergeMods: false,
    queryPath: findGame,
    supportedTools,
    setup: prepareForModding,
    queryModPath: modPath,
    logo: "gameart.jpg",
    executable: () => "Shadowrun.exe",
    requiredFiles: ["Shadowrun.exe"],
    environment: {
      SteamAPPId: "234650",
    },
    details: {
      steamAppId: 234650,
      hashFiles: [
        "Shadowrun_Data/Managed/Assembly-UnityScript.dll",
        "Shadowrun_Data/Managed/Assembly-CSharp.dll",
        "Shadowrun_Data/Managed/Assembly-CSharp-firstpass.dll",
        "ShadowrunEditor.exe",
      ],
    },
  });

  return true;
}

module.exports = {
  default: main,
};
