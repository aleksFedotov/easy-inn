import  {useState, useMemo} from "react";
import { Checklist, ChecklistProgress } from "@/lib/types/housekeeping";

interface ChecklistState {
    [key: number]: ChecklistProgress 
}

export const useChecklistLogic = (checklistData: Checklist[]) => {
  const [checklistsState, setChecklistsState] = useState<ChecklistState>({});
  
  const isChecklistComplete = useMemo(() => {
    if (checklistData.length === 0) return true;
    
    return Object.values(checklistsState).every(
      ({ total, completed }) => total > 0 && completed === total
    );
  }, [checklistsState, checklistData]);

  const totalProgress = useMemo(() => {
    if (checklistData.length === 0) return 0;

    const total = checklistData.reduce((sum, checklist) => {
        const checklistProgress = checklistsState[checklist.id];
        if (!checklistProgress) return sum; 

        const completed = checklistProgress.completed || 0;
        const totalItems = checklistProgress.total || 0;
        return sum + (totalItems === 0 ? 100 : (completed / totalItems) * 100);
    }, 0);

    return checklistData.length === 0 ? 0 : total / checklistData.length;
  }, [checklistsState, checklistData]);

  return {
    checklistsState,
    isChecklistComplete,
    totalProgress,
    updateChecklist: setChecklistsState
  };
};