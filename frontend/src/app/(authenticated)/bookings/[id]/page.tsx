'use client'
import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Spinner } from '@/components/spinner';
import ErrorMessage from '@/components/ErrorMessage';
import BookingForm from '@/components/forms/BookingForm';
import api from '@/lib/api';
import axios from 'axios';
import { Booking } from '@/lib/types';
import { Edit, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import ConfirmationDialog from '@/components/ConfirmationDialog';
// import ErrorDialog from '@/components/ErrorDialog';
import { 
    Sheet, 
    SheetContent, 
    SheetDescription, 
    SheetHeader, 
    SheetTitle, 
} from '@/components/ui/sheet';


export default function BookingDetailsPage() {
    const params = useParams<{ id: string }>();
    const bookingId = params.id;
    const router = useRouter();

    const { user, isLoading: isAuthLoading, isAuthenticated } = useAuth()

    const [bookingDetails, setBookingDetails] = useState<Booking | undefined>(undefined);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const [isEditSheetOpen, setIsEditSheetOpen] = useState<boolean>(false);

    // Состояния для управления удалением
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false); 
    const [isDeleting, setIsDeleting] = useState<boolean>(false); 


    const fetchBookingDetails = useCallback( async () => {
       setIsLoading(true);
       setError(null);


       if (!bookingId) {
           setError('ID бронирования не указан.');
           setIsLoading(false);
           return;
       }

       try {

           const response = await api.get<Booking>(`/api/bookings/${bookingId}/`);

           if (response.status === 200) {
               setBookingDetails(response.data); 

               console.log(`Booking details fetched successfully for ID: ${bookingId}`, response.data);
           } else {
               setError('Не удалось загрузить детали бронирования. Статус: ' + response.status);
               console.error("Failed to fetch booking details. Status:", response.status);
           }
       } catch (err) {
           console.error('Error fetching booking details:', err);
           if (axios.isAxiosError(err) && err.response) {
                setError(err.response.data.detail || err.response.data.message || JSON.stringify(err.response.data) || 'Ошибка при загрузке деталей бронирования.');
           } else if (axios.isAxiosError(err) && err.request) {
                setError('Нет ответа от сервера при загрузке деталей бронирования.');
           } else {
               setError('Произошла непредвиденная ошибка при загрузке деталей бронирования.');
           }
       } finally {
           setIsLoading(false);
       }
   },[bookingId]);


    // Эффект для загрузки данных бронирования при монтировании компонента или изменении bookingId
    useEffect(() => {

        if (!isAuthLoading && isAuthenticated && user && bookingId) {
            console.log("useEffect triggered: fetching booking details...");
            fetchBookingDetails();

        }

         if (!isAuthLoading && !isAuthenticated) {
             setError('Пользователь не аутентифицирован.');
             setIsLoading(false);
         }


    }, [bookingId, user, isAuthLoading,fetchBookingDetails,isAuthenticated]);


    // TODO: Добавить проверку роли, если доступ к деталям ограничен

   
    const handleEditClick = () => {
        setIsEditSheetOpen(true);
    };


    const handleFormSuccess = () => {
        setIsEditSheetOpen(false);
        fetchBookingDetails();
    };


    const handleFormCancel = () => {
        setIsEditSheetOpen(false);
    };

    const handleDeleteClick = () => {

        if (isDeleting || isEditSheetOpen) return;
        setIsDeleteModalOpen(true);
    }
    // Обработчик подтверждения удаления
    const handleDeleteConfirm = async () => {
        setIsDeleting(true); // Начинаем процесс удаления
        setError(null); // Сбрасываем ошибки

        if (!bookingId) {
             setError('ID бронирования не указан для удаления.');
             setIsDeleting(false);
             setIsDeleteModalOpen(false);
             return;
        }

        try {

            const response = await api.delete(`/api/bookings/${bookingId}/`);
            if (response.status === 204) {
                console.log(`Booking with ID ${bookingId} deleted successfully.`);
                router.push('/front-desk');
            } else {

                 setError('Не удалось удалить бронирование. Статус: ' + response.status);
                 console.error("Failed to delete booking. Status:", response.status);
                 setIsDeleteModalOpen(false);
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
            setIsDeleteModalOpen(false);
        } finally {
            setIsDeleting(false);
        }
    };

    // Обработчик отмены удаления
    const handleDeleteCancel = () => {
        setIsDeleteModalOpen(false);

    };



    // --- Условный рендеринг ---

    // Если AuthContext еще загружается или детали бронирования загружаются
    if (isAuthLoading || isLoading || isDeleting) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Spinner/>
            </div>
        );
    }

    // Если есть ошибка загрузки деталей
    if (error && !isDeleteModalOpen && !isEditSheetOpen && !isDeleting) {
        return (
            
           <ErrorMessage
               message={error} 
               onRetry={fetchBookingDetails} 
               isLoading={isLoading} 
           />
        );
    }


    // Если данные успешно загружены и доступны
    if (bookingDetails) {
        // Если не в режиме редактирования, рендерим детали
        return (
            <div className="container mx-auto p-4 max-w-2xl">
                <Card className="shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-2xl font-bold">
                            Детали бронирования #{bookingDetails.id}
                        </CardTitle>
                        <div className="flex space-x-2">
                            {/* Кнопка "Редактировать" */}
                            <Button
                                onClick={handleEditClick} 
                                className="flex items-center"
                                disabled={isDeleting}
                            >
                                <Edit size={16} className="mr-2"/> Редактировать
                            </Button>
                            {/* Кнопка "Удалить" */}
                           
                            <Button
                                variant="destructive"
                                className="flex items-center"
                                disabled={isDeleting || isEditSheetOpen}
                                onClick={handleDeleteClick}
                            >
                                <Trash2 size={16} className="mr-2"/> Удалить
                            </Button>
                               
                        </div>
                    </CardHeader>

                    <CardContent className="pt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <p className="mb-1"><strong>Номер комнаты:</strong> {bookingDetails.room.number}</p>
                                {/* Форматируем дату заезда в DD/MM/YYYY */}
                                <p className="mb-1"><strong>Дата заезда:</strong> {bookingDetails.check_in ? new Date(bookingDetails.check_in).toLocaleDateString('en-GB') : 'Не указана'}</p>
                                {/* Форматируем время заезда в HH:MM (24-часовой формат) */}
                                <p className="mb-1"><strong>Время заезда:</strong> {bookingDetails.check_in ? new Date(bookingDetails.check_in).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : 'Не указано'}</p>
                            </div>
                            <div>
                                {/* Форматируем дату выезда в DD/MM/YYYY */}
                                <p className="mb-1"><strong>Дата выезда:</strong> {bookingDetails.check_out ? new Date(bookingDetails.check_out).toLocaleDateString('en-GB') : 'Не указана'}</p>
                                {/* Форматируем время выезда в HH:MM (24-часовой формат) */}
                                <p className="mb-1"><strong>Время выезда:</strong> {bookingDetails.check_out ? new Date(bookingDetails.check_out).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : 'Не указано'}</p>
                                <p className="mb-1"><strong>Количество гостей:</strong> {bookingDetails.guest_count}</p>
                                <p className="mb-1"><strong>Статус бронирования:</strong> {bookingDetails.status_display}</p>
                            </div>
                        </div>

                        <div className="mt-6 border-t pt-4">
                            <p className="mb-2 text-lg font-semibold">Информация о создании и обновлении:</p>
                            <p className="mb-1"><strong>Создано:</strong> {bookingDetails.created_by_name || 'Неизвестно'}</p>
                            {/* Форматируем дату и время создания в локальный формат */}
                            <p className="mb-1"><strong>Дата создания:</strong> {bookingDetails.created_at ? new Date(bookingDetails.created_at).toLocaleString() : 'Не указана'}</p>
                            {/* Форматируем дату и время последнего обновления в локальный формат */}
                            <p className="mb-1"><strong>Последнее обновление:</strong> {bookingDetails.updated_at ? new Date(bookingDetails.updated_at).toLocaleString() : 'Не указано'}</p>
                        </div>

                        <div className="mt-6 border-t pt-4">
                            <p className="mb-2 text-lg font-semibold">Заметки:</p>
                            <div className="p-3 rounded-md border  whitespace-pre-wrap ">
                                {bookingDetails.notes || 'Нет заметок'}
                            </div>
                        </div>
                    </CardContent>
                </Card>
                   {/* Sheet для формы редактирования бронирования */}
                <Sheet open={isEditSheetOpen} onOpenChange={setIsEditSheetOpen}>
                    
                
                    <SheetContent className="sm:max-w-lg w-full">
                        <SheetHeader>
                            <SheetTitle>Редактировать бронирование</SheetTitle>
                            <SheetDescription>
                                Внесите изменения в данные бронирования.
                            </SheetDescription>
                        </SheetHeader>
                        <BookingForm
                            bookingToEdit={bookingDetails}
                            onSuccess={handleFormSuccess}
                            onCancel={handleFormCancel}
                        />
                    </SheetContent>
                </Sheet>


                <ConfirmationDialog
                    isOpen={isDeleteModalOpen}
                    onClose={() => handleDeleteCancel()}
                    onConfirm={handleDeleteConfirm}
                    message={`Вы уверены, что хотите удалить бронирование для номера ${bookingDetails.room.number || 'N/A'}?`}
                    title="Подтверждение удаления"
                    confirmButtonText="Удалить"
                    isLoading={!!isEditSheetOpen && !!isDeleteModalOpen}
                    confirmButtonVariant="destructive"
                
            />
            </div>
        );
     
    }

   
    

    // Если bookingId доступен, но bookingDetails null после загрузки (например, бронирование не найдено)
    if (!isLoading && !bookingDetails && bookingId) {
         return (
            <div className="flex items-center justify-center min-h-screen">
                <Card className="p-8 rounded-lg shadow-lg max-w-md w-full text-center font-bold">
                    Бронирование с ID {bookingId} не найдено.
                </Card>
            </div>
         );
    }

    // Запасной вариант, если что-то пошло не так и нет ни загрузки, ни ошибки, ни данных
     return (
        <div className="flex items-center justify-center min-h-screen ">
             <Card className="p-8 rounded-lg shadow-lg  max-w-md w-full text-center">
                 Неизвестная ошибка при загрузке страницы.
             </Card>
         </div>
     );
}
