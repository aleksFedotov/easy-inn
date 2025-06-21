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

import { Plus,Loader2 } from 'lucide-react';

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
import { getRoomTypeColumns } from '@/components/room-setup/roomTypeColumns';
import { getRoomColumns } from '@/components/room-setup/roomColumns';



// Определение колонок для Room с использованием ColumnDef


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

  const handleDeleteRoomTypeClick = useCallback((id: number, name: string) => {
    if (deletingRoomTypeId || deletingRoomId || isRoomTypeSheetOpen || isRoomSheetOpen) return;
    setRoomTypeToDeleteId(id);
    setRoomTypeToDeleteName(name);
    setIsRoomTypeConfirmOpen(true);
  }, [deletingRoomTypeId, deletingRoomId, isRoomTypeSheetOpen, isRoomSheetOpen]);

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

  const handleDeleteRoomClick = useCallback((id: number, number: string) => {
    if (deletingRoomTypeId || deletingRoomId || isRoomTypeSheetOpen || isRoomSheetOpen) return;
    setRoomToDeleteId(id);
    setRoomToDeleteNumber(number);
    setIsRoomConfirmOpen(true);
  }, [deletingRoomTypeId, deletingRoomId, isRoomTypeSheetOpen, isRoomSheetOpen]);

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

  const isActionDisabled = useCallback(
    (id: number | null) =>
      !!deletingRoomTypeId ||
      !!deletingRoomId ||
      isRoomTypeSheetOpen ||
      isRoomSheetOpen ||
      id === deletingRoomTypeId ||
      id === deletingRoomId,
    [deletingRoomTypeId, deletingRoomId, isRoomTypeSheetOpen, isRoomSheetOpen]
  );

  const roomTypeTableColumns = useMemo(
    () => getRoomTypeColumns(
        handleEditRoomType,
        handleDeleteRoomTypeClick, 
        (id) => isActionDisabled(id) || deletingRoomTypeId === id, 
        // roomTypeSorting, 
        // setRoomTypeSorting
      ),
    [deletingRoomTypeId, handleDeleteRoomTypeClick, isActionDisabled]
  );
  const roomTableColumns = useMemo(
    () => getRoomColumns(
      handleEditRoom, 
      handleDeleteRoomClick, 
      (id) => isActionDisabled(id) || deletingRoomId === id, 
      // roomSorting, 
      // setRoomSorting
    ),
    [deletingRoomId, handleDeleteRoomClick, isActionDisabled]
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
