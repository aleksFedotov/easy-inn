// hooks/notifications/useNotificationsWebSocket.ts

import { useEffect, useRef } from 'react';
import { WebSocketNotificationPayload } from '@/lib/types/notifications';

interface UseNotificationsWebSocketProps {
  userId: number | null;
  token: string | null;
  onNewNotification: (payload: WebSocketNotificationPayload) => void;
  onConnectionStatusChange: (connected: boolean) => void;
}

export const useNotificationsWebSocket = ({
  userId,
  token,
  onNewNotification,
  onConnectionStatusChange,
}: UseNotificationsWebSocketProps) => {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const MAX_RECONNECT_ATTEMPTS = 5; // Максимальное количество попыток переподключения
  const RECONNECT_INTERVAL = 2000; // Интервал между попытками (мс)

  useEffect(() => {
    if (!userId || !token) {
      console.warn("WebSocket: userId or token not available, not connecting.");
      onConnectionStatusChange(false);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      return;
    }

    const connect = () => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        console.log("WebSocket: Already connected.");
        return;
      }

      console.log(`WebSocket: Attempting to connect for user ${userId}...`);
      onConnectionStatusChange(false);

    
      const baseWsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://127.0.0.1:8000/ws/notifications/';
      const wsUrl = `${baseWsUrl}?token=${token}`; 
    
      const ws = new WebSocket(wsUrl);

      

      ws.onopen = () => {
        console.log("WebSocket: Connected successfully!");
        onConnectionStatusChange(true);
        reconnectAttempts.current = 0; // Сброс попыток при успешном подключении
      };

      ws.onmessage = (event) => {
        try {
          const payload: WebSocketNotificationPayload = JSON.parse(event.data);
          onNewNotification(payload);
        } catch (e) {
          console.error("WebSocket: Error parsing message:", e, event.data);
        }
      };

      ws.onclose = (event) => {
        console.warn("WebSocket: Disconnected. Code:", event.code, "Reason:", event.reason);
        onConnectionStatusChange(false);
        if (reconnectAttempts.current < MAX_RECONNECT_ATTEMPTS) {
          reconnectAttempts.current++;
          console.log(`WebSocket: Attempting reconnect ${reconnectAttempts.current}/${MAX_RECONNECT_ATTEMPTS}...`);
          setTimeout(connect, RECONNECT_INTERVAL);
        } else {
          console.error("WebSocket: Max reconnect attempts reached. Connection lost.");
        }
      };

      ws.onerror = (error) => {
        console.error("WebSocket: Error occurred:", error);
        onConnectionStatusChange(false);
        ws.close(); // Закрываем соединение при ошибке, чтобы инициировать reconnect
      };

      wsRef.current = ws;
    };

    connect();

    return () => {
      console.log("WebSocket: Cleaning up (closing connection)...");
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [userId, token, onNewNotification, onConnectionStatusChange]);
};