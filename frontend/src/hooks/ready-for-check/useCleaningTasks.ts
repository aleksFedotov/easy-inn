import { useState, useCallback } from 'react';
import { CleaningTask } from '@/lib/types';
import api from '@/lib/api';
import axios from 'axios';

interface UseCleaningTasksState {
  tasks: CleaningTask[];
  loading: boolean;
  error: string | null;
}

export const useCleaningTasks = () => {
  const [state, setState] = useState<UseCleaningTasksState>({
    tasks: [],
    loading: true,
    error: null
  });

  const handleApiError = useCallback((err: unknown): string => {
    console.error('API Error:', err);
    
    if (axios.isAxiosError(err) && err.response) {
      return err.response.data.detail || 
             err.response.data.message || 
             JSON.stringify(err.response.data);
    }
    
    return 'Ошибка при загрузке задач.';
  }, []);

  const fetchReadyForCheckTasks = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await api.get<CleaningTask[]>('/api/cleaningtasks/ready_for_check/', {
        params: { all: true }
      });

      if (response.status === 200) {
        setState(prev => ({
          ...prev,
          tasks: response.data,
          loading: false
        }));
      } else {
        setState(prev => ({
          ...prev,
          error: 'Не удалось загрузить задачи. Попробуйте позже.',
          loading: false
        }));
      }
    } catch (err) {
      setState(prev => ({
        ...prev,
        error: handleApiError(err),
        loading: false
      }));
    }
  }, [handleApiError]);

  return {
    ...state,
    fetchTasks: fetchReadyForCheckTasks,
    refetch: fetchReadyForCheckTasks
  };
};