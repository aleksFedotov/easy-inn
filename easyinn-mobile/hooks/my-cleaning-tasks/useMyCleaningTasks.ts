import { useEffect, useState, useCallback } from 'react';
import { CleaningTask } from '@/lib/types';
import api from '@/lib/api';
import { isAxiosError } from 'axios';
import { format } from 'date-fns';

export function useCleaningTasks(user: { id: number } | null, selectedDate?: Date) {
  const [tasks, setTasks] = useState<CleaningTask[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const formatDateForApi = (date: Date | undefined): string | undefined => {
    return date ? format(date, 'yyyy-MM-dd') : undefined;
  };

  const fetchTasks = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    setError(null);
    try {
      const dateString = formatDateForApi(selectedDate);
      const response = await api.get(`/api/cleaningtasks/`, {
        params: {
          assigned_to: user.id,
          scheduled_date: dateString,
          all: true,
        },
      });
      setTasks(response.data);
    } catch (err) {
      console.error(err);
      if (isAxiosError(err) && err.response) {
        setError(
          err.response.data.detail ||
          err.response.data.message ||
          JSON.stringify(err.response.data)
        );
      } else {
        setError('Ошибка при загрузке задач.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [user, selectedDate]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  return { tasks, isLoading, error, refetch: fetchTasks };
}