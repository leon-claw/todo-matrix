import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const rootDir = path.resolve(import.meta.dirname, '..');
const apiBase = 'https://todo-matrix.jianghong.site/api';
const appOrigin = 'https://todo-matrix.jianghong.site';
const otaBase = 'https://todo-matrix.jianghong.site/ota';

test('production builds use the new Todo Matrix API domain', async () => {
  const viteConfig = await readFile(path.join(rootDir, 'vite.config.ts'), 'utf8');
  const electronMain = await readFile(path.join(rootDir, 'electron', 'main.ts'), 'utf8');
  const wechatBuildScript = await readFile(
    path.join(rootDir, 'scripts', 'build-wechat-miniprogram.mjs'),
    'utf8',
  );

  assert.match(viteConfig, new RegExp(`PRODUCTION_API_BASE_URL = .*${apiBase}`));
  assert.match(viteConfig, /__TODO_MATRIX_API_BASE_FALLBACK__:\s*JSON\.stringify\(process\.env\.TODO_MATRIX_API_BASE \|\| ''\)/);
  assert.match(electronMain, new RegExp(`PRODUCTION_API_BASE = '${appOrigin}'`));
  assert.match(wechatBuildScript, new RegExp(`DEFAULT_API_BASE_URL = '${apiBase}'`));
});

test('OTA defaults use the new Todo Matrix static domain', async () => {
  const viteConfig = await readFile(path.join(rootDir, 'vite.config.ts'), 'utf8');
  const releaseOtaScript = await readFile(path.join(rootDir, 'scripts', 'release-ota.mjs'), 'utf8');
  const androidOtaScript = await readFile(path.join(rootDir, 'scripts', 'build-android-ota.mjs'), 'utf8');
  const windowsOtaScript = await readFile(path.join(rootDir, 'scripts', 'build-windows-ota.mjs'), 'utf8');

  assert.match(viteConfig, new RegExp(`${otaBase}/android/manifest\\.json`));
  assert.match(releaseOtaScript, new RegExp(`defaultBaseUrl = '${otaBase}'`));
  assert.match(androidOtaScript, new RegExp(`${otaBase}/android`));
  assert.match(windowsOtaScript, new RegExp(`${otaBase}/windows`));
});
