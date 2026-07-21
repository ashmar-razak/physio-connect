/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  rootDir: ".",
  testMatch: ["<rootDir>/tests/**/*.test.ts"],
  globalSetup: "<rootDir>/tests/setup/globalSetup.ts",
  setupFilesAfterEnv: ["<rootDir>/tests/setup/setupAfterEnv.ts"],
  // Tests share one SQLite file DB — run serially to avoid cross-file races.
  maxWorkers: 1,
  testTimeout: 15000,
};
