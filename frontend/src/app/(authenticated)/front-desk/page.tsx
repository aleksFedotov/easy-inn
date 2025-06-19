'use client';

import React, { useState, useCallback, useMemo, useReducer } from 'react';

import { useAuth } from '@/context/AuthContext';
import { Spinner } from '@/components/spinner';
import ErrorMessage from '@/components/ErrorMessage';
;
import { USER_ROLES, TAB_TYPES } from '@/lib/constants';

// Импортируем новые компоненты
import FrontDeskHeader from '@/components/front-desk/FrontDeskHeader';
import FrontDeskSummaryCards from '@/components/front-desk/FrontDeskSummaryCards';
import BookingsTable from '@/components/front-desk/BookingsTable';
import BookingActionsSheet from '@/components/front-desk/BookingActionsSheet';
import ConfirmationDialog from '@/components/ConfirmationDialog';

import { uiReducer, initialUiState } from '@/reducers/FrontDeskReducer'; 

import { useFrontDeskData } from '@/hooks/front-desk/useFrontDeskData';
import { useFrontdeskActions } from '@/hooks/front-desk/useFrontDeskActions';

import { getColumns } from '@/components/front-desk/columns';

export default function FrontDeskPage() {
   const { user, isLoading: isAuthLoading } = useAuth();

    const [selectedTab, setSelectedTab] = useState<'departures' | 'arrivals' | 'stays'>('departures');
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

    const [uiState, dispatchUiAction] = useReducer(uiReducer, initialUiState);
    const {
        isPerformingAction,
        isCreateSheetOpen,
        isConfirmDeleteModalOpen,
        bookingToDelete,
        bookingToEdit,
    } = uiState;

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
        refetchAllData,
        handlePageChange,
    } = useFrontDeskData({ selectedDate, selectedTab });

        const {
        handleCheckout,
        handleCheckin,
        handleViewDetails,
        handleEditBooking,
        handleDeleteBookingClick,
        handleConfirmDelete,
        handleCancelDelete,
    } = useFrontdeskActions({
        refetchAllData,
        dispatchUiAction
    });


    const isDisabledUI = isLoadingData || isLoadingSummary || isPerformingAction || isCreateSheetOpen || isConfirmDeleteModalOpen;


    const handleCreateEditSuccess = useCallback(() => {
        dispatchUiAction({ type: 'ACTION_SUCCESS' });
        refetchAllData()
    }, [refetchAllData]);

    const handleCreateCancel = useCallback(() => {
        dispatchUiAction({ type: 'CLOSE_MODALS_AND_RESET_SELECTIONS' });
    }, []);

    const handleCreateBooking = useCallback(() => {
        if (isDisabledUI) return;
        dispatchUiAction({ type: 'OPEN_CREATE_SHEET' });
    }, [isDisabledUI]);

  
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
      if (selectedTab === TAB_TYPES.DEPARTURES) return departures;
      if (selectedTab === TAB_TYPES.ARRIVALS) return arrivals;
      return stays;
    }, [selectedTab, departures, arrivals, stays]);

    const currentTablePagination = useMemo(() => {
      if (selectedTab === TAB_TYPES.DEPARTURES) return departuresPagination;
      if (selectedTab === TAB_TYPES.ARRIVALS) return arrivalsPagination;
      return staysPagination;
    }, [selectedTab, departuresPagination, arrivalsPagination, staysPagination]);


    if (isAuthLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Spinner />
            </div>
        );
    }

    if (!user || (user.role !== USER_ROLES.FRONT_DESK && user.role !== USER_ROLES.MANAGER)) {
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
           refetchAllData()
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
                    if (!open) {
                       
                        dispatchUiAction({ type: 'CLOSE_MODALS_AND_RESET_SELECTIONS' });
                    } else {
                        
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
                message={`Вы уверены, что хотите удалить бронирование для номера ${bookingToDelete?.room?.number || 'N/A'}?`}
                title="Подтверждение удаления"
                confirmButtonText="Удалить"
                isLoading={isPerformingAction}
                confirmButtonVariant="destructive"
            />
        </div>
    );
}