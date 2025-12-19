import type { ColumnDef } from '@tanstack/react-table';
import type { StyleListItem } from '../../core';
import { ButtonGroup } from '@/src/components/ui/button-group';
import { Button } from '@/src/components/ui/button';
import { Icon } from '@iconify/react';
import { Checkbox } from '@/src/components/ui/checkbox';
export const columns: ColumnDef<StyleListItem>[] = [
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
  },
  {
    accessorKey: 'name',
    header: 'Nome',
  },
  {
    header: 'Ações',
    size: 100,
    enableResizing: false,
    cell: () => (
      <ButtonGroup>
        <Button size={'sm'} className="cursor-pointer w-10">
          <Icon icon={'tabler:edit'} />
        </Button>
        <Button size={'sm'} className="cursor-pointer w-10" variant={'destructive'}>
          <Icon icon={'fluent-mdl2:erase-tool'} />
        </Button>
      </ButtonGroup>
    ),
  },
];
