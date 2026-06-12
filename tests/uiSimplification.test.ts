import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const taskCardSource = readFileSync(new URL('../src/components/TaskCard.tsx', import.meta.url), 'utf8');
const minePageSource = readFileSync(new URL('../src/components/MinePage.tsx', import.meta.url), 'utf8');
const appSource = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');

test('keeps task card expansion focused on progress instead of priority editing', () => {
  assert.doesNotMatch(taskCardSource, /aria-label="重要程度"/);
  assert.doesNotMatch(taskCardSource, /aria-label="紧急程度"/);
  assert.match(taskCardSource, /aria-label="进度"/);
});

test('removes the application information panel from the Mine page', () => {
  assert.doesNotMatch(minePageSource, />应用信息</);
  assert.doesNotMatch(minePageSource, /资源版本/);
});

test('requires confirmation before signing out', () => {
  assert.match(appSource, /退出登录？/);
  assert.match(appSource, /confirmLogout/);
});
