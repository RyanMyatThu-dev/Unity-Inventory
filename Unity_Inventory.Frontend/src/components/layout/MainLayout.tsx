'use client';

import React, { ReactNode, useEffect, useState, useRef } from 'react';
import { Sidebar } from './Sidebar';
import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { Bell, Plus, Search, Package, Users, FileText, BellOff, X } from 'lucide-react';
import { ThemeToggle } from '../ThemeToggle';
import { UnityLogo } from '../ui/UnityLogo';


export const MainLayout = ({ children }: { children: ReactNode }) => {
  const { accessToken, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isActionOpen, setIsActionOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const actionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isLoading && !accessToken && pathname !== '/login' && pathname !== '/select-business') {
      router.push('/login');
    }
  }, [accessToken, isLoading, router, pathname]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotifOpen(false);
      }
      if (actionRef.current && !actionRef.current.contains(e.target as Node)) {
        setIsActionOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-white dark:bg-zinc-950 transition-colors">
        <UnityLogo size={48} className="animate-pulse text-zinc-900 dark:text-zinc-100" />
      </div>
    );
  }

  if (pathname === '/login' || pathname === '/select-business') {
    return <>{children}</>;
  }

  if (!accessToken) {
    return (
      <div className="flex items-center justify-center h-screen bg-white dark:bg-zinc-950 transition-colors">
        <div className="w-8 h-8 border-2 border-zinc-900 dark:border-zinc-100 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const quickActions = [
    { label: 'New Product', icon: Package, href: '/inventory', description: 'Register a new SKU' },
    { label: 'New Customer', icon: Users, href: '/customers', description: 'Onboard a client' },
    { label: 'New Sale', icon: FileText, href: '/sales', description: 'Record a transaction' },
  ];

  return (
    <div className="flex min-h-screen bg-white dark:bg-zinc-950 transition-colors">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0">
        {/* Compact Header */}
        <header className="h-14 bg-white dark:bg-zinc-950 border-b border-border dark:border-zinc-800 flex items-center justify-between px-6 sticky top-0 z-40 transition-colors">
            <div className="flex items-center gap-4">
              <nav className="flex items-center text-xs font-medium text-zinc-400">
                <span className="hover:text-zinc-900 dark:hover:text-zinc-100 cursor-pointer">UnityInventory</span>
                <span className="mx-2">/</span>
                <span className="text-zinc-900 dark:text-zinc-100 capitalize">{pathname.split('/')[1] || 'Dashboard'}</span>
              </nav>
           </div>
           
           <div className="flex items-center gap-2">
               <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-zinc-100 dark:bg-zinc-900 rounded-md border border-transparent hover:border-zinc-300 dark:hover:border-zinc-700 transition-all cursor-text mr-2">
                <Search size={14} className="text-zinc-400" />
                <span className="text-xs text-zinc-400 pr-12">Search...</span>
                <span className="text-[10px] font-bold text-zinc-300 dark:text-zinc-600 border border-zinc-200 dark:border-zinc-700 px-1 rounded">⌘K</span>
              </div>

              <ThemeToggle />

              {/* Notification Bell */}
              <div className="relative" ref={notifRef}>
                <button 
                  onClick={() => { setIsNotifOpen(!isNotifOpen); setIsActionOpen(false); }}
                  className={`p-1.5 rounded-md transition-all ${isNotifOpen ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100' : 'text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800'}`}
                >
                  <Bell size={16} />
                </button>

                {isNotifOpen && (
                  <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-2xl shadow-zinc-200/50 dark:shadow-black/50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 z-50">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 dark:border-zinc-800">
                      <h3 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">Notifications</h3>
                      <button onClick={() => setIsNotifOpen(false)} className="p-0.5 text-zinc-400 hover:text-zinc-600 rounded transition-colors">
                        <X size={14} />
                      </button>
                    </div>
                    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                      <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 dark:bg-zinc-800 flex items-center justify-center mb-3">
                        <BellOff size={20} className="text-zinc-300 dark:text-zinc-600" />
                      </div>
                      <p className="text-xs font-semibold text-zinc-500">All caught up!</p>
                      <p className="text-[10px] text-zinc-400 mt-1 leading-relaxed">
                        You have no new notifications.<br />We'll let you know when something arrives.
                      </p>
                    </div>
                    <div className="px-4 py-2.5 bg-zinc-50 dark:bg-zinc-900/50 border-t border-zinc-100 dark:border-zinc-800">
                      <p className="text-[10px] text-zinc-400 text-center font-medium">Notification center</p>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Quick Action Button */}
              <div className="relative" ref={actionRef}>
                <button 
                  onClick={() => { setIsActionOpen(!isActionOpen); setIsNotifOpen(false); }}
                  className={`ml-2 flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all shadow-sm ${
                    isActionOpen 
                      ? 'bg-zinc-700 dark:bg-zinc-800 text-white' 
                      : 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200'
                  }`}
                >
                  <Plus size={14} className={`transition-transform duration-200 ${isActionOpen ? 'rotate-45' : ''}`} />
                  Action
                </button>

                {isActionOpen && (
                  <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-2xl shadow-zinc-200/50 dark:shadow-black/50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 z-50">
                    <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800">
                      <h3 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">Quick Actions</h3>
                      <p className="text-[10px] text-zinc-400 mt-0.5">Jump to a create flow</p>
                    </div>
                    <div className="py-1">
                      {quickActions.map((action) => (
                        <button
                          key={action.label}
                          onClick={() => {
                            setIsActionOpen(false);
                            router.push(action.href);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-left group"
                        >
                          <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center group-hover:bg-zinc-900 dark:group-hover:bg-zinc-100 group-hover:text-white dark:group-hover:text-zinc-900 text-zinc-400 transition-all shrink-0">
                            <action.icon size={14} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">{action.label}</p>
                            <p className="text-[10px] text-zinc-400">{action.description}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
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
