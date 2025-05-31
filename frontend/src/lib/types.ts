

// Тип для данных пользователя, которые мы будем получать с бэкенда через API
export interface User {
  id: number;
  username: string,
  first_name:string,
  last_name: string,
  role: 'housekeeper' | 'front-desk' | 'manager';
}

export interface UserApiData {
    username: string;
    first_name?: string | null;
    last_name?: string | null;
    password?: string;
    role: User['role'];
}

// Тип для стандартных полей JWT payload

export interface JwtPayload {
    exp: number; 
    iat: number; 
    user_id?: number; 
}


/// Интерфейс для модели Booking 
export interface Booking {
    id: number;
    room: Room; 
    room_id: number,
    check_in: string; 
    check_out: string ; 
    guest_count: number;
    notes: string | null;
    created_at: string; 
    updated_at: string; 
    created_by: User | null;
    status: string;

    // Поля только для чтения из сериализатора 
    created_by_name?: string | null; 
    duration_days?: number | null; 
    status_display: string ;
    booking_status_display: string;
}

export interface RoomType {
    id: number;
    name: string;
    description: string;
    capacity: number;
    
}

// Интерфейс для модели Room 
export interface Room {
    id: number;
    number: string; 
    floor: number;
    room_type: RoomType; 
    room_type_id: number;
    room_type_name: string; 
    room_capacity: number;
    status: 'free' | 'occupied' | 'waiting_checkout' | 'dirty' | 'assigned' | 'in_progress' |'waiting_inspection' |'clean' |'on_maintenance'  
    notes: string;
    is_active: boolean;
    status_display: string;
    
}


// Интерфейс для модели Zone 
export interface Zone {
    id: number;
    name: string; 
    description: string;
    floor: number;     
}



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

// --- Интерфейс для RoomStatuses ---

export interface RoomStatuses {
    free?: number;
    occupied?:number;
    dirty?: number,
    in_progress?: number;          
    assigned?: number,
    waiting_inspection?: number;
    clean?: number;
    on_maintenance?: number;              
}

export interface RoomStatusesApi {
    id: number;   
    number: number;          
    status: 'free' | 'occupied' | 'waiting_checkout' | 'dirty' | 'assigned' | 'in_progress' |'waiting_inspection' |'clean' |'on_maintenance'  ;              
}