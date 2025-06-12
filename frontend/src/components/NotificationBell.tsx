
import React, { useState, } from 'react';
import { useNotification } from '@/context/NotificationContext'; 



import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bell } from 'lucide-react';


const NotificationBell: React.FC = () => {
  const { notifications, unreadCount, loading, error, markAsRead, webSocketConnected } = useNotification();
  const [showDropdown, setShowDropdown] = useState(false);
 

  const toggleDropdown = async () => {
    
    if (!showDropdown && unreadCount > 0) {
      await markAsRead(undefined, true); 
    }
    setShowDropdown((prev) => !prev); 
  };

  const handleMarkSingleRead = async (notificationId: string) => {
    await markAsRead([notificationId]);
  };

  // Простая функция форматирования даты
  const formatNotificationDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString('ru-RU', { 
        year: 'numeric', 
        month: 'numeric', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch (e) {
      return dateString;
    }
  };


  return (
    <div className="relative inline-block mr-4"> {/* Tailwind-стили */}
      <Popover open={showDropdown} onOpenChange={setShowDropdown}>
        <PopoverTrigger asChild>
          <Button 
            variant="ghost"
            size="icon" 
            className="relative" 
            onClick={toggleDropdown}
            disabled={loading}
          >
            <Bell size={16}/>
            {unreadCount > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 h-4 w-4 p-0 rounded-full flex items-center justify-center text-xs"
              >
                {unreadCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="end"> 
          <div className="p-4 border-b">
            <h3 className="text-lg font-semibold">Уведомления</h3>
          </div>
          {loading && <p className="p-4 text-center text-sm text-gray-500">Загрузка уведомлений...</p>}
          {error && <p className="p-4 text-center text-sm text-red-500">Ошибка: {error}</p>}
          {!loading && !error && notifications.length === 0 ? (
            <p className="p-4 text-center text-sm text-gray-500">Нет уведомлений.</p>
          ) : (
            <ScrollArea className="h-[300px] w-full"> {/* Высота и прокрутка */}
              <ul className="divide-y divide-gray-200">
                {notifications.map((notif) => (
                  <li 
                    key={notif.id} 
                    className={`p-4 transition-colors duration-200 ${notif.is_read ? 'bg-gray-50 text-gray-600' : 'bg-blue-50 text-blue-800'}`}
                  >
                    <div className="flex justify-between items-start text-sm mb-1">
                      <strong className="font-medium text-gray-900">{notif.title}</strong>
                      <span className="text-gray-500 text-xs">{formatNotificationDate(notif.created_at)}</span>
                    </div>
                    <p className="text-sm leading-snug">{notif.body}</p>
                    {!notif.is_read && (
                      <Button 
                        variant="link" 
                        size="sm" 
                        className="p-0 h-auto mt-2 text-blue-600 hover:no-underline"
                        onClick={() => handleMarkSingleRead(notif.id)}
                      >
                        Прочитать
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            </ScrollArea>
          )}
        </PopoverContent>
      </Popover>

      {/* Индикатор статуса WebSocket (для отладки) */}
      <Badge 
        variant={webSocketConnected ? "default" : "secondary"} 
        className={`ml-2 text-xs ${webSocketConnected ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'}`}
      >
        {webSocketConnected ? 'WS Connected' : 'WS Disconnected'}
      </Badge>
    </div>
  );
};

export default NotificationBell;