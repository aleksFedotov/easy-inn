import { Booking } from '@/lib/types'

interface UiState {
  isPerformingAction: boolean;
  isCreateSheetOpen: boolean;
  isConfirmDeleteModalOpen: boolean;
  bookingToDelete: Booking | null;
  bookingToEdit: Booking | undefined;
}

export const initialUiState: UiState = {
  isPerformingAction: false,
  isCreateSheetOpen: false,
  isConfirmDeleteModalOpen: false,
  bookingToDelete: null,
  bookingToEdit: undefined,
};

export type UiAction =
  | { type: 'OPEN_CREATE_SHEET' }
  | { type: 'OPEN_EDIT_SHEET'; payload: Booking }
  | { type: 'OPEN_DELETE_MODAL'; payload: Booking }
  | { type: 'CLOSE_MODALS_AND_RESET_SELECTIONS' } // Для общего закрытия/отмены
  | { type: 'ACTION_SUCCESS' } // Закрывает модальные окна и сбрасывает выделения после успешного действия
  | { type: 'SET_PERFORMING_ACTION'; payload: boolean };

export function uiReducer(state: UiState, action: UiAction): UiState {
  switch (action.type) {
    case 'OPEN_CREATE_SHEET':
      return {
        ...state,
        isCreateSheetOpen: true,
        bookingToEdit: undefined, 
      };
    case 'OPEN_EDIT_SHEET':
      return {
        ...state,
        isCreateSheetOpen: true,
        bookingToEdit: action.payload,
      };
    case 'OPEN_DELETE_MODAL':
      return {
        ...state,
        isConfirmDeleteModalOpen: true,
        bookingToDelete: action.payload,
      };
    case 'CLOSE_MODALS_AND_RESET_SELECTIONS':
      return {
        ...state,
        isCreateSheetOpen: false,
        isConfirmDeleteModalOpen: false,
        bookingToEdit: undefined,
        bookingToDelete: null,
       
      };
    case 'ACTION_SUCCESS': 
      return {
        ...state,
        isPerformingAction: false,
        isCreateSheetOpen: false,
        isConfirmDeleteModalOpen: false,
        bookingToEdit: undefined,
        bookingToDelete: null,
      };
    case 'SET_PERFORMING_ACTION':
      return {
        ...state,
        isPerformingAction: action.payload,
      };
    default:
      return state;
  }
}
