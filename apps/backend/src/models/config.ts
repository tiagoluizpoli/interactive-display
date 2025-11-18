export interface ConfigValueModel {
  configSetId?: string;
  value: string;
  key: string;
}

export interface ConfigModel {
  id: string | null;
  code: string;
  configValues: Record<string, string | number>;
}
