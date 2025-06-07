import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import {isAxiosError} from 'axios';
import { CleaningTask } from '@/lib/types';

export function useTaskDetails(taskId: string | null) {
    const [taskDetails, setTaskDetails] = useState<CleaningTask | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const fetchTaskDetails = useCallback(async () => {
        if (!taskId) {
            setError('ID задачи не указан.');
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const response = await api.get(`/api/cleaningtasks/${taskId}/`);
            if (response.status === 200) {
                setTaskDetails(response.data);
            } else {
                setError(`Ошибка при загрузке задачи: ${response.status}`);
            }
        } catch (err) {
            if (isAxiosError(err) && err.response) {
                setError(err.response.data.detail || err.response.data.message || 'Ошибка при загрузке данных задачи.');
            } else {
                setError('Произошла неизвестная ошибка при загрузке задачи.');
            }
        } finally {
            setIsLoading(false);
        }
    }, [taskId]);

    useEffect(() => {
        fetchTaskDetails();
    }, [fetchTaskDetails]);

    return { taskDetails, isLoading, error, fetchTaskDetails };
}