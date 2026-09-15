'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Sprout,
  Video,
  Sun,
  Droplets,
  Thermometer,
  Calendar,
  Clock,
  CheckCircle2,
  Camera,
  RefreshCw,
  Sparkles,
  MapPin,
  ArrowRight,
  Package,
  Layers,
  Activity,
  AlertCircle,
  Loader2,
  Eye,
  Sliders,
  ChevronRight,
  ShieldCheck,
  Send,
  PlusCircle,
  FileText,
  X,
  Phone,
  UserCheck,
  CheckCircle,
  Info,
  Upload,
  Filter,
  Trash2,
  Award,
  Check
} from 'lucide-react';
import Header from '@/components/Header';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { useAuthStore } from '@/store/useAuthStore';
import { toast } from '@/store/useToastStore';

// Interfaces for Staff Portal Data
interface AssignedPlot {
  PlotId: number;
  PlotCode: string;
  AreaName: string;
  CustomerName: string;
  SeedName: string;
  GrowthDays: number;
  ProgressPercent: number;
  HealthStatus: 'EXCELLENT' | 'GOOD' | 'NORMAL' | 'ATTENTION_NEEDED';
  LastLogDate: string;
  Humidity: number;
  SoilPH: number;
}

interface CareRequest {
  RequestId: number;
  PlotCode: string;
  CustomerName: string;
  CustomerPhone: string;
  RequestType: string;
  Note: string;
  CreatedAt: string;
  Status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  ResolvedNote?: string;
  ResolvedImage?: string;
}

interface HarvestItem {
  CultivationId: number;
  PlotCode: string;
  CustomerName: string;
  SeedName: string;
  ExpectedHarvestDate: string;
  EstimatedYieldKg: number;
  Status: 'READY_TO_HARVEST' | 'HARVESTED';
}

export default function StaffPage() {
  const router = useRouter();
  const { user, token, isAuthenticated, initAuth } = useAuthStore();

  const [activeTab, setActiveTab] = useState<'plots' | 'requests' | 'harvest' | 'resources'>('plots');
  const [filterArea, setFilterArea] = useState<string>('ALL');

  // Auth Guard: ensure only Staff or Admin can access
  useEffect(() => {
    initAuth();
  }, [initAuth]);

  useEffect(() => {
    const savedToken = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!savedToken && !token) {
      router.replace('/login');
      return;
    }
    if (user) {
      const role = (user.role || user.roleName || '').toLowerCase();
      if (role !== 'staff' && role !== 'admin' && user.roleId !== 2 && user.roleId !== 1) {
        router.replace('/my-farm');
      }
    }
  }, [user, token, router]);

  // Modal states for creating Cultivation Log
  const [isLogModalOpen, setLogModalOpen] = useState(false);
  const [selectedPlotForLog, setSelectedPlotForLog] = useState<AssignedPlot | null>(null);
  const [logTitle, setLogTitle] = useState('');
  const [logActivityType, setLogActivityType] = useState('TƯỚI NƯỚC');
  const [logNotes, setLogNotes] = useState('');
  const [logHealthStatus, setLogHealthStatus] = useState<'EXCELLENT' | 'GOOD' | 'NORMAL' | 'ATTENTION_NEEDED'>('EXCELLENT');
  const [logImageUrl, setLogImageUrl] = useState('/assets/farm/cultivated-plot.jpg');
  const [isSubmittingLog, setIsSubmittingLog] = useState(false);

  // Modal states for Care Request Resolution
  const [isRequestModalOpen, setRequestModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<CareRequest | null>(null);
  const [requestResolveNotes, setRequestResolveNotes] = useState('');
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);

  // Modal states for Harvest Recording
  const [isHarvestModalOpen, setHarvestModalOpen] = useState(false);
  const [selectedHarvestItem, setSelectedHarvestItem] = useState<HarvestItem | null>(null);
  const [harvestActualYieldKg, setHarvestActualYieldKg] = useState<number>(15.5);
  const [harvestNotes, setHarvestNotes] = useState('');
  const [isSubmittingHarvest, setIsSubmittingHarvest] = useState(false);

  // Initial Mock State for Assigned Plots
  const [plots, setPlots] = useState<AssignedPlot[]>([
    {
      PlotId: 101,
      PlotCode: 'A-01',
      AreaName: 'Khu A (Đất Thịt Phù Sa)',
      CustomerName: 'Hoàng Anh Tuấn',
      SeedName: 'Cải Bẹ Xanh',
      GrowthDays: 24,
      ProgressPercent: 70,
      HealthStatus: 'EXCELLENT',
      LastLogDate: '14/09/2026 15:30',
      Humidity: 72,
      SoilPH: 6.5,
    },
    {
      PlotId: 102,
      PlotCode: 'A-02',
      AreaName: 'Khu A (Đất Thịt Phù Sa)',
      CustomerName: 'Phạm Thị Trà My',
      SeedName: 'Rau Muống Hạt',
      GrowthDays: 18,
      ProgressPercent: 55,
      HealthStatus: 'GOOD',
      LastLogDate: '13/09/2026 09:00',
      Humidity: 68,
      SoilPH: 6.8,
    },
    {
      PlotId: 105,
      PlotCode: 'A-05',
      AreaName: 'Khu A (Đất Thịt Phù Sa)',
      CustomerName: 'Trần Văn Bình',
      SeedName: 'Xà Lách Lô Tô',
      GrowthDays: 32,
      ProgressPercent: 95,
      HealthStatus: 'ATTENTION_NEEDED',
      LastLogDate: '12/09/2026 14:15',
      Humidity: 60,
      SoilPH: 5.9,
    },
    {
      PlotId: 201,
      PlotCode: 'B-01',
      AreaName: 'Khu B (Đất Cát Pha)',
      CustomerName: 'Lê Ngọc Lan',
      SeedName: 'Cà Tomato Cherry',
      GrowthDays: 45,
      ProgressPercent: 80,
      HealthStatus: 'EXCELLENT',
      LastLogDate: '14/09/2026 08:30',
      Humidity: 75,
      SoilPH: 6.7,
    },
  ]);

  // Initial Mock State for Care Requests
  const [careRequests, setCareRequests] = useState<CareRequest[]>([
    {
      RequestId: 1,
      PlotCode: 'A-05',
      CustomerName: 'Trần Văn Bình',
      CustomerPhone: '0903000001',
      RequestType: 'Tưới nước bổ sung',
      Note: 'Nhờ kỹ thuật viên tưới thêm nước bón vi sinh giúp lá xà lách hơi héo.',
      CreatedAt: '15/09/2026 08:15',
      Status: 'PENDING',
    },
    {
      RequestId: 2,
      PlotCode: 'A-01',
      CustomerName: 'Hoàng Anh Tuấn',
      CustomerPhone: '0978901234',
      RequestType: 'Kiểm tra sâu đốm lá',
      Note: 'Nhờ chú Đức chụp lại ảnh lá cải bẹ xanh góc trái giùm anh nhé.',
      CreatedAt: '14/09/2026 16:45',
      Status: 'IN_PROGRESS',
      ResolvedNote: 'Đã tỉa các lá vàng sẫm và phun vi sinh thảo mộc phòng sâu.',
    },
  ]);

  // Initial Mock State for Harvest Items
  const [harvestList, setHarvestList] = useState<HarvestItem[]>([
    {
      CultivationId: 301,
      PlotCode: 'A-05',
      CustomerName: 'Trần Văn Bình',
      SeedName: 'Xà Lách Lô Tô',
      ExpectedHarvestDate: '16/09/2026',
      EstimatedYieldKg: 18.0,
      Status: 'READY_TO_HARVEST',
    },
    {
      CultivationId: 302,
      PlotCode: 'B-03',
      CustomerName: 'Nguyễn Thị Hoa',
      SeedName: 'Rau Muống Hạt',
      ExpectedHarvestDate: '18/09/2026',
      EstimatedYieldKg: 25.0,
      Status: 'READY_TO_HARVEST',
    },
  ]);

  // Filtered assigned plots
  const filteredPlots = useMemo(() => {
    if (filterArea === 'ALL') return plots;
    return plots.filter((p) => p.AreaName.includes(filterArea));
  }, [plots, filterArea]);

  // Handle open Log modal
  const handleOpenLogModal = (plot: AssignedPlot) => {
    setSelectedPlotForLog(plot);
    setLogTitle(`Chăm sóc ô đất ${plot.PlotCode} - ${plot.SeedName}`);
    setLogActivityType('TƯỚI NƯỚC');
    setLogNotes('');
    setLogHealthStatus(plot.HealthStatus);
    setLogModalOpen(true);
  };

  // Submit Cultivation Log
  const handleSubmitLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!logTitle.trim()) {
      toast.error('Vui lòng nhập tiêu đề nhật ký!');
      return;
    }

    setIsSubmittingLog(true);
    setTimeout(() => {
      setIsSubmittingLog(false);
      setLogModalOpen(false);

      // Update plot status locally
      if (selectedPlotForLog) {
        setPlots((prev) =>
          prev.map((p) =>
            p.PlotId === selectedPlotForLog.PlotId
              ? {
                  ...p,
                  HealthStatus: logHealthStatus,
                  LastLogDate: 'Hôm nay (Vừa cập nhật)',
                }
              : p
          )
        );
      }

      toast.success(
        `Đã đăng nhật ký thành công cho ô đất ${selectedPlotForLog?.PlotCode}!`,
        'Nhật Ký Thực Địa'
      );
    }, 800);
  };

  // Submit Request Resolution
  const handleResolveRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestResolveNotes.trim()) {
      toast.error('Vui lòng nhập ghi chú xử lý thực địa!');
      return;
    }

    setIsSubmittingRequest(true);
    setTimeout(() => {
      setIsSubmittingRequest(false);
      setRequestModalOpen(false);

      if (selectedRequest) {
        setCareRequests((prev) =>
          prev.map((r) =>
            r.RequestId === selectedRequest.RequestId
              ? {
                  ...r,
                  Status: 'COMPLETED',
                  ResolvedNote: requestResolveNotes,
                }
              : r
          )
        );
      }

      toast.success(
        `Đã duyệt & hoàn thành yêu cầu cho ô đất ${selectedRequest?.PlotCode}!`,
        'Xử Lý Yêu Cầu'
      );
    }, 800);
  };

  // Submit Harvest Result
  const handleSubmitHarvest = (e: React.FormEvent) => {
    e.preventDefault();
    if (harvestActualYieldKg <= 0) {
      toast.error('Sản lượng thu hoạch phải lớn hơn 0 kg!');
      return;
    }

    setIsSubmittingHarvest(true);
    setTimeout(() => {
      setIsSubmittingHarvest(false);
      setHarvestModalOpen(false);

      if (selectedHarvestItem) {
        setHarvestList((prev) =>
          prev.map((h) =>
            h.CultivationId === selectedHarvestItem.CultivationId
              ? { ...h, Status: 'HARVESTED' }
              : h
          )
        );
      }

      toast.success(
        `Đã ghi nhận thu hoạch thành công ${harvestActualYieldKg} kg nông sản cho ô ${selectedHarvestItem?.PlotCode}!`,
        'Ghi Nhận Thu Hoạch'
      );
    }, 800);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#080d16] text-slate-900 dark:text-slate-100 transition-colors duration-300 pb-16">
      {/* Top Bar */}
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Mobile-First Header Banner for Field Staff */}
        <div className="relative rounded-3xl p-6 mb-6 overflow-hidden bg-gradient-to-r from-emerald-900 via-slate-900 to-teal-900 text-white shadow-xl border border-emerald-500/20">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-60 h-60 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold mb-2">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Cổng Kỹ Thuật Viên Thực Địa (Staff Portal)
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Xin chào, {user?.fullName || 'Kỹ Thuật Viên Nguyễn Văn Đức'}
              </h1>
              <p className="text-slate-300 text-xs sm:text-sm mt-1 flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-400" /> Ca Sáng (07:00 - 11:30) • <MapPin className="w-4 h-4 text-amber-400" /> Phụ trách Khu A & Khu B
              </p>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                variant="primary"
                size="sm"
                className="w-full sm:w-auto shadow-lg"
                onClick={() => {
                  toast.info('Đang đồng bộ dữ liệu cảm biến thực địa...', 'Realtime Sync');
                }}
                leftIcon={<RefreshCw className="w-4 h-4" />}
              >
                Đồng Bộ Nhanh
              </Button>
            </div>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3">
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Sprout className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block">Ô Đất Phân Công</span>
              <span className="text-lg font-bold text-slate-900 dark:text-slate-100">{plots.length} Ô</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3">
            <div className="p-3 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block">Yêu Cầu Chờ Duyệt</span>
              <span className="text-lg font-bold text-amber-600 dark:text-amber-400">
                {careRequests.filter((r) => r.Status !== 'COMPLETED').length} Đơn
              </span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3">
            <div className="p-3 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block">Sẵn Sàng Thu Hoạch</span>
              <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                {harvestList.filter((h) => h.Status === 'READY_TO_HARVEST').length} Ô
              </span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3">
            <div className="p-3 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block">Nhật Ký Hôm Nay</span>
              <span className="text-lg font-bold text-teal-600 dark:text-teal-400">12 Bài</span>
            </div>
          </div>
        </div>

        {/* Mobile-Friendly Navigation Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 mb-6 overflow-x-auto gap-2 pb-1">
          <button
            onClick={() => setActiveTab('plots')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap ${
              activeTab === 'plots'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 border border-slate-200 dark:border-slate-800'
            }`}
          >
            <Sprout className="w-4 h-4" />
            1. Danh Sách Ô Đất ({plots.length})
          </button>

          <button
            onClick={() => setActiveTab('requests')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap ${
              activeTab === 'requests'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 border border-slate-200 dark:border-slate-800'
            }`}
          >
            <AlertCircle className="w-4 h-4" />
            2. Duyệt Yêu Cầu Khách ({careRequests.filter((r) => r.Status !== 'COMPLETED').length})
          </button>

          <button
            onClick={() => setActiveTab('harvest')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap ${
              activeTab === 'harvest'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 border border-slate-200 dark:border-slate-800'
            }`}
          >
            <Package className="w-4 h-4" />
            3. Thu Hoạch ({harvestList.length})
          </button>

          <button
            onClick={() => setActiveTab('resources')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap ${
              activeTab === 'resources'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 border border-slate-200 dark:border-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            4. CSDL Kỹ Thuật & Hạt Giống
          </button>
        </div>

        {/* TAB 1: ASSIGNED PLOTS & QUICK LOG POSTING */}
        {activeTab === 'plots' && (
          <div className="space-y-4 animate-fade-in">
            {/* Area Filter Selector */}
            <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5" /> Lọc theo Khu Vực:
              </span>
              <div className="flex gap-1.5">
                <button
                  onClick={() => setFilterArea('ALL')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    filterArea === 'ALL'
                      ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  Tất Cả
                </button>
                <button
                  onClick={() => setFilterArea('Khu A')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    filterArea === 'Khu A'
                      ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  Khu A
                </button>
                <button
                  onClick={() => setFilterArea('Khu B')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    filterArea === 'Khu B'
                      ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  Khu B
                </button>
              </div>
            </div>

            {/* Plots Cards List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredPlots.map((plot) => (
                <Card
                  key={plot.PlotId}
                  variant="glass"
                  className="hover:border-emerald-500/40 transition-all shadow-sm"
                >
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono">
                            Ô {plot.PlotCode}
                          </span>
                          <Badge
                            variant={
                              plot.HealthStatus === 'EXCELLENT'
                                ? 'success'
                                : plot.HealthStatus === 'GOOD'
                                ? 'info'
                                : plot.HealthStatus === 'NORMAL'
                                ? 'neutral'
                                : 'danger'
                            }
                            size="sm"
                          >
                            {plot.HealthStatus === 'EXCELLENT'
                              ? 'Rất Tốt'
                              : plot.HealthStatus === 'GOOD'
                              ? 'Tốt'
                              : plot.HealthStatus === 'NORMAL'
                              ? 'Bình Thường'
                              : 'Cần Chú Ý'}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{plot.AreaName}</p>
                      </div>

                      <Button
                        variant="primary"
                        size="sm"
                        className="shadow-sm"
                        onClick={() => handleOpenLogModal(plot)}
                        leftIcon={<Camera className="w-3.5 h-3.5" />}
                      >
                        Đăng Nhật Ký
                      </Button>
                    </div>

                    <div className="space-y-2.5 pt-2 border-t border-slate-200 dark:border-slate-800 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">Khách hàng sở hữu:</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{plot.CustomerName}</span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">Cây trồng / Hạt giống:</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">{plot.SeedName}</span>
                      </div>

                      {/* Growth Progress Bar */}
                      <div>
                        <div className="flex justify-between text-[11px] mb-1">
                          <span className="text-slate-500">Tiến độ mùa vụ ({plot.GrowthDays} ngày):</span>
                          <span className="font-bold text-emerald-500">{plot.ProgressPercent}%</span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500"
                            style={{ width: `${plot.ProgressPercent}%` }}
                          />
                        </div>
                      </div>

                      {/* Sensor Readings Bar */}
                      <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                        <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-850 flex items-center justify-between">
                          <span className="text-slate-500 flex items-center gap-1">
                            <Droplets className="w-3 h-3 text-blue-500" /> Độ ẩm đất:
                          </span>
                          <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                            {plot.Humidity}%
                          </span>
                        </div>
                        <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-850 flex items-center justify-between">
                          <span className="text-slate-500 flex items-center gap-1">
                            <Sun className="w-3 h-3 text-amber-500" /> Độ pH:
                          </span>
                          <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                            {plot.SoilPH}
                          </span>
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-1 text-[11px] text-slate-400">
                        <span>Nhật ký gần nhất:</span>
                        <span>{plot.LastLogDate}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: FIELD CARE REQUESTS RESOLUTION */}
        {activeTab === 'requests' && (
          <div className="space-y-4 animate-fade-in">
            {careRequests.map((req) => (
              <Card key={req.RequestId} variant="glass" className="shadow-sm">
                <CardContent className="p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono font-bold text-sm">
                        Ô {req.PlotCode}
                      </span>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">{req.RequestType}</h4>
                    </div>
                    <Badge
                      variant={
                        req.Status === 'COMPLETED'
                          ? 'success'
                          : req.Status === 'IN_PROGRESS'
                          ? 'warning'
                          : 'danger'
                      }
                      size="sm"
                    >
                      {req.Status === 'COMPLETED'
                        ? 'Đã Hoàn Thành'
                        : req.Status === 'IN_PROGRESS'
                        ? 'Đang Thực Hiện'
                        : 'Chờ Xử Lý'}
                    </Badge>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 mb-3 text-xs">
                    <p className="text-slate-700 dark:text-slate-300 font-medium">
                      &quot;{req.Note}&quot;
                    </p>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500">
                      <span>Khách hàng: <strong>{req.CustomerName}</strong> ({req.CustomerPhone})</span>
                      <span>Gửi lúc: {req.CreatedAt}</span>
                    </div>
                  </div>

                  {req.ResolvedNote && (
                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 mb-3 text-xs">
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 block mb-0.5">
                        Ghi chú kỹ thuật viên xử lý:
                      </span>
                      <p className="text-slate-600 dark:text-slate-300">{req.ResolvedNote}</p>
                    </div>
                  )}

                  {req.Status !== 'COMPLETED' && (
                    <div className="flex justify-end gap-2 pt-2">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => {
                          setSelectedRequest(req);
                          setRequestResolveNotes(req.ResolvedNote || '');
                          setRequestModalOpen(true);
                        }}
                        leftIcon={<CheckCircle className="w-3.5 h-3.5" />}
                      >
                        Xác Nhận Đã Xử Lý Vườn
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* TAB 3: HARVEST RECORDING */}
        {activeTab === 'harvest' && (
          <div className="space-y-4 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {harvestList.map((item) => (
                <Card key={item.CultivationId} variant="glass" className="shadow-sm">
                  <CardContent className="p-5">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-base">
                          Ô {item.PlotCode}
                        </span>
                        <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">{item.SeedName}</h4>
                      </div>
                      <Badge variant={item.Status === 'HARVESTED' ? 'success' : 'warning'} size="sm">
                        {item.Status === 'HARVESTED' ? 'Đã Thu Hoạch' : 'Sẵn Sàng Thu Hoạch'}
                      </Badge>
                    </div>

                    <div className="space-y-2 text-xs border-t border-slate-200 dark:border-slate-800 pt-3">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Chủ vườn:</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{item.CustomerName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Dự kiến sản lượng:</span>
                        <span className="font-bold text-emerald-500">{item.EstimatedYieldKg} kg</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Ngày thu hoạch:</span>
                        <span>{item.ExpectedHarvestDate}</span>
                      </div>
                    </div>

                    {item.Status === 'READY_TO_HARVEST' ? (
                      <Button
                        variant="primary"
                        className="w-full mt-4"
                        onClick={() => {
                          setSelectedHarvestItem(item);
                          setHarvestActualYieldKg(item.EstimatedYieldKg);
                          setHarvestNotes('');
                          setHarvestModalOpen(true);
                        }}
                        leftIcon={<Package className="w-4 h-4" />}
                      >
                        Ghi Nhận Thu Hoạch Thực Tế
                      </Button>
                    ) : (
                      <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold text-center mt-4 border border-emerald-500/20">
                        ✓ Đã ghi nhận & chuyển sang đóng gói giao hàng
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: TECHNICAL RESOURCES & SEEDS CATALOG */}
        {activeTab === 'resources' && (
          <div className="space-y-6 animate-fade-in">
            {/* Seeds Catalog */}
            <Card variant="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sprout className="w-5 h-5 text-emerald-500" />
                  Danh Mục Hạt Giống & Nông Sản (Seeds Table)
                </CardTitle>
                <CardDescription>Tra cứu thời gian sinh trưởng và sản lượng tiêu chuẩn</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="font-bold text-emerald-500 text-sm block mb-1">Cải Bẹ Xanh</span>
                    <p className="text-slate-500">Thời gian: 30-35 ngày • Sản lượng: 2.5 kg/m²</p>
                    <p className="text-slate-400 mt-2">Phù hợp: Đất thịt phù sa • Vụ mùa: Quanh năm</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="font-bold text-emerald-500 text-sm block mb-1">Rau Muống Hạt</span>
                    <p className="text-slate-500">Thời gian: 25-30 ngày • Sản lượng: 3.0 kg/m²</p>
                    <p className="text-slate-400 mt-2">Phù hợp: Đất phù sa ẩm • Vụ mùa: Quanh năm</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="font-bold text-emerald-500 text-sm block mb-1">Cà Tomato Cherry</span>
                    <p className="text-slate-500">Thời gian: 60-75 ngày • Sản lượng: 4.5 kg/m²</p>
                    <p className="text-slate-400 mt-2">Phù hợp: Đất cát pha • Vụ mùa: Thu Đông</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Staff Assignments Summary */}
            <Card variant="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-blue-500" />
                  Bảng Phân Công Nhân Sự (StaffAssignments Table)
                </CardTitle>
                <CardDescription>Danh sách lịch trực ca và phụ trách khu vực của kỹ thuật viên</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-xs">
                  <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-900 flex justify-between items-center">
                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-200 block">Kỹ thuật viên: Nguyễn Văn Đức</span>
                      <span className="text-slate-500">Phụ trách: Khu A (Đất Phù Sa) & Khu B</span>
                    </div>
                    <Badge variant="success">Ca Sáng (07:00 - 11:30)</Badge>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-900 flex justify-between items-center">
                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-200 block">Kỹ thuật viên: Lê Minh Nhật</span>
                      <span className="text-slate-500">Phụ trách: Khu C & Vườn Ươm Hạt Giống</span>
                    </div>
                    <Badge variant="info">Ca Chiều (13:00 - 17:30)</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      {/* MODAL 1: CULTIVATION LOG SUBMISSION */}
      <Modal
        isOpen={isLogModalOpen}
        onClose={() => setLogModalOpen(false)}
        title={`Đăng Nhật Ký Thực Địa - Ô ${selectedPlotForLog?.PlotCode}`}
      >
        <form onSubmit={handleSubmitLog} className="space-y-4">
          <Input
            label="Tiêu Đề Nhật Ký Công Việc"
            placeholder="Ví dụ: Tưới vi sinh & kiểm tra bắt sâu..."
            value={logTitle}
            onChange={(e) => setLogTitle(e.target.value)}
          />

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">
              Loại Hoạt Động Kỹ Thuật
            </label>
            <select
              className="w-full px-3.5 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              value={logActivityType}
              onChange={(e) => setLogActivityType(e.target.value)}
            >
              <option value="TƯỚI NƯỚC">Tưới nước & vi sinh</option>
              <option value="BÓN PHÂN">Bón phân trùn quế/hữu cơ</option>
              <option value="LÀM CỎ">Làm cỏ & xới đất</option>
              <option value="BẮT SÂU">Bắt sâu & tỉa lá gốc</option>
              <option value="KIỂM TRA CẢM BIẾN">Kiểm tra cảm biến & camera</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">
              Tình Trạng Sức Khỏe Cây Trồng
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setLogHealthStatus('EXCELLENT')}
                className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${
                  logHealthStatus === 'EXCELLENT'
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    : 'border-slate-200 dark:border-slate-800 text-slate-500'
                }`}
              >
                🟢 Rất Tốt (EXCELLENT)
              </button>
              <button
                type="button"
                onClick={() => setLogHealthStatus('GOOD')}
                className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${
                  logHealthStatus === 'GOOD'
                    ? 'border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400'
                    : 'border-slate-200 dark:border-slate-800 text-slate-500'
                }`}
              >
                🔵 Tốt (GOOD)
              </button>
              <button
                type="button"
                onClick={() => setLogHealthStatus('NORMAL')}
                className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${
                  logHealthStatus === 'NORMAL'
                    ? 'border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400'
                    : 'border-slate-200 dark:border-slate-800 text-slate-500'
                }`}
              >
                🟡 Bình Thường (NORMAL)
              </button>
              <button
                type="button"
                onClick={() => setLogHealthStatus('ATTENTION_NEEDED')}
                className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${
                  logHealthStatus === 'ATTENTION_NEEDED'
                    ? 'border-rose-500 bg-rose-500/10 text-rose-600 dark:text-rose-400'
                    : 'border-slate-200 dark:border-slate-800 text-slate-500'
                }`}
              >
                🔴 Cần Chú Ý
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">
              Hình Ảnh Chứng Thực Tại Vườn
            </label>
            <Input
              placeholder="Dán link ảnh hoặc để mặc định..."
              value={logImageUrl}
              onChange={(e) => setLogImageUrl(e.target.value)}
              leftIcon={<Camera className="w-4 h-4" />}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">
              Ghi Chú Chi Tiết Đặt Vườn
            </label>
            <textarea
              className="w-full px-3.5 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[70px]"
              placeholder="Ghi chú thêm về diễn biến cây trồng..."
              value={logNotes}
              onChange={(e) => setLogNotes(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setLogModalOpen(false)}>
              Hủy
            </Button>
            <Button variant="primary" type="submit" isLoading={isSubmittingLog} leftIcon={<Send className="w-4 h-4" />}>
              Đăng Nhật Ký Ngay
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: CARE REQUEST RESOLUTION */}
      <Modal
        isOpen={isRequestModalOpen}
        onClose={() => setRequestModalOpen(false)}
        title={`Xác Nhận Xử Lý Yêu Cầu - Ô ${selectedRequest?.PlotCode}`}
      >
        <form onSubmit={handleResolveRequest} className="space-y-4 text-xs">
          <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <p className="font-bold text-slate-800 dark:text-slate-200 mb-1">
              Yêu cầu của khách: &quot;{selectedRequest?.Note}&quot;
            </p>
            <span className="text-slate-500">Khách hàng: {selectedRequest?.CustomerName}</span>
          </div>

          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300 mb-1 block">
              Ghi Chú Kết Quả Xử Lý Tại Vườn (*)
            </label>
            <textarea
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[80px]"
              placeholder="Nhập chi tiết xử lý (Ví dụ: Đã tưới thêm vi sinh và tỉa sạch lá sâu)..."
              value={requestResolveNotes}
              onChange={(e) => setRequestResolveNotes(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setRequestModalOpen(false)}>
              Hủy
            </Button>
            <Button variant="primary" type="submit" isLoading={isSubmittingRequest} leftIcon={<CheckCircle className="w-4 h-4" />}>
              Hoàn Thành Xử Lý
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 3: HARVEST RECORDING */}
      <Modal
        isOpen={isHarvestModalOpen}
        onClose={() => setHarvestModalOpen(false)}
        title={`Ghi Nhận Thu Hoạch Nông Sản - Ô ${selectedHarvestItem?.PlotCode}`}
      >
        <form onSubmit={handleSubmitHarvest} className="space-y-4 text-xs">
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300">
            <p className="font-bold">Cây trồng: {selectedHarvestItem?.SeedName}</p>
            <p>Khách hàng: {selectedHarvestItem?.CustomerName}</p>
          </div>

          <Input
            label="Sản Lượng Thực Tế Thu Được (Kg) (*)"
            type="number"
            step="0.1"
            value={harvestActualYieldKg}
            onChange={(e) => setHarvestActualYieldKg(parseFloat(e.target.value) || 0)}
          />

          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300 mb-1 block">
              Ghi Chú Thu Hoạch & Đóng Gói
            </label>
            <textarea
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[70px]"
              placeholder="Ghi chú chất lượng nông sản..."
              value={harvestNotes}
              onChange={(e) => setHarvestNotes(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setHarvestModalOpen(false)}>
              Hủy
            </Button>
            <Button variant="primary" type="submit" isLoading={isSubmittingHarvest} leftIcon={<Package className="w-4 h-4" />}>
              Lưu Kết Quả Thu Hoạch
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
