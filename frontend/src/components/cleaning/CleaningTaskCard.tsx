import React from 'react';
import { CleaningTask } from '@/lib/types'; // Make sure CleaningTask includes `is_rush`
import { Badge } from "@/components/ui/badge";
import { useRouter } from 'next/navigation'; // Assuming Next.js navigation
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
    Flame, 
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
            return <HelpCircle className="h-5 w-5 text-muted-foreground" />;
    }
};

const TaskCard: React.FC<TaskCardProps> = ({ task, cardColor }) => {
    const router = useRouter();

    return (
        <div
            onClick={() => router.push(`/housekeeping/${task.id}`)}
             className={`cursor-pointer ${cardColor} shadow-md hover:shadow-lg transition-shadow duration-300 
                        w-full sm:w-1/2 md:w-1/3 lg:w-1/4 xl:w-1/5 
                        rounded-md flex-shrink-0 min-w-[300px]`}
        >
            <Card className="w-full bg-transparent border-none shadow-none">
                <CardHeader>
                    <div className="flex items-center justify-between space-x-2">
                        <CardTitle className="text-lg font-semibold flex items-center truncate"> {/* Added flex and items-center here */}
                            {task.room_number || task.zone_name}
                            {task.is_rush && ( 
                                <Badge className="ml-2 bg-red-500 text-white flex items-center"> {/* Added ml-2 for margin */}
                                    <Flame className="mr-1 h-4 w-4" /> 
                                </Badge>
                            )}
                        </CardTitle>
                        <div className="flex items-center space-x-2">
                            <Badge className={getCleaningStatusColor(task.status)}>
                                {task.status_display}
                            </Badge>
                            {getCleaningTypeIcon(task.cleaning_type)}
                        </div>
                    </div>
                </CardHeader>
            </Card>
        </div>
    );
};

export default TaskCard;