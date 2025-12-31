import { httpClient } from '@/src/config/http';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from './query-keys';
import type { CreateStyle, StyleListItem } from '../models';
import { toast } from 'sonner';
import { isAxiosError } from 'axios';

export interface GetStylesParams {
  type: string;
}

export interface SetDefaultStyleParams {
  code: string;
  styleId: string;
}

const getStyles = async ({ type }: GetStylesParams) => {
  const styles = await httpClient.get('/styles', {
    params: {
      type,
    },
  });
  return styles.data;
};

export const useStyleQuery = ({ type }: GetStylesParams) => {
  const query = useQuery<StyleListItem[]>({
    queryKey: queryKeys.styles.byType(type),
    queryFn: async ({ queryKey }) => await getStyles({ type: queryKey[1] as string }),
  });

  return { ...query };
};

const createStyle = async (newStyle: CreateStyle) => {
  const response = await httpClient.post('/styles', newStyle);
  return response.data;
};

export const useCreateStyleMutation = ({ type }: { type: string }) => {
  const client = useQueryClient();
  const mutation = useMutation({
    mutationFn: createStyle,
    onSettled: () => {
      client.invalidateQueries({ queryKey: queryKeys.styles.byType(type) });
    },
    onSuccess: (resp) => {
      toast.success(resp.message);
    },
    onError: (error) => {
      if (isAxiosError(error)) {
        toast.error(error.response?.data.message);
        return;
      }

      toast.error(error.message);
    },
  });

  return { ...mutation };
};

export const setDefaultStyle = async ({ code, styleId }: SetDefaultStyleParams) => {
  const response = await httpClient.post('/styles/active', {
    code,
    styleId,
  });

  return response.data;
};

export const useSetDefaultStyleMutation = ({ type }: { type: string }) => {
  const client = useQueryClient();
  const mutation = useMutation({
    mutationFn: setDefaultStyle,
    onSettled: () => {
      client.invalidateQueries({ queryKey: queryKeys.styles.byType(type) });
    },
    onSuccess: (resp) => {
      toast.success(resp.message);
    },
    onError: (error) => {
      if (isAxiosError(error)) {
        toast.error(error.response?.data.message);
        return;
      }

      toast.error(error.message);
    },
  });

  return { ...mutation };
};
