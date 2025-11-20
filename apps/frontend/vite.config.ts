import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react-swc';
import path from 'node:path';
import { defineConfig, loadEnv } from 'vite';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const port = env.PORT ? Number.parseInt(env.PORT) : 5001;

  return {
    plugins: [react(), tailwindcss()],
    server: {
      port: port,
    },
    preview: {
      port: port,
    },
    resolve: {
      alias: {
        '@/src': path.resolve(__dirname, './src'),
      },
    },
  };
});
