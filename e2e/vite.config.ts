import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { readFileSync } from 'node:fs';

const apiOrigin = process.env.E2E_API_ORIGIN ?? 'http://127.0.0.1:18080';
const port = Number(process.env.E2E_STOREFRONT_PORT ?? '4173');
const tlsKey = process.env.E2E_TLS_KEY;
const tlsCert = process.env.E2E_TLS_CERT;

if ((tlsKey === undefined) !== (tlsCert === undefined)) {
  throw new Error('E2E_TLS_KEY and E2E_TLS_CERT must be set together.');
}

export default defineConfig({
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    port,
    strictPort: true,
    https: tlsKey && tlsCert ? { cert: readFileSync(tlsCert), key: readFileSync(tlsKey) } : undefined,
    proxy: {
      '/api': {
        target: apiOrigin,
        changeOrigin: true,
      },
    },
  },
});
