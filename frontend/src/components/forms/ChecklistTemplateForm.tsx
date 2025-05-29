'use client';

import React, { useState } from 'react';
import { Checklist } from '@/lib/types';
import axios from 'axios';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from 'zod';
import { Trash2, Plus } from 'lucide-react';
import { cleaningTypeOptions, CLEANING_TYPE_VALUES } from '@/lib/constants';


const CleaningTypeEnum = z.enum(CLEANING_TYPE_VALUES);


interface ChecklistTemplateFormData {
    name: string;
    cleaning_type: string; // Changed to string for Select component
    description?: string;
    items: {
        id?: number;
        text: string;
    }[];
}


const formSchema = z.object({
    name: z.string().min(1, { message: "Поле 'Название шаблона' обязательно для заполнения." }),
    cleaning_type: CleaningTypeEnum
        .refine(val => !!val, { message: "Выберите тип уборки." }),
    description: z.string().optional(),
    items: z.array(
        z.object({
            id: z.number().optional(),
            text: z.string().min(1, { message: "Текст пункта обязателен для заполнения." }),
        })
    ).min(0, { message: "Должен быть хотя бы один пункт в чек-листе." }), // Allow empty array for now, adjust if needed
});

type ChecklisFormValues = z.infer<typeof formSchema>;

interface ChecklistTemplateFormProps {
    checklistTemplateToEdit?: Checklist;
    onSuccess: () => void;
    onCancel: () => void;
}

export default function ChecklistTemplateForm({ checklistTemplateToEdit, onSuccess, onCancel }: ChecklistTemplateFormProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [generalError, setGeneralError] = useState<string | null>(null);

   
    const form = useForm<ChecklisFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: checklistTemplateToEdit ? {
            name: checklistTemplateToEdit.name,
            cleaning_type: checklistTemplateToEdit.cleaning_type, // Convert to string for Select
            description: checklistTemplateToEdit.description || '',
            items: checklistTemplateToEdit.items?.map(item => ({
                id: item.id,
                text: item.text,
            })) || [],
        } : {
            name: '',
            cleaning_type: undefined, 
            description: '',
            items: [],
        },
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "items",
    });


    const onSubmit = async (data: ChecklistTemplateFormData) => {
        setIsLoading(true);
        setGeneralError(null); 
        try {
            let response;
            const dataToSend = {
                name: data.name,
                cleaning_type: data.cleaning_type,
                description: data.description,
                items: data.items.map(item => ({
                    ...(item.id && { id: item.id }), 
                    text: item.text,
                })),
            };

            if (checklistTemplateToEdit) {
                response = await api.patch(`/api/checklisttemplates/${checklistTemplateToEdit.id}/`, dataToSend);
                console.log(`Checklist template ${checklistTemplateToEdit.id} successfully updated.`);
            } else {
                response = await api.post('/api/checklisttemplates/', dataToSend);
                console.log("New checklist template successfully created.");
            }

            if (response.status === 200 || response.status === 201) {
                onSuccess(); 
            } else {
                setGeneralError('Не удалось сохранить шаблон чек-листа. Статус: ' + response.status);
                console.error("Failed to save checklist template. Status:", response.status);
            }

        } catch (err) {
            console.error('Error saving checklist template:', err);
            if (axios.isAxiosError(err) && err.response) {
                if (err.response.data && typeof err.response.data === 'object') {
                    const apiErrors = err.response.data;
                    let hasErrors = false;

                    for (const key in apiErrors) {
                        if (apiErrors.hasOwnProperty(key) && Array.isArray(apiErrors[key]) && key !== 'items') {
                            form.setError(key as keyof ChecklistTemplateFormData, {
                                type: "server",
                                message: apiErrors[key][0]
                            });
                            hasErrors = true;
                        }
                    }

                    if (apiErrors.items && Array.isArray(apiErrors.items)) {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        apiErrors.items.forEach((itemError: any, index: number) => {
                            if (itemError && typeof itemError === 'object' && itemError.text) {
                                form.setError(`items.${index}.text`, {
                                    type: "server",
                                    message: itemError.text[0]
                                });
                                hasErrors = true;
                            }
                        });
                    }

                    if (hasErrors) {
                        setGeneralError('Пожалуйста, исправьте ошибки в форме.');
                    } else {
                        setGeneralError(apiErrors.detail || apiErrors.message || JSON.stringify(apiErrors) || 'Ошибка при сохранении шаблона чек-листа.');
                    }

                } else {
                    setGeneralError(err.response.data.detail || err.response.data.message || JSON.stringify(err.response.data) || 'Ошибка при сохранении шаблона чек-листа.');
                }
            } else if (axios.isAxiosError(err) && err.request) {
                setGeneralError('Нет ответа от сервера при сохранении шаблона чек-листа.');
            } else {
                setGeneralError('Произошла непредвиденная ошибка при сохранении шаблона чек-листа.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-bold mb-4">{checklistTemplateToEdit ? 'Редактировать шаблон чек-листа' : 'Создать новый шаблон чек-листа'}</h2>

                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem className="mb-4">
                            <FormLabel>Название шаблона:</FormLabel>
                            <FormControl>
                                <Input {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="cleaning_type"
                    render={({ field }) => (
                        <FormItem className="mb-4">
                            <FormLabel>Тип уборки:</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Выберите тип уборки" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {cleaningTypeOptions.map(type => (
                                        <SelectItem key={type.value} value={type.value}>
                                            {type.label}
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

                <div className="mb-6 border-t pt-4">
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="text-lg font-semibold text-gray-700">Пункты чек-листа</h3>
                        <Button
                            type="button"
                            onClick={() => append({ text: '' })}
                            className="bg-green-500 hover:bg-green-700 text-white font-bold py-1 px-3 rounded focus:outline-none focus:shadow-outline transition duration-200 ease-in-out text-sm"
                        >
                            <Plus size={16} className="inline mr-1" /> Добавить пункт
                        </Button>
                    </div>

                    {fields.map((item, index) => (
                        <FormField
                            control={form.control}
                            key={item.id} // react-hook-form provides a unique ID for each field in useFieldArray
                            name={`items.${index}.text`}
                            render={({ field }) => (
                                <FormItem className="flex items-center mb-3 space-x-2">
                                    <FormControl className="flex-grow">
                                        <Input
                                            placeholder={`Пункт ${index + 1}`}
                                            {...field}
                                        />
                                    </FormControl>
                                    <Button
                                        type="button"
                                        onClick={() => remove(index)}
                                        variant="ghost"
                                        size="icon"
                                        className="text-red-600 hover:text-red-900"
                                        aria-label={`Удалить пункт ${index + 1}`}
                                    >
                                        <Trash2 size={20} />
                                    </Button>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    ))}

                    {fields.length === 0 && (
                        <p className="text-center text-gray-500 text-sm">Нет пунктов в чек-листе. Добавьте первый пункт.</p>
                    )}
                </div>

                {generalError && <p className="text-red-500 text-xs italic mb-4">{generalError}</p>}

                <div className="flex items-center justify-between">
                    <Button
                        type="submit"
                        disabled={isLoading}
                    >
                        {isLoading ? <Spinner size={16} className="mr-2" /> : null}
                        {isLoading ? 'Сохранение...' : (checklistTemplateToEdit ? 'Сохранить изменения' : 'Создать шаблон')}
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
