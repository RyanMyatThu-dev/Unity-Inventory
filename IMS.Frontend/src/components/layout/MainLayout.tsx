'use client';

import React, { ReactNode, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { Bell, Command, Plus, Search } from 'lucide-react';

export const MainLayout = ({ children }: { children: ReactNode }) => {
  const { accessToken, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !accessToken && pathname !== '/login' && pathname !== '/select-business') {
      router.push('/login');
    }
  }, [accessToken, isLoading, router, pathname]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-white">
        <div className="w-8 h-8 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (pathname === '/login' || pathname === '/select-business') {
    return <>{children}</>;
  }

  if (!accessToken) {
    return (
      <div className="flex items-center justify-center h-screen bg-white">
        <div className="w-8 h-8 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0">
        {/* Compact Header */}
        <header className="h-14 bg-white border-b border-border flex items-center justify-between px-6 sticky top-0 z-40">
           <div className="flex items-center gap-4">
              <nav className="flex items-center text-xs font-medium text-zinc-400">
                <span className="hover:text-zinc-900 cursor-pointer">IMS</span>
                <span className="mx-2">/</span>
                <span className="text-zinc-900 capitalize">{pathname.split('/')[1] || 'Dashboard'}</span>
              </nav>
           </div>
           
           <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-zinc-100 rounded-md border border-transparent hover:border-zinc-300 transition-all cursor-text mr-4">
                <Search size={14} className="text-zinc-400" />
                <span className="text-xs text-zinc-400 pr-12">Search...</span>
                <span className="text-[10px] font-bold text-zinc-300 border border-zinc-200 px-1 rounded">⌘K</span>
              </div>

              <button className="p-1.5 text-zinc-400 hover:text-zinc-900 transition-colors">
                <Bell size={16} />
              </button>
              
              <button className="ml-2 flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 text-white rounded-md text-xs font-medium hover:bg-zinc-800 transition-all shadow-sm">
                <Plus size={14} />
                Action
              </button>
           </div>
        </header>

        {/* Content Area - Reduced Padding */}
        <div className="p-6 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
};
