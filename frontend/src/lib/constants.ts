export const ACCESS_TOKEN: string = "access"
export const REFRESH_TOKEN:string = "refresh"


export const CLEANING_TYPES = {
  STAYOVER: 'stayover', // Ежедневная уборка
  DEPARTURE: 'departure_cleaning', // Уборка при выезде
  DEEP: 'deep_cleaning', // Генеральная уборка
  ON_DEMAND: 'on_demand', // Уборка по запросу
  POST_RENOVATION: 'post_renovation_cleaning', // Уборка после ремонта
  PUBLIC_AREA: 'public_area_cleaning', // Текущая уборка общих зон
};

export const CLEANICNG_STATUSES = {
  UNASSIGNED: 'unassigned', // Задача не назначена
  ASSIGNED: 'assigned', // Задача назначена горничной
  IN_PROGRESS: 'in_progress', // В процессе уборки
  COMPLETED: 'completed', // Уборка завершена
  WAITING_CHECK: 'waiting_check', // Ожидает проверки
  CHECKING: 'checking', // Проверка в процессе
  CHECKED: 'checked', // Проверено
  CANCELED: 'canceled', // Отменена
};

export const ROOM_STATUSES = {
  FREE: 'free',                 // Свободен и доступен
  OCCUPIED: 'occupied',         // В настоящее время занят гостем
  DIRTY: 'dirty',               // Требуется уборка
  ASSIGNED: 'assigned',         // Задача назначена горничной
  IN_PROGRESS: 'in_progress',   // В процессе уборки
  WAITING_INSPECTION: 'waiting_inspection', // Ожидает проверки
  CLEAN: 'clean',               // Чистый (готов к заезду)
  ON_MAINTENANCE: 'on_maintenance' // На обслуживании
}

export const cleaningTypeOptions = [
  { value: 'stayover', label: 'Ежедневная уборка' },
  { value: 'departure_cleaning', label: 'Уборка при выезде' },
  { value: 'deep_cleaning', label: 'Генеральная уборка' },
  { value: 'on_demand', label: 'Уборка по запросу' },
  { value: 'post_renovation_cleaning', label: 'Уборка после ремонта' },
  { value: 'public_area_cleaning', label: 'Текущая уборка общих зон' },
  { value: 'pre_arrival', label: 'Подготовка к заезду' },
];

export const CLEANING_TYPE_VALUES = [
  'stayover',
  'departure_cleaning',
  'deep_cleaning',
  'on_demand',
  'post_renovation_cleaning',
  'public_area_cleaning',
  'pre_arrival'
] as const;


export const USER_ROLES = {
  HOUSEKEEPER : 'housekeeper',     
  MANAGER : 'manager', 
  FRONT_DESK : 'front-desk', 
}
export const BOOKING_STATUSES = {
  UPCOMING : 'upcoming',     
  IN_PROGRESS : 'in_progress', 
  CHECKED_OUT : 'front-checked_out', 
  CANCELLED : 'front-cancelled', 
  NO_SHOW : 'front-no_show', 
}

export const COLORS = ['#2563eb', '#dc2626', '#a855f7', '#16a34a', '#eab308', '#0e7490', '#f97316', '#7e22ce', '#0284c7'];

export const TAB_TYPES = {
  DEPARTURES: 'departures',
  ARRIVALS: 'arrivals',
  STAYS: 'stays',
} as const;

 export const CLEANING_TYPE_ORDER  = [
      'Уборка при выезде',
      'Ежедневная уборка', 
      'Текущая уборка общих зон',
  ];