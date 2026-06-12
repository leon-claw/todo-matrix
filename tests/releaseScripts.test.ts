import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const rootDir = path.resolve(import.meta.dirname, '..');

test('package scripts expose separate Windows, Mac, and GitHub release commands', async () => {
  const packageJson = JSON.parse(await readFile(path.join(rootDir, 'package.json'), 'utf8'));

  assert.equal(packageJson.scripts['release:build:windows'], 'powershell -ExecutionPolicy Bypass -File scripts/release/build-windows.ps1');
  assert.equal(packageJson.scripts['release:build:mac'], 'bash scripts/release/build-mac.sh');
  assert.equal(packageJson.scripts['release:github'], 'node scripts/release/github-release.mjs');
});

test('release scripts keep platform builds and GitHub publishing separate', async () => {
  const windowsScript = await readFile(path.join(rootDir, 'scripts/release/build-windows.ps1'), 'utf8');
  const macScript = await readFile(path.join(rootDir, 'scripts/release/build-mac.sh'), 'utf8');
  const githubScript = await readFile(path.join(rootDir, 'scripts/release/github-release.mjs'), 'utf8');

  assert.match(windowsScript, /TodoMatrixSetup\.exe/);
  assert.match(windowsScript, /windows-portable\.zip/);
  assert.match(macScript, /macos/);
  assert.match(macScript, /android/);
  assert.match(macScript, /ios/);
  assert.match(githubScript, /GITHUB_TOKEN/);
  assert.match(githubScript, /draft/);
  assert.match(githubScript, /release-artifacts/);
});

test('release artifacts are excluded from git', async () => {
  const gitignore = await readFile(path.join(rootDir, '.gitignore'), 'utf8');
  assert.match(gitignore, /^release-artifacts$/m);
});
