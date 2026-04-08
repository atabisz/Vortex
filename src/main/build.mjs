import * as path from "node:path";
import { rolldown } from "rolldown";

import { createConfig, mainOutputDirectory } from "../../rolldown.base.mjs";

const INPUT = path.resolve(import.meta.dirname, "src", "main.ts");
const OUTPUT = path.join(mainOutputDirectory, "main.cjs");

const SHIM_PATH = path.resolve(
  import.meta.dirname,
  "../../src/renderer/src/util/winapi-shim.ts",
);

const linuxAlias =
  process.platform === "linux"
    ? { "winapi-bindings": SHIM_PATH }
    : undefined;

const config = createConfig(INPUT, OUTPUT, "cjs", [], (id) => {
  if (id.startsWith("@vortex/shared")) return false;

  // Never mark aliased modules external — they must be inlined by rolldown.
  // (External resolution runs before alias substitution, so aliased IDs must
  // be explicitly excluded here or the alias never fires.)
  if (linuxAlias && id in linuxAlias) return false;

  if (id.startsWith(".")) return false;
  if (path.isAbsolute(id)) return false;

  return true;
}, linuxAlias);

const bundle = await rolldown(config);
await bundle.write(config.output);
