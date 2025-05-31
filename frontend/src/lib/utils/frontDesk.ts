import { format } from "date-fns";
import { FRONT_DESK_CONFIG } from "../constants/frontDesk";
import { TabType } from "../types/frontDesk";
import { Booking } from "../types";


export const formatDateForApi = (date: Date | undefined): string | undefined => {
  if (!date) return undefined;
  return format(date, 'yyyy-MM-dd');
};

export const getTabEndpoint = (tab: TabType): string => {
  return FRONT_DESK_CONFIG.ENDPOINTS[tab];
};

export const createTableColumns = (
  selectedTab: TabType,
  onAction: (action: string, booking: Booking) => void,
  isPerformingAction: boolean
): ColumnDef<Booking>[] => {
  // Логика создания колонок
};