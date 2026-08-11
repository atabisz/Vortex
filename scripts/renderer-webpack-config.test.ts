import { createRequire } from "node:module";
import * as path from "node:path";

import { describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);
const webpackConfigPath = path.resolve(import.meta.dirname, "../src/renderer/webpack.config.cjs");
const rendererConfig = require(webpackConfigPath) as {
  rendererExternalsAllowlist: unknown[];
};

describe("renderer webpack runtime module identity", () => {
  it("never allowlists @vortex/shared for bundling", () => {
    expect(
      rendererConfig.rendererExternalsAllowlist.some((entry) =>
        entry instanceof RegExp ? entry.test("@vortex/shared") : entry === "@vortex/shared",
      ),
    ).toBe(false);
  });

  it("bundles only the Linux winapi shim exception", () => {
    expect(rendererConfig.rendererExternalsAllowlist).toEqual(
      process.platform === "linux" ? ["winapi-bindings"] : [],
    );
  });
});
