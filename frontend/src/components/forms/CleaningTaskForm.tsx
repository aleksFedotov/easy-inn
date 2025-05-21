'use client';

import React, { useState, FormEvent } from 'react';
// Импортируем типы для CleaningTask, Room, Zone, CleaningType, User
import { CleaningTask, Room, Zone, CleaningType, User } from '@/lib/types';
import axios from 'axios';
import api from '@/lib/api';
// import { Spinner } from '@/components/spinner'; 
import { CalendarDays, Clock, User as UserIcon, Tag, MapPin, FileText } from 'lucide-react';



interface CleaningTaskFormData {
    room: number | ''; 
    zone: number | ''; 
    cleaning_type: number | '';
    assigned_to: number | ''; 
    scheduled_date: string;
    due_time: string; 
    notes: string; 
}


interface CleaningTaskApiData {
    room?: number | null;
    zone?: number | null; 
    cleaning_type: number; 
    assigned_to?: number | null; 
    scheduled_date: string; 
    due_time?: string | null; 
    notes?: string | null; 
}

// Тип для ошибок валидации по полям, которые могут прийти с бэкенда
interface FieldErrors {
    [key: string]: string[];
}


interface CleaningTaskFormProps {
    cleaningTaskToEdit?: CleaningTask; // TODO: Реализовать режим редактирования позже
    availableRooms: Room[];
    availableZones: Zone[];
    availableCleaningTypes: CleaningType[];
    availableHousekeepers: User[]; 
    onSuccess: () => void;
    onCancel: () => void;
}

export default function CleaningTaskForm({
    cleaningTaskToEdit, // TODO: Использовать для режима редактирования
    availableRooms,
    availableZones,
    availableCleaningTypes,
    availableHousekeepers,
    onSuccess,
    onCancel
}: CleaningTaskFormProps) {

   
    const [formData, setFormData] = useState<CleaningTaskFormData>({
        room: '', 
        zone: '',
        cleaning_type: '', 
        assigned_to: '', 
        scheduled_date: new Date().toISOString().split('T')[0], // Сегодняшняя дата по умолчанию
        due_time: '', // Пустое время по умолчанию
        notes: '',
    });

    const [isLoading, setIsLoading] = useState(false); 
    const [generalError, setGeneralError] = useState<string | null>(null); 
    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({}); 

    // TODO: Если нужен режим редактирования, добавить useEffect для заполнения формы данными cleaningTaskToEdit

    // Обработчик изменения полей формы
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prevData => ({
            ...prevData,
            [name]: value
        }));
        
        setFieldErrors(prevErrors => {
            const newErrors = { ...prevErrors };
            delete newErrors[name];
            return newErrors;
        });
        
        setGeneralError(null);
    };


    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();
        setIsLoading(true);
        setGeneralError(null); 
        setFieldErrors({}); 

        // --- Фронтенд валидация перед отправкой ---
        const currentFieldErrors: FieldErrors = {};

        
        if (formData.room !== '' && formData.zone !== '') {
             currentFieldErrors.room = currentFieldErrors.room || [];
             currentFieldErrors.room.push('Выберите либо комнату, либо зону, но не обе.');
             currentFieldErrors.zone = currentFieldErrors.zone || [];
             currentFieldErrors.zone.push('Выберите либо комнату, либо зону, но не обе.');
        } else if (formData.room === '' && formData.zone === '') {
             currentFieldErrors.room = currentFieldErrors.room || [];
             currentFieldErrors.room.push('Выберите комнату или зону.');
             currentFieldErrors.zone = currentFieldErrors.zone || [];
             currentFieldErrors.zone.push('Выберите комнату или зону.');
        }

        
        if (formData.cleaning_type === '') {
            currentFieldErrors.cleaning_type = ['Выберите тип уборки.'];
        }

        
        if (formData.scheduled_date === '') {
            currentFieldErrors.scheduled_date = ['Укажите запланированную дату.'];
        }

        

        if (Object.keys(currentFieldErrors).length > 0) {
            setFieldErrors(currentFieldErrors);
            setIsLoading(false);
            return; 
        }
        // --- Конец фронтенд валидации ---


        try {
           
            const dataToSend: CleaningTaskApiData = {
                
                room: formData.room !== '' ? Number(formData.room) : null,
                zone: formData.zone !== '' ? Number(formData.zone) : null,
                cleaning_type: Number(formData.cleaning_type), // Преобразуем в число
                assigned_to: formData.assigned_to !== '' ? Number(formData.assigned_to) : null, 
                scheduled_date: formData.scheduled_date,
                due_time: formData.due_time !== '' ? `${formData.scheduled_date}T${formData.due_time}:00` : null, 
                notes: formData.notes !== '' ? formData.notes : null,
            };

            let response;

            if (cleaningTaskToEdit) {
                // TODO: Реализовать режим редактирования (PATCH запрос)
                // response = await api.patch(`/api/cleaning-tasks/${cleaningTaskToEdit.id}/`, dataToSend);
                // console.log(`Задача уборки ${cleaningTaskToEdit.id} успешно обновлена.`);
                 throw new Error("Режим редактирования задачи уборки пока не реализован."); // Временная заглушка
            } else {
                
                response = await api.post('/api/cleaningtasks/', dataToSend); 
                console.log("Новая задача уборки успешно создана.");
            }

            if (response.status === 200 || response.status === 201) { 
                onSuccess(); 
            } else {
                
                 setGeneralError('Не удалось сохранить задачу уборки. Статус: ' + response.status);
                 console.error("Failed to save cleaning task. Status:", response.status);
            }

        } catch (err) {
            console.error('Error saving cleaning task:', err);
            if (axios.isAxiosError(err) && err.response) {
               
                if (err.response.data && typeof err.response.data === 'object' && !err.response.data.detail && !err.response.data.message) {
                   
                    setFieldErrors(err.response.data as FieldErrors);
                    setGeneralError('Пожалуйста, исправьте ошибки в форме.'); 
                } else {
                  
                   setGeneralError(err.response.data.detail || err.response.data.message || JSON.stringify(err.response.data) || 'Ошибка при сохранении задачи уборки.');
                }
            } else if (axios.isAxiosError(err) && err.request) {
                 setGeneralError('Нет ответа от сервера при сохранении задачи уборки.');
            } else {
                setGeneralError('Произошла непредвиденная ошибка при сохранении задачи уборки.');
            }
        } finally {
            setIsLoading(false);
        }
    };


    return (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold mb-4">{cleaningTaskToEdit ? 'Редактировать задачу уборки' : 'Создать новую задачу уборки'}</h2>

             {/* Поле выбора Комнаты или Зоны */}
             <div className="mb-4">
                 <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="room_or_zone">
                     <MapPin size={16} className="inline mr-1"/> Местоположение (Комната или Зона):
                 </label>
                 {/* Используем два отдельных select или один с условной логикой */}
                 {/* Пока используем два select, где выбор одного отключает другой */}
                 <div className="flex space-x-4">
                     <div className="flex-1">
                         <select
                             id="room"
                             name="room"
                             value={formData.room}
                             onChange={handleChange}
                             disabled={formData.zone !== ''} 
                             className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline disabled:opacity-50 disabled:cursor-not-allowed ${fieldErrors.room ? 'border-red-500' : ''}`}
                         >
                             <option value="">Выберите комнату</option>
                             {availableRooms.map(room => (
                                 <option key={room.id} value={room.id}>{room.number}</option>
                             ))}
                         </select>
                     </div>
                      <div className="flex-1">
                         <select
                             id="zone"
                             name="zone"
                             value={formData.zone}
                             onChange={handleChange}
                             disabled={formData.room !== ''} 
                             className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline disabled:opacity-50 disabled:cursor-not-allowed ${fieldErrors.zone ? 'border-red-500' : ''}`}
                         >
                             <option value="">Выберите зону</option>
                             {availableZones.map(zone => (
                                 <option key={zone.id} value={zone.id}>{zone.name}</option>
                             ))}
                         </select>
                      </div>
                 </div>
                 {/* Отображение ошибок для полей room и zone */}
                 {(fieldErrors.room || fieldErrors.zone) && (fieldErrors.room || []).concat(fieldErrors.zone || []).map((msg, index) => (
                     <p key={index} className="text-red-500 text-xs italic mt-1">{msg}</p>
                 ))}
             </div>


            {/* Поле выбора Типа уборки */}
            <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="cleaning_type">
                    <Tag size={16} className="inline mr-1"/> Тип уборки:
                </label>
                <select
                    id="cleaning_type"
                    name="cleaning_type"
                    value={formData.cleaning_type}
                    onChange={handleChange}
                    required // Тип уборки обязателен
                    className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${fieldErrors.cleaning_type ? 'border-red-500' : ''}`}
                >
                    <option value="">Выберите тип уборки</option>
                    {availableCleaningTypes.map(type => (
                        <option key={type.id} value={type.id}>{type.name}</option>
                    ))}
                </select>
                 {/* Отображение ошибок для поля cleaning_type */}
                {fieldErrors.cleaning_type && fieldErrors.cleaning_type.map((msg, index) => (
                    <p key={index} className="text-red-500 text-xs italic mt-1">{msg}</p>
                ))}
            </div>

            {/* Поле выбора Назначенной горничной */}
            <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="assigned_to">
                    <UserIcon size={16} className="inline mr-1"/> Назначить горничной:
                </label>
                <select
                    id="assigned_to"
                    name="assigned_to"
                    value={formData.assigned_to}
                    onChange={handleChange}
                    // TODO: Сделать обязательным или опциональным в зависимости от бизнес-логики
                    className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${fieldErrors.assigned_to ? 'border-red-500' : ''}`}
                >
                    <option value="">Не назначена</option> {/* Опция "Не назначена" */}
                    {availableHousekeepers.map(housekeeper => (
                        <option key={housekeeper.id} value={housekeeper.id}>{housekeeper.first_name} {housekeeper.last_name || housekeeper.username}</option>
                    ))}
                </select>
                 {/* Отображение ошибок для поля assigned_to */}
                {fieldErrors.assigned_to && fieldErrors.assigned_to.map((msg, index) => (
                    <p key={index} className="text-red-500 text-xs italic mt-1">{msg}</p>
                ))}
            </div>


            {/* Поле Запланированная дата */}
            <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="scheduled_date">
                    <CalendarDays size={16} className="inline mr-1"/> Запланированная дата:
                </label>
                <input
                    type="date"
                    id="scheduled_date"
                    name="scheduled_date"
                    value={formData.scheduled_date}
                    onChange={handleChange}
                    required // Запланированная дата обязательна
                    className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${fieldErrors.scheduled_date ? 'border-red-500' : ''}`}
                />
                 {/* Отображение ошибок для поля scheduled_date */}
                {fieldErrors.scheduled_date && fieldErrors.scheduled_date.map((msg, index) => (
                    <p key={index} className="text-red-500 text-xs italic mt-1">{msg}</p>
                ))}
            </div>

            {/* Поле Время выполнения */}
            <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="due_time">
                    <Clock size={16} className="inline mr-1"/> Время выполнения (до):
                </label>
                <input
                    type="time"
                    id="due_time"
                    name="due_time"
                    value={formData.due_time}
                    onChange={handleChange}
                    // TODO: Сделать обязательным или опциональным
                    className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${fieldErrors.due_time ? 'border-red-500' : ''}`}
                />
                 {/* Отображение ошибок для поля due_time */}
                {fieldErrors.due_time && fieldErrors.due_time.map((msg, index) => (
                    <p key={index} className="text-red-500 text-xs italic mt-1">{msg}</p>
                ))}
            </div>

            {/* Поле Заметки */}
            <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="notes">
                    <FileText size={16} className="inline mr-1"/> Заметки:
                </label>
                <textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    rows={4} // Увеличиваем количество строк для удобства ввода
                    className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${fieldErrors.notes ? 'border-red-500' : ''}`}
                />
                 {/* Отображение ошибок для поля notes */}
                {fieldErrors.notes && fieldErrors.notes.map((msg, index) => (
                    <p key={index} className="text-red-500 text-xs italic mt-1">{msg}</p>
                ))}
            </div>


            {/* Отображение общей ошибки (если есть) */}
            {generalError && <p className="text-red-500 text-xs italic mb-4 text-center">{generalError}</p>}

            {/* Кнопки отправки и отмены */}
            <div className="flex items-center justify-between">
                <button
                    type="submit"
                    disabled={isLoading} // Отключаем кнопку во время загрузки
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50 disabled:cursor-not-allowed transition duration-200 ease-in-out"
                >
                    {isLoading ? 'Сохранение...' : (cleaningTaskToEdit ? 'Сохранить изменения' : 'Создать задачу')}
                </button>
                <button
                    type="button" // Важно: тип "button", чтобы не отправлять форму
                    onClick={onCancel}
                    disabled={isLoading}
                    className="inline-block align-baseline font-bold text-sm text-gray-500 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Отмена
                </button>
            </div>
        </form>
    );
}
