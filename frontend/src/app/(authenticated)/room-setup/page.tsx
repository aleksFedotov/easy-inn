'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/lib/AuthContext'; 
import { Spinner } from '@/components/spinner'; 
import RoomForm from '@/components/forms/RoomForm';
import RoomTypeForm from '@/components/forms/RoomTypeForm';
import Modal from '@/components/Modal';
import ConfirmationModal from '@/components/ConfirmationModal';
import ErrorMessage from '@/components/ErrorMessage'; 
import api from '@/lib/api'; 
import axios from 'axios'; 
import { RoomType, Room } from '@/lib/types'; 
import { Plus } from 'lucide-react';


export default function RoomSetupPage() {
  
    const { user, isLoading: isAuthLoading } = useAuth();

    
    const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
    const [rooms, setRooms] = useState<Room[]>([]);

    
    const [isLoadingData, setIsLoadingData] = useState(true); 
    const [error, setError] = useState<string | null>(null); 

    
    const [isRoomTypeFormOpen, setIsRoomTypeFormOpen] = useState(false);
    const [roomTypeToEdit, setRoomTypeToEdit] = useState<RoomType | undefined>(undefined);
    const [isRoomFormOpen, setIsRoomFormOpen] = useState(false);
    const [roomToEdit, setRoomToEdit] = useState<Room | undefined>(undefined);

    
    const [isRoomTypeConfirmModalOpen, setIsRoomTypeConfirmModalOpen] = useState(false);
    const [roomTypeToDeleteId, setRoomTypeToDeleteId] = useState<number | null>(null);
    const [roomTypeToDeleteName, setRoomTypeToDeleteName] = useState<string | null>(null);


    const [isRoomConfirmModalOpen, setIsRoomConfirmModalOpen] = useState(false);
    const [roomToDeleteId, setRoomToDeleteId] = useState<number | null>(null);
    const [roomToDeleteNumber, setRoomToDeleteNumber] = useState<string | null>(null);

    
    const [deletingRoomTypeId, setDeletingRoomTypeId] = useState<number | null>(null);
    const [deletingRoomId, setDeletingRoomId] = useState<number | null>(null);


    // Функция для загрузки типов номеров
    const fetchRoomTypes = useCallback(async () => {
        setError(null); // Сбрасываем ошибки перед загрузкой
        try {
            
            const response = await api.get<RoomType[]>('/api/room-types/', {
                params: {
                    all :true
                }
            }); 

            if (response.status === 200) {
                setRoomTypes(response.data);
                console.log("Room types fetched successfully:", response.data);
            } else {
                setError('Не удалось загрузить типы номеров. Статус: ' + response.status);
                console.error("Failed to fetch room types. Status:", response.status);
            }
        } catch (err) {
            console.error('Error fetching room types:', err);
            if (axios.isAxiosError(err) && err.response) {
                setError(err.response.data.detail || err.response.data.message || JSON.stringify(err.response.data) || 'Ошибка при загрузке типов номеров.');
            } else if (axios.isAxiosError(err) && err.request) {
                setError('Нет ответа от сервера при загрузке типов номеров.');
            } else {
                setError('Произошла непредвиденная ошибка при загрузке типов номеров.');
            }
        }
    }, []); 

    
    const fetchRooms = useCallback(async () => {
        setError(null); 
        try {
            
            const response = await api.get<Room[]>('/api/rooms/', {
                params: {
                    all :true
                }
            }); 

            if (response.status === 200) {
                setRooms(response.data);
                console.log("Rooms fetched successfully:", response.data);
            } else {
                setError('Не удалось загрузить список номеров. Статус: ' + response.status);
                console.error("Failed to fetch rooms. Status:", response.status);
            }
        } catch (err) {
            console.error('Error fetching rooms:', err);
            if (axios.isAxiosError(err) && err.response) {
                    setError(err.response.data.detail || err.response.data.message || JSON.stringify(err.response.data) || 'Ошибка при загрузке списка номеров.');
            } else if (axios.isAxiosError(err) && err.request) {
                    setError('Нет ответа от сервера при загрузке списка номеров.');
            } else {
                setError('Произошла непредвиденная ошибка при загрузке списка номеров.');
            }
        }
    }, []); 


    
    useEffect(() => {
    
        if (!isAuthLoading) {
        
        if (user?.role === 'manager') {
            setIsLoadingData(true); 
            setError(null);
            Promise.all([fetchRoomTypes(), fetchRooms()])
                .catch(err => {
                    
                    console.error("Error during parallel data fetching:", err);
                })
                .finally(() => {
                    setIsLoadingData(false);
                });
        } else {
            
            setIsLoadingData(false);
            setError('У вас нет прав для просмотра этой страницы. Доступно только менеджерам.');
        }
        }
    }, [user, isAuthLoading, fetchRoomTypes, fetchRooms]); 



    const handleCreateRoomType = () => {
        setIsRoomTypeFormOpen(true);
        setRoomTypeToEdit(undefined);
    };

    const handleEditRoomType = (roomType: RoomType) => {
        setIsRoomTypeFormOpen(true);
        setRoomTypeToEdit(roomType);
    };

    const handleCreateRoomTypeSuccess = () => {
        setIsRoomTypeFormOpen(false); 
        fetchRoomTypes();
        fetchRooms(); 
        };

    
        const handleCreateRoomTypeCancel = () => {
            setIsRoomTypeFormOpen(false); 
        };

    const handleDeleteRoomTypeClick = (roomTypeId: number, roomTypeName: string) => {
        if (deletingRoomTypeId !== null || deletingRoomId !== null || isRoomTypeFormOpen || isRoomFormOpen) return;
        setIsRoomTypeConfirmModalOpen(true);
        setRoomTypeToDeleteId(roomTypeId);
        setRoomTypeToDeleteName(roomTypeName)
    };

    const handleDeleteRoomTypeConfirm =async () => {
        if(roomTypeToDeleteId === null) return

        setDeletingRoomTypeId(roomTypeToDeleteId)

        try {
            const response = await api.delete(`api/room-types/${roomTypeToDeleteId}/`)
            if(response.status === 204){
        console.log(`Категория  ${roomTypeToDeleteName} успешна удалена.`);
        fetchRoomTypes()
        fetchRooms()
        } else {
            setError('Не удалось удалить категорию. Статус: ' + response.status);
            console.error("Failed to delete room type. Status:", response.status);
        }
        } catch (err) {
            console.error(`Error deleting roomtype with ID ${roomTypeToDeleteId} ${roomTypeToDeleteName}:`, err);
            if (axios.isAxiosError(err) && err.response) {
                
                setError(err.response.data.detail || err.response.data.message || JSON.stringify(err.response.data) || 'Ошибка при удалении пользователя.');
            } else if (axios.isAxiosError(err) && err.request) {
                setError('Нет ответа от сервера при удалении категории. Проверьте подключение.');
            } else {
                setError('Произошла непредвиденная ошибка при удалении категории.');
            }
        } finally {
        setRoomTypeToDeleteId(null)
        setRoomTypeToDeleteName(null)
        setDeletingRoomTypeId(null)
        setIsRoomTypeConfirmModalOpen(false)

        }
        
    };

    const handleDeletingRoomTypeCancel = () => {
        setRoomTypeToDeleteId(null)
        setRoomTypeToDeleteName(null)
        setIsRoomTypeConfirmModalOpen(false)
    }

    const handleCreateRoom = () => {
        setIsRoomFormOpen(true);
        setRoomToEdit(undefined);
    };

    const handleEditRoom = (room: Room) => {
        setIsRoomFormOpen(true);
        setRoomToEdit(room);
    };

    const handleCreateRoomSuccess = () => {
        setIsRoomFormOpen(false); 
        fetchRoomTypes();
        fetchRooms(); 
        };

    
    const handleCreateRoomCancel = () => {
        setIsRoomFormOpen(false); 
    };

    const handleDeleteRoomClick = (roomId: number, roomNumber: string) => {
        if (deletingRoomTypeId !== null || deletingRoomId !== null || isRoomTypeFormOpen || isRoomFormOpen) return;
        setIsRoomConfirmModalOpen(true);
        setRoomToDeleteId(roomId);
        setRoomToDeleteNumber(roomNumber)
    };

    const handleDeleteRoomConfirm =async () => {
        if(roomToDeleteId === null) return

        setDeletingRoomId(roomToDeleteId)

        try {
            const response = await api.delete(`api/rooms/${roomToDeleteId}/`)
            if(response.status === 204){
        console.log(`Номер  ${roomToDeleteNumber} успешно удален.`);
        fetchRoomTypes()
        fetchRooms()
        } else {
            setError('Не удалось удалить номер. Статус: ' + response.status);
            console.error("Failed to delete room. Status:", response.status);
        }
        } catch (err) {
            console.error(`Error deleting room with ID ${roomToDeleteId} ${roomToDeleteNumber}:`, err);
            if (axios.isAxiosError(err) && err.response) {
                
                setError(err.response.data.detail || err.response.data.message || JSON.stringify(err.response.data) || 'Ошибка при удалении пользователя.');
            } else if (axios.isAxiosError(err) && err.request) {
                setError('Нет ответа от сервера при удалении номера. Проверьте подключение.');
            } else {
                setError('Произошла непредвиденная ошибка при удалении номера.');
            }
        } finally {
        setRoomToDeleteId(null)
        setRoomToDeleteNumber(null)
        setDeletingRoomId(null)
        setIsRoomConfirmModalOpen(false)

        }
        
    };

    const handleDeletingRoomCancel = () => {
        setRoomToDeleteId(null)
        setRoomToDeleteNumber(null)
        setIsRoomConfirmModalOpen(false)
    }


    // --- Условный рендеринг ---


    if (isAuthLoading) {
        return null;
    }

    // Если у пользователя нет нужной роли (Manager), показываем сообщение об ошибке доступа
    if (!user || user.role !== 'manager') {
        return (
                <div className="flex items-center justify-center min-h-screen bg-gray-100">
                    <div className="p-8 rounded-lg shadow-lg bg-white max-w-md w-full text-center text-red-600 font-bold">
                        У вас нет прав для просмотра этой страницы. Доступно только менеджерам.
                    </div>
                </div>
        );
    }

        // Если данные загружаются, показываем спиннер
        if (isLoadingData) {
            return (
                <div className="flex items-center justify-center min-h-screen bg-gray-100">
                    <Spinner/>
                </div>
            );
        }

    // Если есть ошибка загрузки данных, показываем сообщение об ошибке с кнопкой "Повторить"
    if (error && !isRoomTypeFormOpen && !isRoomFormOpen && deletingRoomTypeId === null && deletingRoomId === null) {
        return (
            <ErrorMessage
                message={error}
                // При повторной попытке загружаем оба списка
                onRetry={() => {
                    setIsLoadingData(true); // Снова устанавливаем общую загрузку
                    Promise.all([fetchRoomTypes(), fetchRooms()])
                        .catch(err => console.error("Error during retry fetch:", err)) // Логируем ошибку, если Promise.all отклонен
                        .finally(() => setIsLoadingData(false)); // Завершаем общую загрузку
                }}
                isLoading={isLoadingData} // Передаем состояние общей загрузки
            />
        );
    }


    // Если все успешно загружено, отображаем списки
    return (
        <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">Настройка комнат</h1>

        {/* Секция "Типы номеров" */}
        <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-700">Типы номеров</h2>
                {/* Кнопка создания типа номера */}
                <button
                    onClick={handleCreateRoomType}
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-200 ease-in-out"
                >
                    <Plus size={18} className="inline mr-1"/> Создать тип номера
                </button>
            </div>

            {/* Таблица типов номеров */}
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
                <table className="min-w-full leading-normal">
                    <thead>
                        <tr>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Название
                            </th>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Вместимость
                            </th>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Описание
                            </th>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Действия
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {roomTypes.map(roomType => (
                            <tr key={roomType.id}>
                                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm text-gray-900">
                                    {roomType.name}
                                </td>
                                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm text-gray-900">
                                    {roomType.capacity}
                                </td>
                                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm text-gray-900">
                                    {roomType.description || 'Нет описания'}
                                </td>
                                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                    {/* Кнопки действий для типа номера */}
                                    <button
                                        onClick={() => handleEditRoomType(roomType)}
                                        className="text-blue-600 hover:text-blue-900 mr-3"
                                         disabled={isRoomTypeFormOpen || isRoomFormOpen || deletingRoomTypeId !== null || deletingRoomId !== null}
                                    >
                                        Редактировать
                                    </button>
                                    <button
                                        onClick={() => handleDeleteRoomTypeClick(roomType.id, roomType.name)}
                                        className="text-red-600 hover:text-red-900"
                                       disabled={deletingRoomTypeId === roomType.id || isRoomTypeFormOpen || isRoomFormOpen || deletingRoomId !== null}
                                    >
                                       {deletingRoomTypeId === roomType.id ? 'Удаление...' : 'Удалить'}
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {/* Сообщение, если список типов номеров пуст */}
                            {roomTypes.length === 0 && !isLoadingData && !error && (
                                <tr>
                                    <td colSpan={4} className="text-center text-gray-500 py-4">Типы номеров не найдены.</td>
                                </tr>
                            )}
                    </tbody>
                </table>
            </div>
        </div>

        {/* Секция "Номера" */}
        <div>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-700">Номера</h2>
                {/* Кнопка создания номера */}
                <button
                    onClick={handleCreateRoom}
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-200 ease-in-out"
                >
                    <Plus size={18} className="inline mr-1"/> Создать номер
                </button>
            </div>

            {/* Таблица номеров */}
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
                <table className="min-w-full leading-normal">
                    <thead>
                        <tr>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Номер
                            </th>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Этаж
                            </th>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Тип номера
                            </th>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Статус
                            </th>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Активен
                            </th>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Заметки
                            </th>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Действия
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {rooms.map(room => (
                            <tr key={room.id}>
                                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm text-gray-900">
                                    {room.number}
                                </td>
                                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm text-gray-900">
                                    {room.floor}
                                </td>
                                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm text-gray-900">
                                    {room.room_type_name || 'N/A'} 
                                </td>
                                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm text-gray-900">
                                    {room.status_display} {/* TODO: Отображать человекочитаемый статус, если доступен */}
                                </td>
                                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm text-gray-900">
                                    {room.is_active ? 'Да' : 'Нет'}
                                </td>
                                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm text-gray-900">
                                    {room.notes || 'Нет заметок'}
                                </td>
                                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                    {/* Кнопки действий для номера */}
                                    <button
                                        onClick={() => handleEditRoom(room)}
                                        className="text-blue-600 hover:text-blue-900 mr-3"
                                        // disabled={...} // TODO: Отключать кнопку во время выполнения действия
                                    >
                                        Редактировать
                                    </button>
                                    <button
                                        onClick={() => handleDeleteRoomClick(room.id, room.number)}
                                        className="text-red-600 hover:text-red-900"
                                        // disabled={...} // TODO: Отключать кнопку во время выполнения действия
                                    >
                                        Удалить
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {/* Сообщение, если список номеров пуст */}
                            {rooms.length === 0 && !isLoadingData && !error && (
                                <tr>
                                    <td colSpan={7} className="text-center text-gray-500 py-4">Номера не найдены.</td>
                                </tr>
                            )}
                    </tbody>
                </table>
            </div>
        </div>

        
        <Modal isOpen={isRoomTypeFormOpen} onClose={() => setIsRoomTypeFormOpen(false)} contentClasses="max-w-sm">
            <RoomTypeForm roomTypeToEdit={roomTypeToEdit} onSuccess={handleCreateRoomTypeSuccess} onCancel={handleCreateRoomTypeCancel}/>
        </Modal> 
        <Modal isOpen={isRoomFormOpen} onClose={() => setIsRoomFormOpen(false)} contentClasses="max-w-md">
            <RoomForm roomToEdit={roomToEdit} availableRoomTypes={roomTypes} onSuccess={handleCreateRoomSuccess} onCancel={handleCreateRoomCancel}/>
        </Modal> 
        <ConfirmationModal 
                isOpen={isRoomTypeConfirmModalOpen} 
                message={`Вы уверены, что хотите удалить категорию номера "${roomTypeToDeleteName}"`} 
                onConfirm={handleDeleteRoomTypeConfirm} 
                onCancel={handleDeletingRoomTypeCancel} 
                isLoading={!!deletingRoomTypeId}
        />
        <ConfirmationModal 
                isOpen={isRoomConfirmModalOpen} 
                message={`Вы уверены, что хотите удалить номер "${roomToDeleteNumber}"`} 
                onConfirm={handleDeleteRoomConfirm} 
                onCancel={handleDeletingRoomCancel} 
                isLoading={!!deletingRoomId}
            />

        </div>
    );
}
