import React from 'react';
import { CleaningTask } from '@/lib/types';
import { Badge } from "@/components/ui/badge";
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import getCleaningStatusColor from '@/lib/cleaning/GetCLeaningStatusColor';
import {
    Bed,
    LogOut,
    Sparkles,
    Bell,
    Wrench,
    House,
    HelpCircle,
} from 'lucide-react';

interface TaskCardProps {
    task: CleaningTask;
    cardColor: string;
}

// Функция для отображения иконки по типу уборки
const getCleaningTypeIcon = (type: string) => {
    switch (type) {
        case 'stayover':
            return <Bed className="h-5 w-5 text-muted-foreground" />;
        case 'departure_cleaning':
            return <LogOut className="h-5 w-5 text-muted-foreground"/>;
        case 'deep_cleaning':
            return <Sparkles className="h-5 w-5 text-muted-foreground" />;
        case 'on_demand':
            return <Bell className="h-5 w-5 text-muted-foreground"/>;
        case 'post_renovation_cleaning':
            return <Wrench className="h-5 w-5 text-muted-foreground" />;
        case 'public_area_cleaning':
            return <House className="h-5 w-5 text-muted-foreground" />;
        default:
            return <HelpCircle className="h-5 w-5 text-muted-foreground"  />;
    }
};
const TaskCard: React.FC<TaskCardProps> = ({ task, cardColor }) => {
    const router = useRouter();

    return (
        <div
            onClick={() => router.push(`/housekeeping/${task.id}`)}
            className={`cursor-pointer ${cardColor} shadow-md hover:shadow-lg transition-shadow duration-300 w-full rounded-md`}
        >
            <Card className="w-full bg-transparent border-none shadow-none">
                <CardHeader>
                    <div className="flex items-center justify-between space-x-2">
                        <CardTitle className="text-lg font-semibold truncate">
                            {task.room_number || task.zone_name}
                        </CardTitle>
                        <div className="flex items-center space-x-2">
                            {getCleaningTypeIcon(task.cleaning_type)}
                            <Badge className={getCleaningStatusColor(task.status)}>
                                {task.status_display}
                            </Badge>
                        </div>
                    </div>
                </CardHeader>
            </Card>
        </div>
    );
};

export default TaskCard;
