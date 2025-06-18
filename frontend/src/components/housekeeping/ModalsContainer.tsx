// components/housekeeping/ModalsContainer.tsx
import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import CleaningTaskForm from '@/components/forms/CleaningTaskForm';
import HousekeeperSelectionModal from './HousekeeperSelectionModal';
import { CleaningTask, User, Room, Zone } from '@/lib/types';

interface ModalsContainerProps {
  isCreateEditOpen: boolean;
  onCreateCancel: () => void;
  taskToEdit?: CleaningTask | null;
  onCreateSuccess: () => void;
  availableRooms: Room[];
  availableZones: Zone[];
  availableHousekeepers: User[];

  isDeleteOpen: boolean;
  onDeleteCancel: () => void;
  onDeleteConfirm: () => void;
  taskToDelete?: CleaningTask;

  isAssignOpen: boolean;
  onAssignClose: () => void;
  onAssignConfirm: (housekeeperId: number) => void;
  assignableHousekeepers: User[];

  isSelectionOpen: boolean;
  onSelectionClose: () => void;
  onSelectionConfirm: (ids: number[]) => void;
  allAvailableHousekeepers: User[];
  selectedHousekeeperIds: number[];
}

const ModalsContainer: React.FC<ModalsContainerProps> = ({
  isCreateEditOpen,
  onCreateCancel,
  taskToEdit,
  onCreateSuccess,
  availableRooms,
  availableZones,
  availableHousekeepers,

  isDeleteOpen,
  onDeleteCancel,
  onDeleteConfirm,
  taskToDelete,

  isAssignOpen,
  onAssignClose,
  onAssignConfirm,
  assignableHousekeepers,

  isSelectionOpen,
  onSelectionClose,
  onSelectionConfirm,
  allAvailableHousekeepers,
  selectedHousekeeperIds
}) => {
  return (
    <>
      {isCreateEditOpen && (
        <Sheet open={isCreateEditOpen} onOpenChange={onCreateCancel}>
          <SheetContent className='sm:max-w-lg'>
            <SheetHeader>
              <SheetTitle>{taskToEdit ? 'Редактировать задачу' : 'Создать задачу'}</SheetTitle>
              <SheetDescription>
                {taskToEdit ? 'Измените данные задачи по уборке.' : 'Введите данные для новой задачи по уборке.'}
              </SheetDescription>
            </SheetHeader>
            <CleaningTaskForm
              cleaningTaskToEdit={taskToEdit || undefined}
              availableRooms={availableRooms}
              availableZones={availableZones}
              availableHousekeepers={availableHousekeepers}
              onSuccess={onCreateSuccess}
              onCancel={onCreateCancel}
            />
          </SheetContent>
        </Sheet>
      )}

      {isDeleteOpen && taskToDelete && (
        <Dialog open={isDeleteOpen} onOpenChange={onDeleteCancel}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Удаление задачи</DialogTitle>
              <DialogDescription>
                Вы уверены, что хотите удалить задачу для комнаты/зоны{' '}
                <strong>{taskToDelete.room_number || taskToDelete.zone_name}</strong>?
                Это действие необратимо.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={onDeleteCancel}>Отмена</Button>
              <Button variant="destructive" onClick={onDeleteConfirm}>Удалить</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {isAssignOpen && (
        <Dialog open={isAssignOpen} onOpenChange={onAssignClose}>
          <HousekeeperSelectionModal
            availableHousekeepers={assignableHousekeepers}
            initialSelectedHousekeeperIds={[]}
            onConfirm={(ids) => onAssignConfirm(ids[0])}
            onClose={onAssignClose}
            isMultiSelect={false}
          />
        </Dialog>
      )}

      <Dialog open={isSelectionOpen} onOpenChange={onSelectionClose}>
        <HousekeeperSelectionModal
          availableHousekeepers={allAvailableHousekeepers}
          initialSelectedHousekeeperIds={selectedHousekeeperIds}
          onConfirm={onSelectionConfirm}
          onClose={onSelectionClose}
          isMultiSelect={true}
        />
      </Dialog>
    </>
  );
}


export default React.memo(ModalsContainer)