// context/NotificationContext.tsx

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Notification,WebSocketNotificationPayload } from '@/lib/types/notifications';
import { fetchNotifications, fetchUnreadCount, markNotificationsAsRead } from '@/lib/webNotifications/apiNotifications'
import { useNotificationsWebSocket } from '@/hooks/notifications/useNotificationsWebSocket'; 
import axios from 'axios';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  markAsRead: (notificationIds?: string[], markAll?: boolean) => Promise<void>;
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
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [webSocketConnected, setWebSocketConnected] = useState<boolean>(false);


  const handleNewWebSocketNotification = useCallback((payload: WebSocketNotificationPayload) => {
  
    const newNotification: Notification = {
      id: `ws-${Date.now()}-${Math.random()}`, 
      user: userId, 
      title: payload.title,
      body: payload.body,
      notification_type: payload.notification_type,
      data: payload.data,
      is_read: false, 
      created_at: payload.timestamp,
    };
    setNotifications((prev) => [newNotification, ...prev]);
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
        const [notifResponse, countResponse] = await Promise.all([
          fetchNotifications(),
          fetchUnreadCount(),
        ]);
        setNotifications(notifResponse.results);
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


  const markAsRead = useCallback(async (notificationIds?: string[], markAll: boolean = false) => {
    if (!token) return;
    try {
      await markNotificationsAsRead(notificationIds, markAll);
      if (markAll) {
        setNotifications((prev) => prev.map((notif) => ({ ...notif, is_read: true })));
        setUnreadCount(0);
      } else if (notificationIds) {
        setNotifications((prev) =>
          prev.map((notif) => (notificationIds.includes(notif.id) ? { ...notif, is_read: true } : notif))
        );
        setUnreadCount((prev) => Math.max(0, prev - (notificationIds.filter(id => notifications.find(n => n.id === id && !n.is_read)).length)));
      }
    } catch (error) {
        if(axios.isAxiosError(error) && error.message) {
            setError(error.message || 'Failed to mark notifications as read.');

        }
      console.error("Failed to mark notifications as read:", error);
    }
  }, [token, notifications]); 
  const contextValue = {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
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