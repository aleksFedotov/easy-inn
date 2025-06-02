'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { CleaningTask } from '@/lib/types';
import CleaningTaskCard from '@/components/cleaning/CleaningTaskCard';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Spinner } from '@/components/spinner';
import ErrorMessage from '@/components/ErrorMessage';
import api from '@/lib/api';
import axios from 'axios';
import { LogOut, Bed, House } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CleaningStats, RoomStatuses } from '@/lib/types';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { format } from 'date-fns';
import { CLEANING_TYPES } from '@/lib/constants';

const COLORS = ['#2563eb', '#dc2626', '#a855f7', '#16a34a', '#eab308', '#0e7490', '#f97316', '#7e22ce', '#0284c7'];


const DashboardPage: React.FC = () => {
  const { user, isLoading: isAuthLoading } = useAuth();
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkoutTasks, setCheckoutTasks] = useState<CleaningTask[]>([]);
  const [currentTasks, setCurrentTasks] = useState<CleaningTask[]>([]);
  const [zoneTasks, setZoneTasks] = useState<CleaningTask[]>([]);

  useEffect(() => {
    if (!user) return;

    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null);
      try {
        const tasksResponse = await api.get(`/api/cleaningtasks/`, { params: { all: true , scheduled_date:format(new Date(), 'yyyy-MM-dd')} });
        const tasks: CleaningTask[] = tasksResponse.data;
        setCheckoutTasks(tasks.filter(task => task.cleaning_type === CLEANING_TYPES.DEPARTURE));
        setCurrentTasks(tasks.filter(task => task.cleaning_type !== CLEANING_TYPES.DEPARTURE && task.zone_name === null));
        setZoneTasks(tasks.filter(task => task.zone_name !== null));

        const statsResponse = await api.get('/api/cleaning/stats/', { params: { all: true } });
        setCleaningStats(statsResponse.data);
        

        const statusesResponse = await api.get('/api/rooms/status-summary/', { params: { all: true } });
        setRoomStatuses(statusesResponse.data);
      } catch (err) {
        console.error(err);
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

 

  if (isAuthLoading || loading) return <div className="flex items-center justify-center min-h-screen"><Spinner /></div>;
  if (error) return <ErrorMessage message={error} />;
  if (!user) return <div>Пользователь не найден.</div>;


    const statusTranslation: Record<string, string> = {
        clean: 'Чистый',
        dirty: 'Грязный',
        in_progress: 'Убирается',
        waiting_inspection: 'Ожидает проверки',
        free: 'Свободный',
        occupied: 'Занят',
        assigned: 'Назначен',
        on_maintenance: 'На обслуживании',
    };

    const roomStatusEntries = Object.entries(roomStatuses).map(([status, count], index) => ({
        name: statusTranslation[status] || status,
        value: count,
        color: COLORS[index % COLORS.length],
    }));

  return (
    <div className="container mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-8">Панель управления</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Статистика уборки</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <h2 className="text-xl font-semibold mb-2">Уборки после выезда</h2>
              <p>Завершено: {cleaningStats.checkoutCompleted} / {cleaningStats.checkoutTotal}</p>
              <Progress value={(cleaningStats.checkoutCompleted / cleaningStats.checkoutTotal) * 100} className="mb-2" />
              <p>Среднее время: {cleaningStats.checkoutAvgTime} мин</p>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-2">Текущие уборки</h2>
              <p>Завершено: {cleaningStats.currentCompleted} / {cleaningStats.currentTotal}</p>
              <Progress value={(cleaningStats.currentCompleted / cleaningStats.currentTotal) * 100} className="mb-2" />
              <p>Среднее время: {cleaningStats.currentAvgTime} мин</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Статусы номеров</CardTitle>
          </CardHeader>
           <CardContent>
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="w-full md:w-2/3 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={roomStatusEntries}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                      label={false}
                    >
                      {roomStatusEntries.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) =>
                        active && payload && payload.length ? (
                          <div className="p-2 rounded shadow text-sm">
                            <p className="font-semibold">{payload[0].payload.name}</p>
                            <p>Количество: {payload[0].value}</p>
                          </div>
                        ) : null
                      }
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-full md:w-1/3 space-y-2">
                {roomStatusEntries.map((entry, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                    <span className="text-sm font-medium">{entry.name}</span>
                    <span className="ml-auto text-sm">{entry.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <h2 className="text-2xl font-bold mt-8 mb-4">Последние задачи по уборке</h2>
      <Tabs defaultValue="checkout">
        <TabsList className="flex justify-center space-x-4 mb-4">
          <TabsTrigger value="checkout" className="flex items-center space-x-2"><LogOut size={16} /><span>Выезд</span></TabsTrigger>
          <TabsTrigger value="current" className="flex items-center space-x-2"><Bed size={16} /><span>Текущая</span></TabsTrigger>
          <TabsTrigger value="zones" className="flex items-center space-x-2"><House size={16} /><span>Зоны</span></TabsTrigger>
        </TabsList>

        <TabsContent value="checkout">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {checkoutTasks.map(task => (
              <CleaningTaskCard key={task.id} task={task} cardColor={task.is_guest_checked_out ? 'bg-red-100' : 'bg-gray-100'} />
            ))}
            {checkoutTasks.length === 0 && <p className="text-gray-500">Нет задач уборки после выезда.</p>}
          </div>
        </TabsContent>

        <TabsContent value="current">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentTasks.map(task => (
              <CleaningTaskCard key={task.id} task={task} cardColor="bg-yellow-100" />
            ))}
            {currentTasks.length === 0 && <p className="text-gray-500">Нет текущих задач уборки.</p>}
          </div>
        </TabsContent>

        <TabsContent value="zones">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {zoneTasks.map(task => (
              <CleaningTaskCard key={task.id} task={task} cardColor="bg-yellow-100" />
            ))}
            {zoneTasks.length === 0 && <p className="text-gray-500">Нет задач уборки зон.</p>}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DashboardPage;
