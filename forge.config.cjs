const { MakerDMG } = require('@electron-forge/maker-dmg');
const { MakerZIP } = require('@electron-forge/maker-zip');
const path = require('node:path');

const Module = require('node:module');
const loadModule = Module._load;

Module._load = function loadModuleWithViteRunner(request, parent, isMain) {
  const loadedModule = loadModule.apply(this, [request, parent, isMain]);

  if (request !== 'vite') {
    return loadedModule;
  }

  return {
    ...loadedModule,
    loadConfigFromFile: (configEnv, configFile, configRoot, logLevel, customLogger, configLoader) =>
      loadedModule.loadConfigFromFile(configEnv, configFile, configRoot, logLevel, customLogger, configLoader || 'runner'),
  };
};

const { VitePlugin } = require('@electron-forge/plugin-vite');

Module._load = loadModule;

const appIconBase = path.join(__dirname, 'assets', 'branding', 'todo-matrix-icon');
const makers = [
  new MakerDMG({
    format: 'ULFO',
    icon: `${appIconBase}.icns`,
    name: 'Todo Matrix',
  }),
  new MakerZIP({}, ['darwin', 'win32']),
];

module.exports = {
  packagerConfig: {
    asar: true,
    download: {
      cacheRoot: path.join(__dirname, '.npm-cache', 'electron'),
      mirrorOptions: {
        mirror: process.env.ELECTRON_MIRROR || 'https://npmmirror.com/mirrors/electron/',
      },
    },
    executableName: 'todo-matrix',
    icon: appIconBase,
  },
  rebuildConfig: {
    onlyModules: [],
  },
  makers,
  plugins: [
    new VitePlugin({
      build: [
        {
          entry: 'electron/main.ts',
          config: 'vite.main.config.mjs',
        },
        {
          entry: 'electron/preload.ts',
          config: 'vite.preload.config.mjs',
          target: 'preload',
        },
      ],
      renderer: [
        {
          name: 'main_window',
          config: 'vite.renderer.config.mjs',
        },
      ],
    }),
  ],
};
