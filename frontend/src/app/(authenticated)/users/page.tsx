// src/app/(authenticated)/users/page.tsx
'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/lib/AuthContext';
import api from '@/lib/api';
import { Spinner } from '@/components/spinner';
import axios from 'axios';
import { User } from '@/lib/types';
import { Plus, Edit, Trash2, ArrowUpDown, ChevronDown,MoreHorizontal } from 'lucide-react'; // Добавлены иконки для DataTable
import UserForm from '@/components/forms/UserFrom';
// Импортируем компоненты shadcn/ui для DataTable
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  useReactTable,
  SortingState,
  ColumnFiltersState,
  VisibilityState,
} from '@tanstack/react-table';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

import ConfirmationDialog from '@/components/ConfirmationDialog'; 
import ErrorDialog from '@/components/ErrorDialog';


interface UserListParams {
    ordering?: string;
    all?: boolean;
    search?: string; // Добавляем параметр поиска
}


export default function ManageUsersPage() {
    const { user, isLoading: isAuthLoading } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false); // Состояние для Sheet
    const [userToEdit, setUserToEdit] = useState<User | undefined>(undefined);

    // Состояния для модального окна подтверждения удаления (теперь ConfirmationDialog)
    const [isDeleteConfirmDialogOpen, setIsDeleteConfirmDialogOpen] = useState<boolean>(false);
    const [userToDeleteId, setUserToDeleteId] = useState<number | null>(null);
    const [userToDeleteUsername, setUserToDeleteUsername] = useState<string | null>(null);
    const [deletingUserId, setDeletingUserId] = useState<number | null>(null);

    // Состояние для модального окна отображения ошибки (теперь ErrorDialog)
    const [isErrorDialogOpen, setIsErrorDialogOpen] = useState<boolean>(false);
    const [errorDialogMessage, setErrorDialogMessage] = useState<string | null>(null);


    // --- Состояния для DataTable ---
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
    const [rowSelection, setRowSelection] = useState({});
    const [globalFilter, setGlobalFilter] = useState('');
    // --- Конец состояний для DataTable ---


    // Функция для загрузки списка пользователей с бэкенда
    const fetchUsers = async (params: UserListParams = {}) => {
        setIsLoading(true);
        setErrorDialogMessage(null);
        setIsErrorDialogOpen(false);

        try {
            const requestParams: UserListParams = {
                ...params,
                ordering: sorting.map(s => `${s.desc ? '-' : ''}${s.id}`).join(','),
                all: true,
            };

            const response = await api.get<User[]>('/api/users/', { params: requestParams });

            if (response.status === 200) {
            const validRoles: User['role'][] = ['housekeeper', 'front-desk', 'manager'];
            const filteredUsers = response.data.filter(userItem =>
                validRoles.includes(userItem.role)
            );

            setUsers(filteredUsers);
            console.log("Users list fetched successfully and filtered.");
            } else {
            const errMessage = 'Не удалось загрузить список пользователей. Статус: ' + response.status;
            setErrorDialogMessage(errMessage);
            setIsErrorDialogOpen(true);
            console.error("Failed to fetch users list. Status:", response.status);
            }
        } catch (err) {
            console.error('Error fetching users list:', err);
            let errMessage = 'Произошла непредвиденная ошибка при загрузке списка пользователей.';
            if (axios.isAxiosError(err) && err.response) {
                errMessage = err.response.data.detail || err.response.data.message || JSON.stringify(err.response.data) || 'Ошибка при загрузке списка пользователей.';
            } else if (axios.isAxiosError(err) && err.request) {
                errMessage = 'Нет ответа от сервера при загрузке списка пользователей. Проверьте подключение.';
            } else {
                errMessage = 'Произошла непредвиденная ошибка при загрузке списка пользователей.';
            }
            setErrorDialogMessage(errMessage);
            setIsErrorDialogOpen(true);
        } finally {
            setIsLoading(false);
        }
    };

    // Эффект для запуска загрузки данных при монтировании компонента или изменении сортировки
    useEffect(() => {
        if (!isAuthLoading) {
            if (user?.role === 'manager') {
            fetchUsers();
            } else {
            setIsLoading(false);
            const accessError = 'У вас нет прав для просмотра этой страницы. Доступно только менеджерам.';
            setErrorDialogMessage(accessError);
            setIsErrorDialogOpen(true);
            }
        }
    }, [user, isAuthLoading, sorting]);


    // Функции для управления Sheet и формами
    const handleCreateUser = () => {
        setUserToEdit(undefined);
    };

    const handleEditUser = (user: User) => {
        setUserToEdit(user);
        setIsFormOpen(true); 
    };

    const handleFormSuccess = () => {
        setIsFormOpen(false); 
        setUserToEdit(undefined);
        fetchUsers(); 
    };

    const handleFormCancel = () => {
        setIsFormOpen(false);
        setUserToEdit(undefined);
    };

    // Функция для открытия Dialog подтверждения удаления
    const handleDeleteUserClick = async (userId: number, username: string) => {
        setUserToDeleteId(userId);
        setUserToDeleteUsername(username);
        setIsDeleteConfirmDialogOpen(true);
        setErrorDialogMessage(null);
        setIsErrorDialogOpen(false);
    };

    // Подтверждение удаления в Dialog
    const handleConfirmDelete = async () => {
    if(userToDeleteId === null) return;

        setDeletingUserId(userToDeleteId);

    try {
        const response = await api.delete(`/api/users/${userToDeleteId}/`);

        if(response.status === 204){
        console.log(`Пользователь с ID ${userToDeleteId} успешно удален.`);
        fetchUsers(); // Обновляем список после удаления
        } else {
        const errMessage = 'Не удалось удалить пользователя. Статус: ' + response.status;
        setErrorDialogMessage(errMessage);
        setIsErrorDialogOpen(true);
        console.error("Failed to delete user. Status:", response.status);
        }
    } catch (err) {
        console.error(`Error deleting user with ID ${userToDeleteId}:`, err);
        let errMessage = 'Произошла непредвиденная ошибка при удалении пользователя.';
        if (axios.isAxiosError(err) && err.response) {
                errMessage = err.response.data.detail || err.response.data.message || JSON.stringify(err.response.data) || 'Ошибка при удалении пользователя.';
        } else if (axios.isAxiosError(err) && err.request) {
                errMessage = 'Нет ответа от сервера при удалении пользователя. Проверьте подключение.';
        } else {
            errMessage = 'Произошла непредвиденная ошибка при удалении пользователя.';
        }
        setErrorDialogMessage(errMessage);
        setIsErrorDialogOpen(true);
    } finally {
        setUserToDeleteId(null);
        setUserToDeleteUsername(null);
        setDeletingUserId(null);
        setIsDeleteConfirmDialogOpen(false);
    }
    };

    // Закрытие Dialog ошибки
    const handleErrorDialogClose = () => {
        setIsErrorDialogOpen(false);
        setErrorDialogMessage(null);
    };

    // Повторная попытка загрузки данных из ErrorDialog
    const handleErrorDialogRetry = () => {
        handleErrorDialogClose();
        fetchUsers();
    };


    // --- Определение колонок для DataTable ---
    const columns: ColumnDef<User>[] = useMemo(() => [
        {
            id: "select",
            header: ({ table }) => (
                <Checkbox
                    checked={
                        table.getIsAllPageRowsSelected() ||
                        (table.getIsSomePageRowsSelected() && "indeterminate")
                    }
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
            enableSorting: false,
            enableHiding: false,
        },
        {
            accessorKey: "username",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    >
                        Имя пользователя
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                );
            },
            cell: ({ row }) => <div className="lowercase">{row.getValue("username")}</div>,
        },
        {
            accessorKey: "first_name",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    >
                        Имя
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                );
            },
            cell: ({ row }) => <div>{row.getValue("first_name")}</div>,
        },
        {
            accessorKey: "last_name",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    >
                        Фамилия
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                );
            },
            cell: ({ row }) => <div>{row.getValue("last_name")}</div>,
        },
        {
            accessorKey: "role",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    >
                        Роль
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                );
            },
            cell: ({ row }) => <div>{row.getValue("role")}</div>,
        },
        {
            id: "actions",
            enableHiding: false,
            cell: ({ row }) => {
                const userItem = row.original;

                return (
                    // Используем DropdownMenu для действий
                    <DropdownMenu>
                        {/* Триггер выпадающего меню (иконка троеточия) */}
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Открыть меню</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        {/* Содержимое выпадающего меню */}
                        <DropdownMenuContent align="end">
                            {/* Пункт "Редактировать" */}
                            <DropdownMenuItem
                                onClick={() => handleEditUser(userItem)}
                                disabled={!!deletingUserId || isDeleteConfirmDialogOpen || isErrorDialogOpen}
                                className="flex items-center"
                            >
                                <Edit size={16} className="mr-2"/> Редактировать
                            </DropdownMenuItem>
                            {/* Пункт "Удалить" */}
                            <DropdownMenuItem
                                onClick={() => handleDeleteUserClick(userItem.id, userItem.username)}
                                disabled={deletingUserId === userItem.id || isLoading || isDeleteConfirmDialogOpen || isErrorDialogOpen}
                                className="flex items-center text-red-600 focus:bg-red-100 focus:text-red-700"
                            >
                                {deletingUserId === userItem.id ? <Spinner size={16} className="mr-2"/> : <Trash2 size={16} className="mr-2"/>}
                                {deletingUserId === userItem.id ? 'Удаление...' : 'Удалить'}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                );
            },
        },
    ], [deletingUserId, isLoading, isDeleteConfirmDialogOpen, isErrorDialogOpen]);

    // --- Инициализация таблицы с useReactTable ---
    const table = useReactTable({
        data: users,
        columns,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        state: {
            sorting,
            columnFilters,
            columnVisibility,
            rowSelection,
            globalFilter,
        },
        onGlobalFilterChange: setGlobalFilter,
    });
    // --- Конец инициализации таблицы ---


    // --- Условный рендеринг ---

    if (isAuthLoading) {
        return null;
    }

    if (!user || user.role !== 'manager') {
        if (isAuthLoading || isErrorDialogOpen) {
            return null;
        }
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100">
            </div>
        );
    }

    if (isLoading && !isFormOpen && !isDeleteConfirmDialogOpen && !isErrorDialogOpen) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100">
                <Spinner/>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-6">Управление пользователями</h1>

        <div className="flex flex-col sm:flex-row items-center py-4 gap-4">
            <Input
                placeholder="Поиск пользователей..."
                value={globalFilter ?? ''}
                onChange={(event) => setGlobalFilter(event.target.value)}
                className="max-w-sm"
            />
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="ml-auto">
                        Колонки <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    {table
                        .getAllColumns()
                        .filter((column) => column.getCanHide())
                        .map((column) => {
                            return (
                                <DropdownMenuCheckboxItem
                                    key={column.id}
                                    className="capitalize"
                                    checked={column.getIsVisible()}
                                    onCheckedChange={(value) =>
                                        column.toggleVisibility(!!value)
                                    }
                                >
                                    {column.id === 'username' ? 'Имя пользователя' :
                                    column.id === 'first_name' ? 'Имя' :
                                    column.id === 'last_name' ? 'Фамилия' :
                                    column.id === 'role' ? 'Роль' :
                                    column.id}
                                </DropdownMenuCheckboxItem>
                            );
                        })}
                </DropdownMenuContent>
            </DropdownMenu>
        {/* Sheet для формы создания/редактирования пользователя */}
        <Sheet open={isFormOpen} onOpenChange={setIsFormOpen}>
            {/* Передаем onClick напрямую SheetTrigger */}
            <SheetTrigger asChild onClick={handleCreateUser}>
                <Button
                    disabled={isDeleteConfirmDialogOpen || isErrorDialogOpen || !!deletingUserId}
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold transition duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Plus size={18} className="inline mr-1"/> Создать пользователя
                </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
                <SheetHeader>
                    {/* Заголовок теперь внутри SheetContent */}
                    <SheetTitle>{userToEdit ? `Редактировать пользователя` : 'Создать нового пользователя'}</SheetTitle>
                    <SheetDescription>
                        {userToEdit ? "Внесите изменения в данные пользователя." : "Создайте нового пользователя в системе."}
                    </SheetDescription>
                </SheetHeader>
                <UserForm
                    userToEdit={userToEdit}
                    onSuccess={handleFormSuccess}
                    onCancel={handleFormCancel}
                />
            </SheetContent>
        </Sheet>
        </div>

        {/* DataTable компонент */}
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
                            )
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
                                {isLoading ? 'Загрузка...' : 'Пользователи не найдены.'}
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>

        {/* Confirmation Dialog для подтверждения удаления */}
        <ConfirmationDialog
            isOpen={isDeleteConfirmDialogOpen}
            onClose={() => setIsDeleteConfirmDialogOpen(false)}
            onConfirm={handleConfirmDelete}
            message={`Вы уверены, что хотите удалить пользователя ${userToDeleteUsername}? Это действие нельзя отменить.`}
            title="Подтверждение удаления"
            confirmButtonText="Удалить"
            isLoading={!!deletingUserId}
            confirmButtonVariant="destructive"
            
        />

        {/* Error Dialog для отображения ошибок */}
        <ErrorDialog
            isOpen={isErrorDialogOpen}
            onClose={handleErrorDialogClose}
            message={errorDialogMessage}
            title="Ошибка"
            onRetry={errorDialogMessage?.includes('загрузить') && user?.role === 'manager' ? handleErrorDialogRetry : undefined}
            isRetryLoading={isLoading}
            retryButtonText="Повторить загрузку"
        />

    </div>
    );
}