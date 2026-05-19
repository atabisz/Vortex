import * as path from "node:path";
<<<<<<< HEAD

import { createConfig, bundle } from "../../scripts/extensions-rolldown.mjs";
=======
import {
  createConfig,
  bundle,
  nativeRemapPlugin,
} from "../../scripts/extensions-rolldown.mjs";
>>>>>>> v2.0.1

const extensionPath = path.resolve(import.meta.dirname);

// Main extension bundle
const entryPoint = path.resolve(extensionPath, "src", "index.ts");
const output = path.resolve(extensionPath, "dist", "index.cjs");
<<<<<<< HEAD
const config = createConfig(entryPoint, output);
=======

const remapPlugin = nativeRemapPlugin({
  "./build/Release/bsdiff.node": "./bsdiff.node",
});

const config = createConfig(entryPoint, output, [remapPlugin]);
>>>>>>> v2.0.1
await bundle(config);

// bsdiff worker — runs in a separate thread, needs its own bundle
const workerEntry = path.resolve(extensionPath, "src", "util", "bsdiffWorker.ts");
const workerOutput = path.resolve(extensionPath, "dist", "bsdiffWorker.cjs");
const workerConfig = createConfig(workerEntry, workerOutput);
await bundle(workerConfig);
