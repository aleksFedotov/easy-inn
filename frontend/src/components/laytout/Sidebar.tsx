'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext'; 
import Image from 'next/image';
import {
  Home, 
  ConciergeBell , 
  BrushCleaning, 
  Users,
  BedDouble, 
  Bubbles, 
} from 'lucide-react'; 
import { SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  // SidebarGroup,
  SidebarHeader,
} from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"




const menuItems = [
  {
    id: 'dashboard', 
    name: 'Главная',
    href: '/dashboard',
    icon: Home,
    roles: ['frontDesk', 'manager', 'housekeeper'], 
  },
  {
    id: 'front-desk', 
    name: 'Служба приема',
    href: '/front-desk', 
    icon: ConciergeBell,
    roles: ['frontDesk', 'manager'], 
  },
  {
    id: 'housekeeping', 
    name: 'Уборка',
    href: '/housekeeping', 
    icon: BrushCleaning, 
    roles: ['frontDesk', 'manager', 'housekeeper'], 
  },
  
];
const settingsItems = [
    {
      id: 'settings-users',  
      name: 'Пользователи',
      href: '/users',
      icon: Users,
      roles: [ 'manager'], 
    },
    {
      id: 'settings-rooms',  
      name: 'Настройка комнат',
      href: '/room-setup', 
      icon: BedDouble,
      roles: [ 'manager'], 
    },
    {
      id: 'settings-cleaning',  
      name: 'Настройка уборки',
      href: '/cleaning-setup', 
      icon: Bubbles, 
      roles: [ 'manager'],
    },
 
];

  const AppSidebar = () =>{
  // const pathname = usePathname(); 
  

  const {user, isLoading: isAuthLoading } = useAuth();


  // Если AuthContext еще загружается, не рендерим сайдбар
   if (isAuthLoading || !user) {
       return null;
   }

  const filteredMenuItems = menuItems.filter(item => {
    return item.roles.includes(user.role);
  });


  return (
    <Sidebar collapsible='icon'>
      <SidebarHeader className='flex items-center'>
        <Image src={'/images/logo.png'} width={80} height={80} alt="EasyInn Logo" />
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          <SidebarGroup>
            <SidebarGroupLabel>
              Отель
            </SidebarGroupLabel>
            <SidebarGroupContent>
             {filteredMenuItems.map((item) => (
             <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton asChild>
                    <Link href={item.href}>
                      <item.icon />
                      <span>{item.name}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
             ))}
            </SidebarGroupContent>
          </SidebarGroup>
          <Separator/>
          {user.role === "manager" && <SidebarGroup>
            <SidebarGroupLabel>
              Настройки Отеля
            </SidebarGroupLabel>
            <SidebarGroupContent>
             {settingsItems.map((item) => (
             <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton asChild>
                    <Link href={item.href}>
                      <item.icon />
                      <span>{item.name}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
             ))}
            </SidebarGroupContent>
          </SidebarGroup>}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        {/* Добавьте сюда элементы футера, если они нужны (например, выход) */}
      </SidebarFooter>
    </Sidebar>
  )
}


export default AppSidebar