const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Force the production web build to use your repository subfolder path
config.transformer = {
  ...config.transformer,
  publicPath: '/Activity-app/_expo',
};

module.exports = config;
