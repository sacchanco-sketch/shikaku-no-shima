module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    // react-native-reanimated 4.x はワークレット変換を react-native-worklets に委譲しているため、
    // babel プラグインは "react-native-worklets/plugin" を指定する。
    // 必ずプラグインリストの最後に置くこと。
    plugins: ["react-native-worklets/plugin"],
  };
};
