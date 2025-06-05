import { format } from 'date-fns'; // Импорт format для форматирования даты

const formatDateForApi = (date: Date | undefined): string | undefined => {
        if (!date) return undefined;
    return format(date, 'yyyy-MM-dd');
    };

export default formatDateForApi;