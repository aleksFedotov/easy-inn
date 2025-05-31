import { TabType } from '@/components/front-desk/TabSelector';

export const getBookingsEndpoint = (tab: TabType): string => {
    switch (tab) {
        case 'departures':
            return '/api/bookings/departures-on-date/';
        case 'arrivals':
            return '/api/bookings/arrivals-on-date/';
        case 'stays':
            return '/api/bookings/stays-on-date/';
        default:
            throw new Error(`Unknown tab: ${tab}`);
    }
};

export const ROOMS_STATUS_SUMMARY_ENDPOINT = '/api/rooms/status-summary/';