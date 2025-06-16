import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus } from 'lucide-react';
import { Spinner } from '@/components/spinner';
import ErrorMessage from '@/components/ErrorMessage';
import { Checklist } from '@/lib/types/housekeeping';

interface AddChecklistDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    availableChecklists: Checklist[];
    onAddChecklist: (templateId: number) => void;
    isLoading: boolean;
    isUpdating: boolean;
    error: string | null;
    cleaningType: string;
}

export const AddChecklistDialog: React.FC<AddChecklistDialogProps> = ({
    isOpen,
    onOpenChange,
    availableChecklists,
    onAddChecklist,
    isLoading,
    isUpdating,
    error,
    cleaningType,
}) => {
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogTrigger asChild>
                <Button variant="outline" disabled={isLoading || isUpdating}>
                    <Plus className="mr-2 h-4 w-4" /> Добавить чек-лист
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Добавить чек-лист</DialogTitle>
                    <DialogDescription>
                        Выберите чек-лист для добавления к этой задаче.
                    </DialogDescription>
                </DialogHeader>
                {isLoading ? (
                    <Spinner />
                ) : error ? (
                    <ErrorMessage message={error} />
                ) : availableChecklists.length === 0 ? (
                    <p className="text-center text-gray-500">
                        Нет доступных чек-листов для добавления с типом {cleaningType}.
                    </p>
                ) : (
                    <ScrollArea className="h-[200px] w-full rounded-md border p-4">
                        <ul className="space-y-2">
                            {availableChecklists.map((checklist) => (
                                <li key={checklist.id} className="flex items-center justify-between p-2 border rounded-md">
                                    <span>{checklist.name}</span>
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => onAddChecklist(checklist.id)}
                                        disabled={isUpdating}
                                    >
                                        Добавить
                                    </Button>
                                </li>
                            ))}
                        </ul>
                    </ScrollArea>
                )}
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Закрыть</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};