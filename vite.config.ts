import { configDefaults, defineConfig } from 'vitest/config';
import { loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const apiOrigin = loadEnv(mode, '.', '').STOREFRONT_API_ORIGIN ?? 'http://localhost:8080';

  if (!/^https?:\/\/[^/?#]+$/.test(apiOrigin)) {
    throw new Error('STOREFRONT_API_ORIGIN must be an http(s) origin without a path.');
  }

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api': {
          target: apiOrigin,
          changeOrigin: true,
        },
      },
    },
    test: {
      environment: 'jsdom',
      exclude: [...configDefaults.exclude, 'e2e/**'],
      setupFiles: './src/app/test/setup.ts',
      clearMocks: true,
    },
  };
});
