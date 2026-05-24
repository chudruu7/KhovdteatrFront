const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const projectRoot = __dirname;
const config = getDefaultConfig(projectRoot);
const nodeModulesPath = path.join(projectRoot, 'node_modules');

config.resolver.extraNodeModules = {
  ...(config.resolver.extraNodeModules || {}),
  'expo-linking': path.join(nodeModulesPath, 'expo-linking'),
};
config.resolver.nodeModulesPaths = [nodeModulesPath];

module.exports = config;
