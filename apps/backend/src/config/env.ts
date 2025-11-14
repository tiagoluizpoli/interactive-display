import { config } from 'dotenv';
import { z } from 'zod';

config();

const staticEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  API_PORT: z.coerce.number().min(1, 'API port must be a positive number'),
  API_CORS_ORIGINS: z.string().min(1, 'API CORS origins are required'),
  API_CORS_ALLOWED_HEADERS: z.string().min(1, 'API CORS allowed headers are required'),
  API_LOG_LEVEL: z.enum(['debug', 'dev', 'prod']).default('prod'),
  DB_SQLITE_PATH: z.string().min(1, 'DB SQLite path is required').endsWith('.db', 'DB SQLite path must end with .db'),
});

const parsedStaticEnv = staticEnvSchema.safeParse(process.env);

if (!parsedStaticEnv.success) {
  console.error('Invalid static environment variables:', parsedStaticEnv.error.format());
  throw new Error('Invalid static environment variables');
}

const setupStringOrStringArrayValue = (origins: string): string | string[] => {
  if (origins.includes(',')) {
    return origins.split(',').map((origin) => origin.trim());
  }

  return origins;
};

const { NODE_ENV, API_PORT, API_CORS_ORIGINS, API_CORS_ALLOWED_HEADERS, API_LOG_LEVEL, DB_SQLITE_PATH } =
  parsedStaticEnv.data;

export const env = {
  baseConfig: {
    nodeEnv: NODE_ENV,
  },
  api: {
    port: API_PORT,
    corsOrigins: setupStringOrStringArrayValue(API_CORS_ORIGINS),
    corsAllowedHeaders: setupStringOrStringArrayValue(API_CORS_ALLOWED_HEADERS),
    logLevel: API_LOG_LEVEL,
  },
  logger: {},
  db: {
    sqlitePath: DB_SQLITE_PATH,
  },
};
