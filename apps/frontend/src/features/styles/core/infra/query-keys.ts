const buildKey = (baseKey: string, params: string | string[]) => {
  if (Array.isArray(params)) return [baseKey, ...params];

  return [baseKey, params];
};

export const queryKeys = {
  styles: {
    byType: (params: string | string[]) => buildKey('styles', params),
  },
  targets: {
    byType: (params: string | string[]) => buildKey('targets', params),
  },
};
