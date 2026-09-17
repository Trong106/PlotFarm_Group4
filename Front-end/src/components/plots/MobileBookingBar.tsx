'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowRight } from 'lucide-react';

export function MobileBookingBar({ hidden, plotCode, growthDays, total, canCheckout, message, onCheckout }: {
  hidden: boolean;
  plotCode?: string;
  growthDays: number;
  total: string | null;
  canCheckout: boolean;
  message: string;
  onCheckout: () => void;
}) {
  const barRef = useRef<HTMLElement>(null);
  const [height, setHeight] = useState(180);

  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;
    const measure = () => setHeight(Math.ceil(bar.getBoundingClientRect().height));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(bar);
    return () => observer.disconnect();
  }, [hidden]);

  return <>
    <div aria-hidden="true" className="shrink-0 lg:hidden" style={{ height }} />
    {!hidden && <aside ref={barRef} aria-label="Tóm tắt đặt thuê" className="fixed inset-x-0 bottom-0 z-30 border-t border-emerald-200 bg-white px-3 pt-3 shadow-[0_-4px_20px_rgba(15,23,42,0.10)] dark:border-slate-700 dark:bg-slate-900 lg:hidden" style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>
      <div className="mx-auto max-w-3xl space-y-2">
        <div className="flex min-w-0 flex-wrap items-start justify-between gap-x-4 gap-y-1">
          <p className="min-w-0 break-all text-xs font-semibold text-slate-600 dark:text-slate-300">{plotCode ? `Ô ${plotCode}` : 'Chưa chọn ô đất'}{growthDays > 0 && ` · ${growthDays} ngày / 1 vụ`}</p>
          <p className="min-w-0 text-xs text-slate-600 dark:text-slate-300">Tổng chi phí <strong className="block break-all text-xl font-extrabold text-emerald-700 dark:text-emerald-300">{total ?? 'Chưa đủ thông tin'}</strong></p>
        </div>
        {message && <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">{message}</p>}
        <button type="button" disabled={!canCheckout} onClick={onCheckout} className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-3 py-3 text-sm font-bold text-white hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-600 dark:disabled:bg-slate-800 dark:disabled:text-slate-400">Tiếp tục đặt thuê <ArrowRight aria-hidden="true" className="h-4 w-4 shrink-0" /></button>
      </div>
    </aside>}
  </>;
}
