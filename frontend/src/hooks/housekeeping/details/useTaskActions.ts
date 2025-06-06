
import { useState } from 'react';
import api from '@/lib/api';
import axios from 'axios';
import { toast } from 'sonner';


async function handleApiCall(apiCall: () => Promise<void>, onSuccessMessage: string, onFailMessage: string) {
    try {
        await apiCall();
        toast.success(onSuccessMessage);
        return true;
    } catch (err) {
        let errorMessage = onFailMessage;
        if (axios.isAxiosError(err) && err.response) {
            errorMessage = err.response.data.detail || err.response.data.message || onFailMessage;
        }
        toast.error(errorMessage);
        console.error(err);
        return false;
    }
}


export function useTaskActions(taskId: string, onActionSuccess: () => void) {
    const [isActionLoading, setIsActionLoading] = useState(false);

    const performAction = async (apiCall: () => Promise<void>, successMessage: string, failMessage: string) => {
        setIsActionLoading(true);
        const success = await handleApiCall(apiCall, successMessage, failMessage);
        if (success) {
            onActionSuccess(); 
        }
        setIsActionLoading(false);
    };

    const startCleaning = () => performAction(
        () => api.patch(`/api/cleaningtasks/${taskId}/start/`),
        'Уборка успешно начата.',
        'Не удалось начать уборку.'
    );

    const finishCleaning = () => performAction(
        () => api.patch(`/api/cleaningtasks/${taskId}/complete/`),
        'Уборка успешно завершена.',
        'Не удалось завершить уборку.'
    );

    const finishInspection = () => performAction(
        () => api.patch(`/api/cleaningtasks/${taskId}/check/`),
        'Проверка успешно завершена.',
        'Не удалось завершить проверку.'
    );

    const toggleRush = (currentRushStatus: boolean) => performAction(
        () => api.patch(`/api/cleaningtasks/${taskId}/set_rush/`, { is_rush: !currentRushStatus }),
        `Задача успешно ${!currentRushStatus ? 'помечена как срочная' : 'снята со срочных'}.`,
        'Не удалось изменить статус срочности.'
    );

    return {
        isActionLoading,
        startCleaning,
        finishCleaning,
        finishInspection,
        toggleRush,
    };
}