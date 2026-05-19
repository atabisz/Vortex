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
const entryPoint = path.resolve(extensionPath, "src", "index.ts");
const output = path.resolve(extensionPath, "dist", "index.cjs");

const config = createConfig(entryPoint, output, []);
await bundle(config);
