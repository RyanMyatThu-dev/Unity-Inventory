'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Building2, PlusCircle, LogOut, Briefcase, Loader2, ArrowRight } from 'lucide-react';
import { UnityLogo } from '@/components/ui/UnityLogo';
import { ThemeToggle } from '@/components/ThemeToggle';
import api from '@/services/api';

export default function SelectBusinessPage() {
  const { user, switchBusiness, logout } = useAuth();
  const [isCreating, setIsCreating] = useState(false);
  const [newBusinessName, setNewBusinessName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBusinessName) return;

    setIsSubmitting(true);
    try {
      const response = await api.post('/business/create', { 
        businessName: newBusinessName,
        subscriptionTier: 'Free' 
      });
      if (response.data.isSuccess) {
        // Refresh business list or just switch to the new one if the API returns it
        // For simplicity, we'll reload the page or call the switch if we have the ID
        window.location.reload();
      }
    } catch (error) {
      console.error('Failed to create business:', error);
    } finally {
      setIsSubmitting(false);
      setIsCreating(false);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen bg-white dark:bg-zinc-950 transition-colors">
        <UnityLogo size={48} className="animate-pulse text-zinc-900 dark:text-zinc-100" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900/50 flex items-center justify-center p-8 relative overflow-hidden font-sans">
      {/* Background Sophistication */}
      <div className="absolute top-0 left-0 w-full h-full opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
      <div className="absolute top-6 right-6">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-2xl z-10 space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="text-center space-y-3">
          <div className="inline-flex w-16 h-16 bg-zinc-900 dark:bg-zinc-100 rounded-2xl items-center justify-center text-white dark:text-zinc-900 shadow-xl dark:shadow-black/60 shadow-zinc-200 mb-4">
            <UnityLogo size={40} />
          </div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tighter">UnityInventory</h1>
          <p className="text-[10px] text-zinc-400 font-semibold uppercase tracking-[0.3em]">Choose an active workspace to continue</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {user?.businesses?.map((biz) => (
            <button
              key={biz.businessId}
              onClick={() => switchBusiness(biz.businessId)}
              className="group bg-white dark:bg-zinc-900 hover:bg-zinc-900 p-6 rounded-2xl border border-zinc-100 dark:border-zinc-800 hover:border-zinc-900 shadow-sm hover:shadow-2xl hover:shadow-zinc-900/20 transition-all duration-300 text-left flex flex-col justify-between h-48 relative overflow-hidden"
            >
              <div className="z-10">
                <div className="w-10 h-10 rounded-xl bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 group-hover:bg-zinc-700 group-hover:text-zinc-100 transition-all mb-4">
                  <UnityLogo size={20} />
                </div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-white transition-colors tracking-tight line-clamp-1 uppercase">
                  {biz.businessName}
                </h3>
                <p className="text-[9px] font-bold text-zinc-400 group-hover:text-zinc-500 transition-colors uppercase tracking-widest mt-1">
                   {biz.role || 'Member'} • Enterprise Tier
                </p>
              </div>
              
              <div className="z-10 flex items-center gap-2 text-[10px] font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-white uppercase tracking-widest mt-auto opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                Access Workspace <ArrowRight size={14} />
              </div>

              {/* Background Accent */}
              <div className="absolute -bottom-6 -right-6 opacity-[0.02] group-hover:opacity-[0.05] group-hover:scale-110 transition-all duration-500">
                <UnityLogo size={120} />
              </div>
            </button>
          ))}

          {/* New Business Card Placeholder */}
          <button 
            onClick={() => setIsCreating(true)}
            className="group p-6 rounded-2xl border-2 border-dashed border-zinc-200 dark:border-zinc-700 hover:border-zinc-900 hover:bg-white dark:bg-zinc-900 transition-all duration-300 flex flex-col items-center justify-center gap-3 h-48"
          >
            <div className="w-10 h-10 rounded-full bg-zinc-50 dark:bg-zinc-900/50 flex items-center justify-center text-zinc-400 group-hover:bg-zinc-900 group-hover:text-white transition-all">
              <PlusCircle size={20} />
            </div>
            <p className="text-[10px] font-bold text-zinc-400 group-hover:text-zinc-900 dark:text-zinc-100 uppercase tracking-widest">New Workspace</p>
          </button>
        </div>

        <div className="flex flex-col items-center gap-8 pt-6 border-t border-zinc-100 dark:border-zinc-800">
          <button 
            onClick={logout}
            className="group flex items-center gap-3 text-[10px] font-bold text-zinc-400 hover:text-zinc-900 dark:text-zinc-100 transition-all uppercase tracking-[0.2em]"
          >
            <LogOut size={16} className="group-hover:-translate-x-1 transition-transform" />
            Terminate Session
          </button>
        </div>
      </div>

      {/* Modern Creation Modal */}
      {isCreating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm" onClick={() => setIsCreating(false)}></div>
          <div className="relative bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-300">
            <form onSubmit={handleCreateBusiness} className="p-8 space-y-8">
              <div className="space-y-2">
                <div className="w-12 h-12 bg-zinc-900 rounded-xl flex items-center justify-center text-white mb-4">
                  <UnityLogo size={24} />
                </div>
                <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-tighter">Initialize Workspace</h3>
                <p className="text-[10px] text-zinc-400 font-semibold uppercase tracking-widest">Register a new enterprise entity</p>
              </div>

              <div className="space-y-2">
                <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Entity Name</label>
                <input 
                  autoFocus
                  type="text"
                  value={newBusinessName}
                  onChange={(e) => setNewBusinessName(e.target.value)}
                  className="w-full px-5 py-4 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800 focus:bg-white dark:bg-zinc-900 focus:border-zinc-900 outline-none transition-all text-xs font-semibold text-zinc-900 dark:text-zinc-100 shadow-inner"
                  placeholder="e.g. GLOBAL LOGISTICS LTD"
                />
              </div>

              <div className="flex flex-col gap-3">
                <button 
                  disabled={isSubmitting}
                  type="submit"
                  className="w-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 py-4 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all shadow-xl dark:shadow-black/60 shadow-zinc-200 disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : 'Finalize Creation'}
                </button>
                <button 
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="w-full py-2 text-[10px] font-bold text-zinc-400 hover:text-zinc-900 dark:text-zinc-100 transition-colors uppercase tracking-widest"
                >
                  Discard
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
