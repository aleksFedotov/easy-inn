import React from 'react';
import { ChevronDown, ChevronUp, Tag } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

type ChecklistSummary = Record<string, Record<string, { total: number }>>;

interface ChecklistSummaryCollapsibleProps {
  isOpen: boolean;
  onToggle: (open: boolean) => void;
  checklistSummary: ChecklistSummary;
  sortedKeys: string[];
}

const ChecklistSummaryCollapsible: React.FC<ChecklistSummaryCollapsibleProps> = ({
  isOpen,
  onToggle,
  checklistSummary,
  sortedKeys,
}) => {
  return (
    <Collapsible open={isOpen} onOpenChange={onToggle} className="w-full mb-6">
      <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-gray-100 rounded-lg shadow-sm cursor-pointer">
        <h2 className="text-xl font-bold text-gray-800">Сводка по уборкам</h2>
        {isOpen ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2 p-4 border border-gray-200 rounded-lg bg-white">
        {Object.keys(checklistSummary).length > 0 ? (
          sortedKeys.map(cleaningTypeDisplay => (
            <div key={cleaningTypeDisplay} className="mb-3 last:mb-0">
              <h3 className="text-lg font-semibold text-gray-700 flex items-center mb-1">
                <Tag size={18} className="mr-2" />
                {cleaningTypeDisplay}
              </h3>
              <ul className="list-none space-y-1 ml-4">
                {Object.keys(checklistSummary[cleaningTypeDisplay]).map(checklistNames => (
                  <li key={`${cleaningTypeDisplay}-${checklistNames}`} className="text-gray-600">
                    {checklistNames}: <span className="font-bold">{checklistSummary[cleaningTypeDisplay][checklistNames].total}</span> номеров
                  </li>
                ))}
              </ul>
            </div>
          ))
        ) : (
          <p className="text-gray-600">Нет задач с привязанными чек-листами.</p>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
};

export default ChecklistSummaryCollapsible;
