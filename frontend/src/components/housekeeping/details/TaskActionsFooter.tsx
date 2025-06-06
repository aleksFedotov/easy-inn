import React from 'react';
import { Button } from '@/components/ui/button';
import { Play, CheckCircle, Flame, Loader2 } from 'lucide-react';
import { CLEANICNG_STATUSES, USER_ROLES } from '@/lib/constants';
import { CleaningTask } from '@/lib/types/housekeeping';
import { User } from '@/lib/types'; // Предполагаемый путь к типу User

interface TaskActionsFooterProps {
  user: User;
  task: CleaningTask;
  isChecklistComplete: boolean;
  isLoading: boolean;
  actions: {
    onStart: () => void;
    onFinish: () => void;
    onInspect: () => void;
    onToggleRush: () => void;
  };
}

export const TaskActionsFooter: React.FC<TaskActionsFooterProps> = ({
  user,
  task,
  isChecklistComplete,
  isLoading,
  actions,
}) => {
  if (user.role === USER_ROLES.HOUSEKEEPER) {
    if (task.status === CLEANICNG_STATUSES.ASSIGNED) {
      return (
        <Button onClick={actions.onStart} disabled={isLoading}>
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Play className="mr-2 h-4 w-4" />
          )}
          Начать уборку
        </Button>
      );
    }

    if (task.status === CLEANICNG_STATUSES.IN_PROGRESS) {
      return (
        <Button onClick={actions.onFinish} disabled={!isChecklistComplete || isLoading}>
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <CheckCircle className="mr-2 h-4 w-4" />
          )}
          Завершить уборку
        </Button>
      );
    }
  }

  if ([USER_ROLES.MANAGER, USER_ROLES.FRONT_DESK].includes(user.role)) {
    const canBeChecked = [CLEANICNG_STATUSES.WAITING_CHECK, CLEANICNG_STATUSES.COMPLETED].includes(task.status);
    const canBeRushed = ![CLEANICNG_STATUSES.COMPLETED, CLEANICNG_STATUSES.WAITING_CHECK, CLEANICNG_STATUSES.CHECKED].includes(task.status);

    return (
      <>
        {canBeChecked && (
          <Button onClick={actions.onInspect} disabled={!isChecklistComplete || isLoading}>
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle className="mr-2 h-4 w-4" />
            )}
            Завершить проверку
          </Button>
        )}
        {canBeRushed && (
          <Button variant="secondary" onClick={actions.onToggleRush} disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Flame className={`mr-2 h-4 w-4 ${task.is_rush ? 'text-red-500' : 'text-gray-500'}`} />
            )}
            {task.is_rush ? 'Снять срочность' : 'Пометить как срочную'}
          </Button>
        )}
      </>
    );
  }

  return null;
};