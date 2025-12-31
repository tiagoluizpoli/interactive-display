import { Button } from '@/src/components/ui/button';
import { StyleSheet } from './style-sheet';
import { Icon } from '@iconify/react';
import { createStyleSchema, useCreateStyleMutation, type CreateStyle, type TargetListItem } from '../../core';

import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel, FieldSet } from '@/src/components/ui/field';
import { Input } from '@/src/components/ui/input';
import { Separator } from '@/src/components/ui/separator';
import { useState } from 'react';

interface Props {
  type: 'bible' | 'music';
  targets: TargetListItem[];
}

export const CreateStyleForm = ({ type, targets }: Props) => {
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
  const form = useForm<CreateStyle>({
    defaultValues,
    resolver: zodResolver(createStyleSchema),
    mode: 'onTouched',
  });

  const {
    handleSubmit,
    register,
    reset,
    control,
    formState: { errors },
  } = form;

  const { fields } = useFieldArray({
    control,
    name: 'targets',
  });

  const onSubmit = handleSubmit(async (data: CreateStyle) => {
    await mutateAsync(data);
    reset();
    onOpenChange(false);
  });

  return (
    <StyleSheet
      title="Criar estilo"
      description="Crie um novo estilo para ser usado em suas apresentações."
      trigger={
        <Button className="flex items-center cursor-pointer">
          <Icon icon={'qlementine-icons:new-16'} /> Novo
        </Button>
      }
      open={open}
      onOpenChange={onOpenChange}
      footer={
        <Field orientation={'horizontal'} className="justify-end">
          <Button type="submit">Salvar estilo</Button>
        </Field>
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

      {/* <Controller control={control} name="type" /> */}
    </StyleSheet>
  );
};
