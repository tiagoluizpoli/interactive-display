import { columns, CreateStyleForm, DataTable } from '../components';
import { useGetTargetsQuery, useStyleQuery } from '../core';

export const BibleTab = () => {
  const { data, isLoading } = useStyleQuery({ type: 'bible' });
  const { data: targets, isLoading: targetsIsLoading } = useGetTargetsQuery({ type: 'bible' });

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
        <CreateStyleForm type="bible" targets={targets} />
      </div>
      <DataTable columns={columns} data={data ?? []} isLoading={isLoading} />
    </div>
  );
};
