'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Building2, PlusCircle, LogOut, Briefcase, Loader2 } from 'lucide-react';
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

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-2xl z-10 space-y-10">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Select your business</h1>
          <p className="text-slate-500 mt-3 text-lg font-medium">Choose an organization to continue to your dashboard</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {user?.businesses?.map((biz) => (
            <button
              key={biz.businessId}
              onClick={() => switchBusiness(biz.businessId)}
              className="group bg-white hover:bg-slate-900 p-8 rounded-[32px] border border-slate-100 hover:border-slate-900 shadow-sm hover:shadow-2xl hover:shadow-slate-900/20 transition-all text-left flex items-center gap-5"
            >
              <div className="h-14 w-14 rounded-2xl bg-indigo-50 group-hover:bg-white/10 flex items-center justify-center flex-shrink-0 text-indigo-600 group-hover:text-white transition-colors">
                <Briefcase size={28} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-white transition-colors truncate">
                  {biz.businessName}
                </h3>
                <p className="text-xs font-bold text-slate-400 group-hover:text-indigo-200 transition-colors uppercase tracking-widest mt-0.5">
                  {biz.role || 'Member'}
                </p>
              </div>
            </button>
          ))}
        </div>

        <div className="flex flex-col items-center gap-6 pt-4">
          <button 
            onClick={() => setIsCreating(true)}
            className="text-slate-900 font-bold hover:text-indigo-600 transition-colors flex items-center gap-2 group"
          >
            <PlusCircle size={22} className="group-hover:rotate-90 transition-transform duration-300" />
            Create a new business
          </button>
          <button 
            onClick={logout}
            className="text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-widest"
          >
            Sign out
          </button>
        </div>
      </div>

      {/* Create Modal */}
      {isCreating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsCreating(false)}></div>
          <div className="relative bg-white rounded-[40px] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300">
            <form onSubmit={handleCreateBusiness} className="p-10 space-y-8">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Building2 size={28} />
                </div>
                <h3 className="text-2xl font-extrabold text-slate-900">New Business</h3>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Business Name</label>
                <input 
                  autoFocus
                  type="text"
                  value={newBusinessName}
                  onChange={(e) => setNewBusinessName(e.target.value)}
                  className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:bg-white focus:border-indigo-600 outline-none transition-all font-medium text-slate-900"
                  placeholder="e.g. Acme Corp"
                />
              </div>

              <div className="flex flex-col gap-3">
                <button 
                  disabled={isSubmitting}
                  type="submit"
                  className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20 disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : 'Create Business'}
                </button>
                <button 
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="w-full py-4 text-slate-400 font-bold hover:text-slate-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
