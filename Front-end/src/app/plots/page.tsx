'use client';

import React, { useEffect, useState, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  MapPin,
  Sprout,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Filter,
  Clock,
  Loader2,
  Video,
  Scale,
  Users,
  ChevronRight,
  ChevronLeft,
  X
} from 'lucide-react';
import Header from '@/components/Header';
import { PackageSelector } from '@/components/care-packages/PackageSelector';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import api from '@/lib/axios';
import { PLOT_STATUS_LABELS, PlotStatusFilter } from '@/lib/plot-selection';
import { usePlotSelection } from '@/components/plots/usePlotSelection';
import { PlotBrowser } from '@/components/plots/PlotBrowser';
import { ShareSelection } from '@/components/plots/ShareSelection';

interface FarmArea {
  AreaId: number;
  FarmId: number;
  AreaCode: string;
  AreaName: string;
  SoilType: string;
  TotalPlots: number;
  Description: string;
}

interface Plot {
  PlotId: number;
  PlotCode: string;
  AreaId: number;
  AreaName?: string;
  RowNum: number;
  ColNum: number;
  SizeM2: number;
  SoilPH: number;
  StandardHumidity: number;
  BasePricePerMonth: number;
  Status: 'AVAILABLE' | 'RENTED' | 'RESERVED' | 'MAINTENANCE' | 'FALLOWING';
  CameraId?: number;
  CameraCode?: string;
  CameraName?: string;
  CameraStatus?: string;
}

interface Seed {
  SeedId: number;
  SeedName: string;
  Category: string;
  GrowthDurationDays: number;
  MinRentalDays: number;
  ExpectedYieldKgPerM2: number;
  SuitableSoilType: string;
  Season: string;
  SeedPrice: number;
  ImageUrl: string;
  Description: string;
  IsAvailable: boolean;
}

interface CarePackage {
  PackageId: number;
  PackageName: string;
  MonthlyFee: number;
  Description: string;
  ServicesIncluded: string;
  IsActive: boolean;
}

export default function PlotsPage() {
  const router = useRouter();
  const seedScrollRef = useRef<HTMLDivElement>(null);

  // Data states
  const [areas, setAreas] = useState<FarmArea[]>([]);
  const [plots, setPlots] = useState<Plot[]>([]);
  const [seeds, setSeeds] = useState<Seed[]>([]);
  const [carePackages, setCarePackages] = useState<CarePackage[]>([]);
  const [packageError, setPackageError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Compare & Modal states
  const [comparedPlotIds, setComparedPlotIds] = useState<number[]>([]);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [isAllSeedsModalOpen, setIsAllSeedsModalOpen] = useState(false);
  const [seedModalCategory, setSeedModalCategory] = useState<string>('ALL');

  const selectionData = useMemo(() => ({ areas, plots, seeds, packages: carePackages }), [areas, plots, seeds, carePackages]);
  const { selection, updateSelection, hydrated } = usePlotSelection(selectionData, !isLoading && !error);
  const selectedAreaId = selection.areaId;
  const selectedPlot = plots.find((plot) => plot.PlotId === selection.plotId) || null;
  const selectedSeed = seeds.find((seed) => seed.SeedId === selection.seedId) || null;
  const selectedPackage = carePackages.find((pkg) => pkg.PackageId === selection.pkgId) || null;
  const setSelectedSeed = (seed: Seed) => updateSelection({ seedId: seed.SeedId });
  const setSelectedPackage = (pkg: CarePackage) => updateSelection({ pkgId: pkg.PackageId });
  const setSelectedPlot = (plot: Plot) => updateSelection({ plotId: plot.PlotId, status: 'ALL', minPrice: null, maxPrice: null, soil: '' });
  const currentAreaInfo = areas.find((area) => area.AreaId === selectedAreaId);

  // Fetch initial data
  useEffect(() => {
    const controller = new AbortController();
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const read = (path: string) => api.get(path, { signal: controller.signal }).then((response) => response.data);
        const [areasRes, plotsRes, seedsRes, pkgsRes] = await Promise.all([
          read('/plots/areas'), read('/plots/grid'), read('/seeds'),
          read('/seeds/packages').catch(() => ({ success: false })),
        ]);
        if (controller.signal.aborted) return;
        if (![areasRes, plotsRes, seedsRes].every((result) => result.success && Array.isArray(result.data))) {
          throw new Error('Invalid farm response');
        }
        setAreas(areasRes.data);
        setPlots(plotsRes.data);
        setSeeds(seedsRes.data);

        if (pkgsRes.success && Array.isArray(pkgsRes.data)) {
          setCarePackages(pkgsRes.data);
        } else {
          setPackageError('Không thể tải gói dịch vụ. Vui lòng tải lại trang để thử lại.');
        }
      } catch (err: any) {
        if (controller.signal.aborted) return;
        console.error('Error loading plots data:', err);
        setError('Không thể tải dữ liệu nông trại. Vui lòng thử lại sau.');
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    };

    fetchData();
    return () => controller.abort();
  }, []);

  // Seed categories for modal
  const seedCategories = useMemo(() => {
    const cats = new Set<string>();
    seeds.forEach((s) => {
      if (s.Category) cats.add(s.Category);
    });
    return ['ALL', ...Array.from(cats)];
  }, [seeds]);

  // Filtered seeds for modal
  const modalFilteredSeeds = useMemo(() => {
    if (seedModalCategory === 'ALL') return seeds;
    return seeds.filter((s) => s.Category === seedModalCategory);
  }, [seeds, seedModalCategory]);

  // Compare Plot Handlers
  const toggleComparePlot = (plotId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setComparedPlotIds((prev) => {
      if (prev.includes(plotId)) {
        return prev.filter((id) => id !== plotId);
      }
      if (prev.length >= 3) {
        alert('Bạn chỉ có thể đối chiếu tối đa 3 ô đất cùng một lúc');
        return prev;
      }
      return [...prev, plotId];
    });
  };

  const comparedPlots = useMemo(() => {
    return plots.filter((p) => comparedPlotIds.includes(p.PlotId));
  }, [plots, comparedPlotIds]);

  // Yield & Basket Estimations
  const yieldEstimations = useMemo(() => {
    if (!selectedPlot || !selectedSeed) {
      return { totalKg: 0, familyWeeks: 0 };
    }
    const size = selectedPlot.SizeM2;
    const yieldPerM2 = selectedSeed.ExpectedYieldKgPerM2;
    const totalKg = Math.round(size * yieldPerM2);
    const familyWeeks = Math.max(1, Math.round(totalKg / 3.5));
    return { totalKg, familyWeeks };
  }, [selectedPlot, selectedSeed]);

  // Day-based Pricing Calculation
  const pricingSummary = useMemo(() => {
    const growthDays = selectedSeed?.GrowthDurationDays ?? 0;
    const plotPriceMonth = selectedPlot?.BasePricePerMonth ?? 0;
    const pkgPriceMonth = selectedPackage?.MonthlyFee ?? 0;

    const plotFee = Math.round((plotPriceMonth / 30) * growthDays);
    const careFee = Math.round((pkgPriceMonth / 30) * growthDays);
    const seedFee = selectedSeed?.SeedPrice ?? 0;
    const total = plotFee + careFee + seedFee;

    return {
      growthDays,
      plotFee,
      careFee,
      seedFee,
      total,
    };
  }, [selectedPlot, selectedSeed, selectedPackage]);

  // Format Currency
  const formatVND = (amount: number) => {
    return new Intl.NumberFormat('vi-VN').format(amount) + ' đ';
  };

  // Scroll Quick Seed strip
  const scrollSeedStrip = (direction: 'left' | 'right') => {
    if (seedScrollRef.current) {
      const scrollAmount = direction === 'left' ? -240 : 240;
      seedScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Handle Proceed to Checkout
  const handleProceedToCheckout = () => {
    if (selectedPlot?.Status !== 'AVAILABLE') {
      alert('Ô đất này hiện chưa sẵn sàng cho thuê. Vui lòng chọn ô đất khác.');
      return;
    }
    if (!selectedPlot || !selectedSeed || !selectedPackage) {
      alert('Vui lòng chọn đầy đủ Ô đất, Giống cây và Gói chăm sóc!');
      return;
    }
    router.push(
      `/checkout?plotId=${selectedPlot.PlotId}&seedId=${selectedSeed.SeedId}&pkgId=${selectedPackage.PackageId}&cycles=1&days=${pricingSummary.growthDays}`
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col font-sans transition-colors duration-300">
      <Header />

      <main className="min-w-0 max-w-[1520px] w-full mx-auto px-3 sm:px-6 lg:px-8 py-5 space-y-5">
        {/* Top Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex min-w-0 flex-wrap items-center gap-3">
            <Link href="/">
              <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
                Về Trang Chủ
              </Button>
            </Link>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <MapPin className="w-5 h-5 text-emerald-600" /> Bản Đồ Nông Trại & Chọn Cây Trồng
            </h1>
          </div>

          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300">
              <Sparkles className="w-3.5 h-3.5 shrink-0 text-emerald-600" /> {areas.length} phân khu • {plots.length} ô đất
            </span>
          </div>
        </div>

        <ShareSelection disabled={!hydrated || isLoading || !!error} selection={selection} />

        {/* 5 Farm Areas Selector Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {areas.map((area) => {
            const isAreaActive = area.AreaId === selectedAreaId;
            const areaPlots = plots.filter((p) => p.AreaId === area.AreaId);
            const availCount = areaPlots.filter((p) => p.Status === 'AVAILABLE').length;

            return (
              <button
                key={area.AreaId}
                disabled={!hydrated || isLoading || !!error}
                aria-pressed={isAreaActive}
                onClick={() => updateSelection({ areaId: area.AreaId, plotId: null })}
                className={`min-w-0 p-3 rounded-2xl text-left border flex flex-col justify-between gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                  isAreaActive
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-600/20 ring-2 ring-emerald-400'
                    : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border-slate-200 dark:border-slate-800 hover:border-emerald-300 hover:bg-emerald-50/40 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-1 w-full">
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-black tracking-wider ${
                    isAreaActive ? 'bg-white/20 text-white' : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                  }`}>
                    {area.AreaCode}
                  </span>
                  <span className={`text-[11px] font-bold ${isAreaActive ? 'text-emerald-100' : 'text-slate-500'}`}>
                    {availCount}/{areaPlots.length} trống
                  </span>
                </div>

                <div>
                  <h3 className="font-black text-xs sm:text-sm tracking-tight line-clamp-1">{area.AreaName}</h3>
                  <p className={`text-[10px] sm:text-[11px] mt-0.5 line-clamp-1 ${isAreaActive ? 'text-emerald-100' : 'text-slate-500 dark:text-slate-400'}`}>
                    {area.SoilType}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Area Description Banner */}
        {currentAreaInfo && <div className="min-h-[76px] p-3 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-emerald-900 dark:text-emerald-200">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>
              <strong className="font-extrabold">{currentAreaInfo.AreaName}:</strong> {currentAreaInfo.Description} ({currentAreaInfo.SoilType})
            </span>
          </div>
        </div>}

        {/* Loading / Error States */}
        {(isLoading || (!error && !hydrated)) && (
          <div className="py-20 text-center space-y-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <Loader2 className="w-10 h-10 animate-spin text-emerald-500 mx-auto" />
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
              Đang tải dữ liệu phân khu và ô đất canh tác...
            </p>
          </div>
        )}

        {error && (
          <div className="p-6 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-3xl text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
            <h3 className="font-bold text-red-800 dark:text-red-300">Không thể kết nối máy chủ</h3>
            <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
            <Button variant="primary" size="sm" onClick={() => window.location.reload()}>
              Thử Lại
            </Button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MAIN SPLIT-SCREEN LAYOUT: LEFT (PLOTS GRID) + RIGHT (STICKY SIDEBAR) */}
        {/* ========================================================================= */}
        {!isLoading && !error && hydrated && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* --------------------------------------------------------------------- */}
            {/* LEFT COLUMN (7 / 12 COLS): 20 PLOTS MAP & LIST VIEW */}
            {/* --------------------------------------------------------------------- */}
            <PlotBrowser
              plots={plots}
              areas={areas}
              selection={selection}
              onChange={updateSelection}
              comparedIds={comparedPlotIds}
              onCompare={toggleComparePlot}
              onOpenCompare={() => setIsCompareModalOpen(true)}
            />

            {/* --------------------------------------------------------------------- */}
            {/* RIGHT COLUMN (5 / 12 COLS): COMPACT CULTIVATION STUDIO SIDEBAR */}
            {/* --------------------------------------------------------------------- */}
            <div className="min-w-0 lg:col-span-5 xl:col-span-5 space-y-4 lg:sticky lg:top-6">
              {selectedPlot && (
                <div className="min-w-0 bg-white dark:bg-slate-900 rounded-3xl border-2 border-emerald-500/80 shadow-xl p-3 sm:p-5 space-y-5">
                  {/* 1. TOP CARD: REAL FARM PLOT PHOTO & INFO */}
                  <div className="relative rounded-2xl overflow-hidden shadow-md group">
                    <img
                      src="/assets/farm/garden-rows.jpg"
                      alt="Luống đất thực tế"
                      className="w-full h-44 sm:h-36 object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-black/20" />

                    {/* Top tags */}
                    <div className="absolute top-2.5 left-3 right-3 flex flex-wrap items-start justify-between gap-1.5 text-xs">
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-700/90 text-white font-bold backdrop-blur-sm text-[11px]">
                        {currentAreaInfo?.AreaName || 'Phân khu chưa cập nhật'}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-white/20 text-white font-bold backdrop-blur-sm text-[10px]">
                        {PLOT_STATUS_LABELS[selectedPlot.Status as PlotStatusFilter] || selectedPlot.Status}
                      </span>
                    </div>

                    {/* Plot details overlay */}
                    <div className="absolute bottom-2.5 left-3 right-3 flex flex-wrap items-end justify-between gap-2 text-white">
                      <div className="min-w-0">
                        <span className="text-[10px] text-emerald-300 uppercase tracking-wider font-bold block">
                          Ô Đất Đang Chọn
                        </span>
                        <h3 className="break-words text-xl sm:text-2xl font-black tracking-tight">{selectedPlot.PlotCode}</h3>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-300 block">Diện tích đất sạch:</span>
                        <span className="text-xl font-black text-emerald-400">{selectedPlot.SizeM2} m²</span>
                      </div>
                    </div>
                  </div>

                  {/* 4 Mini Specs */}
                  <div className="grid grid-cols-2 min-[440px]:grid-cols-4 gap-2 text-center text-xs">
                    <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700">
                      <span className="text-[10px] text-slate-400 block">Độ pH</span>
                      <strong className="font-extrabold text-slate-800 dark:text-slate-100">{selectedPlot.SoilPH}</strong>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700">
                      <span className="text-[10px] text-slate-400 block">Độ ẩm</span>
                      <strong className="font-extrabold text-slate-800 dark:text-slate-100">{selectedPlot.StandardHumidity}%</strong>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700">
                      <span className="text-[10px] text-slate-400 block">Camera</span>
                      <strong className="font-bold text-emerald-600 text-[11px] truncate block">
                        {selectedPlot.CameraCode || 'Chưa cập nhật'}
                      </strong>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700">
                      <span className="text-[10px] text-slate-400 block">Giá tháng</span>
                      <strong className="font-extrabold text-slate-800 dark:text-slate-100">{selectedPlot.BasePricePerMonth / 1000}k</strong>
                    </div>
                  </div>

                  {/* 2. GIỐNG CÂY TRỒNG (PHÓNG TO, NỔI BẬT, HÌNH ẢNH SỐNG ĐỘNG) */}
                  <div className="space-y-3 pt-1 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                        <Sprout className="w-4 h-4 text-emerald-600" /> Giống Cây Trồng
                      </h4>
                      <button
                        onClick={() => setIsAllSeedsModalOpen(true)}
                        className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-0.5"
                      >
                        Xem {seeds.length} giống <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* HERO PLANT CARD (PHÓNG TO RÕ RÀNG VỚI ẢNH THẬT NÔNG SẢN) */}
                    {selectedSeed && (
                      <div className="min-w-0 p-3 rounded-2xl bg-gradient-to-br from-emerald-50/90 to-teal-50/50 dark:from-emerald-950/40 dark:to-slate-900 border-2 border-emerald-400/80 dark:border-emerald-700 shadow-sm flex flex-col min-[440px]:flex-row items-start gap-3">
                        {/* Big Plant Image */}
                        <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden shrink-0 shadow-md border-2 border-emerald-500/50">
                          <img
                            src={selectedSeed.ImageUrl}
                            alt={selectedSeed.SeedName}
                            className="w-full h-full object-cover"
                          />
                          <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/60 text-white font-mono text-[9px] font-bold">
                            F1
                          </span>
                        </div>

                        {/* Plant details */}
                        <div className="w-full space-y-1.5 flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-black bg-emerald-600 text-white shadow-sm flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {selectedSeed.GrowthDurationDays} ngày/vụ
                            </span>
                            <span className="text-[11px] font-bold text-slate-500">
                              {selectedSeed.Category}
                            </span>
                          </div>

                          <h5 className="break-words font-black text-sm sm:text-base text-slate-900 dark:text-white leading-tight">
                            {selectedSeed.SeedName}
                          </h5>

                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600 dark:text-slate-300">
                            <span>
                              Năng suất: <strong className="text-slate-900 dark:text-white">~{selectedSeed.ExpectedYieldKgPerM2} kg/m²</strong>
                            </span>
                            <span>
                              Hạt giống: <strong className="text-emerald-600 font-bold">{formatVND(selectedSeed.SeedPrice)}</strong>
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Quick Horizontal Seed Selector with Navigation */}
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-bold text-slate-500">
                        <span>CHỌN NHANH GIỐNG CÂY TRỒNG:</span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => scrollSeedStrip('left')}
                            className="p-1 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600"
                          >
                            <ChevronLeft className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => scrollSeedStrip('right')}
                            className="p-1 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600"
                          >
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div
                        ref={seedScrollRef}
                        className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-none scroll-smooth"
                      >
                        {seeds.map((s) => {
                          const isSeedActive = selectedSeed?.SeedId === s.SeedId;
                          return (
                            <button
                              key={s.SeedId}
                              onClick={() => setSelectedSeed(s)}
                              className={`p-1.5 pr-3 rounded-xl border flex items-center gap-2 shrink-0 transition-all text-left ${
                                isSeedActive
                                  ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 ring-2 ring-emerald-400 shadow-sm'
                                  : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-emerald-300'
                              }`}
                            >
                              <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-slate-200">
                                <img src={s.ImageUrl} alt={s.SeedName} className="w-full h-full object-cover" />
                              </div>
                              <div className="w-24 truncate">
                                <span className="text-xs font-black text-slate-800 dark:text-slate-100 block truncate">
                                  {s.SeedName}
                                </span>
                                <span className="text-[10px] text-emerald-600 font-bold block">
                                  {s.GrowthDurationDays} ngày
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* 3. GÓI DỊCH VỤ CHĂM SÓC */}
                  <PackageSelector
                    packages={carePackages}
                    selectedPackage={selectedPackage}
                    onSelect={setSelectedPackage}
                    error={packageError}
                  />

                  {/* 4. DỰ TOÁN NÔNG NGHIỆP THÔNG MINH */}
                  <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white space-y-2 shadow-md">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-black flex items-center gap-1.5">
                        <Scale className="w-4 h-4 text-emerald-200" /> Dự Toán Nông Nghiệp Thông Minh
                      </span>
                      <span className="text-sm font-black text-emerald-100">
                        ~{yieldEstimations.totalKg} kg rau sạch
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-emerald-100 pt-1 border-t border-white/20">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" /> Đủ ăn trong ~{yieldEstimations.familyWeeks} tuần
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Vụ: {pricingSummary.growthDays} ngày thu hoạch
                      </span>
                    </div>
                  </div>

                  {/* 5. PRICING & CTA BUTTON */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
                    {(!selectedSeed || !selectedPackage) && <p className="text-xs text-amber-800 dark:text-amber-200">Chưa đủ thông tin giống cây và gói chăm sóc để tính tổng chi phí đầy đủ.</p>}
                    <div className="flex flex-col min-[440px]:flex-row min-[440px]:items-baseline justify-between gap-1">
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                        Tổng chi phí ({pricingSummary.growthDays} ngày / 1 vụ):
                      </span>
                      <span className="break-words text-2xl font-black text-emerald-600 dark:text-emerald-400">
                        {formatVND(pricingSummary.total)}
                      </span>
                    </div>

                    <div className="text-[10px] text-slate-400 text-right">
                      Đất: {formatVND(pricingSummary.plotFee)} • Chăm sóc: {formatVND(pricingSummary.careFee)} • Giống: {formatVND(pricingSummary.seedFee)}
                    </div>

                    <Button
                      variant="primary"
                      size="lg"
                      className="w-full !h-auto !whitespace-normal justify-center shadow-xl shadow-emerald-500/25 !px-3 py-3.5 font-black text-sm"
                      rightIcon={<ArrowRight className="w-4 h-4" />}
                      onClick={handleProceedToCheckout}
                      disabled={selectedPlot.Status !== 'AVAILABLE' || !selectedSeed || !selectedPackage}
                    >
                      Tiếp Tục Đặt Thuê ({pricingSummary.growthDays} ngày)
                    </Button>
                    {selectedPlot.Status !== 'AVAILABLE' && <p role="status" className="text-xs leading-relaxed text-amber-800 dark:text-amber-200">Ô đất này hiện {PLOT_STATUS_LABELS[selectedPlot.Status as PlotStatusFilter]?.toLowerCase() || selectedPlot.Status}. Vui lòng chọn ô sẵn sàng thuê để tiếp tục.</p>}
                  </div>
                </div>
              )}
              {!selectedPlot && <div className="min-h-[280px] rounded-3xl border border-dashed border-slate-300 bg-white p-5 dark:border-slate-700 dark:bg-slate-900"><h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">Chưa chọn ô đất</h2><p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-400">Chọn phân khu hoặc điều chỉnh bộ lọc để tìm ô đất phù hợp. Thông tin thuê sẽ hiển thị tại đây.</p></div>}
            </div>
          </div>
        )}
      </main>

      {/* ========================================================================= */}
      {/* 12 SEEDS CATALOG MODAL (XEM TẤT CẢ 12 GIỐNG CÂY TRỒNG VỚI ẢNH LỚN) */}
      {/* ========================================================================= */}
      {isAllSeedsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-5xl w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <Sprout className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">Bộ Sưu Tập {seeds.length} Giống Cây Trồng Chuẩn Hữu Cơ</h3>
                  <p className="text-xs text-slate-500">Xem ảnh thật, thông số năng suất và chọn giống cây ưng ý nhất cho ô đất của bạn</p>
                </div>
              </div>
              <button
                onClick={() => setIsAllSeedsModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {seedCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSeedModalCategory(cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                    seedModalCategory === cat
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat === 'ALL' ? `Tất cả ${seeds.length} giống` : cat}
                </button>
              ))}
            </div>

            {/* Seeds Grid (3 columns with big photos) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {modalFilteredSeeds.map((seed) => {
                const isSelected = selectedSeed?.SeedId === seed.SeedId;
                return (
                  <div
                    key={seed.SeedId}
                    onClick={() => {
                      setSelectedSeed(seed);
                      setIsAllSeedsModalOpen(false);
                    }}
                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20 ring-2 ring-emerald-400 shadow-md'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-emerald-300 hover:shadow'
                    }`}
                  >
                    {/* Big photo */}
                    <div className="relative w-full h-36 rounded-xl overflow-hidden shadow-sm">
                      <img src={seed.ImageUrl} alt={seed.SeedName} className="w-full h-full object-cover" />
                      <div className="absolute top-2 left-2 px-2.5 py-0.5 rounded-full bg-black/60 text-white text-[11px] font-bold backdrop-blur-sm flex items-center gap-1">
                        <Clock className="w-3 h-3 text-emerald-400" /> {seed.GrowthDurationDays} ngày/vụ
                      </div>
                      <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-emerald-700/90 text-white font-black text-xs">
                        {formatVND(seed.SeedPrice)}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-black text-sm text-slate-900 dark:text-white">{seed.SeedName}</h4>
                        <span className="text-[10px] text-slate-400">{seed.Category}</span>
                      </div>
                      <p className="text-xs text-slate-500 line-clamp-2">{seed.Description}</p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                      <span className="text-slate-500">
                        Năng suất: <strong className="text-slate-800 dark:text-slate-200">~{seed.ExpectedYieldKgPerM2} kg/m²</strong>
                      </span>
                      <Button size="sm" variant={isSelected ? 'primary' : 'outline'}>
                        {isSelected ? 'Đang Chọn' : 'Chọn Giống'}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-200 dark:border-slate-800">
              <Button variant="outline" size="sm" onClick={() => setIsAllSeedsModalOpen(false)}>
                Đóng
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* QUICK PLOT COMPARE MODAL (ĐỐI CHIẾU 2-3 Ô ĐẤT) */}
      {/* ========================================================================= */}
      {isCompareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-4xl w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                  <Scale className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">Bảng Đối Chiếu Ô Đất Canh Tác</h3>
                  <p className="text-xs text-slate-500">So sánh trực quan các thông số kỹ thuật và giá thuê</p>
                </div>
              </div>
              <button
                onClick={() => setIsCompareModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {comparedPlots.map((p) => {
                const isSelectedThis = selectedPlot?.PlotId === p.PlotId;
                return (
                  <div
                    key={p.PlotId}
                    className={`p-4 rounded-2xl border-2 space-y-3 ${
                      isSelectedThis
                        ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-black text-base text-slate-900 dark:text-white">{p.PlotCode}</h4>
                      <Badge variant={p.Status === 'AVAILABLE' ? 'success' : 'neutral'} size="sm">
                        {p.Status}
                      </Badge>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-700">
                        <span className="text-slate-500">Diện tích:</span>
                        <strong className="font-bold text-slate-900 dark:text-white">{p.SizeM2} m²</strong>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-700">
                        <span className="text-slate-500">Độ pH đất:</span>
                        <strong className="font-bold text-slate-900 dark:text-white">{p.SoilPH}</strong>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-700">
                        <span className="text-slate-500">Độ ẩm chuẩn:</span>
                        <strong className="font-bold text-slate-900 dark:text-white">{p.StandardHumidity}%</strong>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-700">
                        <span className="text-slate-500">Camera:</span>
                        <span className="font-bold text-emerald-600 flex items-center gap-1">
                          <Video className="w-3 h-3" /> {p.CameraCode || 'CAM'}
                        </span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-slate-500">Giá thuê/tháng:</span>
                        <strong className="font-black text-emerald-600">{formatVND(p.BasePricePerMonth)}</strong>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant={isSelectedThis ? 'primary' : 'outline'}
                      className="w-full justify-center"
                      onClick={() => {
                        setSelectedPlot(p);
                        setIsCompareModalOpen(false);
                      }}
                    >
                      {isSelectedThis ? 'Đang Chọn' : 'Xem Ô Này'}
                    </Button>
                  </div>
                );
              })}
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400">Chọn ô trong bảng đối chiếu sẽ xóa bộ lọc để hiển thị ô đó.</p>
            <div className="flex flex-wrap justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
              <Button variant="outline" size="sm" onClick={() => setComparedPlotIds([])}>
                Xóa Hết So Sánh
              </Button>
              <Button variant="primary" size="sm" onClick={() => setIsCompareModalOpen(false)}>
                Đóng Bảng So Sánh
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
