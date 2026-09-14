'use client';

import React, { useEffect, useState, useMemo } from 'react';
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
  SlidersHorizontal,
  Video,
  Scale,
  Users,
  Utensils,
  ChevronRight,
  X,
  Plus
} from 'lucide-react';
import Header from '@/components/Header';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent } from '@/components/ui/Card';
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
  const { isAuthenticated } = useAuthStore();

  // Data states
  const [areas, setAreas] = useState<FarmArea[]>([]);
  const [selectedAreaId, setSelectedAreaId] = useState<number>(1);
  const [plots, setPlots] = useState<Plot[]>([]);
  const [seeds, setSeeds] = useState<Seed[]>([]);
  const [carePackages, setCarePackages] = useState<CarePackage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // View Mode: 'GRID' | 'LIST'
  const [viewMode, setViewMode] = useState<'GRID' | 'LIST'>('GRID');

  // Compare plots state
  const [comparedPlotIds, setComparedPlotIds] = useState<number[]>([]);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);

  // Selection states
  const [selectedPlot, setSelectedPlot] = useState<Plot | null>(null);
  const [selectedSeed, setSelectedSeed] = useState<Seed | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<CarePackage | null>(null);

  // Filter states
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'AVAILABLE' | 'RENTED'>('ALL');
  const [seedCategoryFilter, setSeedCategoryFilter] = useState<string>('ALL');

  // Active Wizard Step: 1 (Plot) -> 2 (Seed) -> 3 (Package) -> 4 (Summary)
  const [currentStep, setCurrentStep] = useState<number>(1);

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
          setSelectedAreaId(areasRes.data[0].AreaId);
        }

        if (plotsRes.success && plotsRes.data) {
          setPlots(plotsRes.data);
          // Default select first available plot
          const firstAvail = plotsRes.data.find((p: Plot) => p.Status === 'AVAILABLE');
          if (firstAvail) {
            setSelectedPlot(firstAvail);
            if (firstAvail.AreaId) setSelectedAreaId(firstAvail.AreaId);
          }
        }

        if (seedsRes.success && seedsRes.data) {
          setSeeds(seedsRes.data);
          if (seedsRes.data.length > 0) {
            setSelectedSeed(seedsRes.data[0]);
          }
        }

        if (pkgsRes.success && pkgsRes.data) {
          setCarePackages(pkgsRes.data);
          if (pkgsRes.data.length > 1) {
            setSelectedPackage(pkgsRes.data[1]);
          } else if (pkgsRes.data.length > 0) {
            setSelectedPackage(pkgsRes.data[0]);
          }
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
    return filtered;
  }, [plots, selectedAreaId, statusFilter]);

  // Selected Farm Area info
  const currentAreaInfo = useMemo(() => {
    return areas.find((a) => a.AreaId === selectedAreaId) || {
      AreaId: 1,
      AreaCode: 'AREA_A',
      AreaName: 'Khu Rau Ăn Lá Hữu Cơ A',
      SoilType: 'Đất đỏ bazan giàu mùn',
      TotalPlots: 20,
      Description: 'Khu chuyên canh rau ăn lá hữu cơ Đà Lạt'
    };
  }, [areas, selectedAreaId]);

  // Seed categories
  const seedCategories = useMemo(() => {
    const cats = new Set<string>();
    seeds.forEach((s) => {
      if (s.Category) cats.add(s.Category);
    });
    return ['ALL', ...Array.from(cats)];
  }, [seeds]);

  // Filtered seeds
  const filteredSeeds = useMemo(() => {
    if (seedCategoryFilter === 'ALL') return seeds;
    return seeds.filter((s) => s.Category === seedCategoryFilter);
  }, [seeds, seedCategoryFilter]);

  // Handle Select Plot
  const handleSelectPlot = (plot: Plot) => {
    if (plot.Status !== 'AVAILABLE') return;
    setSelectedPlot(plot);
  };

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
      return { totalKg: 0, mealsCount: 0, familyWeeks: 0 };
    }
    const size = selectedPlot.SizeM2 || 15;
    const yieldPerM2 = selectedSeed.ExpectedYieldKgPerM2 || 3;
    const totalKg = Math.round(size * yieldPerM2);
    // Average 4-person family consumes ~3.5kg veggies/week
    const familyWeeks = Math.max(1, Math.round(totalKg / 3.5));
    const mealsCount = Math.round(totalKg / 0.4); // ~400g per family meal
    return { totalKg, mealsCount, familyWeeks };
  }, [selectedPlot, selectedSeed]);

  // Dynamic Day-based Pricing
  const pricingSummary = useMemo(() => {
    const growthDays = selectedSeed?.GrowthDurationDays || 45;
    const plotPriceMonth = selectedPlot?.BasePricePerMonth || 450000;
    const pkgPriceMonth = selectedPackage?.MonthlyFee || 250000;

    const plotFee = Math.round((plotPriceMonth / 30) * growthDays);
    const careFee = Math.round((pkgPriceMonth / 30) * growthDays);
    const seedFee = selectedSeed?.SeedPrice || 45000;
    const total = plotFee + careFee + seedFee;

    return {
      growthDays,
      plotFee,
      careFee,
      seedFee,
      total,
    };
  }, [selectedPlot, selectedSeed, selectedPackage]);

  // Format VND
  const formatVND = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  // Navigate to Checkout
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
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 pb-36">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        {/* Top Breadcrumb & Return */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link href="/">
            <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Về Trang Chủ
            </Button>
          </Link>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" /> Hệ Thống 5 Phân Khu Nông Trại Hữu Cơ Đà Lạt (100 Ô Canh Tác)
            </span>
          </div>
        </div>

        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            Bản Đồ Nông Trại & Chọn Giống Cây Trồng
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
            Lựa chọn 1 trong 5 phân khu chuyên canh, chọn vị trí ô đất đắc địa với Camera IoT góc nhìn 1080p và đồng bộ chu kỳ thuê đất chuẩn xác theo ngày sinh trưởng của cây.
          </p>
        </div>

        {/* Step Wizard Indicator */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <button
            onClick={() => setCurrentStep(1)}
            className={`flex items-center gap-2.5 p-2.5 rounded-xl transition-all text-left ${
              currentStep === 1
                ? 'bg-emerald-500 text-white font-bold shadow-md shadow-emerald-500/20'
                : selectedPlot
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs ${currentStep === 1 ? 'bg-white text-emerald-600' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900'}`}>
              {selectedPlot ? <Check className="w-4 h-4" /> : '1'}
            </div>
            <div className="truncate">
              <p className="text-xs uppercase font-extrabold tracking-wider">Bước 1</p>
              <p className="text-xs truncate">{selectedPlot ? selectedPlot.PlotCode : 'Chọn Ô Đất'}</p>
            </div>
          </button>

          <button
            onClick={() => selectedPlot && setCurrentStep(2)}
            disabled={!selectedPlot}
            className={`flex items-center gap-2.5 p-2.5 rounded-xl transition-all text-left ${
              currentStep === 2
                ? 'bg-emerald-500 text-white font-bold shadow-md shadow-emerald-500/20'
                : selectedSeed
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                : 'text-slate-400 opacity-60 cursor-not-allowed'
            }`}
          >
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs ${currentStep === 2 ? 'bg-white text-emerald-600' : 'bg-slate-200 text-slate-700 dark:bg-slate-800'}`}>
              {selectedSeed && selectedPlot ? <Check className="w-4 h-4" /> : '2'}
            </div>
            <div className="truncate">
              <p className="text-xs uppercase font-extrabold tracking-wider">Bước 2</p>
              <p className="text-xs truncate">{selectedSeed ? selectedSeed.SeedName : 'Chọn Giống Cây'}</p>
            </div>
          </button>

          <button
            onClick={() => selectedPlot && setCurrentStep(3)}
            disabled={!selectedPlot}
            className={`flex items-center gap-2.5 p-2.5 rounded-xl transition-all text-left ${
              currentStep === 3
                ? 'bg-emerald-500 text-white font-bold shadow-md shadow-emerald-500/20'
                : selectedPackage
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                : 'text-slate-400 opacity-60 cursor-not-allowed'
            }`}
          >
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs ${currentStep === 3 ? 'bg-white text-emerald-600' : 'bg-slate-200 text-slate-700 dark:bg-slate-800'}`}>
              {selectedPackage && selectedPlot ? <Check className="w-4 h-4" /> : '3'}
            </div>
            <div className="truncate">
              <p className="text-xs uppercase font-extrabold tracking-wider">Bước 3</p>
              <p className="text-xs truncate">{selectedPackage ? selectedPackage.PackageName.split('(')[0] : 'Gói Chăm Sóc'}</p>
            </div>
          </button>

          <button
            onClick={() => selectedPlot && setCurrentStep(4)}
            disabled={!selectedPlot}
            className={`flex items-center gap-2.5 p-2.5 rounded-xl transition-all text-left ${
              currentStep === 4
                ? 'bg-emerald-500 text-white font-bold shadow-md shadow-emerald-500/20'
                : 'text-slate-400 opacity-60 cursor-not-allowed'
            }`}
          >
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs ${currentStep === 4 ? 'bg-white text-emerald-600' : 'bg-slate-200 text-slate-700 dark:bg-slate-800'}`}>
              4
            </div>
            <div className="truncate">
              <p className="text-xs uppercase font-extrabold tracking-wider">Bước 4</p>
              <p className="text-xs truncate">Tóm Tắt & Thuê</p>
            </div>
          </button>
        </div>

        {/* Loading / Error States */}
        {isLoading && (
          <div className="py-20 text-center space-y-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <Loader2 className="w-10 h-10 animate-spin text-emerald-500 mx-auto" />
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
              Đang tải dữ liệu 5 phân khu và 100 ô đất canh tác...
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

        {/* Main Content when ready */}
        {!isLoading && !error && (
          <div className="space-y-12">
            {/* ========================================================================= */}
            {/* BƯỚC 1: BẢN ĐỒ Ô ĐẤT DẠNG LƯỚI & DANH SÁCH - 5 PHÂN KHU (100 Ô) */}
            {/* ========================================================================= */}
            <div className="space-y-6">
              {/* 5 Farm Areas Switcher Tabs */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-emerald-600" /> Chọn Phân Khu Canh Tác (5 Khu Vực)
                  </h2>
                  <span className="text-xs font-semibold text-slate-500">Mỗi phân khu 20 ô đất</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  {areas.map((area) => {
                    const isAreaActive = area.AreaId === selectedAreaId;
                    const areaPlots = plots.filter((p) => p.AreaId === area.AreaId);
                    const availCount = areaPlots.filter((p) => p.Status === 'AVAILABLE').length;

                    return (
                      <button
                        key={area.AreaId}
                        onClick={() => setSelectedAreaId(area.AreaId)}
                        className={`p-3.5 rounded-2xl text-left border transition-all duration-200 flex flex-col justify-between gap-2.5 ${
                          isAreaActive
                            ? 'bg-emerald-600 text-white border-emerald-500 shadow-lg shadow-emerald-600/20 scale-102 ring-2 ring-emerald-400'
                            : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border-slate-200 dark:border-slate-800 hover:border-emerald-300 hover:bg-emerald-50/50 dark:hover:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className={`px-2 py-0.5 rounded-md text-[11px] font-black tracking-wider ${
                            isAreaActive ? 'bg-white/20 text-white' : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                          }`}>
                            {area.AreaCode}
                          </span>
                          <span className={`text-[11px] font-bold ${isAreaActive ? 'text-emerald-100' : 'text-slate-500'}`}>
                            {availCount}/20 trống
                          </span>
                        </div>

                        <div>
                          <h3 className="font-black text-sm tracking-tight line-clamp-1">{area.AreaName}</h3>
                          <p className={`text-[11px] mt-0.5 line-clamp-1 ${isAreaActive ? 'text-emerald-100' : 'text-slate-500 dark:text-slate-400'}`}>
                            {area.SoilType}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Area Description Banner */}
                <div className="p-4 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-emerald-900 dark:text-emerald-200">
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>
                      <strong className="font-extrabold">{currentAreaInfo.AreaName}:</strong> {currentAreaInfo.Description} ({currentAreaInfo.SoilType})
                    </span>
                  </div>
                  <Badge variant="success" size="sm" className="self-start sm:self-auto flex-shrink-0">
                    Trang bị Camera IoT 100%
                  </Badge>
                </div>
              </div>

              {/* View Mode Toggle & Status Filter */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Hiển thị:</span>
                  <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                    <button
                      onClick={() => setViewMode('GRID')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        viewMode === 'GRID'
                          ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-sm'
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      <LayoutGrid className="w-3.5 h-3.5" /> Bản Đồ Lưới (5x4)
                    </button>
                    <button
                      onClick={() => setViewMode('LIST')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        viewMode === 'LIST'
                          ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-sm'
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      <ListFilter className="w-3.5 h-3.5" /> Danh Sách Chi Tiết
                    </button>
                  </div>
                </div>

                {/* Filter and Compare status */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-slate-500 mr-1">Trạng thái:</span>
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
                    Còn trống ({plots.filter((p) => p.AreaId === selectedAreaId && p.Status === 'AVAILABLE').length})
                  </button>
                  <button
                    onClick={() => setStatusFilter('RENTED')}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                      statusFilter === 'RENTED'
                        ? 'bg-slate-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'
                    }`}
                  >
                    Đang thuê ({plots.filter((p) => p.AreaId === selectedAreaId && p.Status === 'RENTED').length})
                  </button>

                  {comparedPlotIds.length > 0 && (
                    <button
                      onClick={() => setIsCompareModalOpen(true)}
                      className="ml-auto inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500 text-white shadow-sm hover:bg-amber-600 animate-pulse"
                    >
                      <Scale className="w-3.5 h-3.5" /> Đối chiếu ({comparedPlotIds.length}/3)
                    </button>
                  )}
                </div>
              </div>

              {/* Grid / List Layout Container */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left: 20 Plots (Grid 5x4 or List Table) */}
                <div className="lg:col-span-8 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <Compass className="w-3.5 h-3.5 text-emerald-600" /> Sơ đồ phân khu: 4 Hàng x 5 Cột (20 Ô đất chuẩn)
                    </span>
                    <span className="text-[11px] text-slate-400">Nhấn biểu tượng ⚖ để so sánh</span>
                  </div>

                  {viewMode === 'GRID' ? (
                    /* 20 Plots Grid Layout (5 columns x 4 rows) */
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
                      {currentAreaPlots.map((plot) => {
                        const isSelected = selectedPlot?.PlotId === plot.PlotId;
                        const isAvailable = plot.Status === 'AVAILABLE';
                        const isCompared = comparedPlotIds.includes(plot.PlotId);

                        return (
                          <div
                            key={plot.PlotId}
                            onClick={() => handleSelectPlot(plot)}
                            className={`relative p-3 rounded-2xl flex flex-col items-center justify-between text-center transition-all duration-300 select-none ${
                              isSelected
                                ? 'bg-gradient-to-br from-emerald-600 to-teal-600 text-white shadow-xl shadow-emerald-500/30 ring-4 ring-emerald-400 scale-102 z-10'
                                : isAvailable
                                ? 'bg-white dark:bg-slate-800/90 text-slate-800 dark:text-slate-100 border-2 border-emerald-300 dark:border-emerald-700 hover:border-emerald-500 hover:shadow-md cursor-pointer'
                                : 'bg-slate-100 dark:bg-slate-800/40 text-slate-400 dark:text-slate-600 border border-slate-200 dark:border-slate-800 cursor-not-allowed opacity-60'
                            }`}
                          >
                            {/* Compare Checkbox Button */}
                            <button
                              title="Thêm vào danh sách so sánh"
                              onClick={(e) => toggleComparePlot(plot.PlotId, e)}
                              className={`absolute top-1.5 left-1.5 w-5 h-5 rounded-md flex items-center justify-center text-[10px] transition-all ${
                                isCompared
                                  ? 'bg-amber-400 text-amber-950 font-bold shadow'
                                  : isSelected
                                  ? 'bg-white/20 text-white hover:bg-white/30'
                                  : 'bg-slate-100 dark:bg-slate-700 text-slate-400 hover:text-slate-700 hover:bg-slate-200'
                              }`}
                            >
                              <Scale className="w-3 h-3" />
                            </button>

                            {/* Selected Checkmark */}
                            {isSelected && (
                              <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-emerald-400 text-emerald-950 flex items-center justify-center shadow font-black text-xs">
                                ✓
                              </span>
                            )}

                            {/* Camera Icon indicator */}
                            <div className="w-full flex justify-end">
                              <span title={`Camera: ${plot.CameraCode || 'CAM'}`} className={`text-[10px] flex items-center gap-0.5 ${
                                isSelected ? 'text-emerald-100' : 'text-slate-400 dark:text-slate-500'
                              }`}>
                                <Video className="w-3 h-3" />
                              </span>
                            </div>

                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center mt-1 ${
                              isSelected
                                ? 'bg-white/20 text-white'
                                : isAvailable
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-slate-200 text-slate-500 dark:bg-slate-800'
                            }`}>
                              <Sprout className="w-4 h-4" />
                            </div>

                            <div className="space-y-0.5 my-1">
                              <span className="font-black text-xs sm:text-sm block tracking-tight">
                                {plot.PlotCode}
                              </span>
                              <span className={`text-[10px] block font-semibold ${isSelected ? 'text-emerald-100' : 'text-slate-500 dark:text-slate-400'}`}>
                                {plot.SizeM2} m² • pH {plot.SoilPH}
                              </span>
                            </div>

                            <div className="pt-1 border-t border-current/10 w-full">
                              <span className={`text-[10px] font-bold block ${
                                isSelected
                                  ? 'text-white'
                                  : isAvailable
                                  ? 'text-emerald-600 dark:text-emerald-400'
                                  : 'text-slate-400'
                              }`}>
                                {isAvailable ? `${plot.BasePricePerMonth / 1000}k/tháng` : plot.Status}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    /* 20 Plots List Table View */
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                            <th className="py-2.5 px-3">So sánh</th>
                            <th className="py-2.5 px-3">Mã Ô</th>
                            <th className="py-2.5 px-3">Vị Trí</th>
                            <th className="py-2.5 px-3">Diện Tích</th>
                            <th className="py-2.5 px-3">Chất Đất / pH</th>
                            <th className="py-2.5 px-3">Camera</th>
                            <th className="py-2.5 px-3">Giá Thuê</th>
                            <th className="py-2.5 px-3">Trạng Thái</th>
                            <th className="py-2.5 px-3 text-right">Thao Tác</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                          {currentAreaPlots.map((plot) => {
                            const isSelected = selectedPlot?.PlotId === plot.PlotId;
                            const isAvailable = plot.Status === 'AVAILABLE';
                            const isCompared = comparedPlotIds.includes(plot.PlotId);

                            return (
                              <tr
                                key={plot.PlotId}
                                className={`transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40 ${
                                  isSelected ? 'bg-emerald-50/80 dark:bg-emerald-950/30' : ''
                                }`}
                              >
                                <td className="py-2.5 px-3">
                                  <button
                                    onClick={(e) => toggleComparePlot(plot.PlotId, e)}
                                    className={`p-1 rounded-md text-[10px] ${
                                      isCompared
                                        ? 'bg-amber-400 text-amber-950 font-bold'
                                        : 'text-slate-400 hover:text-slate-700'
                                    }`}
                                  >
                                    <Scale className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                                <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">
                                  {plot.PlotCode}
                                </td>
                                <td className="py-2.5 px-3 text-slate-500">
                                  Hàng {plot.RowNum}, Cột {plot.ColNum}
                                </td>
                                <td className="py-2.5 px-3 font-semibold">{plot.SizeM2} m²</td>
                                <td className="py-2.5 px-3">
                                  pH {plot.SoilPH} • {plot.StandardHumidity}% ẩm
                                </td>
                                <td className="py-2.5 px-3">
                                  <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                                    <Video className="w-3 h-3" /> {plot.CameraCode || 'CAM'}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 font-bold text-emerald-600 dark:text-emerald-400">
                                  {formatVND(plot.BasePricePerMonth)}/tháng
                                </td>
                                <td className="py-2.5 px-3">
                                  <Badge variant={isAvailable ? 'success' : 'neutral'} size="sm">
                                    {isAvailable ? 'TRỐNG' : plot.Status}
                                  </Badge>
                                </td>
                                <td className="py-2.5 px-3 text-right">
                                  <Button
                                    size="sm"
                                    variant={isSelected ? 'primary' : 'outline'}
                                    disabled={!isAvailable}
                                    onClick={() => handleSelectPlot(plot)}
                                  >
                                    {isSelected ? 'Đang Chọn' : 'Chọn Ô'}
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

                {/* Right: Selected Plot Details Card */}
                <div className="lg:col-span-4 space-y-4">
                  {selectedPlot ? (
                    <Card className="border-2 border-emerald-500 bg-white dark:bg-slate-900 rounded-3xl shadow-xl shadow-emerald-500/10 p-6 space-y-5 animate-fade-in">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-black text-xl shadow-md shadow-emerald-500/20">
                            {selectedPlot.PlotCode.slice(-3)}
                          </div>
                          <div>
                            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Ô Đất Đang Chọn</span>
                            <h3 className="text-xl font-black text-slate-900 dark:text-white">{selectedPlot.PlotCode}</h3>
                          </div>
                        </div>
                        <Badge variant="success" size="sm">SẴN SÀNG THUÊ</Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700">
                          <span className="text-slate-500 font-semibold block">Phân khu:</span>
                          <span className="text-xs font-extrabold text-slate-900 dark:text-white line-clamp-1">{currentAreaInfo.AreaName}</span>
                        </div>
                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700">
                          <span className="text-slate-500 font-semibold block">Diện tích:</span>
                          <span className="text-sm font-extrabold text-slate-900 dark:text-white">{selectedPlot.SizeM2} m² đất sạch</span>
                        </div>
                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700">
                          <span className="text-slate-500 font-semibold block">Độ pH đất:</span>
                          <span className="text-sm font-extrabold text-slate-900 dark:text-white">{selectedPlot.SoilPH} (Đạt chuẩn)</span>
                        </div>
                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700">
                          <span className="text-slate-500 font-semibold block">Độ ẩm chuẩn:</span>
                          <span className="text-sm font-extrabold text-slate-900 dark:text-white">{selectedPlot.StandardHumidity}% ẩm</span>
                        </div>
                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700">
                          <span className="text-slate-500 font-semibold block">Camera IoT:</span>
                          <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <Video className="w-3 h-3" /> {selectedPlot.CameraCode || 'CAM_ONLINE'}
                          </span>
                        </div>
                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700">
                          <span className="text-slate-500 font-semibold block">Giá thuê tháng:</span>
                          <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">{formatVND(selectedPlot.BasePricePerMonth)}</span>
                        </div>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-xs text-emerald-800 dark:text-emerald-300 space-y-1">
                        <p className="font-bold flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-emerald-600" /> Cam kết thổ nhưỡng chuẩn VietGAP
                        </p>
                        <p className="leading-relaxed">
                          Đất hữu cơ giàu mùn vi sinh, đã khử khuẩn và bón lót phân trùn quế, sẵn sàng gieo trồng ngay.
                        </p>
                      </div>

                      <Button
                        variant="primary"
                        className="w-full justify-center shadow-lg shadow-emerald-500/20"
                        rightIcon={<ArrowRight className="w-4 h-4" />}
                        onClick={() => setCurrentStep(2)}
                      >
                        Tiếp Tục: Chọn Giống Cây Trồng
                      </Button>
                    </Card>
                  ) : (
                    <div className="p-8 text-center space-y-3 bg-white dark:bg-slate-900 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                      <Compass className="w-8 h-8 text-slate-400 mx-auto" />
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Chưa chọn ô đất</p>
                      <p className="text-xs text-slate-500">Vui lòng nhấp vào một ô màu xanh lá trên bản đồ để xem thông số và đặt giữ chỗ.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ========================================================================= */}
            {/* BƯỚC 2: CHỌN 1 TRONG 12 GIỐNG CÂY TRỒNG & GẮN LIỀN CHU KỲ VỤ */}
            {/* ========================================================================= */}
            <div className="space-y-6 pt-6 border-t border-slate-200 dark:border-slate-800">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Bước 2 / 4</span>
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <Sprout className="w-6 h-6 text-emerald-600" /> 12 Giống Cây Trồng Chuẩn Hữu Cơ Đà Lạt
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
                    Thời gian sinh trưởng của cây trồng quyết định chính xác số ngày thuê đất tương ứng (không ép thuê tròn tháng).
                  </p>
                </div>

                {/* Category Filter */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-2 sm:pb-0">
                  {seedCategories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSeedCategoryFilter(cat)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                        seedCategoryFilter === cat
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {cat === 'ALL' ? 'Tất cả 12 giống' : cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* 12 Seeds Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredSeeds.map((seed) => {
                  const isSelected = selectedSeed?.SeedId === seed.SeedId;

                  return (
                    <div
                      key={seed.SeedId}
                      onClick={() => setSelectedSeed(seed)}
                      className={`group relative rounded-3xl p-5 border-2 transition-all duration-300 flex flex-col justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-white dark:bg-slate-900 border-emerald-500 shadow-xl shadow-emerald-500/15 ring-2 ring-emerald-400 scale-101'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-emerald-300 hover:shadow-md'
                      }`}
                    >
                      {/* Growth Duration Tag */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          <Clock className="w-3 h-3 text-emerald-600" /> {seed.GrowthDurationDays} ngày/vụ
                        </span>

                        <span className="text-[11px] font-bold text-slate-500">
                          {seed.Category}
                        </span>
                      </div>

                      {/* Seed Title & Yield */}
                      <div className="space-y-1.5">
                        <h3 className="text-base font-black text-slate-900 dark:text-white group-hover:text-emerald-600 transition-colors">
                          {seed.SeedName}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                          {seed.Description}
                        </p>
                      </div>

                      {/* Specs */}
                      <div className="grid grid-cols-2 gap-2 my-4 text-xs">
                        <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700">
                          <span className="text-[10px] text-slate-500 block">Năng suất:</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">~{seed.ExpectedYieldKgPerM2} kg/m²</span>
                        </div>
                        <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700">
                          <span className="text-[10px] text-slate-500 block">Tiền hạt giống:</span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatVND(seed.SeedPrice)}</span>
                        </div>
                      </div>

                      {/* Selection Footer */}
                      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                          Thuê theo vụ: <strong className="text-emerald-600">{seed.GrowthDurationDays} ngày</strong>
                        </span>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                          isSelected ? 'bg-emerald-500 text-white' : 'border border-slate-300 text-transparent'
                        }`}>
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* ========================================================================= */}
              {/* YIELD & FAMILY BASKET ESTIMATOR (DỰ TOÁN SẢN LƯỢNG & GIỎ RAU GIA ĐÌNH) */}
              {/* ========================================================================= */}
              {selectedPlot && selectedSeed && (
                <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-xl shadow-emerald-600/15 space-y-4 animate-fade-in">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-black bg-white/20 text-white">
                        <Scale className="w-3.5 h-3.5" /> Dự Toán Nông Nghiệp Thông Minh
                      </span>
                      <h3 className="text-xl font-black">
                        Dự Tính Sản Lượng Thu Hoạch: Ô {selectedPlot.PlotCode} ({selectedPlot.SizeM2}m²) + {selectedSeed.SeedName}
                      </h3>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-xs text-emerald-100 font-semibold block">Sản lượng dự kiến</span>
                        <span className="text-3xl font-black text-white">~{yieldEstimations.totalKg} kg</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-2 border-t border-white/20">
                    <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center gap-3">
                      <Utensils className="w-6 h-6 text-emerald-200 flex-shrink-0" />
                      <div>
                        <span className="text-emerald-100 font-semibold block">Bữa ăn gia đình:</span>
                        <strong className="text-sm font-extrabold text-white">Đủ cho ~{yieldEstimations.mealsCount} bữa ăn tươi ngon</strong>
                      </div>
                    </div>

                    <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center gap-3">
                      <Users className="w-6 h-6 text-emerald-200 flex-shrink-0" />
                      <div>
                        <span className="text-emerald-100 font-semibold block">Nhu cầu gia đình 4 người:</span>
                        <strong className="text-sm font-extrabold text-white">Cung ứng liên tục ~{yieldEstimations.familyWeeks} tuần</strong>
                      </div>
                    </div>

                    <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center gap-3">
                      <Sparkles className="w-6 h-6 text-emerald-200 flex-shrink-0" />
                      <div>
                        <span className="text-emerald-100 font-semibold block">Chu kỳ vụ gieo trồng:</span>
                        <strong className="text-sm font-extrabold text-white">{selectedSeed.GrowthDurationDays} ngày là thu hoạch</strong>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ========================================================================= */}
            {/* BƯỚC 3: CHỌN GÓI DỊCH VỤ CHĂM SÓC NÔNG DÂN */}
            {/* ========================================================================= */}
            <div className="space-y-6 pt-6 border-t border-slate-200 dark:border-slate-800">
              <div>
                <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Bước 3 / 4</span>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Package className="w-6 h-6 text-emerald-600" /> Chọn Gói Dịch Vụ Chăm Sóc Nông Trại
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
                  Đội ngũ kỹ sư & nông dân chuyên nghiệp trực tiếp chăm bón, tưới nước và gửi báo cáo nhật ký canh tác hàng tuần.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {carePackages.map((pkg) => {
                  const isSelected = selectedPackage?.PackageId === pkg.PackageId;
                  const isPro = pkg.PackageName.includes('Pro') || pkg.PackageName.includes('Hữu Cơ');

                  return (
                    <div
                      key={pkg.PackageId}
                      onClick={() => setSelectedPackage(pkg)}
                      className={`relative rounded-3xl p-6 border-2 transition-all duration-300 flex flex-col justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-white dark:bg-slate-900 border-emerald-500 shadow-xl shadow-emerald-500/15 ring-2 ring-emerald-400 scale-102'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-emerald-300 hover:shadow-md'
                      }`}
                    >
                      {isPro && (
                        <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[11px] font-black bg-emerald-600 text-white shadow-md uppercase tracking-wider">
                          ĐƯỢC CHỌN NHIỀU NHẤT
                        </span>
                      )}

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-black text-slate-900 dark:text-white">
                            {pkg.PackageName}
                          </h3>
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                            isSelected ? 'bg-emerald-500 text-white' : 'border border-slate-300 text-transparent'
                          }`}>
                            <Check className="w-3.5 h-3.5" />
                          </div>
                        </div>

                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {pkg.Description}
                        </p>

                        <div className="py-2 border-y border-slate-100 dark:border-slate-800">
                          <span className="text-xs text-slate-500 block">Đơn giá chăm sóc:</span>
                          <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                            {formatVND(pkg.MonthlyFee)}
                            <span className="text-xs font-semibold text-slate-500">/tháng</span>
                          </span>
                          <span className="text-[11px] text-slate-400 block mt-0.5">
                            (~{formatVND(Math.round((pkg.MonthlyFee / 30) * (selectedSeed?.GrowthDurationDays || 45)))} theo vụ {selectedSeed?.GrowthDurationDays || 45} ngày)
                          </span>
                        </div>

                        <div className="space-y-2 pt-2">
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">Dịch vụ bao gồm:</span>
                          {pkg.ServicesIncluded.split(';').map((svc, i) => (
                            <div key={i} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300">
                              <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                              <span>{svc.trim()}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <Button
                        variant={isSelected ? 'primary' : 'outline'}
                        size="sm"
                        className="w-full mt-6 justify-center"
                      >
                        {isSelected ? 'Đang Chọn Gói Này' : 'Chọn Gói Này'}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </main>

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
              <Button
                variant="outline"
                size="sm"
                onClick={() => setComparedPlotIds([])}
              >
                Xóa Hết So Sánh
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsCompareModalOpen(false)}
              >
                Đóng Bảng So Sánh
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STICKY BOTTOM ACTION BAR (TÍNH TOÁN THEO NGÀY CHU KỲ VỤ) */}
      {/* ========================================================================= */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 py-3.5 px-4 shadow-2xl">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Selected Summary Items */}
          <div className="flex items-center gap-4 flex-wrap text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-500">Ô đất:</span>
              <strong className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-black">
                {selectedPlot ? `${selectedPlot.PlotCode} (${selectedPlot.SizeM2}m²)` : 'Chưa chọn'}
              </strong>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-500">Cây trồng:</span>
              <strong className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-black">
                {selectedSeed ? `${selectedSeed.SeedName} (${pricingSummary.growthDays} ngày/vụ)` : 'Chưa chọn'}
              </strong>
            </div>

            <div className="hidden lg:flex items-center gap-2">
              <span className="text-slate-500">Gói chăm sóc:</span>
              <strong className="font-bold text-slate-700 dark:text-slate-300">
                {selectedPackage ? selectedPackage.PackageName.split('(')[0] : 'Chưa chọn'}
              </strong>
            </div>
          </div>

          {/* Pricing & CTA */}
          <div className="flex items-center gap-5 w-full md:w-auto justify-between md:justify-end">
            <div className="text-right">
              <div className="flex items-baseline gap-1.5 justify-end">
                <span className="text-xs text-slate-500">Tổng phí (1 vụ {pricingSummary.growthDays} ngày):</span>
                <span className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
                  {formatVND(pricingSummary.total)}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 block">
                Đất: {formatVND(pricingSummary.plotFee)} • Chăm sóc: {formatVND(pricingSummary.careFee)} • Giống: {formatVND(pricingSummary.seedFee)}
              </span>
            </div>

            <Button
              variant="primary"
              size="lg"
              className="px-6 shadow-xl shadow-emerald-500/25 whitespace-nowrap"
              rightIcon={<ArrowRight className="w-5 h-5" />}
              onClick={handleProceedToCheckout}
              disabled={!selectedPlot || !selectedSeed || !selectedPackage}
            >
              Tiếp Tục Đặt Thuê
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
