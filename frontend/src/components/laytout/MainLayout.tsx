'use client';

import React, { ReactNode } from 'react';
import Navbar from './Navbar'; 
import AppSidebar from './Sidebar';
import { ThemeProvider } from '../providers/ThemeProviders';
import { SidebarProvider } from "@/components/ui/sidebar"



export default function MainLayout({ children }: {children:ReactNode}) {
  return (
    <div className="flex h-screen bg-gray-100">
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem
        disableTransitionOnChange
      >

        <SidebarProvider>
          <AppSidebar />
            <main className="w-full bg-background">
              <Navbar />
              {children} 
            </main>
        </SidebarProvider>
      </ThemeProvider>
    </div>
  );
}
