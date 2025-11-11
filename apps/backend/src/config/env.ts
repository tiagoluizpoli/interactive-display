import { config } from 'dotenv';
import { z } from 'zod';
import { ConfigService } from '../infrastructure/config-service';

config();

const staticEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

const parsedStaticEnv = staticEnvSchema.safeParse(process.env);

if (!parsedStaticEnv.success) {
  console.error('Invalid static environment variables:', parsedStaticEnv.error.format());
  throw new Error('Invalid static environment variables');
}

const configService = ConfigService.getInstance();

const setupStringOrStringArrayValue = (origins: string): string | string[] => {
  if (origins.includes(',')) {
    return origins.split(',').map((origin) => origin.trim());
  }

  return origins;
};

// Define validation schemas for each config set
export const holyricsConfigSchema = z.object({
  URL: z.string().url().min(1, 'Holyrics URL is required'),
  TIMEOUT: z.number().min(1, 'Holyrics timeout must be a positive number'),
  RETRY_TIME: z.number().min(0, 'Holyrics retry time must be a non-negative number'),
  POLLING_INTERVAL_MS: z.number().min(1, 'Holyrics polling interval must be a positive number'),
  REFERENCE_SELECTOR: z.string().min(1, 'Holyrics reference selector is required'),
  TEXT_SELECTOR: z.string().min(1, 'Holyrics text selector is required'),
  VERSION_SELECTOR: z.string().min(1, 'Holyrics version selector is required'),
});

export const proPresenterConfigSchema = z.object({
  HOST: z.string().min(1, 'ProPresenter host is required'),
  PORT: z.number().min(1, 'ProPresenter port must be a positive number'),
});

// Function to validate a config set
export const validateConfig = async <T extends z.ZodSchema>(setName: string, schema: T): Promise<z.infer<T>> => {
  const configValues = await configService.getConfigSetValues(setName);
  if (!configValues) {
    throw new Error(`Configuration set "${setName}" not found.`);
  }
  const parsed = schema.safeParse(Object.fromEntries(configValues));
  if (!parsed.success) {
    console.error(`Invalid configuration for ${setName}:`, parsed.error.format());
    throw new Error(`Invalid configuration for ${setName}`);
  }
  return parsed.data;
};

export const env = {
  baseConfig: {
    api: {
      port: Number( process.env.API_PORT || '5000'),
      loggerLevel: (configService.get('api', 'LOGGER_LEVEL') || process.env.API_LOGGER_LEVEL || 'dev') as
        | 'debug'
        | 'dev'
        | 'prod',
      cors: {
        origin: setupStringOrStringArrayValue(
          configService.get('api', 'CORS_ORIGINS') || process.env.API_CORS_ORIGINS || '',
        ),
        allowedHeaders: setupStringOrStringArrayValue(
          configService.get('api', 'CORS_ALLOWED_HEADERS') || process.env.API_CORS_ALLOWED_HEADERS || '',
        ),
      },
    },

    nodeEnv: parsedStaticEnv.data.NODE_ENV,
  },
  services: {
    proPresenter: {
      host: configService.get('proPresenter', 'HOST') || process.env.SERVICES_PRO_PRESENTER_HOST || '',
      port: Number(configService.get('proPresenter', 'PORT') || process.env.SERVICES_PRO_PRESENTER_PORT || '0'),
    },
    holyrics: {
      url: configService.get('holyrics', 'URL') || process.env.SERVICES_HOLYRICS_URL || '',
      timeout: Number(configService.get('holyrics', 'TIMEOUT') || process.env.SERVICES_HOLYRICS_TIMEOUT || '0'),
      retryTime: Number(configService.get('holyrics', 'RETRY_TIME') || process.env.SERVICES_HOLYRICS_RETRY_TIME || '0'),
      pollingIntervalMs: Number(
        configService.get('holyrics', 'POLLING_INTERVAL_MS') ||
          process.env.SERVICES_HOLYRICS_POLLING_INTERVAL_MS ||
          '0',
      ),
      selectors: {
        referenceSelector:
          configService.get('holyrics', 'REFERENCE_SELECTOR') || process.env.SERVICES_HOLYRICS_REFERENCE_SELECTOR || '',
        textSelectoor:
          configService.get('holyrics', 'TEXT_SELECTOR') || process.env.SERVICES_HOLYRICS_TEXT_SELECTOR || '',
        versionSelector:
          configService.get('holyrics', 'VERSION_SELECTOR') || process.env.SERVICES_HOLYRICS_VERSION_SELECTOR || '',
      },
    },
  },
};
