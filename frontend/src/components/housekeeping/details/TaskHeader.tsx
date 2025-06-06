import { CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Flame } from "lucide-react";
import { CleaningTask } from "@/lib/types/housekeeping";

interface TaskHeaderProps {
  task: CleaningTask;
}

export const TaskHeader: React.FC<TaskHeaderProps> = ({ task }) => (
  <CardHeader className="space-y-4">
    <CardTitle className="text-2xl font-bold flex items-center">
      <span>Задача уборки: {task.room_number || task.zone_name || "Общая"}</span>
      {task.is_rush && (
        <Badge className="ml-4 bg-red-500 text-white flex items-center">
          <Flame className="mr-1 h-4 w-4" /> СРОЧНО
        </Badge>
      )}
    </CardTitle>
    <CardDescription>
      Подробная информация о задаче.
    </CardDescription>
  </CardHeader>
);