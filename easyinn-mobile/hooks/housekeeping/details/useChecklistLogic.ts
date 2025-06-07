import { useEffect, useState, useMemo } from "react";
import { Checklist, ChecklistProgress } from "@/lib/types";

interface ChecklistState {
  [key: number]: ChecklistProgress;
}

export const useChecklistLogic = (checklistData: Checklist[]) => {
  const [checklistsState, setChecklistsState] = useState<ChecklistState>({});

  
  useEffect(() => {
    const initialState: ChecklistState = {};
    checklistData.forEach((checklist) => {
      if (!(checklist.id in checklistsState)) {
        initialState[checklist.id] = {
          total: checklist.items.length,
          completed: 0,
        };
      }
    });

    // Обновим state, если есть что добавить
    if (Object.keys(initialState).length > 0) {
      setChecklistsState((prev) => ({ ...initialState, ...prev }));
    }
  }, [checklistData]);

  const isChecklistComplete = useMemo(() => {
    if (checklistData.length === 0) return true;

    return checklistData.every((checklist) => {
      const progress = checklistsState[checklist.id];
      return progress && progress.total > 0 && progress.completed === progress.total;
    });
  }, [checklistsState, checklistData]);

  const totalProgress = useMemo(() => {
    if (checklistData.length === 0) return 0;

    const total = checklistData.reduce((sum, checklist) => {
      const progress = checklistsState[checklist.id];
      if (!progress) return sum;

      const { completed, total } = progress;
      return sum + (total === 0 ? 100 : (completed / total) * 100);
    }, 0);

    return total / checklistData.length;
  }, [checklistsState, checklistData]);

  return {
    checklistsState,
    isChecklistComplete,
    totalProgress,
    updateChecklist: setChecklistsState,
  };
};