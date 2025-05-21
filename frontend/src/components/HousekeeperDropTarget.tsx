import { User, CleaningTask } from "@/lib/types";
import { UserIcon } from "lucide-react";
import { useDrag,useDrop } from 'react-dnd';


interface DragItem {
    type: 'task'; 
    id: number; 
   
}

interface HousekeeperDropTargetProps {
    housekeeper: User;
    cleaningTasks: CleaningTask[]; 
    getStatusDisplay: (status: CleaningTask['status'] | undefined) => { icon: React.ReactNode, text: string };
    onTaskAssign: (taskId: number, housekeeperId: number) => Promise<void>; 
    isCreateTaskModalOpen: boolean; 
    assigningTaskId: number | null; 
}

export const  HousekeeperDropTarget: React.FC<HousekeeperDropTargetProps> = ({
    housekeeper,
    cleaningTasks,
    getStatusDisplay,
    onTaskAssign,
    isPerformingAction,
    isCreateTaskModalOpen,
    assigningTaskId,
}) => {
    
    const [{ isOver, canDrop }, drop] = useDrop(() => ({
        accept: 'task',
        drop: (item: DragItem, monitor) => {
           
             if (canDrop && !isPerformingAction && !isCreateTaskModalOpen && assigningTaskId === null) { // <-- Добавлена проверка состояний
                 console.log(`Task ID ${item.id} dropped onto housekeeper ID ${housekeeper.id}`);
                 onTaskAssign(item.id, housekeeper.id); 
             } else {
                 console.log(`Task ID ${item.id} cannot be dropped onto housekeeper ID ${housekeeper.id}. Can drop: ${canDrop}, isPerformingAction: ${isPerformingAction}, isCreateTaskModalOpen: ${isCreateTaskModalOpen}, assigningTaskId: ${assigningTaskId}`);
             }
        },
        collect: (monitor) => ({
            isOver: monitor.isOver(), 
            canDrop: monitor.canDrop(), 
        }),
        // Определяем, можно ли сбросить элемент в эту зону
        canDrop: (item: DragItem, monitor) => {
           
            const task = cleaningTasks.find(t => t.id === item.id);
            const isTaskAssignedToThisHousekeeper = task && task.assigned_to === housekeeper.id;

            const canDropResult = !isPerformingAction && !isCreateTaskModalOpen && assigningTaskId === null && !isTaskAssignedToThisHousekeeper;
            
            return canDropResult;
        }
    }), [housekeeper.id, onTaskAssign, cleaningTasks, isPerformingAction, isCreateTaskModalOpen, assigningTaskId]); // Зависимости useDrop


    const assignedTasks = cleaningTasks.filter(task => task.assigned_to === housekeeper.id);

   
    const backgroundColor = isOver && canDrop ? 'bg-green-100' : isOver && !canDrop ? 'bg-red-100' : 'bg-gray-100';
    const borderColor = isOver && canDrop ? 'border-green-400' : isOver && !canDrop ? 'border-red-400' : 'border-gray-200';


    return (
      
        <div
            key={housekeeper.id}
            ref={drop as RefObject<HTMLDivElement>} // <-- ИСПРАВЛЕНО ЗДЕСЬ: Явное приведение типа для DIV
            className={`${backgroundColor} p-3 rounded-md shadow-sm border ${borderColor} transition duration-200 ease-in-out`} // <-- Добавлены стили для дроп-зоны
        >
            <p className="font-semibold text-gray-800 flex items-center">
                 <UserIcon size={16} className="mr-1"/> {housekeeper.first_name} {housekeeper.last_name || housekeeper.username}
            </p>
            {/* TODO: Отобразить количество назначенных задач или время работы */}
            <p className="text-sm text-gray-600">Назначено: {assignedTasks.length}</p> {/* Отображаем количество назначенных задач */}

            {/* Зона для перетаскивания задач */}
            <div className="mt-2 border-t pt-2 border-gray-300 min-h-16">
                {/* Здесь будут перетаскиваемые задачи, назначенные этой горничной */}
                 {assignedTasks.length > 0 ? (
                     assignedTasks.map(task => {
                          const statusInfo = getStatusDisplay(task.status);
                           // Используем хук useDrag для каждой задачи в списке горничной
                           // Делаем задачу перетаскиваемой, только если она назначена этой горничной
                           // TODO: Возможно, разрешить переназначать уже назначенные задачи
                           const [{ isDragging: isTaskDragging }, drag] = useDrag(() => ({
                               type: 'task', // Тип перетаскиваемого элемента
                               item: { id: task.id }, // Данные, которые будут переданы при перетаскивании
                               collect: (monitor) => ({
                                   isDragging: monitor.isDragging(), // Отслеживаем, перетаскивается ли этот элемент
                               }),
                                // Отключаем перетаскивание, если задача не назначена этой горничной или выполняется действие
                                canDrag: task.assigned_to === housekeeper.id && !isPerformingAction && !isCreateTaskModalOpen && assigningTaskId === null, // <-- Условие для возможности перетаскивания
                           }), [task.id, task.assigned_to, housekeeper.id, isPerformingAction, isCreateTaskModalOpen, assigningTaskId]); // Зависимости useDrag


                           return (
                               <div
                                    key={task.id}
                                    ref={drag as RefObject<HTMLDivElement>} // <-- ИСПРАВЛЕНО ЗДЕСЬ: Явное приведение типа для DIV
                                    // TODO: Добавить стили для перетаскивания
                                    className={`bg-white p-2 rounded-md shadow-sm border border-gray-200 mb-1 text-sm ${task.assigned_to === housekeeper.id && !isPerformingAction && !isCreateTaskModalOpen && assigningTaskId === null ? 'cursor-grab' : 'cursor-default'}`} // <-- Добавлен cursor-grab/default
                                    style={{ opacity: isTaskDragging ? 0.5 : 1 }} // <-- Стили для перетаскивания
                                >
                                    {task.room_number || task.zone_name || 'Место не указано'} - {statusInfo.text}
                                </div>
                           );
                     })
                 ) : (
                     // Сообщение, если у горничной нет задач
                     <p className="text-center text-gray-500 text-xs">Нет назначенных задач</p>
                 )}
            </div>
        </div>
    );
};