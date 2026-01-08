import type { ConfigModel, ConfigValueModel } from '@/models';
import { and, eq, exists, sql } from 'drizzle-orm';
import { db } from '../database-setup';
import { configTable, configValuesTable } from '../schema';

export class ConfigRepository {
  private static instance: ConfigRepository;
  private configCache: Map<string, ConfigModel> = new Map();

  public static getInstance(): ConfigRepository {
    if (!ConfigRepository.instance) {
      ConfigRepository.instance = new ConfigRepository();
    }
    return ConfigRepository.instance;
  }

  private constructor() {}

  public async init(): Promise<void> {
    await this.loadConfigToCache();
  }

  private mapArrayToObject(configValues: ConfigValueModel[]) {
    return configValues.reduce((acc: Record<string, string>, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {});
  }

  private async loadConfigToCache() {
    const configs = await db.query.configTable.findMany({
      with: {
        configValues: true,
      },
    });
    for (const set of configs) {
      const configValues = this.mapArrayToObject(set.configValues);
      this.configCache.set(set.code, { ...set, configValues });
    }
  }

  public async getConfigByCode(configCode: string): Promise<ConfigModel | undefined> {
    if (this.configCache.has(configCode)) {
      return this.configCache.get(configCode);
    }

    const config = await db.query.configTable.findFirst({
      where: eq(configTable.code, configCode),
      with: {
        configValues: true,
      },
    });

    if (!config) return;

    const configValues = this.mapArrayToObject(config!.configValues);

    return { ...config, configValues };
  }

  public async set(configCode: string, values: ConfigValueModel[]): Promise<void> {
    const [config] = await db
      .insert(configTable)
      .values({ code: configCode })
      .onConflictDoUpdate({
        target: configTable.code,
        set: { code: configCode },
      })
      .returning();

    await db
      .insert(configValuesTable)
      .values(values.map(({ key, value }) => ({ configId: config.id, key, value })))
      .onConflictDoUpdate({
        target: [configValuesTable.configId, configValuesTable.key],
        set: {
          key: sql`excluded.key`,
          value: sql`excluded.value`,
        },
      });

    const valuesResult = await db.query.configValuesTable.findMany({
      where: eq(configValuesTable.configId, config.id),
    });

    this.configCache.set(config.code, {
      ...config,
      configValues: this.mapArrayToObject(valuesResult),
    });
  }

  public async getAll(): Promise<ConfigModel[]> {
    await this.loadConfigToCache();

    return [...this.configCache.values()];
  }

  public async deleteConfigValue(configCode: string, key: string): Promise<void> {
    await db
      .delete(configValuesTable)
      .where(
        exists(
          db
            .select()
            .from(configTable)
            .where(
              and(
                eq(configTable.code, configCode),
                eq(configTable.id, configValuesTable.configId),
                eq(configValuesTable.key, key),
              ),
            ),
        ),
      )
      .execute();

    const config = this.configCache.get(configCode);

    if (!config) {
      return;
    }

    const configValuesKeys = Object.keys(config.configValues);
    config.configValues = configValuesKeys
      .filter((c) => c !== key)
      .reduce((acc: Record<string, string | number>, key) => {
        acc[key] = config.configValues[key];
        return acc;
      }, {});

    this.configCache.set(config.code, config);
  }

  public async deleteConfig(setName: string): Promise<void> {
    await db.transaction(async (tx) => {
      await tx
        .delete(configValuesTable)
        .where(
          exists(
            tx
              .select()
              .from(configTable)
              .where(and(eq(configTable.code, setName), eq(configTable.id, configValuesTable.configId))),
          ),
        )
        .execute();

      await tx.delete(configTable).where(eq(configTable.code, setName)).execute();
    });

    this.configCache.delete(setName);
  }
}
