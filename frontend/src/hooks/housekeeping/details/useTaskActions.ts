
import { useState } from 'react';
import api from '@/lib/api';
import axios from 'axios';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';


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


export function useTaskActions(taskId: string, onActionSuccess: () => void, router?: ReturnType<typeof useRouter>) {
    const [isActionLoading, setIsActionLoading] = useState(false);

    const performAction = async (apiCall: () => Promise<void>, successMessage: string, failMessage: string, redirectTo? :string) => {
        setIsActionLoading(true);
        const success = await handleApiCall(apiCall, successMessage, failMessage);
        if (success) {
            onActionSuccess(); 
            if(router && redirectTo) {  
                router.push(`/${redirectTo}`);
            }
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
        'Не удалось завершить уборку.',
         'my-cleaning-task'
    );

    const startInspection = () => performAction(
        () => api.patch(`/api/cleaningtasks/${taskId}/start_check/`),
        'Проверка успешно начата.',
        'Не удалось начать проверку.',  
    );

    const finishInspection = () => performAction(
        () => api.patch(`/api/cleaningtasks/${taskId}/check/`),
        'Проверка успешно завершена.',
        'Не удалось завершить проверку.',
         'ready-for-check'
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
        startInspection,
        finishInspection,
        toggleRush,
    };
}