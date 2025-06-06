import React from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import CleaningTaskCard from '@/components/housekeeping/CleaningTaskCard';
import { CleaningTask } from '@/lib/types'; // Убедитесь, что у вас есть этот тип
import { LogOut, Bed, House, Boxes } from 'lucide-react';



interface CleaningTasksSectionProps {
  checkoutTasks: CleaningTask[];
  currentTasks: CleaningTask[];
  zoneTasks: CleaningTask[];
  otherTasks: CleaningTask[];
  isDashBoard?: boolean; 
}

const CleaningTasksSection: React.FC<CleaningTasksSectionProps> = ({
  checkoutTasks,
  currentTasks,
  zoneTasks,
  otherTasks,
  isDashBoard = false, 
}) => {

  const tabsConfig = [
    {
      value: 'checkout',
      label: 'Выезд',
      icon: LogOut,
      tasks: checkoutTasks,
      getColor: (task: CleaningTask) => task.is_guest_checked_out ? 'bg-red-100' : 'bg-gray-100',
      emptyText: 'Нет задач уборки после выезда.',
    },
    {
      value: 'current',
      label: 'Текущая',
      icon: Bed,
      tasks: currentTasks,
      getColor: () => 'bg-yellow-100',
      emptyText: 'Нет текущих задач уборки.',
    },
    {
      value: 'zones',
      label: 'Зоны',
      icon: House,
      tasks: zoneTasks,
      getColor: () => 'bg-yellow-100',
      emptyText: 'Нет задач уборки зон.',
    },
    {
      value: 'other',
      label: 'Другое',
      icon: Boxes,
      tasks: otherTasks,
      getColor: () => 'bg-yellow-100',
      emptyText: 'Нет других задач.',
    },
  ];
  
  return (
    <>
      {isDashBoard && <h2 className="text-2xl font-bold mt-8 mb-4">Последние задачи по уборке</h2>}
      <div className="flex justify-center">
      <Tabs defaultValue="checkout" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          {tabsConfig.map(tab => (
            <TabsTrigger key={tab.value} value={tab.value} className="flex items-center space-x-2">
              <tab.icon size={16} />
              <span>{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {tabsConfig.map(tab => (
          <TabsContent key={tab.value} value={tab.value} className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
              {tab.tasks.length > 0 ? (
                tab.tasks.map(task => (
                  <CleaningTaskCard
                    key={task.id}
                    task={task}
                    cardColor={tab.getColor(task)}
                  />
                ))
              ) : (
                <p>{tab.emptyText}</p>
              )}
            </div>
          </TabsContent>
        ))}
      </Tabs>
      </div>
    </>
  );
};

export default React.memo(CleaningTasksSection);