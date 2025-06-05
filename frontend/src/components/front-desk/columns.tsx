import { ColumnDef } from '@tanstack/react-table';
import { Booking } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Eye, Edit, MoreHorizontal, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';


type GetColumnsProps = {
  selectedTab: 'departures' | 'arrivals' | 'stays';
  isDisabledUI: boolean;
  onViewDetails: (id: number) => void;
  onCheckout: (id: number, roomNumber: string) => void;
  onCheckin: (id: number, roomNumber: string) => void;
  onEdit: (booking: Booking) => void;
  onDelete: (booking: Booking) => void;
};


export const getColumns = ({
  selectedTab,
  isDisabledUI,
  onViewDetails,
  onCheckout,
  onCheckin,
  onEdit,
  onDelete,
}: GetColumnsProps): ColumnDef<Booking>[] => {
  const baseColumns: ColumnDef<Booking>[] = [
    {
      accessorKey: 'room.number',
      header: 'Номер комнаты',
      cell: ({ row }) => row.original.room?.number || 'N/A',
    },
    {
      accessorKey: 'booking_status_display',
      header: 'Статус',
      cell: ({ row }) => row.original.booking_status_display,
    },
  ];


  let contextualColumn: ColumnDef<Booking> | null = null;
  switch (selectedTab) {
    case 'departures':
      contextualColumn = {
        accessorKey: 'check_out',
        header: 'Время выезда',
        cell: ({ row }) => format(new Date(row.original.check_out), 'HH:mm'),
      };
      break;
    case 'arrivals':
      contextualColumn = {
        accessorKey: 'check_in',
        header: 'Время заезда',
        cell: ({ row }) => format(new Date(row.original.check_in), 'HH:mm'),
      };
      break;
    case 'stays':
      contextualColumn = {
        id: 'stayPeriod',
        header: 'Период проживания',
        cell: ({ row }) => `${format(new Date(row.original.check_in), 'dd.MM.yyyy')} - ${format(new Date(row.original.check_out), 'dd.MM.yyyy')}`,
      };
      break;
  }
  
  const actionColumn: ColumnDef<Booking> = {
    id: 'actions',
    header: 'Действия',
    cell: ({ row }) => {
      const booking = row.original;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0" disabled={isDisabledUI}>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onViewDetails(booking.id)}>
                <Eye className="mr-2 h-4 w-4" />
                Детали
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {selectedTab === 'departures' && booking.booking_status_display !== 'Выехал' && booking.booking_status_display !== 'Отменено' && (
                <DropdownMenuItem onClick={() => onCheckout(booking.id, booking.room?.number || 'N/A')}>
                    <CheckCircle className="mr-2 h-4 w-4" /> Выезд
                </DropdownMenuItem>
            )}
            {selectedTab === 'arrivals' && booking.booking_status_display !== 'Заехал' && booking.booking_status_display !== 'Отменено' && (
                <DropdownMenuItem onClick={() => onCheckin(booking.id, booking.room?.number || 'N/A')}>
                    <CheckCircle className="mr-2 h-4 w-4" /> Заезд
                </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => onEdit(booking)}>
                <Edit className="mr-2 h-4 w-4" />
                Редактировать
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDelete(booking)}>
                <XCircle className="mr-2 h-4 w-4" /> 
                Удалить бронирование
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  };


  return [
    baseColumns[0], // Номер комнаты
    ...(contextualColumn ? [contextualColumn] : []), // Контекстная колонка
    baseColumns[1], // Статус
    actionColumn,   // Действия
  ];
};