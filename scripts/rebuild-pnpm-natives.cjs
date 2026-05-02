// Rebuild native addons that live in pnpm's isolated store and are missed by
// @electron/rebuild's directory traversal. Run after `@electron/rebuild`.
//
// Each entry maps an addon package name to the workspace directory whose
// node_modules holds the pnpm symlink for that addon.
"use strict";

const { execSync } = require("child_process");
const path = require("path");

const ELECTRON_VERSION = "39.8.0";
const GYP_FLAGS = `--target=${ELECTRON_VERSION} --arch=x64 --dist-url=https://electronjs.org/headers`;

const projectRoot = path.resolve(__dirname, "..");

const addons = [
  {
    name: "loot",
    workspace: path.join(projectRoot, "extensions", "gamebryo-plugin-management", "node_modules"),
  },
  {
    name: "font-scanner",
    workspace: path.join(projectRoot, "extensions", "theme-switcher", "node_modules"),
  },
];

for (const { name, workspace } of addons) {
  let addonDir;
  try {
    addonDir = path.dirname(
      require.resolve(`${name}/package.json`, { paths: [workspace, path.join(projectRoot, "node_modules")] }),
    );
  } catch {
    console.log(`Skipping ${name} (not found)`);
    continue;
  }

  console.log(`Rebuilding ${name} at: ${addonDir}`);
  try {
    execSync(`node-gyp rebuild ${GYP_FLAGS}`, { cwd: addonDir, stdio: "inherit" });
  } catch (err) {
    console.error(`Failed to rebuild ${name}: ${err.message}`);
    process.exit(1);
  }
}
