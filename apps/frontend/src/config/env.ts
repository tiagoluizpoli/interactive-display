import { z } from 'zod';
import { persistedAppConfig } from './persisted-app-config';

const envSchema = z.object({
  VITE_BASE_URL: z.string(),
});

const parsedEnv = envSchema.safeParse(import.meta.env);

if (!parsedEnv.success) {
  console.error('Invalid environment variables:', parsedEnv.error.format());
  throw new Error('Invalid environment variables:');
}
const localStorageBackendUrl = persistedAppConfig.getState().config.backendUrl;
const { VITE_BASE_URL } = parsedEnv.data;

const getBaseUrl = () => {
  if (localStorageBackendUrl) return localStorageBackendUrl;

  return VITE_BASE_URL ?? 'http://localhost:5000';
};

export const env = {
  baseConfig: {
    baseUrl: getBaseUrl(),
  },
};
