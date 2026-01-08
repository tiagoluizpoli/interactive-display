import { useFieldArray, useForm } from 'react-hook-form';
import {
  useGetConfigByNameQuery,
  useSetConfigMutation,
  setConfigSchema,
  type SetConfig,
  type Config,
} from '@/src/features/config/core';

import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';

import { Field, FieldError, FieldGroup, FieldLabel } from '@/src/components/ui/field';

import { Input } from '@/src/components/ui/input';
import { ScrollArea } from '@/src/components/ui/scroll-area';
import { Button } from '@/src/components/ui/button';

interface Props {
  code: Config;
}
export const ConfigForm = ({ code }: Props) => {
  const { data, isLoading } = useGetConfigByNameQuery(code);
  const { mutateAsync } = useSetConfigMutation(code);

  const defaultValues: SetConfig = {
    configCode: code,
    values: [],
  };

  const form = useForm<SetConfig>({
    defaultValues,
    resolver: zodResolver(setConfigSchema),
    mode: 'onTouched',
  });

  const {
    control,
    setValue,
    handleSubmit,
    register,
    formState: { errors },
  } = form;

  const { fields } = useFieldArray({
    control,
    name: 'values',
  });

  useEffect(() => {
    if (data) {
      setValue('configCode', data.code);
      setValue(
        'values',
        Object.keys(data.configValues).map((key) => ({
          key,
          value: data.configValues[key],
        })),
      );
    }
  }, [data]);

  const onSubmit = handleSubmit(async (data: SetConfig) => {
    await mutateAsync(data);
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }
  if (!data) {
    return <div>No data</div>;
  }
  return (
    <form onSubmit={onSubmit}>
      <ScrollArea>
        <FieldGroup className="grid grid-cols-3">
          {fields.map((field, index) => (
            <Field key={field.id}>
              <FieldLabel>{field.key}</FieldLabel>
              <Input {...register(`values.${index}.value`)} />
              <FieldError errors={[errors.values?.[index]?.value]} />
            </Field>
          ))}
        </FieldGroup>
      </ScrollArea>
      <div className="flex justify-start">
        <Button type="submit">Salvar</Button>
      </div>
    </form>
  );
};
