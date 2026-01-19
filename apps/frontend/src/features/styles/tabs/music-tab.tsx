import { Button } from '@/src/components/ui/button';
import { GetTableColumns, CreateStyleForm, DataTable } from '../components';
import { useDeleteStyleMutation, useGetTargetsQuery, useSetDefaultStyleMutation, useGetStylesQuery } from '../core';
import { Icon } from '@iconify/react';
import { useIsMobile } from '@/src/hooks/use-mobile';

export const MusicTab = () => {
  const { data, isLoading } = useGetStylesQuery({ type: 'music' });
  const { data: targets, isLoading: targetsIsLoading } = useGetTargetsQuery({ type: 'music' });

  const { mutateAsync: setDefaultMutateAsync } = useSetDefaultStyleMutation({ type: 'music' });
  const { mutateAsync: deleteMutateAsync } = useDeleteStyleMutation({ type: 'music' });

  const isMobile = useIsMobile();

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
    type: 'music',
    targets,
    isMobile,
  });

  const triggerButton = (
    <Button className="flex items-center cursor-pointer">
      <Icon icon={'qlementine-icons:new-16'} /> Novo
    </Button>
  );

  return (
    <div className="flex flex-col gap-4 pt-2">
      <div className="flex justify-end">
        <CreateStyleForm type="music" targets={targets} triggerButton={triggerButton} />
      </div>
      <DataTable columns={columns} data={data ?? []} isLoading={isLoading} />
    </div>
  );
};
