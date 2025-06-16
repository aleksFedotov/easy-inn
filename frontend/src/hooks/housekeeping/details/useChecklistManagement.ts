import { useState, useMemo, useCallback } from 'react';
import { Checklist, CleaningTask } from '@/lib/types/housekeeping';
import api from '@/lib/api';
import axios from 'axios';

export function useChecklistManagement(
    taskDetails: CleaningTask | null, 
    fetchTaskDetails: () => void
) {
    const [allChecklistTemplates, setAllChecklistTemplates] = useState<Checklist[]>([]);
    const [isTemplatesLoading, setIsTemplatesLoading] = useState(false);
    const [templatesError, setTemplatesError] = useState<string | null>(null);
    const [isUpdatingTask, setIsUpdatingTask] = useState(false);

    // Загрузка всех доступных шаблонов для данного типа уборки
    const fetchTemplates = useCallback(async () => {
        if (!taskDetails?.cleaning_type) return;

        setIsTemplatesLoading(true);
        setTemplatesError(null);
        try {
            const response = await api.get<Checklist[]>(`/api/checklisttemplates/available_checklists`, {
                params: { cleaning_type: taskDetails.cleaning_type, all: true }
            });
            setAllChecklistTemplates(response.data);
        } catch (err) {
            const errorMessage = axios.isAxiosError(err) && err.response 
                ? err.response.data.detail || 'Ошибка загрузки шаблонов чек-листов.'
                : 'Неизвестная ошибка при загрузке шаблонов чек-листов.';
            setTemplatesError(errorMessage);
        } finally {
            setIsTemplatesLoading(false);
        }
    }, [taskDetails?.cleaning_type]);

    // Фильтрация шаблонов, которые еще не добавлены к задаче
    const availableChecklistsToAdd = useMemo(() => {
        if (!taskDetails) return [];
        const currentAssociatedIds = new Set(taskDetails.associated_checklists);
        return allChecklistTemplates.filter(
            (checklist) => !currentAssociatedIds.has(checklist.id)
        );
    }, [taskDetails, allChecklistTemplates]);

    // Общая функция для обновления ID связанных чек-листов
    const updateTaskChecklists = useCallback(async (newChecklistIds: number[]) => {
        if (!taskDetails?.id) return;
        
        setIsUpdatingTask(true);
        try {
            await api.patch(`/api/cleaningtasks/${taskDetails.id}/`, {
                associated_checklists: newChecklistIds
            });
            await fetchTaskDetails(); // Обновляем данные всей задачи
        } catch (err) {
            const errorMessage = axios.isAxiosError(err) && err.response 
                ? err.response.data.detail || 'Ошибка обновления чек-листов задачи.'
                : 'Неизвестная ошибка при обновлении чек-листов.';
            setTemplatesError(errorMessage); // Можно использовать тот же стейт для ошибок
        } finally {
            setIsUpdatingTask(false);
        }
    }, [taskDetails?.id, fetchTaskDetails]);

    // Обработчик добавления
    const handleAddChecklist = useCallback((templateIdToAdd: number) => {
        if (!taskDetails) return;
        const newChecklistIds = [...taskDetails.associated_checklists, templateIdToAdd];
        updateTaskChecklists(newChecklistIds);
    }, [taskDetails, updateTaskChecklists]);

    // Обработчик удаления
    const handleRemoveChecklist = useCallback((checklistIdToRemove: number) => {
        if (!taskDetails) return;
        const newChecklistIds = taskDetails.associated_checklists.filter(
            (id) => id !== checklistIdToRemove
        );
        updateTaskChecklists(newChecklistIds);
    }, [taskDetails, updateTaskChecklists]);

    return {
        isTemplatesLoading,
        isUpdatingTask,
        templatesError,
        availableChecklistsToAdd,
        fetchTemplates,
        handleAddChecklist,
        handleRemoveChecklist
    };
}