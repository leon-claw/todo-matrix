import assert from 'node:assert/strict';
import { test } from 'node:test';
import { formatTaskDisplayTitle } from '../src/lib/taskPresentation';

test('prefixes task titles with progress only when progress is above zero', () => {
  assert.equal(formatTaskDisplayTitle({ progress: 0, title: '准备晚饭' }), '准备晚饭');
  assert.equal(formatTaskDisplayTitle({ progress: 1, title: '准备晚饭' }), '1% 准备晚饭');
  assert.equal(formatTaskDisplayTitle({ progress: 84, title: '准备晚饭' }), '84% 准备晚饭');
});
