import { z } from 'zod';
import { ConfigRepository } from '../db/config-repository';

const configService = ConfigRepository.getInstance();

// Define validation schemas for each config set
export const holyricsConfigSchema = z.object({
  URL: z.string().url().min(1, 'Holyrics URL is required'),
  TIMEOUT: z.string().min(1, 'Holyrics timeout must be a positive number'),
  RETRY_TIME: z.string().min(0, 'Holyrics retry time must be a non-negative number'),
  POLLING_INTERVAL_MS: z.string().min(1, 'Holyrics polling interval must be a positive number'),
  REFERENCE_SELECTOR: z.string().min(1, 'Holyrics reference selector is required'),
  TEXT_SELECTOR: z.string().min(1, 'Holyrics text selector is required'),
  VERSION_SELECTOR: z.string().min(1, 'Holyrics version selector is required'),
});
export type HolyricsConfig = z.infer<typeof holyricsConfigSchema>;

export const proPresenterConfigSchema = z.object({
  HOST: z.string().min(1, 'ProPresenter host is required'),
  PORT: z.string().min(1, 'ProPresenter port must be a positive number'),
});

export type ProPresenterConfig = z.infer<typeof proPresenterConfigSchema>;

const configTypes = ['holyrics', 'pro-presenter'] as const;
export type ConfigType = (typeof configTypes)[number];

export const validateConfig = async <T extends z.ZodSchema>(
  configCode: ConfigType,
  schema: z.ZodObject<any>,
): Promise<z.infer<T>> => {
  const keys = Object.keys(schema.shape);

  let missingConfigs: string[] = [];
  const configValues = await configService.getConfigByCode(configCode);

  if (!configValues) {
    missingConfigs = keys;
    return { [configCode]: missingConfigs };
  }

  const parsed = schema.safeParse(configValues.configValues);

  if (!parsed.success) {
    missingConfigs = Object.keys(parsed.error.flatten().fieldErrors);
    return { [configCode]: missingConfigs };
  }
};

export const monitorConfig = async () => {
  await configService.init();

  setInterval(async () => {
    const results = await Promise.all([
      validateConfig('holyrics', holyricsConfigSchema),
      validateConfig('pro-presenter', proPresenterConfigSchema),
    ]);

    // TODO -> emit so frontend can know if something is missing
    console.log({ results });
  }, 10000);
};
