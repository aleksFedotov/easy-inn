import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { USER_ROLES, CLEANICNG_STATUSES } from '@/lib/constants';
import { Checklist, CleaningTask, ChecklistProgress } from '@/lib/types/housekeeping';
import { useChecklistManagement } from '@/hooks/housekeeping/details/useChecklistManagement';
import ChecklistCardList from '@/components/housekeeping/ChecklistCardList';
import { AddChecklistDialog } from './AddChecklistDialog';

type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];
type CleaningStatus = typeof CLEANICNG_STATUSES[keyof typeof CLEANICNG_STATUSES];

interface ChecklistSectionProps {
    task: CleaningTask;
    checklistData: Checklist[];
    onChecklistChange: (checklistId: number, progress: ChecklistProgress) => void;
    fetchTaskDetails: () => void;
}

export const ChecklistSection: React.FC<ChecklistSectionProps> = ({
    task,
    checklistData,
    onChecklistChange,
    fetchTaskDetails,
}) => {
    const { user } = useAuth();
    const [isAddDialogOpened, setIsAddDialogOpened] = useState(false);

    const {
        isTemplatesLoading,
        isUpdatingTask,
        templatesError,
        availableChecklistsToAdd,
        fetchTemplates,
        handleAddChecklist,
        handleRemoveChecklist
    } = useChecklistManagement(task, fetchTaskDetails);

    // Эффект для загрузки шаблонов при открытии диалога
    useEffect(() => {
        if (isAddDialogOpened) {
            fetchTemplates();
        }
    }, [isAddDialogOpened, fetchTemplates]);
    
    // Функция для закрытия диалога после успешного добавления
    const handleAddAndClose = (templateId: number) => {
        handleAddChecklist(templateId);
        // Не закрываем сразу, ждем завершения isUpdatingTask
    };

    // Закрываем диалог, когда обновление завершено
    useEffect(() => {
        if (!isUpdatingTask) {
            setIsAddDialogOpened(false);
        }
    }, [isUpdatingTask]);


    const shouldRenderChecklist = (role: UserRole, status: CleaningStatus) => {
        if (role === USER_ROLES.HOUSEKEEPER) {
            return status !== CLEANICNG_STATUSES.ASSIGNED;
        }
        return status !== CLEANICNG_STATUSES.WAITING_CHECK;
    };

    const shouldShowChecklistManagement = user 
        && [USER_ROLES.MANAGER, USER_ROLES.FRONT_DESK].includes(user.role) 
        && [CLEANICNG_STATUSES.ASSIGNED,CLEANICNG_STATUSES.IN_PROGRESS].includes(task.status);

    if (!user || !shouldRenderChecklist(user.role, task.status)) {
        return null;
    }

    return (
        <>
            {checklistData.map((checklist) => (
                <ChecklistCardList
                    key={checklist.id}
                    checklist={checklist}
                    onChange={onChecklistChange}
                    onRemove={shouldShowChecklistManagement ? handleRemoveChecklist : undefined}
                />
            ))}

            {shouldShowChecklistManagement && (
                <div className="mt-4 flex justify-center">
                    <AddChecklistDialog
                        isOpen={isAddDialogOpened}
                        onOpenChange={setIsAddDialogOpened}
                        availableChecklists={availableChecklistsToAdd}
                        onAddChecklist={handleAddAndClose}
                        isLoading={isTemplatesLoading}
                        isUpdating={isUpdatingTask}
                        error={templatesError}
                        cleaningType={task.cleaning_type}
                    />
                </div>
            )}
        </>
    );
};