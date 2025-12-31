import { columns, CreateStyleForm, DataTable } from '../components';
import { useGetTargetsQuery, useStyleQuery } from '../core';

export const MusicTab = () => {
  const { data, isLoading } = useStyleQuery({ type: 'music' });
  const { data: targets, isLoading: targetsIsLoading } = useGetTargetsQuery({ type: 'music' });

  if (targetsIsLoading) {
    return <div>Loading...</div>;
  }

  if (!targets) {
    return <div>No targets found.</div>;
  }

  if (!data) {
    return <div>No styles found.</div>;
  }

  return (
    <div className="flex flex-col gap-4 pt-2">
      <div className="flex justify-end">
        <CreateStyleForm type="music" targets={targets} />
      </div>
      <DataTable columns={columns} data={data ?? []} isLoading={isLoading} />
    </div>
  );
};
