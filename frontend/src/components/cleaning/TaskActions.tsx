import api from '@/lib/api';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { Fragment, useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
    Play,
    XCircle,
    CheckSquare,
    Eye,
    Loader,
    Trash2,
    MoreVertical,
    Edit,
} from 'lucide-react';
import { CleaningTask, User } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';


/**
 * TaskActions component provides a dropdown menu with actions for a cleaning task.
 * Actions include viewing details, editing, deleting, and changing task status.
 *
 * @param {TaskActionsProps} { task, user, fetchCleaningTasks, selectedDate, onDelete, onEdit } - Props for the component.
 * @returns {JSX.Element} The TaskActions component.
 */
const TaskActions = ({ task, user, fetchCleaningTasks, selectedDate, onDelete, onEdit }: {
    task: CleaningTask;
    user: User | null;
    fetchCleaningTasks: (date: string) => void;
    selectedDate: string;
    onDelete: (task: CleaningTask) => void;
    onEdit: (task: CleaningTask) => void;
}) => {
    const router = useRouter();
    const [isPerformingAction, setIsPerformingAction] = useState(false);

    // Handler for changing task status
    const handleStatusChange = useCallback(async (action: 'start' | 'complete' | 'check' | 'cancel') => {
        setIsPerformingAction(true);
        try {
            const response = await api.post(`/api/cleaningtasks/${task.id}/${action}/`);
            if (response.status === 200) {
                toast.success(`Статус задачи изменен на ${action}`); // Success toast notification
                fetchCleaningTasks(selectedDate); // Refresh tasks after status change
            } else {
                toast.error(`Не удалось изменить статус: ${response.status}`); // Error toast notification
            }
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                toast.error(error.response.data.detail || error.response.data.message || JSON.stringify(error.response.data));
            } else {
                toast.error('Произошла ошибка при изменении статуса задачи.');
            }
        } finally {
            setIsPerformingAction(false);
        }
    },[fetchCleaningTasks, selectedDate,  task.id]);

    // Memoized array of available actions based on task status and user role
    const actions = useMemo(() => {
        const availableActions = [];

        if (user) { // Check if user object exists
            switch (task.status) {
                case 'assigned': // Assigned status
                case 'on_hold': // On hold status
                    // "Start" button for housekeeper (if assigned) or manager/front-desk
                    if ((user.role === 'housekeeper' && task.assigned_to === user.id) || user.role === 'manager' || user.role === 'front-desk') {
                        availableActions.push({
                            label: 'Начать',
                            icon: <Play size={16} className="mr-2 h-4 w-4" />,
                            onClick: () => handleStatusChange('start'),
                        });
                    }
                    // "Cancel" button for manager/front-desk
                    if (user.role === 'manager' || user.role === 'front-desk') {
                        availableActions.push({
                            label: 'Отменить',
                            icon: <XCircle size={16} className="mr-2 h-4 w-4" />,
                            onClick: () => handleStatusChange('cancel'),
                        });
                    }
                    break;
                case 'in_progress': // In progress status
                    // "Complete" button for housekeeper (if assigned) or manager/front-desk
                    if ((user.role === 'housekeeper' && task.assigned_to === user.id) || user.role === 'manager' || user.role === 'front-desk') {
                        availableActions.push({
                            label: 'Завершить',
                            icon: <CheckSquare size={16} className="mr-2 h-4 w-4" />,
                            onClick: () => handleStatusChange('complete'),
                        });
                    }
                    // "Cancel" button for manager/front-desk
                    if (user.role === 'manager' || user.role === 'front-desk') {
                        availableActions.push({
                            label: 'Отменить',
                            icon: <XCircle size={16} className="mr-2 h-4 w-4" />,
                            onClick: () => handleStatusChange('cancel'),
                        });
                    }

                    break;
                case 'completed': // Completed status
                case 'waiting_inspection': // Waiting inspection status
                    // "Check" button for manager/front-desk
                    if (user.role === 'manager' || user.role === 'front-desk') {
                        availableActions.push({
                            label: 'Проверить',
                            icon: <Eye size={16} className="mr-2 h-4 w-4" />,
                            onClick: () => handleStatusChange('check'),
                        });
                        // "Cancel" button for manager/front-desk
                        availableActions.push({
                            label: 'Отменить',
                            icon: <XCircle size={16} className="mr-2 h-4 w-4" />,
                            onClick: () => handleStatusChange('cancel'),
                        });
                    }
                    break;
                case 'checked': // Checked status
                    // "Cancel" button for manager/front-desk
                    if (user.role === 'manager' || user.role === 'front-desk') {
                        availableActions.push({
                            label: 'Отменить',
                            icon: <XCircle size={16} className="mr-2 h-4 w-4" />,
                            onClick: () => handleStatusChange('cancel'),
                        });
                    }
                    break;
                case 'canceled': // Canceled status
                    break;
            }
        }

        return availableActions;
    }, [task, user, handleStatusChange]);

    // Show spinner if an action is in progress
    if (isPerformingAction) {
        return <Loader className="animate-spin" />;
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Открыть меню</span>
                    <MoreVertical className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => router.push(`/housekeeping/${task.id}`)}>
                    <Eye className="mr-2 h-4 w-4" />
                    Просмотр деталей
                </DropdownMenuItem>
                {(user?.role === 'manager' || user?.role === 'front-desk') && (
                    <Fragment>
                        <DropdownMenuItem onClick={() => onEdit(task)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Редактировать
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onDelete(task)}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Удалить
                        </DropdownMenuItem>
                </Fragment>
                )}
                {/* Render status change actions */}
                {actions.map((action, index) => (
                    <DropdownMenuItem key={index} onClick={action.onClick}>
                        {action.icon}
                        {action.label}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export default TaskActions