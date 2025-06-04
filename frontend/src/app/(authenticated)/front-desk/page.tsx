'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { Spinner } from '@/components/spinner';
import ErrorMessage from '@/components/ErrorMessage';
import api from '@/lib/api';
import axios from 'axios';
import { Booking } from '@/lib/types';
import { CleaningTask } from '@/lib/types/housekeeping';
import BookingForm from '@/components/forms/BookingForm';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'; 
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

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
    flexRender,
    getCoreRowModel,
    useReactTable,
    ColumnDef,
} from '@tanstack/react-table';
import {
    Dialog, 
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

import {
    Plus,
    CalendarDays,
    BrushCleaning,
    Loader,
    CheckCircle,
    ChevronLeft,
    ChevronRight,
    // LogOut,
    Edit,
    Eye,
    MoreHorizontal, 
    XCircle, 
} from 'lucide-react';

import { 
    Sheet, 
    SheetContent, 
    SheetDescription, 
    SheetHeader, 
    SheetTitle,  
} from '@/components/ui/sheet';


import { format } from 'date-fns';
import { ru } from 'date-fns/locale'; 
import ConfirmationDialog from '@/components/ConfirmationDialog';
import CleaningTaskCard from '@/components/cleaning/CleaningTaskCard'; // Импорт CleaningTaskCard


interface BookingListParams {
    date?: string;
    page?: number;
    page_size?: number;
}

// Определяем тип для ответа API с пагинацией
interface PaginatedResponse<T> {
    count: number;
    next: string | null;
    previous: string | null;
    results: T[];
}

// Определяем тип для ответа API со сводными данными по номерам
interface RoomSummaryResponse {
    dirty: number;
    in_progress: number;
    waiting_inspection: number;
}

// Тип для хранения данных пагинации на фронтенде для каждой вкладки
interface PaginationState {
    count: number;
    next: string | null;
    previous: string | null;
    currentPage: number;
    pageSize: number;
}

export default function FrontDeskPage() {
    const { user, isLoading: isAuthLoading } = useAuth();
    const router = useRouter();

    // Состояние для управления выбранной вкладкой
    const [selectedTab, setSelectedTab] = useState<'departures' | 'arrivals' | 'stays'>('departures');

    // Состояние для выбранной даты (используем Date для DatePicker)
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

    // Состояния для данных таблицы и сводных карточек
    const [departures, setDepartures] = useState<Booking[]>([]);
    const [arrivals, setArrivals] = useState<Booking[]>([]);
    const [stays, setStays] = useState<Booking[]>([]);

    // Состояния для пагинации для каждой вкладки
    const [departuresPagination, setDeparturesPagination] = useState<PaginationState>({ count: 0, next: null, previous: null, currentPage: 1, pageSize: 10 });
    const [arrivalsPagination, setArrivalsPagination] = useState<PaginationState>({ count: 0, next: null, previous: null, currentPage: 1, pageSize: 10 });
    const [staysPagination, setStaysPagination] = useState<PaginationState>({ count: 0, next: null, previous: null, currentPage: 1, pageSize: 10 });

    // Состояния для сводных карточек
    const [summaryData, setSummaryData] = useState<RoomSummaryResponse>({
        dirty: 0,
        in_progress: 0,
        waiting_inspection: 0,
    });
    const [isLoadingSummary, setIsLoadingSummary] = useState(false);
    const [summaryError, setSummaryError] = useState<string | null>(null);

    const [isLoadingData, setIsLoadingData] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Состояние для отслеживания выполнения действия (заезд/выезд/удаление/отмена)
    const [isPerformingAction, setIsPerformingAction] = useState<boolean>(false);

      // Состояние для управления видимостью Sheet создания бронирования
    const [isCreateSheetOpen, setIsCreateSheetOpen] = useState<boolean>(false);

    // Состояния для модальных окон подтверждения удаления/отмены
    const [isConfirmDeleteModalOpen, setIsConfirmDeleteModalOpen] = useState<boolean>(false);
    const [bookingToDelete, setBookingToDelete] = useState<Booking | null>(null);
    const [bookingToDeleteNumber, setBookingToDeleteNumber] = useState<string | null>(null);

    const [bookingToEdit, setBookingToEdit] = useState<Booking | undefined>(undefined)

    const [readyForCheckTasks, setReadyForCheckTasks] = useState<CleaningTask[]>([]);
    const [isReadyForCheckDialogOpen, setIsReadyForCheckDialogOpen] = useState<boolean>(false);

   

    // Функция для форматирования даты в строку YYYY-MM-DD для API
    const formatDateForApi = (date: Date | undefined): string | undefined => {
        if (!date) return undefined;
        return format(date, 'yyyy-MM-dd');
    };

    const fetchBookings = useCallback(async (date: Date | undefined, tab: 'departures' | 'arrivals' | 'stays', page: number, pageSize: number) => {
        const dateString = formatDateForApi(date);

        if (!dateString || isPerformingAction || isCreateSheetOpen || isConfirmDeleteModalOpen ) return;

        setIsLoadingData(true);
        setError(null);

        let endpoint = '';
        if (tab === 'departures') {
            endpoint = '/api/bookings/departures-on-date/';
        } else if (tab === 'arrivals') {
            endpoint = '/api/bookings/arrivals-on-date/';
        } else if (tab === 'stays') {
            endpoint = '/api/bookings/stays-on-date/';
        } else {
            setIsLoadingData(false);
            setError('Неизвестная вкладка.');
            return;
        }

        const params: BookingListParams = {
            date: dateString,
            page: page,
            page_size: pageSize,
        };

        try {
            const response = await api.get<PaginatedResponse<Booking>>(endpoint, { params });

            if (response.status === 200) {
                const paginatedData = response.data;

                if (tab === 'departures') {
                    setDepartures(paginatedData.results);
                    setDeparturesPagination(prev => ({ ...prev, count: paginatedData.count, next: paginatedData.next, previous: paginatedData.previous, currentPage: page }));
                } else if (tab === 'arrivals') {
                    setArrivals(paginatedData.results);
                    setArrivalsPagination(prev => ({ ...prev, count: paginatedData.count, next: paginatedData.next, previous: paginatedData.previous, currentPage: page }));
                } else if (tab === 'stays') {
                    setStays(paginatedData.results);
                    setStaysPagination(prev => ({ ...prev, count: paginatedData.count, next: paginatedData.next, previous: paginatedData.previous, currentPage: page }));
                }

                console.log(`Bookings data fetched successfully for ${tab} on ${dateString}. Total count: ${paginatedData.count}`);

            } else {
                setError('Не удалось загрузить список бронирований. Статус: ' + response.status);
                console.error("Failed to fetch bookings list. Status:", response.status);
            }

        } catch (err) {
            console.error('Error fetching bookings list:', err);
            if (axios.isAxiosError(err) && err.response) {
                setError(err.response.data.detail || err.response.data.message || JSON.stringify(err.response.data) || 'Ошибка при загрузке списка бронирований.');
            } else if (axios.isAxiosError(err) && err.request) {
                setError('Нет ответа от сервера при загрузке списка бронирований. Проверьте подключение.');
            } else {
                setError('Произошла непредвиденная ошибка при загрузке списка бронирований.');
            }
        } finally {
            setIsLoadingData(false);
        }
    }, [isPerformingAction, isCreateSheetOpen, isConfirmDeleteModalOpen]);


    const fetchSummaryData = useCallback(async () => {
        if (isPerformingAction || isCreateSheetOpen || isConfirmDeleteModalOpen ) return;

        setIsLoadingSummary(true);
        setSummaryError(null);

        try {
            const response = await api.get<RoomSummaryResponse>('/api/rooms/status-summary/', {params:{
                all : true
            }});

            if (response.status === 200) {
                setSummaryData(response.data);
                console.log(`Room summary data fetched successfully`, response.data);
            } else {
                setSummaryError('Не удалось загрузить сводные данные по номерам. Статус: ' + response.status);
                console.error("Failed to fetch room summary data. Status:", response.status);
            }

        } catch (err) {
            console.error('Error fetching room summary data:', err);
            if (axios.isAxiosError(err) && err.response) {
                setSummaryError(err.response.data.detail || err.response.data.message || JSON.stringify(err.response.data) || 'Ошибка при загрузке сводных данных.');
            } else if (axios.isAxiosError(err) && err.request) {
                setSummaryError('Нет ответа от сервера при загрузке сводных данных.');
            } else {
                setSummaryError('Произошла непредвиденная ошибка при загрузке сводных данных.');
            }
        } finally {
            setIsLoadingSummary(false);
        }
    }, [isPerformingAction, isCreateSheetOpen, isConfirmDeleteModalOpen]);

    const fetchReadyForCheckTasks = useCallback(async () => {
            if (isPerformingAction || isCreateSheetOpen || isConfirmDeleteModalOpen) return;

            try {
                // Используем новый эндпоинт, который фильтрует на бэкенде
                const response = await api.get<CleaningTask[]>(`/api/cleaningtasks/ready_for_check/`);
                // Сортируем на фронтенде, как в MyCleaningTasksPage
                const sorted = [...response.data].sort((a, b) => {
                    if (a.is_rush && !b.is_rush) return -1;
                    if (!a.is_rush && b.is_rush) return 1;
                    const dateA = a.due_time ? new Date(a.due_time).getTime() : Infinity;
                    const dateB = b.due_time ? new Date(b.due_time).getTime() : Infinity;
                    return dateA - dateB;
                });
                setReadyForCheckTasks(sorted);
            } catch (err) {
                console.error("Error fetching ready for check tasks:", err);
                // Можно установить отдельное состояние ошибки для этого запроса, если нужно
            }
    }, [isPerformingAction, isCreateSheetOpen, isConfirmDeleteModalOpen]);
    // Эффект для загрузки данных при изменении выбранной даты или вкладки
    useEffect(() => {
        if (!isAuthLoading && user && (user.role === 'front-desk' || user.role === 'manager')) {
            const currentPageSize = selectedTab === 'departures' ? departuresPagination.pageSize : selectedTab === 'arrivals' ? arrivalsPagination.pageSize : staysPagination.pageSize;
            fetchBookings(selectedDate, selectedTab, 1, currentPageSize);
            fetchSummaryData();
            fetchReadyForCheckTasks()
        }

    }, [user, isAuthLoading, selectedDate, selectedTab, departuresPagination.pageSize, arrivalsPagination.pageSize, staysPagination.pageSize, fetchBookings, fetchSummaryData, fetchReadyForCheckTasks]);


    // Функции для обработки кликов по кнопкам пагинации
    const handlePageChange = (tab: 'departures' | 'arrivals' | 'stays', newPage: number) => {
        let currentPaginationState: PaginationState;
        let setPaginationState: React.Dispatch<React.SetStateAction<PaginationState>>;

        if (tab === 'departures') {
            currentPaginationState = departuresPagination;
            setPaginationState = setDeparturesPagination;
        } else if (tab === 'arrivals') {
            currentPaginationState = arrivalsPagination;
            setPaginationState = setArrivalsPagination;
        } else { // stays
            currentPaginationState = staysPagination;
            setPaginationState = setStaysPagination;
        }

        const totalPages = Math.ceil(currentPaginationState.count / currentPaginationState.pageSize);
        if (newPage >= 1 && newPage <= totalPages) {
            setPaginationState(prev => ({ ...prev, currentPage: newPage }));
            fetchBookings(selectedDate, tab, newPage, currentPaginationState.pageSize);
        }
    };

    const handleCreateBooking = () => {
        if (isPerformingAction || isCreateSheetOpen || isConfirmDeleteModalOpen ) return;
        setIsCreateSheetOpen(true);
    };

    
    const handleCreateEditSuccess = () => {
        setIsCreateSheetOpen(false);
        const currentPaginationState = selectedTab === 'departures' ? departuresPagination : selectedTab === 'arrivals' ? arrivalsPagination : staysPagination;
        fetchBookings(selectedDate, selectedTab, currentPaginationState.currentPage, currentPaginationState.pageSize);
        fetchSummaryData();
        fetchReadyForCheckTasks();
    };
    
    const handleCreateCancel = () => {
        setBookingToEdit(undefined)
        setIsCreateSheetOpen(false);

    };
    
   
    const handleEditBooking = (booking : Booking) => {
        if (isPerformingAction || isCreateSheetOpen || isConfirmDeleteModalOpen ) return;
        setBookingToEdit(booking)
        setIsCreateSheetOpen(true);
    }



    const handleCheckout = async (bookingId: number, room: string) => {
        if (isPerformingAction || isCreateSheetOpen || isConfirmDeleteModalOpen) return;

        setIsPerformingAction(true);
        setError(null);

        try {
            const bookingResponse = await api.post(`/api/bookings/${bookingId}/check_out/`);

            if (bookingResponse.status === 200) {
                toast.success(`Выезд из номера ${room} успешно отмечен.`);
                const currentPaginationState = selectedTab === 'departures' ? departuresPagination : selectedTab === 'arrivals' ? arrivalsPagination : staysPagination;
                fetchBookings(selectedDate, selectedTab, currentPaginationState.currentPage, currentPaginationState.pageSize);
                fetchSummaryData();
                fetchReadyForCheckTasks();
            } else {
                toast.error(`Не удалось отметить выезд номера ${room}. Пожалуйста, попробуйте ещё раз. (Status: ${bookingResponse.status})`);
                console.error("Booking status change failed during check-out. Status:", bookingResponse.status);
            }

        } catch (err) {
            console.error('Error during check-out:', err);
            let errorMessage = 'Ошибка при выполнении выезда.'; 

            if (axios.isAxiosError(err)) {
                if (err.response) {
                    errorMessage = err.response.data.detail || err.response.data.message || JSON.stringify(err.response.data) || 'Ошибка при выполнении выезда.';
                } else if (err.request) {
                    errorMessage = 'Нет ответа от сервера при выполнении выезда.';
                }
            } else {
                errorMessage = 'Произошла непредвиденная ошибка при выполнении выезда.';
            }

            toast.error(errorMessage);
            // setError(errorMessage);
        } finally {
            setIsPerformingAction(false);
        }
    };

    const handleCheckin = async (bookingId: number, room: string) => {
        if (isPerformingAction || isCreateSheetOpen || isConfirmDeleteModalOpen) return;

        setIsPerformingAction(true);
        setError(null);

        try {
            const bookingResponse = await api.post(`/api/bookings/${bookingId}/check_in/`);

            if (bookingResponse.status === 200) {
                toast.success(`Заезд в номер ${room} успешно отмечен.`);
                const currentPaginationState = selectedTab === 'departures' ? departuresPagination : selectedTab === 'arrivals' ? arrivalsPagination : staysPagination;
                fetchBookings(selectedDate, selectedTab, currentPaginationState.currentPage, currentPaginationState.pageSize);
                fetchSummaryData();
                fetchReadyForCheckTasks();
            } else {
                toast.error(`Не удалось отметить заезд номера ${room}. Пожалуйста, попробуйте ещё раз. (Status: ${bookingResponse.status})`);
                console.error("Booking status change failed during check-out. Status:", bookingResponse.status);
            }

        } catch (err) {
            console.error('Error during check-out:', err);
            let errorMessage = 'Ошибка при выполнении заезда.'; 

            if (axios.isAxiosError(err)) {
                if (err.response) {
                    errorMessage = err.response.data.detail || err.response.data.message || JSON.stringify(err.response.data) || 'Ошибка при выполнении заезда.';
                } else if (err.request) {
                    errorMessage = 'Нет ответа от сервера при выполнении заезда.';
                }
            } else {
                errorMessage = 'Произошла непредвиденная ошибка при выполнении заезда.';
            }

            toast.error(errorMessage);
            // setError(errorMessage);
        } finally {
            setIsPerformingAction(false);
        }
    };

    const handleViewDetails = (bookingId: number) => {
        if (isPerformingAction || isCreateSheetOpen || isConfirmDeleteModalOpen ) return;
        router.push(`/bookings/${bookingId}`);
    };



    // --- Функции для удаления и отмены бронирования ---

    const handleDeleteBookingClick = (booking: Booking) => {
        if (isPerformingAction || isCreateSheetOpen || isConfirmDeleteModalOpen ) return;
        setBookingToDelete(booking);
        setBookingToDeleteNumber(booking.room.number)
        setIsConfirmDeleteModalOpen(true);
    };

    const handleCancelDelete = () => {
        setBookingToDelete(null);
        setBookingToDeleteNumber(null)
        setIsConfirmDeleteModalOpen(false);
    };

    const handleConfirmDelete = async () => {
        if (!bookingToDelete || isPerformingAction || isCreateSheetOpen ) return;

        setIsPerformingAction(true);
        setError(null);

        try {
            
            const response = await api.delete(`/api/bookings/${bookingToDelete.id}/`);

            if (response.status === 204) { 
                console.log(`Booking ID: ${bookingToDelete.id} deleted successfully`);
                const currentPaginationState = selectedTab === 'departures' ? departuresPagination : selectedTab === 'arrivals' ? arrivalsPagination : staysPagination;
                fetchBookings(selectedDate, selectedTab, currentPaginationState.currentPage, currentPaginationState.pageSize);
                fetchSummaryData();
                fetchReadyForCheckTasks();
                handleCancelDelete();
            } else {
                setError('Не удалось удалить бронирование. Статус: ' + response.status);
                console.error("Failed to delete booking. Status:", response.status);
            }

        } catch (err) {
            console.error('Error during booking deletion:', err);
            if (axios.isAxiosError(err) && err.response) {
                setError(err.response.data.detail || err.response.data.message || JSON.stringify(err.response.data) || 'Ошибка при удалении бронирования.');
            } else if (axios.isAxiosError(err) && err.request) {
                setError('Нет ответа от сервера при удалении бронирования.');
            } else {
                setError('Произошла непредвиденная ошибка при удалении бронирования.');
            }
        } finally {
            setIsPerformingAction(false);
        }
    };
   
    // --- Определение колонок для DataTable ---
    // Используем useMemo для мемоизации колонок, чтобы они не пересоздавались при каждом рендере
    const columns: ColumnDef<Booking>[] = React.useMemo(() => {
        const baseColumns: ColumnDef<Booking>[] = [
            {
                accessorKey: 'room.number', 
                header: 'Номер комнаты',
                cell: ({ row }) => row.original.room?.number || 'N/A', 
            },
            {
                accessorKey: 'status_display',
                header: 'Статус',
                cell: ({ row }) => row.original.booking_status_display,
            },
            {
                id: 'actions',
                header: 'Действия',
                cell: ({ row }) => {
                    const booking = row.original;

                    return (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0" disabled={isPerformingAction}>
                                    <span className="sr-only">Открыть меню</span>
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Действия</DropdownMenuLabel>
                                {/* Кнопка "Детали" */}
                                <DropdownMenuItem onClick={() => handleViewDetails(booking.id)}>
                                    <Eye className="mr-2 h-4 w-4" /> Детали
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {/* Кнопка "Выезд" (только для вкладки "Выезды" и если статус не "checked_out" или "cancelled") */}
                                {selectedTab === 'departures' && booking.status_display !== 'checked_out' && booking.status_display !== 'cancelled' && (
                                     <DropdownMenuItem onClick={() => handleCheckout(booking.id, booking.room.number)}>
                                         <CheckCircle className="mr-2 h-4 w-4" /> Выезд
                                     </DropdownMenuItem>
                                )}
                                 {/* Кнопка "Заезд" (только для вкладки "Заезды" и если статус не "in_progress" или "cancelled") */}
                                 {selectedTab === 'arrivals' && booking.status_display !== 'in_progress' && booking.status_display !== 'cancelled' && (
                                     <DropdownMenuItem onClick={() => handleCheckin(booking.id, booking.room.number)}>
                                         <CheckCircle className="mr-2 h-4 w-4" /> Заезд
                                     </DropdownMenuItem>
                                 )}
                                
                                  <DropdownMenuItem 
                                        id="edit-booking" 
                                        onClick={() => handleEditBooking(booking)} // Предположим, что у вас есть такая функция
                                    >
                                        <Edit className="mr-2 h-4 w-4" />
                                        Редактировать
                                    </DropdownMenuItem>
                                 <DropdownMenuItem onClick={() => handleDeleteBookingClick(booking)} className="text-red-600">
                                     <XCircle className="mr-2 h-4 w-4" /> Удалить бронирование
                                 </DropdownMenuItem>
                                {/* TODO: Добавить другие действия, если необходимо (например, Редактировать) */}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    );
                },
            },
        ];

        
        if (selectedTab === 'departures') {
            baseColumns.splice(1, 0, {
                accessorKey: 'check_out',
                header: 'Время выезда',
                cell: ({ row }) => {
                    const date = new Date(row.original.check_out);
                    return format(date, 'HH:mm');
                },
            });
        } else if (selectedTab === 'arrivals') {
            baseColumns.splice(1, 0, { 
                accessorKey: 'check_in',
                header: 'Время заезда',
                cell: ({ row }) => {
                    const date = new Date(row.original.check_in);
                    return format(date, 'HH:mm');
                },
            });
        } else if (selectedTab === 'stays') {
            baseColumns.splice(1, 0, {
                id: 'stayPeriod',
                header: 'Период проживания',
                cell: ({ row }) => {
                    const checkInDate = format(new Date(row.original.check_in), 'dd.MM.yyyy');
                    const checkOutDate = format(new Date(row.original.check_out), 'dd.MM.yyyy');
                    return `${checkInDate} - ${checkOutDate}`;
                },
            });
        }

        return baseColumns;
    }, [selectedTab, isPerformingAction]); // Пересоздаем колонки при смене вкладки или статуса действия

    // --- Инициализация таблицы с помощью useReactTable ---
    const table = useReactTable({
        data: selectedTab === 'departures' ? departures : selectedTab === 'arrivals' ? arrivals : stays, // Данные для текущей вкладки
        columns, // Определенные колонки
        getCoreRowModel: getCoreRowModel(),
        manualPagination: true, // Указываем, что пагинация управляется вручную (бэкендом)
        rowCount: selectedTab === 'departures' ? departuresPagination.count : selectedTab === 'arrivals' ? arrivalsPagination.count : staysPagination.count, // Общее количество элементов
        state: {
            pagination: {
                pageIndex: (selectedTab === 'departures' ? departuresPagination : selectedTab === 'arrivals' ? arrivalsPagination : staysPagination).currentPage - 1, // useReactTable использует 0-based index
                pageSize: (selectedTab === 'departures' ? departuresPagination : selectedTab === 'arrivals' ? arrivalsPagination : staysPagination).pageSize,
            },
            // Добавьте другие состояния, если используете сортировку, фильтрацию и т.д.
        },
        onPaginationChange: (updater) => {
             const currentPagination = selectedTab === 'departures' ? departuresPagination : selectedTab === 'arrivals' ? arrivalsPagination : staysPagination;
             const newPaginationState = typeof updater === 'function' ? updater({ pageIndex: currentPagination.currentPage - 1, pageSize: currentPagination.pageSize }) : updater;

             // Вызываем handlePageChange с новой страницей (преобразуем обратно в 1-based index)
             handlePageChange(selectedTab, newPaginationState.pageIndex + 1);
        },
    });


    // --- Условный рендеринг ---

    // Если AuthContext еще загружается, показываем спиннер
    if (isAuthLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Spinner />
            </div>
        );
    }

    // Проверка роли: доступно 'front-desk' и 'manager'
    if (!user || (user.role !== 'front-desk' && user.role !== 'manager')) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="p-8 rounded-lg shadow-lg max-w-md w-full text-center text-red-600 font-bold">
                    У вас нет прав для просмотра этой страницы. Доступно персоналу службы приема и менеджерам.
                </div>
            </div>
        );
    }

    // Если есть ошибка загрузки данных (для таблицы или сводных данных), показываем сообщение
    if ((error || summaryError) && !isCreateSheetOpen && !isConfirmDeleteModalOpen && !isPerformingAction) {
        const errorMessage = error || summaryError;
        const handleRetry = () => {
            const currentPageSize = selectedTab === 'departures' ? departuresPagination.pageSize : selectedTab === 'arrivals' ? arrivalsPagination.pageSize : staysPagination.pageSize;
            fetchBookings(selectedDate, selectedTab, 1, currentPageSize);
            fetchSummaryData();
            fetchReadyForCheckTasks();
        };

        return (
            <ErrorMessage
                message={errorMessage}
                onRetry={handleRetry}
                isLoading={isLoadingData || isLoadingSummary}
            />
        );
    }

    // Определяем текущую пагинацию
    const currentPagination = selectedTab === 'departures' ? departuresPagination : selectedTab === 'arrivals' ? arrivalsPagination : staysPagination;
    // Вычисляем общее количество страниц
    const totalPages = Math.ceil(currentPagination.count / currentPagination.pageSize);


    // Если все успешно, отображаем содержимое страницы
    return (
        <div className="container mx-auto p-4">
            {/* Заголовок и кнопка выхода */}
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bol">Служба приема</h1>
            </div>


            {/* Верхняя панель: Кнопка создания, выбор даты, вкладки */}
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 space-y-4 sm:space-y-0 sm:space-x-4">
                {/* Кнопка создания нового бронирования */}
                
              
        
                    <Button
                        onClick={handleCreateBooking}
                        disabled={isPerformingAction || isLoadingData || isLoadingSummary || isCreateSheetOpen || isConfirmDeleteModalOpen}
                    >
                        < Plus size={20} className="mr-2" /> Создать новое бронирование
                    </Button>
                   

                {/* Выбор даты с помощью shadcn/ui Popover и Calendar */}
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant={"outline"}
                            className={`w-[240px] justify-start text-left font-normal ${!selectedDate && "text-muted-foreground"}`}
                            disabled={isLoadingData || isPerformingAction || isLoadingSummary || isCreateSheetOpen || isConfirmDeleteModalOpen }
                        >
                            <CalendarDays size={20} className="mr-2" />
                            {selectedDate ? format(selectedDate, "PPP", { locale: ru }) : <span>Выберите дату</span>}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                        <Calendar
                            mode="single"
                            selected={selectedDate}
                            onSelect={setSelectedDate}
                            initialFocus
                            locale={ru}
                        />
                    </PopoverContent>
                </Popover>

                {/* Вкладки с помощью shadcn/ui Tabs */}
                <Tabs value={selectedTab} onValueChange={(value) => setSelectedTab(value as 'departures' | 'arrivals' | 'stays')} className="w-full sm:w-auto">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="departures" disabled={isLoadingData || isPerformingAction || isLoadingSummary || isCreateSheetOpen || isConfirmDeleteModalOpen }>Выезды</TabsTrigger>
                        <TabsTrigger value="arrivals" disabled={isLoadingData || isPerformingAction || isLoadingSummary || isCreateSheetOpen || isConfirmDeleteModalOpen }>Заезды</TabsTrigger>
                        <TabsTrigger value="stays" disabled={isLoadingData || isPerformingAction || isLoadingSummary || isCreateSheetOpen || isConfirmDeleteModalOpen }>Проживающие</TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            {/* Сводные карточки */}
            {isLoadingSummary ? (
                <div className="flex justify-center items-center h-24"><Spinner /></div>
            ) : (
                !summaryError && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                        <Card className="bg-amber-100 text-amber-600">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-yellow-700">Ожидает уборки</CardTitle>
                                <BrushCleaning size={20} className="text-yellow-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-yellow-800">{summaryData.dirty}</div>
                            </CardContent>
                        </Card>
                        <Card className="bg-sky-100 text-sky-600">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-blue-700">В процессе</CardTitle>
                                <Loader size={20} className="text-blue-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-blue-800">{summaryData.in_progress}</div>
                            </CardContent>
                        </Card>
                        <Dialog open={isReadyForCheckDialogOpen} onOpenChange={setIsReadyForCheckDialogOpen}>
                            <DialogTrigger asChild>
                                <Card className="bg-green-100 text-green-600 cursor-pointer hover:shadow-lg transition-shadow duration-200">
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium text-green-700">Готов к проверке</CardTitle>
                                        <CheckCircle size={20} className="text-green-600" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold text-green-800">{summaryData.waiting_inspection}</div>
                                    </CardContent>
                                </Card>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
                                <DialogHeader>
                                    <DialogTitle>Задачи, готовые к проверке ({readyForCheckTasks.length})</DialogTitle>
                                    <DialogDescription>
                                        Список задач по уборке, которые ожидают вашей инспекции.
                                    </DialogDescription>
                                </DialogHeader>
                                {readyForCheckTasks.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 py-4">
                                        {readyForCheckTasks.map(task => (
                                            <CleaningTaskCard
                                                key={task.id}
                                                task={task}
                                                cardColor={task.status === 'completed' ? 'bg-green-100' : 'bg-orange-100'} // Или другой цвет
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center p-8 text-gray-700">
                                        <XCircle size={48} className="text-gray-400 mb-4" />
                                        <p className="text-lg font-medium">Нет задач, готовых к проверке.</p>
                                    </div>
                                )}
                            </DialogContent>
                        </Dialog>
                    </div>
                )
            )}


            {/* DataTable */}
            <div className=" shadow-md rounded-lg overflow-hidden">
                <div className="text-xl font-bold p-4 border-b">
                    {selectedTab === 'departures' && 'Сегодняшние выезды'}
                    {selectedTab === 'arrivals' && 'Сегодняшние заезды'}
                    {selectedTab === 'stays' && 'Проживающие'}
                    {currentPagination.count > 0 && (
                        <span className="ml-2 text-sm font-normal">({currentPagination.count} всего)</span>
                    )}
                </div>

                {/* Используем компоненты Table из shadcn/ui с данными из react-table */}
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
                        {isLoadingData || isPerformingAction ? (
                             <TableRow>
                                <TableCell colSpan={columns.length} className="h-24 text-center">
                                    <Spinner />
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
                                        {selectedTab === 'departures' && 'Нет выездов на выбранную дату.'}
                                        {selectedTab === 'arrivals' && 'Нет заездов на выбранную дату.'}
                                        {selectedTab === 'stays' && 'Нет проживающих на выбранную дату.'}
                                    </TableCell>
                                </TableRow>
                            )
                        )}
                    </TableBody>
                </Table>

                {/* Элементы управления пагинацией */}
                 {currentPagination.count > 0 && !isLoadingData && !error && !isPerformingAction && (
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
                             Страница {currentPagination.currentPage} из {totalPages}
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

            {/* Sheet для формы создания/редактирования бронирования */}
            <Sheet 
                open={isCreateSheetOpen} 
                onOpenChange={(open) => {
                    setIsCreateSheetOpen(open);
                    if (!open) {
                    setBookingToEdit(undefined); 
                    }
            }}>
                
               
                <SheetContent className="sm:max-w-lg w-full">
                    <SheetHeader>
                        <SheetTitle>{bookingToEdit ? `Редактировать бронирование>` : 'Создать новое бронирование'}</SheetTitle>
                        <SheetDescription>
                            {bookingToEdit ? "Внесите изменения в данные бронирования." : "Заполните форму, чтобы добавить новое бронирование в систему."}
                        </SheetDescription>
                    </SheetHeader>
                    <BookingForm
                        bookingToEdit={bookingToEdit}
                        onSuccess={handleCreateEditSuccess}
                        onCancel={handleCreateCancel}
                    />
                </SheetContent>
            </Sheet>
           
            {/* Confirmation Dialog для подтверждения удаления */}
            <ConfirmationDialog
                isOpen={isConfirmDeleteModalOpen}
                onClose={() => handleCancelDelete()}
                onConfirm={handleConfirmDelete}
                message={`Вы уверены, что хотите удалить бронирование для номера ${bookingToDeleteNumber || 'N/A'}?`}
                title="Подтверждение удаления"
                confirmButtonText="Удалить"
                isLoading={!!isPerformingAction}
                confirmButtonVariant="destructive"
                
            />

            

        </div>
    );
}
