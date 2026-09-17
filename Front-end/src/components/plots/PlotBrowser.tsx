'use client';

import { useEffect, useId, useState } from 'react';
import { getPlotStatus } from '@/lib/plot-status';
import { PlotStatusBadge, PlotStatusLegend, plotStatusStyles } from './PlotStatus';
import { Check, CheckCircle2, Filter, LayoutGrid, ListFilter, MapPin, RotateCcw, Video } from 'lucide-react';
import { filterPlots, PLOT_STATUS_LABELS, PlotSelection, PlotStatusFilter, SelectionArea, SelectionPlot, validatePriceRange } from '@/lib/plot-selection';

interface BrowserPlot extends SelectionPlot {
  PlotCode: string;
  SizeM2: number;
  SoilPH: number;
  StandardHumidity: number;
  CameraCode?: string;
  HasActiveCultivation?: boolean | number;
}
interface BrowserArea extends SelectionArea { AreaName: string }

const fieldClass = 'min-w-0 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100';
const money = (amount: number) => new Intl.NumberFormat('vi-VN').format(amount) + ' đ';

export function PlotBrowser({ plots, areas, selection, onChange, comparedIds, onCompare, onOpenCompare }: {
  plots: BrowserPlot[];
  areas: BrowserArea[];
  selection: PlotSelection;
  onChange: (change: Partial<PlotSelection>) => void;
  comparedIds: number[];
  onCompare: (id: number, event: React.MouseEvent) => void;
  onOpenCompare: () => void;
}) {
  const [minDraft, setMinDraft] = useState('');
  const [maxDraft, setMaxDraft] = useState('');
  const [priceError, setPriceError] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filterId = useId();
  const appliedFilters = [
    selection.minPrice !== null || selection.maxPrice !== null ? `Giá: ${selection.minPrice === null ? '0 đ' : money(selection.minPrice)} – ${selection.maxPrice === null ? 'không giới hạn' : money(selection.maxPrice)}` : null,
    selection.soil || null,
    selection.status !== 'ALL' ? PLOT_STATUS_LABELS[selection.status] : null,
  ].filter(Boolean);
  useEffect(() => {
    setMinDraft(selection.minPrice === null ? '' : String(selection.minPrice));
    setMaxDraft(selection.maxPrice === null ? '' : String(selection.maxPrice));
    setPriceError(null);
  }, [selection.minPrice, selection.maxPrice]);
  const visible = filterPlots(plots, areas, selection);
  const currentArea = areas.find((area) => area.AreaId === selection.areaId);
  const areaPlots = plots.filter((plot) => plot.AreaId === selection.areaId);
  const soils = Array.from(new Set(areas.map((area) => area.SoilType?.trim()).filter(Boolean)));
  const reset = () => {
    setMinDraft(''); setMaxDraft(''); setPriceError(null);
    onChange({ status: 'ALL', minPrice: null, maxPrice: null, soil: '' });
  };

  return (
    <section aria-label="Chọn ô đất" className="min-w-0 space-y-4 rounded-3xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5 lg:col-span-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="min-w-0 break-words text-sm font-extrabold text-slate-900 dark:text-white">{currentArea?.AreaName || 'Danh sách ô đất'}</h2>
        <div role="group" aria-label="Chế độ hiển thị ô đất" className="flex gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
          {(['GRID', 'LIST'] as const).map((view) => <button key={view} type="button" aria-pressed={selection.view === view} onClick={() => onChange({ view })}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 ${selection.view === view ? 'bg-white text-emerald-800 shadow-sm dark:bg-slate-700 dark:text-emerald-200' : 'text-slate-600 dark:text-slate-300'}`}>
            {view === 'GRID' ? <LayoutGrid aria-hidden="true" className="h-4 w-4" /> : <ListFilter aria-hidden="true" className="h-4 w-4" />}
            {view === 'GRID' ? 'Lưới' : 'Danh sách'}
          </button>)}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/50">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-200"><Filter aria-hidden="true" className="h-4 w-4 text-emerald-600" /> Lọc ô đất {appliedFilters.length > 0 && `(${appliedFilters.length})`}</h3>
          <button type="button" aria-expanded={filtersOpen} aria-controls={filterId} onClick={() => setFiltersOpen((open) => !open)} className="rounded-lg px-3 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 dark:text-emerald-300 dark:hover:bg-slate-700">{filtersOpen ? 'Ẩn bộ lọc' : 'Hiện bộ lọc'}</button>
        </div>
        {appliedFilters.length > 0 && <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-700 dark:text-slate-200"><p className="min-w-0 flex-1 break-words">Đang áp dụng: {appliedFilters.join(' · ')}</p><button type="button" onClick={reset} className="rounded-lg px-2 py-2 font-semibold underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600">Xóa bộ lọc</button></div>}
      <div id={filterId} hidden={!filtersOpen}>
      <form onSubmit={(event) => {
        event.preventDefault();
        const result = validatePriceRange(minDraft, maxDraft);
        setPriceError(result.error);
        if (!result.error) onChange({ minPrice: result.minPrice, maxPrice: result.maxPrice });
      }} className="mt-3 space-y-3">
        <div className="grid min-w-0 gap-3 sm:grid-cols-2">
          <label className="min-w-0 space-y-1 text-xs font-semibold text-slate-700 dark:text-slate-200"><span>Giá tối thiểu (đ/tháng)</span>
            <input type="text" inputMode="decimal" value={minDraft} onChange={(e) => setMinDraft(e.target.value)} placeholder="Không giới hạn" aria-invalid={!!priceError} aria-describedby={priceError ? 'plot-price-error' : undefined} className={fieldClass} />
          </label>
          <label className="min-w-0 space-y-1 text-xs font-semibold text-slate-700 dark:text-slate-200"><span>Giá tối đa (đ/tháng)</span>
            <input type="text" inputMode="decimal" value={maxDraft} onChange={(e) => setMaxDraft(e.target.value)} placeholder="Không giới hạn" aria-invalid={!!priceError} aria-describedby={priceError ? 'plot-price-error' : undefined} className={fieldClass} />
          </label>
          <label className="min-w-0 space-y-1 text-xs font-semibold text-slate-700 dark:text-slate-200"><span>Loại đất</span>
            <select value={selection.soil} className={fieldClass} onChange={(event) => {
              const soil = event.target.value;
              const matchingArea = areas.find((area) => area.SoilType?.trim() === soil);
              onChange({ soil, ...(soil && currentArea?.SoilType?.trim() !== soil ? { areaId: matchingArea?.AreaId ?? null, plotId: null } : {}) });
            }}>
              <option value="">Tất cả loại đất</option>
              {soils.map((soil) => <option key={soil} value={soil}>{soil}</option>)}
            </select>
          </label>
          <label className="min-w-0 space-y-1 text-xs font-semibold text-slate-700 dark:text-slate-200"><span>Trạng thái</span>
            <select value={selection.status} onChange={(e) => onChange({ status: e.target.value as PlotStatusFilter })} className={fieldClass}>
              {Object.entries(PLOT_STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
        </div>
        {priceError && <p id="plot-price-error" role="alert" className="text-xs text-red-700 dark:text-red-300">{priceError} Kết quả vẫn sử dụng khoảng giá đã áp dụng trước đó.</p>}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <button type="submit" className="rounded-lg bg-emerald-700 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2">Áp dụng khoảng giá</button>
          <button type="button" onClick={reset} className="flex items-center gap-1 rounded-lg px-2 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 dark:text-slate-300 dark:hover:bg-slate-700"><RotateCcw aria-hidden="true" className="h-3.5 w-3.5" /> Xóa bộ lọc</button>
        </div>
        <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-400">Bộ lọc áp dụng trong phân khu đang xem. Chọn loại đất sẽ chuyển đến phân khu phù hợp.</p>
      </form>
      </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <p role="status" aria-live="polite" className="font-semibold text-slate-600 dark:text-slate-300">{visible.length}/{areaPlots.length} ô đất phù hợp</p>
        {comparedIds.length > 0 && <button type="button" onClick={onOpenCompare} className="rounded-lg border border-emerald-300 px-3 py-2 font-bold text-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 dark:text-emerald-300">Đối chiếu ({comparedIds.length}/3)</button>}
      </div>

      <PlotStatusLegend />

      <div className="min-h-[420px]">
        {visible.length === 0 ? <div className="flex min-h-[420px] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-300 p-5 text-center dark:border-slate-700">
          <MapPin aria-hidden="true" className="h-8 w-8 text-slate-400" />
          <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{plots.length === 0 ? 'Nông trại chưa có ô đất.' : areaPlots.length === 0 ? 'Phân khu này chưa có ô đất.' : 'Không có ô đất phù hợp với bộ lọc.'}</p>
          {areaPlots.length > 0 && <button type="button" onClick={reset} className="rounded-lg px-3 py-2 text-sm font-bold text-emerald-700 underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 dark:text-emerald-300">Xóa bộ lọc để xem ô đất</button>}
        </div> : selection.view === 'GRID' ? (
          <ul className="grid grid-cols-2 gap-2 min-[420px]:grid-cols-3 sm:grid-cols-4 xl:grid-cols-5">
            {visible.map((plot) => {
              const selected = selection.plotId === plot.PlotId;
              const status = getPlotStatus(plot);
              return <li key={plot.PlotId} className={`min-w-0 rounded-2xl border ${plotStatusStyles[status.tone]} ${selected ? 'ring-2 ring-blue-600 ring-offset-2 dark:ring-blue-400 dark:ring-offset-slate-900' : ''}`}>
                <button type="button" aria-pressed={selected} aria-label={`Xem ô đất ${plot.PlotCode}: ${status.label}${selected ? ', đang chọn' : ''}`} onClick={() => onChange({ plotId: plot.PlotId })}
                  className="flex w-full min-w-0 flex-col items-start gap-2 rounded-t-2xl p-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600">
                  <span className="flex w-full items-start justify-between gap-1"><MapPin aria-hidden="true" className="h-4 w-4 shrink-0" />{selected && <CheckCircle2 aria-hidden="true" className="h-4 w-4 shrink-0 text-blue-700 dark:text-blue-300" />}</span>
                  <strong className="w-full break-words text-xs text-slate-900 dark:text-white">{plot.PlotCode}</strong>
                  <span className="text-[11px] text-slate-600 dark:text-slate-300">{plot.SizeM2} m² · pH {plot.SoilPH}</span>
                  <span className="break-words text-[11px] font-bold text-emerald-700 dark:text-emerald-300">{money(plot.BasePricePerMonth)}/th</span>
                  <span className="min-h-8 text-[11px] font-semibold">{status.label}</span>
                </button>
                <button type="button" aria-pressed={comparedIds.includes(plot.PlotId)} aria-label={`Đối chiếu ô ${plot.PlotCode}`} onClick={(event) => onCompare(plot.PlotId, event)} className="flex w-full items-center gap-1 rounded-b-2xl border-t border-slate-200 px-3 py-2 text-[10px] font-semibold text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 dark:border-slate-700 dark:text-slate-300">
                  <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded border border-slate-400">{comparedIds.includes(plot.PlotId) && <Check aria-hidden="true" className="h-3 w-3 text-emerald-600" />}</span> Đối chiếu
                </button>
              </li>;
            })}
          </ul>
        ) : <>
          <p className="mb-2 text-[11px] text-slate-600 dark:text-slate-400">Vuốt hoặc cuộn ngang để xem đầy đủ thông số và chọn ô đất.</p>
          <div role="region" aria-label="Bảng thông số ô đất, có thể cuộn ngang" tabIndex={0} className="max-w-full overflow-x-auto rounded-xl border border-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 dark:border-slate-700">
            <table className="w-full min-w-[850px] text-left text-xs">
              <caption className="sr-only">So sánh diện tích, loại đất, pH, độ ẩm và giá thuê tháng của ô đất trong phân khu</caption>
              <thead className="bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-300"><tr>
                {['Mã ô', 'Diện tích (m²)', 'Loại đất', 'pH đất', 'Độ ẩm (%)', 'Camera', 'Giá thuê (đ/tháng)', 'Trạng thái', 'Thao tác'].map((title) => <th key={title} scope="col" className="p-3 font-bold">{title}</th>)}
              </tr></thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {visible.map((plot) => <tr key={plot.PlotId} className={selection.plotId === plot.PlotId ? 'bg-blue-50 dark:bg-blue-950/40' : ''}>
                  <th scope="row" className="p-3 font-bold text-slate-900 dark:text-white">{plot.PlotCode}{selection.plotId === plot.PlotId && <span className="mt-1 block text-[10px] text-blue-700 dark:text-blue-300">Đang chọn</span>}</th>
                  <td className="p-3">{plot.SizeM2}</td><td className="p-3">{currentArea?.SoilType || 'Chưa cập nhật'}</td><td className="p-3">{plot.SoilPH}</td><td className="p-3">{plot.StandardHumidity}</td>
                  <td className="p-3"><span className="flex items-center gap-1"><Video aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />{plot.CameraCode || 'Chưa cập nhật'}</span></td>
                  <td className="whitespace-nowrap p-3 font-bold text-emerald-700 dark:text-emerald-300">{money(plot.BasePricePerMonth)}</td>
                  <td className="p-3"><PlotStatusBadge plot={plot} /></td>
                  <td className="p-3"><button type="button" aria-pressed={selection.plotId === plot.PlotId} onClick={() => onChange({ plotId: plot.PlotId })} className="whitespace-nowrap rounded-lg border border-emerald-400 px-3 py-2 font-bold text-emerald-700 hover:bg-emerald-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 dark:text-emerald-300 dark:hover:bg-emerald-950">{selection.plotId === plot.PlotId ? 'Đang chọn' : 'Xem ô đất'}</button></td>
                </tr>)}
              </tbody>
            </table>
          </div>
        </>}
      </div>
    </section>
  );
}
