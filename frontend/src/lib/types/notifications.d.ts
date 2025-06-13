export interface Notification {
  id: string; 
  user: number; 
  title: string;
  body: string;
  notification_type: string;
  data: Record<string, unknown>; 
  is_read: boolean;
  created_at: string; 
}

export interface UnreadCountResponse {
  unread_count: number;
}



export interface WebSocketNotificationPayload {
  id: string;
  title: string;
  body: string;
  notification_type: string;
  data: Record<string, unknown>;
  timestamp: string; 
}

export interface WebSocketMessageEvent {
  type: string; 
  message: WebSocketNotificationPayload;
}