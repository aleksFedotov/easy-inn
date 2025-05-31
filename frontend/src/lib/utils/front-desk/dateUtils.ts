import { format } from 'date-fns';

export const formatDateForApi = (date: Date | undefined): string | undefined => {
    if (!date) return undefined;
    return format(date, 'yyyy-MM-dd');
};

export const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    return format(date, 'HH:mm');
};

export const formatDateRange = (checkIn: string, checkOut: string): string => {
    const checkInDate = format(new Date(checkIn), 'dd.MM.yyyy');
    const checkOutDate = format(new Date(checkOut), 'dd.MM.yyyy');
    return `${checkInDate} - ${checkOutDate}`;
};