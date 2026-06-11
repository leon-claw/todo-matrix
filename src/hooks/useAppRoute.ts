import { useCallback, useEffect, useState } from 'react';
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
    const initialRoute = parseAppRoute(window.location.hash);
    if (!isCanonicalHash(window.location.hash)) {
      navigateToRoute(initialRoute, 'replace');
      setRoute(initialRoute);
    }

    const handleHashChange = () => {
      setRoute(parseAppRoute(window.location.hash));
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
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
