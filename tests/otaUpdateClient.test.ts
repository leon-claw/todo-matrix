import assert from 'node:assert/strict';
import test from 'node:test';
import { runSilentOtaUpdateCheck } from '../src/lib/otaUpdateClient';

test('downloads and queues a silent Android web bundle update', async () => {
  const calls: string[] = [];
  const storage = new Map<string, string>();

  const result = await runSilentOtaUpdateCheck({
    deps: {
      fetchManifest: async () => ({
        latestWebBundleVersion: '2026.06.05.1',
        minNativeVersion: '1.0.0',
        sha256: 'abc123',
        webBundleUrl: 'https://example.com/todo-matrix/2026.06.05.1.zip',
        webPolicy: 'silent',
      }),
      getLastCheckedAt: () => Number(storage.get('lastCheckedAt') ?? 0),
      getQueuedVersion: () => storage.get('queuedVersion') ?? null,
      getRuntimeInfo: async () => ({
        nativeVersion: '1.0.0',
        platform: 'android',
        webBundleVersion: '2026.06.05.0',
      }),
      now: () => 1000,
      setLastCheckedAt: (timestamp) => storage.set('lastCheckedAt', String(timestamp)),
      setQueuedVersion: (version) => storage.set('queuedVersion', version),
      updater: {
        download: async (options) => {
          calls.push(`download:${options.version}:${options.url}:${options.checksum}`);
          return { id: 'bundle-1', version: options.version };
        },
        next: async (options) => {
          calls.push(`next:${options.id}`);
        },
        notifyAppReady: async () => {
          calls.push('ready');
        },
      },
    },
  });

  assert.deepEqual(calls, [
    'ready',
    'download:2026.06.05.1:https://example.com/todo-matrix/2026.06.05.1.zip:abc123',
    'next:bundle-1',
  ]);
  assert.deepEqual(result, { type: 'web-silent', version: '2026.06.05.1' });
  assert.equal(storage.get('lastCheckedAt'), '1000');
  assert.equal(storage.get('queuedVersion'), '2026.06.05.1');
});

test('does not download the same queued bundle twice', async () => {
  const calls: string[] = [];

  const result = await runSilentOtaUpdateCheck({
    deps: {
      fetchManifest: async () => ({
        latestWebBundleVersion: '2026.06.05.1',
        webBundleUrl: 'https://example.com/todo-matrix/2026.06.05.1.zip',
        webPolicy: 'silent',
      }),
      getLastCheckedAt: () => 0,
      getQueuedVersion: () => '2026.06.05.1',
      getRuntimeInfo: async () => ({
        nativeVersion: '1.0.0',
        platform: 'android',
        webBundleVersion: '2026.06.05.0',
      }),
      now: () => 1000,
      setLastCheckedAt: () => undefined,
      setQueuedVersion: () => undefined,
      updater: {
        download: async () => {
          calls.push('download');
          return { id: 'bundle-1', version: '2026.06.05.1' };
        },
        next: async () => {
          calls.push('next');
        },
        notifyAppReady: async () => {
          calls.push('ready');
        },
      },
    },
  });

  assert.deepEqual(calls, ['ready']);
  assert.deepEqual(result, { type: 'already-queued', version: '2026.06.05.1' });
});
