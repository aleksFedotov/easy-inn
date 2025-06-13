
import { Notification,UnreadCountResponse } from '../types/notifications';
import api from '../api';


export const fetchNotifications = async (): Promise<Notification[]> => { 
  try {
    const response = await api.get<Notification[]>('/api/notifications/'); 
    return response.data;
  } catch (error) {
    console.error("Error fetching notifications:", error);
    throw error;
  }
};


export const fetchUnreadNotifications = async (): Promise<Notification[]> => {
  try {
    const response = await api.get<Notification[]>('/api/notifications/unread/'); 
    return response.data;
  } catch (error) {
    console.error("Error fetching unread notifications:", error);
    throw error;
  }
};


export const fetchUnreadCount = async (): Promise<number> => { 
  try {
    const response = await api.get<UnreadCountResponse>('/api/notifications/unread-count/'); 
    return response.data.unread_count;
  } catch (error) {
    console.error("Error fetching unread count:", error);
    throw error;
  }
};

export const markNotificationsAsRead = async (
  notificationIds?: string[], 
  markAll: boolean = false
): Promise<unknown> => {
  const payload: { notification_ids?: string[]; mark_all?: boolean } = {};
  if (markAll) {
    payload.mark_all = true;
  } else if (notificationIds && notificationIds.length > 0) {
    payload.notification_ids = notificationIds;
  } else {
    console.warn("No notification IDs or markAll=true provided for marking as read.");
    return;
  }

  try {
    const response = await api.post('/api/notifications/mark-read/', payload); 
    return response.data;
  } catch (error) {
    console.error("Error marking notifications as read:", error);
    throw error;
  }
};


export const markSingleNotificationAsRead = async (notificationId: string): Promise<unknown> => {
  try {
    const response = await api.post('/api/notifications/mark-read/', {
      single_notification_id: notificationId,
    });
    return response.data;
  } catch (error) {
    console.error(`Error marking notification ${notificationId} as read:`, error);
    throw error;
  }
};