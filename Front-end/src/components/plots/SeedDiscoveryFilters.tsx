'use client';

import { useId } from 'react';
import { Search } from 'lucide-react';
import type { GrowthFilter } from '@/lib/seed-catalog';

interface Props {
  query: string;
  growth: GrowthFilter;
  category: string;
  count: number;
  total: number;
  onQuery: (value: string) => void;
  onGrowth: (value: GrowthFilter) => void;
  onClear: () => void;
}

export function SeedDiscoveryFilters({ query, growth, category, count, total, onQuery, onGrowth, onClear }: Props) {
  const id = useId();
  return <div className="min-w-0 space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/50">
    <label htmlFor={`${id}-search`} className="block text-xs font-bold text-slate-700 dark:text-slate-200">Tìm giống rau củ</label>
    <div className="relative">
      <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-500" />
      <input id={`${id}-search`} type="search" value={query} onChange={(event) => onQuery(event.target.value)} placeholder="Tên giống, ví dụ: cải xanh" className="w-full min-w-0 rounded-lg border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/30 dark:border-slate-600 dark:bg-slate-900 dark:text-white" />
    </div>
    <label htmlFor={`${id}-growth`} className="block text-xs font-bold text-slate-700 dark:text-slate-200">Thời gian sinh trưởng</label>
    <select id={`${id}-growth`} value={growth} onChange={(event) => onGrowth(event.target.value as GrowthFilter)} className="w-full min-w-0 rounded-lg border border-slate-300 bg-white px-2 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-600 dark:bg-slate-900 dark:text-white">
      <option value="ALL">Tất cả thời gian</option>
      <option value="SHORT">Ngắn ngày · dưới 30 ngày</option>
      <option value="MEDIUM">Trung bình · 30–60 ngày</option>
      <option value="LONG">Dài ngày · trên 60 ngày</option>
    </select>
    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
      <p role="status" className="text-slate-600 dark:text-slate-300">{count}/{total} giống{category !== 'ALL' ? ` · ${category}` : ''}</p>
      {(query || growth !== 'ALL' || category !== 'ALL') && <button type="button" onClick={onClear} className="rounded px-1 py-1 font-bold text-emerald-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:text-emerald-300">Xóa bộ lọc giống</button>}
    </div>
    {count === 0 && <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">Không có giống phù hợp. Thử tên khác hoặc mở rộng thời gian sinh trưởng.</p>}
  </div>;
}
