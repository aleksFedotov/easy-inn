import {  useCallback } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import axios from 'axios';
import { toast } from 'sonner';
import { Booking } from '@/lib/types'; // Убедитесь, что тип Booking доступен

interface UseFrontdeskActionsProps {
  refetchBookings: () => void;
  refetchSummary: () => void;
  refetchReadyForCheckTasks: () => void;
  // Флаги из useFrontDeskData, которые влияют на возможность выполнения действий
  isPerformingAction: boolean;
  setIsPerformingAction: React.Dispatch<React.SetStateAction<boolean>>;
  isCreateSheetOpen: boolean;
  isConfirmDeleteModalOpen: boolean;
  setBookingToEdit: React.Dispatch<React.SetStateAction<Booking | undefined>>;
  setIsCreateSheetOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setBookingToDelete: React.Dispatch<React.SetStateAction<Booking | null>>;
  setBookingToDeleteNumber: React.Dispatch<React.SetStateAction<string | null>>;
  setIsConfirmDeleteModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

interface UseFrontdeskReturn {
  handleCheckout: (bookingId: number, roomNumber: string) => Promise<void>;
  handleCheckin: (bookingId: number, roomNumber: string) => Promise<void>;
  handleViewDetails: (bookingId: number) => void;
  handleEditBooking: (booking: Booking) => void;
  handleDeleteBookingClick: (booking: Booking) => void;
  handleConfirmDelete: (booking: Booking | null) => Promise<void>;
  handleCancelDelete: () => void;
}

export const useFrontdeskActions = ({
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
}: UseFrontdeskActionsProps): UseFrontdeskReturn => {
  const router = useRouter();

  // Общая функция для обработки успешных операций, которая вызывает refetch всех связанных данных
  const handleOperationSuccess = useCallback(() => {
    refetchBookings();
    refetchSummary();
    refetchReadyForCheckTasks();
  }, [refetchBookings, refetchSummary, refetchReadyForCheckTasks]);

  // Проверяет, можно ли выполнить действие, основываясь на глобальных флагах
  const canPerformAction = useCallback(() => {
    console.log('Checking if action can be performed:', {
      isPerformingAction, 
      isCreateSheetOpen,
      isConfirmDeleteModalOpen
    });
    return !(isPerformingAction || isCreateSheetOpen || isConfirmDeleteModalOpen);
  }, [isPerformingAction, isCreateSheetOpen, isConfirmDeleteModalOpen]);


  const handleCheckout = useCallback(async (bookingId: number, roomNumber: string) => {
    if (!canPerformAction()) return;

    setIsPerformingAction(true);
    try {
      const response = await api.post(`/api/bookings/${bookingId}/check_out/`);
      if (response.status === 200) {
        toast.success(`Выезд из номера ${roomNumber} успешно отмечен.`);
        handleOperationSuccess();
      } else {
        toast.error(`Не удалось отметить выезд номера ${roomNumber}. Статус: ${response.status}`);
      }
    } catch (err) {
      console.error('Error during check-out:', err);
      let errorMessage = 'Ошибка при выполнении выезда.';
      if (axios.isAxiosError(err) && err.response) {
        errorMessage = err.response.data.detail || err.response.data.message || JSON.stringify(err.response.data);
      } else if (axios.isAxiosError(err) && err.request) {
        errorMessage = 'Нет ответа от сервера при выполнении выезда.';
      }
      toast.error(errorMessage);
    } finally {
      setIsPerformingAction(false);
    }
  }, [canPerformAction, setIsPerformingAction, handleOperationSuccess]);

  const handleCheckin = useCallback(async (bookingId: number, roomNumber: string) => {
    if (!canPerformAction()) return;

    setIsPerformingAction(true);
    try {
      const response = await api.post(`/api/bookings/${bookingId}/check_in/`);
      if (response.status === 200) {
        toast.success(`Заезд в номер ${roomNumber} успешно отмечен.`);
        handleOperationSuccess();
      } else {
        toast.error(`Не удалось отметить заезд номера ${roomNumber}. Статус: ${response.status}`);
      }
    } catch (err) {
      console.error('Error during check-in:', err);
      let errorMessage = 'Ошибка при выполнении заезда.';
      if (axios.isAxiosError(err) && err.response) {
        errorMessage = err.response.data.detail || err.response.data.message || JSON.stringify(err.response.data);
      } else if (axios.isAxiosError(err) && err.request) {
        errorMessage = 'Нет ответа от сервера при выполнении заезда.';
      }
      toast.error(errorMessage);
    } finally {
      setIsPerformingAction(false);
    }
  }, [canPerformAction, setIsPerformingAction, handleOperationSuccess]);

  const handleViewDetails = useCallback((bookingId: number) => {
    if (!canPerformAction()) return;
    router.push(`/bookings/${bookingId}`);
  }, [canPerformAction, router]);

  const handleEditBooking = useCallback((booking: Booking) => {
    if (!canPerformAction()) return;
    setBookingToEdit(booking);
    setIsCreateSheetOpen(true);
  }, [canPerformAction, setBookingToEdit, setIsCreateSheetOpen]);

  const handleDeleteBookingClick = useCallback((booking: Booking) => {
    if (!canPerformAction()) return;
    setBookingToDelete(booking);
    setBookingToDeleteNumber(booking.room?.number || null);
    setIsConfirmDeleteModalOpen(true);
  }, [canPerformAction, setBookingToDelete, setBookingToDeleteNumber, setIsConfirmDeleteModalOpen]);

  const handleCancelDelete = useCallback(() => {
    setBookingToDelete(null);
    setBookingToDeleteNumber(null);
    setIsConfirmDeleteModalOpen(false);
  }, [setBookingToDelete, setBookingToDeleteNumber, setIsConfirmDeleteModalOpen]);

  const handleConfirmDelete = useCallback(async (booking: Booking | null) => {
    if (!booking || !canPerformAction()) return; 
    console.log('handleConfirmDelete called with booking:', booking);
    setIsPerformingAction(true);
    try {
      const response = await api.delete(`/api/bookings/${booking.id}/`);
      console.log('Delete response:', response);  
      if (response.status === 204) {
        toast.success(`Бронирование для номера ${booking.room?.number || 'N/A'} успешно удалено.`);
        handleOperationSuccess();
        handleCancelDelete();
      } else {
        toast.error('Не удалось удалить бронирование. Статус: ' + response.status);
      }
    } catch (err) {
      console.error('Error during booking deletion:', err);
      let errorMessage = 'Ошибка при удалении бронирования.';
      if (axios.isAxiosError(err) && err.response) {
        errorMessage = err.response.data.detail || err.response.data.message || JSON.stringify(err.response.data);
      } else if (axios.isAxiosError(err) && err.request) {
        errorMessage = 'Нет ответа от сервера при удалении бронирования.';
      }
      toast.error(errorMessage);
    } finally {
      setIsPerformingAction(false);
    }
  }, [canPerformAction, setIsPerformingAction, handleOperationSuccess, handleCancelDelete]);


  return {
    handleCheckout,
    handleCheckin,
    handleViewDetails,
    handleEditBooking,
    handleDeleteBookingClick,
    handleConfirmDelete,
    handleCancelDelete,
  };
};