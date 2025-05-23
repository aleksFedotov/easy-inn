'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { Spinner } from '@/components/spinner';
import ErrorMessage from '@/components/ErrorMessage';
import api from '@/lib/api';
import axios from 'axios';
import { Booking } from '@/lib/types';
import BookingForm from '@/components/forms/BookingForm';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'; 
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';

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
    awaiting_cleaning: number;
    in_progress: number;
    ready_for_inspection: number;
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
        awaiting_cleaning: 0,
        in_progress: 0,
        ready_for_inspection: 0,
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


    // Эффект для загрузки данных при изменении выбранной даты или вкладки
    useEffect(() => {
        if (!isAuthLoading && user && (user.role === 'front-desk' || user.role === 'manager')) {
            const currentPageSize = selectedTab === 'departures' ? departuresPagination.pageSize : selectedTab === 'arrivals' ? arrivalsPagination.pageSize : staysPagination.pageSize;
            fetchBookings(selectedDate, selectedTab, 1, currentPageSize);
            fetchSummaryData();
        }

    }, [user, isAuthLoading, selectedDate, selectedTab, departuresPagination.pageSize, arrivalsPagination.pageSize, staysPagination.pageSize, fetchBookings, fetchSummaryData]);


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



    const handleCheckout = async (bookingId: number, roomId: number) => {
        if (isPerformingAction || isCreateSheetOpen || isConfirmDeleteModalOpen ) return;

        setIsPerformingAction(true);
        setError(null);

        try {
            const roomResponse = await api.post(`/api/rooms/${roomId}/change_status/`, { 'new_status': 'dirty' });
            const bookingResponse = await api.post(`/api/bookings/${bookingId}/change_status/`, { 'new_status': 'checked_out' });

            if (roomResponse.status === 200 && bookingResponse.status === 200) {
                console.log(`Check-out successful for booking ID: ${bookingId}`);
                const currentPaginationState = selectedTab === 'departures' ? departuresPagination : selectedTab === 'arrivals' ? arrivalsPagination : staysPagination;
                fetchBookings(selectedDate, selectedTab, currentPaginationState.currentPage, currentPaginationState.pageSize);
                fetchSummaryData();
            } else {
                if (roomResponse.status !== 200) {
                    setError('Не удалось изменить статус комнаты при выезде. Статус: ' + roomResponse.status);
                    console.error("Room status change failed during check-out. Status:", roomResponse.status);
                }
                if (bookingResponse.status !== 200) {
                    setError('Не удалось изменить статус бронирования при выезде. Статус: ' + bookingResponse.status);
                    console.error("Booking status change failed during check-out. Status:", bookingResponse.status);
                }
                if (roomResponse.status !== 200 && bookingResponse.status !== 200) {
                    setError(`Не удалось выполнить выезд. Ошибки: Статус комнаты ${roomResponse.status}, Статус бронирования ${bookingResponse.status}`);
                }
            }

        } catch (err) {
            console.error('Error during check-out:', err);
            if (axios.isAxiosError(err) && err.response) {
                setError(err.response.data.detail || err.response.data.message || JSON.stringify(err.response.data) || 'Ошибка при выполнении выезда.');
            } else if (axios.isAxiosError(err) && err.request) {
                setError('Нет ответа от сервера при выполнении выезда.');
            } else {
                setError('Произошла непредвиденная ошибка при выполнении выезда.');
            }
        } finally {
            setIsPerformingAction(false);
        }
    };

    const handleCheckin = async (bookingId: number, roomId: number) => {
        if (isPerformingAction || isCreateSheetOpen || isConfirmDeleteModalOpen ) return;

        setIsPerformingAction(true);
        setError(null);

        try {
            const roomResponse = await api.post(`/api/rooms/${roomId}/change_status/`, { 'new_status': 'occupied' });
            const bookingResponse = await api.post(`/api/bookings/${bookingId}/change_status/`, { 'new_status': 'in_progress' });

            if (roomResponse.status === 200 && bookingResponse.status === 200) {
                console.log(`Check-in successful for booking ID: ${bookingId}`);
                const currentPaginationState = selectedTab === 'departures' ? departuresPagination : selectedTab === 'arrivals' ? arrivalsPagination : staysPagination;
                fetchBookings(selectedDate, selectedTab, currentPaginationState.currentPage, currentPaginationState.pageSize);
                fetchSummaryData();
            } else {
                if (roomResponse.status !== 200) {
                    setError('Не удалось изменить статус комнаты при заезде. Статус: ' + roomResponse.status);
                    console.error("Room status change failed during check-in. Status:", roomResponse.status);
                }
                if (bookingResponse.status !== 200) {
                    setError('Не удалось изменить статус бронирования при заезде. Статус: ' + bookingResponse.status);
                    console.error("Booking status change failed during check-in. Status:", bookingResponse.status);
                }
                if (roomResponse.status !== 200 && bookingResponse.status !== 200) {
                    setError(`Не удалось выполнить заезд. Ошибки: Статус комнаты ${roomResponse.status}, Статус бронирования ${bookingResponse.status}`);
                }
            }

        } catch (err) {
            console.error('Error during check-in:', err);
            if (axios.isAxiosError(err) && err.response) {
                setError(err.response.data.detail || err.response.data.message || JSON.stringify(err.response.data) || 'Ошибка при выполнении заезда.');
            } else if (axios.isAxiosError(err) && err.request) {
                setError('Нет ответа от сервера при выполнении заезда.');
            } else {
                setError('Произошла непредвиденная ошибка при выполнении заезда.');
            }
        } finally {
            setIsPerformingAction(false);
        }
    };

    const handleViewDetails = (bookingId: number) => {
        if (isPerformingAction || isCreateSheetOpen || isConfirmDeleteModalOpen ) return;
        router.push(`/bookings/${bookingId}`);
    };

    // const handleLogout = () => {
    //     logout();
    // };

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
                cell: ({ row }) => row.original.status_display,
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
                                     <DropdownMenuItem onClick={() => handleCheckout(booking.id, booking.room.id)}>
                                         <CheckCircle className="mr-2 h-4 w-4" /> Выезд
                                     </DropdownMenuItem>
                                )}
                                 {/* Кнопка "Заезд" (только для вкладки "Заезды" и если статус не "in_progress" или "cancelled") */}
                                 {selectedTab === 'arrivals' && booking.status_display !== 'in_progress' && booking.status_display !== 'cancelled' && (
                                     <DropdownMenuItem onClick={() => handleCheckin(booking.id, booking.room.id)}>
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
            <div className="flex items-center justify-center min-h-screen bg-gray-100">
                <Spinner />
            </div>
        );
    }

    // Проверка роли: доступно 'front-desk' и 'manager'
    if (!user || (user.role !== 'front-desk' && user.role !== 'manager')) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100">
                <div className="p-8 rounded-lg shadow-lg bg-white max-w-md w-full text-center text-red-600 font-bold">
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
                {/* <Button
                    variant="outline"
                    onClick={handleLogout}
                    disabled={isPerformingAction || isLoadingData || isLoadingSummary || isCreateSheetOpen || isConfirmDeleteModalOpen }
                >
                    <LogOut size={18} className="mr-2" /> Выйти
                </Button> */}
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
                                <div className="text-2xl font-bold text-yellow-800">{summaryData.awaiting_cleaning}</div>
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
                        <Card className="bg-green-100 text-green-600">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-green-700">Готов к проверке</CardTitle>
                                <CheckCircle size={20} className="text-green-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-green-800">{summaryData.ready_for_inspection}</div>
                            </CardContent>
                        </Card>
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
                            Заполните форму, чтобы добавить новое бронирование в систему.
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
