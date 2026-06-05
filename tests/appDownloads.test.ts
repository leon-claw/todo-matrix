import assert from 'node:assert/strict';
import { test } from 'node:test';
import { appDownloadLinks, getAppDownloadLink } from '../src/lib/appDownloads';

test('defines Windows and Android download links for the downloads page', () => {
  assert.deepEqual(
    appDownloadLinks.map((link) => link.platform),
    ['windows', 'android'],
  );
  assert.equal(
    getAppDownloadLink('windows')?.href,
    'https://web.jianghong.site/app/todo-matrix/downloads/windows/todo-matrix-windows-latest.zip',
  );
  assert.equal(
    getAppDownloadLink('android')?.href,
    'https://web.jianghong.site/app/todo-matrix/downloads/android/todo-matrix-android-latest.apk',
  );
});
