'use client';

import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';
import { useToastStore, ToastItem } from '@/store/useToastStore';

export const ToastItemComponent: React.FC<{ toast: ToastItem }> = ({ toast }) => {
  const removeToast = useToastStore((state) => state.removeToast);

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />,
    error: <XCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />,
    info: <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />,
  };

  const borderStyles = {
    success: 'border-emerald-500/30 shadow-emerald-500/10',
    error: 'border-rose-500/30 shadow-rose-500/10',
    warning: 'border-amber-500/30 shadow-amber-500/10',
    info: 'border-blue-500/30 shadow-blue-500/10',
  };

  return (
    <div
      role="alert"
      className={`pointer-events-auto flex items-start gap-3 w-full p-3.5 rounded-2xl border bg-white dark:bg-slate-900 shadow-xl ${borderStyles[toast.type]}`}
    >
      {icons[toast.type]}
      <div className="flex-1 min-w-0">
        {toast.title && (
          <h4 className="text-xs font-bold tracking-tight text-slate-900 dark:text-slate-100 mb-0.5">
            {toast.title}
          </h4>
        )}
        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed break-words">
          {toast.message}
        </p>
      </div>
      <button
        type="button"
        onClick={() => removeToast(toast.id)}
        className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        aria-label="Đóng thông báo"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

export const ToastContainer: React.FC = () => {
  const toasts = useToastStore((state) => state.toasts);

  if (!toasts || toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed top-5 right-5 z-[100] flex w-80 sm:w-96 flex-col gap-2.5 pointer-events-none max-w-[calc(100vw-2.5rem)]"
    >
      {toasts.map((item) => (
        <ToastItemComponent key={item.id} toast={item} />
      ))}
    </div>
  );
};

export default ToastContainer;
