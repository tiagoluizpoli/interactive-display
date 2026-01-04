import { httpClient } from '@/src/config/http';
import type { Config, ConfigResult, SetConfig } from '../model';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/src/config';
import { toast } from 'sonner';
import { isAxiosError } from 'axios';

const getConfigByName = async (name: Config) => {
  const config = await httpClient.get(`/config/${name}`);

  return config.data;
};

export const useGetConfigByNameQuery = (name: Config) => {
  const configQuery = useQuery<ConfigResult>({
    queryKey: queryKeys.config.byName(name),
    queryFn: () => getConfigByName(name),
  });

  return { ...configQuery };
};

const setConfig = async (config: SetConfig) => {
  const result = await httpClient.post('/config', config);

  return result.data;
};

export const useSetConfigMutation = (name: Config) => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: setConfig,
    onSuccess: () => {
      toast.success('Config saved successfully');
    },
    onError: (error) => {
      if (isAxiosError(error)) {
        toast.error(error.response?.data.message);
        return;
      }

      toast.error(error.message);
    },

    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.config.byName(name),
      });
    },
  });

  return { ...mutation };
};
