import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 5173,
    proxy: {
      '/process': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/test.pdf': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
});
