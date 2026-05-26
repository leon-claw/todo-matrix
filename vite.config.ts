import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const isAndroid = mode === 'android';

  return {
    base: isAndroid ? './' : mode === 'production' ? '/app/todo-matrix/' : '/',
    define: isAndroid
      ? {
          'import.meta.env.VITE_API_BASE_URL': JSON.stringify('https://web.jianghong.site/app/todo-matrix/api'),
        }
      : undefined,
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
