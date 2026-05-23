import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { veritypeApi } from './vite-veritype-plugin.js';

export default defineConfig({
  plugins: [react(), veritypeApi()],
  server: { port: 5173, host: '127.0.0.1' },
  resolve: {
    alias: {
      '@assets': path.resolve(__dirname, 'assets'),
    },
  },
  publicDir: 'public',
});
