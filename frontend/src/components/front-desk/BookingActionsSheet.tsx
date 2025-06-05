import React from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import BookingForm from '@/components/forms/BookingForm'; 
import { Booking } from '@/lib/types'; 

interface BookingActionsSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  bookingToEdit: Booking | undefined;
  onSuccess: () => void;
  onCancel: () => void;
}

const BookingActionsSheet: React.FC<BookingActionsSheetProps> = ({
  isOpen,
  onOpenChange,
  bookingToEdit,
  onSuccess,
  onCancel,
}) => {
  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg w-full">
        <SheetHeader>
          <SheetTitle>{bookingToEdit ? `Редактировать бронирование` : 'Создать новое бронирование'}</SheetTitle>
          <SheetDescription>
            {bookingToEdit ? "Внесите изменения в данные бронирования." : "Заполните форму, чтобы добавить новое бронирование в систему."}
          </SheetDescription>
        </SheetHeader>
        <BookingForm
          bookingToEdit={bookingToEdit}
          onSuccess={onSuccess}
          onCancel={onCancel}
        />
      </SheetContent>
    </Sheet>
  );
};

export default React.memo(BookingActionsSheet);