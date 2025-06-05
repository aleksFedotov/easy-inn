import React from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Plus, CalendarDays } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface FrontDeskHeaderProps {
  selectedDate: Date | undefined;
  onDateSelect: (date: Date | undefined) => void;
  selectedTab: 'departures' | 'arrivals' | 'stays';
  onTabChange: (tab: 'departures' | 'arrivals' | 'stays') => void;
  onCreateBooking: () => void;
  isDisabled: boolean; 
}

const FrontDeskHeader: React.FC<FrontDeskHeaderProps> = ({
  selectedDate,
  onDateSelect,
  selectedTab,
  onTabChange,
  onCreateBooking,
  isDisabled,
}) => {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-center mb-6 space-y-4 sm:space-y-0 sm:space-x-4">
  
      <Button
        onClick={onCreateBooking}
        disabled={isDisabled}
      >
        <Plus size={20} className="mr-2" /> Создать новое бронирование
      </Button>

      
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={"outline"}
            className={`w-[240px] justify-start text-left font-normal ${!selectedDate && "text-muted-foreground"}`}
            disabled={isDisabled}
          >
            <CalendarDays size={20} className="mr-2" />
            {selectedDate ? format(selectedDate, "PPP", { locale: ru }) : <span>Выберите дату</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={onDateSelect}
            initialFocus
            locale={ru}
          />
        </PopoverContent>
      </Popover>

      {/* Вкладки с помощью shadcn/ui Tabs */}
      <Tabs value={selectedTab} onValueChange={(value) => onTabChange(value as 'departures' | 'arrivals' | 'stays')} className="w-full sm:w-auto">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="departures" disabled={isDisabled}>Выезды</TabsTrigger>
          <TabsTrigger value="arrivals" disabled={isDisabled}>Заезды</TabsTrigger>
          <TabsTrigger value="stays" disabled={isDisabled}>Проживающие</TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
};

export default React.memo(FrontDeskHeader);