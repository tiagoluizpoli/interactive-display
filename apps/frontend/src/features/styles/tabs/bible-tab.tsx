import { GetTableColumns, CreateStyleForm, DataTable } from '../components';
import { useDeleteStyleMutation, useGetTargetsQuery, useSetDefaultStyleMutation, useStyleQuery } from '../core';

export const BibleTab = () => {
  const { data, isLoading } = useStyleQuery({ type: 'bible' });
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

  const columns = GetTableColumns({ setDefaultMutateAsync, deleteMutateAsync });

  return (
    <div className="flex flex-col gap-4 pt-2">
      <div className="flex justify-end">
        <CreateStyleForm type="bible" targets={targets} />
      </div>
      <DataTable columns={columns} data={data ?? []} isLoading={isLoading} />
    </div>
  );
};
