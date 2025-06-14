import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Notification,WebSocketNotificationPayload } from '@/lib/types/notifications';
import { fetchNotifications, fetchUnreadCount, markNotificationsAsRead, fetchUnreadNotifications, markSingleNotificationAsRead} from '@/lib/webNotifications/apiNotifications'
import { useNotificationsWebSocket } from '@/hooks/notifications/useNotificationsWebSocket'; 
import axios from 'axios';
import { toast } from 'sonner';

interface NotificationContextType {
  notifications: Notification[];
  unreadNotification:Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  markOneAsRead: (notification: Notification) => Promise<void>
  markAllAsRead: (notifications?: Notification[], markAll?: boolean) => Promise<void>;
  webSocketConnected: boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: React.ReactNode;
  userId: number;
  token: string;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children, userId, token }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadNotification, setUnreadNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [webSocketConnected, setWebSocketConnected] = useState<boolean>(false);


  const handleNewWebSocketNotification = useCallback((payload: WebSocketNotificationPayload) => {
    const newNotification: Notification = {
      id: payload.id, 
      user: userId, 
      title: payload.title,
      body: payload.body,
      notification_type: payload.notification_type,
      data: payload.data,
      is_read: false, 
      created_at: payload.timestamp,
      save_to_db:payload.save_to_db
    };
    toast(payload.title || 'Новое уведомление', {
      description: payload.body,
      icon: '🔔',
      duration: 5000, 
      position: 'top-right', 
    });
    setUnreadNotifications((prev) => [newNotification, ...prev]);
    setUnreadCount((prev) => prev + 1);
  }, [userId]);


  useNotificationsWebSocket({
    userId,
    token,
    onNewNotification: handleNewWebSocketNotification,
    onConnectionStatusChange: setWebSocketConnected,
  });

  
  useEffect(() => {
    const loadData = async () => {
      if (!token || !userId) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const [notifResponse,unreadnotifResponse, countResponse] = await Promise.all([
          fetchNotifications(),
          fetchUnreadNotifications(),
          fetchUnreadCount(),
        ]);
        setNotifications(notifResponse);
        setUnreadNotifications(unreadnotifResponse)
        setUnreadCount(countResponse);
      } catch (error) {
          console.error("Failed to load initial notifications:", error);
          if(axios.isAxiosError(error) && error.message){
              setError(error.message || 'Failed to load notifications.');
          }
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [token, userId]);


const markOneAsRead = useCallback(async (notification: Notification) => {
  if(!token) return;
  try {
    if(notification.save_to_db) {
      await markSingleNotificationAsRead(notification.id)
    }
 
    setUnreadNotifications((prev) => prev.filter((notif) => notif.id !== notification.id))
    setUnreadCount((prev) => Math.max(0, prev - 1));
  } catch (error) {
      if(axios.isAxiosError(error) && error.message) {
            setError(error.message || 'Failed to mark single notification as read.');
        }
  }

},[token]) 


const markAllAsRead = useCallback(async (notifications?: Notification[], markAll: boolean = false) => {
    if (!token) return;
    try {
      if(notifications) {
        notifications = notifications.filter((noti) => noti.save_to_db === true)
        const  notificationIds:string [] = notifications?.map((noti) => noti.id)
        if(notificationIds && notificationIds.length > 0) {
          await markNotificationsAsRead(notificationIds, markAll);
        }

      }
      
      
      if (markAll) {
        setUnreadNotifications([]);
        setUnreadCount(0);
      } 

    } catch (error) {
        if(axios.isAxiosError(error) && error.message) {
            setError(error.message || 'Failed to mark notifications as read.');
        }
      console.error("Failed to mark notifications as read:", error);
    }
  }, [token]); 
  

  const contextValue = {
    notifications,
    unreadNotification,
    unreadCount,
    loading,
    error,
    markOneAsRead,
    markAllAsRead,
    webSocketConnected,
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};