'use client';

import React, { useState, useCallback, useMemo } from 'react';

import { useAuth } from '@/lib/AuthContext';
import { Spinner } from '@/components/spinner';
import ErrorMessage from '@/components/ErrorMessage';
import { Booking } from '@/lib/types';

// Импортируем новые компоненты
import FrontDeskHeader from '@/components/front-desk/FrontDeskHeader';
import FrontDeskSummaryCards from '@/components/front-desk/FrontDeskSummaryCards';
import BookingsTable from '@/components/front-desk/BookingsTable';
import BookingActionsSheet from '@/components/front-desk/BookingActionsSheet';
import ConfirmationDialog from '@/components/ConfirmationDialog';


// Импортируем хук для данных
import { useFrontDeskData } from '@/hooks/front-desk/useFrontDeskData';
import { useFrontdeskActions } from '@/hooks/front-desk/useFrontDeskActions';

import { getColumns } from '@/components/front-desk/columns';

export default function FrontDeskPage() {
   const { user, isLoading: isAuthLoading } = useAuth();

    const [selectedTab, setSelectedTab] = useState<'departures' | 'arrivals' | 'stays'>('departures');
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

    const [isPerformingAction, setIsPerformingAction] = useState<boolean>(false);
    const [isCreateSheetOpen, setIsCreateSheetOpen] = useState<boolean>(false);
    const [isConfirmDeleteModalOpen, setIsConfirmDeleteModalOpen] = useState<boolean>(false);
    const [bookingToDelete, setBookingToDelete] = useState<Booking | null>(null);
    const [bookingToDeleteNumber, setBookingToDeleteNumber] = useState<string | null>(null);
    const [bookingToEdit, setBookingToEdit] = useState<Booking | undefined>(undefined);

    // Используем хук для получения данных
    const {
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
    } = useFrontDeskData({ selectedDate, selectedTab, isPerformingAction, isCreateSheetOpen, isConfirmDeleteModalOpen });

        const {
        handleCheckout,
        handleCheckin,
        handleViewDetails,
        handleEditBooking,
        handleDeleteBookingClick,
        handleConfirmDelete,
        handleCancelDelete,
    } = useFrontdeskActions({
        refetchBookings,
        refetchSummary,
        refetchReadyForCheckTasks,
        isPerformingAction,
        setIsPerformingAction,
        isCreateSheetOpen,
        isConfirmDeleteModalOpen,
        setBookingToEdit,
        setIsCreateSheetOpen,
        setBookingToDelete,
        setBookingToDeleteNumber,
        setIsConfirmDeleteModalOpen,
    });

    // Единый флаг для отключения UI элементов
    const isDisabledUI = isLoadingData || isLoadingSummary || isPerformingAction || isCreateSheetOpen || isConfirmDeleteModalOpen;


    const handleCreateEditSuccess = useCallback(() => {
        setIsCreateSheetOpen(false);
        setBookingToEdit(undefined);
        refetchBookings();
        refetchSummary();
        refetchReadyForCheckTasks();
    }, [refetchBookings, refetchSummary, refetchReadyForCheckTasks]);

    const handleCreateCancel = useCallback(() => {
        setBookingToEdit(undefined);
        setIsCreateSheetOpen(false);
    }, []);

    const handleCreateBooking = useCallback(() => {
        if (isDisabledUI) return;
        setIsCreateSheetOpen(true);
    }, [isDisabledUI]);

   


    // --- Определение колонок для DataTable ---
    const columns = useMemo(() => getColumns({
        selectedTab,
        isDisabledUI,
        onViewDetails: handleViewDetails,
        onCheckout: handleCheckout,
        onCheckin: handleCheckin,
        onEdit: handleEditBooking,
        onDelete: handleDeleteBookingClick,
    }), [selectedTab, isDisabledUI, handleViewDetails, handleCheckout, handleCheckin, handleEditBooking, handleDeleteBookingClick]);

    const currentTableData = useMemo(() => {
      if (selectedTab === 'departures') return departures;
      if (selectedTab === 'arrivals') return arrivals;
      return stays;
    }, [selectedTab, departures, arrivals, stays]);

    const currentTablePagination = useMemo(() => {
      if (selectedTab === 'departures') return departuresPagination;
      if (selectedTab === 'arrivals') return arrivalsPagination;
      return staysPagination;
    }, [selectedTab, departuresPagination, arrivalsPagination, staysPagination]);


    if (isAuthLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Spinner />
            </div>
        );
    }

    if (!user || (user.role !== 'front-desk' && user.role !== 'manager')) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="p-8 rounded-lg shadow-lg max-w-md w-full text-center text-red-600 font-bold">
                    У вас нет прав для просмотра этой страницы. Доступно персоналу службы приема и менеджерам.
                </div>
            </div>
        );
    }

    if ((error || summaryError) && !isDisabledUI) {
        const errorMessage = error || summaryError;
        const handleRetry = () => {
            refetchBookings();
            refetchSummary();
            refetchReadyForCheckTasks();
        };

        return (
            <ErrorMessage
                message={errorMessage}
                onRetry={handleRetry}
                isLoading={isLoadingData || isLoadingSummary}
            />
        );
    }

    return (
        <div className="container mx-auto p-4">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Служба приема</h1>
            </div>

            <FrontDeskHeader
                selectedDate={selectedDate}
                onDateSelect={setSelectedDate}
                selectedTab={selectedTab}
                onTabChange={setSelectedTab}
                onCreateBooking={handleCreateBooking}
                isDisabled={isDisabledUI}
            />

            <FrontDeskSummaryCards
                summaryData={summaryData}
                readyForCheckTasks={readyForCheckTasks}
                isLoadingSummary={isLoadingSummary}
                summaryError={summaryError}
            />

            <BookingsTable
                data={currentTableData}
                columns={columns}
                isLoading={isLoadingData}
                selectedTab={selectedTab}
                pagination={currentTablePagination}
                onPageChange={handlePageChange}
                isPerformingAction={isPerformingAction}
            />

            <BookingActionsSheet
                isOpen={isCreateSheetOpen}
                onOpenChange={(open) => {
                    setIsCreateSheetOpen(open);
                    if (!open) {
                        setBookingToEdit(undefined);
                    }
                }}
                bookingToEdit={bookingToEdit}
                onSuccess={handleCreateEditSuccess}
                onCancel={handleCreateCancel}
            />

           <ConfirmationDialog
                isOpen={isConfirmDeleteModalOpen}
                onClose={handleCancelDelete}
                onConfirm={() => handleConfirmDelete(bookingToDelete)} 
                message={`Вы уверены, что хотите удалить бронирование для номера ${bookingToDeleteNumber || 'N/A'}?`}
                title="Подтверждение удаления"
                confirmButtonText="Удалить"
                isLoading={isPerformingAction}
                confirmButtonVariant="destructive"
            />
        </div>
    );
}