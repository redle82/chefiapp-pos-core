/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/tests"],
  testMatch: ["**/*.test.ts", "**/*.test.tsx"],
  testPathIgnorePatterns: [
    "/node_modules/",
    "/nervous-system/AppStaff.stress.test.ts",
    "property-based.test.ts",
    "/legacy-skip/",
    "/doc-only/",
    "/e2e/",
    "/massive/",
    "core-engine",
    "<rootDir>/merchant-portal/",
  ],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        tsconfig: "tests/tsconfig.json",
        jsx: "react",
      },
    ],
  },
  collectCoverageFrom: ["**/*.ts", "!**/node_modules/**", "!**/tests/**"],
  coverageDirectory: "coverage",
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  verbose: true,
  testTimeout: 30000,
  setupFiles: ["<rootDir>/tests/setup.ts"],
  setupFilesAfterEnv: ["<rootDir>/tests/setup-react.ts"],
  // Ignore node_modules in tests directory
  modulePathIgnorePatterns: ["<rootDir>/tests/node_modules"],
  // Map merchant-portal imports for cross-workspace testing
  moduleNameMapper: {
    "^@merchant-portal/(.*)$": "<rootDir>/merchant-portal/src/$1",
    "^.*/state/SystemStateProvider$":
      "<rootDir>/tests/__mocks__/SystemStateProvider.ts",
    "^.*/core/state/SystemStateProvider$":
      "<rootDir>/tests/__mocks__/SystemStateProvider.ts",
    // Fix UUID ES6 module issue - use mock instead
    "^uuid$": "<rootDir>/tests/__mocks__/uuid.ts",
    // Mock Logger to avoid import.meta issues - must be before other patterns
    "^.*/core/logger/Logger$": "<rootDir>/tests/__mocks__/Logger.ts",
    "^.*/core/logger/Logger\\.ts$": "<rootDir>/tests/__mocks__/Logger.ts",
  },
  // Use jsdom for UI tests
  projects: [
    {
      displayName: "node",
      preset: "ts-jest",
      testEnvironment: "node",
      // Só pastas com testes Jest; merchant-portal usa Vitest (npm test dentro de merchant-portal)
      roots: ["<rootDir>/tests", "<rootDir>/fiscal-modules"],
      testPathIgnorePatterns: [
        "/node_modules/",
        "/legacy-skip/",
        "/doc-only/",
        "/e2e/",
        "/massive/",
        "core-engine",
        "ReservationEngine\\.test",
        "FinanceEngine\\.test",
        "delivery-adapters\\.test",
      ],
      testMatch: [
        "**/*.test.ts",
        "!**/ui/**/*.test.tsx",
        "!**/hooks/**/*.test.ts",
      ],
      setupFiles: ["<rootDir>/tests/setup.ts"],
      transform: {
        "^.+\\.tsx?$": [
          "ts-jest",
          {
            tsconfig: "tests/tsconfig.json",
          },
        ],
      },
    },
    {
      displayName: "jsdom",
      preset: "ts-jest",
      testEnvironment: "jsdom",
      roots: ["<rootDir>/tests"],
      testPathIgnorePatterns: [
        "/node_modules/",
        "/merchant-portal/",
        "/legacy-skip/",
        "/doc-only/",
        "/e2e/",
        "/massive/",
        "/PaymentModal\\.test\\.tsx$", // pulls in backendAdapter (import.meta); test in merchant-portal Vitest
      ],
      testMatch: ["**/ui/**/*.test.tsx", "**/hooks/**/*.test.ts"],
      setupFiles: ["<rootDir>/tests/setup-jsdom.js"],
      setupFilesAfterEnv: ["<rootDir>/tests/setup-react.ts"],
      transform: {
        "^.+\\.tsx?$": [
          "ts-jest",
          {
            tsconfig: "tests/tsconfig.json",
            jsx: "react",
          },
        ],
      },
      moduleNameMapper: {
        "^@merchant-portal/(.*)$": "<rootDir>/merchant-portal/src/$1",
        "^.*/state/SystemStateProvider$":
          "<rootDir>/tests/__mocks__/SystemStateProvider.ts",
        "^.*/core/state/SystemStateProvider$":
          "<rootDir>/tests/__mocks__/SystemStateProvider.ts",
        "^uuid$": "<rootDir>/tests/__mocks__/uuid.ts",
        "^.*/core/logger/Logger$": "<rootDir>/tests/__mocks__/Logger.ts",
        "^.*/core/logger/Logger\\.ts$": "<rootDir>/tests/__mocks__/Logger.ts",
        "^.*gate3-persistence/PostgresLink.*$":
          "<rootDir>/tests/__mocks__/PostgresLink.ts",
        "\\.(css|less|scss|sass)$": "<rootDir>/tests/__mocks__/styleMock.js",
        "^.*/core/infra/backendAdapter$":
          "<rootDir>/tests/__mocks__/backendAdapter.ts",
        "^.*/core/infra/backendAdapter\\.ts$":
          "<rootDir>/tests/__mocks__/backendAdapter.ts",
      },
    },
  ],
};
