import type { ColumnDef } from '@tanstack/react-table';
import type { StyleListItem, TargetListItem } from '../../core';
import { ButtonGroup } from '@/src/components/ui/button-group';
import { Button } from '@/src/components/ui/button';
import { Icon } from '@iconify/react';
import { Checkbox } from '@/src/components/ui/checkbox';
import { cn } from '@/src/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/src/components/ui/dropdown-menu';
import { UpdateStyleForm } from '../style-form';

interface GetTableColumnsProps {
  setDefaultMutateAsync: (args: { code: string; styleId: string }) => Promise<unknown>;
  deleteMutateAsync: (styleId: string) => Promise<unknown>;
  type: 'bible' | 'music';
  targets: TargetListItem[];
  isMobile: boolean;
}

export const GetTableColumns = ({
  setDefaultMutateAsync,
  deleteMutateAsync,
  type,
  targets,
  isMobile,
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
        return isMobile ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <Icon icon="lucide:more-horizontal" className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
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
                  className="mr-2 h-4 w-4"
                />
                Set as Default
              </DropdownMenuItem>
              <UpdateStyleForm
                triggerButton={
                  <DropdownMenuItem
                    onSelect={(e) => {
                      e.preventDefault();
                    }}
                  >
                    <Icon icon={'tabler:edit'} className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                }
                type={type}
                targets={targets}
                styleId={row.original.id}
              />
              <DropdownMenuItem
                className="text-red-600 focus:text-red-600"
                onClick={() => {
                  void deleteMutateAsync(row.original.id);
                }}
              >
                <Icon icon={'fluent-mdl2:erase-tool'} className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <div className="flex gap-2">
            <Button
              size={'sm'}
              className={cn(
                'cursor-pointer w-10 transition-all duration-300 ease-in-out',
                !row.original.isActive && 'opacity-0 hover:opacity-100',
              )}
              variant={'ghost'}
              onClick={async () => {
                void setDefaultMutateAsync({
                  code: row.original.type,
                  styleId: row.original.id,
                });
              }}
            >
              <Icon icon={'foundation:check'} color={row.original.isActive === true ? 'green' : undefined} />
            </Button>
            <ButtonGroup>
              <UpdateStyleForm
                triggerButton={
                  <Button size={'sm'} className="cursor-pointer w-10">
                    <Icon icon={'tabler:edit'} />
                  </Button>
                }
                type={type}
                targets={targets}
                styleId={row.original.id}
              />
              <Button
                size={'sm'}
                className="cursor-pointer w-10"
                variant={'destructive'}
                onClick={() => {
                  void deleteMutateAsync(row.original.id);
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
