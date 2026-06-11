import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  buildAppHash,
  getPrimaryPage,
  isCanonicalHash,
  navigateToRoute,
  parseAppRoute,
  resolveAppRoute,
} from '../src/lib/appRouter';

test('parses supported hashes and normalizes unsupported hashes to home', () => {
  assert.deepEqual(parseAppRoute('#/'), { id: 'home' });
  assert.deepEqual(parseAppRoute('#/mine'), { id: 'mine' });
  assert.deepEqual(parseAppRoute(''), { id: 'home' });
  assert.deepEqual(parseAppRoute('#/unknown'), { id: 'home' });
});

test('builds canonical hashes and identifies the active primary tab', () => {
  assert.equal(buildAppHash({ id: 'home' }), '#/');
  assert.equal(buildAppHash({ id: 'mine' }), '#/mine');
  assert.equal(getPrimaryPage({ id: 'home' }), 'home');
  assert.equal(getPrimaryPage({ id: 'mine' }), 'mine');
});

test('uses replace navigation for primary tabs', () => {
  const calls: Array<{ data: unknown; method: 'push' | 'replace'; url: string }> = [];
  const history = {
    pushState: (data: unknown, _title: string, url?: string | URL | null) =>
      calls.push({ data, method: 'push', url: String(url) }),
    replaceState: (data: unknown, _title: string, url?: string | URL | null) =>
      calls.push({ data, method: 'replace', url: String(url) }),
  };

  navigateToRoute({ id: 'mine' }, 'replace', history);

  assert.deepEqual(calls, [
    {
      data: {
        todoMatrixCanGoBack: false,
        todoMatrixRoute: 'mine',
      },
      method: 'replace',
      url: '#/mine',
    },
  ]);
});

test('identifies canonical app hashes', () => {
  assert.equal(isCanonicalHash('#/'), true);
  assert.equal(isCanonicalHash('#/mine'), true);
  assert.equal(isCanonicalHash('#/mine/downloads'), false);
  assert.equal(isCanonicalHash(''), false);
  assert.equal(isCanonicalHash('#/unknown'), false);
});

test('resolves hashes and requests replacement only for non-canonical addresses', () => {
  assert.deepEqual(resolveAppRoute('#/'), {
    route: { id: 'home' },
    shouldReplace: false,
  });
  assert.deepEqual(resolveAppRoute('#/mine'), {
    route: { id: 'mine' },
    shouldReplace: false,
  });
  assert.deepEqual(resolveAppRoute('#/mine/downloads'), {
    route: { id: 'mine' },
    shouldReplace: true,
  });
  assert.deepEqual(resolveAppRoute(''), {
    route: { id: 'home' },
    shouldReplace: true,
  });
  assert.deepEqual(resolveAppRoute('#/unknown'), {
    route: { id: 'home' },
    shouldReplace: true,
  });
});
