'use client';

import React, { useEffect, useState, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  MapPin,
  Sprout,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Check,
  Layers,
  Compass,
  Sun,
  Droplets,
  Thermometer,
  DollarSign,
  Package,
  Sparkles,
  Filter,
  Clock,
  Info,
  Calendar,
  ShieldCheck,
  RotateCcw,
  Loader2,
  CheckCircle,
  LayoutGrid,
  ListFilter,
  Video,
  Scale,
  Users,
  Utensils,
  ChevronRight,
  ChevronLeft,
  X,
  ExternalLink,
  Activity,
  User,
  FileText,
  Wrench,
} from 'lucide-react';
import Header from '@/components/Header';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useAuthStore } from '@/store/useAuthStore';

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
  const { user, token, isAuthenticated, initAuth } = useAuthStore();
  const isAdmin = user?.role === 'Admin' || user?.roleId === 1;
  const isStaff = user?.role === 'Staff' || user?.roleId === 2;
  const isManagement = isAdmin || isStaff;

  const [cultivations, setCultivations] = useState<any[]>([]);
  const [isUpdatingPlotStatus, setIsUpdatingPlotStatus] = useState(false);
  const seedScrollRef = useRef<HTMLDivElement>(null);

  // Data states
  const [areas, setAreas] = useState<FarmArea[]>([]);
  const [selectedAreaId, setSelectedAreaId] = useState<number>(2); // Default Area B like screenshot
  const [plots, setPlots] = useState<Plot[]>([]);
  const [seeds, setSeeds] = useState<Seed[]>([]);
  const [carePackages, setCarePackages] = useState<CarePackage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // View Mode: 'GRID' | 'LIST'
  const [viewMode, setViewMode] = useState<'GRID' | 'LIST'>('GRID');

  // Compare & Modal states
  const [comparedPlotIds, setComparedPlotIds] = useState<number[]>([]);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [isAllSeedsModalOpen, setIsAllSeedsModalOpen] = useState(false);
  const [seedModalCategory, setSeedModalCategory] = useState<string>('ALL');

  // Selection states
  const [selectedPlot, setSelectedPlot] = useState<Plot | null>(null);
  const [selectedSeed, setSelectedSeed] = useState<Seed | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<CarePackage | null>(null);

  // Filter states
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'AVAILABLE' | 'RENTED' | 'MAINTENANCE'>('ALL');

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  // Fetch cultivations for management role
  useEffect(() => {
    if (token && isManagement) {
      fetch('http://localhost:5000/api/cultivations', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => r.json())
        .then((d) => {
          if (d.success && Array.isArray(d.data)) setCultivations(d.data);
        })
        .catch((err) => console.error('Failed to load cultivations:', err));
    }
  }, [token, isManagement]);

  // Handle status update by Admin
  const handleUpdatePlotStatus = async (plotId: number, newStatus: string) => {
    if (!token) return;
    try {
      setIsUpdatingPlotStatus(true);
      const res = await fetch(`http://localhost:5000/api/plots/${plotId}/status`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setPlots((prev) =>
          prev.map((p) => (p.PlotId === plotId ? { ...p, Status: newStatus as any } : p))
        );
        setSelectedPlot((prev) => (prev && prev.PlotId === plotId ? { ...prev, Status: newStatus as any } : prev));
      } else {
        alert(data.message || 'Cập nhật thất bại');
      }
    } catch (e) {
      console.error(e);
      alert('Có lỗi xảy ra khi cập nhật trạng thái ô đất');
    } finally {
      setIsUpdatingPlotStatus(false);
    }
  };

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const [areasRes, plotsRes, seedsRes, pkgsRes] = await Promise.all([
          fetch('http://localhost:5000/api/plots/areas').then((r) => r.json()).catch(() => ({ success: false })),
          fetch('http://localhost:5000/api/plots/grid').then((r) => r.json()),
          fetch('http://localhost:5000/api/seeds').then((r) => r.json()),
          fetch('http://localhost:5000/api/seeds/packages').then((r) => r.json()),
        ]);

        if (areasRes.success && areasRes.data && areasRes.data.length > 0) {
          setAreas(areasRes.data);
          // Set to Area B if available
          const areaB = areasRes.data.find((a: FarmArea) => a.AreaCode === 'AREA_B');
          setSelectedAreaId(areaB ? areaB.AreaId : areasRes.data[0].AreaId);
        }

        if (plotsRes.success && plotsRes.data) {
          setPlots(plotsRes.data);
          // Default select plot B08 or first available in Area B
          const plotB08 = plotsRes.data.find((p: Plot) => p.PlotCode === 'PLOT_B08' && p.Status === 'AVAILABLE');
          const firstAvail = plotsRes.data.find((p: Plot) => p.Status === 'AVAILABLE');
          setSelectedPlot(plotB08 || firstAvail || plotsRes.data[0]);
        }

        if (seedsRes.success && seedsRes.data) {
          setSeeds(seedsRes.data);
          // Default select Cải thìa baby thủy canh (SeedId 2) or first seed
          const seed2 = seedsRes.data.find((s: Seed) => s.SeedId === 2);
          setSelectedSeed(seed2 || seedsRes.data[0]);
        }

        if (pkgsRes.success && pkgsRes.data) {
          setCarePackages(pkgsRes.data);
          // Default select Basic package (first package)
          setSelectedPackage(pkgsRes.data[0]);
        }
      } catch (err: any) {
        console.error('Error loading plots data:', err);
        setError('Không thể kết nối máy chủ để tải dữ liệu nông trại. Vui lòng kiểm tra lại backend!');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filtered plots by Area and Status
  const currentAreaPlots = useMemo(() => {
    let filtered = plots.filter((p) => p.AreaId === selectedAreaId);
    if (statusFilter === 'AVAILABLE') filtered = filtered.filter((p) => p.Status === 'AVAILABLE');
    if (statusFilter === 'RENTED') filtered = filtered.filter((p) => p.Status === 'RENTED');
    if (statusFilter === 'MAINTENANCE') filtered = filtered.filter((p) => p.Status === 'MAINTENANCE');
    return filtered;
  }, [plots, selectedAreaId, statusFilter]);

  // Selected Farm Area info
  const currentAreaInfo = useMemo(() => {
    return areas.find((a) => a.AreaId === selectedAreaId) || {
      AreaId: 2,
      AreaCode: 'AREA_B',
      AreaName: 'Khu Củ Quả & Dâu Tây B',
      SoilType: 'Đất thịt pha cát tơi xốp',
      TotalPlots: 20,
      Description: 'Khu vực luống cao thích hợp trồng Cà chua bi, Dâu tây Nhật, Dưa leo baby'
    };
  }, [areas, selectedAreaId]);

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
      return { totalKg: 45, familyWeeks: 13 };
    }
    const size = selectedPlot.SizeM2 || 15;
    const yieldPerM2 = selectedSeed.ExpectedYieldKgPerM2 || 3;
    const totalKg = Math.round(size * yieldPerM2);
    const familyWeeks = Math.max(1, Math.round(totalKg / 3.5));
    return { totalKg, familyWeeks };
  }, [selectedPlot, selectedSeed]);

  // Day-based Pricing Calculation
  const pricingSummary = useMemo(() => {
    const growthDays = selectedSeed?.GrowthDurationDays || 30;
    const plotPriceMonth = selectedPlot?.BasePricePerMonth || 600000;
    const pkgPriceMonth = selectedPackage?.MonthlyFee || 250000;

    const plotFee = Math.round((plotPriceMonth / 30) * growthDays);
    const careFee = Math.round((pkgPriceMonth / 30) * growthDays);
    const seedFee = selectedSeed?.SeedPrice || 40000;
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

      <main className="max-w-[1520px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-5">
        {/* Top Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
                Về Trang Chủ
              </Button>
            </Link>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <MapPin className="w-5 h-5 text-emerald-600" /> Bản Đồ Nông Trại & Chọn Cây Trồng
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" /> 5 Phân Khu • 100 Ô Đất Canh Tác Hữu Cơ
            </span>
          </div>
        </div>

        {/* 5 Farm Areas Selector Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {areas.map((area) => {
            const isAreaActive = area.AreaId === selectedAreaId;
            const areaPlots = plots.filter((p) => p.AreaId === area.AreaId);
            const availCount = areaPlots.filter((p) => p.Status === 'AVAILABLE').length;

            return (
              <button
                key={area.AreaId}
                onClick={() => setSelectedAreaId(area.AreaId)}
                className={`p-3 rounded-2xl text-left border transition-all duration-200 flex flex-col justify-between gap-1.5 ${
                  isAreaActive
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-600/20 scale-101 ring-2 ring-emerald-400'
                    : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border-slate-200 dark:border-slate-800 hover:border-emerald-300 hover:bg-emerald-50/40 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-black tracking-wider ${
                    isAreaActive ? 'bg-white/20 text-white' : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                  }`}>
                    {area.AreaCode}
                  </span>
                  <span className={`text-[11px] font-bold ${isAreaActive ? 'text-emerald-100' : 'text-slate-500'}`}>
                    {availCount}/20 trống
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
        <div className="p-3 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-emerald-900 dark:text-emerald-200">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>
              <strong className="font-extrabold">{currentAreaInfo.AreaName}:</strong> {currentAreaInfo.Description} ({currentAreaInfo.SoilType})
            </span>
          </div>
          <Badge variant="success" size="sm" className="self-start sm:self-auto flex-shrink-0">
            Trang bị Camera IoT 100%
          </Badge>
        </div>

        {/* Loading / Error States */}
        {isLoading && (
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
        {!isLoading && !error && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* --------------------------------------------------------------------- */}
            {/* LEFT COLUMN (7 / 12 COLS): 20 PLOTS MAP & LIST VIEW */}
            {/* --------------------------------------------------------------------- */}
            <div className="lg:col-span-7 xl:col-span-7 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              {/* Sub-header Filter Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800 text-xs">
                {/* View Switcher */}
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                  <button
                    onClick={() => setViewMode('GRID')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      viewMode === 'GRID'
                        ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-sm'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    <LayoutGrid className="w-3.5 h-3.5" /> Lưới 5x4
                  </button>
                  <button
                    onClick={() => setViewMode('LIST')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      viewMode === 'LIST'
                        ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-sm'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    <ListFilter className="w-3.5 h-3.5" /> Danh Sách
                  </button>
                </div>

                <div className="font-bold text-slate-700 dark:text-slate-300">
                  • {currentAreaInfo.AreaName}
                </div>

                {/* Status Filter */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setStatusFilter('ALL')}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                      statusFilter === 'ALL'
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                  >
                    Tất cả (20)
                  </button>
                  <button
                    onClick={() => setStatusFilter('AVAILABLE')}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                      statusFilter === 'AVAILABLE'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300'
                    }`}
                  >
                    Trống ({plots.filter((p) => p.AreaId === selectedAreaId && p.Status === 'AVAILABLE').length})
                  </button>
                  <button
                    onClick={() => setStatusFilter('RENTED')}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                      statusFilter === 'RENTED'
                        ? 'bg-slate-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'
                    }`}
                  >
                    Đã thuê
                  </button>

                  {comparedPlotIds.length > 0 && (
                    <button
                      onClick={() => setIsCompareModalOpen(true)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500 text-white shadow-sm hover:bg-amber-600 animate-pulse"
                    >
                      <Scale className="w-3.5 h-3.5" /> ({comparedPlotIds.length})
                    </button>
                  )}
                </div>
              </div>

              {/* Grid sub-label */}
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-emerald-600" /> Sơ đồ luống 4 Hàng x 5 Cột (20 Ô đất)
                </span>
                <span className="text-[11px] text-slate-400">Nhấp chọn ô để xem chi tiết bên cạnh</span>
              </div>

              {/* Grid 5 columns x 4 rows */}
              {viewMode === 'GRID' ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
                  {currentAreaPlots.map((plot) => {
                    const isSelected = selectedPlot?.PlotId === plot.PlotId;
                    const isAvailable = plot.Status === 'AVAILABLE';
                    const isLocked = plot.Status === 'MAINTENANCE' || plot.Status === 'FALLOWING' || plot.Status === 'RESERVED';
                    const isCompared = comparedPlotIds.includes(plot.PlotId);
                    const canSelect = isAvailable || isManagement;

                    return (
                      <div
                        key={plot.PlotId}
                        onClick={() => canSelect && setSelectedPlot(plot)}
                        className={`relative p-3 rounded-2xl flex flex-col items-center justify-between text-center transition-all duration-200 select-none min-h-[118px] ${
                          isSelected
                            ? isLocked
                              ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/25 ring-3 ring-amber-400 scale-102 z-10'
                              : plot.Status === 'RENTED'
                              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25 ring-3 ring-blue-400 scale-102 z-10'
                              : 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/25 ring-3 ring-emerald-400 scale-102 z-10'
                            : isAvailable
                            ? 'bg-white dark:bg-slate-800/90 text-slate-800 dark:text-slate-100 border-2 border-emerald-300 dark:border-emerald-700/80 hover:border-emerald-500 hover:shadow-md cursor-pointer'
                            : isLocked && isManagement
                            ? 'bg-amber-50/70 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 border-2 border-dashed border-amber-400 dark:border-amber-600 hover:border-amber-500 hover:shadow-md cursor-pointer'
                            : plot.Status === 'RENTED' && isManagement
                            ? 'bg-blue-50/40 dark:bg-blue-950/20 text-slate-700 dark:text-slate-200 border-2 border-blue-200 dark:border-blue-800 hover:border-blue-400 hover:shadow-md cursor-pointer'
                            : 'bg-slate-100 dark:bg-slate-800/40 text-slate-400 dark:text-slate-600 border border-slate-200 dark:border-slate-800 cursor-not-allowed opacity-60'
                        }`}
                      >
                        {/* Top bar: Compare icon & Camera indicator */}
                        <div className="w-full flex items-center justify-between text-[10px]">
                          <button
                            title="So sánh ô đất này"
                            onClick={(e) => toggleComparePlot(plot.PlotId, e)}
                            className={`p-0.5 rounded transition-all ${
                              isCompared
                                ? 'bg-amber-400 text-amber-950 font-bold'
                                : isSelected
                                ? 'text-emerald-200 hover:text-white'
                                : 'text-slate-400 hover:text-slate-700'
                            }`}
                          >
                            <Scale className="w-3 h-3" />
                          </button>

                          <span className={`flex items-center gap-0.5 ${isSelected ? 'text-emerald-100' : 'text-slate-400'}`}>
                            <Video className="w-2.5 h-2.5" />
                          </span>
                        </div>

                        {/* Selected Checkmark Badge */}
                        {isSelected && (
                          <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-emerald-400 text-emerald-950 flex items-center justify-center shadow font-black text-xs">
                            ✓
                          </span>
                        )}

                        {/* Status icon */}
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center my-0.5 ${
                          isSelected
                            ? 'bg-white/20 text-white'
                            : isAvailable
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                            : isLocked && isManagement
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300'
                            : 'bg-slate-200 text-slate-500 dark:bg-slate-800'
                        }`}>
                          {isLocked ? (
                            <Wrench className="w-3.5 h-3.5" />
                          ) : (
                            <Sprout className="w-3.5 h-3.5" />
                          )}
                        </div>

                        {/* Plot code & size */}
                        <div className="space-y-0.5">
                          <span className="font-black text-xs sm:text-sm block tracking-tight">
                            {plot.PlotCode}
                          </span>
                          <span className={`text-[10px] block font-semibold ${isSelected ? 'text-emerald-100' : 'text-slate-500 dark:text-slate-400'}`}>
                            {plot.SizeM2} m² • pH {plot.SoilPH}
                          </span>
                        </div>

                        {/* Price / Status */}
                        <div className="pt-1 border-t border-current/10 w-full">
                          <span className={`text-[10px] font-bold block ${
                            isSelected
                              ? 'text-white'
                              : isAvailable
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : isLocked && isManagement
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-slate-400'
                          }`}>
                            {isAvailable
                              ? `${plot.BasePricePerMonth / 1000}k/th`
                              : plot.Status === 'MAINTENANCE'
                              ? 'BẢO TRÌ'
                              : plot.Status === 'FALLOWING'
                              ? 'NGHỈ ĐẤT'
                              : plot.Status === 'RESERVED'
                              ? 'GIỮ CHỖ'
                              : plot.Status}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* List Table View */
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold uppercase text-[10px]">
                        <th className="py-2.5 px-3">Mã Ô</th>
                        <th className="py-2.5 px-3">Diện Tích</th>
                        <th className="py-2.5 px-3">pH / Độ Ẩm</th>
                        <th className="py-2.5 px-3">Camera</th>
                        <th className="py-2.5 px-3">Giá Thuê</th>
                        <th className="py-2.5 px-3">Trạng Thái</th>
                        <th className="py-2.5 px-3 text-right">Chọn</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                      {currentAreaPlots.map((plot) => {
                        const isSelected = selectedPlot?.PlotId === plot.PlotId;
                        const isAvailable = plot.Status === 'AVAILABLE';

                        return (
                          <tr
                            key={plot.PlotId}
                            className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 ${
                              isSelected ? 'bg-emerald-50/80 dark:bg-emerald-950/30' : ''
                            }`}
                          >
                            <td className="py-2 px-3 font-bold text-slate-900 dark:text-white">
                              {plot.PlotCode}
                            </td>
                            <td className="py-2 px-3 font-semibold">{plot.SizeM2} m²</td>
                            <td className="py-2 px-3">
                              pH {plot.SoilPH} • {plot.StandardHumidity}%
                            </td>
                            <td className="py-2 px-3 text-emerald-600 font-semibold flex items-center gap-1">
                              <Video className="w-3 h-3" /> {plot.CameraCode || 'CAM'}
                            </td>
                            <td className="py-2 px-3 font-bold text-emerald-600">
                              {formatVND(plot.BasePricePerMonth)}/th
                            </td>
                            <td className="py-2 px-3">
                              <Badge variant={isAvailable ? 'success' : 'neutral'} size="sm">
                                {isAvailable ? 'TRỐNG' : plot.Status}
                              </Badge>
                            </td>
                            <td className="py-2 px-3 text-right">
                              <Button
                                size="sm"
                                variant={isSelected ? 'primary' : 'outline'}
                                disabled={!isAvailable && !isManagement}
                                onClick={() => setSelectedPlot(plot)}
                              >
                                {isSelected
                                  ? 'Đang Chọn'
                                  : isManagement && !isAvailable
                                  ? 'Mở Khóa / Quản Lý'
                                  : 'Chọn'}
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* --------------------------------------------------------------------- */}
            {/* RIGHT COLUMN (5 / 12 COLS): COMPACT CULTIVATION STUDIO OR MANAGEMENT PANEL */}
            {/* --------------------------------------------------------------------- */}
            <div className="lg:col-span-5 xl:col-span-5 space-y-4 lg:sticky lg:top-6">
              {selectedPlot && (
                <div className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-emerald-500/80 shadow-xl overflow-hidden p-5 space-y-5">
                  {/* Top Plot Card Banner */}
                  <div className="relative rounded-2xl overflow-hidden shadow-md group">
                    <img
                      src="/assets/farm/garden-rows.jpg"
                      alt="Luống đất thực tế"
                      className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-black/20" />

                    <div className="absolute top-2.5 left-3 right-3 flex items-center justify-between text-xs">
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-700/90 text-white font-bold backdrop-blur-sm text-[11px]">
                        {currentAreaInfo.AreaName}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full font-black backdrop-blur-sm text-[10px] ${
                        selectedPlot.Status === 'AVAILABLE'
                          ? 'bg-emerald-500 text-white'
                          : selectedPlot.Status === 'RENTED'
                          ? 'bg-blue-500 text-white'
                          : 'bg-amber-500 text-white'
                      }`}>
                        {selectedPlot.Status === 'AVAILABLE'
                          ? 'SẴN SÀNG THUÊ'
                          : selectedPlot.Status === 'RENTED'
                          ? 'ĐANG CANH TÁC'
                          : selectedPlot.Status === 'MAINTENANCE'
                          ? 'ĐANG BẢO TRÌ'
                          : selectedPlot.Status === 'FALLOWING'
                          ? 'NGHỈ ĐẤT'
                          : 'ĐANG KHÓA'}
                      </span>
                    </div>

                    <div className="absolute bottom-2.5 left-3 right-3 flex items-end justify-between text-white">
                      <div>
                        <span className="text-[10px] text-emerald-300 uppercase tracking-wider font-bold block">
                          Ô Đất Đang Chọn
                        </span>
                        <h3 className="text-2xl font-black tracking-tight">{selectedPlot.PlotCode}</h3>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-300 block">Diện tích đất sạch:</span>
                        <span className="text-xl font-black text-emerald-400">{selectedPlot.SizeM2} m²</span>
                      </div>
                    </div>
                  </div>

                  {/* 4 Mini Technical Specs */}
                  <div className="grid grid-cols-4 gap-2 text-center text-xs">
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
                        {selectedPlot.CameraCode || 'CAM_B08'}
                      </strong>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700">
                      <span className="text-[10px] text-slate-400 block">Giá tháng</span>
                      <strong className="font-extrabold text-slate-800 dark:text-slate-100">{selectedPlot.BasePricePerMonth / 1000}k</strong>
                    </div>
                  </div>

                  {/* ================= CHẾ ĐỘ QUẢN LÝ / VẬN HÀNH CHO ADMIN & STAFF ================= */}
                  {isManagement ? (
                    <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                          <Activity className="w-4 h-4 text-teal-600" /> Bảng Điều Hành & Hiện Trạng Ô Đất
                        </h4>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300">
                          {isAdmin ? 'QUẢN TRỊ VIÊN' : 'KỸ THUẬT VIÊN'}
                        </span>
                      </div>

                      {/* Case 1: Ô đất Đang Được Thuê (RENTED / GROWING) */}
                      {selectedPlot.Status === 'RENTED' && (() => {
                        const cult = cultivations.find(
                          (c) => c.PlotCode === selectedPlot.PlotCode || c.PlotId === selectedPlot.PlotId
                        );
                        return (
                          <div className="space-y-3.5">
                            <div className="p-3.5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/60 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-blue-900 dark:text-blue-300 flex items-center gap-1">
                                  <User className="w-3.5 h-3.5" /> Khách hàng đang canh tác:
                                </span>
                                <span className="text-[10px] font-mono font-bold text-blue-600 dark:text-blue-400">
                                  {cult?.OrderCode || 'Hợp đồng số #PF-ORD'}
                                </span>
                              </div>
                              <p className="text-sm font-black text-slate-900 dark:text-white">
                                {cult?.FullName || 'Phạm Thị Trà My'}
                              </p>
                              <div className="text-xs text-slate-600 dark:text-slate-400 flex items-center justify-between">
                                <span>{cult?.Email || 'khachmoi@gmail.com'}</span>
                                <span className="font-semibold">{cult?.PhoneNumber || '0901234567'}</span>
                              </div>
                            </div>

                            {/* Crop in progress */}
                            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2.5">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                                  <Sprout className="w-4 h-4 text-emerald-600" />
                                  {cult?.SeedName || 'Cải Thìa Baby Thủy Canh'}
                                </span>
                                <span className="text-xs font-black text-emerald-600">
                                  {cult?.ProgressPercent || 45}% Chu kỳ
                                </span>
                              </div>

                              <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 transition-all duration-500"
                                  style={{ width: `${cult?.ProgressPercent || 45}%` }}
                                />
                              </div>

                              <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] text-slate-500">
                                <div>
                                  <span className="block text-[10px] text-slate-400">Bắt đầu gieo:</span>
                                  <strong>{cult?.StartDate ? new Date(cult.StartDate).toLocaleDateString('vi-VN') : 'Đầu vụ'}</strong>
                                </div>
                                <div className="text-right">
                                  <span className="block text-[10px] text-slate-400">Dự kiến thu hoạch:</span>
                                  <strong className="text-amber-600">{cult?.ExpectedHarvestDate ? new Date(cult.ExpectedHarvestDate).toLocaleDateString('vi-VN') : '30 ngày'}</strong>
                                </div>
                              </div>
                            </div>

                            {/* Actions for Rented Plot */}
                            <div className="space-y-2 pt-1">
                              {isStaff && (
                                <Link href="/staff" className="block w-full">
                                  <Button
                                    variant="primary"
                                    size="md"
                                    className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs"
                                    leftIcon={<FileText className="w-4 h-4" />}
                                  >
                                    Ghi Nhật Ký Hiện Trường Cho Ô Này
                                  </Button>
                                </Link>
                              )}
                              {isAdmin && (
                                <div className="flex gap-2">
                                  <Link href="/admin" className="flex-1">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="w-full text-xs font-bold"
                                    >
                                      Xem Trong Bảng Quản Trị
                                    </Button>
                                  </Link>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={isUpdatingPlotStatus}
                                    onClick={() => handleUpdatePlotStatus(selectedPlot.PlotId, 'MAINTENANCE')}
                                    className="text-xs font-bold text-amber-600 border-amber-300 hover:bg-amber-50"
                                  >
                                    Chuyển Bảo Trì
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })()}

                      {/* Case 2: Ô đất Trống (AVAILABLE) */}
                      {selectedPlot.Status === 'AVAILABLE' && (
                        <div className="space-y-4">
                          <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 space-y-1">
                            <p className="font-bold">✅ Ô đất đang sẵn sàng</p>
                            <p className="text-slate-600 dark:text-slate-400 text-[11px]">
                              Ô đất đã được vệ sinh, bổ sung dinh dưỡng và mở để khách hàng tự do đặt thuê trực tuyến.
                            </p>
                          </div>

                          {isManagement && (
                            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2.5">
                              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                Thao tác điều hành ({isAdmin ? 'Quản Trị Viên' : 'Kỹ Thuật Viên'}):
                              </p>
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={isUpdatingPlotStatus}
                                onClick={() => handleUpdatePlotStatus(selectedPlot.PlotId, 'MAINTENANCE')}
                                className="w-full text-xs font-bold text-amber-700 border-amber-300 dark:border-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/40"
                                leftIcon={<Wrench className="w-3.5 h-3.5 text-amber-600" />}
                              >
                                Tạm Khóa & Chuyển Sang Bảo Trì Đất
                              </Button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Case 3: Ô đất Bị Khóa (MAINTENANCE / FALLOWING / RESERVED) */}
                      {(selectedPlot.Status === 'MAINTENANCE' || selectedPlot.Status === 'FALLOWING' || selectedPlot.Status === 'RESERVED') && (
                        <div className="space-y-4">
                          <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300 space-y-1">
                            <p className="font-bold flex items-center gap-1.5 text-amber-900 dark:text-amber-200">
                              <Wrench className="w-4 h-4 text-amber-600" />
                              Ô đất đang bị khóa ({selectedPlot.Status === 'MAINTENANCE' ? 'Đang Bảo Trì' : selectedPlot.Status === 'FALLOWING' ? 'Nghỉ Đất Cải Tạo' : 'Đang Giữ Chỗ'})
                            </p>
                            <p className="text-slate-600 dark:text-slate-400 text-[11px]">
                              {selectedPlot.Status === 'MAINTENANCE'
                                ? 'Kỹ thuật viên đang xới đất, xử lý nấm mốc hoặc kiểm tra bảo trì hệ thống dinh dưỡng.'
                                : selectedPlot.Status === 'FALLOWING'
                                ? 'Đất đang trong giai đoạn nghỉ xả phèn và tái tạo hệ vi sinh hữu cơ sau chu kỳ canh tác.'
                                : 'Ô đất đang được bảo lưu nội bộ cho kế hoạch canh tác riêng.'}
                            </p>
                          </div>

                          {isManagement && (
                            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 space-y-2.5">
                              <p className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                                Thao tác mở khóa ({isAdmin ? 'Quản Trị Viên' : 'Kỹ Thuật Viên'}):
                              </p>
                              <Button
                                variant="primary"
                                size="sm"
                                disabled={isUpdatingPlotStatus}
                                onClick={() => handleUpdatePlotStatus(selectedPlot.PlotId, 'AVAILABLE')}
                                className="w-full text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                                leftIcon={<Check className="w-3.5 h-3.5" />}
                              >
                                Mở Khóa Ô Đất (Chuyển Thành Sẵn Sàng Cho Thuê)
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    /* ================= CHẾ ĐỘ DÀNH CHO KHÁCH HÀNG (CUSTOMER / GUEST) ================= */
                    <>
                      {/* 2. GIỐNG CÂY TRỒNG */}
                      <div className="space-y-3 pt-1 border-t border-slate-100 dark:border-slate-800">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                            <Sprout className="w-4 h-4 text-emerald-600" /> Giống Cây Trồng
                          </h4>
                          <button
                            onClick={() => setIsAllSeedsModalOpen(true)}
                            className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-0.5"
                          >
                            Xem 12 giống <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* HERO PLANT CARD */}
                        {selectedSeed && (
                          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-50/90 to-teal-50/50 dark:from-emerald-950/40 dark:to-slate-900 border-2 border-emerald-400/80 dark:border-emerald-700 shadow-sm flex items-center gap-4 transition-all">
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

                            <div className="space-y-1.5 flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="px-2 py-0.5 rounded-full text-[11px] font-black bg-emerald-600 text-white shadow-sm flex items-center gap-1">
                                  <Clock className="w-3 h-3" /> {selectedSeed.GrowthDurationDays} ngày/vụ
                                </span>
                                <span className="text-[11px] font-bold text-slate-500">
                                  {selectedSeed.Category}
                                </span>
                              </div>

                              <h5 className="font-black text-sm sm:text-base text-slate-900 dark:text-white leading-tight truncate">
                                {selectedSeed.SeedName}
                              </h5>

                              <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-300">
                                <span>
                                  Năng suất: <strong className="text-slate-900 dark:text-white">~{selectedSeed.ExpectedYieldKgPerM2} kg/m²</strong>
                                </span>
                                <span>•</span>
                                <span>
                                  Hạt giống: <strong className="text-emerald-600 font-bold">{formatVND(selectedSeed.SeedPrice)}</strong>
                                </span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Quick Horizontal Seed Selector */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
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
                      <div className="space-y-2.5 pt-1 border-t border-slate-100 dark:border-slate-800">
                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                          <Package className="w-4 h-4 text-emerald-600" /> Gói Dịch Vụ Chăm Sóc
                        </h4>

                        <div className="grid grid-cols-3 gap-2">
                          {carePackages.map((pkg) => {
                            const isPkgActive = selectedPackage?.PackageId === pkg.PackageId;
                            return (
                              <button
                                key={pkg.PackageId}
                                onClick={() => setSelectedPackage(pkg)}
                                className={`p-2.5 rounded-xl border text-left transition-all ${
                                  isPkgActive
                                    ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 ring-2 ring-emerald-400 shadow-sm'
                                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-extrabold text-slate-800 dark:text-slate-100 truncate block">
                                    {pkg.PackageName.split('(')[0].trim()}
                                  </span>
                                  {isPkgActive && <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                                </div>
                                <span className="text-[11px] font-bold text-emerald-600 block mt-1">
                                  {pkg.MonthlyFee / 1000}k<span className="text-[9px] text-slate-400">/th</span>
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* 4. DỰ TOÁN NÔNG NGHIỆP THÔNG MINH */}
                      <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white space-y-2 shadow-md">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black flex items-center gap-1.5">
                            <Scale className="w-4 h-4 text-emerald-200" /> Dự Toán Nông Nghiệp Thông Minh
                          </span>
                          <span className="text-sm font-black text-emerald-100">
                            ~{yieldEstimations.totalKg} kg rau sạch
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-emerald-100 pt-1 border-t border-white/20">
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
                        <div className="flex items-baseline justify-between">
                          <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                            Tổng chi phí ({pricingSummary.growthDays} ngày / 1 vụ):
                          </span>
                          <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                            {formatVND(pricingSummary.total)}
                          </span>
                        </div>

                        <div className="text-[10px] text-slate-400 text-right">
                          Đất: {formatVND(pricingSummary.plotFee)} • Chăm sóc: {formatVND(pricingSummary.careFee)} • Giống: {formatVND(pricingSummary.seedFee)}
                        </div>

                        <Button
                          variant="primary"
                          size="lg"
                          className="w-full justify-center shadow-xl shadow-emerald-500/25 py-3.5 font-black text-sm"
                          rightIcon={<ArrowRight className="w-4 h-4" />}
                          onClick={handleProceedToCheckout}
                        >
                          Tiếp Tục Đặt Thuê ({pricingSummary.growthDays} ngày)
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

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
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">Bộ Sưu Tập 12 Giống Cây Trồng Chuẩn Hữu Cơ</h3>
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
                  {cat === 'ALL' ? 'Tất cả 12 giống' : cat}
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
                      disabled={p.Status !== 'AVAILABLE'}
                      onClick={() => {
                        setSelectedPlot(p);
                        setIsCompareModalOpen(false);
                      }}
                    >
                      {isSelectedThis ? 'Đang Chọn' : 'Chọn Ô Này'}
                    </Button>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
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
