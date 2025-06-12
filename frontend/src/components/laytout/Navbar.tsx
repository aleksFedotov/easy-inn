'use client'

import React from 'react';
// import { Moon, Sun } from 'lucide-react';
// import { Button } from "@/components/ui/button"
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu"
// import { useTheme } from 'next-themes';
import { SidebarTrigger } from '../ui/sidebar';
import UserProfileDropdown from '../ui/UserProfileDropdown';
import NotificationBell from '../NotificationBell';



const Navbar = () => {
  // const {setTheme} = useTheme();
  return (
    <nav className='p-4 flex items-center justify-between bg-background'>
      <SidebarTrigger/>
      <div className='flex items-center gap-4'>
        {/* <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon">
              <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setTheme("light")}>
              Light
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("dark")}>
              Dark
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("system")}>
              System
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu> */}
        <NotificationBell/>
        <UserProfileDropdown/>
      </div>
        
    </nav>
    
  );
}


export default Navbar