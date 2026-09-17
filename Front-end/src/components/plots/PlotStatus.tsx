import { getPlotStatus, PlotStatusSource, PlotStatusTone } from '@/lib/plot-status';

export const plotStatusStyles: Record<PlotStatusTone, string> = {
  available: 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-700 dark:bg-emerald-950 dark:text-emerald-200',
  rented: 'border-red-300 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200',
  active: 'border-amber-400 bg-amber-50 text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200',
  resting: 'border-dashed border-slate-400 bg-slate-100 text-slate-700 dark:border-slate-500 dark:bg-slate-800 dark:text-slate-200',
  unknown: 'border-slate-300 bg-white text-slate-700 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200',
};

export function PlotStatusBadge({ plot }: { plot: PlotStatusSource }) {
  const status = getPlotStatus(plot);
  return <span className={`inline-flex rounded-md border px-2 py-1 text-[11px] font-semibold leading-snug ${plotStatusStyles[status.tone]}`}>{status.label}</span>;
}

const legend: { tone: PlotStatusTone; label: string }[] = [
  { tone: 'available', label: 'Sẵn sàng thuê' },
  { tone: 'rented', label: 'Đã thuê' },
  { tone: 'active', label: 'Đang giữ chỗ / canh tác' },
  { tone: 'resting', label: 'Đất nghỉ / bảo trì' },
];

export function PlotStatusLegend() {
  return <div className="space-y-2 border-y border-slate-200 py-3 dark:border-slate-700">
    <h3 className="text-xs font-bold text-slate-700 dark:text-slate-200">Chú giải trạng thái ô đất</h3>
    <ul className="flex flex-wrap gap-x-4 gap-y-2">
      {legend.map(({ tone, label }) => <li key={tone} className="flex min-w-0 items-center gap-2 text-[11px] font-medium text-slate-700 dark:text-slate-200">
        <span aria-hidden="true" className={`h-4 w-4 shrink-0 rounded border-2 ${plotStatusStyles[tone]}`} />{label}
      </li>)}
    </ul>
    <p className="text-[11px] text-slate-600 dark:text-slate-400">Dấu hiệu màu xanh dương: ô đang chọn để xem chi tiết.</p>
  </div>;
}
