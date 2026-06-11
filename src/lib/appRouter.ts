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

export function isCanonicalHash(hash: string) {
  return Object.values(hashes).includes(hash);
}

export function shouldUseHistoryBack(state: unknown) {
  return (
    typeof state === 'object' &&
    state !== null &&
    'todoMatrixCanGoBack' in state &&
    state.todoMatrixCanGoBack === true
  );
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
