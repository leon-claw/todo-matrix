import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  buildAppHash,
  getParentRoute,
  getPrimaryPage,
  navigateToRoute,
  parseAppRoute,
} from '../src/lib/appRouter';

test('parses supported hashes and normalizes unsupported hashes to home', () => {
  assert.deepEqual(parseAppRoute('#/'), { id: 'home' });
  assert.deepEqual(parseAppRoute('#/mine'), { id: 'mine' });
  assert.deepEqual(parseAppRoute('#/mine/downloads'), { id: 'downloads' });
  assert.deepEqual(parseAppRoute(''), { id: 'home' });
  assert.deepEqual(parseAppRoute('#/unknown'), { id: 'home' });
});

test('builds canonical hashes and identifies the active primary tab', () => {
  assert.equal(buildAppHash({ id: 'home' }), '#/');
  assert.equal(buildAppHash({ id: 'mine' }), '#/mine');
  assert.equal(buildAppHash({ id: 'downloads' }), '#/mine/downloads');
  assert.equal(getPrimaryPage({ id: 'downloads' }), 'mine');
});

test('returns the parent route for secondary pages', () => {
  assert.deepEqual(getParentRoute({ id: 'downloads' }), { id: 'mine' });
  assert.equal(getParentRoute({ id: 'mine' }), null);
});

test('uses replace navigation for tabs and push navigation for secondary pages', () => {
  const calls: Array<{ data: unknown; method: 'push' | 'replace'; url: string }> = [];
  const history = {
    pushState: (data: unknown, _title: string, url?: string | URL | null) =>
      calls.push({ data, method: 'push', url: String(url) }),
    replaceState: (data: unknown, _title: string, url?: string | URL | null) =>
      calls.push({ data, method: 'replace', url: String(url) }),
  };

  navigateToRoute({ id: 'mine' }, 'replace', history);
  navigateToRoute({ id: 'downloads' }, 'push', history);

  assert.deepEqual(calls, [
    {
      data: {
        todoMatrixCanGoBack: false,
        todoMatrixRoute: 'mine',
      },
      method: 'replace',
      url: '#/mine',
    },
    {
      data: {
        todoMatrixCanGoBack: true,
        todoMatrixRoute: 'downloads',
      },
      method: 'push',
      url: '#/mine/downloads',
    },
  ]);
});
