import { useMemo } from 'react';
import { CleaningTask } from '@/lib/types';

export const useTaskSorting = (tasks: CleaningTask[]) => {
  return useMemo(() => {
    return [...tasks].sort((a, b) => {
      if (a.is_rush && !b.is_rush) return -1;
      if (!a.is_rush && b.is_rush) return 1;

    
      const dateA = a.due_time ? new Date(a.due_time).getTime() : Infinity;
      const dateB = b.due_time ? new Date(b.due_time).getTime() : Infinity;
      return dateA - dateB;
    });
  }, [tasks]);
};