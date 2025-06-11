import { useState, useEffect } from 'react';
import { CleaningTask, User } from '@/lib/types';
import api from '@/lib/api';
import {isAxiosError} from 'axios';
import { format } from 'date-fns';
import { CLEANING_TYPES } from '@/lib/constants';

interface DashboardData {
  checkoutTasks: CleaningTask[];
  currentTasks: CleaningTask[];
  zoneTasks: CleaningTask[];
  otherTasks: CleaningTask[];
  refetch: () => void;
  loading: boolean;
  error: string | null;
}

export const useDashboardData = (user: User): DashboardData => {
 
  const [checkoutTasks, setCheckoutTasks] = useState<CleaningTask[]>([]);
  const [currentTasks, setCurrentTasks] = useState<CleaningTask[]>([]);
  const [zoneTasks, setZoneTasks] = useState<CleaningTask[]>([]);
  const [otherTasks, setOtherTasks] = useState<CleaningTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const tasksResponse = await api.get(`/api/cleaningtasks/`, { params: { all: true, scheduled_date: format(new Date(), 'yyyy-MM-dd') } });
      const tasks: CleaningTask[] = tasksResponse.data;
      setCheckoutTasks(tasks.filter(task => task.cleaning_type === CLEANING_TYPES.DEPARTURE));
      setCurrentTasks(tasks.filter(task => task.cleaning_type === CLEANING_TYPES.STAYOVER));
      setZoneTasks(tasks.filter(task => task.cleaning_type === CLEANING_TYPES.PUBLIC_AREA));
      setOtherTasks(tasks.filter(task => ![
        CLEANING_TYPES.DEPARTURE,
        CLEANING_TYPES.STAYOVER,
        CLEANING_TYPES.PUBLIC_AREA
      ].includes(task.cleaning_type)));

    } catch (err) {
      console.error("Failed to fetch dashboard data:", err);
      if (isAxiosError(err) && err.response) {
        setError(err.response.data.detail || err.response.data.message || JSON.stringify(err.response.data));
      } else {
        setError('Не удалось загрузить данные панели управления.');
      }
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }


    fetchDashboardData();
  }, [user]);

 

  return {
    checkoutTasks,
    currentTasks,
    zoneTasks,
    otherTasks,
    refetch: fetchDashboardData,
    loading,
    error,
  };
};