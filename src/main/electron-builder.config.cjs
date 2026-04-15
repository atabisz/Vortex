// @ts-check
const fs = require("fs");
const path = require("path");

/** @type {import('electron-builder').Configuration} */
const config = {
  $schema:
    "https://github.com/electron-userland/electron-builder/raw/refs/tags/v24.13.3/packages/app-builder-lib/scheme.json",
  appId: "com.nexusmods.vortex",
  includeSubNodeModules: false,
  directories: {
    buildResources: "./nsis",
    app: "./dist",
    output: "../../dist",
  },
  win: {
    target: "nsis",
    icon: "nsis/icon.ico",
    publish: [
      {
        provider: "github",
        owner: "Nexus-Mods",
        repo: "Vortex",
        private: false,
      },
    ],
    publisherName: ["Black Tree Gaming Limited", "Black Tree Gaming Ltd"],
    signingHashAlgorithms: ["sha256"],
    rfc3161TimeStampServer: "http://timestamp.comodoca.com/rfc3161",
    timeStampServer: "http://timestamp.comodoca.com",
    extraResources: [
      "./build/VC_redist.x64.exe",
      "./build/windowsdesktop-runtime-win-x64.exe",
    ],
  },
  nsis: {
    perMachine: true,
    runAfterFinish: true,
    menuCategory: false,
    oneClick: false,
    allowToChangeInstallationDirectory: true,
    uninstallDisplayName: "${productName}",
    include: "./nsis/installer.nsh",
    artifactName: "vortex-setup-${version}.${ext}",
    installerIcon: "nsis/icon.ico",
    installerHeaderIcon: "nsis/icon.ico",
  },
  linux: {
    target: ["AppImage", "deb"],
    artifactName: "vortex-setup-${version}.${ext}",
    icon: "../../assets/images/vortex.png",
    category: "Network;Development;Game;",
    synopsis: "Mod Manager",
    description:
      "The elegant, powerful, and open-source mod manager from Nexus Mods.",
    maintainer:
      "Black Tree Gaming Ltd. <support@nexusmods.com> (https://www.nexusmods.com/)",
    mimeTypes: ["x-scheme-handler/nxm"],
    publish: [
      {
        provider: "github",
        owner: "Nexus-Mods",
        repo: "Vortex",
        private: false,
      },
    ],
    extraFiles: [
      {
        from: "../../build/linux/io.nexusmods.vortex.policy",
        to: "/usr/share/polkit-1/actions/io.nexusmods.vortex.policy",
      },
    ],
  },
  deb: {
    depends: ["xdg-utils", "libasound2", "liblz4-1", "zlib1g"],
    artifactName: "vortex_amd64.deb",
    afterInstall: "../../build/linux/deb-postinstall.sh",
  },
  extraResources: [
    "./nsis/**/*",
    {
      from: "../../locales",
      to: "locales",
    },
  ],
  // On Linux, the native winapi-bindings .node binary is replaced with a
  // plain-JS stub before electron-builder scans the app directory (see
  // beforePack below). The stub satisfies unconditional require() calls from
  // packages like permissions/index.js that only use winapi on Windows.
  // No exclusion pattern needed — the directory contains only JS after the swap.
  files: ["**/*"],

  beforePack: async (context) => {
    if (process.platform !== "linux") return;

    // __dirname is src/main/; the app directory is src/main/dist/
    const winapiDir = path.join(
      __dirname,
      "dist",
      "node_modules",
      "winapi-bindings",
    );
    const stubDir = path.resolve(
      __dirname,
      "../../build/linux/winapi-bindings-stub",
    );

    // Replace the installed native package with the plain-JS stub so that:
    // 1. No .node binary ends up in the asar (avoids asarUnpack conflicts)
    // 2. require('winapi-bindings') from external packages resolves at runtime
    fs.rmSync(winapiDir, { recursive: true, force: true });
    fs.mkdirSync(winapiDir, { recursive: true });
    for (const file of fs.readdirSync(stubDir)) {
      fs.copyFileSync(
        path.join(stubDir, file),
        path.join(winapiDir, file),
      );
    }

    // bluebird is a direct dependency of @vortex/main (top-level in dist/node_modules/)
    // so we cannot add node_modules/bluebird/** to asarUnpack without an EEXIST conflict.
    // Instead, nest a copy under modmeta-db/node_modules/bluebird/ so that it is covered
    // by the existing "node_modules/modmeta-db/**" asarUnpack glob and ends up in
    // app.asar.unpacked — where the unpacked modmeta-db can resolve it.
    const bluebirdSrc = path.join(__dirname, "dist", "node_modules", "bluebird");
    const bluebirdDest = path.join(
      __dirname,
      "dist",
      "node_modules",
      "modmeta-db",
      "node_modules",
      "bluebird",
    );
    if (fs.existsSync(bluebirdSrc) && !fs.existsSync(bluebirdDest)) {
      fs.cpSync(bluebirdSrc, bluebirdDest, { recursive: true });
    }
  },
  asar: true,
  asarUnpack: [
    "LICENSE.md",
    "bundledPlugins",
    "duckdb-extensions/**",
    "node_modules/7z-bin",
    "node_modules/bootstrap-sass/assets/stylesheets",
    "node_modules/react-select/scss",
    "node_modules/@nexusmods/fomod-installer-native/dist/*.dll",
    "node_modules/@nexusmods/fomod-installer-ipc/dist/*.exe",
    "assets/*.exe",
    "node_modules/@nexusmods/fomod-installer-native/prebuilds/linux-x64/ModInstaller.Native.so",
    "node_modules/@nexusmods/fomod-installer-ipc/dist/ModInstallerIPC",
    "assets/dotnetprobe",
    "assets/css/**",
    "**/*.node",
    // modmeta-db and all its runtime deps must be outside the asar so that:
    // 1. bundledPlugins extensions (mo-import, nmm-import-tool) can require("modmeta-db")
    //    from app.asar.unpacked via normal Node.js path resolution
    // 2. leveldown's node-gyp-build can find its prebuilt .node binary from a real
    //    filesystem path (asar virtual paths cause silent readdirSync failures)
    // 3. require() from app.asar.unpacked cannot cross back into app.asar, so bluebird,
    //    levelup, and encoding-down must also be unpacked alongside modmeta-db.
    //    bluebird is injected as a nested copy under modmeta-db/ by beforePack (below)
    //    so the top-level bluebird in the asar is untouched and no EEXIST conflict occurs.
    "node_modules/modmeta-db/**",
    "node_modules/leveldown/**",
    "node_modules/levelup/**",
    "node_modules/encoding-down/**",
  ],
  buildDependenciesFromSource: false,
  npmRebuild: false,
};

module.exports = config;
