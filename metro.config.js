const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// Enable resolution of conditional exports for packages like @noble/hashes
config.resolver.unstable_conditionNames = [
  ...new Set([
    "browser",
    "require",
    "react-native",
    ...(config.resolver.unstable_conditionNames || []),
  ]),
];

module.exports = withNativeWind(config, { input: "./global.css" });
