import assert from 'node:assert/strict';
import { test } from 'node:test';
import { APP_RELEASES_URL } from '../src/lib/appDownloads';

test('uses GitHub Releases as the single application download destination', () => {
  assert.equal(APP_RELEASES_URL, 'https://github.com/leon-claw/todo-matrix/releases');
});
