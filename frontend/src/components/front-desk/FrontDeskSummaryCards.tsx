import React from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Spinner } from '@/components/spinner';
import CleaningTaskCard from '@/components/housekeeping/CleaningTaskCard';
import { BrushCleaning, Loader, CheckCircle, XCircle } from 'lucide-react';
import { CleaningTask } from '@/lib/types/housekeeping'; 

// Определяем тип для ответа API со сводными данными по номерам (повторяем из useFrontDeskData)
interface RoomSummaryResponse {
    dirty: number;
    in_progress: number;
    waiting_inspection: number;
    clean: number;
    free: number;
    occupied: number;
    assigned: number;
    on_maintenance: number;
}

interface FrontDeskSummaryCardsProps {
  summaryData: RoomSummaryResponse;
  readyForCheckTasks: CleaningTask[];
  isLoadingSummary: boolean;
  summaryError: string | null;
  // onReadyForCheckClick: () => void; // Если нужно внешнее управление открытием диалога
}

const FrontDeskSummaryCards: React.FC<FrontDeskSummaryCardsProps> = ({
  summaryData,
  readyForCheckTasks,
  isLoadingSummary,
  summaryError,
}) => {
  if (isLoadingSummary) {
    return (
      <div className="flex justify-center items-center h-24 mb-6">
        <Spinner />
      </div>
    );
  }

  if (summaryError) {
   
    return (
      <div className="text-red-500 text-center mb-6">
        Ошибка загрузки сводных данных: {summaryError}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
      <Card className="bg-amber-100 text-amber-600">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-yellow-700">Ожидает уборки</CardTitle>
          <BrushCleaning size={20} className="text-yellow-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-yellow-800">{summaryData.dirty}</div>
        </CardContent>
      </Card>
      <Card className="bg-sky-100 text-sky-600">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-blue-700">В процессе</CardTitle>
          <Loader size={20} className="text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-800">{summaryData.in_progress}</div>
        </CardContent>
      </Card>
      <Dialog>
        <DialogTrigger asChild>
          <Card className="bg-green-100 text-green-600 cursor-pointer hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-700">Готов к проверке</CardTitle>
              <CheckCircle size={20} className="text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-800">{summaryData.waiting_inspection}</div>
            </CardContent>
          </Card>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Задачи, готовые к проверке ({readyForCheckTasks.length})</DialogTitle>
            <DialogDescription>
              Список задач по уборке, которые ожидают вашей инспекции.
            </DialogDescription>
          </DialogHeader>
          {readyForCheckTasks.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 py-4">
              {readyForCheckTasks.map(task => (
                <CleaningTaskCard
                  key={task.id}
                  task={task}
                  cardColor={task.status === 'completed' ? 'bg-green-100' : 'bg-orange-100'}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-8 text-gray-700">
              <XCircle size={48} className="text-gray-400 mb-4" />
              <p className="text-lg font-medium">Нет задач, готовых к проверке.</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default React.memo(FrontDeskSummaryCards);