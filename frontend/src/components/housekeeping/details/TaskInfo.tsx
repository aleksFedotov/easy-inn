import React from 'react';
import {
    Building,
    FileText,
    User as UserIcon, 
    BookOpen,
    Clock,
    ClipboardList,
    CircleDotDashed,
} from 'lucide-react';

// Импортируем UI-компоненты из shadcn/ui
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { CleaningTask } from '@/lib/types/housekeeping';
import getCleaningStatusColor from '@/lib/cleaning/GetCLeaningStatusColor';

interface TaskInfoProps {
  task: CleaningTask;
}
export const TaskInfo: React.FC<TaskInfoProps> = ({ task }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center">
                    <FileText className="mr-2 h-5 w-5" />
                    Детали
                </h3>
                <ul className="list-none space-y-3">
                    <li className="flex items-center text-sm">
                        <Building className="mr-3 h-4 w-4 text-gray-500" />
                        <span>
                            {task.room_number ? `Комната: ${task.room_number}` : `Зона: ${task.zone_name}`}
                        </span>
                    </li>
                    <li className="flex items-center text-sm">
                        <BookOpen className="mr-3 h-4 w-4 text-gray-500" />
                        <span>Тип уборки: {task.cleaning_type_display}</span>
                    </li>
                    <li className="flex items-center text-sm">
                        <UserIcon className="mr-3 h-4 w-4 text-gray-500" />
                        <span>Назначена: {task.assigned_to_name || "Не назначена"}</span>
                    </li>
                    <li className="flex items-center text-sm">
                        <Clock className="mr-3 h-4 w-4 text-gray-500" />
                        <span>
                            {task.due_time
                                ? `Время: ${format(new Date(task.due_time), 'HH:mm', { locale: ru })}`
                                : "Время не указано"}
                        </span>
                    </li>
                    <li className="flex items-start text-sm">
                        <ClipboardList className="mr-3 h-4 w-4 text-gray-500 mt-0.5" />
                        <span className="flex-1">Описание: {task.notes || "Нет описания"}</span>
                    </li>
                </ul>
            </div>

            <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center">
                    <CircleDotDashed className="mr-2 h-5 w-5" />
                    Статус
                </h3>
                <Badge className={getCleaningStatusColor(task.status)}>
                    {task.status_display}
                </Badge>
            </div>
        </div>
    );
};