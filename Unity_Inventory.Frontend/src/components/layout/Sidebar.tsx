'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import api from '@/services/api';
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  FileText,
  ChevronDown,
  Search,
  Settings,
  Command,
  Plus,
  Check,
  Building2,
  X,
  Loader2,
  LogOut
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { UnityLogo } from '@/components/ui/UnityLogo';

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Inventory', href: '/inventory', icon: Package },
  { name: 'Report', href: '/sales', icon: FileText },
  { name: 'Customers', href: '/customers', icon: Users },
];

export const Sidebar = () => {
  const pathname = usePathname();
  const { user, currentBusinessId, switchBusiness, logout } = useAuth();
  const [isBusinessDropdownOpen, setIsBusinessDropdownOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newBusinessName, setNewBusinessName] = useState('');

  const currentBusiness = user?.businesses?.find(b => b.businessId === currentBusinessId);

  const handleRegisterBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBusinessName.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await api.post('/business/create', {
        businessName: newBusinessName,
        subscriptionTier: 'Free',
        ownerUserId: 0 // Backend overrides
      });

      if (response.data.isSuccess) {
        // Refresh page to get updated business list in context
        window.location.reload();
      }
    } catch (error) {
      console.error('Failed to register business:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col w-64 bg-[#FAFAFA] dark:bg-zinc-950 border-r border-border dark:border-zinc-700 h-screen sticky top-0 transition-all z-50">
      {/* Header */}
      <div className="h-14 flex items-center px-4 border-b border-border dark:border-zinc-700 justify-between bg-white dark:bg-zinc-950 transition-colors">
        <div className="flex items-center gap-2">
          <UnityLogo size={20} className="text-zinc-900 dark:text-zinc-100" />
          <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">UnityInventory</span>
        </div>
        <div className="flex items-center gap-1">
          <button className="p-1 text-zinc-400 hover:text-zinc-600">
            <Settings size={14} />
          </button>
        </div>
      </div>

      {/* Business Switcher Dropdown */}
      <div className="p-3 relative">
        <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest px-2 mb-1 block">Active Business</label>
        <button 
          onClick={() => setIsBusinessDropdownOpen(!isBusinessDropdownOpen)}
          className="w-full flex items-center justify-between p-2 rounded-md border border-border dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all"
        >
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-5 h-5 rounded bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 shrink-0">
              <UnityLogo size={14} />
            </div>
            <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300 truncate">{currentBusiness?.businessName || 'Select Business'}</span>
          </div>
          <ChevronDown size={14} className={cn("text-zinc-400 transition-transform", isBusinessDropdownOpen && "rotate-180")} />
        </button>

        {isBusinessDropdownOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsBusinessDropdownOpen(false)}></div>
            <div className="absolute left-3 right-3 mt-1 bg-white dark:bg-zinc-900 border border-border dark:border-zinc-700 rounded-md shadow-xl py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <p className="px-3 py-1.5 text-[10px] font-semibold text-zinc-400 uppercase border-b border-zinc-50 dark:border-zinc-800/50 mb-1">Your Businesses</p>
              <div className="max-h-[200px] overflow-y-auto">
                {user?.businesses?.map((business) => (
                  <button
                    key={business.businessId}
                    onClick={() => {
                      switchBusiness(business.businessId);
                      setIsBusinessDropdownOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2 text-left text-xs transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800",
                      currentBusinessId === business.businessId ? "bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-semibold" : "text-zinc-500"
                    )}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Building2 size={12} className={currentBusinessId === business.businessId ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-300 dark:text-zinc-600"} />
                      <span className="truncate">{business.businessName}</span>
                    </div>
                    {currentBusinessId === business.businessId && (
                      <Check size={12} className="text-zinc-900 dark:text-zinc-100 shrink-0" />
                    )}
                  </button>
                ))}
              </div>
              <div className="border-t border-zinc-50 dark:border-zinc-800 mt-1 px-1 pt-1">
                <button 
                  onClick={() => {
                    setIsBusinessDropdownOpen(false);
                    setIsRegisterModalOpen(true);
                  }}
                  className="w-full flex items-center gap-2 px-2 py-2 rounded text-xs text-zinc-900 dark:text-zinc-100  hover:bg-zinc-100 dark:hover:bg-zinc-800 dark:hover:bg-zinc-100 dark:hover:bg-zinc-8000/10 font-medium transition-colors"
                >
                  <Plus size={12} />
                  Register New Business
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Search */}
      <div className="px-3 mb-4">
        <div className="relative group">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
          <input
            type="text"
            placeholder="Quick search..."
            className="w-full pl-8 pr-2 py-1.5 bg-zinc-100 dark:bg-zinc-900/50 border border-transparent dark:border-zinc-800 rounded-md text-xs focus:bg-white dark:focus:bg-zinc-800 focus:border-zinc-300 dark:focus:border-zinc-700 transition-all outline-none text-zinc-900 dark:text-zinc-100"
          />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-0.5">
        <p className="px-2 pb-2 text-[10px] font-semibold text-zinc-400 uppercase tracking-widest">Platform</p>
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 px-2.5 py-1.5 rounded-md transition-all text-xs font-medium",
                isActive 
                  ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-border dark:border-zinc-700 shadow-sm" 
                  : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              )}
            >
              <item.icon size={16} className={cn(
                isActive ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-400 dark:text-zinc-600"
              )} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer Profile */}
      <div className="p-3 border-t border-border dark:border-zinc-800 bg-white dark:bg-zinc-900 dark:bg-zinc-950 space-y-2 transition-colors">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 dark:bg-zinc-900 flex items-center justify-center text-zinc-500 dark:text-zinc-400 border border-border dark:border-zinc-700 shrink-0 text-xs font-bold">
            {user?.email?.[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">{user?.email?.split('@')[0]}</p>
            <p className="text-[10px] text-zinc-400 truncate uppercase tracking-tight">{user?.role}</p>
          </div>
        </div>
        <button 
          onClick={logout} 
          className="w-full flex items-center gap-2 px-2.5 py-2 rounded-md text-xs font-medium text-zinc-500 dark:text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all group"
        >
          <LogOut size={14} className="text-zinc-400 group-hover:text-rose-500 transition-colors" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Register Business Modal */}
      {isRegisterModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-zinc-900/40 dark:bg-black/60" onClick={() => setIsRegisterModalOpen(false)}></div>
          <div className="relative bg-white dark:bg-zinc-900 border border-border dark:border-zinc-700 w-full max-w-sm rounded-lg shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-border dark:border-zinc-800">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">Register New Business</h3>
              <button onClick={() => setIsRegisterModalOpen(false)} className="text-zinc-400 hover:text-zinc-600">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleRegisterBusiness} className="p-4 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Business Legal Name</label>
                <input 
                  autoFocus
                  required
                  type="text"
                  value={newBusinessName}
                  onChange={(e) => setNewBusinessName(e.target.value)}
                  placeholder="e.g. Acme Corporation"
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900/50 border border-border dark:border-zinc-700 rounded-md text-xs focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100 focus:border-zinc-900 dark:focus:border-zinc-100 outline-none transition-all text-zinc-900 dark:text-zinc-100"
                />
              </div>
              <button 
                disabled={isSubmitting || !newBusinessName.trim()}
                type="submit" 
                className="w-full py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-semibold rounded-md hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : 'Complete Registration'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
