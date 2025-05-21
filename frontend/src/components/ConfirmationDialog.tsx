import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/spinner'; 


interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void; 
  onConfirm: () => void; 
  message: string; 
  title?: string; 
  confirmButtonText?: string; 
  cancelButtonText?: string; 
  isLoading?: boolean; 
  confirmButtonVariant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'; // Вариант кнопки подтверждения
 
}

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  message,
  title = 'Подтверждение',
  confirmButtonText = 'Подтвердить',
  cancelButtonText = 'Отмена',
  isLoading = false,
  confirmButtonVariant = 'destructive', 
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}> 
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{message}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading} 
          >
            {cancelButtonText}
          </Button>
    
          <Button
            variant={confirmButtonVariant}
            onClick={onConfirm}
            disabled={isLoading} 
          >
           
            {isLoading && <Spinner size={16} className="mr-2"/> }
            {isLoading ? 'Загрузка...' : confirmButtonText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ConfirmationDialog;
