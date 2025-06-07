import React, { useCallback } from 'react';
import { CleaningTask } from '@/lib/types';
import CleaningTaskCard from '@/components/housekeeping/CleaningTaskCard';
import { CLEANICNG_STATUSES } from '@/lib/constants';

interface TasksGridProps {
  tasks: CleaningTask[];
}

const TasksGrid: React.FC<TasksGridProps> = ({ tasks }) => {
  const getCardColor = useCallback((status: string) => {
    return status === CLEANICNG_STATUSES.COMPLETED ? 'bg-green-100' : 'bg-orange-100';
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {tasks.map(task => (
        <CleaningTaskCard
          key={task.id}
          task={task}
          cardColor={getCardColor(task.status)}
        />
      ))}
    </div>
  );
};

export default TasksGrid;