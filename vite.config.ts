import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  server: { port: 5173, host: '127.0.0.1' },
  resolve: {
    alias: {
      '@assets': path.resolve(__dirname, 'assets'),
    },
  },
  publicDir: 'public',
});
