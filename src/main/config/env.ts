import { z } from 'zod';
import { config } from 'dotenv';

config();

const envSchema = z.object({
  API_PORT: z.string().default('5000'),
  API_CORS_ORIGINS: z.string(),
  API_CORS_ALLOWED_HEADERS: z.string(),
  API_LOGGER_LEVEL: z.enum(['debug', 'dev', 'prod']),

  WS_PORT: z.string(),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('Invalid environment variables:', parsedEnv.error.format());
  throw new Error('Invalid environment variables');
}

const setupStringOrStringArrayValue = (origins: string): string | string[] => {
  if (origins.includes(',')) {
    return origins.split(',').map((origin) => origin.trim());
  }

  return origins;
};

const { API_PORT, API_CORS_ORIGINS, API_CORS_ALLOWED_HEADERS, API_LOGGER_LEVEL, WS_PORT } = parsedEnv.data;

export const env = {
  baseConfig: {
    api: {
      port: Number(API_PORT),
      loggerLevel: API_LOGGER_LEVEL,
      cors: {
        origin: setupStringOrStringArrayValue(API_CORS_ORIGINS),
        allowedHeaders: setupStringOrStringArrayValue(API_CORS_ALLOWED_HEADERS),
      },
    },
    ws: {
      port: Number(WS_PORT),
    },
  },
};
