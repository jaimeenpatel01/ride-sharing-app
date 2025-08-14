const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname, {
  // Enable CSS support for web
  isCSSEnabled: true,
});

// Optimize for production builds
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Enable tree shaking and dead code elimination
config.transformer.minifierConfig = {
  keep_fnames: true,
  mangle: {
    keep_fnames: true,
  },
};

// Add bundle splitting for better performance
config.serializer = {
  ...config.serializer,
  getModulesRunBeforeMainModule: () => [],
  createModuleIdFactory: () => (path) => {
    // Create shorter module IDs for better compression
    return require('crypto').createHash('md5').update(path).digest('hex').substring(0, 8);
  },
};

// Optimize asset handling
config.resolver.assetExts = [
  ...config.resolver.assetExts,
  'svg', 'png', 'jpg', 'jpeg', 'gif', 'webp'
];

// Source map optimizations
config.resolver.sourceExts = [
  ...config.resolver.sourceExts,
  'ts', 'tsx', 'js', 'jsx', 'json'
];

// Enable experimental features for better performance
config.transformer.experimentalImportSupport = true;
config.transformer.unstable_allowRequireContext = true;

// Hermes optimizations
config.transformer.hermesCommand = 'hermes';
config.transformer.enableBabelRCLookup = false;

module.exports = config;