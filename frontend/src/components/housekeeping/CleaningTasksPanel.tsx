import React from 'react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  TableCaption
} from '@/components/ui/table';
import { Plus, RefreshCw, Search } from 'lucide-react';
import { flexRender, Table as ReactTable } from '@tanstack/react-table';
import { CleaningTask } from '@/lib/types';
import { useHousekeepingState, useHousekeepingDispatch } from '@/context/HousekeepingContext';

interface CleaningTasksPanelProps {
    table: ReactTable<CleaningTask>;
    columnsLength: number;
    onGenerateClick: () => void;
    onCreateClick: () => void;
    isDisabled?: boolean;
}

const  CleaningTasksPanel: React.FC<CleaningTasksPanelProps> = ({

    table,
    columnsLength,
    onGenerateClick,
    onCreateClick,
    isDisabled,

}) =>{
    const { activeTab, searchQuery, selectedDate,isGenerating } = useHousekeepingState();
    const dispatch = useHousekeepingDispatch();
    const formattedDate = selectedDate ? format(selectedDate, 'dd.MM.yyyy', { locale: ru }) : 'Выберите дату';
    const onTabChange = (newTab: 'unassigned' | 'assigned' | 'all') => dispatch({ type: 'SET_ACTIVE_TAB', payload: newTab });
    const onSearchChange = (query : string) => dispatch({ type: 'SET_SEARCH_QUERY', payload: query });

    const renderTableContent = (emptyMessage: string) => (
        <div className="overflow-x-auto">
        <Table>
            <TableHeader>
            {table.getHeaderGroups().map(headerGroup => (
                <TableRow key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                    <TableHead key={header.id}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                ))}
                </TableRow>
            ))}
            </TableHeader>
            <TableBody>
            {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map(row => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                    {row.getVisibleCells().map(cell => (
                    <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                    ))}
                </TableRow>
                ))
            ) : (
                <TableRow>
                <TableCell colSpan={columnsLength} className="h-24 text-center">
                    {emptyMessage}
                </TableCell>
                </TableRow>
            )}
            </TableBody>
            <TableCaption>Список задач по уборке на выбранную дату.</TableCaption>
        </Table>
        </div>
    );

    return (
        <div className="md:col-span-2 shadow-md rounded-lg p-4">
        <h2 className="text-xl font-semibold mb-4">
            Задачи уборки ({formattedDate})
        </h2>

        <div className="flex space-x-2 py-2 w-full">
            <Button onClick={onGenerateClick} disabled={isDisabled}>
            <RefreshCw size={18} className="mr-2" />
            {isGenerating ? 'Создание...' : 'Создать задачи'}
            </Button>
            <Button onClick={onCreateClick} disabled={isDisabled}>
            <Plus size={18} className="mr-2" /> Создать задачу
            </Button>
        </div>

        <div className="relative mb-4">
            <Input
            type="text"
            placeholder="Поиск задач..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
            />
            <Search size={20} className="absolute left-3 top-2.5 text-muted-foreground" />
        </div>

        <Tabs value={activeTab} onValueChange={(v) => onTabChange(v as 'unassigned' | 'assigned' | 'all')} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="unassigned">Не назначенные</TabsTrigger>
            <TabsTrigger value="assigned">Назначенные</TabsTrigger>
            <TabsTrigger value="all">Все</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-4">
            {renderTableContent('Задачи по уборке на выбранную дату не найдены.')}
            </TabsContent>
            <TabsContent value="assigned" className="mt-4">
            {renderTableContent('Назначенные задачи по уборке не найдены.')}
            </TabsContent>
            <TabsContent value="unassigned" className="mt-4">
            {renderTableContent('Неназначенные задачи по уборке не найдены.')}
            </TabsContent>
        </Tabs>
        </div>
    );
}



export default React.memo(CleaningTasksPanel)