import { z } from 'zod';

const configs = ['holyrics', 'pro-presenter'] as const;
export type Config = (typeof configs)[number];

export interface ConfigResult {
  id: string;
  code: Config;
  configValues: Record<string, string>;
}

export const setConfigSchema = z.object({
  configCode: z.enum(configs),
  values: z.array(
    z.object({
      key: z.string(),
      value: z.string(),
    }),
  ),
});

export type SetConfig = z.infer<typeof setConfigSchema>;
