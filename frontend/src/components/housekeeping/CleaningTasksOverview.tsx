
import React from 'react';
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import Link from 'next/link';
import { Badge } from "@/components/ui/badge";
import { CleaningTask } from '@/lib/types/housekeeping';
import { CLEANING_TYPE_ORDER } from '@/lib/constants';

interface CleaningTasksOverviewProps {
  cleaningTasks: CleaningTask[];
}

// Компонент для отображения номера/зоны в виде Badge (значка/метки)
const RoomZoneBadge: React.FC<{ task: CleaningTask }> = ({ task }) => {
  const displayValue = task.room_number || task.zone_name || 'N/A';
  
  if (!task.id) {
    return (
      <Badge variant="secondary" className="mr-2 mb-2 px-3 py-1 text-sm">
        {displayValue}
      </Badge>
    );
  }

  return (
    // Оборачиваем Badge в Link
    <Link href={`/housekeeping/${task.id}`} passHref>
      <Badge variant="secondary" className="mr-2 mb-2 px-3 py-1 text-sm cursor-pointer hover:bg-gray-300 transition-colors">
        {displayValue}
      </Badge>
    </Link>
  );
};


const CleaningTasksOverview: React.FC<CleaningTasksOverviewProps> = ({ cleaningTasks }) => {
  
  const groupedTasks = cleaningTasks.reduce((acc, task) => {
    const type = task.cleaning_type_display || 'Без типа уборки';
    
    if (!acc[type]) {
      acc[type] = {};
    }

   
    const subtypes = task.associated_checklist_names && task.associated_checklist_names.length > 0 
      ? task.associated_checklist_names 
      : ['Основные задачи']; 

    subtypes.forEach(subtype => {
        if (!acc[type][subtype]) {
            acc[type][subtype] = [];
        }
        acc[type][subtype].push(task);
    });
    
    return acc;
  }, {} as Record<string, Record<string, CleaningTask[]>>);

  const sortedTypes = Object.keys(groupedTasks).sort((a, b) => {
    const indexA = CLEANING_TYPE_ORDER.indexOf(a);
    const indexB = CLEANING_TYPE_ORDER.indexOf(b);

   
    if (indexA !== -1 && indexB !== -1) {
      return indexA - indexB; 
    }
   
    if (indexA !== -1) {
      return -1;
    }
    
    if (indexB !== -1) {
      return 1;
    }
    return a.localeCompare(b);
  });

  const totalTasks = cleaningTasks.length;

  return (
    <Card className="mb-6">
      <CardContent>
        {totalTasks === 0 ? (
          <p className="text-muted-foreground italic">Нет задач для отображения обзора на выбранную дату.</p>
        ) : (
          <div> {/* Обертка вместо Accordion */}
            {sortedTypes.map((type) => { // Используем отсортированные типы
              const subtypes = groupedTasks[type];
              return (
                <div key={type} className="mb-6 pb-4 border-b border-gray-200 last:border-b-0 last:mb-0">
                  <h3 className="text-xl font-semibold mb-3 flex items-center">
                    {type} <Badge className="ml-2 bg-blue-100 text-blue-800 hover:bg-blue-200">
                      {Object.values(subtypes).flat().length} задач
                    </Badge>
                  </h3>
                  <div className="pl-4"> {/* Отступ для содержимого типа уборки */}
                    {Object.entries(subtypes).map(([subtype, tasks]) => (
                      <div key={subtype} className="mb-4">
                        <h4 className="text-md font-medium mb-2 flex items-center">
                          {subtype} <Badge variant="outline" className="ml-2">{tasks.length}</Badge>
                        </h4>
                        <div className="flex flex-wrap pl-4"> {/* Отступ для подтипов */}
                          {/* Используем Set для уникальных задач */}
                          {[...new Set(tasks.map(task => task.id))].map(taskId => {
                              const task = tasks.find(t => t.id === taskId);
                              return task ? <RoomZoneBadge key={task.id} task={task} /> : null;
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
      {totalTasks > 0 && (
        <CardFooter className="pt-4 border-t">
          <p className="text-xl font-bold text-gray-800">Всего задач: {totalTasks}</p>
        </CardFooter>
      )}
    </Card>
  );
};

export default CleaningTasksOverview;