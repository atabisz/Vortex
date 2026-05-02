import { defineConfig } from "tsdown";

export default defineConfig({
  entry: { index: "./src/index.ts" },
  format: ["cjs"],
  dts: true,
  platform: "node",
  exports: "named",
});
