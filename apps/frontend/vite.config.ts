import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react-swc';
import path from 'node:path';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [tailwindcss(), react()],
  server: {
    port: 5001,
  },
  resolve: {
    alias: {
      '@/src': path.resolve(process.cwd(), './src'),
    },
  },
});
