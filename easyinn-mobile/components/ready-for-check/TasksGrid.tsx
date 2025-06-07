import React, { useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import TaskCard from '@/components/TaskCard';
import { CleaningTask } from '@/lib/types';
import { CLEANICNG_STATUSES } from '@/lib/constants';

interface TasksGridProps {
  tasks: CleaningTask[];
}

const TasksGrid: React.FC<TasksGridProps> = ({ tasks }) => {
  const getCardColor = useCallback((status: string) => {
    return status === CLEANICNG_STATUSES.COMPLETED ? '#D1FAE5' : '#FEF3C7';
  }, []);

  return (
    <View style={styles.grid}>
      {tasks.map(task => (
        <TaskCard
          key={task.id}
          task={task}
          cardColor={getCardColor(task.status)}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'column',
    paddingBottom: 16,
  },
  item: {
    width: '100%',
    marginBottom: 12,
  },
});
export default TasksGrid;
