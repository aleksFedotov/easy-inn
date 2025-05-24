'use client';

import React, { ReactNode } from 'react';
import Navbar from './Navbar'; 
import AppSidebar from './Sidebar';
import { ThemeProvider } from '../providers/ThemeProviders';
import { SidebarProvider } from "@/components/ui/sidebar"
import { Toaster } from "sonner"



export default function MainLayout({ children }: {children:ReactNode}) {
  return (
    <div className="flex h-screen">
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem
        disableTransitionOnChange
      >

        <SidebarProvider>
          <AppSidebar />
            <main className="w-full">
              <Navbar />
              {children} 
            </main>
             <Toaster />
        </SidebarProvider>
      </ThemeProvider>
    </div>
  );
}
