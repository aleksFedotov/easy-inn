import { useMemo } from 'react';
import { CleaningTask } from '@/lib/types/housekeeping';
import { CLEANING_TYPES } from '@/lib/constants';

// Хелпер: сортировка задач по приоритету
const sortTasksByPriority = (tasks: CleaningTask[]) => {
  return [...tasks].sort((a, b) => {
    // Срочные задачи
    if (a.is_rush && !b.is_rush) return -1;
    if (!a.is_rush && b.is_rush) return 1;

    // Гость выехал (только для выездных)
    if (
      a.cleaning_type === CLEANING_TYPES.DEPARTURE &&
      b.cleaning_type === CLEANING_TYPES.DEPARTURE
    ) {
      if (a.is_guest_checked_out && !b.is_guest_checked_out) return -1;
      if (!a.is_guest_checked_out && b.is_guest_checked_out) return 1;
    }

    // По времени выполнения
    const dateA = a.due_time ? new Date(a.due_time).getTime() : Infinity;
    const dateB = b.due_time ? new Date(b.due_time).getTime() : Infinity;
    return dateA - dateB;
  });
};

export const useSortedTasks = (allTasks: CleaningTask[]) => {
  const sortedCheckoutTasks = useMemo(() => {
    const filtered = allTasks.filter(task => task.cleaning_type === CLEANING_TYPES.DEPARTURE);
    return sortTasksByPriority(filtered);
  }, [allTasks]);

  const sortedCurrentTasks = useMemo(() => {
    const filtered = allTasks.filter(task => task.cleaning_type === CLEANING_TYPES.STAYOVER);
    return sortTasksByPriority(filtered);
  }, [allTasks]);

  const sortedZoneTasks = useMemo(() => {
    const filtered = allTasks.filter(task => task.cleaning_type === CLEANING_TYPES.PUBLIC_AREA);
    return sortTasksByPriority(filtered);
  }, [allTasks]);

  const sortedOtherTasks = useMemo(() => {
    const filtered = allTasks.filter(
      task =>
        ![
          CLEANING_TYPES.DEPARTURE,
          CLEANING_TYPES.STAYOVER,
          CLEANING_TYPES.PUBLIC_AREA,
        ].includes(task.cleaning_type)
    );
    return sortTasksByPriority(filtered);
  }, [allTasks]);

  return {
    sortedCheckoutTasks,
    sortedCurrentTasks,
    sortedZoneTasks,
    sortedOtherTasks,
  };
};
