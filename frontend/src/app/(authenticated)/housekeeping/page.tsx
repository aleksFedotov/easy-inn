'use client';

import React, { useMemo, useCallback } from 'react';


// Hooks
import { useAuth } from '@/context/AuthContext';
import { HousekeepingProvider ,useHousekeepingState, useHousekeepingDispatch } from '@/context/HousekeepingContext';
import useHousekeepingData from '@/hooks/housekeeping/useHousekeepingData';
import useTaskModals from '@/hooks/housekeeping/useTaskModals';

// UI Компоненты
import { Spinner } from '@/components/spinner';
import ErrorMessage from '@/components/ErrorMessage';
import HeaderSection from '@/components/housekeeping/HeaderSection';
import HousekeeperListPanel from '@/components/housekeeping/HousekeeperListPanel';
import CleaningTasksPanel from '@/components/housekeeping/CleaningTasksPanel';
import ModalsContainer from '@/components/housekeeping/ModalsContainer';
import TaskActions from '@/components/housekeeping/TaskActions';

// Table
import {
    useReactTable,
    createColumnHelper,
    getCoreRowModel,
} from '@tanstack/react-table';
import { CleaningTask } from '@/lib/types';


export default function HousekeepingPage() {
    return (
        <HousekeepingProvider>
            <HousekeepingContent/>
        </HousekeepingProvider>
    )
}
function HousekeepingContent() {

  const { user, isLoading: isAuthLoading } = useAuth();


  const { selectedDate, searchQuery, activeTab, selectedTasks } = useHousekeepingState();
  const dispatch = useHousekeepingDispatch();

  // Данные и функции для работы с API
  const {
    cleaningTasks,
    rooms,
    zones,
    allAvailableHousekeepers,
    assignedHousekeepers,
    loadingStates,
    isLoadingData,
    error,
    refetchData,
    generateTasks,
    assignTasks,
    fetchCleaningTasks,
    setAssignedHousekeepers
  } = useHousekeepingData({ selectedDate });
  

  const {
    isCreateEditTaskModalOpen,
    taskToEdit,
    setTaskToEdit,
    handleCreateEditTaskClick,
    handleCreateEditTaskSuccess,
    handleCreateEditTaskCancel,
    isDeleteModalOpen,
    taskToDelete,
    handleDeleteTask,
    handleDeleteCancel,
    confirmDeleteTask,
    isAssignTasksModalOpened,
    setIsAssignTasksModalOpened,
    isHousekeeperSelectionModalOpen,
    handleOpenHousekeeperSelectionModal,
    handleCloseHousekeeperSelectionModal,
    handleConfirmHousekeeperSelection,
  } = useTaskModals({ 
      fetchCleaningTasks,
      setAssignedHousekeepers,
      allAvailableHousekeepers,
      assignedHousekeepers,
      selectedDate,
    });



  const handleDateChange = (date: Date | undefined) => {
    dispatch({ type: 'SET_DATE', payload: date || new Date() });
  };
  
  const handleGenerateClick = useCallback(async () => {
    if (!user || !['manager', 'front-desk'].includes(user.role)) return;
    await generateTasks(selectedDate);
  }, [user, generateTasks, selectedDate]);
  
  const handleAssignConfirm = async (housekeeperId: number) => {
    const selectedIds = table.getSelectedRowModel().rows.map(row => row.original.id);

    const success = await assignTasks(selectedIds, housekeeperId, selectedDate);
    if (success) {
      dispatch({ type: 'SET_SELECTED_TASKS', payload: {} }); 
      setIsAssignTasksModalOpened(false);
    }
  };

  const filteredCleaningTasks = useMemo(() => {
    let result = cleaningTasks;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        t =>
          t.room_number?.toLowerCase().includes(query) ||
          t.zone_name?.toLowerCase().includes(query) ||
          t.cleaning_type_display?.toLowerCase().includes(query) ||
          t.assigned_to_name?.toLowerCase().includes(query)
      );
    }
    if (activeTab === 'unassigned') return result.filter(t => t.status === 'unassigned');
    if (activeTab === 'assigned') return result.filter(t => t.status !== 'unassigned' && t.status !== 'canceled');
    return result;
  }, [cleaningTasks, searchQuery, activeTab]);

  const columnHelper = createColumnHelper<CleaningTask>();
  const columns = useMemo(
    () => [
        columnHelper.display({
            id: 'select',
            header: ({ table }) => (
              <input type="checkbox" checked={table.getIsAllPageRowsSelected()} onChange={e => table.toggleAllPageRowsSelected(e.target.checked)} />
            ),
            cell: ({ row }) => (
              <input type="checkbox" checked={row.getIsSelected()} onChange={e => row.toggleSelected(e.target.checked)} />
            ),
        }),
        columnHelper.accessor(row => row.room_number || row.zone_name || 'N/A', { id: 'room_zone', header: 'Комната/Зона' }),
        columnHelper.accessor('cleaning_type_display', { header: 'Тип уборки' }),
        columnHelper.accessor(row => row.assigned_to_name || 'Не назначена', { id: 'assigned_to', header: 'Назначена' }),
        columnHelper.display({
            id: 'actions',
            header: 'Действия',
            cell: ({ row }) => (
              <TaskActions
                  task={row.original}
                  user={user}
                  onEdit={() => {
                      setTaskToEdit(row.original);
                      handleCreateEditTaskClick();
                  }}
                  onDelete={handleDeleteTask}
              />
            ),
        }),
    ],
    [user, handleDeleteTask, handleCreateEditTaskClick, setTaskToEdit]
  );
  
  
  const table = useReactTable({
    data: filteredCleaningTasks,
    columns,
    state: {
      rowSelection: selectedTasks,
    },
    enableRowSelection: true,
    onRowSelectionChange: (updater) => {
      const newSelection = typeof updater === 'function' ? updater(selectedTasks) : updater;
      dispatch({ type: 'SET_SELECTED_TASKS', payload: newSelection });
    },
    getCoreRowModel: getCoreRowModel(),
  });


  if (isAuthLoading) return <div className="flex items-center justify-center min-h-screen"><Spinner /></div>;

  if (!user || !['front-desk', 'manager', 'housekeeper'].includes(user.role)) {
    return <div className="flex items-center justify-center min-h-screen text-red-600 font-bold">У вас нет прав для просмотра этой страницы.</div>;
  }

  if (error) return <ErrorMessage message={error} onRetry={refetchData} isLoading={isLoadingData} />;
  

  if (isLoadingData && !cleaningTasks.length) {
    return <div className="flex items-center justify-center min-h-screen"><Spinner /></div>;
  }
  
  const isActionDisabled = isLoadingData || isCreateEditTaskModalOpen || isDeleteModalOpen || isHousekeeperSelectionModalOpen;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Управление Уборкой</h1>

      <HeaderSection
        selectedDate={selectedDate}
        onDateChange={handleDateChange}
        selectedTaskCount={Object.keys(selectedTasks).length}
        onAssignClick={() => setIsAssignTasksModalOpened(true)}
        isAssignDisabled={isActionDisabled || assignedHousekeepers.length === 0 || Object.keys(selectedTasks).length === 0}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <HousekeeperListPanel
            housekeepers={assignedHousekeepers}
            cleaningTasks={cleaningTasks}
            onOpenSelection={handleOpenHousekeeperSelectionModal}
            isLoading={loadingStates.housekeepers}
            isDisabled={isActionDisabled}
        />

        <CleaningTasksPanel
            table={table}
            columnsLength={columns.length}
            onGenerateClick={handleGenerateClick}
            onCreateClick={handleCreateEditTaskClick}
            isDisabled={isActionDisabled}
            
        />
      </div>

      <ModalsContainer
        // Модальное окно создания/редактирования
        isCreateEditOpen={isCreateEditTaskModalOpen}
        onCreateCancel={handleCreateEditTaskCancel}
        taskToEdit={taskToEdit}
        onCreateSuccess={handleCreateEditTaskSuccess}
        availableRooms={rooms}
        availableZones={zones}
        availableHousekeepers={allAvailableHousekeepers}

        // Модальное окно удаления
        isDeleteOpen={isDeleteModalOpen}
        onDeleteCancel={handleDeleteCancel}
        onDeleteConfirm={confirmDeleteTask}
        taskToDelete={taskToDelete ? taskToDelete : undefined}

        // Модальное окно назначения задач
        isAssignOpen={isAssignTasksModalOpened}
        onAssignClose={() => setIsAssignTasksModalOpened(false)}
        onAssignConfirm={handleAssignConfirm}
        assignableHousekeepers={assignedHousekeepers}
        

        // Модальное окно выбора горничных
        isSelectionOpen={isHousekeeperSelectionModalOpen}
        onSelectionClose={handleCloseHousekeeperSelectionModal}
        onSelectionConfirm={handleConfirmHousekeeperSelection}
        allAvailableHousekeepers={allAvailableHousekeepers}
        selectedHousekeeperIds={assignedHousekeepers.map(h => h.id)}
      />
    </div>
  );
}