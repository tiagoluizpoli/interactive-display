import { env } from '@/config/env';
import type { Config } from 'drizzle-kit';

const { db } = env;

export default {
  schema: './src/db/schema.ts',
  out: './src/db/migrations',
  dialect: 'sqlite',
  dbCredentials: {
    url: db.sqlitePath,
  },
} satisfies Config;
