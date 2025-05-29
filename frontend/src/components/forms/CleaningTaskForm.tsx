'use client';

import React, { useState, useEffect } from 'react';
import { CleaningTask, Room, Zone, User } from '@/lib/types';
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

import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from 'zod';
import { CalendarDays, Clock, User as UserIcon, Tag, MapPin, FileText } from 'lucide-react';
import { cleaningTypeOptions, CLEANING_TYPE_VALUES } from '@/lib/constants';




const CleaningTypeEnum = z.enum(CLEANING_TYPE_VALUES);


// Define the form data type
interface CleaningTaskFormData {
    cleaning_type: "stayover" | "departure_cleaning" | "deep_cleaning" | "on_demand" | "post_renovation_cleaning" | "public_area_cleaning";
    scheduled_date: string;
    due_time?: string;
    assigned_to?: string;
    room?: string;
    zone?: string;
    notes?: string;
}

// Zod validation schema
const formSchema = z.object({
    room: z.string().optional(),
    zone: z.string().optional(),
    cleaning_type: CleaningTypeEnum
        .refine(val => !!val, { message: "Выберите тип уборки." }),
    assigned_to: z.string().optional(),
    scheduled_date: z.string().min(1, { message: "Укажите запланированную дату." }),
    due_time: z.string().optional(),
    notes: z.string().optional(),
}).refine(data => {
    return (!!data.room && !data.zone) || (!data.room && !!data.zone);
}, {
    message: "Выберите либо комнату, либо зону, но не обе.",
    path: ["room"], 
}).refine(data => {
    return (!!data.room && !data.zone) || (!data.room && !!data.zone);
}, {
    message: "Выберите либо комнату, либо зону, но не обе.",
    path: ["zone"],
});


// Тип для данных формы, выведенный из Zod схемы
type cleaningTaskFormValues = z.infer<typeof formSchema>;


interface CleaningTaskFormProps {
    cleaningTaskToEdit?: CleaningTask;
    availableRooms: Room[];
    availableZones: Zone[];
    availableHousekeepers: User[];
    onSuccess: () => void;
    onCancel: () => void;
}



export default function CleaningTaskForm({
    cleaningTaskToEdit,
    availableRooms,
    availableZones,
    availableHousekeepers,
    onSuccess,
    onCancel
}: CleaningTaskFormProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [generalError, setGeneralError] = useState<string | null>(null);

    const form = useForm<cleaningTaskFormValues>({
        resolver: zodResolver(formSchema),
       defaultValues: cleaningTaskToEdit ? {
            room: cleaningTaskToEdit.room?.toString() || '',
            zone: cleaningTaskToEdit.zone?.toString() || '',
            cleaning_type: cleaningTaskToEdit.cleaning_type,
            assigned_to: cleaningTaskToEdit.assigned_to?.toString() || '',
            scheduled_date: cleaningTaskToEdit.scheduled_date ?? new Date().toISOString().split('T')[0], // ✅ Убедись, что это строка
            due_time: cleaningTaskToEdit.due_time ? cleaningTaskToEdit.due_time.substring(11, 16) : '',
            notes: cleaningTaskToEdit.notes || '',
        } : {
            room: '',
            zone: '',
            cleaning_type: undefined,
            assigned_to: '',
            scheduled_date: new Date().toISOString().split('T')[0], // ✅ по умолчанию — сегодняшняя дата
            due_time: '',
            notes: '',
        },
    });

   
    const roomValue = form.watch('room');
    const zoneValue = form.watch('zone');

    useEffect(() => {
        if (roomValue && form.getValues('zone') !== '') {
            form.setValue('zone', ''); 
            form.clearErrors('zone'); 
        }
    }, [roomValue, form]);

    useEffect(() => {
        if (zoneValue && form.getValues('room') !== '') {
            form.setValue('room', ''); 
            form.clearErrors('room'); 
        }
    }, [zoneValue, form]);


    const onSubmit: SubmitHandler<CleaningTaskFormData>= async (data: CleaningTaskFormData) => {
        setIsLoading(true);
        setGeneralError(null);

        try {
            const dataToSend = {
                room: data.room && data.room !== 'not_selected' ? parseInt(data.room) : null,
                zone: data.zone && data.zone !== 'not_selected' ? parseInt(data.zone) : null,
                cleaning_type:data.cleaning_type,
                assigned_to:data.assigned_to && data.assigned_to !== 'not_selected' ? parseInt(data.assigned_to) : null,
                scheduled_date: data.scheduled_date,
                due_time: data.due_time !== '' ? `${data.scheduled_date}T${data.due_time}:00` : null,
                notes: data.notes !== '' ? data.notes : null,
            };

            let response;

            if (cleaningTaskToEdit) {
                response = await api.patch(`/api/cleaningtasks/${cleaningTaskToEdit.id}/`, dataToSend);
                console.log(`Cleaning task ${cleaningTaskToEdit.id} successfully updated.`);
            } else {
                response = await api.post('/api/cleaningtasks/', dataToSend);
                console.log("New cleaning task successfully created.");
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
                if (err.response.data && typeof err.response.data === 'object') {
                    const apiErrors = err.response.data;
                    let hasErrors = false;

                    for (const key in apiErrors) {
                        if (apiErrors.hasOwnProperty(key) && Array.isArray(apiErrors[key])) {
                            // Map backend errors to form fields
                            form.setError(key as keyof CleaningTaskFormData, {
                                type: "server",
                                message: apiErrors[key][0]
                            });
                            hasErrors = true;
                        }
                    }
                    if (hasErrors) {
                        setGeneralError('Пожалуйста, исправьте ошибки в форме.');
                    } else {
                        setGeneralError(apiErrors.detail || apiErrors.message || JSON.stringify(apiErrors) || 'Ошибка при сохранении задачи уборки.');
                    }
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
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 rounded-lg">
                <h2 className="text-xl font-bold mb-4">{cleaningTaskToEdit ? 'Редактировать задачу уборки' : 'Создать новую задачу уборки'}</h2>

                <div className="mb-4">
                    <FormLabel className="flex items-center mb-2">
                        <MapPin size={16} className="inline mr-1" /> Местоположение (Комната или Зона):
                    </FormLabel>
                    <div className="flex space-x-4">
                        <FormField
                            control={form.control}
                            name="room"
                            render={({ field }) => (
                                <FormItem className="flex-1">
                                    <Select onValueChange={field.onChange} value={field.value} disabled={!!zoneValue}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Выберите комнату" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="not_selected">Выберите комнату</SelectItem>
                                            {availableRooms.map(room => (
                                                <SelectItem key={room.id} value={room.id.toString()}>{room.number}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="zone"
                            render={({ field }) => (
                                <FormItem className="flex-1">
                                    <Select onValueChange={field.onChange} value={field.value} disabled={!!roomValue}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Выберите зону" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="not_selected">Выберите зону</SelectItem>
                                            {availableZones.map(zone => (
                                                <SelectItem key={zone.id} value={zone.id.toString()}>{zone.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>

                <FormField
                    control={form.control}
                    name="cleaning_type"
                    render={({ field }) => (
                        <FormItem className="mb-4">
                            <FormLabel className="flex items-center">
                                <Tag size={16} className="inline mr-1" /> Тип уборки:
                            </FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Выберите тип уборки" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="not_selected">Выберите тип уборки</SelectItem>
                                    {cleaningTypeOptions.map(typeOption => (
                                        <SelectItem key={typeOption.value} value={typeOption.value}>{typeOption.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="assigned_to"
                    render={({ field }) => (
                        <FormItem className="mb-4">
                            <FormLabel className="flex items-center">
                                <UserIcon size={16} className="inline mr-1" /> Назначить горничной:
                            </FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Не назначена" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="not_selected">Не назначена</SelectItem>
                                    {availableHousekeepers.map(housekeeper => (
                                        <SelectItem key={housekeeper.id} value={housekeeper.id.toString()}>
                                            {housekeeper.first_name} {housekeeper.last_name || housekeeper.username}
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
                    name="scheduled_date"
                    render={({ field }) => (
                        <FormItem className="mb-4">
                            <FormLabel className="flex items-center">
                                <CalendarDays size={16} className="inline mr-1" /> Запланированная дата:
                            </FormLabel>
                            <FormControl>
                                <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="due_time"
                    render={({ field }) => (
                        <FormItem className="mb-4">
                            <FormLabel className="flex items-center">
                                <Clock size={16} className="inline mr-1" /> Время выполнения (до):
                            </FormLabel>
                            <FormControl>
                                <Input type="time" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                        <FormItem className="mb-4">
                            <FormLabel className="flex items-center">
                                <FileText size={16} className="inline mr-1" /> Заметки:
                            </FormLabel>
                            <FormControl>
                                <Textarea rows={4} {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {generalError && <p className="text-red-500 text-xs italic mb-4 text-center">{generalError}</p>}

                <div className="flex items-center justify-between">
                    <Button
                        type="submit"
                        disabled={isLoading}
                    >
                        {isLoading ? <Spinner size={16} className="mr-2" /> : null}
                        {isLoading ? 'Сохранение...' : (cleaningTaskToEdit ? 'Сохранить изменения' : 'Создать задачу')}
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
