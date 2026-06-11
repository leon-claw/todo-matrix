import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const mainActivitySource = readFileSync(
  new URL(
    '../android/app/src/main/java/site/jianghong/todomatrix/MainActivity.java',
    import.meta.url,
  ),
  'utf8',
);

test('Android back navigates WebView history before delegating to the system', () => {
  assert.match(mainActivitySource, /new\s+OnBackPressedCallback\s*\(\s*true\s*\)/);
  assert.match(
    mainActivitySource,
    /getOnBackPressedDispatcher\(\)\.addCallback\s*\(\s*this\s*,/,
  );
  assert.match(mainActivitySource, /bridge\.getWebView\(\)\.canGoBack\(\)/);
  assert.match(mainActivitySource, /bridge\.getWebView\(\)\.goBack\(\)/);
  assert.match(mainActivitySource, /setEnabled\s*\(\s*false\s*\)/);
  assert.match(mainActivitySource, /getOnBackPressedDispatcher\(\)\.onBackPressed\(\)/);
});
