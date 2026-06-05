import assert from 'node:assert/strict';
import { test } from 'node:test';
import { appNavigationItems, getBottomNavigationVariant } from '../src/lib/appNavigation';

test('defines only the home and mine primary navigation items', () => {
  assert.deepEqual(
    appNavigationItems.map((item) => ({ id: item.id, label: item.label })),
    [
      { id: 'home', label: '首页' },
      { id: 'mine', label: '我的' },
    ],
  );
});

test('uses a floating dock on desktop-class surfaces', () => {
  assert.equal(getBottomNavigationVariant('desktop'), 'floating-dock');
  assert.equal(getBottomNavigationVariant('windows'), 'floating-dock');
  assert.equal(getBottomNavigationVariant('mobile'), 'fixed-bottom');
  assert.equal(getBottomNavigationVariant('android'), 'fixed-bottom');
});
