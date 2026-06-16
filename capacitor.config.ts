import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'site.jianghong.todomatrix',
  appName: 'Todo Matrix',
  webDir: 'dist',
  server: {
    hostname: 'todo-matrix.localhost',
    androidScheme: 'https',
  },
  plugins: {
    CapacitorUpdater: {
      autoUpdate: false,
      statsUrl: '',
    },
  },
};

export default config;
