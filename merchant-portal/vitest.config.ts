/// <reference types="vitest" />
import { createRequire } from "node:module";
import path from "node:path";
import { defineConfig } from "vite";

const require = createRequire(import.meta.url);
const testingLibraryPackageJson = require.resolve(
  "@testing-library/react/package.json",
);
const testingLibraryRequire = createRequire(testingLibraryPackageJson);
const reactPath = path.dirname(testingLibraryRequire.resolve("react"));
const reactDomPath = path.dirname(testingLibraryRequire.resolve("react-dom"));

export default defineConfig({
  resolve: {
    dedupe: ["react", "react-dom"],
    alias: {
      react: reactPath,
      "react-dom": reactDomPath,
    },
  },
  test: {
    include: ["**/*.test.ts", "**/*.test.tsx"],
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/*.spec.ts",
      "**/*.e2e.test.tsx",
    ],
    environment: "jsdom", // For React Testing Library
    setupFiles: ["./vitest.setup.ts"],
    globals: true,
  },
});
