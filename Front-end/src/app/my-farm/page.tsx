'use client';

import React, { useEffect, useState } from 'react';
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
  Maximize2,
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
  ShieldCheck
} from 'lucide-react';
import Header from '@/components/Header';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent } from '@/components/ui/Card';
import { useAuthStore } from '@/store/useAuthStore';

interface CultivationItem {
  CultivationId: number;
  OrderId: number;
  PlotId: number;
  SeedId: number;
  StartDate: string;
  ExpectedHarvestDate: string;
  ProgressPercent: number;
  CultivationStatus: string;
  PlotCode: string;
  SizeM2: number;
  SoilPH: number;
  StandardHumidity: number;
  BasePricePerMonth: number;
  SeedName: string;
  Category: string;
  GrowthDurationDays: number;
  ExpectedYieldKgPerM2: number;
  SeedImageUrl: string;
  PackageName: string;
  MonthlyFee: number;
  ServicesIncluded: string;
  OrderCode: string;
  TotalAmount: number;
  PaidAt: string;
  DurationMonths: number;
}

export default function MyFarmPage() {
  const router = useRouter();
  const { user, token, isAuthenticated, initAuth } = useAuthStore();

  const [cultivations, setCultivations] = useState<CultivationItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<CultivationItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Live sensor mock states with subtle fluctuations
  const [temperature, setTemperature] = useState(26.8);
  const [humidity, setHumidity] = useState(74);
  const [lightLux, setLightLux] = useState(860);
  const [liveTime, setLiveTime] = useState('');
  const [isCameraOnline, setIsCameraOnline] = useState(true);
  const [cameraAngle, setCameraAngle] = useState<'Góc Toàn Cảnh' | 'Cận Cảnh Gốc Rau'>('Góc Toàn Cảnh');

  // Realtime clock
  useEffect(() => {
    initAuth();

    const updateClock = () => {
      const now = new Date();
      setLiveTime(
        now.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
          ' ' +
          now.toLocaleTimeString('vi-VN')
      );
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, [initAuth]);

  // Minor sensor fluctuation for lively feel
  useEffect(() => {
    const sensorInterval = setInterval(() => {
      setTemperature((prev) => Number((26.0 + Math.random() * 1.5).toFixed(1)));
      setHumidity((prev) => Math.floor(72 + Math.random() * 5));
      setLightLux((prev) => Math.floor(840 + Math.random() * 40));
    }, 4000);
    return () => clearInterval(sensorInterval);
  }, []);

  // Fetch cultivations
  useEffect(() => {
    const fetchMyFarm = async () => {
      try {
        setIsLoading(true);
        const authToken = token || localStorage.getItem('plotfarm_token');
        if (!authToken) {
          setIsLoading(false);
          return;
        }

        const res = await fetch('http://localhost:5000/api/cultivations/my-farm', {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });
        const data = await res.json();
        if (data.success && data.data) {
          setCultivations(data.data);
          if (data.data.length > 0) {
            setSelectedItem(data.data[0]);
          }
        }
      } catch (err) {
        console.error('Error loading my farm:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMyFarm();
  }, [token]);

  const formatVND = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col font-sans transition-colors duration-300">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Top bar */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
              <span className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
                <Sprout className="w-5 h-5" />
              </span>
              Khu Đất Của Tôi (My Farm Dashboard)
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Giám sát tiến độ sinh trưởng, theo dõi trực tiếp qua Camera 24/7 và kiểm soát thông số nhiệt độ
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/plots">
              <Button variant="outline" size="sm" leftIcon={<Layers className="w-4 h-4 text-emerald-600" />}>
                Bản Đồ Thuê Thêm Đất
              </Button>
            </Link>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> IoT & Camera Live Sync
            </span>
          </div>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="py-24 text-center space-y-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <Loader2 className="w-10 h-10 animate-spin text-emerald-500 mx-auto" />
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
              Đang kết nối camera luống rau và đọc cảm biến nông trại...
            </p>
          </div>
        )}

        {/* Empty State: If user has no active cultivations */}
        {!isLoading && cultivations.length === 0 && (
          <div className="bg-white dark:bg-slate-900 p-8 sm:p-14 rounded-3xl border-2 border-dashed border-emerald-300 dark:border-slate-800 text-center space-y-6 max-w-2xl mx-auto shadow-sm">
            <div className="w-20 h-20 rounded-3xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center mx-auto">
              <Sprout className="w-10 h-10" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                Bạn Chưa Có Ô Đất Canh Tác Nào
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Hãy ghé thăm Bản đồ nông trại để chọn ô đất ưng ý, lựa chọn giống rau củ quả và bắt đầu hành trình sở hữu nguồn nông sản sạch tươi ngon!
              </p>
            </div>
            <div className="pt-2">
              <Link href="/plots">
                <Button
                  variant="primary"
                  size="lg"
                  rightIcon={<ArrowRight className="w-5 h-5" />}
                  className="font-bold px-8 py-3.5 shadow-xl shadow-emerald-500/25 bg-emerald-600 hover:bg-emerald-500 text-white"
                >
                  Xem Bản Đồ & Thuê Ô Đất Ngay
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Active Cultivations Dashboard */}
        {!isLoading && cultivations.length > 0 && selectedItem && (
          <div className="space-y-8">
            {/* Plot Switcher (if user owns multiple plots) */}
            {cultivations.length > 1 && (
              <div className="flex items-center gap-3 overflow-x-auto pb-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider shrink-0">Ô đất của bạn:</span>
                {cultivations.map((item) => (
                  <button
                    key={item.CultivationId}
                    onClick={() => setSelectedItem(item)}
                    className={`px-4 py-2 rounded-2xl text-xs font-extrabold transition-all shrink-0 flex items-center gap-2 ${
                      selectedItem.CultivationId === item.CultivationId
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                        : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <Sprout className="w-3.5 h-3.5" />
                    <span>{item.PlotCode} - {item.SeedName}</span>
                  </button>
                ))}
              </div>
            )}

            {/* 1. HERO CULTIVATION OVERVIEW CARD */}
            <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-emerald-200/90 dark:border-slate-800 shadow-sm space-y-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-start sm:items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-md shrink-0 border-2 border-emerald-500">
                    <img
                      src={selectedItem.SeedImageUrl}
                      alt={selectedItem.SeedName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                        {selectedItem.PlotCode}: {selectedItem.SeedName}
                      </h2>
                      <Badge variant="success" size="sm" dot>ĐANG CANH TÁC</Badge>
                      <Badge variant="info" size="sm">{selectedItem.Category}</Badge>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Gói chăm sóc: <span className="font-bold text-slate-700 dark:text-slate-300">{selectedItem.PackageName}</span> • Diện tích: <span className="font-bold text-slate-700 dark:text-slate-300">{selectedItem.SizeM2} m²</span>
                    </p>
                  </div>
                </div>

                {/* Quick countdown badge */}
                <div className="flex items-center gap-4 bg-emerald-50 dark:bg-emerald-950/40 p-4 rounded-2xl border border-emerald-200 dark:border-emerald-800/40">
                  <div className="text-right">
                    <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider block">
                      Dự kiến thu hoạch
                    </span>
                    <span className="text-lg font-black text-slate-900 dark:text-white">
                      {formatDate(selectedItem.ExpectedHarvestDate)}
                    </span>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black">
                    <Calendar className="w-5 h-5" />
                  </div>
                </div>
              </div>

              {/* Progress Bar & Growth Stages */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-emerald-500" />
                    Giai đoạn sinh trưởng: <span className="text-emerald-600">Cây Con Ra Lá Thật (Giai Đoạn 2/5)</span>
                  </span>
                  <span className="text-emerald-600 font-extrabold text-sm">{selectedItem.ProgressPercent}% Hoàn Thành</span>
                </div>

                <div className="w-full h-3.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-200 dark:border-slate-700">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 via-teal-500 to-green-500 rounded-full transition-all duration-1000 shadow-sm"
                    style={{ width: `${selectedItem.ProgressPercent}%` }}
                  />
                </div>

                <div className="grid grid-cols-5 text-center text-[10px] sm:text-xs font-semibold text-slate-400 pt-1">
                  <span className="text-emerald-600 font-bold">1. Gieo Hạt (Xong)</span>
                  <span className="text-emerald-600 font-bold">2. Cây Con (Hiện tại)</span>
                  <span>3. Tăng Trưởng</span>
                  <span>4. Trưởng Thành</span>
                  <span>5. Thu Hoạch</span>
                </div>
              </div>
            </div>

            {/* 2. CAMERA 24/7 & SENSOR WIDGETS */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left 7 Cols: Live Camera Stream */}
              <div className="lg:col-span-7 space-y-4">
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm space-y-4 p-5 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
                      <span className="text-xs font-black text-red-600 uppercase tracking-wider">
                        ● LIVE CAM 24/7 - CAMERA #{selectedItem.PlotId}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge variant="success" size="sm">1080P HD</Badge>
                      <button
                        onClick={() => setCameraAngle((prev) => prev === 'Góc Toàn Cảnh' ? 'Cận Cảnh Gốc Rau' : 'Góc Toàn Cảnh')}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 text-[11px] font-bold text-slate-600 dark:text-slate-300 transition-colors"
                      >
                        Đổi: {cameraAngle}
                      </button>
                    </div>
                  </div>

                  {/* Camera Video Player Box */}
                  <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-slate-950 shadow-inner group">
                    {/* Simulated Farm Video Stream with lush moving farm */}
                    <img
                      src="https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=1200&q=80"
                      alt="Camera Feed"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />

                    {/* Dark gradient overlay for HUD */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 pointer-events-none" />

                    {/* Top HUD: Coordinates & Clock */}
                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between text-white text-xs font-mono drop-shadow">
                      <span className="flex items-center gap-1.5 bg-black/50 px-2.5 py-1 rounded-md backdrop-blur-sm">
                        <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                        Đà Lạt • Ô đất {selectedItem.PlotCode}
                      </span>
                      <span className="bg-black/50 px-2.5 py-1 rounded-md backdrop-blur-sm">
                        {liveTime}
                      </span>
                    </div>

                    {/* Center Focus Reticle */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40 group-hover:opacity-80 transition-opacity">
                      <div className="w-24 h-24 border border-white/60 rounded-xl relative">
                        <div className="absolute -top-1 -left-1 w-2 h-2 border-t-2 border-l-2 border-emerald-400" />
                        <div className="absolute -top-1 -right-1 w-2 h-2 border-t-2 border-r-2 border-emerald-400" />
                        <div className="absolute -bottom-1 -left-1 w-2 h-2 border-b-2 border-l-2 border-emerald-400" />
                        <div className="absolute -bottom-1 -right-1 w-2 h-2 border-b-2 border-r-2 border-emerald-400" />
                      </div>
                    </div>

                    {/* Bottom HUD: Telemetry & Controls */}
                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs drop-shadow">
                      <div className="flex items-center gap-2">
                        <span className="bg-black/60 px-2.5 py-1 rounded-md backdrop-blur-sm font-semibold flex items-center gap-1.5">
                          <Thermometer className="w-3.5 h-3.5 text-amber-400" /> {temperature} °C
                        </span>
                        <span className="bg-black/60 px-2.5 py-1 rounded-md backdrop-blur-sm font-semibold flex items-center gap-1.5">
                          <Droplets className="w-3.5 h-3.5 text-cyan-400" /> {humidity}% Ẩm
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => alert('Đã chụp ảnh khoảnh khắc rau hôm nay và lưu vào máy!')}
                          className="bg-white/20 hover:bg-white/40 text-white p-1.5 rounded-lg backdrop-blur-sm transition-colors"
                          title="Chụp ảnh màn hình"
                        >
                          <Camera className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => alert('Chế độ toàn màn hình camera đã kích hoạt')}
                          className="bg-white/20 hover:bg-white/40 text-white p-1.5 rounded-lg backdrop-blur-sm transition-colors"
                          title="Phóng to toàn màn hình"
                        >
                          <Maximize2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
                    Tín hiệu camera truyền hình trực tiếp độ trễ thấp từ nông trại PlotFarm Đà Lạt
                  </p>
                </div>
              </div>

              {/* Right 5 Cols: Live Sensor Telemetry */}
              <div className="lg:col-span-5 space-y-4">
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-5 shadow-sm">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                    <h3 className="font-black text-lg text-slate-900 dark:text-white flex items-center gap-2">
                      <Activity className="w-5 h-5 text-emerald-500" /> Cảm Biến Môi Trường Luống Đất
                    </h3>
                    <Badge variant="success" size="sm">LIVE SYNC</Badge>
                  </div>

                  {/* 4 Sensor Cards */}
                  <div className="grid grid-cols-2 gap-3.5">
                    {/* Temperature */}
                    <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 space-y-1">
                      <div className="flex items-center justify-between text-amber-700 dark:text-amber-400">
                        <span className="text-[11px] font-extrabold uppercase tracking-wider">Nhiệt Độ Đất</span>
                        <Thermometer className="w-4 h-4" />
                      </div>
                      <p className="text-2xl font-black text-slate-900 dark:text-white">{temperature} °C</p>
                      <span className="text-[10px] font-semibold text-emerald-600 block">Lý tưởng (24 - 28°C)</span>
                    </div>

                    {/* Humidity */}
                    <div className="p-4 rounded-2xl bg-cyan-50/60 dark:bg-cyan-950/20 border border-cyan-200/80 dark:border-cyan-900/40 space-y-1">
                      <div className="flex items-center justify-between text-cyan-700 dark:text-cyan-400">
                        <span className="text-[11px] font-extrabold uppercase tracking-wider">Độ Ẩm Không Khí</span>
                        <Droplets className="w-4 h-4" />
                      </div>
                      <p className="text-2xl font-black text-slate-900 dark:text-white">{humidity} %</p>
                      <span className="text-[10px] font-semibold text-emerald-600 block">Đủ ẩm (Hệ thống ngắt)</span>
                    </div>

                    {/* Light */}
                    <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-900/40 space-y-1">
                      <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400">
                        <span className="text-[11px] font-extrabold uppercase tracking-wider">Ánh Sáng</span>
                        <Sun className="w-4 h-4" />
                      </div>
                      <p className="text-2xl font-black text-slate-900 dark:text-white">{lightLux} Lux</p>
                      <span className="text-[10px] font-semibold text-emerald-600 block">Quang hợp tối ưu</span>
                    </div>

                    {/* Soil pH */}
                    <div className="p-4 rounded-2xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-200/80 dark:border-purple-900/40 space-y-1">
                      <div className="flex items-center justify-between text-purple-700 dark:text-purple-400">
                        <span className="text-[11px] font-extrabold uppercase tracking-wider">Độ pH Thổ Nhưỡng</span>
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <p className="text-2xl font-black text-slate-900 dark:text-white">{selectedItem.SoilPH}</p>
                      <span className="text-[10px] font-semibold text-emerald-600 block">Trung tính giàu mùn</span>
                    </div>
                  </div>

                  {/* Harvest Yield Expectation */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-semibold">Sản lượng cam kết tối thiểu:</span>
                      <span className="font-extrabold text-slate-900 dark:text-white">
                        {selectedItem.ExpectedYieldKgPerM2 * selectedItem.SizeM2} kg rau sạch
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-semibold">Tần suất giao rau khi chín:</span>
                      <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                        Giao 2 đợt / tháng (tận nhà)
                      </span>
                    </div>
                  </div>

                  {/* Action Shortcuts (Ready for Day 2) */}
                  <div className="space-y-2.5 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-between font-bold text-xs"
                      onClick={() => alert('Tính năng Nhật Ký Canh Tác sẽ mở vào Ngày 2!')}
                    >
                      <span className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-emerald-500" /> Xem Nhật Ký Ảnh Chăm Sóc Hàng Ngày
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-between font-bold text-xs"
                      onClick={() => alert('Tính năng Gửi Yêu Cầu Chăm Sóc sẽ mở vào Ngày 2!')}
                    >
                      <span className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-500" /> Gửi Yêu Cầu Kỹ Thuật Bón Thêm Phân / Bắt Sâu
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </Button>

                    <Link href="/profile" className="block">
                      <Button variant="ghost" size="sm" className="w-full justify-between text-xs text-slate-500 font-semibold">
                        <span className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-slate-400" /> Quản Lý Sổ Địa Chỉ Giao Nhận Rau
                        </span>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
