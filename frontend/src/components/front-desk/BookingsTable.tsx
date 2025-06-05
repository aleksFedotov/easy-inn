import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  ColumnDef,
} from '@tanstack/react-table';
import { ChevronLeft, ChevronRight } from 'lucide-react'; 
import { Booking } from '@/lib/types'; 
import { Spinner } from '@/components/spinner'; 

interface BookingsTableProps {
  data: Booking[];
  columns: ColumnDef<Booking>[];
  isLoading: boolean;
  selectedTab: 'departures' | 'arrivals' | 'stays';
  pagination: {
    count: number;
    currentPage: number;
    pageSize: number;
  };
  onPageChange: (tab: 'departures' | 'arrivals' | 'stays', newPage: number) => void;
  isPerformingAction: boolean;
}

const BookingsTable: React.FC<BookingsTableProps> = ({
  data,
  columns,
  isLoading,
  selectedTab,
  pagination,
  onPageChange,
  isPerformingAction,
}) => {
  const table = useReactTable({
    data: data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    rowCount: pagination.count,
    state: {
      pagination: {
        pageIndex: pagination.currentPage - 1,
        pageSize: pagination.pageSize,
      },
    },
    onPaginationChange: (updater) => {
      const newPaginationState = typeof updater === 'function' ? updater({ pageIndex: pagination.currentPage - 1, pageSize: pagination.pageSize }) : updater;
      onPageChange(selectedTab, newPaginationState.pageIndex + 1);
    },
  });

  const totalPages = Math.ceil(pagination.count / pagination.pageSize);

  const getTableTitle = () => {
    if (selectedTab === 'departures') return 'Сегодняшние выезды';
    if (selectedTab === 'arrivals') return 'Сегодняшние заезды';
    return 'Проживающие';
  };

  const getNoDataMessage = () => {
    if (selectedTab === 'departures') return 'Нет выездов на выбранную дату.';
    if (selectedTab === 'arrivals') return 'Нет заездов на выбранную дату.';
    return 'Нет проживающих на выбранную дату.';
  };

  return (
    <div className=" shadow-md rounded-lg overflow-hidden">
      <div className="text-xl font-bold p-4 border-b">
        {getTableTitle()}
        {pagination.count > 0 && (
          <span className="ml-2 text-sm font-normal">({pagination.count} всего)</span>
        )}
      </div>

      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                return (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {isLoading || isPerformingAction ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                <Spinner className="animate-spin h-8 w-8 text-primary" /> 
              </TableCell>
            </TableRow>
          ) : (
            table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  {getNoDataMessage()}
                </TableCell>
              </TableRow>
            )
          )}
        </TableBody>
      </Table>

      {pagination.count > 0 && !isLoading && !isPerformingAction && (
        <div className="flex justify-center items-center space-x-4 p-4 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage() || isPerformingAction}
          >
            <ChevronLeft size={18}/> Предыдущая
          </Button>

          <span className="text-sm">
            Страница {pagination.currentPage} из {totalPages}
          </span>

          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage() || isPerformingAction}
          >
            Следующая <ChevronRight size={18}/>
          </Button>
        </div>
      )}
    </div>
  );
};

export default React.memo(BookingsTable);