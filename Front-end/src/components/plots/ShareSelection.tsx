'use client';

import { useEffect, useState } from 'react';
import { Copy } from 'lucide-react';
import { PlotSelection, writePlotQuery } from '@/lib/plot-selection';

export function ShareSelection({ disabled, selection }: { disabled: boolean; selection: PlotSelection }) {
  const [message, setMessage] = useState('');
  const [fallback, setFallback] = useState('');
  useEffect(() => { setMessage(''); setFallback(''); }, [selection]);
  return <div className="min-w-0 space-y-2">
    <button type="button" disabled={disabled} onClick={async () => {
      const url = writePlotQuery(new URL(window.location.href), selection).href;
      try {
        await navigator.clipboard.writeText(url);
        setFallback(''); setMessage('Đã sao chép liên kết lựa chọn.');
      } catch {
        setFallback(url); setMessage('Chưa thể sao chép tự động. Chọn và sao chép liên kết bên dưới.');
      }
    }} className="flex max-w-full items-center gap-1.5 rounded-xl border border-emerald-300 bg-white px-3 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 disabled:opacity-50 dark:bg-slate-900 dark:text-emerald-200 dark:hover:bg-emerald-950">
      <Copy aria-hidden="true" className="h-4 w-4 shrink-0" /> Sao chép liên kết lựa chọn
    </button>
    {message && <p role="status" className="max-w-sm text-xs text-slate-600 dark:text-slate-300">{message}</p>}
    {fallback && <label className="block text-xs text-slate-600 dark:text-slate-300">Liên kết để sao chép
      <input readOnly value={fallback} onFocus={(event) => event.target.select()} className="mt-1 w-full min-w-0 rounded-lg border border-slate-300 bg-white p-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-600 dark:bg-slate-900" />
    </label>}
  </div>;
}
