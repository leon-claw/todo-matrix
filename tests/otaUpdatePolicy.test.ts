import assert from 'node:assert/strict';
import test from 'node:test';
import {
  OTA_CHECK_THROTTLE_MS,
  resolveOtaUpdatePlan,
  shouldCheckForOtaUpdate,
} from '../src/lib/otaUpdatePolicy';

test('selects a silent web bundle update when a newer compatible bundle is available', () => {
  const plan = resolveOtaUpdatePlan({
    current: {
      nativeVersion: '1.0.0',
      platform: 'android',
      webBundleVersion: '2026.06.05.0',
    },
    manifest: {
      latestWebBundleVersion: '2026.06.05.1',
      minNativeVersion: '1.0.0',
      webBundleUrl: 'https://example.com/todo-matrix/2026.06.05.1.zip',
      webPolicy: 'silent',
    },
  });

  assert.deepEqual(plan, {
    type: 'web-silent',
    bundleVersion: '2026.06.05.1',
    url: 'https://example.com/todo-matrix/2026.06.05.1.zip',
  });
});

test('selects a silent electron web bundle update when a newer compatible bundle is available', () => {
  const plan = resolveOtaUpdatePlan({
    current: {
      nativeVersion: '1.0.0',
      platform: 'electron',
      webBundleVersion: '2026.06.05.0',
    },
    manifest: {
      latestWebBundleVersion: '2026.06.05.1',
      minNativeVersion: '1.0.0',
      webBundleUrl: 'https://example.com/todo-matrix/windows/2026.06.05.1.zip',
      webPolicy: 'silent',
    },
  });

  assert.deepEqual(plan, {
    type: 'web-silent',
    bundleVersion: '2026.06.05.1',
    url: 'https://example.com/todo-matrix/windows/2026.06.05.1.zip',
  });
});

test('skips silent web bundle updates when the bundle is not newer', () => {
  const plan = resolveOtaUpdatePlan({
    current: {
      nativeVersion: '1.0.0',
      platform: 'android',
      webBundleVersion: '2026.06.05.1',
    },
    manifest: {
      latestWebBundleVersion: '2026.06.05.1',
      webBundleUrl: 'https://example.com/todo-matrix/2026.06.05.1.zip',
      webPolicy: 'silent',
    },
  });

  assert.deepEqual(plan, { type: 'none' });
});

test('does not apply a web bundle when the native shell is below the manifest minimum', () => {
  const plan = resolveOtaUpdatePlan({
    current: {
      nativeVersion: '1.0.0',
      platform: 'android',
      webBundleVersion: '2026.06.05.0',
    },
    manifest: {
      latestWebBundleVersion: '2026.06.05.1',
      minNativeVersion: '1.1.0',
      nativePolicy: 'force',
      webBundleUrl: 'https://example.com/todo-matrix/2026.06.05.1.zip',
      webPolicy: 'silent',
    },
  });

  assert.deepEqual(plan, {
    minNativeVersion: '1.1.0',
    policy: 'force',
    type: 'native-required',
  });
});

test('throttles automatic update checks while allowing manual checks', () => {
  const lastCheckedAt = Date.UTC(2026, 5, 5, 8, 0, 0);
  const now = lastCheckedAt + OTA_CHECK_THROTTLE_MS - 1;

  assert.equal(shouldCheckForOtaUpdate({ lastCheckedAt, now }), false);
  assert.equal(shouldCheckForOtaUpdate({ lastCheckedAt, manual: true, now }), true);
  assert.equal(shouldCheckForOtaUpdate({ lastCheckedAt, now: lastCheckedAt + OTA_CHECK_THROTTLE_MS }), true);
});
