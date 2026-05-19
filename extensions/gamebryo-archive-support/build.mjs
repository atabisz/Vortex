import * as path from "node:path";
<<<<<<< HEAD:extensions/gamebryo-archive-support/build.mjs

import { createConfig, bundle } from "../../scripts/extensions-rolldown.mjs";
=======
import {
  createConfig,
  bundle,
  nativeRemapPlugin,
} from "../../scripts/extensions-rolldown.mjs";
>>>>>>> v2.0.1:extensions/gamebryo-ba2-support/build.mjs

const extensionPath = path.resolve(import.meta.dirname);
const entryPoint = path.resolve(extensionPath, "src", "index.ts");
const output = path.resolve(extensionPath, "dist", "index.cjs");

<<<<<<< HEAD:extensions/gamebryo-archive-support/build.mjs
const config = createConfig(entryPoint, output);
=======
const remapPlugin = nativeRemapPlugin({
  "./build/Release/ba2tk": "./ba2tk.node",
});

const config = createConfig(entryPoint, output, [remapPlugin]);
>>>>>>> v2.0.1:extensions/gamebryo-ba2-support/build.mjs
await bundle(config);
