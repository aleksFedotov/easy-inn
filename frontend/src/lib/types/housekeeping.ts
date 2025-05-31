export type CleaningType =
  | 'stayover'
  | 'departure_cleaning'
  | 'deep_cleaning'
  | 'on_demand'
  | 'post_renovation_cleaning'
  | 'public_area_cleaning';

// Интерфейс для модели ChecklistTemplate 
export interface Checklist {
    id: number;
    name: string; 
    cleaning_type: CleaningType;
    cleaning_type_display: string;   
    periodicity: number; 
    offset_days: number;
    description: string; 
    items: ChecklistItem[]
}


// Интерфейс для модели ChecklistItemTemplate
export interface ChecklistItem {
    id: number;
    checklist_template: number;
    text: string; 
    order: number;
}

// Интерфейс для модели CleaningTask
export interface CleaningTask {
    id: number; 
    assigned_to: number | null; 
    assigned_to_name?: string | null; 
    assigned_by: number | null; 
    assigned_by_name?: string | null;
    room: number | null; 
    room_number?: string | null; 
    zone: number | null; 
    zone_name?: string | null; 
    booking: number | null; 
    cleaning_type: CleaningType; 
    cleaning_type_display: string; 
    status: 'unassigned'| "assigned" | "in_progress" | "completed" |"waiting_check" |"checked" |"canceled"; 
    status_display?: string; 
    scheduled_date: string | null; 
    due_time: string | null; 
    assigned_at: string | null; 
    started_at: string | null; 
    completed_at: string | null; 
    checked_at: string | null; 
    checked_by: number | null; 
    checked_by_name?: string | null; 
    notes: string | null; 
    checklist_data: Checklist;
    is_guest_checked_out: boolean;
}


export interface CleaningStats {
    checkoutTotal: number;         
    checkoutCompleted: number;     
    checkoutAvgTime: number | null; 
    currentTotal: number;          
    currentCompleted: number;      
    currentAvgTime: number | null;  
}