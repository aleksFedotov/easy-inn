import { useMemo } from 'react';
import { CleaningTask } from '@/lib/types/housekeeping';
import {  CLEANING_TYPE_ORDER } from '@/lib/constants';

type ChecklistSummary = Record<string, Record<string, { total: number }>>;

export const useChecklistSummary = (tasks: CleaningTask[]) => {
  const checklistSummary: ChecklistSummary = useMemo(() => {
    const summary: ChecklistSummary = {};

    tasks.forEach(task => {
      const cleaningTypeDisplay = task.cleaning_type_display || 'Неизвестный тип';
      const checklistNames = task.associated_checklist_names?.length
        ? task.associated_checklist_names.join(', ')
        : 'Без чек-листа';

      if (!summary[cleaningTypeDisplay]) {
        summary[cleaningTypeDisplay] = {};
      }
      if (!summary[cleaningTypeDisplay][checklistNames]) {
        summary[cleaningTypeDisplay][checklistNames] = { total: 0 };
      }

      summary[cleaningTypeDisplay][checklistNames].total++;
    });

    return summary;
  }, [tasks]);

  const sortedChecklistSummaryKeys = useMemo(() => {
    const keys = Object.keys(checklistSummary);

    return keys.sort((a, b) => {
      const indexA = CLEANING_TYPE_ORDER.indexOf(a);
      const indexB = CLEANING_TYPE_ORDER.indexOf(b);

      if (indexA !== -1 && indexB !== -1) return indexA - indexB;
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
      return a.localeCompare(b);
    });
  }, [checklistSummary]);

  return { checklistSummary, sortedChecklistSummaryKeys };
};
