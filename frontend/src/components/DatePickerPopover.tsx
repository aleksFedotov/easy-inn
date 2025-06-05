import React from 'react';
import { CalendarDays } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';

interface DatePickerPopoverProps {
  selectedDate: Date | undefined;
  onSelect: (date: Date | undefined) => void;
}

const DatePickerPopover: React.FC<DatePickerPopoverProps> = ({ selectedDate, onSelect }) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={`w-[240px] justify-start text-left font-normal ${!selectedDate && "text-muted-foreground"}`}
        >
          <CalendarDays size={20} className="mr-2" />
          {selectedDate ? format(selectedDate, "PPP", { locale: ru }) : <span>Выберите дату</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={onSelect}
          initialFocus
          locale={ru}
        />
      </PopoverContent>
    </Popover>
  );
};

export default DatePickerPopover;
