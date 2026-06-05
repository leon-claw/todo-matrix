import react from '@vitejs/plugin-react';

export default {
  base: './',
  define: {
    'import.meta.env.VITE_DESKTOP': JSON.stringify('true'),
  },
  plugins: [react()],
};
