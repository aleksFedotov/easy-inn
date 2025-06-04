import React from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import CleaningTaskCard from '@/components/cleaning/CleaningTaskCard';
import { CleaningTask } from '@/lib/types'; // Убедитесь, что у вас есть этот тип
import { LogOut, Bed, House, Boxes } from 'lucide-react';

interface CleaningTasksSectionProps {
  checkoutTasks: CleaningTask[];
  currentTasks: CleaningTask[];
  zoneTasks: CleaningTask[];
  otherTasks: CleaningTask[];
}

const CleaningTasksSection: React.FC<CleaningTasksSectionProps> = ({
  checkoutTasks,
  currentTasks,
  zoneTasks,
  otherTasks,
}) => {
  return (
    <>
      <h2 className="text-2xl font-bold mt-8 mb-4">Последние задачи по уборке</h2>
      <div className="flex justify-center">
        <Tabs defaultValue="checkout" className='w-full'>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="checkout" className="flex items-center space-x-2"><LogOut size={16} /><span>Выезд</span></TabsTrigger>
            <TabsTrigger value="current" className="flex items-center space-x-2"><Bed size={16} /><span>Текущая</span></TabsTrigger>
            <TabsTrigger value="zones" className="flex items-center space-x-2"><House size={16} /><span>Зоны</span></TabsTrigger>
            <TabsTrigger value="other" className="flex items-center space-x-2"><Boxes size={16} /><span>Другое</span></TabsTrigger>
          </TabsList>

          <TabsContent value="checkout">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
              {checkoutTasks.map(task => (
                <CleaningTaskCard key={task.id} task={task} cardColor={task.is_guest_checked_out ? 'bg-red-100' : 'bg-gray-100'} />
              ))}
              {checkoutTasks.length === 0 && <p>Нет задач уборки после выезда.</p>}
            </div>
          </TabsContent>

          <TabsContent value="current">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
              {currentTasks.map(task => (
                <CleaningTaskCard key={task.id} task={task} cardColor="bg-yellow-100" />
              ))}
              {currentTasks.length === 0 && <p>Нет текущих задач уборки.</p>}
            </div>
          </TabsContent>

          <TabsContent value="zones">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
              {zoneTasks.map(task => (
                <CleaningTaskCard key={task.id} task={task} cardColor="bg-yellow-100" />
              ))}
              {zoneTasks.length === 0 && <p>Нет задач уборки зон.</p>}
            </div>
          </TabsContent>
          <TabsContent value="other">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
              {otherTasks.map(task => (
                <CleaningTaskCard key={task.id} task={task} cardColor="bg-yellow-100" />
              ))}
              {otherTasks.length === 0 && <p>Нет задач других задач.</p>}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
};

export default React.memo(CleaningTasksSection);