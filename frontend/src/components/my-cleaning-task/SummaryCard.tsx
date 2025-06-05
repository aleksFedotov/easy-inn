import React from 'react';
import { Flame } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface SummaryCardProps {
  totalTasks: number;
  rushTasksCount: number;
}

const SummaryCard: React.FC<SummaryCardProps> = ({ totalTasks, rushTasksCount }) => {
  return (
    <Card className="bg-blue-50 p-4 rounded-lg shadow-sm mb-6 flex items-center justify-between">
      <p className="text-lg font-medium">
        Всего задач: <span className="font-bold">{totalTasks}</span>
      </p>

      {rushTasksCount > 0 && (
        <p className="text-lg font-medium text-red-600 flex items-center">
          <Flame size={20} className="mr-1" />
          Срочных: <span className="font-bold">{rushTasksCount}</span>
        </p>
      )}
    </Card>
  );
};

export default SummaryCard;