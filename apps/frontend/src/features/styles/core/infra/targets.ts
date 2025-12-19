import { httpClient } from '@/src/config/http';
import type { TargetListItem } from '../models';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from './query-keys';

export interface GetTargetsParams {
  type: string;
}

export const getTargets = async ({ type }: GetTargetsParams) => {
  const targets = await httpClient.get<TargetListItem[]>('/styles/target', {
    params: {
      type,
    },
  });

  return targets.data;
};

export const useTargets = ({ type }: GetTargetsParams) => {
  const query = useQuery<TargetListItem[]>({
    queryKey: queryKeys.targets.byType(type),
    queryFn: async ({ queryKey }) => await getTargets({ type: queryKey[1] as string }),
  });

  return { ...query };
};
