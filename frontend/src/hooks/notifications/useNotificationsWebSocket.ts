

import { useEffect, useRef, useCallback } from 'react';
import { WebSocketMessageEvent, WebSocketNotificationPayload } from '@/lib/types/notifications';


interface UseWebSocketOptions {
  userId: number;
  token: string;
  onNewNotification: (notification: WebSocketNotificationPayload) => void;
  onConnectionStatusChange?: (isConnected: boolean) => void;
}

export const useNotificationsWebSocket = ({

  token,
  onNewNotification,
  onConnectionStatusChange,
}: UseWebSocketOptions) => {
  const websocketRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const isConnectingRef = useRef(false);

  const MAX_RECONNECT_ATTEMPTS = 10;
  const RECONNECT_BASE_DELAY_MS = 1000; 

  const connectWebSocket = useCallback(() => {
    if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected.');
      return;
    }
    if (isConnectingRef.current) {
        console.log('Already attempting to connect WebSocket.');
        return;
    }

    isConnectingRef.current = true;
    onConnectionStatusChange?.(false); 
   
    const baseWsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://127.0.0.1:8000/ws/notifications/';
    const wsUrl = `${baseWsUrl}?token=${token}`; 
   
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('WebSocket connected.');
      reconnectAttemptsRef.current = 0; 
      isConnectingRef.current = false;
      onConnectionStatusChange?.(true);
    };

    ws.onmessage = (event) => {
      try {
        const data: WebSocketMessageEvent = JSON.parse(event.data);
        if (data.type === 'send_notification' && data.message) {
          onNewNotification(data.message);
        }
      } catch (e) {
        console.error('Failed to parse WebSocket message:', e);
      }
    };

    ws.onclose = (event) => {
      console.log('WebSocket disconnected:', event.code, event.reason);
      isConnectingRef.current = false;
      websocketRef.current = null; 
      onConnectionStatusChange?.(false);

      if (event.code !== 1000 && reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) { 
        reconnectAttemptsRef.current++;
        const delay = Math.min(RECONNECT_BASE_DELAY_MS * Math.pow(2, reconnectAttemptsRef.current - 1), 30 * 1000); // Экспоненциальная задержка до 30с
        console.log(`Attempting to reconnect in ${delay / 1000}s (${reconnectAttemptsRef.current}/${MAX_RECONNECT_ATTEMPTS})...`);
        setTimeout(connectWebSocket, delay);
      } else if (event.code !== 1000) {
        console.error('Max reconnect attempts reached for WebSocket.');
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      isConnectingRef.current = false;
      onConnectionStatusChange?.(false);
      ws.close(); // Закрываем, чтобы onclose обработал переподключение
    };

    websocketRef.current = ws;
  }, [ token, onNewNotification, onConnectionStatusChange]);

  useEffect(() => {
    if (token) { 
        connectWebSocket();
    }

    return () => {
      if (websocketRef.current) {
        websocketRef.current.close();
        websocketRef.current = null;
      }
    };
  }, [token, connectWebSocket]); 
};