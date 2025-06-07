import React from 'react';
import { XCircle } from 'lucide-react';

interface EmptyTasksStateProps {
  title?: string;
  subtitle?: string;
}

const EmptyTasksState: React.FC<EmptyTasksStateProps> = ({
  title = 'Нет задач, готовых к проверке.',
  subtitle = 'Подождите, пока горничные завершат уборку.'
}) => (
  <div className="flex flex-col items-center justify-center p-12 bg-gray-50 rounded-lg shadow-sm">
    <XCircle size={48} className="text-gray-400 mb-4" />
    <h2 className="text-xl font-medium text-gray-700 mb-2">
      {title}
    </h2>
    <p className="text-sm text-gray-500 text-center">
      {subtitle}
    </p>
  </div>
);

export default EmptyTasksState;