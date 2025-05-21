'use client';

import React, { useState } from 'react';
import { Room, RoomType } from '@/lib/types';
import axios from 'axios';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
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


interface RoomFormData {
    number: string;
    floor: number;
    room_type: string;
    status: Room['status'];
    is_active: boolean;
    notes?: string; 
}

interface FieldErrors {
    [key: string]: string[];
}


const roomStatuses: { value: Room['status'], label: string }[] = [
    { value: 'free', label: 'Свободен' },
    { value: 'occupied', label: 'Занят' },
    { value: 'waiting_checkout', label: 'Ожидает выезда' },
    { value: 'dirty', label: 'Грязный' },
    { value: 'assigned', label: 'Назначен' },
    { value: 'in_progress', label: 'В процессе уборки' },
    { value: 'waiting_inspection', label: 'Ожидает проверки' },
    { value: 'clean', label: 'Чистый' },
    { value: 'on_maintenance', label: 'На обслуживании' },
];


const formSchema = z.object({
    number: z.string().min(1, { message: "Поле 'Номер комнаты' обязательно для заполнения." }),
    floor: z.coerce.number()
        .min(1, { message: "Этаж должен быть положительным числом." })
        .int({ message: "Этаж должен быть целым числом." }),
    room_type: z.string()
        .min(1, { message: "Поле 'Тип номера' обязательно для выбора." })
        .refine(val => !isNaN(parseInt(val)), { message: "Неверный формат типа номера." }), // Ensure it's a number string
    status: z.enum([
        'free', 'occupied', 'waiting_checkout', 'dirty',
        'assigned', 'in_progress', 'waiting_inspection', 'clean', 'on_maintenance'
    ], { message: "Поле 'Статус' обязательно для выбора." }),
    is_active: z.boolean(),
    notes: z.string().optional(),
});

interface RoomFormProps {
    roomToEdit?: Room;
    availableRoomTypes: RoomType[];
    onSuccess: () => void;
    onCancel: () => void;
}

export default function RoomForm({ roomToEdit, availableRoomTypes, onSuccess, onCancel }: RoomFormProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [generalError, setGeneralError] = useState<string | null>(null);

    
    const form = useForm<RoomFormData>({
        resolver: zodResolver(formSchema),
        defaultValues: roomToEdit ? {
            number: roomToEdit.number,
            floor: roomToEdit.floor || 1, 
            room_type: roomToEdit.room_type, 
            status: roomToEdit.status,
            is_active: roomToEdit.is_active,
            notes: roomToEdit.notes || '',
        } : {
            number: '',
            floor: 1,
            room_type: '', 
            status: 'free', 
            is_active: true,
            notes: '',
        },
    });

    // Handle form submission
    const onSubmit = async (data: RoomFormData) => {
        setIsLoading(true);
        setGeneralError(null); 

        try {
            let response;
            const dataToSend = {
                number: data.number,
                floor: data.floor,
                room_type: data.room_type,
                status: data.status,
                is_active: data.is_active,
                notes: data.notes,
            };

            if (roomToEdit) {
                response = await api.patch(`/api/rooms/${roomToEdit.id}/`, dataToSend);
                console.log(`Room ${roomToEdit.id} successfully updated.`);
            } else {
                response = await api.post('/api/rooms/', dataToSend);
                console.log("New room successfully created.");
            }

            if (response.status === 200 || response.status === 201) {
                onSuccess(); 
            } else {
                setGeneralError('Не удалось сохранить номер. Статус: ' + response.status);
                console.error("Failed to save room. Status:", response.status);
            }

        } catch (err) {
            console.error('Error saving booking:', err);
            if (axios.isAxiosError(err) && err.response) {
                 if (err.response.data && typeof err.response.data === 'object' && !err.response.data.detail && !err.response.data.message) {
                    console.error("Full error response:", err.response?.data);
                    const backendErrors = err.response.data as FieldErrors;
                    Object.keys(backendErrors).forEach(field => {
                        if (field in form.getValues()) {
                             form.setError(field as keyof RoomFormData, { 
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
                <h2 className="text-xl font-bold mb-4">{roomToEdit ? 'Редактировать номер' : 'Создать новый номер'}</h2>

                <FormField
                    control={form.control}
                    name="number"
                    render={({ field }) => (
                        <FormItem className="mb-4">
                            <FormLabel>Номер комнаты:</FormLabel>
                            <FormControl>
                                <Input {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="floor"
                    render={({ field }) => (
                        <FormItem className="mb-4">
                            <FormLabel>Этаж:</FormLabel>
                            <FormControl>
                                <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="room_type"
                    render={({ field }) => (
                        <FormItem className="mb-4">
                            <FormLabel>Тип номера:</FormLabel>
                            <Select onValueChange={value => field.onChange(parseInt(value))} value={field.value.toString()}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Выберите тип номера" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {availableRoomTypes.map(roomType => (
                                        <SelectItem key={roomType.id} value={roomType.id.toString()}>
                                            {roomType.name} ({roomType.capacity} мест)
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                        <FormItem className="mb-4">
                            <FormLabel>Статус:</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Выберите статус" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {roomStatuses.map(statusOption => (
                                        <SelectItem key={statusOption.value} value={statusOption.value}>
                                            {statusOption.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="is_active"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 mb-4">
                            <FormControl>
                                <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                                <FormLabel>
                                    Номер активен
                                </FormLabel>
                            </div>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                        <FormItem className="mb-6">
                            <FormLabel>Заметки:</FormLabel>
                            <FormControl>
                                <Textarea rows={3} {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {generalError && <p className="text-red-500 text-xs italic mb-4">{generalError}</p>}

                <div className="flex items-center justify-between">
                    <Button
                        type="submit"
                        disabled={isLoading}
                    >
                        {isLoading ? <Spinner size={16} className="mr-2" /> : null}
                        {isLoading ? 'Сохранение...' : (roomToEdit ? 'Сохранить изменения' : 'Создать номер')}
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
