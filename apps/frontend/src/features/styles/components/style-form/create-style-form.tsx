import { Button } from '@/src/components/ui/button';
import { StyleSheet } from './style-sheet';

import {
  upsertStyleSchema,
  useCreateStyleMutation,
  type UpsertStyle,
  type TargetListItem,
} from '../../core';

import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from '@/src/components/ui/field';
import { Input } from '@/src/components/ui/input';
import { Separator } from '@/src/components/ui/separator';
import { useState } from 'react';
import { BibleViewer } from './bible-viewer';
import { MusicViewer } from './music-viewer';
import { Textarea } from '@/src/components/ui/textarea';

interface Props {
  type: 'bible' | 'music';
  targets: TargetListItem[];
  triggerButton: React.ReactNode;
}

export const CreateStyleForm = ({ type, targets, triggerButton }: Props) => {
  const [open, onOpenChange] = useState<boolean>(false);
  const { mutateAsync } = useCreateStyleMutation({ type });

  const defaultValues = {
    type,
    name: '',
    targets:
      targets.map((v) => ({
        targetId: v.id,
        classes: '',
      })) ?? [],
  };
  const form = useForm<UpsertStyle>({
    defaultValues,
    resolver: zodResolver(upsertStyleSchema),
    mode: 'onTouched',
  });

  const { handleSubmit, reset, watch, control } = form;

  const { fields } = useFieldArray({
    control,
    name: 'targets',
  });

  const onSubmit = handleSubmit(async (data: UpsertStyle) => {
    await mutateAsync(data);
    reset();
    onOpenChange(false);
  });

  return (
    <StyleSheet
      title="Criar estilo"
      description="Crie um novo estilo para ser usado em suas apresentações."
      trigger={triggerButton}
      open={open}
      onOpenChange={onOpenChange}
      footer={
        <div className="w-full flex flex-col gap-4">
          <div className="w-full p-4 border border-dotted rounded-2xl">
            {type === 'bible' ? (
              <BibleViewer watch={watch} targets={targets} />
            ) : (
              <MusicViewer watch={watch} targets={targets} />
            )}
          </div>
          <div className="flex justify-end">
            <Button type="submit">Salvar estilo e</Button>
          </div>
        </div>
      }
      onSubmit={onSubmit}
    >
      <FieldGroup>
        <FieldSet>
          <Controller
            control={control}
            name="name"
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel>Nome</FieldLabel>
                <Input {...field} />
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />
        </FieldSet>

        <Separator />

        <FieldSet>
          <FieldLabel>Classes</FieldLabel>
          <FieldDescription>
            Preencha cada propriedade com as classes do tailwind
          </FieldDescription>
          <FieldGroup className="grid grid-cols-3 gap-8">
            {fields.map((fieldItem, index) => (
              <Controller
                key={fieldItem.id}
                control={control}
                name={`targets.${index}.classes`}
                render={({ field, fieldState }) => {
                  return (
                    <Field aria-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor={field.name}>
                        {
                          targets.find((i) => i.id === fieldItem.targetId)
                            ?.target
                        }
                      </FieldLabel>
                      <Textarea
                        {...field}
                        id={field.name}
                        aria-invalid={fieldState.invalid}
                        className="resize-none h-24"
                      />

                      {fieldState.invalid ? (
                        <FieldError>{fieldState.error?.message}</FieldError>
                      ) : (
                        <FieldDescription>
                          {
                            targets.find((i) => i.id === fieldItem.targetId)
                              ?.description
                          }
                        </FieldDescription>
                      )}
                    </Field>
                  );
                }}
              />
            ))}
          </FieldGroup>
        </FieldSet>
      </FieldGroup>

      {/* <Controller control={control} name="type" /> */}
    </StyleSheet>
  );
};
