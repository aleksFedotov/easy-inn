import { TabTypes } from "@/lib/types";
import { TAB_TYPES } from "@/lib/constants";


export type TabType = keyof TabTypes;

export const getBookingsEndpoint = (tab: TabTypes[keyof TabTypes]): string => {
    switch (tab) {
        case TAB_TYPES.DEPARTURES:
            return '/api/bookings/departures-on-date/';
        case TAB_TYPES.ARRIVALS:
            return '/api/bookings/arrivals-on-date/';
        case TAB_TYPES.STAYS:
            return '/api/bookings/stays-on-date/';
        default:
            throw new Error(`Unknown tab: ${tab}`);
    }
};

export const ROOMS_STATUS_SUMMARY_ENDPOINT = '/api/rooms/status-summary/';