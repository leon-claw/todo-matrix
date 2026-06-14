import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { removeForcedProductSubdirectory } from '../scripts/build-windows-nsis.mjs';

const rootDir = path.resolve(import.meta.dirname, '..');

test('package scripts expose separate Windows, Mac, and GitHub release commands', async () => {
  const packageJson = JSON.parse(await readFile(path.join(rootDir, 'package.json'), 'utf8'));

  assert.equal(packageJson.scripts['release:build:windows'], 'powershell -ExecutionPolicy Bypass -File scripts/release/build-windows.ps1');
  assert.equal(packageJson.scripts['release:build:mac'], 'bash scripts/release/build-mac.sh');
  assert.equal(packageJson.scripts['release:github'], 'node scripts/release/github-release.mjs');
});

test('release scripts keep platform builds and GitHub publishing separate', async () => {
  const windowsScript = await readFile(path.join(rootDir, 'scripts/release/build-windows.ps1'), 'utf8');
  const nsisBuildScript = await readFile(
    path.join(rootDir, 'scripts/build-windows-nsis.mjs'),
    'utf8',
  );
  const macScript = await readFile(path.join(rootDir, 'scripts/release/build-mac.sh'), 'utf8');
  const githubScript = await readFile(path.join(rootDir, 'scripts/release/github-release.mjs'), 'utf8');
  const forgeConfig = await readFile(path.join(rootDir, 'forge.config.cjs'), 'utf8');
  const builderConfig = await readFile(
    path.join(rootDir, 'electron-builder.windows.cjs'),
    'utf8',
  );
  const installerInclude = await readFile(
    path.join(rootDir, 'build', 'installer.nsh'),
    'utf8',
  );
  const packageJson = JSON.parse(await readFile(path.join(rootDir, 'package.json'), 'utf8'));

  assert.ok(packageJson.devDependencies['electron-builder']);
  assert.equal(packageJson.devDependencies['@electron-forge/maker-squirrel'], undefined);
  assert.equal(packageJson.scripts['desktop:make:squirrel:proxy'], undefined);
  assert.match(forgeConfig, /MakerZIP/);
  assert.doesNotMatch(forgeConfig, /MakerSquirrel/);
  assert.match(builderConfig, /oneClick:\s*false/);
  assert.match(builderConfig, /allowToChangeInstallationDirectory:\s*true/);
  assert.match(builderConfig, /perMachine:\s*false/);
  assert.match(builderConfig, /executableName:\s*'todo-matrix'/);
  assert.match(builderConfig, /createDesktopShortcut:\s*false/);
  assert.match(builderConfig, /createStartMenuShortcut:\s*true/);
  assert.match(builderConfig, /runAfterFinish:\s*true/);
  assert.match(builderConfig, /include:\s*'build\/installer\.nsh'/);
  assert.match(installerInclude, /创建桌面快捷方式/);
  assert.match(installerInclude, /\$\{NSD_Check\}\s+\$DesktopShortcutCheckbox/);
  assert.match(installerInclude, /CreateShortCut "\$newDesktopLink" "\$appExe"/);
  assert.match(
    installerInclude,
    /\$INSTDIR\\\$\{APP_EXECUTABLE_FILENAME\}/,
  );
  assert.doesNotMatch(installerInclude, /\$launchLink/);
  assert.match(windowsScript, /build-windows-nsis\.mjs/);
  assert.match(nsisBuildScript, /finally/);
  assert.match(windowsScript, /TodoMatrixSetup\.exe/);
  assert.match(windowsScript, /windows-portable\.zip/);
  assert.match(macScript, /macos/);
  assert.match(macScript, /android/);
  assert.match(macScript, /ios/);
  assert.match(githubScript, /GITHUB_TOKEN/);
  assert.match(githubScript, /draft/);
  assert.match(githubScript, /release-artifacts/);
});

test('Windows NSIS build keeps the exact directory selected by the user', () => {
  const upstreamTemplate = `
    !include StrContains.nsh

    # sanitize the MUI_PAGE_DIRECTORY result to make sure it has a application name sub-folder
    Function instFilesPre
      \${StrContains} $0 "\${APP_FILENAME}" $INSTDIR
      \${If} $0 == ""
        StrCpy $INSTDIR "$INSTDIR\\\${APP_FILENAME}"
      \${endIf}
    FunctionEnd
  `;

  const patchedTemplate = removeForcedProductSubdirectory(upstreamTemplate);

  assert.doesNotMatch(patchedTemplate, /StrContains/);
  assert.doesNotMatch(patchedTemplate, /!include StrContains\.nsh/);
  assert.doesNotMatch(patchedTemplate, /StrCpy \$INSTDIR/);
  assert.match(patchedTemplate, /Function instFilesPre/);
});

test('release artifacts are excluded from git', async () => {
  const gitignore = await readFile(path.join(rootDir, '.gitignore'), 'utf8');
  assert.match(gitignore, /^release-artifacts$/m);
});
