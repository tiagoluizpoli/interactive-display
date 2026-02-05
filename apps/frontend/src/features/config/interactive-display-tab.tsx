import { Button } from '@/src/components/ui/button';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/src/components/ui/field';
import { Input } from '@/src/components/ui/input';
import { ScrollArea } from '@/src/components/ui/scroll-area';
import {
  appConfigSchema,
  persistedAppConfig,
  type AppConfig,
} from '@/src/config';
import { isBlank } from '@/src/lib/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';

export const InteractiveDisplayTab = () => {
  const { config, setConfig } = persistedAppConfig.getState();

  const defaultValues: AppConfig = {
    backendUrl: config.backendUrl ?? '',
  };

  const form = useForm<AppConfig>({
    defaultValues: defaultValues,
    resolver: zodResolver(appConfigSchema),
    mode: 'onTouched',
  });

  const { control, handleSubmit } = form;

  const onSubmit = handleSubmit(async (data: AppConfig) => {
    const { backendUrl } = data;

    setConfig({
      backendUrl: !isBlank(backendUrl) ? backendUrl : undefined,
    });

    toast.success(
      'Config salva com sucesso. Atualize a página para aplicar as alterações.',
    );
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <ScrollArea>
        <FieldGroup className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6">
          <Controller
            control={control}
            name="backendUrl"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel>Backend url</FieldLabel>
                <Input
                  {...field}
                  id={field.name}
                  aria-invalid={fieldState.invalid}
                  placeholder="backend url"
                />
                {fieldState.invalid ? (
                  <FieldError>{fieldState.error?.message}</FieldError>
                ) : (
                  <FieldDescription>Url do Servidor</FieldDescription>
                )}
              </Field>
            )}
          />
        </FieldGroup>
      </ScrollArea>
      <div className="flex justify-end">
        <Button type="submit">Salvar</Button>
      </div>
    </form>
  );
};
