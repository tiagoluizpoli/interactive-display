import { httpClient } from '@/src/config/http';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from './query-keys';
import type { UpsertStyle, StyleListItem, Style } from '../models';
import { toast } from 'sonner';
import { isAxiosError } from 'axios';

export interface GetStylesParams {
  type: string;
}

export interface GetStyleByIdParams {
  type: string;
  styleId: string;
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

export const useGetStylesQuery = ({ type }: GetStylesParams) => {
  const query = useQuery<StyleListItem[]>({
    queryKey: queryKeys.styles.byType(type),
    queryFn: async ({ queryKey }) => await getStyles({ type: queryKey[1] as string }),
  });

  return { ...query };
};

const getStyleById = async (styleId: string) => {
  const style = await httpClient.get(`/styles/${styleId}`);
  return style.data;
};

export const useGetStyleByIdQuery = ({ type, styleId }: GetStyleByIdParams) => {
  const query = useQuery<Style>({
    staleTime: 0,
    queryKey: queryKeys.styles.byId([type, styleId]),
    queryFn: async ({ queryKey }) => await getStyleById(queryKey[2] as string),
  });

  return { ...query };
};

const createStyle = async (newStyle: UpsertStyle) => {
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

export const deleteStyle = async (styleId: string) => {
  const response = await httpClient.delete(`/styles/${styleId}`);
  return response.data;
};

export const useDeleteStyleMutation = ({ type }: { type: string }) => {
  const client = useQueryClient();

  const mutation = useMutation({
    mutationFn: deleteStyle,
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

export interface UpdateStyleParams {
  styleId: string;
  newStyle: UpsertStyle;
}

export const updateStyle = async ({ styleId, newStyle }: UpdateStyleParams) => {
  const response = await httpClient.put(`/styles/${styleId}`, newStyle);
  return response.data;
};

export const useUpdateStyleMutation = ({ type }: { type: string }) => {
  const client = useQueryClient();

  const mutation = useMutation<any, Error, UpdateStyleParams>({
    mutationFn: updateStyle,
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
