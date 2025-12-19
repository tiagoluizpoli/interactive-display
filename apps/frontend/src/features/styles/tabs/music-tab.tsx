import { Button } from '@/src/components/ui/button';
import { columns, DataTable } from '../components';
import { Icon } from '@iconify/react';
import { useStyle } from '../core';

export const MusicTab = () => {
  const { data, isLoading } = useStyle({ type: 'music' });

  return (
    <div className="flex flex-col gap-4 pt-2">
      <div className="flex justify-end">
        <Button className="flex items-center cursor-pointer">
          <Icon icon={'qlementine-icons:new-16'} /> Novo
        </Button>
      </div>
      <DataTable columns={columns} data={data ?? []} isLoading={isLoading} />
    </div>
  );
};
