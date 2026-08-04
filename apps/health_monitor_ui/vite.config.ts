import { defineConfig } from 'vite';
import { solidPlugin } from 'vite-plugin-solid';

export default defineConfig({
  plugins: [solidPlugin()],
  server: {
    port: 3401,
    proxy: {
      '/api': {
        target: 'http://localhost:3400',
        changeOrigin: true,
      },
    },
  },
  build: {
    target: 'esnext',
    outDir: 'dist',
  },
});
