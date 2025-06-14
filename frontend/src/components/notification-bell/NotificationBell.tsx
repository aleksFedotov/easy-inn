import React, { useState } from 'react';
import { useNotification } from '@/context/NotificationContext'; 
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bell, Check, X } from 'lucide-react';

const NotificationBell: React.FC = () => {
  const { 
    unreadNotification, 
    unreadCount, 
    loading, 
    error,
    markOneAsRead,
    markAllAsRead,
    webSocketConnected 
  } = useNotification();

  const [showDropdown, setShowDropdown] = useState(false);
  
  
  const toggleDropdown = () => {  
    setShowDropdown((prev) => !prev);
  };




  // Простая функция форматирования даты
  const formatNotificationDate = (dateString: string) => {
    
      return new Date(dateString).toLocaleString('ru-RU', { 
        year: 'numeric', 
        month: 'numeric', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
      });
   
  };

  return (
    <div className="relative inline-block mr-4">
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
           <Button 
                        variant="ghost" 
                        size="icon" 
                        className="p-0 h-auto w-auto text-gray-500 hover:text-gray-700 ml-2" 
                        onClick={() => markAllAsRead(undefined, true)}
                      >
                        <Check size={16} /> 
                        Отменить все как прочитанные
            </Button>
          {loading && <p className="p-4 text-center text-sm text-gray-500">Загрузка уведомлений...</p>}
          {error && <p className="p-4 text-center text-sm text-red-500">Ошибка: {error}</p>}
          {!loading && !error && unreadNotification.length === 0 ? (
            <p className="p-4 text-center text-sm text-gray-500">Нет уведомлений.</p>
          ) : (
            <ScrollArea className="h-[300px] w-full"> 
              <ul className="divide-y divide-gray-200">
                {unreadNotification.map((notif) => (
                  <li 
                    key={notif.id} 
                    className={`p-4 transition-colors duration-200 ${notif.is_read ? 'bg-gray-50 text-gray-600' : 'bg-blue-50 text-blue-800'}`}
                  >
                    <div className="flex justify-between items-start text-sm mb-1">
                      <strong className="font-medium text-gray-900">{notif.title}</strong>
                     
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="p-0 h-auto w-auto text-gray-500 hover:text-gray-700 ml-2" 
                        onClick={() => markOneAsRead(notif)}
                      >
                        <X size={16} /> 
                      </Button>
                    </div>
                    <p className="text-sm leading-snug">{notif.body}</p>
                    <div className="text-gray-500 text-xs mt-1">
                        {formatNotificationDate(notif.created_at)}
                    </div>
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