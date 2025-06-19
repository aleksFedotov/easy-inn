'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import axios from 'axios';
import { RoomType, Room } from '@/lib/types';

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  SortingState,
  getSortedRowModel,
} from "@tanstack/react-table";

import { MoreHorizontal,  Plus, Edit, Trash2, Loader2, ArrowUpDown } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import RoomForm from '@/components/forms/RoomForm';
import RoomTypeForm from '@/components/forms/RoomTypeForm';
import ConfirmationDialog from '@/components/ConfirmationDialog';

// Определение колонок для RoomType с использованием ColumnDef
export const getRoomTypeColumns = (
  handleEdit: (roomType: RoomType) => void,
  handleDeleteClick: (id: number, name: string) => void,
  isActionDisabled: (id: number) => boolean,
  // sorting: SortingState,
  // setSorting: React.Dispatch<React.SetStateAction<SortingState>>
): ColumnDef<RoomType>[] => [
  {
    accessorKey: 'name',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Название
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => <div className="font-medium">{row.getValue('name')}</div>,
  },
  {
    accessorKey: 'capacity',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Вместимость
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
  },
  {
    accessorKey: 'default_prepared_guests', //
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Стандартное кол-во гостей
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => row.getValue('default_prepared_guests'), 
  },
  {
    accessorKey: 'description',
    header: 'Описание',
    cell: ({ row }) => row.getValue('description') || <span className="text-muted-foreground">Нет описания</span>,
  },
  {
    id: 'actions',
    header: () => <div className="text-right">Действия</div>,
    cell: ({ row }) => {
      const roomType = row.original;
      return (
        <div className="text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0" disabled={isActionDisabled(roomType.id)}>
                <span className="sr-only">Открыть меню</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Действия</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => handleEdit(roomType)}>
                <Edit className="mr-2 h-4 w-4" />
                Редактировать
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => handleDeleteClick(roomType.id, roomType.name)}
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

// Определение колонок для Room с использованием ColumnDef
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

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  noResultsMessage?: string;
}

function DataTable<TData, TValue>({
  columns,
  data,
  noResultsMessage = "Данные не найдены."
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
    },
  });

  return (
    <div className="rounded-md border">
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
          {table.getRowModel().rows?.length ? (
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
                {noResultsMessage}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}


export default function RoomSetupPage() {
  const { user, isLoading: isAuthLoading } = useAuth();

  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);

  const [isLoadingData, setIsLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isRoomTypeSheetOpen, setIsRoomTypeSheetOpen] = useState(false);
  const [roomTypeToEdit, setRoomTypeToEdit] = useState<RoomType | undefined>(undefined);
  const [isRoomSheetOpen, setIsRoomSheetOpen] = useState(false);
  const [roomToEdit, setRoomToEdit] = useState<Room | undefined>(undefined);

  const [isRoomTypeConfirmOpen, setIsRoomTypeConfirmOpen] = useState(false);
  const [roomTypeToDeleteId, setRoomTypeToDeleteId] = useState<number | null>(null);
  const [roomTypeToDeleteName, setRoomTypeToDeleteName] = useState<string | null>(null);

  const [isRoomConfirmOpen, setIsRoomConfirmOpen] = useState(false);
  const [roomToDeleteId, setRoomToDeleteId] = useState<number | null>(null);
  const [roomToDeleteNumber, setRoomToDeleteNumber] = useState<string | null>(null);

  const [deletingRoomTypeId, setDeletingRoomTypeId] = useState<number | null>(null);
  const [deletingRoomId, setDeletingRoomId] = useState<number | null>(null);
  
  // const [roomTypeSorting, setRoomTypeSorting] = useState<SortingState>([]);
  // const [roomSorting, setRoomSorting] = useState<SortingState>([]);


  const fetchRoomTypes = useCallback(async () => {
    setError(null);
    try {
      const response = await api.get<{results?: RoomType[], data?: RoomType[]}>('/api/room-types/', { params: { all: true } });
      // Handle both paginated (results) and non-paginated (direct array) responses
      const data = response.data.results || response.data;
      setRoomTypes(Array.isArray(data) ? data : []);
     
    } catch (err) {
      console.error('Error fetching room types:', err);
      const errorMsg = axios.isAxiosError(err) && err.response?.data?.detail
        ? String(err.response.data.detail) // Ensure it's a string
        : 'Ошибка при загрузке типов номеров.';
      setError(errorMsg);
    }
  }, []);

  const fetchRooms = useCallback(async () => {
    setError(null);
    try {
      const response = await api.get<{results?: Room[], data?: Room[]}>('/api/rooms/', { params: { all: true } });
      const data = response.data.results || response.data;
      setRooms(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching rooms:', err);
      const errorMsg = axios.isAxiosError(err) && err.response?.data?.detail
        ? String(err.response.data.detail)
        : 'Ошибка при загрузке списка номеров.';
      setError(errorMsg);
    }
  }, []);

  useEffect(() => {
    if (!isAuthLoading) {
      if (user?.role === 'manager') {
        setIsLoadingData(true);
        setError(null);
        Promise.all([fetchRoomTypes(), fetchRooms()])
          .catch(err => console.error("Error during parallel data fetching:", err))
          .finally(() => setIsLoadingData(false));
      } else {
        setIsLoadingData(false);
        setError('У вас нет прав для просмотра этой страницы. Доступно только менеджерам.');
      }

      
    }
  }, [user, isAuthLoading, fetchRoomTypes, fetchRooms]);

  const handleCreateRoomType = () => {
    setRoomTypeToEdit(undefined);
    setIsRoomTypeSheetOpen(true);
  };

  const handleEditRoomType = (roomType: RoomType) => {
    setRoomTypeToEdit(roomType);
    setIsRoomTypeSheetOpen(true);
  };

  const handleRoomTypeFormSuccess = () => {
    setIsRoomTypeSheetOpen(false);
    fetchRoomTypes();
    fetchRooms();
  };

  const handleDeleteRoomTypeClick = (id: number, name: string) => {
    if (deletingRoomTypeId || deletingRoomId || isRoomTypeSheetOpen || isRoomSheetOpen) return;
    setRoomTypeToDeleteId(id);
    setRoomTypeToDeleteName(name);
    setIsRoomTypeConfirmOpen(true);
  };

  const handleDeleteRoomTypeConfirm = async () => {
    if (roomTypeToDeleteId === null) return;
    setDeletingRoomTypeId(roomTypeToDeleteId);
    setError(null);
    try {
      await api.delete(`/api/room-types/${roomTypeToDeleteId}/`);
      fetchRoomTypes();
      fetchRooms();
    } catch (err) {
      console.error(`Error deleting room type with ID ${roomTypeToDeleteId}:`, err);
      const errorMsg = axios.isAxiosError(err) && err.response?.data?.detail
        ? String(err.response.data.detail)
        : 'Ошибка при удалении типа номера.';
      setError(errorMsg);
    } finally {
      setRoomTypeToDeleteId(null);
      setRoomTypeToDeleteName(null);
      setDeletingRoomTypeId(null);
      setIsRoomTypeConfirmOpen(false);
    }
  };

  const handleCreateRoom = () => {
    setRoomToEdit(undefined);
    setIsRoomSheetOpen(true);
  };

  const handleEditRoom = (room: Room) => {
    setRoomToEdit(room);
    setIsRoomSheetOpen(true);
  };

  const handleRoomFormSuccess = () => {
    setIsRoomSheetOpen(false);
    fetchRooms();
  };

  const handleDeleteRoomClick = (id: number, number: string) => {
    if (deletingRoomTypeId || deletingRoomId || isRoomTypeSheetOpen || isRoomSheetOpen) return;
    setRoomToDeleteId(id);
    setRoomToDeleteNumber(number);
    setIsRoomConfirmOpen(true);
  };

  const handleDeleteRoomConfirm = async () => {
    if (roomToDeleteId === null) return;
    setDeletingRoomId(roomToDeleteId);
    setError(null);
    try {
      await api.delete(`/api/rooms/${roomToDeleteId}/`);
      fetchRooms();
    } catch (err) {
      console.error(`Error deleting room with ID ${roomToDeleteId}:`, err);
      const errorMsg = axios.isAxiosError(err) && err.response?.data?.detail
        ? String(err.response.data.detail)
        : 'Ошибка при удалении номера.';
      setError(errorMsg);
    } finally {
      setRoomToDeleteId(null);
      setRoomToDeleteNumber(null);
      setDeletingRoomId(null);
      setIsRoomConfirmOpen(false);
    }
  };

  const isActionDisabled = (id: number | null) => !!deletingRoomTypeId || !!deletingRoomId || isRoomTypeSheetOpen || isRoomSheetOpen;

  const roomTypeTableColumns = useMemo(
    () => getRoomTypeColumns(
        handleEditRoomType,
        handleDeleteRoomTypeClick, 
        (id) => isActionDisabled(id) || deletingRoomTypeId === id, 
        // roomTypeSorting, 
        // setRoomTypeSorting
      ),
    [
      deletingRoomTypeId, 
      deletingRoomId, 
      isRoomTypeSheetOpen, 
      isRoomSheetOpen,
      //  roomTypeSorting
      ]
  );
  const roomTableColumns = useMemo(
    () => getRoomColumns(
      handleEditRoom, 
      handleDeleteRoomClick, 
      (id) => isActionDisabled(id) || deletingRoomId === id, 
      // roomSorting, 
      // setRoomSorting
    ),
    [
      deletingRoomTypeId, 
      deletingRoomId, 
      isRoomTypeSheetOpen,
      isRoomSheetOpen, 
      // roomSorting
    ]
  );


  if (isAuthLoading || (user?.role === 'manager' && isLoadingData && !error)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!user || user.role !== 'manager') {
    return (
      <div className="container mx-auto p-4 flex items-center justify-center min-h-[calc(100vh-150px)]">
        <Alert variant="destructive" className="max-w-md">
          <AlertTitle>Ошибка доступа</AlertTitle>
          <AlertDescription>
            У вас нет прав для просмотра этой страницы. Доступно только менеджерам.
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  
  if (error && !isRoomTypeSheetOpen && !isRoomSheetOpen && !deletingRoomTypeId && !deletingRoomId) {
    return (
      <div className="container mx-auto p-4 flex items-center justify-center min-h-[calc(100vh-150px)]">
        <Alert variant="destructive" className="max-w-md">
          <AlertTitle>Ошибка загрузки данных</AlertTitle>
          <AlertDescription>
            {error}
            <Button 
              onClick={() => {
                setIsLoadingData(true);
                Promise.all([fetchRoomTypes(), fetchRooms()])
                  .catch(err => console.error("Error during retry fetch:", err))
                  .finally(() => setIsLoadingData(false));
              }} 
              variant="outline" 
              className="mt-4"
              disabled={isLoadingData}
            >
              {isLoadingData && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Повторить
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-8">
      <h1 className="text-3xl font-bold tracking-tight">Настройка комнат и типов</h1>

      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">Типы номеров</h2>
          <Button onClick={handleCreateRoomType}>
            <Plus className="mr-2 h-4 w-4" /> Создать тип номера
          </Button>
        </div>
        <DataTable columns={roomTypeTableColumns} data={roomTypes} noResultsMessage="Типы номеров не найдены."/>
      </section>

      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">Номера</h2>
           <Button onClick={handleCreateRoom}>
            <Plus className="mr-2 h-4 w-4" /> Создать номер
          </Button>
        </div>
        <DataTable columns={roomTableColumns} data={rooms} noResultsMessage="Номера не найдены."/>
      </section>

      <Sheet open={isRoomTypeSheetOpen} onOpenChange={setIsRoomTypeSheetOpen}>
        <SheetContent className="sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>{roomTypeToEdit ? 'Редактировать тип номера' : 'Создать тип номера'}</SheetTitle>
            <SheetDescription>
              {roomTypeToEdit ? 'Внесите изменения в существующий тип номера.' : 'Заполните информацию для создания нового типа номера.'}
            </SheetDescription>
          </SheetHeader>
          <RoomTypeForm
            roomTypeToEdit={roomTypeToEdit}
            onSuccess={handleRoomTypeFormSuccess}
            onCancel={() => setIsRoomTypeSheetOpen(false)}
          />
        </SheetContent>
      </Sheet>

      <Sheet open={isRoomSheetOpen} onOpenChange={setIsRoomSheetOpen}>
        <SheetContent className="sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>{roomToEdit ? 'Редактировать номер' : 'Создать номер'}</SheetTitle>
            <SheetDescription>
             {roomToEdit ? 'Внесите изменения в существующий номер.' : 'Заполните информацию для создания нового номера.'}
            </SheetDescription>
          </SheetHeader>
          <RoomForm
            roomToEdit={roomToEdit}
            availableRoomTypes={roomTypes}
            onSuccess={handleRoomFormSuccess}
            onCancel={() => setIsRoomSheetOpen(false)}
          />
        </SheetContent>
      </Sheet>

      <ConfirmationDialog
        isOpen={isRoomTypeConfirmOpen}
        onClose={() => setIsRoomTypeConfirmOpen(false)}
        onConfirm={handleDeleteRoomTypeConfirm}
        message={`Вы уверены, что хотите удалить тип номера "${roomTypeToDeleteName || ''}"? Это действие не может быть отменено.`}
        title="Подтверждение удаления типа номера"
        isLoading={!!deletingRoomTypeId}
        confirmButtonVariant="destructive"
      />

      <ConfirmationDialog
        isOpen={isRoomConfirmOpen}
        onClose={() => setIsRoomConfirmOpen(false)}
        onConfirm={handleDeleteRoomConfirm}
        message={`Вы уверены, что хотите удалить номер "${roomToDeleteNumber || ''}"? Это действие не может быть отменено.`}
        title="Подтверждение удаления номера"
        isLoading={!!deletingRoomId}
        confirmButtonVariant="destructive"
      />
    </div>
  );
}
