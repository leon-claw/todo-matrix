module.exports = {
  appId: 'site.jianghong.todomatrix',
  productName: 'Todo Matrix',
  directories: {
    output: 'out/nsis',
  },
  win: {
    executableName: 'todo-matrix',
    icon: 'assets/branding/todo-matrix-icon.ico',
    target: [
      {
        target: 'nsis',
        arch: ['x64'],
      },
    ],
  },
  nsis: {
    include: 'build/installer.nsh',
    oneClick: false,
    perMachine: false,
    allowToChangeInstallationDirectory: true,
    createDesktopShortcut: false,
    createStartMenuShortcut: true,
    runAfterFinish: true,
    shortcutName: 'Todo Matrix',
    artifactName: 'TodoMatrixSetup.${ext}',
  },
};
