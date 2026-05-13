'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/services/api';
import { Mail, Lock, LogIn, AlertCircle, Building2, Loader2 } from 'lucide-react';
import { UnityLogo } from '@/components/ui/UnityLogo';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const response = await api.post('/auth/login', { email, password });
      if (response.data.isSuccess) {
        login(response.data.data);
      } else {
        setError(response.data.message || 'Invalid credentials');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to connect to the server');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-900/50 p-6 relative overflow-hidden font-sans">
      {/* Abstract Background Detail */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-zinc-200/20 dark:bg-zinc-800/10 rounded-full blur-[120px] -mr-64 -mt-64" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-zinc-200/20 dark:bg-zinc-800/10 rounded-full blur-[120px] -ml-64 -mb-64" />

      <div className="w-full max-w-sm z-10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="text-center space-y-2">
          <div className="inline-flex w-14 h-14 bg-zinc-900 dark:bg-zinc-100 rounded-2xl items-center justify-center text-white dark:text-zinc-900 shadow-lg dark:shadow-black/70 shadow-zinc-200 mb-4 transform -rotate-2 hover:rotate-0 transition-transform duration-300">
            <UnityLogo size={32} />
          </div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tighter">UnityInventory</h1>
          <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-[0.2em]">Inventory Management System</p>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-3xl shadow-xl dark:shadow-black/70 shadow-zinc-200/50 p-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-rose-50 border border-rose-100 text-rose-600 px-4 py-3 rounded-xl flex items-center gap-3 animate-in fade-in zoom-in-95 duration-200">
                <AlertCircle size={16} />
                <p className="text-[11px] font-black uppercase tracking-tight">{error}</p>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1">Identity (Email)</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300 group-focus-within:text-zinc-900 dark:text-zinc-100 transition-colors" size={16} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800 rounded-xl focus:bg-white dark:bg-zinc-900 focus:border-zinc-900 focus:outline-none transition-all text-xs font-bold placeholder:text-zinc-300 shadow-inner"
                  placeholder="name@enterprise.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between ml-1">
                <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Secret Key (Password)</label>
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300 group-focus-within:text-zinc-900 dark:text-zinc-100 transition-colors" size={16} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800 rounded-xl focus:bg-white dark:bg-zinc-900 focus:border-zinc-900 focus:outline-none transition-all text-xs font-bold placeholder:text-zinc-300 shadow-inner"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 py-4 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:bg-zinc-800 dark:hover:bg-zinc-200 active:scale-[0.98] transition-all shadow-xl dark:shadow-black/70 shadow-zinc-200 disabled:opacity-50 group"
            >
              {isSubmitting ? (
                <Loader2 className="animate-spin" size={16} />
              ) : (
                <>
                  <LogIn size={14} className="group-hover:translate-x-1 transition-transform" />
                  Authenticate
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-800 text-center">
            <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">
              Secured Enterprise Environment
            </p>
          </div>
        </div>

        <div className="text-center space-y-4">
           <div className="flex items-center justify-center gap-4">
              <button className="text-[10px] font-black text-zinc-400 hover:text-zinc-900 dark:text-zinc-100 uppercase tracking-widest transition-colors">Privacy Policy</button>
              <div className="w-1 h-1 bg-zinc-200 dark:bg-zinc-800 rounded-full" />
              <button className="text-[10px] font-black text-zinc-400 hover:text-zinc-900 dark:text-zinc-100 uppercase tracking-widest transition-colors">IT Support</button>
           </div>
           <p className="text-[10px] text-zinc-300 font-medium tracking-tight">
             &copy; {new Date().getFullYear()} Unity Inventory CORE V2. All rights reserved.
           </p>
        </div>
      </div>
    </div>
  );
}
