import { spawn } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const assistedInstallerPath = path.join(
  projectRoot,
  'node_modules',
  'app-builder-lib',
  'templates',
  'nsis',
  'assistedInstaller.nsh',
);

const forcedProductSubdirectoryPattern =
  /    # sanitize the MUI_PAGE_DIRECTORY result to make sure it has a application name sub-folder\r?\n    Function instFilesPre\r?\n      \$\{StrContains\} \$0 "\$\{APP_FILENAME\}" \$INSTDIR\r?\n      \$\{If\} \$0 == ""\r?\n        StrCpy \$INSTDIR "\$INSTDIR\\\$\{APP_FILENAME\}"\r?\n      \$\{endIf\}\r?\n    FunctionEnd/;

export function removeForcedProductSubdirectory(template) {
  if (!forcedProductSubdirectoryPattern.test(template)) {
    throw new Error(
      'The electron-builder NSIS directory hook has changed; refusing to patch an unknown template.',
    );
  }

  return template
    .replace(/    !include StrContains\.nsh\r?\n\r?\n/, '')
    .replace(
      forcedProductSubdirectoryPattern,
      [
        '    # Respect the exact installation directory selected by the user.',
        '    Function instFilesPre',
        '    FunctionEnd',
      ].join('\n'),
    );
}

async function runElectronBuilder(args) {
  const cliPath = path.join(
    projectRoot,
    'node_modules',
    'electron-builder',
    'out',
    'cli',
    'cli.js',
  );
  const proxy = process.env.TODO_MATRIX_DESKTOP_PROXY || 'http://localhost:7897';

  await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [cliPath, ...args], {
      cwd: projectRoot,
      env: {
        ...process.env,
        ELECTRON_GET_USE_PROXY: process.env.ELECTRON_GET_USE_PROXY || '1',
        HTTP_PROXY: process.env.HTTP_PROXY || proxy,
        HTTPS_PROXY: process.env.HTTPS_PROXY || proxy,
        http_proxy: process.env.http_proxy || proxy,
        https_proxy: process.env.https_proxy || proxy,
        npm_config_cache: process.env.npm_config_cache || path.join(projectRoot, '.npm-cache'),
      },
      stdio: 'inherit',
    });

    child.once('error', reject);
    child.once('exit', (code, signal) => {
      if (signal) {
        reject(new Error(`electron-builder terminated by signal ${signal}`));
      } else if (code !== 0) {
        reject(new Error(`electron-builder failed with exit code ${code ?? 1}`));
      } else {
        resolve();
      }
    });
  });
}

async function main() {
  const originalTemplate = await readFile(assistedInstallerPath, 'utf8');
  const patchedTemplate = removeForcedProductSubdirectory(originalTemplate);
  await writeFile(assistedInstallerPath, patchedTemplate, 'utf8');

  try {
    await runElectronBuilder(process.argv.slice(2));
  } finally {
    await writeFile(assistedInstallerPath, originalTemplate, 'utf8');
  }
}

const isMainModule =
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMainModule) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
