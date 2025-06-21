// src/app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '../styles/globals.css';

import { AuthProvider } from '@/context/AuthContext'; 

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'EasyInn Hotel Management',
  description: 'Hotel management system',
   icons: {
    icon: '/', 
    shortcut: '/favicon-16x16.png', 
    apple: '/apple-touch-icon.png', 
    other: [
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '32x32',
        url: '/favicon-32x32.png',
      },
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '16x16',
        url: '/favicon-16x16.png',
      },
    ],
  },
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body className={`${inter.className} bg-gray-50`}>
        <AuthProvider>
    
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}