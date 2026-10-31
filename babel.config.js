module.exports = {
  presets: ['module:@react-native/babel-preset'],
  // react-native-reanimated 4 / react-native-worklets require this plugin and it
  // MUST stay last in the plugins list.
  plugins: ['react-native-worklets/plugin'],
};
