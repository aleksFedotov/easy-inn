'use client';

import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { CleaningTask, User} from '@/lib/types';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,DialogFooter } from '@/components/ui/dialog';

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
    Plus,
    Search,
    User as UserIcon,
    Loader,
} from 'lucide-react';
import { toast } from 'sonner';

import CleaningTaskForm from '@/components/forms/CleaningTaskForm';
import { Spinner } from '@/components/spinner';
import ErrorMessage from '@/components/ErrorMessage';
import axios from 'axios';
import DatePicker from '@/components/ui/DatePicker';
import TaskActions from '@/components/cleaning/TaskActions';
import useHousekeepingData from '@/hooks/сleaning/useHousekeepingData';
import useTaskModals from '@/hooks/сleaning/useTaskModals';

import {
    useReactTable,
    createColumnHelper,
    flexRender,
    getCoreRowModel,
} from '@tanstack/react-table';


import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import HousekeeperSelectionModal from '@/components/cleaning/HousekeeperSelectionModal';
import HousekeeperExpandableCard from '@/components/cleaning/HousekeeperExpandableCard';

export default function HousekeepingPage() {
    const { user, isLoading: isAuthLoading } = useAuth();


    const [housekeepers, setHousekeepers] = useState<User[]>([]); 
    
    const [isAutoAssigning, setIsAutoAssigning] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [housekeeperSearchQuery, setHousekeeperSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<'unassigned' | 'assigned' | 'all'>('all');
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
    const [seletedTasks, setSelectedTask] = useState({});

     const autoGenerationTriggeredRef = useRef(false);
    
    const {
        cleaningTasks,
        allAvailableHousekeepers,
        rooms,
        zones,
        cleaningTypes,
        isLoadingData,
        error,
        setError,
        fetchCleaningTasks,
        refetchData, 
    } = useHousekeepingData({ selectedDate });

     const {
        isCreateEditTaskModalOpen,
        taskToEdit,
        setTaskToEdit,
        isDeleteModalOpen,
        setIsDeleteModalOpen,
        taskToDelete,
        // setTaskToDelete,
        isHousekeeperSelectionModalOpen,
        setIsHousekeeperSelectionModalOpen,
        isAssignTasksModalOpened,
        setIsAssignTasksModalOpened,
        handleCreateEditTaskClick,
        handleCreateEditTaskSuccess,
        handleCreateEditTaskCancel,
        handleDeleteTask,
        confirmDeleteTask,
        handleDeleteCancel,
        handleOpenHousekeeperSelectionModal,
        handleCloseHousekeeperSelectionModal,
    } = useTaskModals({ fetchCleaningTasks, selectedDate });

    const handleAutoGenerateTasks = useCallback(async () => {
        if (!user || !['manager', 'front-desk'].includes(user.role)) {
            return;
        }

        setIsAutoAssigning(true);
        try {
            const dateToGenerate = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd');
            const response = await api.post('/api/cleaningtasks/auto_generate/', { 
                scheduled_date: dateToGenerate
            });
            
            if (response.status === 201) {
                if(response.data.created_count > 0) {
                    toast.success(`Автоматически создано задач: ${response.data.created_count}`);
                }
            } else {
                toast.error(`Ошибка автоматической генерации: ${response.status}`);
            }
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                toast.error(error.response.data.detail || error.response.data.message || JSON.stringify(error.response.data));
            } else {
                toast.error('Произошла ошибка при автоматической генерации задач.');
            }
        } finally {
            setIsAutoAssigning(false);
        }
    }, [user, selectedDate]);

    useEffect(() => {
        if (!isAuthLoading && (!user || !['front-desk', 'manager', 'housekeeper'].includes(user.role))) {
            setError('У вас нет прав для просмотра этой страницы.');
        }
    }, [user, isAuthLoading, setError]);

    // Эффект для автогенерации (выполняется только один раз)
    useEffect(() => {
        if (!isAuthLoading && 
            user && 
            ['manager', 'front-desk'].includes(user.role) && 
            !autoGenerationTriggeredRef.current && 
            cleaningTasks.length === 0 && // Только если нет задач
            !isLoadingData) {
            
            autoGenerationTriggeredRef.current = true;
            
            const performAutoGeneration = async () => {
                await handleAutoGenerateTasks();
                // Обновляем данные через небольшую задержку
                setTimeout(() => {
                    refetchData();
                }, 1000);
            };
            
            performAutoGeneration();
        }
    }, [user, isAuthLoading, cleaningTasks.length, isLoadingData, handleAutoGenerateTasks, refetchData]);

    // Сброс флага при изменении даты
    useEffect(() => {
        autoGenerationTriggeredRef.current = false;
    }, [selectedDate]);

    useEffect(() => {
        const fetchAssignedHousekeepers = async () => {
            if (selectedDate) {
                try {
                    const response = await api.get('/api/housekeepers/assigned/', {  //  <--  Adjust URL as needed
                        params: { scheduled_date: format(selectedDate, 'yyyy-MM-dd') }
                    });
                    setHousekeepers(response.data);  //  <--  Update your state
                } catch (error) {
                    console.error("Error fetching housekeepers:", error);
                    toast.error("Failed to fetch housekeepers.");
                }
            }
        };

        fetchAssignedHousekeepers();
    }, [selectedDate]);

  
    // Filtered cleaning tasks based on search query AND active tab
    const filteredCleaningTasks = useMemo(() => {
        let currentTasks = cleaningTasks;

        // Apply search query filter first
        if (searchQuery) {
            currentTasks = currentTasks.filter(task =>
                task.room_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                task.zone_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                task.cleaning_type_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                task.assigned_to_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                task.assigned_by_name?.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Apply tab filter
        if (activeTab === 'unassigned') {
            return currentTasks.filter(task => task.status === 'unassigned');
        } else if (activeTab === 'assigned') {
            return currentTasks.filter(task => task.status !== 'unassigned' && task.status !== 'canceled');
        }
        // 'all' tab returns all tasks (after search filter)
        return currentTasks;
    }, [cleaningTasks, searchQuery, activeTab]);

    


    // Filtered housekeepers based on search query (for the displayed list)
    const filteredHousekeepers = useMemo(() => {
        if (!housekeeperSearchQuery) {
            return housekeepers; // Filter the *selected* housekeepers
        }
        return housekeepers.filter(housekeeper =>
            housekeeper.first_name.toLowerCase().includes(housekeeperSearchQuery.toLowerCase()) ||
            housekeeper.last_name.toLowerCase().includes(housekeeperSearchQuery.toLowerCase())
        );
    }, [housekeepers, housekeeperSearchQuery]);


    // TanStack Table Column Definitions
    const columnHelper = createColumnHelper<CleaningTask>();

    const columns = useMemo(() => [
        columnHelper.display({
            id: "select",
            header: ({ table }) => (
                <Checkbox
                    checked={
                        table.getIsAllPageRowsSelected() ||
                        (table.getIsSomePageRowsSelected() && "indeterminate")
                    }
                    onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                    aria-label="Select all"
                />
            ),
            cell: ({ row }) => (
                <Checkbox
                    checked={row.getIsSelected()}
                    onCheckedChange={(value) => row.toggleSelected(!!value)}
                    aria-label="Select row"
                />
            ),
            enableSorting: false,
            enableHiding: false,
         }),
        columnHelper.accessor(row => row.room_number || row.zone_name || 'N/A', {
            id: 'room_zone',
            header: () => 'Комната/Зона',
            cell: info => <span className="font-medium">{info.getValue()}</span>,
        }),
        columnHelper.accessor(row => row.cleaning_type_name || 'N/A', {
            id: 'cleaning_type',
            header: () => 'Тип уборки',
        }),
        columnHelper.accessor(row => row.assigned_to_name || 'Не назначена', {
            id: 'assigned_to',
            header: () => 'Назначена',
        }),
        columnHelper.display({
            id: 'actions',
            header: () => 'Действия',
            cell: info => (
                <TaskActions
                    task={info.row.original}
                    user={user}
                    fetchCleaningTasks={() => selectedDate && fetchCleaningTasks(format(selectedDate, 'yyyy-MM-dd'))}
                    selectedDate={selectedDate ? format(selectedDate, 'yyyy-MM-dd') : ''}
                    onEdit={() => {
                        setTaskToEdit(info.row.original)
                        handleCreateEditTaskClick()
                    }}
                    onDelete={handleDeleteTask}
                />
            ),
        }),
    ], [user, selectedDate, fetchCleaningTasks, handleCreateEditTaskClick, handleDeleteTask, columnHelper,setTaskToEdit]);

    const table = useReactTable({
        data: filteredCleaningTasks,
        columns,
        getCoreRowModel: getCoreRowModel(),
         onRowSelectionChange: setSelectedTask,
         state: {
            rowSelection: seletedTasks
        },
    });


     const handleConfirmHousekeeperSelection = useCallback((selectedIds: number[]) => {
    const newlySelectedHousekeepers = allAvailableHousekeepers.filter(h => selectedIds.includes(h.id));
    
    // Create a map of existing housekeeper IDs for quick lookup
    const existingHousekeeperIds = new Set(housekeepers.map(h => h.id));

    // Combine newly selected with existing, avoiding duplicates
    const combinedHousekeepers = [
        ...housekeepers,
        ...newlySelectedHousekeepers.filter(h => !existingHousekeeperIds.has(h.id))
    ];

    setHousekeepers(combinedHousekeepers);
    setIsHousekeeperSelectionModalOpen(false);
}, [housekeepers, allAvailableHousekeepers, setIsHousekeeperSelectionModalOpen])

    const handleAssignSelectedTasks = async (housekeeperId: number) => {
        // Get the IDs of the selected tasks
        const selectedTaskIds = table.getSelectedRowModel().rows.map(row => row.original.id);

        if (selectedTaskIds.length === 0) {
            toast.error("Выберите хотя бы одну задачу.");
            return;
        }
        if (!housekeeperId) {
            toast.error("Пожалуйста, выберите горничную.");
            return;
        }
        
        try {
            const response = await api.post("/api/cleaningtasks/assign_multiple/", { 
                task_ids : selectedTaskIds, // Pass only IDs
                housekeeper_id: housekeeperId,
                scheduled_date: selectedDate ? format(selectedDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd')
            })

            if (response.status === 200) {
                toast.success(`Назначено ${selectedTaskIds.length} задач горничной.`);
                refetchData(); // Reload data to reflect changes
                table.toggleAllRowsSelected(false); // Clear all row selections
            } else {
                toast.error(`Не удалось назначить задачи: ${response.status}`);
            }
        } catch (err) {
            console.error("Ошибка при назначении:", err);
            if (axios.isAxiosError(err) && err.response) {
                toast.error(err.response.data.detail || err.response.data.message || JSON.stringify(err.response.data));
            } else {
                toast.error("Произошла ошибка при назначении задач.");
            }
        } finally {
            setIsAssignTasksModalOpened(false); // Close the assignment modal
        }
    };

    // Conditional rendering based on authentication and data loading status
    if (isAuthLoading) {
        return null; // Render nothing while auth is loading
    }

    if (!user || !['front-desk', 'manager', 'housekeeper'].includes(user.role)) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100">
                <div className="p-8 rounded-lg shadow-lg bg-white max-w-md w-full text-center text-red-600 font-bold">
                    У вас нет прав для просмотра этой страницы.
                </div>
            </div>
        );
    }

    if (isLoadingData && !isCreateEditTaskModalOpen && !isCreateEditTaskModalOpen && !isDeleteModalOpen && !isHousekeeperSelectionModalOpen) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100">
                <Spinner />
            </div>
        );
    }

    if (error && !isLoadingData && !isCreateEditTaskModalOpen && !isCreateEditTaskModalOpen && !isDeleteModalOpen && !isHousekeeperSelectionModalOpen) {
        return (
            <ErrorMessage
                message={error}
                onRetry={refetchData} // Use the refetchData function from the hook
                isLoading={isLoadingData}
            />
        );
    }
    return (
        <div className="container mx-auto p-4">
            <h1 className="text-3xl font-bold mb-6">Управление Уборкой</h1>

            {/* Control Panel: Date selection, action buttons */}
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 space-y-4 sm:space-y-0 sm:space-x-4">
                {/* Date Picker */}
                <div className="flex items-center space-x-2">
                    <Label htmlFor="date-picker">Дата:</Label>
                    <DatePicker date={selectedDate} setDate={setSelectedDate} />
                </div>

                {/* Action Buttons (e.g., Auto Assign, Assign Selected) */}
                <div className="flex space-x-2">
                    <Button
                        variant="outline"
                        onClick={() =>{}}
                        disabled={isLoadingData || isAutoAssigning || isCreateEditTaskModalOpen || isCreateEditTaskModalOpen || isDeleteModalOpen || isHousekeeperSelectionModalOpen}
                    >
                        {isAutoAssigning ? <Loader className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Автоназначение
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => {setIsAssignTasksModalOpened(true)}} // New handler for assigning selected tasks
                        disabled={isLoadingData || isAutoAssigning || isCreateEditTaskModalOpen || isCreateEditTaskModalOpen || isDeleteModalOpen || housekeepers.length === 0 || table.getSelectedRowModel().rows.length === 0}
                    >
                        Назначить выбранное ({table.getSelectedRowModel().rows.length})
                    </Button>
                </div>

              
                    <Button
                        onClick={handleCreateEditTaskClick}
                        disabled={isLoadingData || isAutoAssigning || isCreateEditTaskModalOpen || isDeleteModalOpen || isHousekeeperSelectionModalOpen}
                    >
                        <Plus size={18} className="mr-2" /> Создать задачу
                    </Button>
                     
            </div>


            {/* Main Content: Two columns */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* Left Column: Housekeepers List */}
                <div className="md:col-span-1 shadow-md rounded-lg p-4">
                    <h2 className="text-xl font-semibold mb-4 flex items-center">
                        <UserIcon size={20} className="mr-2" /> Горничные
                    </h2>
                    {/* Housekeeper Search Input */}
                    <div className="relative mb-4">
                        <Input
                            type="text"
                            placeholder="Поиск горничных..."
                            value={housekeeperSearchQuery}
                            onChange={(e) => setHousekeeperSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                        <Search size={20} className="absolute left-3 top-2.5 text-muted-foreground" />
                    </div>

                    {/* Button to open housekeeper selection modal */}
                    <Button
                        variant="outline"
                        onClick={handleOpenHousekeeperSelectionModal}
                        className="w-full mb-4"
                        disabled={isLoadingData || isAutoAssigning || isCreateEditTaskModalOpen || isCreateEditTaskModalOpen || isDeleteModalOpen}
                    >
                        Выбрать горничных
                    </Button>

                    {/* List of SELECTED Housekeepers */}
                    <div className="space-y-4">
                        {filteredHousekeepers.length > 0 ? (
                            filteredHousekeepers.map(housekeeper => (
                                <HousekeeperExpandableCard
                                    key={housekeeper.id}
                                    housekeeper={housekeeper}
                                    // Передаем только те задачи, которые назначены этой горничной
                                    cleaningTasks={cleaningTasks.filter(task => task.assigned_to === housekeeper.id)}
                                />
                            ))
                        ) : (
                            <p className="text-center">Горничные не выбраны.</p>
                        )}
                    </div>
                </div>

                {/* Right Column: Cleaning Tasks List */}
                <div className="md:col-span-2 bg-white shadow-md rounded-lg p-4">
                    <h2 className="text-xl font-semibold text-gray-700 mb-4">
                        Задачи уборки ({selectedDate ? format(selectedDate, 'dd.MM.yyyy', { locale: ru }) : 'Выберите дату'})
                    </h2>
                    {/* Task Search Input */}
                    <div className="relative mb-4">
                        <Input
                            type="text"
                            placeholder="Поиск задач..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                        <Search size={20} className="absolute left-3 top-2.5 text-muted-foreground" />
                    </div>

                    {/* Tabs for Cleaning Tasks */}
                    <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'unassigned' | 'assigned' | 'all')} className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="all">Все</TabsTrigger>
                            <TabsTrigger value="assigned">Назначенные</TabsTrigger>
                            <TabsTrigger value="unassigned">Не назначенные</TabsTrigger>
                        </TabsList>
                        <TabsContent value="all" className="mt-4">
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        {table.getHeaderGroups().map(headerGroup => (
                                            <TableRow key={headerGroup.id}>
                                                {headerGroup.headers.map(header => (
                                                    <TableHead key={header.id}>
                                                        {header.isPlaceholder
                                                            ? null
                                                            : flexRender(
                                                                header.column.columnDef.header,
                                                                header.getContext()
                                                            )}
                                                    </TableHead>
                                                ))}
                                            </TableRow>
                                        ))}
                                    </TableHeader>
                                    <TableBody>
                                        {table.getRowModel().rows?.length ? (
                                            table.getRowModel().rows.map(row => (
                                                <TableRow
                                                    key={row.id}
                                                    data-state={row.getIsSelected() && "selected"}
                                                >
                                                    {row.getVisibleCells().map(cell => (
                                                        <TableCell key={cell.id}>
                                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                        </TableCell>
                                                    ))}
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={columns.length} className="h-24 text-center text-gray-500">
                                                    Задачи по уборке на выбранную дату не найдены.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                    <TableCaption>Список задач по уборке на выбранную дату.</TableCaption>
                                </Table>
                            </div>
                        </TabsContent>
                        <TabsContent value="assigned" className="mt-4">
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        {table.getHeaderGroups().map(headerGroup => (
                                            <TableRow key={headerGroup.id}>
                                                {headerGroup.headers.map(header => (
                                                    <TableHead key={header.id}>
                                                        {header.isPlaceholder
                                                            ? null
                                                            : flexRender(
                                                                header.column.columnDef.header,
                                                                header.getContext()
                                                            )}
                                                    </TableHead>
                                                ))}
                                            </TableRow>
                                        ))}
                                    </TableHeader>
                                    <TableBody>
                                        {table.getRowModel().rows?.length ? (
                                            table.getRowModel().rows.map(row => (
                                                <TableRow
                                                    key={row.id}
                                                    data-state={row.getIsSelected() && "selected"}
                                                >
                                                    {row.getVisibleCells().map(cell => (
                                                        <TableCell key={cell.id}>
                                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                        </TableCell>
                                                    ))}
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={columns.length} className="h-24 text-center text-gray-500">
                                                    Назначенные задачи по уборке не найдены.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                    <TableCaption>Список назначенных задач по уборке на выбранную дату.</TableCaption>
                                </Table>
                            </div>
                        </TabsContent>
                        <TabsContent value="unassigned" className="mt-4">
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        {table.getHeaderGroups().map(headerGroup => (
                                            <TableRow key={headerGroup.id}>
                                                {headerGroup.headers.map(header => (
                                                    <TableHead key={header.id}>
                                                        {header.isPlaceholder
                                                            ? null
                                                            : flexRender(
                                                                header.column.columnDef.header,
                                                                header.getContext()
                                                            )}
                                                    </TableHead>
                                                ))}
                                            </TableRow>
                                        ))}
                                    </TableHeader>
                              
                            <TableBody>
                                {table.getRowModel().rows?.length ? (
                                    table.getRowModel().rows.map(row => (
                                        <TableRow
                                            key={row.id}
                                            data-state={row.getIsSelected() && "selected"}
                                        >
                                            {row.getVisibleCells().map(cell => (
                                                <TableCell key={cell.id}>
                                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                        </TableCell>
                                                    ))}
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={columns.length} className="h-24 text-center text-gray-500">
                                                    Неназначенные задачи по уборке не найдены.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                    <TableCaption>Список неназначенных задач по уборке на выбранную дату.</TableCaption>
                                </Table>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>

            {isCreateEditTaskModalOpen  && (
                <Sheet open={isCreateEditTaskModalOpen} onOpenChange={handleCreateEditTaskCancel}>
                    <SheetContent className='sm:max-w-lg'>
                        <SheetHeader>
                            <SheetTitle>{taskToEdit ? 'Редактировать задачу по уборке' : 'Создать новую задачу по уборке'}</SheetTitle>
                            <SheetDescription>
                                          {taskToEdit ? 'Внесите изменения в существующую задачу по уборке.' : 'Заполните информацию для создания новой задачи по уборке.'}
                            </SheetDescription>
                        </SheetHeader>
                     <CleaningTaskForm
                            cleaningTaskToEdit={taskToEdit ? taskToEdit : undefined}
                            availableRooms={rooms}
                            availableZones={zones}
                            availableCleaningTypes={cleaningTypes}
                            availableHousekeepers={allAvailableHousekeepers}
                            onSuccess={handleCreateEditTaskSuccess}
                            onCancel={handleCreateEditTaskCancel}
                        />
                    </SheetContent>

                </Sheet>
            )}

           {/* Delete Task Modal */}
            {isDeleteModalOpen && taskToDelete && (
                <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
                    <DialogContent className="max-w-sm">
                        <DialogHeader>
                            <DialogTitle>Подтверждение удаления</DialogTitle>
                            <DialogDescription>
                                Вы уверены, что хотите удалить задачу для комнаты/зоны {taskToDelete.room_number || taskToDelete.zone_name}?
                                Это действие нельзя отменить.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button variant="outline" onClick={handleDeleteCancel}>
                                Отмена
                            </Button>
                            <Button variant="destructive" onClick={confirmDeleteTask}>
                                Удалить
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}

            {isAssignTasksModalOpened && (
                <Dialog open={isAssignTasksModalOpened} onOpenChange={setIsAssignTasksModalOpened}>
                    <HousekeeperSelectionModal
                    availableHousekeepers={housekeepers}
                    initialSelectedHousekeeperIds={[]}
                    onConfirm={(ids) => {
                        const selectedId = ids[0];
                        handleAssignSelectedTasks(selectedId)
                    }}
                    onClose={() => setIsAssignTasksModalOpened(false)}
                    isMultiSelect ={false}
                />
                </Dialog>
            )}

            {/* --- Модальное окно для выбора горничных --- */}
            <Dialog open={isHousekeeperSelectionModalOpen} onOpenChange={setIsHousekeeperSelectionModalOpen}>
                <HousekeeperSelectionModal
                    availableHousekeepers={allAvailableHousekeepers}
                    initialSelectedHousekeeperIds={housekeepers.map(h => h.id)}
                    onConfirm={handleConfirmHousekeeperSelection}
                    onClose={handleCloseHousekeeperSelectionModal}
                    isMultiSelect = {true}
                />
            </Dialog>
        </div>
    );
}