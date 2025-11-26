import { z } from 'zod';
import { createChildLogger } from './logger';
import { StatusNotifier } from './status-notifier';

// Define validation schemas for each config set
export const holyricsConfigSchema = z.object({
  URL: z.string().url().min(1, 'Holyrics URL is required'),
  TIMEOUT: z.coerce.number().min(1, 'Holyrics timeout must be a positive number'),
  MAX_NETWORK_FAILURES: z.coerce.number().min(0, 'Holyrics max network failures must be a non-negative number'),
  RETRY_TIME: z.coerce.number().min(0, 'Holyrics retry time must be a non-negative number'),
  POLLING_INTERVAL_MS: z.coerce.number().min(1, 'Holyrics polling interval must be a positive number'),
  REFERENCE_SELECTOR: z.string().min(1, 'Holyrics reference selector is required'),
  TEXT_SELECTOR: z.string().min(1, 'Holyrics text selector is required'),
  VERSION_SELECTOR: z.string().min(1, 'Holyrics version selector is required'),
});
export type HolyricsConfig = z.infer<typeof holyricsConfigSchema>;

export const proPresenterConfigSchema = z.object({
  HOST: z.string().min(1, 'ProPresenter host is required'),
  PORT: z.coerce.number().min(1, 'ProPresenter port must be a positive number'),
});

export type ProPresenterConfig = z.infer<typeof proPresenterConfigSchema>;

const configTypes = ['holyrics', 'pro-presenter'] as const;
export type ConfigType = (typeof configTypes)[number];

const schemaMapper = {
  holyrics: holyricsConfigSchema,
  'pro-presenter': proPresenterConfigSchema,
} satisfies Record<ConfigType, z.ZodObject<any>>;

const logger = createChildLogger('VaidateConfig');

export const validateConfig = <T extends ConfigType>(
  configType: T,
  configValues: unknown,
): z.infer<(typeof schemaMapper)[T]> | undefined => {
  const notifier = StatusNotifier.getInstance();

  const schema = schemaMapper[configType];
  const keys = Object.keys(schema.shape);
  let missingConfigs: string[] = [];

  if (!configValues) {
    missingConfigs = keys;

    logger.warn('config not found', { configType, missingConfigs });
    return undefined;
  }

  const parsed = schema.safeParse(configValues);

  if (parsed.success) {
    return parsed.data as z.infer<(typeof schemaMapper)[T]>;
  }

  missingConfigs = Object.keys(parsed.error.flatten().fieldErrors);

  logger.warn('Config has missing fields', { configType, missingConfigs });
  notifier.setStatus(configType, {
    active: false,
  });
  notifier.addLogs(configType, ['Config has missing fields', `missing fields :: ${missingConfigs.join(', ')}`]);

  return undefined;
};
