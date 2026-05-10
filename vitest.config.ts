import * as path from "node:path";

import { defineConfig } from "vitest/config";

const RESULTS_DIR = path.join(import.meta.dirname, "test-results");

const isGitHubCI = process.env.CI && process.env.GITHUB_ACTIONS;

export default defineConfig({
  test: {
    projects: [
<<<<<<< HEAD
      "./src/**/vitest.config.ts",
      "./src/main/vitest.downloader.config.ts",
      "./packages/**/vitest.config.ts",
      "./extensions/**/vitest.config.ts",
      "./scripts/vitest.config.ts",
=======
      "./src/main",
      "./scripts",
      "./src/renderer",
      "./src/shared",
      "./packages/paths",
      "./packages/paths-node",
      "./extensions/games/game-stardewvalley",
>>>>>>> v2.0.0
    ],
    reporters: ["default", "junit", isGitHubCI ? "github-actions" : undefined].filter(Boolean),
    outputFile: {
      junit: path.join(RESULTS_DIR, "junit.xml"),
    },
    coverage: {
      provider: "v8",
      reporter: ["text", "cobertura"],
      reportsDirectory: path.join(RESULTS_DIR),
    },
  },
});
