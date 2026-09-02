// Minimal setup for the focused unit tests under src/**/__tests__ — see
// context/progress-tracker.md's Testing section for what's in/out of scope
// (targeted high-risk logic only, not a general test framework buildout).
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
