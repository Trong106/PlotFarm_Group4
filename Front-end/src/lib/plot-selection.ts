export type PlotStatusFilter = 'ALL' | 'AVAILABLE' | 'RENTED' | 'RESERVED' | 'MAINTENANCE' | 'FALLOWING';
export type SizeFilter = 'ALL' | 'SMALL' | 'MEDIUM' | 'LARGE';

export const SIZE_FILTER_LABELS: Record<SizeFilter, string> = {
  ALL: 'Tất cả',
  SMALL: 'Nhỏ < 30m²',
  MEDIUM: 'Vừa 30–60m²',
  LARGE: 'Lớn > 60m²',
};

/** Returns true when the plot's area matches the given size bucket. */
export function matchesSizeFilter(sizeM2: number, filter: SizeFilter): boolean {
  if (filter === 'ALL') return true;
  if (filter === 'SMALL') return sizeM2 < 30;
  if (filter === 'MEDIUM') return sizeM2 >= 30 && sizeM2 <= 60;
  return sizeM2 > 60; // LARGE
}

export interface PlotSelection {
  areaId: number | null;
  plotId: number | null;
  seedId: number | null;
  pkgId: number | null;
  view: 'GRID' | 'LIST';
  status: PlotStatusFilter;
  sizeFilter: SizeFilter;
  minPrice: number | null;
  maxPrice: number | null;
  minPH: number | null;
  maxPH: number | null;
  soil: string;
}

export interface SelectionArea { AreaId: number; SoilType: string }
export interface SelectionPlot { PlotId: number; AreaId: number; BasePricePerMonth: number; Status: string; SoilPH?: number | null; SizeM2?: number | null }

export const SOIL_TYPE_PRESETS = ['Đất đỏ bazan', 'Đất thịt pha cát'];

export function adjacentSeedId(seeds: { SeedId: number }[], currentId: number | null, direction: -1 | 1): number | null {
  if (!seeds.length) return null;
  const index = seeds.findIndex((seed) => seed.SeedId === currentId);
  if (index === -1) return seeds[direction === 1 ? 0 : seeds.length - 1].SeedId;
  return seeds[(index + direction + seeds.length) % seeds.length].SeedId;
}
export interface SelectionData {
  areas: SelectionArea[];
  plots: SelectionPlot[];
  seeds: { SeedId: number }[];
  packages: { PackageId: number }[];
}

export const EMPTY_SELECTION: PlotSelection = {
  areaId: null, plotId: null, seedId: null, pkgId: null,
  view: 'GRID', status: 'ALL', sizeFilter: 'ALL', minPrice: null, maxPrice: null, minPH: null, maxPH: null, soil: '',
};

export const PLOT_STATUS_LABELS: Record<PlotStatusFilter, string> = {
  ALL: 'Tất cả trạng thái', AVAILABLE: 'Sẵn sàng thuê', RENTED: 'Đã thuê',
  RESERVED: 'Đã giữ chỗ', MAINTENANCE: 'Đang bảo trì', FALLOWING: 'Đất nghỉ',
};

export function validatePriceRange(min: string, max: string): { minPrice: number | null; maxPrice: number | null; error: string | null } {
  const read = (value: string) => value.trim() === '' ? null : Number(value);
  const minPrice = read(min);
  const maxPrice = read(max);
  if ([minPrice, maxPrice].some((value) => value !== null && (!Number.isFinite(value) || value < 0))) {
    return { minPrice: null, maxPrice: null, error: 'Giá thuê phải là số không âm hợp lệ.' };
  }
  if (minPrice !== null && maxPrice !== null && minPrice > maxPrice) {
    return { minPrice: null, maxPrice: null, error: 'Giá tối thiểu không được lớn hơn giá tối đa.' };
  }
  return { minPrice, maxPrice, error: null };
}

export function validatePHRange(min: string, max: string): { minPH: number | null; maxPH: number | null; error: string | null } {
  const read = (raw: string) => {
    const value = raw.trim().replace(',', '.');
    return value === '' ? null : /^\d+(?:\.\d+)?$/.test(value) ? Number(value) : NaN;
  };
  const minPH = read(min);
  const maxPH = read(max);
  if ([minPH, maxPH].some((value) => value !== null && (!Number.isFinite(value) || value < 0 || value > 14))) {
    return { minPH: null, maxPH: null, error: 'Độ pH phải là số từ 0 đến 14.' };
  }
  if (minPH !== null && maxPH !== null && minPH > maxPH) {
    return { minPH: null, maxPH: null, error: 'pH tối thiểu không được lớn hơn pH tối đa.' };
  }
  return { minPH, maxPH, error: null };
}

export function parsePlotQuery(params: URLSearchParams): PlotSelection {
  const id = (key: string) => {
    const raw = params.get(key);
    const value = raw && /^\d+$/.test(raw) ? Number(raw) : NaN;
    return Number.isSafeInteger(value) && value > 0 ? value : null;
  };
  const status = params.get('status')?.toUpperCase() || 'ALL';
  const rawSize = params.get('sizeFilter')?.toUpperCase() as SizeFilter | null;
  const sizeFilter: SizeFilter = rawSize && Object.prototype.hasOwnProperty.call(SIZE_FILTER_LABELS, rawSize) ? rawSize : 'ALL';
  const prices = validatePriceRange(params.get('minPrice') || '', params.get('maxPrice') || '');
  const ph = validatePHRange(params.get('minPH') || '', params.get('maxPH') || '');
  return {
    areaId: id('areaId'), plotId: id('plotId'), seedId: id('seedId'), pkgId: id('pkgId'),
    view: params.get('view')?.toUpperCase() === 'LIST' ? 'LIST' : 'GRID',
    status: Object.prototype.hasOwnProperty.call(PLOT_STATUS_LABELS, status) ? status as PlotStatusFilter : 'ALL',
    sizeFilter,
    minPrice: prices.minPrice, maxPrice: prices.maxPrice, soil: params.get('soil')?.trim() || '',
    minPH: ph.minPH, maxPH: ph.maxPH,
  };
}

export function filterPlots<T extends SelectionPlot>(plots: T[], areas: SelectionArea[], selection: PlotSelection): T[] {
  return plots.filter((plot) => plot.AreaId === selection.areaId
    && (selection.status === 'ALL' || plot.Status === selection.status)
    && (selection.sizeFilter === 'ALL' || (plot.SizeM2 != null && matchesSizeFilter(Number(plot.SizeM2), selection.sizeFilter)))
    && (selection.minPrice === null || Number(plot.BasePricePerMonth) >= selection.minPrice)
    && (selection.maxPrice === null || Number(plot.BasePricePerMonth) <= selection.maxPrice)
    && ((selection.minPH == null && selection.maxPH == null) || (
      plot.SoilPH != null && Number.isFinite(Number(plot.SoilPH))
      && Number(plot.SoilPH) >= 0 && Number(plot.SoilPH) <= 14
      && (selection.minPH == null || Number(plot.SoilPH) >= selection.minPH)
      && (selection.maxPH == null || Number(plot.SoilPH) <= selection.maxPH)
    ))
    && (!selection.soil || areas.some((area) => area.AreaId === plot.AreaId && area.SoilType?.trim() === selection.soil)));
}

/** Reconcile all selections together. A valid shared plot ID establishes its actual area. */
export function normalizePlotSelection(input: PlotSelection, data: SelectionData): PlotSelection {
  const next = { ...input };
  const validPlot = data.plots.find((plot) => plot.PlotId === next.plotId && data.areas.some((area) => area.AreaId === plot.AreaId));
  next.soil = SOIL_TYPE_PRESETS.includes(next.soil) || data.areas.some((area) => area.SoilType?.trim() === next.soil) ? next.soil : '';
  next.areaId = validPlot?.AreaId ?? data.areas.find((area) => area.AreaId === next.areaId)?.AreaId
    ?? data.areas.find((area) => !next.soil || area.SoilType?.trim() === next.soil)?.AreaId ?? null;
  const visible = filterPlots(data.plots, data.areas, next);
  next.plotId = visible.find((plot) => plot.PlotId === next.plotId)?.PlotId
    ?? visible.find((plot) => plot.Status === 'AVAILABLE')?.PlotId ?? visible[0]?.PlotId ?? null;
  next.seedId = data.seeds.find((seed) => seed.SeedId === next.seedId)?.SeedId ?? data.seeds[0]?.SeedId ?? null;
  next.pkgId = data.packages.find((pkg) => pkg.PackageId === next.pkgId)?.PackageId ?? data.packages[0]?.PackageId ?? null;
  return next;
}

/** Preserve unrelated parameters and hash while updating only the public selection keys. */
export function writePlotQuery(url: URL, selection: PlotSelection): URL {
  const next = new URL(url.href);
  const values: Record<string, string | number | null> = {
    areaId: selection.areaId, plotId: selection.plotId, seedId: selection.seedId, pkgId: selection.pkgId,
    view: selection.view.toLowerCase(), status: selection.status === 'ALL' ? null : selection.status,
    sizeFilter: selection.sizeFilter === 'ALL' ? null : selection.sizeFilter,
    minPrice: selection.minPrice, maxPrice: selection.maxPrice, soil: selection.soil || null,
    minPH: selection.minPH, maxPH: selection.maxPH,
  };
  for (const [key, value] of Object.entries(values)) {
    if (value === null) next.searchParams.delete(key);
    else next.searchParams.set(key, String(value));
  }
  return next;
}
