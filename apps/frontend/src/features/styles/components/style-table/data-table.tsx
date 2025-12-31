import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/src/components/ui/table';
import type { Table as TableCore } from '@tanstack/table-core';
import { cn } from '@/src/lib/utils';

import { flexRender, getCoreRowModel, useReactTable, type ColumnDef } from '@tanstack/react-table';
import { Skeleton } from '@/src/components/ui/skeleton';

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  isLoading?: boolean;
}
export const DataTable = <TData, TValue>({ columns, data, isLoading }: DataTableProps<TData, TValue>) => {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="overflow-hidden rounded-md border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => {
            return (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header, index) => {
                  const isFirst = index === 0 ? 'w-12' : undefined;
                  const isSecound = index === 1 ? 'w-24' : undefined;
                  const isLast = index === headerGroup.headers.length - 1 ? 'w-[100px] text-center' : undefined;
                  return (
                    <TableHead
                      key={header.id}
                      className={cn(isFirst, isSecound, isLast)} // Fix the last one
                    >
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  );
                })}
              </TableRow>
            );
          })}
        </TableHeader>
        <TableBody>
          <Rows columns={columns} table={table} isLoading={isLoading} />
        </TableBody>
      </Table>
    </div>
  );
};

const Rows = <TData, TValue>({
  table,
  columns,
  isLoading,
}: { isLoading?: boolean; table: TableCore<TData>; columns: ColumnDef<TData, TValue>[] }) => {
  if (isLoading) {
    return [...Array(6)].map((_, index) => (
      <TableRow key={index}>
        {columns.map((_, colIndex) => (
          <TableCell key={colIndex}>
            <Skeleton className="h-8" />
          </TableCell>
        ))}
      </TableRow>
    ));
  }

  if (table.getRowModel().rows?.length === 0 && !isLoading) {
    return (
      <TableRow>
        <TableCell colSpan={columns.length} className="h-48 text-center">
          No results.
        </TableCell>
      </TableRow>
    );
  }

  return table.getRowModel().rows.map((row) => (
    <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
      {row.getVisibleCells().map((cell, index, array) => {
        const isFirst = index === 0;
        const isLast = index === array.length - 1;

        return (
          <TableCell
            key={cell.id}
            className={cn(isFirst && 'w-12 flex justify-start', isLast && 'w-[100px] flex justify-end')} // Match the header width
          >
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
          </TableCell>
        );
      })}
    </TableRow>
  ));
};
