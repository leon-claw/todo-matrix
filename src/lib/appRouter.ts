import type { AppPage } from './appNavigation';

export type AppRoute = { id: 'home' } | { id: 'mine' };
export type NavigationMode = 'push' | 'replace';

interface HistoryWriter {
  pushState(data: unknown, unused: string, url?: string | URL | null): void;
  replaceState(data: unknown, unused: string, url?: string | URL | null): void;
}

const hashes: Record<AppRoute['id'], string> = {
  home: '#/',
  mine: '#/mine',
};

export function parseAppRoute(hash: string): AppRoute {
  if (hash === '#/mine' || hash === '#/mine/downloads') return { id: 'mine' };
  return { id: 'home' };
}

export function buildAppHash(route: AppRoute) {
  return hashes[route.id];
}

export function isCanonicalHash(hash: string) {
  return Object.values(hashes).includes(hash);
}

export function resolveAppRoute(hash: string) {
  return {
    route: parseAppRoute(hash),
    shouldReplace: !isCanonicalHash(hash),
  };
}

export function getPrimaryPage(route: AppRoute): AppPage {
  return route.id;
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
