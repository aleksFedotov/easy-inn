import { useState, useCallback } from 'react';
import { CleaningTask } from '@/lib/types';
import { format } from 'date-fns';
import api  from '@/lib/api';
import axios from 'axios';
import { toast } from 'sonner';


interface UseTaskModalsProps {
    fetchCleaningTasks: (date: string) => Promise<CleaningTask[]>;
    selectedDate?: Date;
}

const useTaskModals = ({ fetchCleaningTasks, selectedDate }: UseTaskModalsProps) => {
    const [isCreateEditTaskModalOpen, setIsCreateEditTaskModalOpen] = useState(false)
    const [taskToEdit, setTaskToEdit] = useState<CleaningTask | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [taskToDelete, setTaskToDelete] = useState<CleaningTask | null>(null);
    const [isHousekeeperSelectionModalOpen, setIsHousekeeperSelectionModalOpen] = useState(false);
    const [isAssignTasksModalOpened, setIsAssignTasksModalOpened] = useState<boolean >(false);
   
    // Handlers for Create
    const handleCreateEditTaskClick = useCallback(() => {
        setIsCreateEditTaskModalOpen(true);
    }, []);

    const handleCreateEditTaskSuccess = useCallback(() => {
        setIsCreateEditTaskModalOpen(false);
        if (selectedDate) {
            fetchCleaningTasks(format(selectedDate, 'yyyy-MM-dd'));
        }
        toast.success(taskToEdit ? 'Задача по уборке успешно отредактирована!': 'Задача по уборке успешно создана!');
    }, [selectedDate, fetchCleaningTasks, taskToEdit]);

    const handleCreateEditTaskCancel = useCallback(() => {
        setIsCreateEditTaskModalOpen(false);
        setTaskToEdit(null)
    }, []);


    // Handlers for Delete
    const handleDeleteTask = useCallback((task: CleaningTask) => {
        setTaskToDelete(task);
        setIsDeleteModalOpen(true);
    }, []);

    const confirmDeleteTask = useCallback(async () => {
        if (!taskToDelete) return;

        try {
            const response = await api.delete(`/api/cleaningtasks/${taskToDelete.id}/`);
            if (response.status === 204) {
                toast.success('Задача по уборке успешно удалена!');
                if (selectedDate) {
                    fetchCleaningTasks(format(selectedDate, 'yyyy-MM-dd'));
                }
                setIsDeleteModalOpen(false);
                setTaskToDelete(null);
            } else {
                toast.error(`Не удалось удалить задачу: ${response.status}`);
            }
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                toast.error(error.response.data.detail || error.response.data.message || JSON.stringify(error.response.data));
            } else {
                toast.error('Произошла ошибка при удалении задачи.');
            }
        }
    }, [taskToDelete, selectedDate, fetchCleaningTasks]);

    const handleDeleteCancel = useCallback(() => {
        setIsDeleteModalOpen(false);
        setTaskToDelete(null);
    }, []);

    // Handlers for Housekeeper Selection Modal
    const handleOpenHousekeeperSelectionModal = useCallback(() => {
        setIsHousekeeperSelectionModalOpen(true);
    }, []);

    const handleConfirmHousekeeperSelection = useCallback(() => {
        setIsHousekeeperSelectionModalOpen(false);
    }, []);

    const handleCloseHousekeeperSelectionModal = useCallback(() => {
        setIsHousekeeperSelectionModalOpen(false);
    }, []);

    const handleOpenAssignTasksModal = useCallback(() => {
        setIsAssignTasksModalOpened(true)
    }, [])
    const handleCloseAssignTasksModal = useCallback(() => {
        setIsAssignTasksModalOpened(false)
    },[])



    return {
        isCreateEditTaskModalOpen,
        setIsCreateEditTaskModalOpen,
        taskToEdit,
        setTaskToEdit,
        isDeleteModalOpen,
        setIsDeleteModalOpen,
        taskToDelete,
        setTaskToDelete,
        isHousekeeperSelectionModalOpen,
        setIsHousekeeperSelectionModalOpen,
        isAssignTasksModalOpened,
        setIsAssignTasksModalOpened,
        handleCreateEditTaskClick,
        handleCreateEditTaskSuccess,
        handleCreateEditTaskCancel,
        handleDeleteTask,
        confirmDeleteTask,
        handleDeleteCancel,
        handleOpenHousekeeperSelectionModal,
        handleConfirmHousekeeperSelection,
        handleCloseHousekeeperSelectionModal,
        handleOpenAssignTasksModal,
        handleCloseAssignTasksModal,
    };
};

export default useTaskModals;