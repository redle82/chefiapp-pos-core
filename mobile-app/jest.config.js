/** @type {import('jest').Config} */
module.exports = {
  preset: "react-native",
  roots: ["<rootDir>"],
  testMatch: [
    "**/__tests__/**/*.test.[jt]s?(x)",
    "**/?(*.)+(spec|test).[jt]s?(x)",
  ],
  transform: {
    "^.+\\.(ts|tsx)$": ["babel-jest", { configFile: "./babel.config.js" }],
  },
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  setupFiles: ["<rootDir>/__mocks__/setup.ts"],
  transformIgnorePatterns: [
    "node_modules/(?!(react-native|@react-native|expo|@expo|expo-.*|@sentry|react-native-.*|@react-native-async-storage)/)",
  ],
  collectCoverageFrom: [
    "services/**/*.ts",
    "!services/supabase.ts",
    "!**/node_modules/**",
  ],
};
