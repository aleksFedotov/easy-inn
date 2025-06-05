import {  useCallback } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import axios from 'axios';
import { toast } from 'sonner';
import { Booking } from '@/lib/types';
import { UiAction } from '@/reducers/FrontDeskReducer';


interface UseFrontdeskActionsProps {
  refetchAllData: () => void;
  dispatchUiAction: React.Dispatch<UiAction>;
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
  refetchAllData,
  dispatchUiAction,
}: UseFrontdeskActionsProps): UseFrontdeskReturn => {
  const router = useRouter();

  // Общая функция для обработки успешных операций, которая вызывает refetch всех связанных данных
  const handleOperationSuccess = useCallback(() => {
      refetchAllData()
  }, [refetchAllData]);




  const handleCheckout = useCallback(async (bookingId: number, roomNumber: string) => {
   

    dispatchUiAction({ type: 'SET_PERFORMING_ACTION', payload: true });

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
      dispatchUiAction({ type: 'SET_PERFORMING_ACTION', payload: false });
    }
  }, [dispatchUiAction, handleOperationSuccess]);

  const handleCheckin = useCallback(async (bookingId: number, roomNumber: string) => {
   

    dispatchUiAction({ type: 'SET_PERFORMING_ACTION', payload: true });
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
      dispatchUiAction({ type: 'SET_PERFORMING_ACTION', payload: false });
    }
  }, [dispatchUiAction, handleOperationSuccess]);

  const handleViewDetails = useCallback((bookingId: number) => {
    router.push(`/bookings/${bookingId}`);
  }, [router]);

  const handleEditBooking = useCallback((booking: Booking) => {
    dispatchUiAction({ type: 'OPEN_EDIT_SHEET', payload: booking });
  }, [dispatchUiAction]);

  const handleDeleteBookingClick = useCallback((booking: Booking) => {
    dispatchUiAction({ type: 'OPEN_DELETE_MODAL', payload: booking });
  }, [dispatchUiAction]);

  const handleCancelDelete = useCallback(() => {
    dispatchUiAction({ type: 'CLOSE_MODALS_AND_RESET_SELECTIONS' });
  }, [dispatchUiAction]);

  const handleConfirmDelete = useCallback(async (booking: Booking | null) => {
    if (!booking) return; 
    dispatchUiAction({ type: 'SET_PERFORMING_ACTION', payload: true });
    try {
      const response = await api.delete(`/api/bookings/${booking.id}/`);
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
      dispatchUiAction({ type: 'SET_PERFORMING_ACTION', payload: true });
    }
  }, [dispatchUiAction, handleOperationSuccess, handleCancelDelete]);


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