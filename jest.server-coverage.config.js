/**
 * Jest config for server-only coverage (no global thresholds).
 * Use: jest -c jest.server-coverage.config.js --coverage
 * Then: npm run check:server-coverage
 */
const base = require("./jest.config.js");
const nodeProject = base.projects.find((p) => p.displayName === "node") || base;

module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/tests"],
  testMatch: [
    "**/unit/server/**/*.test.ts",
    "**/unit/billing/stripeWebhookHandler.test.ts",
  ],
  testPathIgnorePatterns: ["/node_modules/"],
  collectCoverageFrom: ["server/**/*.ts", "!**/node_modules/**"],
  coverageDirectory: "coverage",
  coverageReporters: ["json", "text", "text-summary"],
  coverageThreshold: {},
  setupFiles: ["<rootDir>/tests/setup.ts"],
  transform: nodeProject.transform,
  moduleNameMapper: nodeProject.moduleNameMapper || {},
  modulePathIgnorePatterns: ["<rootDir>/tests/node_modules"],
};
