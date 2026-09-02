// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const globals = require('globals');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
  },
  {
    // Focused unit tests (see context/progress-tracker.md's Testing
    // section) — jest-expo's runtime provides these globals; this only
    // teaches the linter about them.
    files: ['jest.setup.js', '**/__tests__/**/*.{ts,tsx,js}'],
    languageOptions: {
      globals: globals.jest,
    },
  },
]);
