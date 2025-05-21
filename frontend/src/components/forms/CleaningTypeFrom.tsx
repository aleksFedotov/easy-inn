'use client';

import React, { useState } from 'react';
import { CleaningType } from '@/lib/types';
import axios from 'axios';
import api from '@/lib/api';
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


interface CleaningTypeFormData {
    name: string;
    description?: string; 
}

const formSchema = z.object({
    name: z.string().min(1, { message: "Поле 'Название типа уборки' обязательно для заполнения." }),
    description: z.string().optional(),
});

interface CleaningTypeFormProps {
    cleaningTypeToEdit?: CleaningType;
    onSuccess: () => void;
    onCancel: () => void;
}

interface FieldErrors {
    [key: string]: string[];
}

export default function CleaningTypeForm({ cleaningTypeToEdit, onSuccess, onCancel }: CleaningTypeFormProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [generalError, setGeneralError] = useState<string | null>(null);

    
    const form = useForm<CleaningTypeFormData>({
        resolver: zodResolver(formSchema),
        defaultValues: cleaningTypeToEdit ? {
            name: cleaningTypeToEdit.name,
            description: cleaningTypeToEdit.description || '',
        } : {
            name: '',
            description: '',
        },
    });


    const onSubmit = async (data: CleaningTypeFormData) => {
        setIsLoading(true);
        setGeneralError(null);

        try {
            let response;
            const dataToSend = {
                name: data.name,
                description: data.description,
            };

            if (cleaningTypeToEdit) {
                // Edit mode: PATCH request
                response = await api.patch(`/api/cleaningtypes/${cleaningTypeToEdit.id}/`, dataToSend);
                console.log(`Cleaning type ${cleaningTypeToEdit.id} successfully updated.`);
            } else {
                // Create mode: POST request
                response = await api.post('/api/cleaningtypes/', dataToSend);
                console.log("New cleaning type successfully created.");
            }

            if (response.status === 200 || response.status === 201) {
                onSuccess(); // Call onSuccess on successful save
            } else {
                setGeneralError('Не удалось сохранить тип уборки. Статус: ' + response.status);
                console.error("Failed to save cleaning type. Status:", response.status);
            }

        } catch (err) {
            console.error('Error saving booking:', err);
            if (axios.isAxiosError(err) && err.response) {
                 if (err.response.data && typeof err.response.data === 'object' && !err.response.data.detail && !err.response.data.message) {
                    console.error("Full error response:", err.response?.data);
                    const backendErrors = err.response.data as FieldErrors;
                    Object.keys(backendErrors).forEach(field => {
                        if (field in form.getValues()) {
                             form.setError(field as keyof CleaningTypeFormData, { 
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
                <h2 className="text-xl font-bold mb-4">{cleaningTypeToEdit ? 'Редактировать тип уборки' : 'Создать новый тип уборки'}</h2>

                {/* Cleaning Type Name field */}
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem className="mb-4">
                            <FormLabel>Название типа уборки:</FormLabel>
                            <FormControl>
                                <Input {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Description field */}
                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem className="mb-6">
                            <FormLabel>Описание (опционально):</FormLabel>
                            <FormControl>
                                <Textarea rows={3} {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Display general error (if any) */}
                {generalError && <p className="text-red-500 text-xs italic mb-4">{generalError}</p>}

                {/* Submit and Cancel buttons */}
                <div className="flex items-center justify-between">
                    <Button
                        type="submit"
                        disabled={isLoading}
                    >
                        {isLoading ? <Spinner size={16} className="mr-2" /> : null}
                        {isLoading ? 'Сохранение...' : (cleaningTypeToEdit ? 'Сохранить изменения' : 'Создать тип уборки')}
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
