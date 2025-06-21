'use client';

import React, { useState, useEffect } from 'react';
import { User, UserApiData } from '@/lib/types';
import axios from 'axios';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Spinner } from '@/components/spinner';
import {
  Form,
  FormControl,
  FormDescription, // Опционально, если нужно описание полей
  FormField,
  FormItem,
  FormLabel,
  FormMessage, 
} from "@/components/ui/form";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from 'zod'; 

// --- Zod Схемы валидации ---

// Базовая схема для общих полей пользователя
const baseUserSchema = z.object({
    username: z.string().min(3, { message: "Имя пользователя должно содержать не менее 3 символов." }).max(50, { message: "Имя пользователя не должно превышать 50 символов." }),
    first_name: z.string().max(30, { message: "Имя не должно превышать 30 символов." }).optional().or(z.literal('')),
    last_name: z.string().max(30, { message: "Фамилия не должна превышать 30 символов." }).optional().or(z.literal('')),
    role: z.enum(['housekeeper', 'front-desk', 'manager'], {
        errorMap: () => ({ message: "Выберите действительную роль пользователя." }),
    }).optional(), 
});


const userFormSchema = baseUserSchema.extend({
    password: z.string().optional().or(z.literal('')),
    confirmPassword: z.string().optional().or(z.literal('')),
    newPassword: z.string().optional().or(z.literal('')),
    confirmNewPassword: z.string().optional().or(z.literal('')),
    isEditMode: z.boolean(),
}).superRefine((data, ctx) => {
    // Валидация для режима создания
    if (!data.isEditMode) {
        if (!data.password || data.password.length === 0) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Пароль обязателен для нового пользователя.",
                path: ["password"],
            });
        }
        if (!data.confirmPassword || data.confirmPassword.length === 0) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Подтверждение пароля обязательно для нового пользователя.",
                path: ["confirmPassword"],
            });
        }
        if (data.password && data.confirmPassword && data.password !== data.confirmPassword) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Пароли не совпадают.",
                path: ["confirmPassword"],
            });
        }
    }

    // Валидация для режима редактирования
    if (data.isEditMode) {
        if (data.newPassword && data.newPassword.length > 0) {
            if (!data.confirmNewPassword || data.confirmNewPassword.length === 0) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: "Подтверждение нового пароля обязательно, если указан новый пароль.",
                    path: ["confirmNewPassword"],
                });
            } else if (data.newPassword !== data.confirmNewPassword) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: "Новые пароли не совпадают.",
                    path: ["confirmNewPassword"],
                });
            }
        } else if (data.confirmNewPassword && data.confirmNewPassword.length > 0) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Новый пароль должен быть указан, если указано подтверждение.",
                path: ["newPassword"],
            });
        }
    }
});

type UserFormValues = z.infer<typeof userFormSchema>;

interface UserFormProps {
    userToEdit?: User;
    onSuccess: () => void;
    onCancel: () => void;
}

export default function UserForm({ userToEdit, onSuccess, onCancel }: UserFormProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [generalError, setGeneralError] = useState<string | null>(null);

    const isEditMode = !!userToEdit;


    const defaultValues: UserFormValues = {
        username: userToEdit?.username || '',
        first_name: userToEdit?.first_name || '',
        last_name: userToEdit?.last_name || '',
        password: '',
        confirmPassword: '',
        newPassword: '',
        confirmNewPassword: '',
        role: userToEdit?.role || undefined,
        isEditMode: isEditMode, 
    };

    // Инициализируем форму с react-hook-form
   const form = useForm<UserFormValues>({ 
        resolver: zodResolver(userFormSchema), 
        defaultValues: defaultValues,
        mode: "onTouched", 
    });

     useEffect(() => {
        if (Object.keys(form.formState.errors).length > 0) {
            console.log("Form validation errors:", form.formState.errors);
        }
    }, [form.formState.errors]);


    // Обработчик отправки формы, интегрированный с react-hook-form
    const onSubmit = async (values: UserFormValues) => {
        setIsLoading(true);
        setGeneralError(null); 
        console.log("edit")
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { isEditMode: _, ...dataForApi } = values;

        const dataToSend: Partial<UserApiData> = { 
            username: dataForApi.username,
            first_name: dataForApi.first_name || "", 
            last_name: dataForApi.last_name || "",
            role: dataForApi.role,
        };


        if (!isEditMode) { // Режим создания
            dataToSend.password = dataForApi.password;
        } else { 
            if (dataForApi.newPassword && dataForApi.newPassword.length > 0) {
                dataToSend.password = dataForApi.newPassword;
            }
        }
        
        try {
            let response;
            if (userToEdit) {
                response = await api.patch(`/api/users/${userToEdit.id}/`, dataToSend);
            } else {
                response = await api.post('/api/users/', dataToSend);
            }

            if (response.status === 200 || response.status === 201) {
                onSuccess(); 
            }
        } catch (err) {
            console.error('Error submitting user form:', err);
            if (axios.isAxiosError(err) && err.response) {
                if (err.response.status === 400) {
                    const errors = err.response.data;
                    if (errors && typeof errors === 'object') {
                        Object.keys(errors).forEach(key => {
                            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                            // @ts-expect-error
                             if (form.getFieldState(key)) {
                                 // Предполагаем, что бэкенд возвращает массив строк или строку
                                 const messages = Array.isArray(errors[key]) ? errors[key] : [String(errors[key])];
                             
                                 // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                 form.setError(key as any, { type: 'server', message: messages.join(' ') });
                             } else {
                                 // Ошибки, не связанные с конкретными полями
                                 if (key === 'detail' || key === 'non_field_errors') {
                                      setGeneralError(Array.isArray(errors[key]) ? errors[key].join(' ') : String(errors[key]));
                                 } else {
                                     // Возможно, другие необработанные ошибки
                                      setGeneralError(prev => `${prev ? prev + ' ' : ''}${key}: ${Array.isArray(errors[key]) ? errors[key].join(' ') : String(errors[key])}`);
                                 }
                             }
                        });
                         // Если нет общей ошибки от бэкенда, но есть полевые ошибки, устанавливаем общую
                         if (!generalError && Object.keys(errors).length > 0) {
                              setGeneralError("Произошла ошибка валидации на сервере. Проверьте поля.");
                         }

                    } else {
                        setGeneralError(err.response.data.detail || 'Произошла ошибка при сохранении пользователя.');
                    }
                } else {
                    setGeneralError(err.response.data.detail || 'Произошла ошибка при сохранении пользователя.');
                }
            } else {
                setGeneralError('Произошла непредвиденная ошибка.');
            }
        } finally {
            setIsLoading(false);
        }
    };


    return (
        
        <Form {...form}>
            
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 p-4">
                {/* Поле Имя пользователя */}
                <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Имя пользователя</FormLabel>
                            <FormControl>
                                <Input
                                    placeholder="Имя пользователя"
                                    disabled={isLoading || isEditMode} 
                                    {...field} 
                                />
                            </FormControl>
                            <FormDescription>
                                Это ваше уникальное имя пользователя.
                            </FormDescription>
                            <FormMessage /> 
                        </FormItem>
                    )}
                />

                {/* Поле Имя */}
                 <FormField
                    control={form.control}
                    name="first_name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Имя</FormLabel>
                            <FormControl>
                                <Input
                                    placeholder="Имя"
                                    disabled={isLoading}
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Поле Фамилия */}
                 <FormField
                    control={form.control}
                    name="last_name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Фамилия</FormLabel>
                            <FormControl>
                                <Input
                                    placeholder="Фамилия"
                                    disabled={isLoading}
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Поля для пароля (только при создании) */}
                {!isEditMode && (
                    <>
                        <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Пароль</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Пароль"
                                            type="password"
                                            disabled={isLoading}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="confirmPassword"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Подтвердите пароль</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Подтвердите пароль"
                                            type="password"
                                            disabled={isLoading}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </>
                )}

                {/* Поля для смены пароля (только при редактировании) */}
                {isEditMode && (
                    <>
                        <div className="pt-4 border-t border-gray-200">
                            <h3 className="text-lg font-semibold mb-2">Изменить пароль (оставьте пустым, если не хотите менять)</h3>
                            <FormField
                                control={form.control}
                                name="newPassword"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Новый пароль</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Новый пароль"
                                                type="password"
                                                disabled={isLoading}
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="confirmNewPassword"
                                render={({ field }) => (
                                    <FormItem className="mt-2"> {/* Добавляем отступ */}
                                        <FormLabel>Подтвердите новый пароль</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Подтвердите новый пароль"
                                                type="password"
                                                disabled={isLoading}
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </>
                )}

                {/* Поле Роль (Select) */}
                 <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Роль</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Выберите роль" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="housekeeper">Горничная</SelectItem>
                                    <SelectItem value="front-desk">Сотрудник ресепшена</SelectItem>
                                    <SelectItem value="manager">Менеджер</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />


                {/* Отображение общей ошибки (от бэкенда) */}
                {generalError && <p className="text-red-500 text-xs italic mb-4">{generalError}</p>}

                {/* Кнопки отправки и отмены */}
                <div className="flex items-center justify-between pt-4">
                    <Button
                        type="submit"
                        disabled={isLoading}
                    >
                        {isLoading ? <Spinner size={16} className="mr-2"/> : null}
                        {isLoading ? 'Сохранение...' : (userToEdit ? 'Сохранить изменения' : 'Создать пользователя')}
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
