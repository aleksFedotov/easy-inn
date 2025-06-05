import { useState, useEffect } from 'react';
import { CleaningTask, CleaningStats, RoomStatuses, User } from '@/lib/types';
import api from '@/lib/api';
import axios from 'axios';
import { format } from 'date-fns';
import { CLEANING_TYPES } from '@/lib/constants';

interface DashboardData {
  checkoutTasks: CleaningTask[];
  currentTasks: CleaningTask[];
  zoneTasks: CleaningTask[];
  otherTasks: CleaningTask[];
  cleaningStats: CleaningStats;
  roomStatuses: RoomStatuses;
  loading: boolean;
  error: string | null;
}

export const useDashboardData = (user: User): DashboardData => {
  const [cleaningStats, setCleaningStats] = useState<CleaningStats>({
    checkoutTotal: 0,
    checkoutCompleted: 0,
    checkoutAvgTime: 0,
    currentTotal: 0,
    currentCompleted: 0,
    currentAvgTime: 0,
  });
  const [roomStatuses, setRoomStatuses] = useState<RoomStatuses>({
    clean: 0,
    dirty: 0,
    in_progress: 0,
    waiting_inspection: 0,
    free: 0,
    occupied: 0,
    assigned: 0,
    on_maintenance: 0,
  });
  const [checkoutTasks, setCheckoutTasks] = useState<CleaningTask[]>([]);
  const [currentTasks, setCurrentTasks] = useState<CleaningTask[]>([]);
  const [zoneTasks, setZoneTasks] = useState<CleaningTask[]>([]);
  const [otherTasks, setOtherTasks] = useState<CleaningTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

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

        const statsResponse = await api.get('/api/cleaning/stats/', { params: { all: true } });
        setCleaningStats(statsResponse.data);

        const statusesResponse = await api.get('/api/rooms/status-summary/', { params: { all: true } });
        setRoomStatuses(statusesResponse.data);

      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
        if (axios.isAxiosError(err) && err.response) {
          setError(err.response.data.detail || err.response.data.message || JSON.stringify(err.response.data));
        } else {
          setError('Не удалось загрузить данные панели управления.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  return {
    checkoutTasks,
    currentTasks,
    zoneTasks,
    otherTasks,
    cleaningStats,
    roomStatuses,
    loading,
    error,
  };
};