import { useEffect, useState } from 'react';
import {
  useUpdateStyleMutation,
  type UpsertStyle,
  type TargetListItem,
  upsertStyleSchema,
  useGetStyleByIdQuery,
} from '../../core';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { StyleSheet } from './style-sheet';
import { Button } from '@/src/components/ui/button';

import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel, FieldSet } from '@/src/components/ui/field';
import { Input } from '@/src/components/ui/input';
import { Separator } from '@radix-ui/react-separator';
import { BibleViewer } from './bible-viewer';
import { MusicViewer } from './music-viewer';

interface Props {
  type: 'bible' | 'music';
  targets: TargetListItem[];
  triggerButton: React.ReactNode;
  styleId: string;
}

export const UpdateStyleForm = ({ type, targets, triggerButton, styleId }: Props) => {
  const [open, onOpenChange] = useState<boolean>(false);
  const { mutateAsync } = useUpdateStyleMutation({ type });
  const { data: style, isLoading } = useGetStyleByIdQuery({ type, styleId });

  const defaultValues = {
    type,
    name: '',
    targets: [],
  };

  const form = useForm<UpsertStyle>({
    defaultValues,
    resolver: zodResolver(upsertStyleSchema),
    mode: 'onTouched',
  });

  const {
    handleSubmit,
    register,
    reset,
    setValue,
    watch,
    control,
    formState: { errors },
  } = form;

  useEffect(() => {
    if (style) {
      setValue('name', style.name);
      setValue(
        'targets',
        targets.map((v) => ({
          targetId: v.id,
          classes: style?.classes.find((i) => i.target.id === v.id)?.classes ?? '',
        })) ?? [],
      );
    }
  }, [style]);

  const { fields } = useFieldArray({
    control,
    name: 'targets',
  });

  const onSubmit = handleSubmit(async (data: UpsertStyle) => {
    await mutateAsync({ styleId, newStyle: data });
    reset();
    onOpenChange(false);
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!style) {
    return <div>No style found.</div>;
  }

  return (
    <StyleSheet
      title={`Alterar estilo ${style.name}`}
      description={`Altere o estilo ${style.name}.`}
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
      trigger={triggerButton}
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
          <FieldDescription>Preencha cada propriedade com as classes do tailwind</FieldDescription>
          <FieldGroup>
            {fields.map((field, index) => (
              <Field key={field.id}>
                <FieldLabel>{targets.find((i) => i.id === field.targetId)?.target}</FieldLabel>
                <Input {...register(`targets.${index}.classes`)} />
                <FieldError errors={[errors.targets?.[index]?.classes]} />
              </Field>
            ))}
          </FieldGroup>
        </FieldSet>
      </FieldGroup>
    </StyleSheet>
  );
};
