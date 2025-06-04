import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import axios from 'axios';
import { format } from 'date-fns';
import { Booking } from '@/lib/types'; // Убедитесь, что Booking импортируется из правильного места
import { CleaningTask } from '@/lib/types/housekeeping'; // Убедитесь, что CleaningTask импортируется из правильного места

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
    // Добавьте сюда другие статусы, если они есть в вашем API и используются
    clean: number;
    free: number;
    occupied: number;
    assigned: number;
    on_maintenance: number;
}

// Тип для хранения данных пагинации на фронтенде для каждой вкладки
interface PaginationState {
    count: number;
    next: string | null;
    previous: string | null;
    currentPage: number;
    pageSize: number;
}

interface UseFrontDeskDataProps {
    selectedDate: Date | undefined;
    selectedTab: 'departures' | 'arrivals' | 'stays';
    isPerformingAction: boolean; // Флаг, который показывает, выполняется ли действие (заезд/выезд/удаление/отмена)
    isCreateSheetOpen: boolean; // Флаг, который показывает, открыт ли Sheet создания/редактирования
    isConfirmDeleteModalOpen: boolean; // Флаг, который показывает, открыто ли модальное окно подтверждения удаления
}

interface UseFrontDeskDataReturn {
    departures: Booking[];
    arrivals: Booking[];
    stays: Booking[];
    summaryData: RoomSummaryResponse;
    readyForCheckTasks: CleaningTask[];
    departuresPagination: PaginationState;
    arrivalsPagination: PaginationState;
    staysPagination: PaginationState;
    isLoadingData: boolean;
    isLoadingSummary: boolean;
    error: string | null;
    summaryError: string | null;
    refetchBookings: () => void;
    refetchSummary: () => void;
    refetchReadyForCheckTasks: () => void;
    handlePageChange: (tab: 'departures' | 'arrivals' | 'stays', newPage: number) => void;
}

export const useFrontDeskData = ({
    selectedDate,
    selectedTab,
    isPerformingAction,
    isCreateSheetOpen,
    isConfirmDeleteModalOpen,
}: UseFrontDeskDataProps): UseFrontDeskDataReturn => {
    // Состояния для данных таблицы
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
        clean: 0,
        free: 0,
        occupied: 0,
        assigned: 0,
        on_maintenance: 0,
    });
    const [readyForCheckTasks, setReadyForCheckTasks] = useState<CleaningTask[]>([]);

    // Состояния загрузки и ошибок
    const [isLoadingData, setIsLoadingData] = useState(false);
    const [isLoadingSummary, setIsLoadingSummary] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [summaryError, setSummaryError] = useState<string | null>(null);

    // Функция для форматирования даты в строку YYYY-MM-DD для API
    const formatDateForApi = (date: Date | undefined): string | undefined => {
        if (!date) return undefined;
        return format(date, 'yyyy-MM-dd');
    };

    const fetchBookings = useCallback(async (
        date: Date | undefined,
        tab: 'departures' | 'arrivals' | 'stays',
        page: number,
        pageSize: number
    ) => {
        const dateString = formatDateForApi(date);

        if (!dateString || isPerformingAction || isCreateSheetOpen || isConfirmDeleteModalOpen) {
            // Если какое-либо действие выполняется, не запускаем повторный fetch
            return;
        }

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

        const params = {
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
            } else {
                setError('Не удалось загрузить список бронирований. Статус: ' + response.status);
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
        if (isPerformingAction || isCreateSheetOpen || isConfirmDeleteModalOpen) {
            return;
        }

        setIsLoadingSummary(true);
        setSummaryError(null);

        try {
            const response = await api.get<RoomSummaryResponse>('/api/rooms/status-summary/', { params: { all: true } });

            if (response.status === 200) {
                setSummaryData(response.data);
            } else {
                setSummaryError('Не удалось загрузить сводные данные по номерам. Статус: ' + response.status);
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
        if (isPerformingAction || isCreateSheetOpen || isConfirmDeleteModalOpen) {
            return;
        }

        try {
            const response = await api.get<CleaningTask[]>(`/api/cleaningtasks/ready_for_check/`);
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
            
        }
    }, [isPerformingAction, isCreateSheetOpen, isConfirmDeleteModalOpen]); 


    useEffect(() => {
        const currentPageSize = selectedTab === 'departures' ? departuresPagination.pageSize : selectedTab === 'arrivals' ? arrivalsPagination.pageSize : staysPagination.pageSize;
        fetchBookings(selectedDate, selectedTab, 1, currentPageSize);
        fetchSummaryData();
        fetchReadyForCheckTasks();
    }, [selectedDate, selectedTab, departuresPagination.pageSize, arrivalsPagination.pageSize, staysPagination.pageSize, fetchBookings, fetchSummaryData, fetchReadyForCheckTasks]);

    // Функции для обработки кликов по кнопкам пагинации
    const handlePageChange = useCallback((tab: 'departures' | 'arrivals' | 'stays', newPage: number) => {
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
    }, [selectedDate, departuresPagination, arrivalsPagination, staysPagination, fetchBookings]);

    // Функции для ручного обновления данных
    const refetchBookings = useCallback(() => {
        const currentPageSize = selectedTab === 'departures' ? departuresPagination.pageSize : selectedTab === 'arrivals' ? arrivalsPagination.pageSize : staysPagination.pageSize;
        const currentPage = selectedTab === 'departures' ? departuresPagination.currentPage : selectedTab === 'arrivals' ? arrivalsPagination.currentPage : staysPagination.currentPage;
        fetchBookings(selectedDate, selectedTab, currentPage, currentPageSize);
    }, [selectedDate, selectedTab, departuresPagination, arrivalsPagination, fetchBookings, staysPagination]);

    const refetchSummary = useCallback(() => {
        fetchSummaryData();
    }, [fetchSummaryData]);

    const refetchReadyForCheckTasks = useCallback(() => {
        fetchReadyForCheckTasks();
    }, [fetchReadyForCheckTasks]);

    return {
        departures,
        arrivals,
        stays,
        summaryData,
        readyForCheckTasks,
        departuresPagination,
        arrivalsPagination,
        staysPagination,
        isLoadingData,
        isLoadingSummary,
        error,
        summaryError,
        refetchBookings,
        refetchSummary,
        refetchReadyForCheckTasks,
        handlePageChange,
    };
};