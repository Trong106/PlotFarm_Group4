'use client';

import { useEffect, useId, useRef } from 'react';
import { Scale, X } from 'lucide-react';
import { PlotStatusBadge } from './PlotStatus';

interface ComparedPlot {
  PlotId: number; PlotCode: string; AreaId: number; SizeM2: number;
  SoilPH: number; StandardHumidity: number; BasePricePerMonth: number;
  Status: string; HasActiveCultivation?: boolean | number;
}
interface ComparedArea { AreaId: number; AreaName: string; SoilType: string }
const value = (number: unknown, suffix = '') => (typeof number === 'number' || (typeof number === 'string' && number.trim() !== '')) && Number.isFinite(Number(number)) ? `${new Intl.NumberFormat('vi-VN').format(Number(number))}${suffix}` : 'Chưa cập nhật';
const action = 'rounded-lg px-3 py-2 text-xs font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2';

/** Native modal dialog provides focus containment, Escape and focus restoration. */
export function PlotComparison({ plots, areas, onClose, onChoose, onRemove, onClear }: {
  plots: ComparedPlot[]; areas: ComparedArea[]; onClose: () => void;
  onChoose: (id: number) => void; onRemove: (id: number) => void; onClear: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const dialog = dialogRef.current;
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    dialog?.showModal();
    document.body.style.overflow = 'hidden';
    // Keep keyboard traversal in the modal instead of moving to browser chrome.
    const containTab = (event: KeyboardEvent) => {
      if (event.key !== 'Tab' || !dialog) return;
      const controls = Array.from(dialog.querySelectorAll<HTMLElement>(
        'button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])'
      )).filter((element) => element.tabIndex >= 0 && element.getClientRects().length > 0);
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (!first) {
        event.preventDefault();
        dialog.focus();
      } else if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || document.activeElement === dialog)) {
        event.preventDefault();
        first.focus();
      }
    };
    dialog?.addEventListener('keydown', containTab);
    return () => {
      dialog?.removeEventListener('keydown', containTab);
      dialog?.close();
      document.body.style.overflow = previousOverflow;
      if (previousFocus?.isConnected && !previousFocus.matches(':disabled')) previousFocus.focus();
      else document.querySelector<HTMLElement>('section[aria-label="Chọn ô đất"] button')?.focus();
    };
  }, []);

  const rows: { label: string; render: (plot: ComparedPlot) => React.ReactNode }[] = [
    { label: 'Phân khu', render: (plot) => areas.find((area) => area.AreaId === plot.AreaId)?.AreaName || 'Chưa cập nhật' },
    { label: 'Thổ nhưỡng', render: (plot) => areas.find((area) => area.AreaId === plot.AreaId)?.SoilType || 'Chưa cập nhật' },
    { label: 'Diện tích', render: (plot) => value(plot.SizeM2, ' m²') },
    { label: 'Độ pH đất', render: (plot) => value(plot.SoilPH) },
    { label: 'Độ ẩm tiêu chuẩn', render: (plot) => value(plot.StandardHumidity, '%') },
    { label: 'Giá thuê / tháng', render: (plot) => <strong className="text-emerald-700 dark:text-emerald-300">{value(plot.BasePricePerMonth, ' đ')}</strong> },
    { label: 'Trạng thái', render: (plot) => <PlotStatusBadge plot={plot} /> },
  ];

  return <dialog ref={dialogRef} aria-modal="true" aria-labelledby={titleId} onCancel={(event) => { event.preventDefault(); onClose(); }} className="m-auto max-h-[90dvh] w-[calc(100%_-_1rem)] max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-3 text-slate-900 shadow-2xl backdrop:bg-slate-900/70 dark:border-slate-700 dark:bg-slate-900 dark:text-white sm:p-6">
    <header className="mb-4 flex items-start justify-between gap-2">
      <div className="min-w-0"><h2 id={titleId} className="flex items-center gap-2 text-base font-extrabold sm:text-xl"><Scale aria-hidden="true" className="h-5 w-5 shrink-0 text-emerald-600" />So sánh 2 ô đất</h2><p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">Đối chiếu thông số trước khi chọn hạt giống và gói chăm sóc.</p></div>
      <button type="button" autoFocus onClick={onClose} aria-label="Đóng bảng so sánh" className={`${action} shrink-0 text-slate-600 dark:text-slate-200`}><X aria-hidden="true" className="h-5 w-5" /></button>
    </header>
    <div className="grid grid-cols-2 gap-2">
      {plots.map((plot) => <div key={plot.PlotId} className="min-w-0 rounded-t-xl bg-emerald-50 p-3 dark:bg-emerald-950/40"><h3 className="break-words text-sm font-extrabold">{plot.PlotCode}</h3><button type="button" onClick={() => onRemove(plot.PlotId)} aria-label={`Bỏ so sánh ô ${plot.PlotCode}`} className="mt-2 rounded text-xs text-slate-600 underline focus-visible:ring-2 focus-visible:ring-emerald-600 dark:text-slate-300">Bỏ so sánh</button></div>)}
    </div>
    {rows.map((row) => <section key={row.label} aria-label={row.label} className="border-b border-slate-200 py-3 dark:border-slate-700"><h4 className="mb-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400">{row.label}</h4><div className="grid grid-cols-2 gap-2">{plots.map((plot) => <div key={plot.PlotId} className="min-w-0 break-words pr-1 text-xs leading-relaxed sm:text-sm">{row.render(plot)}</div>)}</div></section>)}
    <div className="mt-4 grid grid-cols-2 gap-2">{plots.map((plot) => {
      const available = plot.Status === 'AVAILABLE' && plot.HasActiveCultivation !== true && plot.HasActiveCultivation !== 1;
      return <div key={plot.PlotId} className="min-w-0"><button type="button" disabled={!available} aria-label={available ? `Chọn ô ${plot.PlotCode}` : `Ô ${plot.PlotCode} chưa thể thuê`} onClick={() => onChoose(plot.PlotId)} className={`${action} w-full bg-emerald-700 text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-600 dark:disabled:bg-slate-700 dark:disabled:text-slate-300`}>{available ? 'Chọn ô này' : 'Chưa thể thuê'}</button></div>;
    })}</div>
    <p className="mt-3 text-xs leading-relaxed text-slate-600 dark:text-slate-300">Chọn ô sẽ xóa bộ lọc để hiển thị ô đó. Chỉ ô sẵn sàng thuê và không có vụ mùa đang hoạt động mới có thể chọn thuê.</p>
    <footer className="mt-4 flex flex-wrap justify-end gap-2"><button type="button" onClick={onClear} className={`${action} border border-slate-300 dark:border-slate-600`}>Xóa so sánh</button><button type="button" onClick={onClose} className={`${action} text-emerald-700 dark:text-emerald-300`}>Quay lại bản đồ</button></footer>
  </dialog>;
}
