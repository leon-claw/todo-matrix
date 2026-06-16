import AdmZip from 'adm-zip';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {
  installDesktopBundleFromZip,
  markDesktopOtaReady,
  prepareDesktopRenderer,
  readDesktopOtaState,
} from '../electron/desktopOta';

async function createBundleZip(rootDir: string, version: string) {
  const zip = new AdmZip();
  zip.addFile('index.html', Buffer.from(`<html><body>${version}</body></html>`));
  zip.addFile('assets/app.js', Buffer.from(`console.log("${version}")`));

  const zipPath = path.join(rootDir, `${version}.zip`);
  zip.writeZip(zipPath);
  return zipPath;
}

async function sha256(filePath: string) {
  const content = await readFile(filePath);
  return createHash('sha256').update(content).digest('hex');
}

test('installs a verified desktop bundle as pending', async () => {
  const userDataPath = await mkdtemp(path.join(tmpdir(), 'todo-matrix-desktop-ota-'));
  const version = '2026.06.05.1';
  const zipPath = await createBundleZip(userDataPath, version);

  await installDesktopBundleFromZip({
    expectedSha256: await sha256(zipPath),
    userDataPath,
    version,
    zipPath,
  });

  const state = await readDesktopOtaState(userDataPath);
  assert.equal(state.pendingVersion, version);
  assert.equal(
    await readFile(path.join(userDataPath, 'desktop-ota', 'bundles', version, 'index.html'), 'utf8'),
    `<html><body>${version}</body></html>`,
  );
});

test('promotes a pending desktop bundle on next launch and marks it ready', async () => {
  const userDataPath = await mkdtemp(path.join(tmpdir(), 'todo-matrix-desktop-ota-'));
  const builtinDir = path.join(userDataPath, 'builtin');
  const builtinIndex = path.join(builtinDir, 'index.html');
  const version = '2026.06.05.1';
  const zipPath = await createBundleZip(userDataPath, version);

  await mkdir(builtinDir, { recursive: true });
  await writeFile(builtinIndex, '<html>builtin</html>', 'utf8');
  await installDesktopBundleFromZip({
    expectedSha256: await sha256(zipPath),
    userDataPath,
    version,
    zipPath,
  });

  const prepared = await prepareDesktopRenderer({
    builtinRendererIndex: builtinIndex,
    now: () => 1000,
    userDataPath,
  });

  assert.equal(prepared.version, version);
  assert.match(prepared.indexPath, /desktop-ota[\\/]bundles[\\/]2026\.06\.05\.1[\\/]index\.html$/);

  await markDesktopOtaReady(userDataPath);
  const readyState = await readDesktopOtaState(userDataPath);
  assert.equal(readyState.activeVersion, version);
  assert.equal(readyState.lastReadyVersion, version);
  assert.equal(readyState.pendingVersion, undefined);
  assert.equal(readyState.activeVersionStartedAt, undefined);
});

test('rolls back to builtin when an active desktop bundle never reports ready', async () => {
  const userDataPath = await mkdtemp(path.join(tmpdir(), 'todo-matrix-desktop-ota-'));
  const builtinDir = path.join(userDataPath, 'builtin');
  const builtinIndex = path.join(builtinDir, 'index.html');
  const version = '2026.06.05.1';
  const zipPath = await createBundleZip(userDataPath, version);

  await mkdir(builtinDir, { recursive: true });
  await writeFile(builtinIndex, '<html>builtin</html>', 'utf8');
  await installDesktopBundleFromZip({
    expectedSha256: await sha256(zipPath),
    userDataPath,
    version,
    zipPath,
  });
  await prepareDesktopRenderer({ builtinRendererIndex: builtinIndex, now: () => 1000, userDataPath });

  const rolledBack = await prepareDesktopRenderer({
    builtinRendererIndex: builtinIndex,
    now: () => 2000,
    userDataPath,
  });

  assert.equal(rolledBack.version, 'builtin');
  assert.equal(rolledBack.indexPath, builtinIndex);
  const state = await readDesktopOtaState(userDataPath);
  assert.equal(state.activeVersion, undefined);
});
