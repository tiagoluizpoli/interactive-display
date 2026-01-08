import { Button } from '@/src/components/ui/button';
import { GetTableColumns, CreateStyleForm, DataTable } from '../components';
import { useDeleteStyleMutation, useGetTargetsQuery, useSetDefaultStyleMutation, useGetStylesQuery } from '../core';
import { Icon } from '@iconify/react';

export const BibleTab = () => {
  const { data, isLoading } = useGetStylesQuery({ type: 'bible' });
  const { data: targets, isLoading: targetsIsLoading } = useGetTargetsQuery({ type: 'bible' });

  const { mutateAsync: setDefaultMutateAsync } = useSetDefaultStyleMutation({ type: 'bible' });
  const { mutateAsync: deleteMutateAsync } = useDeleteStyleMutation({ type: 'bible' });

  if (targetsIsLoading) {
    return <div>Loading...</div>;
  }

  if (!targets) {
    return <div>No targets found.</div>;
  }

  if (!data) {
    return <div>No styles found.</div>;
  }

  const columns = GetTableColumns({
    setDefaultMutateAsync,
    deleteMutateAsync,
    type: 'bible',
    targets,
  });
  const triggerButton = (
    <Button className="flex items-center cursor-pointer">
      <Icon icon={'qlementine-icons:new-16'} /> Novo
    </Button>
  );

  return (
    <div className="flex flex-col gap-4 pt-2">
      <div className="flex justify-end">
        <CreateStyleForm type="bible" targets={targets} triggerButton={triggerButton} />
      </div>
      <DataTable columns={columns} data={data ?? []} isLoading={isLoading} />
    </div>
  );
};
