import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CleaningStats } from '@/lib/types/housekeeping'; 

interface DashboardStatsCardProps {
  cleaningStats: CleaningStats;
}

const DashboardStatsCard: React.FC<DashboardStatsCardProps> = ({ cleaningStats }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Статистика уборки</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <h2 className="text-xl font-semibold mb-2">Уборки после выезда</h2>
          <p>Завершено: {cleaningStats.checkoutCompleted} / {cleaningStats.checkoutTotal}</p>
          <Progress 
            value={(cleaningStats.checkoutCompleted / cleaningStats.checkoutTotal) * 100 || 0} // Добавлено || 0 для избежания NaN
            className="mb-2" 
          />
          <p>Среднее время: {cleaningStats.checkoutAvgTime} мин</p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">Текущие уборки</h2>
          <p>Завершено: {cleaningStats.currentCompleted} / {cleaningStats.currentTotal}</p>
          <Progress 
            value={(cleaningStats.currentCompleted / cleaningStats.currentTotal) * 100 || 0} // Добавлено || 0 для избежания NaN
            className="mb-2" 
          />
          <p>Среднее время: {cleaningStats.currentAvgTime} мин</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default React.memo(DashboardStatsCard); 