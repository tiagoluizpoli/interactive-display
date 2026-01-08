import { queryKeys } from '@/src/config';
import { httpClient } from '@/src/config/http';
import { useQuery } from '@tanstack/react-query';
import type { StyleResult } from '../models';

const getActiveStyle = async (type: string) => {
  const activeStyle = await httpClient.get(`/styles/active/${type}`);
  // await new Promise((resolve) => setTimeout(resolve, 3 * 1000));
  return activeStyle.data;
};

export const useGetActiveStyleQuery = (type: string) => {
  const activeStyleQuery = useQuery<StyleResult>({
    queryKey: queryKeys.styles.active(type),
    queryFn: () => getActiveStyle(type),
  });

  return { ...activeStyleQuery };
};
