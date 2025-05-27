'use client';

import React, { useState, useEffect } from 'react';
import { Booking, Room } from '@/lib/types';
import axios from 'axios';
import api from '@/lib/api';
import { Spinner } from '../spinner';


import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { DateTimePicker } from '../ui/datetime-picker';


import {  Users, NotebookPen, BedDouble } from 'lucide-react';

import { format } from 'date-fns';


// --- Zod Схема валидации ---

const formSchema = z.object({
    room_id: z.coerce
        .number({
            required_error: "Поле 'Номер комнаты' обязательно для заполнения.", 
            invalid_type_error: "Поле 'Номер комнаты' должно быть числом.", 
        })
        .int("Номер комнаты должен быть целым числом.") 
        .positive("Номер комнаты должен быть положительным."),
    check_in_datetime: z.date({
        required_error: "Поле 'Дата и время заезда' обязательно для заполнения.",
    }),
    check_out_datetime: z.date({
        required_error: "Поле 'Дата и время выезда' обязательно для заполнения.",
    }),
    guest_count: z.coerce 
        .number({
            required_error: "Поле 'Количество гостей' обязательно для заполнения.",
            invalid_type_error: "Поле 'Количество гостей' должно быть числом.",
        })
        .int("Количество гостей должно быть целым числом.")
        .positive("Количество гостей должно быть положительным числом."),
    notes: z.string().optional(), 
}).superRefine((data, ctx) => { 
    if (data.check_out_datetime && data.check_in_datetime && data.check_out_datetime <= data.check_in_datetime) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Дата и время выезда должны быть позже даты и времени заезда.',
            path: ['check_out_datetime'],
        });
    }
});

// Тип для данных формы, выведенный из Zod схемы
type BookingFormValues = z.infer<typeof formSchema>;

// Тип для данных, отправляемых на API при обновлении/создании бронирования
interface BookingApiData {
    room_id?: number;
    check_in?: string;
    check_out?: string;
    guest_count?: number;
    notes?: string;
}

// Тип для ошибок валидации по полям, которые могут прийти с бэкенда
interface FieldErrors {
    [key: string]: string[];
}


interface BookingFormProps {
    bookingToEdit?: Booking;
    onSuccess: () => void;
    onCancel: () => void;
}

export default function BookingForm({ bookingToEdit, onSuccess, onCancel }: BookingFormProps) {

    const [isLoading, setIsLoading] = useState(false);
    const [generalError, setGeneralError] = useState<string | null>(null);

    // Состояние для списка доступных комнат (для выпадающего списка)
    const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
    const [isLoadingRooms, setIsLoadingRooms] = useState(true);
    const [roomsError, setRoomsError] = useState<string | null>(null);

    // --- Инициализация формы с помощью react-hook-form ---
    const form = useForm<BookingFormValues>({
        resolver: zodResolver(formSchema), // Используем zodResolver для валидации по схеме
        defaultValues: bookingToEdit ?
            { 
                room_id: bookingToEdit.room.id,
                check_in_datetime: bookingToEdit.check_in ? new Date(bookingToEdit.check_in) : undefined,
                check_out_datetime: bookingToEdit.check_out ? new Date(bookingToEdit.check_out) : undefined,
                guest_count: bookingToEdit.guest_count || 1,
                notes: bookingToEdit.notes || '',
            }
            :
            { 
                room_id: 0, // Инициализируем 0, Zod .positive() пометит как ошибку
                check_in_datetime: (() => {
                    const now = new Date();
                    now.setHours(14, 0, 0, 0); // 14:00
                    return now;
                })(),
                    check_out_datetime: (() => {
                    const now = new Date();
                    now.setHours(12, 0, 0, 0); // 12:00
                    return now;
                })(),
                guest_count: 0, // Инициализируем 0, Zod .positive() пометит как ошибку
                notes: '',
            },
    });

    // Эффект для загрузки списка доступных комнат при монтировании компонента
    useEffect(() => {
        const fetchRooms = async () => {
            setIsLoadingRooms(true);
            setRoomsError(null);
            try {
                const response = await api.get<Room[]>('/api/rooms/', {
                    params: {
                        all: true
                    }
                });

                if (response.status === 200) {
                    setAvailableRooms(response.data);
                    console.log("Room list fetched successfully for BookingForm.", response.data);
                } else {
                    setRoomsError('Не удалось загрузить список комнат. Статус: ' + response.status);
                    console.error("Failed to fetch room list for BookingForm. Status:", response.status);
                }
            } catch (err) {
                console.error('Error fetching room list for BookingForm:', err);
                if (axios.isAxiosError(err) && err.response) {
                    setRoomsError(err.response.data.detail || err.response.data.message || JSON.stringify(err.response.data) || 'Ошибка при загрузке списка комнат.');
                } else if (axios.isAxiosError(err) && err.request) {
                    setRoomsError('Нет ответа от сервера при загрузке списка комнат.');
                } else {
                    setRoomsError('Произошла непредвиденная ошибка при загрузке списка комнат.');
                }
            } finally {
                setIsLoadingRooms(false);
            }
        };
        fetchRooms();
    }, []);

    // --- Обработчик отправки формы (используем onSubmit из react-hook-form) ---
    const onSubmit = async (values: BookingFormValues) => {
        setIsLoading(true);
        setGeneralError(null);

        // --- Дополнительная валидация вместимости номера (после Zod валидации) ---
        const selectedRoom = availableRooms.find(room => room.id === values.room_id);
        if (selectedRoom && selectedRoom.room_capacity !== undefined && values.guest_count > selectedRoom.room_capacity) {
            form.setError('guest_count', { 
                type: 'manual',
                message: `Количество гостей (${values.guest_count}) превышает вместимость номера (${selectedRoom.room_capacity}).`,
            });
            setIsLoading(false);
            return; 
        }
        // --- Конец дополнительной валидации ---


        try {
            let response;
            const dataToSend: BookingApiData = {
                room_id: Number(values.room_id), 
                check_in: values.check_in_datetime ? format(values.check_in_datetime, "yyyy-MM-dd'T'HH:mm:ss") : undefined,
                check_out: values.check_out_datetime ? format(values.check_out_datetime, "yyyy-MM-dd'T'HH:mm:ss") : undefined,
                guest_count: values.guest_count, 
                notes: values.notes || '', 
            };
           

            if (bookingToEdit) {
                response = await api.patch(`/api/bookings/${bookingToEdit.id}/`, dataToSend);
                console.log(`Бронирование ${bookingToEdit.id} успешно обновлено.`);
            } else {
                response = await api.post('/api/bookings/', dataToSend);
                console.log("Новое бронирование успешно создано.");
            }

            if (response.status === 200 || response.status === 201) {
                onSuccess();
            } else {
                setGeneralError('Не удалось сохранить бронирование. Статус: ' + response.status);
                console.error("Failed to save booking. Status:", response.status);
            }

        } catch (err) {
            console.error('Error saving booking:', err);
            if (axios.isAxiosError(err) && err.response) {
                 if (err.response.data && typeof err.response.data === 'object' && !err.response.data.detail && !err.response.data.message) {
                    console.error("Full error response:", err.response?.data);
                    const backendErrors = err.response.data as FieldErrors;
                    Object.keys(backendErrors).forEach(field => {
                        if (field in form.getValues()) {
                             form.setError(field as keyof BookingFormValues, { 
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

    // Если список комнат еще загружается или произошла ошибка загрузки комнат
    if (isLoadingRooms) {
        return (
            <div className="flex justify-center items-center h-32">
                <Spinner />
            </div>
        );
    }

    if (roomsError) {
        return (
            <div className="text-red-500 text-center">Ошибка загрузки списка комнат: {roomsError}</div>
        );
    }


    return (
        // Используем компонент Form из shadcn/ui и передаем методы из useForm
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 p-4">
                <h2 className="text-xl font-bold mb-4">{bookingToEdit ? `Редактировать бронирование #${bookingToEdit.id}` : 'Создать новое бронирование'}</h2>

                {/* Поле Номер комнаты (Select) */}
                <FormField
                    control={form.control}
                    name="room_id"
                    render={({ field }) => (
                        <FormItem className="mb-4">
                            <FormLabel><BedDouble size={16} className="inline mr-1" /> Номер комнаты:</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value === 0 ? undefined : String(field.value)}> 
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Выберите номер" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                    
                                    {availableRooms.map(room => (
                                        <SelectItem key={room.id} value={String(room.id)}>
                                            {room.number} ({room.room_type_name})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage /> 
                        </FormItem>
                    )}
                />

               {/*Дата и время заезда */}
                <DateTimePicker
                    name="check_in_datetime"
                    label="Дата и время заезда"
                />

                {/* Дата и время выезда */}
                <DateTimePicker
                    name="check_out_datetime"
                    label="Дата и время выезда"
                />


                {/* Количество гостей */}
                <FormField
                    control={form.control}
                    name="guest_count"
                    render={({ field }) => (
                        <FormItem className="mb-4">
                            <FormLabel><Users size={16} className="inline mr-1" /> Количество гостей:</FormLabel>
                            <FormControl>
                                <Input
                                    type="number"
                                    {...field}
                                    value={field.value === 0 ? '' : String(field.value)}
                                    onChange={e => {
                                        const value = e.target.value;
                                        field.onChange(value === '' ? 0 : Number(value));
                                    }}
                                />
                            </FormControl>
                            <FormMessage /> 
                        </FormItem>
                    )}
                />

                {/*  Заметки */}
                <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                        <FormItem className="mb-6">
                            <FormLabel><NotebookPen size={16} className="inline mr-1" /> Заметки:</FormLabel>
                            <FormControl>
                                <Textarea rows={4} {...field} /> 
                            </FormControl>
                            <FormMessage /> 
                        </FormItem>
                    )}
                />

                {/* Отображение общей ошибки (если есть) */}
                {generalError && <p className="text-red-500 text-xs italic mb-4 text-center">{generalError}</p>}

                {/* Кнопки отправки и отмены */}
                <div className="flex items-center justify-between">
                    <Button type="submit" disabled={isLoading}>
                        {isLoading ? 'Сохранение...' : (bookingToEdit ? 'Сохранить изменения' : 'Создать бронирование')}
                    </Button>
                    <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}> {/* Используем variant="outline" для кнопки отмены */}
                        Отмена
                    </Button>
                </div>
            </form>
        </Form>
    );
}
