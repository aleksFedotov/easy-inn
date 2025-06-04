'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
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
    RefreshCw
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
    
    const [isGenerating, setIsGenerating] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [housekeeperSearchQuery, setHousekeeperSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<'unassigned' | 'assigned' | 'all'>('unassigned');
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
    const [seletedTasks, setSelectedTask] = useState({});
    
    const {
        cleaningTasks,
        allAvailableHousekeepers,
        rooms,
        zones,
        isLoadingData,
        error,
        setError,
        fetchCleaningTasks,
        refetchData, 
        clearCache
    } = useHousekeepingData({ selectedDate });

    const {
        isCreateEditTaskModalOpen,
        taskToEdit,
        setTaskToEdit,
        isDeleteModalOpen,
        setIsDeleteModalOpen,
        taskToDelete,
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

    const handleGenerateTasks = useCallback(async () => {
        if (!user || !['manager', 'front-desk'].includes(user.role) || isGenerating) {
            return;
        }

    setIsGenerating(true);
        try {
            // Всегда генерируем задачи на текущий день
            const dateToGenerate = format(new Date(), 'yyyy-MM-dd');
            
            let retryCount = 0;
            const maxRetries = 3;
            
            while (retryCount < maxRetries) {
                try {
                    const response = await api.post('/api/cleaningtasks/auto_generate/', { 
                        scheduled_date: dateToGenerate
                    });
                    
                    if (response.status === 201) {
                        if(response.data.created_count > 0) {
                            if (clearCache) {
                                clearCache();
                            }
                            setTimeout(() => {
                                refetchData();
                            }, 500);
                            toast.success(`Создано задач на сегодня: ${response.data.created_count}`);
                        } else {
                            toast.info('Задачи на сегодня уже существуют');
                        }
                    } else {
                        toast.error(`Ошибка генерации задач: ${response.status}`);
                    }
                    break;
                    
                } catch (retryError) {
                    retryCount++;
                    
                    if (axios.isAxiosError(retryError) && retryError.response) {
                        const errorMessage = retryError.response.data.detail || 
                                        retryError.response.data.message || 
                                        JSON.stringify(retryError.response.data);
                        
                        if (errorMessage.includes('database is locked') && retryCount < maxRetries) {
                            console.log(`Попытка ${retryCount}/${maxRetries}: База данных заблокирована, повторяем через 2 секунды...`);
                            await new Promise(resolve => setTimeout(resolve, 2000));
                            continue;
                        }
                        
                        if (retryCount >= maxRetries) {
                            toast.error(errorMessage);
                            console.error('Ошибка генерации:', errorMessage);
                        }
                    } else {
                        if (retryCount >= maxRetries) {
                            toast.error('Произошла ошибка при генерации задач.');
                            console.error('Ошибка генерации:', retryError);
                        }
                    }
                    
                    if (retryCount >= maxRetries) {
                        toast.error('Не удалось выполнить генерацию после нескольких попыток. Попробуйте позже.');
                    }
                    break;
                }
            }
            
        } catch (error) {
            console.error('Критическая ошибка генерации:', error);
            toast.error('Произошла критическая ошибка при генерации задач.');
        } finally {
            setIsGenerating(false);
        }
        
    }, [user, refetchData, isGenerating,clearCache]);

    useEffect(() => {
        if (!isAuthLoading && (!user || !['front-desk', 'manager', 'housekeeper'].includes(user.role))) {
            setError('У вас нет прав для просмотра этой страницы.');
        }
    }, [user, isAuthLoading, setError]);

    useEffect(() => {
        const fetchAssignedHousekeepers = async () => {
            if (selectedDate && !isLoadingData) { 
                try {
                    const response = await api.get('/api/housekeepers/assigned/', {
                        params: { scheduled_date: format(selectedDate, 'yyyy-MM-dd') }
                    });
                    setHousekeepers(response.data);
                } catch (error) {
                     if (axios.isAxiosError(error) && error.response) {
                        toast.error(error.response.data.detail || error.response.data.message || JSON.stringify(error.response.data));
                    } else {
                        toast.error('Произошла ошибка при загрузки списка горничных.');
                    }
                }
            }
        };

        // Добавляем небольшую задержку, чтобы избежать race condition
        const timer = setTimeout(() => {
            fetchAssignedHousekeepers();
        }, 200);
        
        return () => clearTimeout(timer);
    }, [selectedDate, isLoadingData]);

  
    
    const filteredCleaningTasks = useMemo(() => {
        let currentTasks = cleaningTasks;

      
        if (searchQuery) {
            currentTasks = currentTasks.filter(task =>
                task.room_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                task.zone_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                task.cleaning_type_display?.toLowerCase().includes(searchQuery.toLowerCase()) ||
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
   
 
    const filteredHousekeepers = useMemo(() => {
        if (!housekeeperSearchQuery) {
            return housekeepers; 
        }
        return housekeepers.filter(housekeeper =>
            housekeeper.first_name.toLowerCase().includes(housekeeperSearchQuery.toLowerCase()) ||
            housekeeper.last_name.toLowerCase().includes(housekeeperSearchQuery.toLowerCase())
        );
    }, [housekeepers, housekeeperSearchQuery]);



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
        columnHelper.accessor(row => row.cleaning_type_display || 'N/A', {
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
        
        const existingHousekeeperIds = new Set(housekeepers.map(h => h.id));
      const combinedHousekeepers = [
            ...housekeepers,
            ...newlySelectedHousekeepers.filter(h => !existingHousekeeperIds.has(h.id))
        ];

        setHousekeepers(combinedHousekeepers);
        setIsHousekeeperSelectionModalOpen(false);
    }, [housekeepers, allAvailableHousekeepers, setIsHousekeeperSelectionModalOpen])

    const handleAssignSelectedTasks = async (housekeeperId: number) => {
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
                task_ids : selectedTaskIds, 
                housekeeper_id: housekeeperId,
                scheduled_date: selectedDate ? format(selectedDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd')
            })

            if (response.status === 200) {
                 if (clearCache) {
                    clearCache();
                }
                setTimeout(() => {
                    refetchData();
                }, 500);
                toast.success(`Назначено ${selectedTaskIds.length} задач горничной.`);
                table.toggleAllRowsSelected(false); 
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
            setIsAssignTasksModalOpened(false);
        }
    };

   
    if (isAuthLoading) {
        return null; 
    }

    if (!user || !['front-desk', 'manager', 'housekeeper'].includes(user.role)) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="p-8 rounded-lg shadow-lg bg-white max-w-md w-full text-center text-red-600 font-bold">
                    У вас нет прав для просмотра этой страницы.
                </div>
            </div>
        );
    }

    if (isLoadingData && !isCreateEditTaskModalOpen && !isCreateEditTaskModalOpen && !isDeleteModalOpen && !isHousekeeperSelectionModalOpen) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Spinner />
            </div>
        );
    }

    if (error && !isLoadingData && !isCreateEditTaskModalOpen && !isCreateEditTaskModalOpen && !isDeleteModalOpen && !isHousekeeperSelectionModalOpen) {
        return (
            <ErrorMessage
                message={error}
                onRetry={refetchData} 
                isLoading={isLoadingData}
            />
        );
    }
    return (
        <div className="container mx-auto p-4">
            <h1 className="text-3xl font-bold mb-6">Управление Уборкой</h1>
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 space-y-4 sm:space-y-0 sm:space-x-4">
                <div className="flex items-center space-x-2">
                    <Label htmlFor="date-picker">Дата:</Label>
                    <DatePicker date={selectedDate} setDate={setSelectedDate} />
                </div>
                <div className="flex space-x-2">
                    {/* <Button
                        variant="outline"
                        onClick={() =>{}}
                        disabled={isLoadingData || isGenerating || isCreateEditTaskModalOpen || isCreateEditTaskModalOpen || isDeleteModalOpen || isHousekeeperSelectionModalOpen}
                    >
                        {isGenerating ? <Loader className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Автоназначение
                    </Button> */}
                    <Button
                        variant="outline"
                        onClick={() => {setIsAssignTasksModalOpened(true)}} 
                        disabled={isLoadingData || isGenerating || isCreateEditTaskModalOpen || isCreateEditTaskModalOpen || isDeleteModalOpen || housekeepers.length === 0 || table.getSelectedRowModel().rows.length === 0}
                    >
                        Назначить выбранное ({table.getSelectedRowModel().rows.length})
                    </Button>
                </div>

                
                     
            </div>


            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                <div className="md:col-span-1 shadow-md rounded-lg p-4">
                    <h2 className="text-xl font-semibold mb-4 flex items-center">
                        <UserIcon size={20} className="mr-2" /> Горничные
                    </h2>
                   
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

                    <Button
                        variant="outline"
                        onClick={handleOpenHousekeeperSelectionModal}
                        className="w-full mb-4"
                        disabled={isLoadingData || isGenerating || isCreateEditTaskModalOpen || isCreateEditTaskModalOpen || isDeleteModalOpen}
                    >
                        Выбрать горничных
                    </Button>

                   
                    <div className="space-y-4">
                        {filteredHousekeepers.length > 0 ? (
                            filteredHousekeepers.map(housekeeper => (
                                <HousekeeperExpandableCard
                                    key={housekeeper.id}
                                    housekeeper={housekeeper}
                                   
                                    cleaningTasks={cleaningTasks.filter(task => task.assigned_to === housekeeper.id)}
                                />
                            ))
                        ) : (
                            <p className="text-center">Горничные не выбраны.</p>
                        )}
                    </div>
                </div>

              
                <div className="md:col-span-2 shadow-md rounded-lg p-4 ">
                    <h2 className="text-xl font-semibold mb-4">
                        Задачи уборки ({selectedDate ? format(selectedDate, 'dd.MM.yyyy', { locale: ru }) : 'Выберите дату'})
                    </h2>
                    <div className="flex space-x-2 py-2 w-full">
                    

                        <Button
                            onClick={handleGenerateTasks}
                            disabled={isLoadingData || isGenerating || isCreateEditTaskModalOpen || isDeleteModalOpen || isHousekeeperSelectionModalOpen}
                        >
                            <RefreshCw size={18} className="mr-2" /> Создать задачи
                        </Button>
                        <Button
                            onClick={handleCreateEditTaskClick}
                            disabled={isLoadingData || isGenerating || isCreateEditTaskModalOpen || isDeleteModalOpen || isHousekeeperSelectionModalOpen}
                        >
                            <Plus size={18} className="mr-2" /> Создать задачу
                        </Button>


                    </div>
                  
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

                    
                    <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'unassigned' | 'assigned' | 'all')} className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="unassigned">Не назначенные</TabsTrigger>
                            <TabsTrigger value="assigned">Назначенные</TabsTrigger>
                            <TabsTrigger value="all">Все</TabsTrigger>
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
                                                <TableCell colSpan={columns.length} className="h-24 text-center">
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
                                                <TableCell colSpan={columns.length} className="h-24 text-center">
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
                                                <TableCell colSpan={columns.length} className="h-24 text-center">
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
                            availableHousekeepers={allAvailableHousekeepers}
                            onSuccess={handleCreateEditTaskSuccess}
                            onCancel={handleCreateEditTaskCancel}
                        />
                    </SheetContent>

                </Sheet>
            )}

           
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