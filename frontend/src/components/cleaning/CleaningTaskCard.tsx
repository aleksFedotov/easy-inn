import React from 'react';
import { CleaningTask } from '@/lib/types'; // Импортируйте ваш тип CleaningTask
import { Badge } from "@/components/ui/badge";
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
    FileText,
    Clock,
    ClipboardList,
} from 'lucide-react';

import getCleaningStatusColor from '@/lib/cleaning/GetCLeaningStatusColor';

interface TaskCardProps {
    task: CleaningTask;
    cardColor: string;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, cardColor }) => {
    const router = useRouter();

    


    return (
         <div
            onClick={() => router.push(`/housekeeping/${task.id}`)}
            className={`cursor-pointer ${cardColor} shadow-md hover:shadow-lg transition-shadow duration-300 w-full rounded-md`}
        >
            <Card className="w-full bg-transparent border-none shadow-none">
                <CardHeader>
                    <CardTitle className="text-lg font-semibold">
                        {task.room_number ? `Комната: ${task.room_number}` : `Зона: ${task.zone_name}`}
                    </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-2">
                    <div className="flex items-center">
                        <FileText className="mr-2 h-4 w-4" />
                        <span>Тип: {task.cleaning_type_display}</span>
                    </div>
                    <div className="flex items-center">
                        <Clock className="mr-2 h-4 w-4" />
                        <span>
                            {task.due_time ? `Время: ${format(new Date(task.due_time), 'HH:mm', { locale: ru })}` : "Время не указано"}
                        </span>
                    </div>
                    <div className="flex items-center">
                        <ClipboardList className="mr-2 h-4 w-4" />
                        <span>Описание: {task.notes || "Нет описания"}</span>
                    </div>
                    <Badge className={getCleaningStatusColor(task.status)}>
                        {task.status_display}
                    </Badge>
                </CardContent>
            </Card>
        </div>
    );
};

export default TaskCard;