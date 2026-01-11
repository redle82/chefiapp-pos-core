/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts', '**/*.test.tsx'],
  testPathIgnorePatterns: ['/node_modules/', '/nervous-system/AppStaff.stress.test.ts', 'property-based.test.ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: 'tests/tsconfig.json',
      jsx: 'react',
    }],
  },
  collectCoverageFrom: [
    '**/*.ts',
    '!**/node_modules/**',
    '!**/tests/**',
  ],
  coverageDirectory: 'coverage',
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  verbose: true,
  testTimeout: 30000,
  setupFiles: ['<rootDir>/tests/setup.ts'],
  // Ignore node_modules in tests directory
  modulePathIgnorePatterns: ['<rootDir>/tests/node_modules'],
  // Map merchant-portal imports for cross-workspace testing
  moduleNameMapper: {
    '^@merchant-portal/(.*)$': '<rootDir>/merchant-portal/src/$1',
    '^.*/state/SystemStateProvider$': '<rootDir>/tests/__mocks__/SystemStateProvider.ts',
    '^.*/core/state/SystemStateProvider$': '<rootDir>/tests/__mocks__/SystemStateProvider.ts',
    // Fix UUID ES6 module issue - use mock instead
    '^uuid$': '<rootDir>/tests/__mocks__/uuid.ts',
  },
};
