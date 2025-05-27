// src/components/ui/datetime-picker.tsx
"use client";

import React, {useEffect, useState} from "react";
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
    const { control , watch} = useFormContext();
    const hourButtonRefs = React.useRef<Array<HTMLButtonElement | null>>(new Array(24).fill(null));
    const minuteButtonRefs = React.useRef<Array<HTMLButtonElement | null>>(new Array(12).fill(null));
    const fieldValue = watch(name)

    // Состояние для управления открытием/закрытием Popover
    const [isPopoverOpen, setIsPopoverOpen] = useState(false);

    // Эффект для прокрутки к выбранному часу
    useEffect(() => {
        if (isPopoverOpen && fieldValue instanceof Date && hourButtonRefs.current) {
            const selectedHour = fieldValue.getHours();
            const selectedHourButton = hourButtonRefs.current[selectedHour];
            if (selectedHourButton) {
                selectedHourButton.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
            }
        }
    }, [fieldValue,isPopoverOpen]); // Зависимость от часов

    // Эффект для прокрутки к выбранной минуте
    useEffect(() => {
        if (isPopoverOpen && fieldValue instanceof Date && minuteButtonRefs.current) {
            const selectedMinute = fieldValue.getMinutes();
            const selectedMinuteIndex = Math.floor(selectedMinute / 5); // Индекс кнопки для минут (0, 5, 10, ...)
            const selectedMinuteButton = minuteButtonRefs.current[selectedMinuteIndex];
            if (selectedMinuteButton) {
                selectedMinuteButton.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
            }
        }
    }, [fieldValue, isPopoverOpen]); // Зависимость от минут

 


 return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
     
      const currentFieldValue = field.value instanceof Date ? field.value : null;
      const handleHourScroll = (e: React.WheelEvent) => {
          e.preventDefault();
          if (!currentFieldValue) return;
          const delta = e.deltaY > 0 ? 1 : -1;
          const newDate = new Date(currentFieldValue);
          newDate.setHours((newDate.getHours() + delta + 24) % 24);
          field.onChange(newDate);
      };

      const handleMinuteScroll = (e: React.WheelEvent) => {
          e.preventDefault();
          if (!currentFieldValue) return;
          const delta = e.deltaY > 0 ? 5 : -5; // Шаг 5 минут
          const newDate = new Date(currentFieldValue);
          let newMinutes = newDate.getMinutes() + delta;
          if (newMinutes >= 60) newMinutes = newMinutes % 60;
          else if (newMinutes < 0) newMinutes = 60 + (newMinutes % 60);
            // Округляем до ближайшего значения, кратного 5, если необходимо после скролла
          newMinutes = Math.round(newMinutes / 5) * 5;
          if (newMinutes === 60) newMinutes = 0; // Если округлили до 60, ставим 0

          newDate.setMinutes(newMinutes);
          field.onChange(newDate);
        };
        return (
                    <FormItem className="flex flex-col">
                        <FormLabel>
                            <CalendarDays size={16} className="inline mr-1" /> {label}:
                        </FormLabel>
                        <Popover  open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                            <PopoverTrigger asChild>
                                <FormControl>
                                    <Button
                                        variant={"outline"}
                                        className={cn(
                                            "w-full pl-3 text-left font-normal",
                                            !currentFieldValue && "text-muted-foreground"
                                        )}
                                    >
                                        {currentFieldValue
                                            ? format(currentFieldValue, "PPP HH:mm", { locale: ru })
                                            : "Выберите дату и время"}
                                        <CalendarDays className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <div className="sm:flex">
                                    <Calendar
                                        mode="single"
                                        selected={currentFieldValue || undefined}
                                        onSelect={(date) => {
                                            if (date) {
                                                const currentHours = currentFieldValue?.getHours() || (new Date()).getHours(); // Берем текущий час, если нет значения
                                                const currentMinutes = currentFieldValue?.getMinutes() || 0; // или 0, если нет значения
                                                date.setHours(currentHours, currentMinutes);
                                                field.onChange(date);
                                            } else {
                                                field.onChange(undefined);
                                            }
                                        }}
                                        locale={ru}
                                        initialFocus
                                    />
                                    <div className="flex flex-col sm:flex-row sm:h-[280px] divide-y sm:divide-y-0 sm:divide-x"> {/* Уменьшил высоту для лучшего вида */}
                                        <ScrollArea
                                            className="w-full sm:w-auto h-[140px] sm:h-full" // Задаем высоту для мобильных
                                            onWheel={handleHourScroll}
                                        >
                                            <div className="flex sm:flex-col p-1 sm:p-2"> {/* Уменьшил паддинги */}
                                                {Array.from({ length: 24 }, (_, i) => (
                                                     <Button
                                                        key={`hour-${i}`}
                                                        ref={el => { hourButtonRefs.current[i] = el; }} // Прямое присвоение
                                                        variant={
                                                            currentFieldValue?.getHours() === i
                                                                ? "default"
                                                                : "ghost"
                                                        }
                                                        className="w-full shrink-0 aspect-square sm:aspect-auto sm:h-10"
                                                        onClick={() => {
                                                            const date = new Date(currentFieldValue || new Date());
                                                            date.setHours(i);
                                                            // Сохраняем текущие минуты при смене часа
                                                            date.setMinutes(currentFieldValue?.getMinutes() || 0);
                                                            field.onChange(date);
                                                        }}
                                                    >
                                                        {i.toString().padStart(2, "0")}
                                                    </Button>
                                                ))}
                                            </div>
                                            <ScrollBar orientation="horizontal" className="sm:hidden" />
                                        </ScrollArea>
                                        <ScrollArea
                                            className="w-full sm:w-auto h-[140px] sm:h-full" // Задаем высоту для мобильных
                                            onWheel={handleMinuteScroll}
                                        >
                                            <div className="flex sm:flex-col p-1 sm:p-2"> {/* Уменьшил паддинги */}
                                                {Array.from({ length: 12 }, (_, i) => i * 5).map(
                                                    (minute, index) => (
                                                         <Button
                                                            key={`minute-${minute}`}
                                                            ref={el => { minuteButtonRefs.current[index] = el; }} // Прямое присвоение
                                                            variant={
                                                                currentFieldValue?.getMinutes() === minute
                                                                    ? "default"
                                                                    : "ghost"
                                                            }
                                                            className="w-full shrink-0 aspect-square sm:aspect-auto sm:h-10"
                                                            onClick={() => {
                                                                const date = new Date(currentFieldValue || new Date());
                                                                // Сохраняем текущий час при смене минут
                                                                date.setHours(currentFieldValue?.getHours() || (new Date()).getHours());
                                                                date.setMinutes(minute);
                                                                field.onChange(date);
                                                            }}
                                                        >
                                                            {minute.toString().padStart(2, "0")}
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
                );
            }}
        />
    );
}
