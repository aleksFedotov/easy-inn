'use client';

import React, { useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Spinner } from '@/components/spinner';
import ErrorMessage from '@/components/ErrorMessage';
import { useCleaningTasks } from '@/hooks/my-cleaning-tasks/useMyCleaningTasks';
import { useSortedTasks } from '@/hooks/my-cleaning-tasks/useSortedTasks';
import { useChecklistSummary } from '@/hooks/my-cleaning-tasks/useChecklistSummary'; 
import CleaningTasksSection from '@/components/CleaningTasksSection';
import ChecklistSummaryCollapsible from '@/components/my-cleaning-task/ChecklistSummaryCollapsible';
import SummaryCard from '@/components/my-cleaning-task/SummaryCard';
import DatePickerPopover from '@/components/DatePickerPopover';

const MyCleaningTasksPage: React.FC = () => {
    const { user, isLoading: isAuthLoading } = useAuth();
    const [isSummaryOpen, setIsSummaryOpen] = useState<boolean>(false);
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date()); 
    const { tasks: allTasks, isLoading: loading, error } = useCleaningTasks(user, selectedDate);
    const { 
        sortedCheckoutTasks, 
        sortedCurrentTasks, 
        sortedZoneTasks, 
        sortedOtherTasks 
    } = useSortedTasks(allTasks);

    // Расчет общего количества задач и срочных задач
    const totalTasks = useMemo(() => allTasks.length, [allTasks]);
    const rushTasksCount = useMemo(() => allTasks.filter(task => task.is_rush).length, [allTasks]);
    
    // Сортировка ключей checklistSummary по заданному порядку
    const { checklistSummary, sortedChecklistSummaryKeys } = useChecklistSummary(allTasks);

    if (isAuthLoading || loading) {
        return <div className="flex items-center justify-center min-h-screen"><Spinner /></div>;
    }

    if (error) {
        return <ErrorMessage message={error} />;
    }

    if (!user) {
        return <div>Пользователь не найден.</div>; // Или перенаправление
    }


    return (
        <div className="container mx-auto p-4">
            <h1 className="text-3xl font-bold mb-4">Мои задачи</h1>
            <div className="mb-6 flex justify-end">
               <DatePickerPopover selectedDate={selectedDate} onSelect={setSelectedDate} /> 
            </div>

           <SummaryCard 
                totalTasks={totalTasks}
                rushTasksCount={rushTasksCount}    
            />

            <ChecklistSummaryCollapsible   
                isOpen={isSummaryOpen}
                onToggle={setIsSummaryOpen}
                checklistSummary={checklistSummary}
                sortedKeys={sortedChecklistSummaryKeys} 
            />
            <CleaningTasksSection
                checkoutTasks={sortedCheckoutTasks}
                currentTasks={sortedCurrentTasks}
                zoneTasks={sortedZoneTasks}
                otherTasks={sortedOtherTasks}
            />
        </div>
    );
};

export default MyCleaningTasksPage;
