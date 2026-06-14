import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const headerPath = new URL('../src/components/AppHeader.tsx', import.meta.url);

test('AppHeader uses the approved two-row mobile layout', async () => {
  const source = await readFile(headerPath, 'utf8');

  assert.match(source, /direction=\{\{ xs: 'column', sm: 'row' \}\}/);
  assert.match(source, /gridTemplateColumns: \{ xs: 'repeat\(2, minmax\(0, 1fr\)\)'/);
  assert.match(source, /'@media \(max-width: 359\.95px\)'/);
  assert.match(source, /height: \{ xs: 42, sm:/);
  assert.match(source, /width: \{ xs: '100%', sm: 'auto' \}/);
  assert.doesNotMatch(source, /display: \{ xs: 'none', sm: 'inline' \}/);
});
