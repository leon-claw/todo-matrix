export type AppDownloadPlatform = 'android' | 'macos' | 'windows';

export interface AppDownloadLink {
  description: string;
  fileLabel: string;
  href: string;
  platform: AppDownloadPlatform;
  title: string;
}

export const appDownloadLinks: AppDownloadLink[] = [
  {
    description: '适合 Windows 10 / 11 桌面使用，包含当前 Todo Matrix 桌面端。',
    fileLabel: 'Windows ZIP',
    href: 'https://web.jianghong.site/app/todo-matrix/downloads/windows/todo-matrix-windows-latest.zip',
    platform: 'windows',
    title: 'Windows 版',
  },
  {
    description: '适合 macOS 桌面使用，下载 DMG 文件后拖入“应用程序”即可安装。',
    fileLabel: 'macOS DMG',
    href: 'https://web.jianghong.site/app/todo-matrix/downloads/macos/todo-matrix-macos-latest.dmg',
    platform: 'macos',
    title: 'macOS 版',
  },
  {
    description: '适合 Android 手机安装，首次安装可能需要允许浏览器安装未知来源应用。',
    fileLabel: 'Android APK',
    href: 'https://web.jianghong.site/app/todo-matrix/downloads/android/todo-matrix-android-latest.apk',
    platform: 'android',
    title: 'Android 版',
  },
];

export function getAppDownloadLink(platform: AppDownloadPlatform) {
  return appDownloadLinks.find((link) => link.platform === platform);
}
