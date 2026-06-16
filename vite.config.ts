import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { readFileSync } from 'node:fs';

const PRODUCTION_API_BASE_URL = process.env.TODO_MATRIX_API_BASE_URL || 'https://web.jianghong.site/app/todo-matrix/api';
const PRODUCTION_OTA_MANIFEST_URL = process.env.TODO_MATRIX_OTA_MANIFEST_URL || 'https://web.jianghong.site/app/todo-matrix/ota/android/manifest.json';
const packageJson = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as {
  version: string;
};

export default defineConfig(({ mode }) => {
  const isAndroid = mode === 'android';
  const usesProductionApi = isAndroid || mode === 'prod-api';
  const otaManifestUrl =
    process.env.TODO_MATRIX_OTA_MANIFEST_URL || (isAndroid ? PRODUCTION_OTA_MANIFEST_URL : '');
  const webBundleVersion = process.env.TODO_MATRIX_WEB_BUNDLE_VERSION || packageJson.version;
  const nativeVersion = process.env.TODO_MATRIX_NATIVE_VERSION || packageJson.version;

  return {
    base: isAndroid ? './' : process.env.VITE_BASE || (mode === 'production' ? '/app/todo-matrix/' : '/'),
    define: {
      __TODO_MATRIX_API_BASE_URL__: JSON.stringify(usesProductionApi ? PRODUCTION_API_BASE_URL : ''),
      __TODO_MATRIX_API_BASE_FALLBACK__: JSON.stringify(process.env.TODO_MATRIX_API_BASE || '/app/todo-matrix'),
      __TODO_MATRIX_NATIVE_VERSION__: JSON.stringify(nativeVersion),
      __TODO_MATRIX_OTA_MANIFEST_URL__: JSON.stringify(otaManifestUrl),
      __TODO_MATRIX_WEB_BUNDLE_VERSION__: JSON.stringify(webBundleVersion),
      ...(usesProductionApi
        ? {
            'import.meta.env.VITE_API_BASE_URL': JSON.stringify(PRODUCTION_API_BASE_URL),
          }
        : {}),
    },
    plugins: [react()],
    server: {
      host: '127.0.0.1',
      proxy: {
        '/api': 'http://127.0.0.1:3001',
      },
    },
    preview: {
      host: '127.0.0.1',
    },
  };
});
