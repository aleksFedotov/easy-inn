'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { ChevronDown, UserIcon } from 'lucide-react';


const UserProfileDropdown = () => {
    const { user, logout } = useAuth();
    const router = useRouter();
    const [isMounted, setIsMounted] = useState(false); // Для решения проблемы гидратации

    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted) {
        return null; // Или какой-то плейсхолдер, если необходимо
    }

    const handleLogout = async () => {
        await logout();
        router.push('/login');
    };

    const getInitials = (firstName?: string, lastName?: string): string => {
        if (!firstName && !lastName) return ''; 
        return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative flex items-center space-x-2"> {/* Изменено: flex и space-x-2 */}
                    <Avatar className="h-8 w-8">
                        {user ? (
                            <AvatarFallback>{getInitials(user.first_name, user.last_name)}</AvatarFallback>
                        ) : (
                            <AvatarFallback><UserIcon size={20} className="h-5 w-5" /></AvatarFallback>
                        )}
                    </Avatar>
                    {user && (
                        <div className="text-left"> 
                            <p className="text-sm font-medium">{user.last_name} {user.first_name}</p>
                            <p className="text-xs text-gray-500">{user.username}</p>
                        </div>
                    )}
                    <ChevronDown className="h-4 w-4 absolute right-1 top-1/2 -translate-y-1/2 text-gray-500" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 mr-2">
                {/* <DropdownMenuItem onClick={() => router.push('/profile')}>
                    Профиль
                </DropdownMenuItem> */}
                <DropdownMenuItem onClick={handleLogout}>
                    Выйти
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export default UserProfileDropdown;