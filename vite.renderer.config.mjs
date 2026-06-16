import react from '@vitejs/plugin-react';
import { readFileSync } from 'node:fs';

const packageJson = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));

export default {
  base: './',
  define: {
    __TODO_MATRIX_NATIVE_VERSION__: JSON.stringify(process.env.TODO_MATRIX_DESKTOP_NATIVE_VERSION || packageJson.version),
    __TODO_MATRIX_OTA_MANIFEST_URL__: JSON.stringify(''),
    __TODO_MATRIX_WEB_BUNDLE_VERSION__: JSON.stringify(
      process.env.TODO_MATRIX_DESKTOP_WEB_BUNDLE_VERSION || packageJson.version,
    ),
    'import.meta.env.VITE_DESKTOP': JSON.stringify('true'),
  },
  plugins: [react()],
};
