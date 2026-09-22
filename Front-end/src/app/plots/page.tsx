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
  ChevronDown,
  X
} from 'lucide-react';
import Header from '@/components/Header';
import { PackageSelector } from '@/components/care-packages/PackageSelector';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import api from '@/lib/axios';
import { PLOT_STATUS_LABELS, PlotStatusFilter } from '@/lib/plot-selection';
import { PlotStatusBadge } from '@/components/plots/PlotStatus';
import { usePlotSelection } from '@/components/plots/usePlotSelection';
import { PlotBrowser } from '@/components/plots/PlotBrowser';
import { PlotComparison } from '@/components/plots/PlotComparison';
import { ShareSelection } from '@/components/plots/ShareSelection';
import { MobileBookingBar } from '@/components/plots/MobileBookingBar';
import { useAuthStore } from '@/store/useAuthStore';
import { toast } from '@/store/useToastStore';

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
  HasActiveCultivation?: boolean | number;
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
  const { user, initAuth } = useAuthStore();
  const seedScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  // Role Checks for Dual-Mode UX (Customer vs Management)
  const userRoleId = user?.roleId ?? (user as any)?.RoleId;
  const userRoleName = user?.role ?? user?.roleName ?? (user as any)?.RoleName ?? '';
  const userEmail = user?.email ?? (user as any)?.Email ?? '';

  const isAdmin = userRoleId === 1 || userEmail?.toLowerCase() === 'admin@plotfarm.vn' || userRoleName?.toLowerCase() === 'admin';
  const isStaff = userRoleId === 2 || userRoleName?.toLowerCase() === 'staff';
  const isManagement = isAdmin || isStaff;

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
  const [seedFiltersOpen, setSeedFiltersOpen] = useState(false);

  const selectionData = useMemo(() => ({ areas, plots, seeds, packages: carePackages }), [areas, plots, seeds, carePackages]);
  const { selection, updateSelection, moveSeed, hydrated } = usePlotSelection(selectionData, !isLoading && !error);
  const selectedAreaId = selection.areaId;
  const selectedPlot = plots.find((plot) => plot.PlotId === selection.plotId) || null;
  const selectedSeed = seeds.find((seed) => seed.SeedId === selection.seedId) || null;
  const selectedPackage = carePackages.find((pkg) => pkg.PackageId === selection.pkgId) || null;
  const setSelectedSeed = (seed: Seed) => updateSelection({ seedId: seed.SeedId });
  const setSelectedPackage = (pkg: CarePackage) => updateSelection({ pkgId: pkg.PackageId });
  const setSelectedPlot = (plot: Plot) => updateSelection({ areaId: plot.AreaId, plotId: plot.PlotId, status: 'ALL', minPrice: null, maxPrice: null, minPH: null, maxPH: null, soil: '' });
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
      if (prev.length >= 2) {
        return prev;
      }
      return [...prev, plotId];
    });
  };

  const comparedPlots = useMemo(() => {
    return plots.filter((p) => comparedPlotIds.includes(p.PlotId));
  }, [plots, comparedPlotIds]);

  useEffect(() => {
    if (isLoading || error) return;
    setComparedPlotIds((ids) => {
      const remaining = ids.filter((id) => plots.some((plot) => plot.PlotId === id));
      return remaining.length === ids.length ? ids : remaining;
    });
  }, [plots, isLoading, error]);

  useEffect(() => {
    if (comparedPlotIds.length !== 2) setIsCompareModalOpen(false);
  }, [comparedPlotIds]);

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

  const hasCompletePricing = hydrated && !isLoading && !error && !packageError && !!selectedPlot && !!selectedSeed && !!selectedPackage;
  const canCheckout = !!hasCompletePricing && selectedPlot?.Status === 'AVAILABLE';
  const bookingMessage = error ? 'Không thể tải thông tin đặt thuê.'
    : isLoading || !hydrated ? 'Đang tải thông tin đặt thuê…'
    : packageError ? 'Chưa tải được gói chăm sóc để tính đủ chi phí đặt thuê.'
    : !selectedPlot ? 'Chọn ô đất để xem chi phí đặt thuê.'
    : !hasCompletePricing ? 'Chọn đủ giống cây và gói chăm sóc để tính chi phí.'
    : selectedPlot.Status !== 'AVAILABLE' ? 'Ô đất này chưa sẵn sàng thuê. Vui lòng chọn ô khác.' : '';

  // Format Currency
  const formatVND = (amount: number) => {
    return new Intl.NumberFormat('vi-VN').format(amount) + ' đ';
  };

  // Keep the selected seed visible without scrolling the page vertically.
  useEffect(() => {
    const strip = seedScrollRef.current;
    const active = strip?.querySelector<HTMLElement>('[aria-pressed="true"]');
    if (!strip || !active) return;
    const bounds = strip.getBoundingClientRect();
    const item = active.getBoundingClientRect();
    if (item.left < bounds.left) strip.scrollBy({ left: item.left - bounds.left - 4 });
    else if (item.right > bounds.right) strip.scrollBy({ left: item.right - bounds.right + 4 });
  }, [selection.seedId, selection.plotId]);

  // Handle Plot Status Update by Admin / Staff
  const handleUpdatePlotStatus = async (plotId: number, newStatus: string) => {
    try {
      await api.patch(`/plots/${plotId}/status`, { status: newStatus });
      setPlots((prev) => prev.map((p) => (p.PlotId === plotId ? { ...p, Status: newStatus as any } : p)));
      if (selectedPlot?.PlotId === plotId) {
        setSelectedPlot({ ...selectedPlot, Status: newStatus as any });
      }
      toast.success(
        `Đã chuyển trạng thái ô đất sang ${
          newStatus === 'AVAILABLE'
            ? 'CÒN TRỐNG (AVAILABLE)'
            : newStatus === 'MAINTENANCE'
            ? 'ĐANG BẢO TRÌ (MAINTENANCE)'
            : newStatus
        }!`,
        'Quản Lý Vận Hành'
      );
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Không thể cập nhật trạng thái ô đất', 'Lỗi');
    }
  };

  const handleProceedToCheckout = () => {
    if (!canCheckout) return;
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
                      <PlotStatusBadge plot={selectedPlot} />
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

                  {/* 2. DUAL-MODE SIDEBAR BODY: MANAGEMENT PANEL (ADMIN/STAFF) VS BOOKING STUDIO (CUSTOMER) */}
                  {isManagement ? (
                    /* MANAGEMENT & OPERATIONS PANEL FOR ADMIN & STAFF */
                    <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border-2 border-amber-300 dark:border-amber-800/60 space-y-3.5 shadow-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black uppercase text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                            <Users className="w-4 h-4 text-amber-600" /> Bảng Thao Tác Điều Hành ({isAdmin ? 'Quản Trị Viên' : 'Kỹ Thuật Viên'})
                          </span>
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                            selectedPlot.Status === 'RENTED'
                              ? 'bg-rose-600 text-white'
                              : selectedPlot.Status === 'MAINTENANCE'
                              ? 'bg-amber-600 text-white'
                              : 'bg-emerald-600 text-white'
                          }`}>
                            {selectedPlot.Status === 'RENTED' ? 'ĐÃ THUÊ' : selectedPlot.Status === 'MAINTENANCE' ? 'ĐANG BẢO TRÌ' : 'CÒN TRỐNG'}
                          </span>
                        </div>

                        <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                          {selectedPlot.Status === 'AVAILABLE'
                            ? 'Ô đất hiện đang SẴN SÀNG CHỜ THUÊ. Bạn có thể tạm thời đóng ô đất để bảo trì hoặc nâng cấp thiết bị IoT.'
                            : selectedPlot.Status === 'MAINTENANCE'
                            ? 'Ô đất hiện ĐANG ĐÓNG BẢO TRÌ. Bạn có thể mở khóa lại để cho phép khách hàng chọn thuê.'
                            : selectedPlot.Status === 'RENTED'
                            ? 'Ô đất ĐANG ĐƯỢC THUÊ CANH TÁC bởi khách hàng. KTV phụ trách theo dõi chỉ số và đăng nhật ký thực địa.'
                            : 'Ô đất đang trong chế độ quản lý đặc biệt.'}
                        </p>

                        {/* Quick Operational Buttons */}
                        <div className="space-y-2 pt-1">
                          {selectedPlot.Status === 'MAINTENANCE' ? (
                            <Button
                              variant="primary"
                              size="md"
                              className="w-full justify-center bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs py-3 shadow-md"
                              onClick={() => handleUpdatePlotStatus(selectedPlot.PlotId, 'AVAILABLE')}
                            >
                              🔓 Mở Khóa Ô Đất (Chuyển Sang AVAILABLE)
                            </Button>
                          ) : selectedPlot.Status === 'AVAILABLE' ? (
                            <Button
                              variant="outline"
                              size="md"
                              className="w-full justify-center border-amber-500 text-amber-800 dark:text-amber-300 bg-white dark:bg-slate-900 hover:bg-amber-100 dark:hover:bg-amber-950 font-black text-xs py-3 shadow-sm"
                              onClick={() => handleUpdatePlotStatus(selectedPlot.PlotId, 'MAINTENANCE')}
                            >
                              🛠️ Đóng Ô Đất (Đặt Trạng Thái BẢO TRÌ - MAINTENANCE)
                            </Button>
                          ) : (
                            <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-center text-xs font-bold text-slate-700 dark:text-slate-300 space-y-1">
                              <div>🔒 Ô Đất Đang Trong Hợp Đồng Canh Tác</div>
                              <Link
                                href={isAdmin ? '/admin' : '/staff'}
                                className="inline-block text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline font-extrabold"
                              >
                                Đến Cổng {isAdmin ? 'Quản Trị /admin' : 'Kỹ Thuật Viên /staff'} →
                              </Link>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Management Quick Details */}
                      <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 text-xs space-y-2">
                        <span className="font-black text-slate-800 dark:text-slate-200 block uppercase text-[10px]">
                          Thông Tin Vận Hành CSDL SQL Server:
                        </span>
                        <div className="grid grid-cols-2 gap-2 text-[11px]">
                          <div>
                            Mã Ô Đất: <strong className="text-slate-900 dark:text-white font-bold">{selectedPlot.PlotCode}</strong>
                          </div>
                          <div>
                            Diện Tích: <strong className="text-slate-900 dark:text-white font-bold">{selectedPlot.SizeM2} m²</strong>
                          </div>
                          <div>
                            Đơn Giá Nối: <strong className="text-emerald-600 font-bold">{selectedPlot.BasePricePerMonth?.toLocaleString('vi-VN')} đ/tháng</strong>
                          </div>
                          <div>
                            Phân Khu: <strong className="text-slate-900 dark:text-white font-bold">{currentAreaInfo?.AreaName || 'Khu A'}</strong>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* CUSTOMER BOOKING STUDIO (SEEDS, PACKAGES, YIELD ESTIMATION & CHECKOUT) */
                    <div className="space-y-4 pt-1 border-t border-slate-100 dark:border-slate-800">
                      {/* 2. GIỐNG CÂY TRỒNG */}
                      <div className="space-y-3">
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

                        {selectedSeed && (
                          <div className="min-w-0 p-3 rounded-2xl bg-gradient-to-br from-emerald-50/90 to-teal-50/50 dark:from-emerald-950/40 dark:to-slate-900 border-2 border-emerald-400/80 dark:border-emerald-700 shadow-sm flex flex-col min-[440px]:flex-row items-start gap-3">
                            <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden shrink-0 shadow-md border-2 border-emerald-500/50">
                              <img src={selectedSeed.ImageUrl} alt={selectedSeed.SeedName} className="w-full h-full object-cover" />
                              <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/60 text-white font-mono text-[9px] font-bold">
                                F1
                              </span>
                            </div>

                            <div className="w-full space-y-1.5 flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="px-2 py-0.5 rounded-full text-[11px] font-black bg-emerald-600 text-white shadow-sm flex items-center gap-1">
                                  <Clock className="w-3 h-3" /> {selectedSeed.GrowthDurationDays} ngày/vụ
                                </span>
                                <span className="text-[11px] font-bold text-slate-500">{selectedSeed.Category}</span>
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

                        <div className="space-y-1.5">
                          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-bold text-slate-500">
                            <span>CHỌN NHANH GIỐNG CÂY TRỒNG:</span>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                aria-label="Chọn giống trước"
                                disabled={seeds.length < 2}
                                onClick={() => moveSeed(-1)}
                                className="p-1 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-emerald-600"
                              >
                                <ChevronLeft className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                aria-label="Chọn giống tiếp theo"
                                disabled={seeds.length < 2}
                                onClick={() => moveSeed(1)}
                                className="p-1 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-emerald-600"
                              >
                                <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <div ref={seedScrollRef} className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-none scroll-smooth">
                            {seeds.map((s) => {
                              const isSeedActive = selectedSeed?.SeedId === s.SeedId;
                              return (
                                <button
                                  key={s.SeedId}
                                  type="button"
                                  aria-pressed={isSeedActive}
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
                                    <span className="text-xs font-black text-slate-800 dark:text-slate-100 block truncate">{s.SeedName}</span>
                                    <span className="text-[10px] text-emerald-600 font-bold block">{s.GrowthDurationDays} ngày</span>
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
                          <span className="text-sm font-black text-emerald-100">~{yieldEstimations.totalKg} kg rau sạch</span>
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

                      {/* 5. PRICING & CHECKOUT CTA BUTTON */}
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
                        {(!selectedSeed || !selectedPackage) && (
                          <p className="text-xs text-amber-800 dark:text-amber-200">
                            Chưa đủ thông tin giống cây và gói chăm sóc để tính tổng chi phí đầy đủ.
                          </p>
                        )}
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
                          disabled={!canCheckout}
                        >
                          Tiếp Tục Đặt Thuê ({pricingSummary.growthDays} ngày)
                        </Button>
                        {selectedPlot.Status !== 'AVAILABLE' && (
                          <p role="status" className="text-xs leading-relaxed text-amber-800 dark:text-amber-200">
                            Ô đất này hiện {PLOT_STATUS_LABELS[selectedPlot.Status as PlotStatusFilter]?.toLowerCase() || selectedPlot.Status}. Vui lòng chọn ô sẵn sàng thuê để tiếp tục.
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
              {!selectedPlot && <div className="min-h-[280px] rounded-3xl border border-dashed border-slate-300 bg-white p-5 dark:border-slate-700 dark:bg-slate-900"><h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">Chưa chọn ô đất</h2><p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-400">Chọn phân khu hoặc điều chỉnh bộ lọc để tìm ô đất phù hợp. Thông tin thuê sẽ hiển thị tại đây.</p></div>}
            </div>
          </div>
        )}
      </main>

      <MobileBookingBar
        hidden={isAllSeedsModalOpen || isCompareModalOpen || isManagement}
        plotCode={selectedPlot?.PlotCode}
        growthDays={selectedSeed ? pricingSummary.growthDays : 0}
        total={hasCompletePricing ? formatVND(pricingSummary.total) : null}
        canCheckout={canCheckout}
        message={bookingMessage}
        onCheckout={handleProceedToCheckout}
      />

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
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="font-semibold text-slate-600 dark:text-slate-300">Loại cây: {seedModalCategory === 'ALL' ? 'Tất cả' : seedModalCategory}</span>
              <button type="button" aria-expanded={seedFiltersOpen} aria-controls="seed-category-filters" onClick={() => setSeedFiltersOpen((open) => !open)} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 font-bold text-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 dark:text-emerald-300">{seedFiltersOpen ? 'Ẩn bộ lọc giống' : 'Hiện bộ lọc giống'}<ChevronDown aria-hidden="true" className={`h-4 w-4 ${seedFiltersOpen ? 'rotate-180' : ''}`} /></button>
            </div>
            <div id="seed-category-filters" hidden={!seedFiltersOpen}>
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

      {isCompareModalOpen && comparedPlots.length === 2 && (
        <PlotComparison plots={comparedPlots} areas={areas}
          onClose={() => setIsCompareModalOpen(false)}
          onChoose={(id) => {
            const plot = plots.find((candidate) => candidate.PlotId === id);
            if (!plot || plot.Status !== 'AVAILABLE' || plot.HasActiveCultivation === true || plot.HasActiveCultivation === 1) return;
            setSelectedPlot(plot);
            setIsCompareModalOpen(false);
          }}
          onRemove={(id) => { setComparedPlotIds((ids) => ids.filter((value) => value !== id)); setIsCompareModalOpen(false); }}
          onClear={() => { setComparedPlotIds([]); setIsCompareModalOpen(false); }}
        />
      )}
    </div>
  );
}
