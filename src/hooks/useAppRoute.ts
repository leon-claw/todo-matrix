import { useCallback, useEffect, useState } from 'react';
import {
  buildAppHash,
  navigateToRoute,
  resolveAppRoute,
  type AppRoute,
  type NavigationMode,
} from '../lib/appRouter';

export function useAppRoute() {
  const [route, setRoute] = useState<AppRoute>(
    () => resolveAppRoute(window.location.hash).route,
  );

  useEffect(() => {
    const syncRoute = () => {
      const resolved = resolveAppRoute(window.location.hash);
      if (resolved.shouldReplace) {
        navigateToRoute(resolved.route, 'replace');
      }
      setRoute(resolved.route);
    };

    syncRoute();
    window.addEventListener('hashchange', syncRoute);
    return () => window.removeEventListener('hashchange', syncRoute);
  }, []);

  const navigate = useCallback((nextRoute: AppRoute, mode: NavigationMode) => {
    if (window.location.hash === buildAppHash(nextRoute)) {
      return;
    }

    navigateToRoute(nextRoute, mode);
    setRoute(nextRoute);
  }, []);

  return { navigate, route };
}
