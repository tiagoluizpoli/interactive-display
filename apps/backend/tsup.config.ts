import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/**/*.ts', 'drizzle.config.ts'],
  clean: true,
  format: ['cjs'],
  ignoreWatch: ['src/db/migrations/**/*.sql'],
  esbuildOptions(options) {
    options.loader = {
      '.sql': 'text',
    };
  },
});
