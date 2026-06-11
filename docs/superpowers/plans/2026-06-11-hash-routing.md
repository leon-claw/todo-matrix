# Hash Routing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Hash-based page routing whose secondary pages participate in system back navigation while primary tab switches replace the current history entry.

**Architecture:** A framework-independent `appRouter` module owns route parsing, hash generation, history modes, and parent-route fallback. A small React hook subscribes to `hashchange`; `App`, `AppBottomNavigation`, and `MinePage` consume route state without maintaining duplicate page state.

**Tech Stack:** React 19, TypeScript, browser History API, Node test runner, Vite.

---

### Task 1: Route Model And History Rules

**Files:**
- Create: `src/lib/appRouter.ts`
- Create: `tests/appRouter.test.ts`

- [ ] **Step 1: Write failing route-model tests**

```ts
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
  const calls: string[] = [];
  const history = {
    pushState: (_data: unknown, _title: string, url?: string | URL | null) =>
      calls.push(`push:${String(url)}`),
    replaceState: (_data: unknown, _title: string, url?: string | URL | null) =>
      calls.push(`replace:${String(url)}`),
  };

  navigateToRoute({ id: 'mine' }, 'replace', history);
  navigateToRoute({ id: 'downloads' }, 'push', history);

  assert.deepEqual(calls, ['replace:#/mine', 'push:#/mine/downloads']);
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```powershell
node --import tsx --test tests/appRouter.test.ts
```

Expected: FAIL because `src/lib/appRouter.ts` does not exist.

- [ ] **Step 3: Implement the minimal route module**

```ts
import type { AppPage } from './appNavigation';

export type AppRoute = { id: 'home' } | { id: 'mine' } | { id: 'downloads' };
export type NavigationMode = 'push' | 'replace';

interface HistoryWriter {
  pushState(data: unknown, unused: string, url?: string | URL | null): void;
  replaceState(data: unknown, unused: string, url?: string | URL | null): void;
}

const hashes: Record<AppRoute['id'], string> = {
  home: '#/',
  mine: '#/mine',
  downloads: '#/mine/downloads',
};

export function parseAppRoute(hash: string): AppRoute {
  if (hash === '#/mine') return { id: 'mine' };
  if (hash === '#/mine/downloads') return { id: 'downloads' };
  return { id: 'home' };
}

export function buildAppHash(route: AppRoute) {
  return hashes[route.id];
}

export function getPrimaryPage(route: AppRoute): AppPage {
  return route.id === 'home' ? 'home' : 'mine';
}

export function getParentRoute(route: AppRoute): AppRoute | null {
  return route.id === 'downloads' ? { id: 'mine' } : null;
}

export function navigateToRoute(
  route: AppRoute,
  mode: NavigationMode,
  targetHistory: HistoryWriter = window.history,
) {
  targetHistory[mode === 'replace' ? 'replaceState' : 'pushState'](
    {
      todoMatrixCanGoBack: mode === 'push',
      todoMatrixRoute: route.id,
    },
    '',
    buildAppHash(route),
  );
}
```

- [ ] **Step 4: Run the focused test and verify GREEN**

Run:

```powershell
node --import tsx --test tests/appRouter.test.ts
```

Expected: 4 tests pass.

### Task 2: React Route Subscription

**Files:**
- Create: `src/hooks/useAppRoute.ts`
- Modify: `src/App.tsx`
- Modify: `src/components/AppBottomNavigation.tsx`

- [ ] **Step 1: Extend the failing tests with canonical-route behavior**

Add to `tests/appRouter.test.ts`:

```ts
import { isCanonicalHash } from '../src/lib/appRouter';

test('detects whether the current hash is canonical', () => {
  assert.equal(isCanonicalHash('#/'), true);
  assert.equal(isCanonicalHash('#/mine'), true);
  assert.equal(isCanonicalHash('#/mine/downloads'), true);
  assert.equal(isCanonicalHash(''), false);
  assert.equal(isCanonicalHash('#/unknown'), false);
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```powershell
node --import tsx --test tests/appRouter.test.ts
```

Expected: FAIL because `isCanonicalHash` is not exported.

- [ ] **Step 3: Add canonical detection and the React hook**

Add to `src/lib/appRouter.ts`:

```ts
export function isCanonicalHash(hash: string) {
  return Object.values(hashes).includes(hash);
}
```

Create `src/hooks/useAppRoute.ts`:

```ts
import { useEffect, useState } from 'react';
import {
  buildAppHash,
  isCanonicalHash,
  navigateToRoute,
  parseAppRoute,
  type AppRoute,
  type NavigationMode,
} from '../lib/appRouter';

export function useAppRoute() {
  const [route, setRoute] = useState<AppRoute>(() => parseAppRoute(window.location.hash));

  useEffect(() => {
    if (!isCanonicalHash(window.location.hash)) {
      navigateToRoute(route, 'replace');
    }

    const syncRoute = () => setRoute(parseAppRoute(window.location.hash));
    window.addEventListener('hashchange', syncRoute);
    return () => window.removeEventListener('hashchange', syncRoute);
  }, []);

  function navigate(nextRoute: AppRoute, mode: NavigationMode) {
    if (window.location.hash === buildAppHash(nextRoute)) return;
    navigateToRoute(nextRoute, mode);
    setRoute(nextRoute);
  }

  return { navigate, route };
}
```

- [ ] **Step 4: Replace `activePage` state with route state**

In `src/App.tsx`:

```ts
import { useAppRoute } from './hooks/useAppRoute';
import { getPrimaryPage } from './lib/appRouter';
```

Replace the local page state with:

```ts
const { navigate, route } = useAppRoute();
const activePage = getPrimaryPage(route);
```

Pass primary navigation as replacement:

```tsx
<AppBottomNavigation
  activePage={activePage}
  onPageChange={(page) => navigate({ id: page }, 'replace')}
/>
```

- [ ] **Step 5: Run tests and type-check**

Run:

```powershell
npm.cmd test
npx.cmd tsc -b --pretty false
```

Expected: all tests pass and TypeScript exits 0.

### Task 3: Route The Downloads Page And Back Button

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/MinePage.tsx`
- Modify: `tests/appRouter.test.ts`

- [ ] **Step 1: Add a failing direct-entry back fallback test**

Add to `tests/appRouter.test.ts`:

```ts
import { shouldUseHistoryBack } from '../src/lib/appRouter';

test('only uses history back when the current entry was reached from this app', () => {
  assert.equal(shouldUseHistoryBack({ todoMatrixCanGoBack: true }), true);
  assert.equal(shouldUseHistoryBack({ todoMatrixCanGoBack: false }), false);
  assert.equal(shouldUseHistoryBack(null), false);
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```powershell
node --import tsx --test tests/appRouter.test.ts
```

Expected: FAIL because `shouldUseHistoryBack` is not exported.

- [ ] **Step 3: Implement safe secondary-page back behavior**

Add to `src/lib/appRouter.ts`:

```ts
export function shouldUseHistoryBack(state: unknown) {
  return Boolean(
    state &&
      typeof state === 'object' &&
      'todoMatrixCanGoBack' in state &&
      state.todoMatrixCanGoBack === true,
  );
}
```

- [ ] **Step 4: Make `MinePage` route-controlled**

Remove `MineView` and its `useState`. Change `MinePageProps` to include:

```ts
activeView: 'downloads' | 'settings';
onBackFromDownloads: () => void;
onOpenDownloads: () => void;
```

Render `DownloadsPage` when `activeView === 'downloads'`, use `onBackFromDownloads` for its back button, and use `onOpenDownloads` for the settings row.

- [ ] **Step 5: Wire secondary navigation in `App`**

Pass:

```tsx
activeView={route.id === 'downloads' ? 'downloads' : 'settings'}
onOpenDownloads={() => navigate({ id: 'downloads' }, 'push')}
onBackFromDownloads={() => {
  if (shouldUseHistoryBack(window.history.state)) {
    window.history.back();
    return;
  }

  navigate({ id: 'mine' }, 'replace');
}}
```

Keep the bottom navigation selected as `mine` on `#/mine/downloads`.

- [ ] **Step 6: Run all automated verification**

Run:

```powershell
npm.cmd test
npm.cmd run build
git diff --check
```

Expected: all tests pass, production build exits 0, and diff check reports no whitespace errors.

### Task 4: Browser History Verification

**Files:**
- No source changes expected.

- [ ] **Step 1: Start the dev server**

Run:

```powershell
npm.cmd run dev -- --port 5173 --strictPort
```

- [ ] **Step 2: Verify primary tabs use replacement**

Open `http://127.0.0.1:5173/#/`, record `history.length`, switch between `home` and `mine` several times, and confirm `history.length` does not increase.

- [ ] **Step 3: Verify secondary pages use push and system back**

From `#/mine`, open downloads and confirm:

- URL becomes `#/mine/downloads`.
- `history.length` increases by one.
- Browser back returns to `#/mine`.

- [ ] **Step 4: Verify direct-entry fallback**

Open `http://127.0.0.1:5173/#/mine/downloads` in a fresh tab, click the visible back button, and confirm the URL becomes `#/mine` without leaving the app.

- [ ] **Step 5: Confirm the console has no routing errors**

Inspect browser error logs and expect an empty result.
