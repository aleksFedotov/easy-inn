'use client';

import React from 'react';
import { useAuth } from '@/lib/AuthContext';
import { Spinner } from '@/components/spinner';
import ErrorMessage from '@/components/ErrorMessage';
import { useDashboardData } from '@/hooks/dashboard/useDashboardData'; 
import DashboardStatsCard from '@/components/dashboard/DashboardStatsCard'; 
import RoomStatusChartCard from '@/components/dashboard/RoomStatusChartCard'; 
import CleaningTasksSection from '@/components/CleaningTasksSection'

const DashboardPage: React.FC = () => {
  const { user, isLoading: isAuthLoading } = useAuth();

  
  const { 
    checkoutTasks, 
    currentTasks, 
    zoneTasks, 
    otherTasks, 
    cleaningStats, 
    roomStatuses, 
    loading, 
    error 
  } = useDashboardData(user!);
  
  if (!user) return <div>Пользователь не найден.</div>;
  if (isAuthLoading || loading) return <div className="flex items-center justify-center min-h-screen"><Spinner /></div>;
  if (error) return <ErrorMessage message={error} />;


   return (
    <div className="container mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-8">Панель управления</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <DashboardStatsCard cleaningStats={cleaningStats} />
        <RoomStatusChartCard roomStatuses={roomStatuses} />
      </div>

      <CleaningTasksSection 
        checkoutTasks={checkoutTasks} 
        currentTasks={currentTasks} 
        zoneTasks={zoneTasks} 
        otherTasks={otherTasks}
        isDashBoard={true}  
      />
    </div>
  );
};

export default DashboardPage;
