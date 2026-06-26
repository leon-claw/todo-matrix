import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const headerPath = new URL('../src/components/AppHeader.tsx', import.meta.url);

test('AppHeader uses a compact single-row mobile layout', async () => {
  const source = await readFile(headerPath, 'utf8');

  assert.match(source, /direction="row"/);
  assert.match(source, /'@media \(max-width: 359\.95px\)'/);
  assert.match(source, /display: \{ xs: 'none', sm: 'inline-flex' \}/);
  assert.match(source, /'& \.MuiChip-label': \{\s*display: \{ xs: 'none', sm: 'block' \}/);
});
