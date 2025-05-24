'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useAuth } from '@/lib/AuthContext';
import api from '@/lib/api';
import axios from 'axios';
import { Zone, CleaningType, ChecklistTemplate  } from '@/lib/types'; 

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  SortingState,
  getSortedRowModel,
} from "@tanstack/react-table";

import { MoreHorizontal, Plus, Edit, Trash2, Loader2, ArrowUpDown } from 'lucide-react';

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



import ZoneForm from '@/components/forms/ZoneForm'; 
import CleaningTypeForm from '@/components/forms/CleaningTypeForm'; 
import ChecklistTemplateForm from '@/components/forms/ChecklistTemplateForm'; 
import ConfirmationDialog from '@/components/ConfirmationDialog'; 


interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  noResultsMessage?: string;
  // Добавляем опциональные sorting state и setter, если хотим управлять сортировкой извне
  // или если у нас несколько таблиц на странице с независимой сортировкой
  externalSorting?: [SortingState, React.Dispatch<React.SetStateAction<SortingState>>];
}

function DataTable<TData, TValue>({
  columns,
  data,
  noResultsMessage = "Данные не найдены.",
  externalSorting
}: DataTableProps<TData, TValue>) {
  // Если externalSorting не предоставлен, используем локальное состояние
  const [internalSorting, setInternalSorting] = useState<SortingState>([]);
  const sorting = externalSorting ? externalSorting[0] : internalSorting;
  const setSorting = externalSorting ? externalSorting[1] : setInternalSorting;

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
                  <TableHead key={header.id} style={{ width: header.getSize() !== 150 ? `${header.getSize()}px` : undefined }}>
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
                  <TableCell key={cell.id} style={{ width: cell.column.getSize() !== 150 ? `${cell.column.getSize()}px` : undefined }}>
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


// --- Column Definitions ---

// Зоны (Zones)
export const getZoneColumns = (
  handleEdit: (zone: Zone) => void,
  handleDeleteClick: (id: number, name: string) => void,
  isActionDisabled: (id: number) => boolean
): ColumnDef<Zone>[] => [
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Название <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <div className="font-medium">{row.getValue('name')}</div>,
    size: 200,
  },
  {
    accessorKey: 'floor',
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Этаж <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => row.getValue('floor') || <span className="text-muted-foreground">N/A</span>,
    size: 100,
  },
  {
    accessorKey: 'description',
    header: 'Описание',
    cell: ({ row }) => row.getValue('description') || <span className="text-muted-foreground">Нет описания</span>,
    size: 300,
  },
  {
    id: 'actions',
    header: () => <div className="text-right">Действия</div>,
    cell: ({ row }) => {
      const zone = row.original;
      return (
        <div className="text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0" disabled={isActionDisabled(zone.id)}>
                <span className="sr-only">Открыть меню</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Действия</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => handleEdit(zone)}>
                <Edit className="mr-2 h-4 w-4" /> Редактировать
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => handleDeleteClick(zone.id, zone.name)}
                className="text-red-600 focus:text-red-700 focus:bg-red-50"
              >
                <Trash2 className="mr-2 h-4 w-4" /> Удалить
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
    size: 80,
  },
];

// Типы уборок (Cleaning Types)
export const getCleaningTypeColumns = (
  handleEdit: (cleaningType: CleaningType) => void,
  handleDeleteClick: (id: number, name: string) => void,
  isActionDisabled: (id: number) => boolean
): ColumnDef<CleaningType>[] => [
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Название <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <div className="font-medium">{row.getValue('name')}</div>,
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
      const cleaningType = row.original;
      return (
        <div className="text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0" disabled={isActionDisabled(cleaningType.id)}>
                <span className="sr-only">Открыть меню</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Действия</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => handleEdit(cleaningType)}>
                <Edit className="mr-2 h-4 w-4" /> Редактировать
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => handleDeleteClick(cleaningType.id, cleaningType.name)}
                className="text-red-600 focus:text-red-700 focus:bg-red-50"
              >
                <Trash2 className="mr-2 h-4 w-4" /> Удалить
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
];

// Шаблоны чек-листов (Checklist Templates)
export const getChecklistTemplateColumns = (
  handleEdit: (template: ChecklistTemplate) => void,
  handleDeleteClick: (id: number, name: string) => void,
  isActionDisabled: (id: number) => boolean
): ColumnDef<ChecklistTemplate>[] => [
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Название <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <div className="font-medium">{row.getValue('name')}</div>,
  },
  {
    accessorKey: 'cleaning_type_name', // Предполагаем, что это поле приходит с бэкенда
    header: 'Тип уборки',
    cell: ({ row }) => row.original.cleaning_type_name || <span className="text-muted-foreground">N/A</span>,
  },
  {
    accessorKey: 'description',
    header: 'Описание',
    cell: ({ row }) => row.getValue('description') || <span className="text-muted-foreground">Нет описания</span>,
  },
  {
    accessorKey: 'items',
    header: 'Кол-во пунктов',
    cell: ({ row }) => row.original.items?.length || 0,
  },
  {
    id: 'actions',
    header: () => <div className="text-right">Действия</div>,
    cell: ({ row }) => {
      const template = row.original;
      return (
        <div className="text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0" disabled={isActionDisabled(template.id)}>
                <span className="sr-only">Открыть меню</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Действия</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => handleEdit(template)}>
                <Edit className="mr-2 h-4 w-4" /> Редактировать
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => handleDeleteClick(template.id, template.name)}
                className="text-red-600 focus:text-red-700 focus:bg-red-50"
              >
                <Trash2 className="mr-2 h-4 w-4" /> Удалить
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
];


export default function CleaningSetupPage() {
  const { user, isLoading: isAuthLoading } = useAuth();

  const [zones, setZones] = useState<Zone[]>([]);
  const [cleaningTypes, setCleaningTypes] = useState<CleaningType[]>([]);
  const [checklistTemplates, setChecklistTemplates] = useState<ChecklistTemplate[]>([]);

  const [isLoadingData, setIsLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Состояния для Sheet (Зоны)
  const [isZoneSheetOpen, setIsZoneSheetOpen] = useState(false);
  const [zoneToEdit, setZoneToEdit] = useState<Zone | undefined>(undefined);
  const [isZoneConfirmOpen, setIsZoneConfirmOpen] = useState(false);
  const [zoneToDeleteId, setZoneToDeleteId] = useState<number | null>(null);
  const [zoneToDeleteName, setZoneToDeleteName] = useState<string | null>(null);
  const [deletingZoneId, setDeletingZoneId] = useState<number | null>(null);
  const [zoneSorting, setZoneSorting] = useState<SortingState>([]);


  // Состояния для Sheet (Типы уборок)
  const [isCleaningTypeSheetOpen, setIsCleaningTypeSheetOpen] = useState(false);
  const [cleaningTypeToEdit, setCleaningTypeToEdit] = useState<CleaningType | undefined>(undefined);
  const [isCleaningTypeConfirmOpen, setIsCleaningTypeConfirmOpen] = useState(false);
  const [cleaningTypeToDeleteId, setCleaningTypeToDeleteId] = useState<number | null>(null);
  const [cleaningTypeToDeleteName, setCleaningTypeToDeleteName] = useState<string | null>(null);
  const [deletingCleaningTypeId, setDeletingCleaningTypeId] = useState<number | null>(null);
  const [cleaningTypeSorting, setCleaningTypeSorting] = useState<SortingState>([]);

  // Состояния для Sheet (Шаблоны чек-листов)
  const [isChecklistTemplateSheetOpen, setIsChecklistTemplateSheetOpen] = useState(false);
  const [checklistTemplateToEdit, setChecklistTemplateToEdit] = useState<ChecklistTemplate | undefined>(undefined);
  const [isChecklistTemplateConfirmOpen, setIsChecklistTemplateConfirmOpen] = useState(false);
  const [checklistTemplateToDeleteId, setChecklistTemplateToDeleteId] = useState<number | null>(null);
  const [checklistTemplateToDeleteName, setChecklistTemplateToDeleteName] = useState<string | null>(null);
  const [deletingChecklistTemplateId, setDeletingChecklistTemplateId] = useState<number | null>(null);
  const [checklistTemplateSorting, setChecklistTemplateSorting] = useState<SortingState>([]);


  const fetchData = useCallback(async () => {
    setIsLoadingData(true);
    setError(null);
    try {
      const [zonesRes, cleaningTypesRes, checklistTemplatesRes] = await Promise.all([
        api.get<{results?: Zone[], data?: Zone[]}>('/api/zones/', { params: { all: true } }),
        api.get<{results?: CleaningType[], data?: CleaningType[]}>('/api/cleaningtypes/', { params: { all: true } }),
        api.get<{results?: ChecklistTemplate[], data?: ChecklistTemplate[]}>('/api/checklisttemplates/', { params: { all: true } }),
      ]);
      
      setZones(Array.isArray(zonesRes.data.results || zonesRes.data) ? (zonesRes.data.results || zonesRes.data) : []);
      setCleaningTypes(Array.isArray(cleaningTypesRes.data.results || cleaningTypesRes.data) ? (cleaningTypesRes.data.results || cleaningTypesRes.data) : []);
      setChecklistTemplates(Array.isArray(checklistTemplatesRes.data.results || checklistTemplatesRes.data) ? (checklistTemplatesRes.data.results || checklistTemplatesRes.data) : []);

    } catch (err) {
      console.error('Error fetching cleaning setup data:', err);
      const errorMsg = axios.isAxiosError(err) && err.response?.data?.detail
        ? String(err.response.data.detail)
        : 'Ошибка при загрузке данных для настройки уборки.';
      setError(errorMsg);
    } finally {
      setIsLoadingData(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthLoading && user?.role === 'manager') {
      fetchData();
    } else if (!isAuthLoading && user?.role !== 'manager') {
      setIsLoadingData(false);
      setError('У вас нет прав для просмотра этой страницы. Доступно только менеджерам.');
    }
  }, [user, isAuthLoading, fetchData]);

  // --- Обработчики для Зон ---
  const handleCreateZone = () => {
    setZoneToEdit(undefined);
    setIsZoneSheetOpen(true);
  };
  const handleEditZone = (zone: Zone) => {
    setZoneToEdit(zone);
    setIsZoneSheetOpen(true);
  };
  const handleZoneFormSuccess = () => {
    setIsZoneSheetOpen(false);
    fetchData(); // Перезагружаем все данные
  };
  const handleDeleteZoneClick = (id: number, name: string) => {
    if (deletingZoneId || deletingCleaningTypeId || deletingChecklistTemplateId || isZoneSheetOpen || isCleaningTypeSheetOpen || isChecklistTemplateSheetOpen) return;
    setZoneToDeleteId(id);
    setZoneToDeleteName(name);
    setIsZoneConfirmOpen(true);
  };
  const handleDeleteZoneConfirm = async () => {
    if (zoneToDeleteId === null) return;
    setDeletingZoneId(zoneToDeleteId);
    setError(null);
    try {
      await api.delete(`/api/zones/${zoneToDeleteId}/`);
      fetchData();
    } catch (err) {
      const errorMsg = axios.isAxiosError(err) && err.response?.data?.detail ? String(err.response.data.detail) : 'Ошибка при удалении зоны.';
      setError(errorMsg);
    } finally {
      setZoneToDeleteId(null);
      setZoneToDeleteName(null);
      setDeletingZoneId(null);
      setIsZoneConfirmOpen(false);
    }
  };

  // --- Обработчики для Типов Уборок ---
  const handleCreateCleaningType = () => {
    setCleaningTypeToEdit(undefined);
    setIsCleaningTypeSheetOpen(true);
  };
  const handleEditCleaningType = (cleaningType: CleaningType) => {
    setCleaningTypeToEdit(cleaningType);
    setIsCleaningTypeSheetOpen(true);
  };
  const handleCleaningTypeFormSuccess = () => {
    setIsCleaningTypeSheetOpen(false);
    fetchData();
  };
  const handleDeleteCleaningTypeClick = (id: number, name: string) => {
     if (deletingZoneId || deletingCleaningTypeId || deletingChecklistTemplateId || isZoneSheetOpen || isCleaningTypeSheetOpen || isChecklistTemplateSheetOpen) return;
    setCleaningTypeToDeleteId(id);
    setCleaningTypeToDeleteName(name);
    setIsCleaningTypeConfirmOpen(true);
  };
  const handleDeleteCleaningTypeConfirm = async () => {
    if (cleaningTypeToDeleteId === null) return;
    setDeletingCleaningTypeId(cleaningTypeToDeleteId);
    setError(null);
    try {
      await api.delete(`/api/cleaningtypes/${cleaningTypeToDeleteId}/`);
      fetchData();
    } catch (err)
 {
      const errorMsg = axios.isAxiosError(err) && err.response?.data?.detail ? String(err.response.data.detail) : 'Ошибка при удалении типа уборки.';
      setError(errorMsg);
    } finally {
      setCleaningTypeToDeleteId(null);
      setCleaningTypeToDeleteName(null);
      setDeletingCleaningTypeId(null);
      setIsCleaningTypeConfirmOpen(false);
    }
  };

  // --- Обработчики для Шаблонов Чек-листов ---
  const handleCreateChecklistTemplate = () => {
    setChecklistTemplateToEdit(undefined);
    setIsChecklistTemplateSheetOpen(true);
  };
  const handleEditChecklistTemplate = (template: ChecklistTemplate) => {
    setChecklistTemplateToEdit(template);
    setIsChecklistTemplateSheetOpen(true);
  };
  const handleChecklistTemplateFormSuccess = () => {
    setIsChecklistTemplateSheetOpen(false);
    fetchData();
  };
  const handleDeleteChecklistTemplateClick = (id: number, name: string) => {
    if (deletingZoneId || deletingCleaningTypeId || deletingChecklistTemplateId || isZoneSheetOpen || isCleaningTypeSheetOpen || isChecklistTemplateSheetOpen) return;
    setChecklistTemplateToDeleteId(id);
    setChecklistTemplateToDeleteName(name);
    setIsChecklistTemplateConfirmOpen(true);
  };
  const handleDeleteChecklistTemplateConfirm = async () => {
    if (checklistTemplateToDeleteId === null) return;
    setDeletingChecklistTemplateId(checklistTemplateToDeleteId);
    setError(null);
    try {
      await api.delete(`/api/checklisttemplates/${checklistTemplateToDeleteId}/`);
      fetchData();
    } catch (err) {
      const errorMsg = axios.isAxiosError(err) && err.response?.data?.detail ? String(err.response.data.detail) : 'Ошибка при удалении шаблона чек-листа.';
      setError(errorMsg);
    } finally {
      setChecklistTemplateToDeleteId(null);
      setChecklistTemplateToDeleteName(null);
      setDeletingChecklistTemplateId(null);
      setIsChecklistTemplateConfirmOpen(false);
    }
  };

  const isGlobalActionInProgress = !!deletingZoneId || !!deletingCleaningTypeId || !!deletingChecklistTemplateId || isZoneSheetOpen || isCleaningTypeSheetOpen || isChecklistTemplateSheetOpen;

  const zoneTableColumns = useMemo(
    () => getZoneColumns(handleEditZone, handleDeleteZoneClick, (id) => isGlobalActionInProgress || deletingZoneId === id),
    [isGlobalActionInProgress, deletingZoneId] // Добавляем зависимости, влияющие на isActionDisabled
  );
  const cleaningTypeTableColumns = useMemo(
    () => getCleaningTypeColumns(handleEditCleaningType, handleDeleteCleaningTypeClick, (id) => isGlobalActionInProgress || deletingCleaningTypeId === id),
    [isGlobalActionInProgress, deletingCleaningTypeId]
  );
  const checklistTemplateTableColumns = useMemo(
    () => getChecklistTemplateColumns(handleEditChecklistTemplate, handleDeleteChecklistTemplateClick, (id) => isGlobalActionInProgress || deletingChecklistTemplateId === id),
    [isGlobalActionInProgress, deletingChecklistTemplateId]
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
  
  if (error && !isGlobalActionInProgress) {
    return (
      <div className="container mx-auto p-4 flex items-center justify-center min-h-[calc(100vh-150px)]">
        <Alert variant="destructive" className="max-w-md">
          <AlertTitle>Ошибка загрузки данных</AlertTitle>
          <AlertDescription>
            {error}
            <Button 
              onClick={fetchData} 
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
      <h1 className="text-3xl font-bold tracking-tight">Настройка уборки</h1>

      {/* Секция "Зоны" */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">Зоны</h2>
          <Button onClick={handleCreateZone} disabled={isGlobalActionInProgress}>
            <Plus className="mr-2 h-4 w-4" /> Создать зону
          </Button>
        </div>
        <DataTable 
          columns={zoneTableColumns} 
          data={zones} 
          noResultsMessage="Зоны не найдены."
          externalSorting={[zoneSorting, setZoneSorting]}
        />
      </section>

      {/* Секция "Типы уборок" */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">Типы уборок</h2>
          <Button onClick={handleCreateCleaningType} disabled={isGlobalActionInProgress}>
            <Plus className="mr-2 h-4 w-4" /> Создать тип уборки
          </Button>
        </div>
        <DataTable 
          columns={cleaningTypeTableColumns} 
          data={cleaningTypes} 
          noResultsMessage="Типы уборок не найдены."
          externalSorting={[cleaningTypeSorting, setCleaningTypeSorting]}
        />
      </section>

      {/* Секция "Шаблоны чек-листов" */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">Шаблоны чек-листов</h2>
          <Button onClick={handleCreateChecklistTemplate} disabled={isGlobalActionInProgress}>
            <Plus className="mr-2 h-4 w-4" /> Создать шаблон
          </Button>
        </div>
        <DataTable 
          columns={checklistTemplateTableColumns} 
          data={checklistTemplates} 
          noResultsMessage="Шаблоны чек-листов не найдены."
          externalSorting={[checklistTemplateSorting, setChecklistTemplateSorting]}
        />
      </section>

      {/* Sheet для формы Зоны */}
      <Sheet open={isZoneSheetOpen} onOpenChange={setIsZoneSheetOpen}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{zoneToEdit ? 'Редактировать зону' : 'Создать зону'}</SheetTitle>
            <SheetDescription>
              {zoneToEdit ? 'Внесите изменения в существующую зону.' : 'Заполните информацию для создания новой зоны.'}
            </SheetDescription>
          </SheetHeader>
          <ZoneForm
            zoneToEdit={zoneToEdit}
            onSuccess={handleZoneFormSuccess}
            onCancel={() => setIsZoneSheetOpen(false)}
          />
        </SheetContent>
      </Sheet>

      {/* Sheet для формы Типа Уборки */}
      <Sheet open={isCleaningTypeSheetOpen} onOpenChange={setIsCleaningTypeSheetOpen}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{cleaningTypeToEdit ? 'Редактировать тип уборки' : 'Создать тип уборки'}</SheetTitle>
            <SheetDescription>
              {cleaningTypeToEdit ? 'Внесите изменения в существующий тип уборки.' : 'Заполните информацию для создания нового типа уборки.'}
            </SheetDescription>
          </SheetHeader>
          <CleaningTypeForm
            cleaningTypeToEdit={cleaningTypeToEdit}
            onSuccess={handleCleaningTypeFormSuccess}
            onCancel={() => setIsCleaningTypeSheetOpen(false)}
          />
        </SheetContent>
      </Sheet>

      {/* Sheet для формы Шаблона Чек-листа */}
      <Sheet open={isChecklistTemplateSheetOpen} onOpenChange={setIsChecklistTemplateSheetOpen}>
        <SheetContent className="sm:max-w-lg"> {/* Можно сделать шире для списка пунктов */}
          <SheetHeader>
            <SheetTitle>{checklistTemplateToEdit ? 'Редактировать шаблон чек-листа' : 'Создать шаблон чек-листа'}</SheetTitle>
            <SheetDescription>
              {checklistTemplateToEdit ? 'Внесите изменения в существующий шаблон.' : 'Заполните информацию для создания нового шаблона.'}
            </SheetDescription>
          </SheetHeader>
          <ChecklistTemplateForm
            checklistTemplateToEdit={checklistTemplateToEdit}
            availableCleaningTypes={cleaningTypes} // Передаем доступные типы уборок
            onSuccess={handleChecklistTemplateFormSuccess}
            onCancel={() => setIsChecklistTemplateSheetOpen(false)}
          />
        </SheetContent>
      </Sheet>

      {/* Диалоги подтверждения удаления */}
      <ConfirmationDialog
        isOpen={isZoneConfirmOpen}
        onClose={() => setIsZoneConfirmOpen(false)}
        onConfirm={handleDeleteZoneConfirm}
        message={`Вы уверены, что хотите удалить зону "${zoneToDeleteName || ''}"? Это действие не может быть отменено.`}
        title="Подтверждение удаления зоны"
        isLoading={!!deletingZoneId}
        confirmButtonVariant="destructive"
      />
      <ConfirmationDialog
        isOpen={isCleaningTypeConfirmOpen}
        onClose={() => setIsCleaningTypeConfirmOpen(false)}
        onConfirm={handleDeleteCleaningTypeConfirm}
        message={`Вы уверены, что хотите удалить тип уборки "${cleaningTypeToDeleteName || ''}"? Это действие не может быть отменено.`}
        title="Подтверждение удаления типа уборки"
        isLoading={!!deletingCleaningTypeId}
        confirmButtonVariant="destructive"
      />
      <ConfirmationDialog
        isOpen={isChecklistTemplateConfirmOpen}
        onClose={() => setIsChecklistTemplateConfirmOpen(false)}
        onConfirm={handleDeleteChecklistTemplateConfirm}
        message={`Вы уверены, что хотите удалить шаблон чек-листа "${checklistTemplateToDeleteName || ''}"? Это действие не может быть отменено.`}
        title="Подтверждение удаления шаблона"
        isLoading={!!deletingChecklistTemplateId}
        confirmButtonVariant="destructive"
      />
    </div>
  );
}