'use client';

import React, { useState } from 'react';
import { RoomType } from '@/lib/types';
import axios from 'axios';
import api from '@/lib/api';

// Импорты для shadcn/ui и react-hook-form/zod
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Spinner } from '@/components/spinner';

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from 'zod';


interface RoomTypeFormData {
    name: string;
    capacity: number;
    description?: string; 
}


interface FieldErrors {
    [key: string]: string[];
}
// --- Zod Схема валидации ---
const formSchema = z.object({
    name: z.string().min(1, { message: "Поле 'Название типа номера' обязательно для заполнения." }),
    capacity: z.coerce.number() 
        .min(1, { message: "Поле 'Вместимость' обязательно и должно быть положительным числом." })
        .int({ message: "Вместимость должна быть целым числом." }),
    description: z.string().optional(), 
});

interface RoomTypeFormProps {
    roomTypeToEdit?: RoomType;
    onSuccess: () => void;
    onCancel: () => void;
}



export default function RoomTypeForm({ roomTypeToEdit, onSuccess, onCancel }: RoomTypeFormProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [generalError, setGeneralError] = useState<string | null>(null);

    
    const form = useForm<RoomTypeFormData>({
        resolver: zodResolver(formSchema),
        defaultValues: roomTypeToEdit ? {
            name: roomTypeToEdit.name,
            capacity: roomTypeToEdit.capacity,
            description: roomTypeToEdit.description || '',
        } : {
            name: '',
            capacity: 1, 
            description: '',
        },
    });

    // Обработчик отправки формы
    const onSubmit = async (data: RoomTypeFormData) => {
        setIsLoading(true);
        setGeneralError(null); 

        try {
            let response;
            const dataToSend = {
                name: data.name,
                capacity: data.capacity,
                description: data.description,
            };

            if (roomTypeToEdit) {
                
                response = await api.patch(`/api/room-types/${roomTypeToEdit.id}/`, dataToSend);
                console.log(`Тип номера ${roomTypeToEdit.id} успешно обновлен.`);
            } else {
               
                response = await api.post('/api/room-types/', dataToSend);
                console.log("Новый тип номера успешно создан.");
            }

            if (response.status === 200 || response.status === 201) {
                onSuccess(); 
            } else {
                setGeneralError('Не удалось сохранить тип номера. Статус: ' + response.status);
                console.error("Failed to save room type. Status:", response.status);
            }

        } catch (err) {
            console.error('Error saving booking:', err);
            if (axios.isAxiosError(err) && err.response) {
                 if (err.response.data && typeof err.response.data === 'object' && !err.response.data.detail && !err.response.data.message) {
                    console.error("Full error response:", err.response?.data);
                    const backendErrors = err.response.data as FieldErrors;
                    Object.keys(backendErrors).forEach(field => {
                        if (field in form.getValues()) {
                             form.setError(field as keyof RoomTypeFormData, { 
                                 type: 'backend',
                                 message: backendErrors[field].join(', '), 
                             });
                        } else {
                            setGeneralError(prev => prev ? `${prev}, ${field}: ${backendErrors[field].join(', ')}` : `${field}: ${backendErrors[field].join(', ')}`);
                        }
                    });
                     if (Object.keys(backendErrors).some(field => field in form.getValues())) {
                         setGeneralError(prev => prev || 'Пожалуйста, исправьте ошибки в форме.');
                     } else if (!generalError) {
                         setGeneralError('Произошла ошибка при сохранении бронирования.');
                     }

                } else {
                    setGeneralError(err.response.data.detail || err.response.data.message || JSON.stringify(err.response.data) || 'Ошибка при сохранении бронирования.');
                }
            } else if (axios.isAxiosError(err) && err.request) {
                 setGeneralError('Нет ответа от сервера при сохранении бронирования.');
            } else {
                setGeneralError('Произошла непредвиденная ошибка при сохранении бронирования.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-bold mb-4">{roomTypeToEdit ? 'Редактировать тип номера' : 'Создать новый тип номера'}</h2>

                {/* Поле Название типа номера */}
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem className="mb-4">
                            <FormLabel>Название типа номера:</FormLabel>
                            <FormControl>
                                <Input {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Поле Вместимость */}
                <FormField
                    control={form.control}
                    name="capacity"
                    render={({ field }) => (
                        <FormItem className="mb-4">
                            <FormLabel>Вместимость:</FormLabel>
                            <FormControl>
                                <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Поле Описание */}
                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem className="mb-6">
                            <FormLabel>Описание:</FormLabel>
                            <FormControl>
                                <Textarea rows={3} {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Отображение общей ошибки (если есть) */}
                {generalError && <p className="text-red-500 text-xs italic mb-4">{generalError}</p>}

                {/* Кнопки отправки и отмены */}
                <div className="flex items-center justify-between">
                    <Button
                        type="submit"
                        disabled={isLoading}
                    >
                        {isLoading ? <Spinner size={16} className="mr-2" /> : null}
                        {isLoading ? 'Сохранение...' : (roomTypeToEdit ? 'Сохранить изменения' : 'Создать тип номера')}
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onCancel}
                        disabled={isLoading}
                    >
                        Отмена
                    </Button>
                </div>
            </form>
        </Form>
    );
}
