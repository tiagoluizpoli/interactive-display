import { httpClient } from '@/src/config/http';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from './query-keys';
import type { StyleListItem } from '../models';

export interface GetStylesParams {
  type: string;
}

const getStyles = async ({ type }: GetStylesParams) => {
  const styles = await httpClient.get('/styles', {
    params: {
      type,
    },
  });
  return styles.data;
};

export const useStyle = ({ type }: GetStylesParams) => {
  const query = useQuery<StyleListItem[]>({
    queryKey: queryKeys.styles.byType(type),
    queryFn: async ({ queryKey }) => await getStyles({ type: queryKey[1] as string }),
  });

  return { ...query };
};
