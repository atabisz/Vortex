import { defineConfig } from "eslint/config";
import globals from "globals";

import { baseConfig } from "../../eslint.config.base.mjs";

export default defineConfig([
  ...baseConfig(import.meta.dirname),
  {
    files: ["src/**/*.ts"],
<<<<<<< HEAD
=======
    extends: [eslint.configs.recommended, tseslint.configs.recommendedTypeChecked, prettierConfig],
>>>>>>> v2.0.2
    languageOptions: {
      globals: { ...globals.node },
    },
    rules: {
      // TODO: to be removed after warnings have been fixed
      "@typescript-eslint/no-unsafe-assignment": "warn",
      "@typescript-eslint/no-unsafe-call": "warn",
      "@typescript-eslint/no-unsafe-member-access": "warn",
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
