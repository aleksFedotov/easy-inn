import { User, CleaningTask } from "@/lib/types";
import { useDrag } from 'react-dnd';



interface TaskAction {
    label: string;
    icon: React.ReactNode;
    onClick: () => void;
    color: string;
    disabled: boolean;
}

interface DraggableTaskRowProps {
    task: CleaningTask;
    getStatusDisplay: (status: CleaningTask['status'] | undefined) => { icon: React.ReactNode, text: string };
    getTaskActions: (task: CleaningTask) => TaskAction[];
    isPerformingAction: boolean;
    isCreateTaskModalOpen: boolean;
    assigningTaskId: number | null;
    changingStatusTaskId: number | null;
    // TODO: Возможно, передать user для логики canDrag, если она зависит от роли
    user: User | null;
}

export const DraggableTaskRow: React.FC<DraggableTaskRowProps> = ({
    task,
    getStatusDisplay,
    getTaskActions,
    isPerformingAction,
    isCreateTaskModalOpen,
    assigningTaskId,
    changingStatusTaskId,
    user, 
}) => {
    const statusInfo = getStatusDisplay(task.status);
    const taskActions = getTaskActions(task);

    // Используем хук useDrag для этой строки задачи
    const [{ isDragging }, drag] = useDrag(() => ({
        type: 'task', // Тип перетаскиваемого элемента
        item: { id: task.id }, // Данные, которые будут переданы при перетаскивании
        collect: (monitor) => ({
            isDragging: monitor.isDragging(), // Отслеживаем, перетаскивается ли этот элемент
        }),
        // Отключаем перетаскивание, если задача назначена, или выполняется другое действие (смена статуса, открытие формы, другое назначение)
        // Проверяем assigned_to === null для неназначенных задач
        canDrag: task.assigned_to === null && !isPerformingAction && !isCreateTaskModalOpen && assigningTaskId === null, // <-- Условие для возможности перетаскивания
    }), [task.id, task.assigned_to, isPerformingAction, isCreateTaskModalOpen, assigningTaskId]); // Зависимости useDrag


    return (
        // Привязываем ref из useDrag к элементу строки таблицы
        // Добавляем стили в зависимости от состояния перетаскивания
        <tr
             key={task.id} // Ключ остается здесь, т.к. это элемент списка
             ref={drag} // <-- Привязываем ref для перетаскивания
             style={{ opacity: isDragging ? 0.5 : 1, cursor: task.assigned_to === null && !isPerformingAction && !isCreateTaskModalOpen && assigningTaskId === null ? 'grab' : 'default' }} // <-- Стили для перетаскивания
         >
            <td className="px-3 py-3 border-b border-gray-200 bg-white text-sm text-gray-900">
                {/* Отображаем либо номер комнаты, либо название зоны */}
                {task.room_number || task.zone_name || 'Неизвестное место'}
            </td>
            <td className="px-3 py-3 border-b border-gray-200 bg-white text-sm text-gray-900">
                {task.cleaning_type_name || 'Не указан'}
            </td>
            <td className="px-3 py-3 border-b border-gray-200 bg-white text-sm text-gray-900 flex items-center">
                {/* Отображаем статус с иконкой и текстом */}
                {statusInfo.icon} {statusInfo.text}
            </td>
             <td className="px-3 py-3 border-b border-gray-200 bg-white text-sm text-gray-900">
                {task.assigned_to_name || 'Не назначен'}
            </td>
            <td className="px-3 py-3 border-b border-gray-200 bg-white text-sm text-gray-900">
                {/* Форматируем время выполнения */}
                {task.due_time ? new Date(task.due_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Не указано'}
            </td>
            <td className="px-3 py-3 border-b border-gray-200 bg-white text-sm">
                {/* Отображаем кнопки действий для задачи */}
                <div className="flex space-x-2">
                    {taskActions.map((action, index) => (
                        <button
                            key={index} // Используем индекс как ключ, т.к. список действий динамический
                            onClick={action.onClick}
                            className={`${action.color} disabled:opacity-50 disabled:cursor-not-allowed`}
                            disabled={action.disabled}
                            title={action.label} // Добавляем подсказку при наведении
                        >
                            {action.icon} {/* Отображаем только иконку */}
                            {/* Можно добавить текст, если нужно */}
                            {/* {action.label} */}
                        </button>
                    ))}
                </div>
            </td>
        </tr>
    );
};