import js from "@eslint/js";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import { defineConfig, globalIgnores } from "eslint/config";
import globals from "globals";
import tseslint from "typescript-eslint";

export default defineConfig([
  globalIgnores([
    "dist",
    "dev-dist",
    "scripts/**",
    "tests/**",
    "e2e/**",
    "**/*.test.ts",
    "**/*.test.tsx",
    "**/*.spec.ts",
    "**/*.spec.tsx",
  ]),
  {
    files: ["src/**/*.{ts,tsx}"],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      // NOTE: Not using reactHooks.configs.flat.recommended because it includes
      // React Compiler experimental rules (react-hooks v7+) that cause errors.
      // We manually configure react-hooks rules below.
      reactRefresh.configs.vite,
    ],
    plugins: {
      "react-hooks": reactHooks,
    },
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      // TypeScript rules - relaxed
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/ban-ts-comment": "warn",
      "@typescript-eslint/prefer-as-const": "warn",
      "@typescript-eslint/no-non-null-asserted-optional-chain": "warn",
      // General rules - relaxed
      "no-empty": "warn",
      "no-useless-escape": "warn",
      "no-case-declarations": "warn",
      "no-async-promise-executor": "warn",
      // React Refresh
      "react-refresh/only-export-components": "warn",
      // React Hooks - keep essential rules
      "react-hooks/rules-of-hooks": "warn",
      "react-hooks/exhaustive-deps": "warn",
      // Disable ALL React Compiler experimental rules (react-hooks v7+)
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/ref-access-during-render": "off",
      "react-hooks/component-during-render": "off",
      "react-hooks/impure-function-during-render": "off",
      "react-hooks/variable-access-before-declaration": "off",
      "react-hooks/dependency-expression-issue": "off",
      "react-hooks/react-compiler": "off",
    },
  },
]);
