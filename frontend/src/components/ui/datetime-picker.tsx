// src/components/ui/datetime-picker.tsx
"use client";

import React from "react";
import { useFormContext } from "react-hook-form";
import { format } from "date-fns";
import { ru } from "date-fns/locale"; // Импортируем русскую локаль
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"; 
import { CalendarDays } from "lucide-react"; 

interface DateTimePickerProps {
    name: string;
    label: string; 
    
}

export function DateTimePicker({ name, label }: DateTimePickerProps) {
    const { control } = useFormContext();

    return (
        <FormField
            control={control}
            name={name}
            render={({ field }) => (
                <FormItem className="flex flex-col">
                    <FormLabel><CalendarDays size={16} className="inline mr-1" /> {label}:</FormLabel>
                    <Popover>
                        <PopoverTrigger asChild>
                            <FormControl>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                        "w-full pl-3 text-left font-normal",
                                        !field.value && "text-muted-foreground"
                                    )}
                                >
                                    {field.value ? (
                                        format(field.value, "PPP HH:mm", { locale: ru }) 
                                    ) : (
                                        <span>Выберите дату и время</span>
                                    )}
                                    <CalendarDays className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                            </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                            <div className="sm:flex">
                                <Calendar
                                    mode="single"
                                    selected={field.value}
                                    onSelect={(date) => {
                                        if (date) {
                                            // Сохраняем существующее время при выборе даты
                                            const currentDateTime = field.value || new Date();
                                            date.setHours(currentDateTime.getHours());
                                            date.setMinutes(currentDateTime.getMinutes());
                                            date.setSeconds(currentDateTime.getSeconds());
                                            field.onChange(date);
                                        } else {
                                            field.onChange(undefined);
                                        }
                                    }}
                                    initialFocus
                                    locale={ru} // Устанавливаем русскую локаль для календаря
                                />
                                <div className="flex flex-col sm:flex-row sm:h-[300px] divide-y sm:divide-y-0 sm:divide-x">
                                    <ScrollArea className="w-64 sm:w-auto">
                                        <div className="flex sm:flex-col p-2">
                                            {Array.from({ length: 24 }, (_, i) => i)
                                                .reverse()
                                                .map((hour) => (
                                                    <Button
                                                        key={hour}
                                                        size="icon"
                                                        variant={
                                                            field.value &&
                                                            field.value.getHours() === hour
                                                                ? "default"
                                                                : "ghost"
                                                        }
                                                        className="sm:w-full shrink-0 aspect-square"
                                                        onClick={() => {
                                                            const currentDateTime = field.value || new Date();
                                                            currentDateTime.setHours(hour);
                                                            field.onChange(new Date(currentDateTime)); // Создаем новую дату для триггера обновления
                                                        }}
                                                    >
                                                        {hour.toString().padStart(2, '0')}
                                                    </Button>
                                                ))}
                                        </div>
                                        <ScrollBar orientation="horizontal" className="sm:hidden" />
                                    </ScrollArea>
                                    <ScrollArea className="w-64 sm:w-auto">
                                        <div className="flex sm:flex-col p-2">
                                            {Array.from({ length: 12 }, (_, i) => i * 5).map(
                                                (minute) => (
                                                    <Button
                                                        key={minute}
                                                        size="icon"
                                                        variant={
                                                            field.value &&
                                                            field.value.getMinutes() === minute
                                                                ? "default"
                                                                : "ghost"
                                                        }
                                                        className="sm:w-full shrink-0 aspect-square"
                                                        onClick={() => {
                                                            const currentDateTime = field.value || new Date();
                                                            currentDateTime.setMinutes(minute);
                                                            field.onChange(new Date(currentDateTime)); // Создаем новую дату для триггера обновления
                                                        }}
                                                    >
                                                        {minute.toString().padStart(2, '0')}
                                                    </Button>
                                                )
                                            )}
                                        </div>
                                        <ScrollBar orientation="horizontal" className="sm:hidden" />
                                    </ScrollArea>
                                </div>
                            </div>
                        </PopoverContent>
                    </Popover>
                    <FormMessage />
                </FormItem>
            )}
        />
    );
}
