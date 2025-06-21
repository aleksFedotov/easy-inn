import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { Room } from '@/lib/types';
import { ColumnDef } from '@tanstack/react-table';
import { Button } from '../ui/button';
import { ArrowUpDown, Edit, MoreHorizontal, Trash2 } from 'lucide-react';


export const getRoomColumns = (
  handleEdit: (room: Room) => void,
  handleDeleteClick: (id: number, number: string) => void,
  isActionDisabled: (id: number) => boolean,
  // sorting: SortingState,
  // setSorting: React.Dispatch<React.SetStateAction<SortingState>>
): ColumnDef<Room>[] => [
  {
    accessorKey: 'number',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Номер
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => <div className="font-medium">{row.getValue('number')}</div>,
  },
  {
    accessorKey: 'floor',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Этаж
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
  },
  {
    accessorKey: 'room_type_name',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Тип номера
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => row.getValue('room_type_name') || <span className="text-muted-foreground">N/A</span>,
  },
  {
    accessorKey: 'status_display',
    header: 'Статус',
  },
  {
    accessorKey: 'is_active',
    header: 'Активен',
    cell: ({ row }) => (row.getValue('is_active') ? 'Да' : 'Нет'),
  },
  {
    accessorKey: 'notes',
    header: 'Заметки',
    cell: ({ row }) => row.getValue('notes') || <span className="text-muted-foreground">Нет заметок</span>,
  },
  {
    id: 'actions',
    header: () => <div className="text-right">Действия</div>,
    cell: ({ row }) => {
      const room = row.original;
      return (
        <div className="text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0" disabled={isActionDisabled(room.id)}>
                <span className="sr-only">Открыть меню</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Действия</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => handleEdit(room)}>
                <Edit className="mr-2 h-4 w-4" />
                Редактировать
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => handleDeleteClick(room.id, room.number)}
                className="text-red-600 focus:text-red-700 focus:bg-red-50"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Удалить
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
];