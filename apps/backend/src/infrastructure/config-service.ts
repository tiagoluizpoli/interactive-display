import { db } from '../db';
import { configSets, configValues } from '../db/schema';
import { eq } from 'drizzle-orm';

export class ConfigService {
  private static instance: ConfigService;
  private configCache: Map<string, Map<string, string>> = new Map();

  private constructor() {
    this.loadConfigToCache();
  }

  public static getInstance(): ConfigService {
    if (!ConfigService.instance) {
      ConfigService.instance = new ConfigService();
    }
    return ConfigService.instance;
  }

  public async getConfigSetValues(setName: string): Promise<Map<string, string> | undefined> {
    if (this.configCache.has(setName)) {
      return this.configCache.get(setName);
    }

    const configSet = await db.select().from(configSets).where(eq(configSets.name, setName)).get();
    if (!configSet) {
      return undefined;
    }

    const values = await db.select().from(configValues).where(eq(configValues.configSetId, configSet.id));
    const configMap = new Map<string, string>();
    values.forEach((item) => configMap.set(item.key, item.value));
    this.configCache.set(setName, configMap);
    return configMap;
  }

  private async loadConfigToCache() {
    const sets = await db.select().from(configSets);
    for (const set of sets) {
      const values = await db.select().from(configValues).where(eq(configValues.configSetId, set.id));
      const configMap = new Map<string, string>();
      values.forEach((item) => configMap.set(item.key, item.value));
      this.configCache.set(set.name, configMap);
    }
  }

  public get(setName: string, key: string): string | undefined {
    return this.configCache.get(setName)?.get(key);
  }

  public async set(setName: string, key: string, value: string): Promise<void> {
    let configSet = await db.select().from(configSets).where(eq(configSets.name, setName)).get();

    if (!configSet) {
      const [newSet] = await db.insert(configSets).values({ name: setName }).returning();
      configSet = newSet;
    }

    await db
      .insert(configValues)
      .values({ configSetId: configSet.id, key, value })
      .onConflictDoUpdate({ target: [configValues.configSetId, configValues.key], set: { value } });

    let configMap = this.configCache.get(setName);
    if (!configMap) {
      configMap = new Map();
      this.configCache.set(setName, configMap);
    }
    configMap.set(key, value);
  }

  public async getAll(): Promise<Record<string, Record<string, string>>> {
    const result: Record<string, Record<string, string>> = {};
    const sets = await db.select().from(configSets);
    for (const set of sets) {
      const values = await db.select().from(configValues).where(eq(configValues.configSetId, set.id));
      result[set.name] = values.reduce(
        (acc, item) => {
          acc[item.key] = item.value;
          return acc;
        },
        {} as Record<string, string>,
      );
    }
    return result;
  }

  public async delete(setName: string, key: string): Promise<void> {
    const configSet = await db.select().from(configSets).where(eq(configSets.name, setName)).get();
    if (!configSet) {
      return;
    }

    await db.delete(configValues).where(eq(configValues.configSetId, configSet.id) && eq(configValues.key, key));

    this.configCache.get(setName)?.delete(key);
  }

  public async deleteSet(setName: string): Promise<void> {
    const configSet = await db.select().from(configSets).where(eq(configSets.name, setName)).get();
    if (!configSet) {
      return;
    }

    await db.delete(configValues).where(eq(configValues.configSetId, configSet.id));
    await db.delete(configSets).where(eq(configSets.id, configSet.id));

    this.configCache.delete(setName);
  }
}
