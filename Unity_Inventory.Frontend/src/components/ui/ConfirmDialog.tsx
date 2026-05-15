import React, { useState } from 'react';
import { X, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => Promise<void> | void;
  onCancel: () => void;
  isDestructive?: boolean;
}

export function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  isDestructive = false
}: ConfirmDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await onConfirm();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-zinc-900/40 dark:bg-black/40 backdrop-blur-sm animate-in fade-in duration-200" 
        onClick={!isLoading ? onCancel : undefined} 
      />
      <div className="relative bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 w-full max-w-sm rounded-2xl shadow-2xl p-6 animate-in zoom-in-95 duration-200">
        <div className="flex items-start gap-4">
          <div className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center shrink-0 mt-1",
            isDestructive ? "bg-rose-100 dark:bg-rose-500/10 text-rose-600 dark:text-rose-500" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
          )}>
            <AlertCircle size={20} />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-widest">{title}</h3>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-2 leading-relaxed">{description}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-8">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 text-[10px] font-bold uppercase tracking-widest rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading}
            className={cn(
              "flex-1 px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50",
              isDestructive 
                ? "bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20" 
                : "bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 shadow-black/20"
            )}
          >
            {isLoading ? <Loader2 size={14} className="animate-spin" /> : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
