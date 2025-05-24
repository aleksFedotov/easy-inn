'use client';

import React from 'react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarDays } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DatePickerProps {
    date: Date | undefined;
    setDate: (date: Date | undefined) => void;
}

const DatePicker: React.FC<DatePickerProps> = ({ date, setDate }) => {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant={"outline"}
                    className={cn(
                        "w-[200px] justify-start text-left font-normal",
                        !date && "text-muted-foreground"
                    )}
                >
                    <CalendarDays className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP", { locale: ru }) : <span>Выберите дату</span>}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
                <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                    locale={ru}
                />
            </PopoverContent>
        </Popover>
    );
};

export default DatePicker;
