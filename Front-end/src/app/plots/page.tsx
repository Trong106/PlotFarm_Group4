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
  CheckCircle
} from 'lucide-react';
import Header from '@/components/Header';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent } from '@/components/ui/Card';
import { useAuthStore } from '@/store/useAuthStore';

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
  const [plots, setPlots] = useState<Plot[]>([]);
  const [seeds, setSeeds] = useState<Seed[]>([]);
  const [carePackages, setCarePackages] = useState<CarePackage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Selection states
  const [selectedPlot, setSelectedPlot] = useState<Plot | null>(null);
  const [selectedSeed, setSelectedSeed] = useState<Seed | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<CarePackage | null>(null);

  // Filter states
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'AVAILABLE' | 'RENTED'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  // Active Wizard Step: 1 (Plot) -> 2 (Seed) -> 3 (Package) -> 4 (Summary)
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const [plotsRes, seedsRes, pkgsRes] = await Promise.all([
          fetch('http://localhost:5000/api/plots/grid').then((r) => r.json()),
          fetch('http://localhost:5000/api/seeds').then((r) => r.json()),
          fetch('http://localhost:5000/api/seeds/packages').then((r) => r.json()),
        ]);

        if (plotsRes.success && plotsRes.data) {
          setPlots(plotsRes.data);
        }
        if (seedsRes.success && seedsRes.data) {
          setSeeds(seedsRes.data);
          // Default select first seed
          if (seedsRes.data.length > 0) {
            setSelectedSeed(seedsRes.data[0]);
          }
        }
        if (pkgsRes.success && pkgsRes.data) {
          setCarePackages(pkgsRes.data);
          // Default select organic pro (second package)
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

  // Filtered plots
  const filteredPlots = useMemo(() => {
    if (statusFilter === 'ALL') return plots;
    if (statusFilter === 'AVAILABLE') return plots.filter((p) => p.Status === 'AVAILABLE');
    if (statusFilter === 'RENTED') return plots.filter((p) => p.Status === 'RENTED');
    return plots;
  }, [plots, statusFilter]);

  // Filtered seeds
  const filteredSeeds = useMemo(() => {
    if (categoryFilter === 'ALL') return seeds;
    return seeds.filter((s) => s.Category === categoryFilter);
  }, [seeds, categoryFilter]);

  // Categories list
  const seedCategories = useMemo(() => {
    const cats = Array.from(new Set(seeds.map((s) => s.Category))).filter(Boolean);
    return ['ALL', ...cats];
  }, [seeds]);

  // Handle plot click
  const handleSelectPlot = (plot: Plot) => {
    if (plot.Status !== 'AVAILABLE') return;
    setSelectedPlot(plot);
    // Smooth auto advance to step 2 if still on step 1
    if (currentStep === 1) {
      setCurrentStep(2);
    }
  };

  // Pricing calculations
  const plotPrice = selectedPlot?.BasePricePerMonth || 0;
  const seedPrice = selectedSeed?.SeedPrice || 0;
  const packagePrice = selectedPackage?.MonthlyFee || 0;
  const totalPrice = plotPrice + seedPrice + packagePrice;

  const formatVND = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col font-sans transition-colors duration-300">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Top Breadcrumb & Return */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link href="/">
            <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Về Trang Chủ
            </Button>
          </Link>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" /> Nông Trại Hữu Cơ Đà Lạt A
            </span>
          </div>
        </div>

        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            Bản Đồ Nông Trại & Chọn Giống Cây Trồng
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
            Lựa chọn vị trí ô đất đắc địa trên bản đồ lưới trực quan, chọn hạt giống rau bạn yêu thích và bắt đầu hành trình canh tác thông minh ngay hôm nay.
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
              Đang tải dữ liệu bản đồ ô đất và giống cây trồng...
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
            {/* BƯỚC 1: BẢN ĐỒ Ô ĐẤT DẠNG LƯỚI (GRID MAP) */}
            {/* ========================================================================= */}
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 flex items-center justify-center">
                      <Layers className="w-4 h-4" />
                    </span>
                    Bản Đồ Nông Trại: Chọn Ô Đất (3 Hàng × 5 Cột)
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Nhấp vào một ô màu xanh lá còn trống để chọn ô đất canh tác của bạn
                  </p>
                </div>

                {/* Filter and Legend */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-slate-500 uppercase mr-1">Lọc:</span>
                  <button
                    onClick={() => setStatusFilter('ALL')}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                      statusFilter === 'ALL'
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                  >
                    Tất cả ({plots.length})
                  </button>
                  <button
                    onClick={() => setStatusFilter('AVAILABLE')}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                      statusFilter === 'AVAILABLE'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    }`}
                  >
                    Còn trống ({plots.filter((p) => p.Status === 'AVAILABLE').length})
                  </button>
                  <button
                    onClick={() => setStatusFilter('RENTED')}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                      statusFilter === 'RENTED'
                        ? 'bg-slate-600 text-white'
                        : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                  >
                    Đã thuê ({plots.filter((p) => p.Status === 'RENTED').length})
                  </button>
                </div>
              </div>

              {/* Status Color Legend */}
              <div className="flex flex-wrap items-center gap-4 text-xs font-semibold bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 font-bold uppercase tracking-wider">Chú thích trạng thái:</span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded-md bg-emerald-500 ring-2 ring-emerald-200" /> Còn trống (Có thể thuê)
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded-md bg-slate-300 dark:bg-slate-700" /> Đã có người thuê
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded-md bg-amber-400" /> Đang giữ chỗ
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded-md bg-orange-400" /> Đang cải tạo đất
                </span>
              </div>

              {/* Grid 3x5 Map Display */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                <div className="lg:col-span-8 bg-gradient-to-b from-emerald-50/40 via-white to-emerald-50/20 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 p-6 sm:p-8 rounded-3xl border border-emerald-200 dark:border-slate-800 shadow-sm space-y-4">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider pb-2 border-b border-emerald-100 dark:border-slate-800">
                    <span>Sơ Đồ Khu Đất A - Hướng Đón Nắng Tự Nhiên</span>
                    <span>15 Ô Canh Tác Hữu Cơ</span>
                  </div>

                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-3.5 sm:gap-4">
                    {filteredPlots.map((plot) => {
                      const isSelected = selectedPlot?.PlotId === plot.PlotId;
                      const isAvailable = plot.Status === 'AVAILABLE';

                      return (
                        <button
                          key={plot.PlotId}
                          onClick={() => handleSelectPlot(plot)}
                          disabled={!isAvailable}
                          className={`relative p-4 rounded-2xl flex flex-col items-center justify-center gap-2 text-center transition-all duration-300 ${
                            isSelected
                              ? 'bg-gradient-to-br from-emerald-600 to-teal-600 text-white shadow-xl shadow-emerald-500/30 ring-4 ring-emerald-400 scale-105 z-10'
                              : isAvailable
                              ? 'bg-white dark:bg-slate-800/90 text-slate-800 dark:text-slate-100 border-2 border-emerald-300 dark:border-emerald-700 hover:border-emerald-500 hover:shadow-md hover:scale-102 cursor-pointer'
                              : plot.Status === 'RENTED'
                              ? 'bg-slate-100 dark:bg-slate-800/40 text-slate-400 dark:text-slate-600 border border-slate-200 dark:border-slate-800 cursor-not-allowed opacity-60'
                              : 'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-500 border border-amber-300 dark:border-amber-800/40 cursor-not-allowed opacity-75'
                          }`}
                        >
                          {isSelected && (
                            <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-emerald-400 text-emerald-950 flex items-center justify-center shadow font-black text-xs">
                              ✓
                            </span>
                          )}

                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                            isSelected
                              ? 'bg-white/20 text-white'
                              : isAvailable
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-slate-200 text-slate-500 dark:bg-slate-800'
                          }`}>
                            <Sprout className="w-5 h-5" />
                          </div>

                          <div className="space-y-0.5">
                            <span className="font-black text-sm block tracking-tight">
                              {plot.PlotCode}
                            </span>
                            <span className={`text-[11px] block font-semibold ${isSelected ? 'text-emerald-100' : 'text-slate-500 dark:text-slate-400'}`}>
                              {plot.SizeM2} m²
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
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Selected Plot Detail Card */}
                <div className="lg:col-span-4 space-y-4">
                  {selectedPlot ? (
                    <Card className="border-2 border-emerald-500 bg-white dark:bg-slate-900 rounded-3xl shadow-xl shadow-emerald-500/10 p-6 space-y-5 animate-fade-in">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-black text-xl shadow-md shadow-emerald-500/20">
                            {selectedPlot.PlotCode.slice(-3)}
                          </div>
                          <div>
                            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Ô Đất Đã Chọn</span>
                            <h3 className="text-xl font-black text-slate-900 dark:text-white">{selectedPlot.PlotCode}</h3>
                          </div>
                        </div>
                        <Badge variant="success" size="sm">SẴN SÀNG THUÊ</Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs">
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
                          <span className="text-slate-500 font-semibold block">Giá thuê đất:</span>
                          <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">{formatVND(selectedPlot.BasePricePerMonth)}/tháng</span>
                        </div>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-xs text-emerald-800 dark:text-emerald-300 space-y-1">
                        <p className="font-bold flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-emerald-600" /> Cam kết chất lượng đất
                        </p>
                        <p className="leading-relaxed">
                          Đất đỏ bazan giàu mùn, đã xử lý tiệt trùng mầm bệnh, sẵn sàng gieo hạt ngay sau khi hoàn tất đăng ký.
                        </p>
                      </div>

                      <Button
                        variant="primary"
                        size="md"
                        onClick={() => setCurrentStep(2)}
                        rightIcon={<ArrowRight className="w-4 h-4" />}
                        className="w-full font-bold shadow-md shadow-emerald-500/20"
                      >
                        Tiếp Tục: Chọn Giống Cây Trồng
                      </Button>
                    </Card>
                  ) : (
                    <div className="h-full min-h-[300px] border-2 border-dashed border-slate-300 dark:border-slate-800 rounded-3xl p-8 flex flex-col items-center justify-center text-center space-y-3 bg-white/50 dark:bg-slate-900/50">
                      <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center">
                        <Compass className="w-7 h-7" />
                      </div>
                      <h4 className="font-black text-base text-slate-800 dark:text-slate-200">Chưa Chọn Ô Đất Nào</h4>
                      <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
                        Hãy nhấp vào một trong các ô màu xanh lá trên bản đồ để xem chi tiết thông số thổ nhưỡng và giá thuê.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ========================================================================= */}
            {/* BƯỚC 2: CHỌN GIỐNG CÂY TRỒNG (SEEDS / CROPS SELECTION) */}
            {/* ========================================================================= */}
            <div className={`space-y-6 pt-6 transition-all duration-300 ${!selectedPlot ? 'opacity-50 pointer-events-none' : ''}`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-xl bg-teal-100 text-teal-700 dark:bg-teal-950 flex items-center justify-center">
                      <Sprout className="w-4 h-4" />
                    </span>
                    Chọn Giống Cây Trồng Cho Ô Đất {selectedPlot ? selectedPlot.PlotCode : ''}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Các loại hạt giống thuần F1 chọn lọc kỹ lưỡng, phù hợp khí hậu Đà Lạt
                  </p>
                </div>

                {/* Category Filters */}
                <div className="flex flex-wrap items-center gap-2">
                  {seedCategories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setCategoryFilter(cat)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                        categoryFilter === cat
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {cat === 'ALL' ? 'Tất cả giống rau' : cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Seed Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredSeeds.map((seed) => {
                  const isSelected = selectedSeed?.SeedId === seed.SeedId;

                  return (
                    <div
                      key={seed.SeedId}
                      onClick={() => setSelectedSeed(seed)}
                      className={`group rounded-3xl overflow-hidden bg-white dark:bg-slate-900 border-2 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-xl ${
                        isSelected
                          ? 'border-emerald-500 ring-4 ring-emerald-500/20 shadow-emerald-500/10 scale-102'
                          : 'border-slate-200 dark:border-slate-800 hover:border-emerald-300'
                      }`}
                    >
                      {/* Crop Image */}
                      <div className="relative h-44 w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                        <img
                          src={seed.ImageUrl}
                          alt={seed.SeedName}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute top-3 left-3">
                          <Badge variant="neutral" size="sm" className="bg-white/90 dark:bg-slate-900/90 text-slate-800 dark:text-slate-200 font-bold backdrop-blur-sm">
                            {seed.Category}
                          </Badge>
                        </div>
                        {isSelected && (
                          <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-black shadow-lg">
                            <Check className="w-5 h-5" />
                          </div>
                        )}
                        <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-full bg-black/60 text-white text-xs font-bold backdrop-blur-sm flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-amber-400" />
                          <span>{seed.GrowthDurationDays} ngày thu hoạch</span>
                        </div>
                      </div>

                      {/* Seed Info */}
                      <div className="p-5 space-y-4">
                        <div>
                          <h3 className="font-extrabold text-lg text-slate-900 dark:text-white group-hover:text-emerald-600 transition-colors">
                            {seed.SeedName}
                          </h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                            {seed.Description}
                          </p>
                        </div>

                        {/* Metrics */}
                        <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
                          <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                            <span className="text-slate-400 block font-medium">Sản lượng dự kiến:</span>
                            <span className="font-extrabold text-slate-800 dark:text-slate-200">
                              {seed.ExpectedYieldKgPerM2 * (selectedPlot?.SizeM2 || 10)} kg / vụ
                            </span>
                          </div>
                          <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                            <span className="text-slate-400 block font-medium">Giá hạt giống:</span>
                            <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                              {formatVND(seed.SeedPrice)}
                            </span>
                          </div>
                        </div>

                        <Button
                          variant={isSelected ? 'primary' : 'outline'}
                          size="sm"
                          className="w-full font-bold"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedSeed(seed);
                            setCurrentStep(3);
                          }}
                        >
                          {isSelected ? '✓ Đã Chọn Giống Này' : 'Chọn Giống Này'}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ========================================================================= */}
            {/* BƯỚC 3: CHỌN GÓI DỊCH VỤ CHĂM SÓC (CARE PACKAGES) */}
            {/* ========================================================================= */}
            <div className={`space-y-6 pt-6 transition-all duration-300 ${!selectedPlot ? 'opacity-50 pointer-events-none' : ''}`}>
              <div className="pb-2 border-b border-slate-200 dark:border-slate-800">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-xl bg-cyan-100 text-cyan-700 dark:bg-cyan-950 flex items-center justify-center">
                    <Package className="w-4 h-4" />
                  </span>
                  Chọn Gói Dịch Vụ Kỹ Thuật Viên Chăm Sóc
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Đội ngũ kỹ sư nông nghiệp PlotFarm trực tiếp chăm sóc, bắt sâu, bón phân hữu cơ và cập nhật nhật ký
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {carePackages.map((pkg, idx) => {
                  const isSelected = selectedPackage?.PackageId === pkg.PackageId;
                  const isPopular = idx === 1; // Organic Pro is popular

                  return (
                    <div
                      key={pkg.PackageId}
                      onClick={() => setSelectedPackage(pkg)}
                      className={`relative p-6 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border-2 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-xl flex flex-col justify-between space-y-6 ${
                        isSelected
                          ? 'border-emerald-500 ring-4 ring-emerald-500/20 shadow-emerald-500/10 scale-102'
                          : isPopular
                          ? 'border-emerald-300 dark:border-emerald-700/60'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                      }`}
                    >
                      {isPopular && (
                        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                          <span className="px-3.5 py-1 rounded-full bg-gradient-to-r from-emerald-600 to-teal-500 text-white text-xs font-black uppercase tracking-wider shadow-md">
                            Khuyên Dùng Nhiều Nhất
                          </span>
                        </div>
                      )}

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-black text-slate-900 dark:text-white">
                            {pkg.PackageName}
                          </h3>
                          {isSelected && (
                            <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-xs">
                              ✓
                            </div>
                          )}
                        </div>

                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {pkg.Description}
                        </p>

                        <div className="py-2">
                          <span className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
                            {formatVND(pkg.MonthlyFee)}
                          </span>
                          <span className="text-xs text-slate-400 font-semibold ml-1">/tháng</span>
                        </div>

                        {/* Services List */}
                        <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                          {pkg.ServicesIncluded.split(';').map((svc, i) => (
                            <div key={i} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300">
                              <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                              <span>{svc.trim()}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <Button
                        variant={isSelected ? 'primary' : 'outline'}
                        size="md"
                        className="w-full font-bold"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPackage(pkg);
                          setCurrentStep(4);
                        }}
                      >
                        {isSelected ? '✓ Đang Chọn Gói Này' : 'Chọn Gói Này'}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ========================================================================= */}
            {/* BƯỚC 4: TỔNG KẾT & TẠM TÍNH CHI PHÍ (ORDER SUMMARY DRAWER) */}
            {/* ========================================================================= */}
            {selectedPlot && (
              <div className="sticky bottom-4 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-5 sm:p-6 rounded-3xl border-2 border-emerald-500 shadow-2xl shadow-emerald-500/20 animate-fade-in">
                <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
                  {/* Summary Details */}
                  <div className="flex flex-wrap items-center gap-4 sm:gap-8 w-full lg:w-auto">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 flex items-center justify-center font-black text-lg">
                        {selectedPlot.PlotCode.slice(-3)}
                      </div>
                      <div>
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Ô Đất Đã Chọn</span>
                        <span className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                          {selectedPlot.PlotCode} ({selectedPlot.SizeM2} m²)
                        </span>
                      </div>
                    </div>

                    <div className="h-8 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />

                    <div>
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Giống Cây</span>
                      <span className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                        {selectedSeed ? selectedSeed.SeedName : 'Chưa chọn'}
                      </span>
                    </div>

                    <div className="h-8 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />

                    <div>
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Gói Chăm Sóc</span>
                      <span className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                        {selectedPackage ? selectedPackage.PackageName.split('(')[0] : 'Chưa chọn'}
                      </span>
                    </div>
                  </div>

                  {/* Total & Action Button */}
                  <div className="flex items-center justify-between sm:justify-end gap-5 w-full lg:w-auto pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-100 dark:border-slate-800">
                    <div className="text-right">
                      <span className="text-xs text-slate-400 font-semibold block">Tổng Tạm Tính (Tháng 1):</span>
                      <span className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
                        {formatVND(totalPrice)}
                      </span>
                    </div>

                    <Button
                      variant="primary"
                      size="lg"
                      onClick={() => setIsSuccessModalOpen(true)}
                      rightIcon={<ArrowRight className="w-5 h-5" />}
                      className="font-bold shadow-xl shadow-emerald-500/25 px-6 sm:px-8 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white"
                    >
                      Tiến Hành Đặt Thuê
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Confirmation & Next Step Modal */}
      {isSuccessModalOpen && selectedPlot && selectedSeed && selectedPackage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl animate-scale-up">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center mx-auto shadow-md shadow-emerald-500/10">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white">Xác Nhận Lựa Chọn Của Bạn</h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Bạn đã hoàn thành bước chọn ô đất và giống rau. Thông tin này đã sẵn sàng cho quy trình thanh toán mô phỏng!
              </p>
            </div>

            {/* Receipt Review */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Vị trí ô đất:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{selectedPlot.PlotCode} ({selectedPlot.SizeM2} m²)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Tiền thuê ô đất:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{formatVND(plotPrice)} / tháng</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Giống cây ({selectedSeed.SeedName}):</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{formatVND(seedPrice)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Gói chăm sóc ({selectedPackage.PackageName.split('(')[0]}):</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{formatVND(packagePrice)} / tháng</span>
              </div>
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between text-sm font-black">
                <span className="text-slate-900 dark:text-white">Tổng chi phí tháng đầu:</span>
                <span className="text-emerald-600 dark:text-emerald-400">{formatVND(totalPrice)}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="md"
                className="w-1/2 font-bold"
                onClick={() => setIsSuccessModalOpen(false)}
              >
                Chọn Lại
              </Button>
              <Button
                variant="primary"
                size="md"
                className="w-1/2 font-bold shadow-lg shadow-emerald-500/25 bg-emerald-600 hover:bg-emerald-500 text-white"
                onClick={() => {
                  setIsSuccessModalOpen(false);
                  // Store choice in session/localStorage for payment phase
                  localStorage.setItem(
                    'pending_rental',
                    JSON.stringify({
                      plotId: selectedPlot.PlotId,
                      plotCode: selectedPlot.PlotCode,
                      sizeM2: selectedPlot.SizeM2,
                      seedId: selectedSeed.SeedId,
                      seedName: selectedSeed.SeedName,
                      packageId: selectedPackage.PackageId,
                      packageName: selectedPackage.PackageName,
                      totalPrice: totalPrice,
                    })
                  );
                  alert('Đã lưu cấu hình ô đất và giống cây! Sẵn sàng cho Buổi Chiều: Thanh toán Sandbox.');
                }}
              >
                Xác Nhận Đặt Thuê
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
