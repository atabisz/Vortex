import { defineConfig } from "eslint/config";

import { baseConfig } from "../../eslint.config.base.mjs";

export default defineConfig([
  ...baseConfig(import.meta.dirname),
  {
    files: ["src/**/*.ts"],
<<<<<<< HEAD
=======
    extends: [eslint.configs.recommended, tseslint.configs.recommendedTypeChecked, prettierConfig],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      perfectionist,
    },
>>>>>>> v2.0.2
    rules: {
      // NOTE: remove after fixing the warnings
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unsafe-argument": "warn",
    },
  },
<<<<<<< HEAD
=======

  {
    files: ["*.mjs"],
    extends: [eslint.configs.recommended, tseslint.configs.recommended, prettierConfig],
    languageOptions: {
      globals: { ...globals.node },
    },
    plugins: { perfectionist },
    rules: {
      // Perfectionist
      "perfectionist/sort-imports": "warn",
      "perfectionist/sort-exports": "warn",
    },
  },
>>>>>>> v2.0.2
]);
