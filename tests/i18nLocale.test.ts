import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  DEFAULT_LANGUAGE,
  LANGUAGE_STORAGE_KEY,
  normalizeLanguage,
  readStoredLanguage,
  SUPPORTED_LANGUAGES,
} from '../src/i18n/locale';

class MemoryStorage implements Pick<Storage, 'getItem' | 'setItem'> {
  private values = new Map<string, string>();

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string) {
    this.values.set(key, value);
  }
}

test('defaults to Simplified Chinese for first-time app users', () => {
  assert.equal(DEFAULT_LANGUAGE, 'zh-CN');
  assert.equal(readStoredLanguage(new MemoryStorage()), 'zh-CN');
});

test('normalizes supported language aliases and rejects unknown locales', () => {
  assert.deepEqual(SUPPORTED_LANGUAGES, ['zh-CN', 'en-US']);
  assert.equal(normalizeLanguage('zh'), 'zh-CN');
  assert.equal(normalizeLanguage('zh-Hans-CN'), 'zh-CN');
  assert.equal(normalizeLanguage('en'), 'en-US');
  assert.equal(normalizeLanguage('en-GB'), 'en-US');
  assert.equal(normalizeLanguage('fr-FR'), null);
});

test('uses the saved language only when it is supported', () => {
  const storage = new MemoryStorage();

  storage.setItem(LANGUAGE_STORAGE_KEY, 'en-US');
  assert.equal(readStoredLanguage(storage), 'en-US');

  storage.setItem(LANGUAGE_STORAGE_KEY, 'fr-FR');
  assert.equal(readStoredLanguage(storage), 'zh-CN');
});
