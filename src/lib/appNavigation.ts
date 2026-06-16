export type AppPage = 'home' | 'mine';

export type AppSurface = 'android' | 'desktop' | 'mobile' | 'windows';

export type BottomNavigationVariant = 'fixed-bottom' | 'floating-dock';

export const appNavigationItems: Array<{ id: AppPage; label: string }> = [
  { id: 'home', label: '首页' },
  { id: 'mine', label: '我的' },
];

export function getBottomNavigationVariant(surface: AppSurface): BottomNavigationVariant {
  return surface === 'desktop' || surface === 'windows' ? 'floating-dock' : 'fixed-bottom';
}
