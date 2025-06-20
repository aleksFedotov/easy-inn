import api from '@/lib/api';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { Fragment, useState } from 'react';
import { toast } from 'sonner';
import {
    Eye,
    Loader,
    Trash2,
    MoreVertical,
    Edit,
    Flame,
} from 'lucide-react';
import { CleaningTask } from '@/lib/types/housekeeping';
import {  User } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
// import { useHousekeepingState } from '@/context/HousekeepingContext';

interface TaskActionsProps {
    task: CleaningTask;
    user: User | null;
    // fetchCleaningTasks: (date: string) => void;

    onDelete: (task: CleaningTask) => void;
    onEdit: (task: CleaningTask) => void;
}

const TaskActions:React.FC<TaskActionsProps> = ({ task, user, onDelete, onEdit }) => {
    const router = useRouter();
    const [isPerformingAction, setIsPerformingAction] = useState(false);
    // const {selectedDate} = useHousekeepingState()

    const handleToggleRush = async () => {
        setIsPerformingAction(true);
        const newRushStatus = !task.is_rush; 

        try {
            
            const response = await api.patch(`/api/cleaningtasks/${task.id}/set_rush/`, { // Убедитесь, что URL правильный
                is_rush: newRushStatus
            });

            if (response.status === 200) {
                toast.success(`Задача успешно ${newRushStatus ? 'помечена как срочная' : 'снята с срочных'}.`);
                // fetchCleaningTasks(selectedDate); 
            } else {
                // Обработка неуспешного ответа
                toast.error(`Не удалось изменить статус срочности. Статус: ${response.status}`);
            }
        } catch (err) {
            // Обработка ошибок сети или API
            console.error('Error toggling rush status:', err);
            let errorMessage = 'Произошла ошибка при изменении статуса срочности.';
            if (axios.isAxiosError(err) && err.response) {
                errorMessage = err.response.data.detail || JSON.stringify(err.response.data) || errorMessage;
            }
            toast.error(errorMessage);
        } finally {
            setIsPerformingAction(false); // Снимаем флаг выполнения действия
        }

    }


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
                        <DropdownMenuItem onClick={handleToggleRush}> {/* Вызываем новую функцию */}
                            <Flame className={`mr-2 h-4 w-4 ${task.is_rush ? 'text-red-600' : 'text-gray-500'}`} /> {/* Меняем цвет иконки */}
                            {task.is_rush ? 'Снять срочность' : 'Пометить как срочную'} {/* Динамический текст */}
                        </DropdownMenuItem>
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
                {/* Render status change actions
                {actions.map((action, index) => (
                    <DropdownMenuItem key={index} onClick={action.onClick}>
                        {action.icon}
                        {action.label}
                    </DropdownMenuItem>
                ))} */}
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export default TaskActions