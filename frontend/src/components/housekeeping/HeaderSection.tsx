
import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import DatePicker from '@/components/ui/DatePicker';

interface HeaderSectionProps {
  selectedDate: Date | undefined;
  onDateChange: (date: Date | undefined) => void;
  selectedTaskCount: number;
  onAssignClick: () => void;
  isAssignDisabled: boolean;
}

const HeaderSection:React.FC<HeaderSectionProps> = ({
  selectedDate,
  onDateChange,
  selectedTaskCount,
  onAssignClick,
  isAssignDisabled
}) => {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-center mb-6 space-y-4 sm:space-y-0 sm:space-x-4">
      <div className="flex items-center space-x-2">
        <Label htmlFor="date-picker">Дата:</Label>
        <DatePicker date={selectedDate} setDate={onDateChange} />
      </div>

      <div className="flex space-x-2">
        <Button
          variant="outline"
          onClick={onAssignClick}
          disabled={isAssignDisabled}
        >
          Назначить выбранное ({selectedTaskCount})
        </Button>
      </div>
    </div>
  );
}


export default React.memo(HeaderSection)