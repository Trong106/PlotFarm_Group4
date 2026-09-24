import { Droplets, Sprout, RefreshCw } from 'lucide-react';
import { weeklyCare } from '@/lib/weekly-care';

type Props = {
  logs: Parameters<typeof weeklyCare>[0];
  cultivationId: number;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onViewLogs: () => void;
};

export function WeeklyCareCard({ logs, cultivationId, loading, error, onRetry, onViewLogs }: Props) {
  const week = weeklyCare(logs, cultivationId);
  return <section aria-labelledby="weekly-care-title" className="min-w-0 rounded-2xl border border-emerald-200 bg-white p-4 sm:p-6 dark:border-emerald-900 dark:bg-slate-900">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><h2 id="weekly-care-title" className="text-base font-extrabold text-slate-900 dark:text-white">Hoạt động chăm sóc trong tuần</h2><p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-400">{week.startLabel} – {week.endLabel} · Thứ Hai–Chủ Nhật · Giờ Việt Nam (UTC+7)</p></div>
      <button type="button" onClick={onViewLogs} className="rounded-lg px-2 py-1 text-xs font-bold text-emerald-700 hover:bg-emerald-50 focus-visible:outline focus-visible:outline-2 dark:text-emerald-300 dark:hover:bg-emerald-950">Xem toàn bộ nhật ký →</button>
    </div>
    {loading ? <p role="status" className="mt-4 text-sm text-slate-500">Đang tải hoạt động chăm sóc…</p> : error ? <div role="alert" className="mt-4 space-y-2 text-sm text-red-700 dark:text-red-300"><p>{error}</p><button type="button" onClick={onRetry} className="inline-flex items-center gap-1 rounded border border-current px-3 py-1.5 font-bold"><RefreshCw size={14} />Thử lại</button></div> : <>
      <div className="mt-4 flex flex-wrap gap-3 text-xs font-semibold text-slate-700 dark:text-slate-200"><span className="inline-flex items-center gap-1.5"><Droplets size={15} className="text-sky-600" />Tưới nước: {week.watering}</span><span className="inline-flex items-center gap-1.5"><Sprout size={15} className="text-emerald-600" />Bón phân: {week.fertilizing}</span></div>
      {week.items.length === 0 ? <p className="mt-4 rounded-xl bg-slate-50 p-3 text-sm text-slate-600 dark:bg-slate-800 dark:text-slate-300">Chưa có nhật ký tưới nước hoặc bón phân được ghi nhận trong tuần này.</p> : <ol className="mt-4 space-y-3 border-l border-slate-200 pl-4 dark:border-slate-700">{week.items.slice(0, 5).map(({ log, kind, time }, index) => <li key={`${log.LogId ?? index}-${kind}`} className="relative min-w-0"><span aria-hidden="true" className={`absolute -left-[21px] top-1.5 h-2 w-2 rounded-full ${kind === 'WATERING' ? 'bg-sky-500' : 'bg-emerald-500'}`} /><p className="break-words text-sm font-bold text-slate-800 dark:text-slate-100">{log.Title || (kind === 'WATERING' ? 'Tưới nước' : 'Bón phân')}</p><time dateTime={new Date(time).toISOString()} className="text-xs text-slate-500 dark:text-slate-400">{new Intl.DateTimeFormat('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', day: '2-digit', month: '2-digit' }).format(time)}</time></li>)}</ol>}
    </>}
  </section>;
}
