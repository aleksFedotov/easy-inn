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

interface ErrorDialogProps {
  isOpen: boolean;
  onClose: () => void; 
  message: string | null; 
  title?: string; 
  onRetry?: () => void; 
  isRetryLoading?: boolean; 
  retryButtonText?: string; 
  closeButtonText?: string; 
}

const ErrorDialog: React.FC<ErrorDialogProps> = ({
  isOpen,
  onClose,
  message,
  title = 'Ошибка',
  onRetry,
  isRetryLoading = false,
  retryButtonText = 'Повторить',
  closeButtonText = 'Закрыть',
}) => {

  if (!message) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}> 
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-red-600">{title}</DialogTitle> 
          <DialogDescription>{message}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          
          {onRetry && (
            <Button
              variant="outline"
              onClick={onRetry}
              disabled={isRetryLoading} 
            >
              {isRetryLoading ? <Spinner size={16} className="mr-2"/> : retryButtonText}
            </Button>
          )}
         
          <Button onClick={onClose} disabled={isRetryLoading}>
            {closeButtonText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ErrorDialog