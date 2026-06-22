import assert from 'node:assert/strict';
import test from 'node:test';
import {
  DEFAULT_OFFICIAL_API_BASE,
  createClientSessionStorageKeys,
  normalizeServerApiBase,
  readStoredServerConfig,
  serverConfigEquals,
} from '../src/lib/serverConfig';

test('uses the official cloud API as the default server', () => {
  assert.equal(readStoredServerConfig(null).apiBaseUrl, DEFAULT_OFFICIAL_API_BASE);
  assert.equal(readStoredServerConfig(null).mode, 'official');
});

test('normalizes custom server URLs to an API base URL', () => {
  assert.equal(normalizeServerApiBase('https://example.com'), 'https://example.com/api');
  assert.equal(normalizeServerApiBase('https://example.com/'), 'https://example.com/api');
  assert.equal(normalizeServerApiBase('https://example.com/custom'), 'https://example.com/custom/api');
  assert.equal(normalizeServerApiBase('https://example.com/custom/api'), 'https://example.com/custom/api');
  assert.equal(normalizeServerApiBase('https://example.com/custom/api/auth/me'), 'https://example.com/custom/api');
});

test('rejects unsafe custom server URLs', () => {
  assert.throws(() => normalizeServerApiBase('ftp://example.com'), /http/);
  assert.throws(() => normalizeServerApiBase('not a url'), /有效/);
});

test('isolates client session storage by server API base', () => {
  assert.notDeepEqual(
    createClientSessionStorageKeys('https://todo-matrix.jianghong.site/api'),
    createClientSessionStorageKeys('https://private.example.com/api'),
  );
});

test('compares server configs by normalized API base', () => {
  assert.equal(
    serverConfigEquals(
      { mode: 'custom', apiBaseUrl: 'https://example.com/api' },
      { mode: 'custom', apiBaseUrl: 'https://example.com/api/' },
    ),
    true,
  );
});
