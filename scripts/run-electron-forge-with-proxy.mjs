import { spawn } from 'node:child_process';
import path from 'node:path';

const command = process.argv[2];
const args = process.argv.slice(3);

if (!command) {
  console.error('Usage: node scripts/run-electron-forge-with-proxy.mjs <forge-command> [...args]');
  process.exit(1);
}

const proxy = process.env.TODO_MATRIX_DESKTOP_PROXY || 'http://localhost:7897';
const electronForgeBin = path.resolve(
  'node_modules',
  '.bin',
  process.platform === 'win32' ? 'electron-forge.cmd' : 'electron-forge',
);

const forgeArgs = [command, ...args];
const child = spawn(
  process.platform === 'win32' ? process.env.ComSpec || 'cmd.exe' : electronForgeBin,
  process.platform === 'win32' ? ['/d', '/s', '/c', electronForgeBin, ...forgeArgs] : forgeArgs,
  {
  env: {
    ...process.env,
    ELECTRON_GET_USE_PROXY: process.env.ELECTRON_GET_USE_PROXY || '1',
    HTTP_PROXY: process.env.HTTP_PROXY || proxy,
    HTTPS_PROXY: process.env.HTTPS_PROXY || proxy,
    http_proxy: process.env.http_proxy || proxy,
    https_proxy: process.env.https_proxy || proxy,
    npm_config_cache: process.env.npm_config_cache || path.resolve('.npm-cache'),
  },
  shell: false,
  stdio: 'inherit',
  },
);

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 1);
});

child.on('error', (error) => {
  console.error(error);
  process.exit(1);
});
