// @ts-nocheck
/// <reference types="vitest" />
import { defineConfig } from "vite";

export default defineConfig({
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
