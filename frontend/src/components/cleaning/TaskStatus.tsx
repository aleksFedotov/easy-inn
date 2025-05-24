import { CleaningTask } from "@/lib/types";
import { CheckCircle, CircleDotDashed, CircleHelp, Loader, PauseCircle, XCircle } from "lucide-react";
import { useMemo } from "react";

const TaskStatus = ({ status }: { status: CleaningTask['status'] }) => {
    const statusDetails = useMemo(() => {
        switch (status) {
            case 'unassigned':
                return { icon: <CircleDotDashed size={16} className="text-gray-500 mr-1" />, text: 'Не назначена' };
            case 'assigned':
                return { icon: <CircleDotDashed size={16} className="text-blue-500 mr-1" />, text: 'Назначена' };
            case 'in_progress':
                return { icon: <Loader size={16} className="text-yellow-500 mr-1 animate-spin" />, text: 'В процессе' };
            case 'completed':
                return { icon: <CheckCircle size={16} className="text-green-500 mr-1" />, text: 'Выполнена' };
            case 'waiting_inspection':
                return { icon: <CircleHelp size={16} className="text-purple-500 mr-1" />, text: 'Ожидает проверки' };
            case 'checked':
                return { icon: <CheckCircle size={16} className="text-teal-500 mr-1" />, text: 'Проверена' };
            case 'canceled':
                return { icon: <XCircle size={16} className="text-red-600 mr-1" />, text: 'Отменена' };
            case 'on_hold':
                return { icon: <PauseCircle size={16} className="text-gray-500 mr-1" />, text: 'Приостановлена' };
            default:
                return { icon: null, text: 'Неизвестный статус' };
        }
    }, [status]);

    return (
        <div className="flex items-center">
            {statusDetails.icon}
            {statusDetails.text}
        </div>
    );
};


export default TaskStatus