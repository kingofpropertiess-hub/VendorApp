module.exports = {
  preset: '@react-native/jest-preset',
  // Several RN navigation/UI libs ship untranspiled ESM; let Babel transform them in tests.
  // Note: the lookahead matches package-name prefixes (e.g. "react-native-vec…"), no trailing slash.
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-navigation|@testing-library))',
  ],
};
