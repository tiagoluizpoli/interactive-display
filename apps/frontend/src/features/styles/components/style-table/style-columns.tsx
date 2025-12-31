import type { ColumnDef } from '@tanstack/react-table';
import type { StyleListItem } from '../../core';
import { ButtonGroup } from '@/src/components/ui/button-group';
import { Button } from '@/src/components/ui/button';
import { Icon } from '@iconify/react';
import { Checkbox } from '@/src/components/ui/checkbox';
import { cn } from '@/src/lib/utils';

interface GetTableColumnsProps {
  setDefaultMutateAsync: (args: { code: string; styleId: string }) => Promise<unknown>;
  deleteMutateAsync: (styleId: string) => Promise<unknown>;
}

export const GetTableColumns = ({
  setDefaultMutateAsync,
  deleteMutateAsync,
}: GetTableColumnsProps): ColumnDef<StyleListItem>[] => {
  const columns: ColumnDef<StyleListItem>[] = [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      size: 50,
      enableResizing: false,
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: 'type',
      header: 'Tipo',
      size: 100,
      enableResizing: false,
    },
    {
      accessorKey: 'name',
      header: 'Nome',
    },

    {
      header: 'Ações',
      size: 100,
      enableResizing: false,
      cell: ({ row }) => {
        return (
          <div className="flex gap-2">
            <Button
              size={'sm'}
              className={cn(
                'cursor-pointer w-10 transition-all duration-300 ease-in-out',
                !row.original.isActive && 'opacity-0 hover:opacity-100',
              )}
              variant={'ghost'}
              onClick={async () => {
                await setDefaultMutateAsync({
                  code: row.original.type,
                  styleId: row.original.id,
                });
              }}
            >
              <Icon
                icon={'foundation:check'}
                color={row.original.isActive === true ? 'green' : undefined}
                className={cn('')}
              />
            </Button>
            <ButtonGroup>
              <Button size={'sm'} className="cursor-pointer w-10">
                <Icon icon={'tabler:edit'} />
              </Button>
              <Button
                size={'sm'}
                className="cursor-pointer w-10"
                variant={'destructive'}
                onClick={async () => {
                  await deleteMutateAsync(row.original.id);
                }}
              >
                <Icon icon={'fluent-mdl2:erase-tool'} />
              </Button>
            </ButtonGroup>
          </div>
        );
      },
    },
  ];

  return columns;
};
