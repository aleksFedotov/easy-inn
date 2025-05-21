'use client';

import React, { useState, FormEvent } from 'react';
import { Zone } from '@/lib/types'; 
import axios from 'axios'; 
import api from '@/lib/api'; 


interface ZoneFormData {
    name: string;
    floor: number | ''; 
    description: string; 
}

interface FieldErrors {
    [key: string]: string[];
}

interface ZoneFormProps {
    zoneToEdit?: Zone;
    onSuccess: () => void;
    onCancel: () => void;
}

export default function ZoneForm({ zoneToEdit, onSuccess, onCancel }: ZoneFormProps) {
    const [formData, setFormData] = useState<ZoneFormData>(
        zoneToEdit ?
        { // Режим редактирования
            name: zoneToEdit.name,
            floor: zoneToEdit.floor || '', 
            description: zoneToEdit.description || '', 
        }
        :
        { // Режим создания
            name: '',
            floor: '',
            description: '',
        }
    );

    const [isLoading, setIsLoading] = useState(false); 
    const [generalError, setGeneralError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        const newValue = (name === 'floor' && value !== '') ? parseInt(value, 10) : value;

        setFormData(prevData => ({
            ...prevData,
            [name]: newValue
        }));
        
        setFieldErrors(prevErrors => {
            const newErrors = { ...prevErrors };
            delete newErrors[name];
            return newErrors;
        });
        setGeneralError(null);
    };

    // Обработчик отправки формы
    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();
        setIsLoading(true);
        setGeneralError(null);
        setFieldErrors({});

        
        const currentFieldErrors: FieldErrors = {}; 

        if (!formData.name) {
            currentFieldErrors.name = ['Поле "Название зоны" обязательно для заполнения.'];
        }
        // Валидация этажа: если указан, должен быть числом больше 0
        if (formData.floor !== '' && (typeof formData.floor !== 'number' || formData.floor <= 0)) {
             currentFieldErrors.floor = ['Этаж должен быть положительным числом.'];
         }
        
        if (Object.keys(currentFieldErrors).length > 0) {
            setFieldErrors(currentFieldErrors);
            setIsLoading(false);
            return; 
        }
        // --- Конец фронтенд валидации ---


        try {
            let response;
           
            const dataToSend = {
                 name: formData.name,
                 floor: formData.floor === '' ? null : Number(formData.floor), 
                 description: formData.description,
            };

            if (zoneToEdit) {
                 response = await api.patch(`/api/zones/${zoneToEdit.id}/`, dataToSend); 
                 console.log(`Зона ${zoneToEdit.id} успешно обновлена.`);

            } else {
                
                 response = await api.post('/api/zones/', dataToSend); 
                 console.log("Новая зона успешно создана.");
            }

            if (response.status === 200 || response.status === 201) {
                onSuccess(); 
            } else {
                 setGeneralError('Не удалось сохранить зону. Статус: ' + response.status);
                 console.error("Failed to save zone. Status:", response.status);
            }

        } catch (err) {
            console.error('Error saving zone:', err);
            if (axios.isAxiosError(err) && err.response) {
                
                if (err.response.data && typeof err.response.data === 'object' && !err.response.data.detail && !err.response.data.message) {
                    setFieldErrors(err.response.data as FieldErrors); 
                    setGeneralError('Пожалуйста, исправьте ошибки в форме.'); 
                } else {

                   setGeneralError(err.response.data.detail || err.response.data.message || JSON.stringify(err.response.data) || 'Ошибка при сохранении зоны.');
                }
            } else if (axios.isAxiosError(err) && err.request) {
                 setGeneralError('Нет ответа от сервера при сохранении зоны.');
            } else {
                setGeneralError('Произошла непредвиденная ошибка при сохранении зоны.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold mb-4">{zoneToEdit ? 'Редактировать зону' : 'Создать новую зону'}</h2>

            {/* Поле Название зоны */}
            <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
                    Название зоны:
                </label>
                <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required 
                    className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${fieldErrors.name ? 'border-red-500' : ''}`} 
                />
                {/* Отображение ошибок для поля username */}
                {fieldErrors.name && fieldErrors.name.map((msg, index) => (
                    <p key={index} className="text-red-500 text-xs italic mt-1">{msg}</p>
                ))}
            </div>

            {/* Поле Этаж */}
            <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="floor">
                    Этаж (опционально):
                </label>
                <input
                    type="number"
                    id="floor"
                    name="floor"
                    value={formData.floor}
                    onChange={handleChange}
                    min="1" 
                    className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${fieldErrors.floor ? 'border-red-500' : ''}`}
                />
                 {/* Отображение ошибок для поля first_name */}
                {fieldErrors.floor && fieldErrors.floor.map((msg, index) => (
                    <p key={index} className="text-red-500 text-xs italic mt-1">{msg}</p>
                ))}
            </div>

             {/* Поле Описание */}
             <div className="mb-6">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="description">
                    Описание (опционально):
                </label>
                <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={3}
                    className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline resize-none ${fieldErrors.description ? 'border-red-500' : ''}`} 
                />
                 {/* Отображение ошибок для поля last_name */}
                {fieldErrors.description && fieldErrors.description.map((msg, index) => (
                    <p key={index} className="text-red-500 text-xs italic mt-1">{msg}</p>
                ))}
            </div>


            {/* Отображение общей ошибки (если есть) */}
            {generalError && <p className="text-red-500 text-xs italic mb-4">{generalError}</p>}

            {/* Кнопки отправки и отмены */}
            <div className="flex items-center justify-between">
                <button
                    type="submit"
                    disabled={isLoading} // Отключаем кнопку во время загрузки
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50 disabled:cursor-not-allowed transition duration-200 ease-in-out"
                >
                    {isLoading ? 'Сохранение...' : (zoneToEdit ? 'Сохранить изменения' : 'Создать зону')}
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
