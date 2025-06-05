import { z } from 'zod';

const envSchema = z.object({
  VITE_BASE_URL: z.string(),
});

const parsedEnv = envSchema.safeParse(import.meta.env);

if (!parsedEnv.success) {
  console.error('Invalid environment variables:', parsedEnv.error.format());
  throw new Error('Invalid environment variables:');
}

const { VITE_BASE_URL } = parsedEnv.data;

export const env = {
  baseConfig: {
    baseUrl: VITE_BASE_URL,
  },
};
