import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const PRODUCTION_API_BASE_URL = 'https://web.jianghong.site/app/todo-matrix/api';

export default defineConfig(({ mode }) => {
  const isAndroid = mode === 'android';
  const usesProductionApi = isAndroid || mode === 'prod-api';

  return {
    base: isAndroid ? './' : mode === 'production' ? '/app/todo-matrix/' : '/',
    define: usesProductionApi
      ? {
          __TODO_MATRIX_API_BASE_URL__: JSON.stringify(PRODUCTION_API_BASE_URL),
          'import.meta.env.VITE_API_BASE_URL': JSON.stringify(PRODUCTION_API_BASE_URL),
        }
      : {
          __TODO_MATRIX_API_BASE_URL__: JSON.stringify(''),
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
