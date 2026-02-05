import { createStore } from 'zustand';
import { persist } from 'zustand/middleware';
import { z } from 'zod';

export const appConfigSchema = z.object({
  backendUrl: z.union([z.literal(''), z.url()]).optional(),
});

export type AppConfig = z.infer<typeof appConfigSchema>;

export interface PersistedAppConfig {
  config: AppConfig;
  setConfig: (config: AppConfig) => void;
}
export const persistedAppConfig = createStore<PersistedAppConfig>()(
  persist(
    (set) => ({
      config: {},
      setConfig: (config: AppConfig) => set({ config }),
    }),
    {
      name: 'interactive-display-config',
    },
  ),
);
