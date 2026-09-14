'use client';

import React, { useEffect, useState, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ShieldCheck,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  CreditCard,
  QrCode,
  Wallet,
  Clock,
  MapPin,
  Sprout,
  Package,
  Calendar,
  Lock,
  ArrowRight,
  Loader2,
  Check,
  Video,
  Scale
} from 'lucide-react';
import Header from '@/components/Header';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent } from '@/components/ui/Card';
import { useAuthStore } from '@/store/useAuthStore';

interface PlotData {
  PlotId: number;
  PlotCode: string;
  AreaName?: string;
  SizeM2: number;
  SoilPH: number;
  StandardHumidity: number;
  BasePricePerMonth: number;
  CameraCode?: string;
}

interface SeedData {
  SeedId: number;
  SeedName: string;
  GrowthDurationDays: number;
  ExpectedYieldKgPerM2: number;
  SeedPrice: number;
  Category: string;
}

interface CarePackageData {
  PackageId: number;
  PackageName: string;
  MonthlyFee: number;
  ServicesIncluded: string;
}

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, token, isAuthenticated, initAuth } = useAuthStore();

  // Selected Entities
  const [plot, setPlot] = useState<PlotData | null>(null);
  const [seed, setSeed] = useState<SeedData | null>(null);
  const [carePackage, setCarePackage] = useState<CarePackageData | null>(null);

  // Number of crop cycles: 1 Vụ, 2 Vụ, 3 Vụ
  const [cycles, setCycles] = useState<number>(1);
  const [paymentMethod, setPaymentMethod] = useState<'MOMO' | 'VNPAY' | 'QR_BANK' | 'ATM'>('MOMO');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [paymentSuccess, setPaymentSuccess] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    initAuth();

    const loadData = async () => {
      try {
        setIsLoading(true);
        // 1. Check search params
        const paramPlotId = searchParams.get('plotId');
        const paramSeedId = searchParams.get('seedId');
        const paramPkgId = searchParams.get('pkgId');
        const paramCycles = searchParams.get('cycles');

        if (paramCycles) setCycles(Number(paramCycles));

        // 2. Fetch all required entities
        const [plotsRes, seedsRes, pkgsRes] = await Promise.all([
          fetch('http://localhost:5000/api/plots/grid').then((r) => r.json()),
          fetch('http://localhost:5000/api/seeds').then((r) => r.json()),
          fetch('http://localhost:5000/api/seeds/packages').then((r) => r.json()),
        ]);

        const allPlots: PlotData[] = plotsRes.data || [];
        const allSeeds: SeedData[] = seedsRes.data || [];
        const allPkgs: CarePackageData[] = pkgsRes.data || [];

        // Pick matching or fallback
        const selectedPlot = paramPlotId
          ? allPlots.find((p) => p.PlotId === Number(paramPlotId))
          : allPlots.find((p) => p.PlotId === 1) || allPlots[0];

        const selectedSeed = paramSeedId
          ? allSeeds.find((s) => s.SeedId === Number(paramSeedId))
          : allSeeds[0];

        const selectedPkg = paramPkgId
          ? allPkgs.find((pk) => pk.PackageId === Number(paramPkgId))
          : allPkgs[1] || allPkgs[0];

        if (selectedPlot) setPlot(selectedPlot);
        if (selectedSeed) setSeed(selectedSeed);
        if (selectedPkg) setCarePackage(selectedPkg);
      } catch (err) {
        console.error('Failed to load checkout details:', err);
        setErrorMessage('Không thể tải thông tin đơn hàng. Vui lòng thử lại!');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [initAuth, searchParams]);

  // Crop growth cycle & rental days calculation
  const growthDays = seed?.GrowthDurationDays || 45;
  const totalRentalDays = growthDays * cycles;

  // Day-based Transparent Pricing
  const plotBasePrice = plot?.BasePricePerMonth || 450000;
  const packageBasePrice = carePackage?.MonthlyFee || 250000;
  const seedPricePerCycle = seed?.SeedPrice || 45000;

  const plotDailyRate = plotBasePrice / 30;
  const packageDailyRate = packageBasePrice / 30;

  const rentalFee = Math.round(plotDailyRate * totalRentalDays);
  const careFee = Math.round(packageDailyRate * totalRentalDays);
  const totalSeedFee = seedPricePerCycle * cycles;

  const discountRate = cycles === 2 ? 0.05 : cycles >= 3 ? 0.10 : 0;
  const discountAmount = Math.round((rentalFee + careFee) * discountRate);
  const finalTotal = rentalFee + careFee + totalSeedFee - discountAmount;

  // Exact Dates calculation
  const now = new Date();
  const firstHarvestDate = new Date(now.getTime() + growthDays * 24 * 60 * 60 * 1000);
  const contractEndDate = new Date(now.getTime() + totalRentalDays * 24 * 60 * 60 * 1000);

  const formatDateVN = (d: Date) => {
    return d.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatVND = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  const handleConfirmPayment = async () => {
    if (!isAuthenticated) {
      router.push('/login?callbackUrl=/checkout');
      return;
    }

    if (!plot) {
      setErrorMessage('Không tìm thấy thông tin ô đất. Vui lòng chọn lại trên Bản đồ thuê đất!');
      return;
    }

    try {
      setIsProcessing(true);
      setErrorMessage(null);

      const res = await fetch('http://localhost:5000/api/orders/mock-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token || localStorage.getItem('plotfarm_token')}`,
        },
        body: JSON.stringify({
          plotId: plot.PlotId,
          seedId: seed?.SeedId || 1,
          carePackageId: carePackage?.PackageId || 1,
          cycles: cycles,
          rentalDays: totalRentalDays,
          paymentMethod: paymentMethod,
        }),
      });

      const data = await res.json();
      if (data.success && data.data) {
        setPaymentSuccess({
          ...data.data,
          growthDays,
          totalRentalDays,
          cycles,
          firstHarvestDate: formatDateVN(firstHarvestDate),
          contractEndDate: formatDateVN(contractEndDate),
        });
        localStorage.removeItem('pending_rental');
      } else {
        setErrorMessage(data.message || 'Thanh toán thất bại. Vui lòng thử lại!');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage('Lỗi kết nối máy chủ thanh toán. Vui lòng thử lại sau!');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col font-sans transition-colors duration-300">
      <Header />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Navigation & Status bar */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link href="/plots">
            <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Quay Lại Bản Đồ Ô Đất
            </Button>
          </Link>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Thanh Toán Theo Chu Kỳ Sinh Trưởng Thực Tế
            </span>
          </div>
        </div>

        {/* Loading Spinner */}
        {isLoading && (
          <div className="py-24 text-center space-y-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <Loader2 className="w-10 h-10 animate-spin text-emerald-500 mx-auto" />
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
              Đang chuẩn bị hợp đồng điện tử và biểu phí canh tác...
            </p>
          </div>
        )}

        {/* Success View after payment */}
        {!isLoading && paymentSuccess && (
          <div className="max-w-2xl mx-auto bg-white dark:bg-slate-900 p-8 sm:p-12 rounded-3xl border-2 border-emerald-500 shadow-2xl text-center space-y-6 animate-scale-up">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/30">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <span className="text-xs font-extrabold text-emerald-600 uppercase tracking-wider">
                Giao Dịch Thành Công 100% (Sandbox)
              </span>
              <h2 className="text-3xl font-black text-slate-900 dark:text-white">
                Chúc Mừng Bạn Đã Kích Hoạt Mùa Vụ!
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                Ô đất <strong className="text-emerald-600">{paymentSuccess.plotCode}</strong> đã được khởi tạo thành công với chu kỳ <strong>{paymentSuccess.totalRentalDays} ngày ({paymentSuccess.cycles} vụ)</strong>.
              </p>
            </div>

            {/* Receipt Summary */}
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 text-left space-y-3 text-xs">
              <div className="flex justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
                <span className="text-slate-500">Mã đơn thuê:</span>
                <span className="font-extrabold text-slate-900 dark:text-white">{paymentSuccess.orderCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Vị trí ô đất:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{paymentSuccess.plotCode} ({plot?.SizeM2 || 15} m²)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Giống cây đăng ký:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{paymentSuccess.seedName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Thời gian thuê đất:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {paymentSuccess.totalRentalDays} ngày ({paymentSuccess.cycles} vụ)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Thu hoạch dự kiến đợt 1:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{paymentSuccess.firstHarvestDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Gói chăm sóc:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{paymentSuccess.packageName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Phương thức thanh toán:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">{paymentMethod}</span>
              </div>
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between text-base font-black">
                <span>Tổng tiền đã thanh toán:</span>
                <span className="text-emerald-600 dark:text-emerald-400">{formatVND(paymentSuccess.totalAmount)}</span>
              </div>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/my-farm" className="w-full sm:w-auto">
                <Button
                  variant="primary"
                  size="lg"
                  rightIcon={<ArrowRight className="w-5 h-5" />}
                  className="w-full sm:w-auto font-bold shadow-xl shadow-emerald-500/25 px-8 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white"
                >
                  Vào Xem Nông Trại Của Tôi Ngay
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Normal Checkout Flow */}
        {!isLoading && !paymentSuccess && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left: Crop Cycle Selector & Payment Method */}
            <div className="lg:col-span-7 space-y-6">
              {/* Alert error if any */}
              {errorMessage && (
                <div className="p-4 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 rounded-2xl flex items-center gap-3 text-red-700 dark:text-red-300 text-xs">
                  <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* 1. Chọn thời gian thuê theo CHU KỲ SINH TRƯỞNG CỦA CÂY */}
              <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <Clock className="w-5 h-5 text-emerald-500" /> Thời Gian Thuê Theo Chu Kỳ Sinh Trưởng
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Chu kỳ sinh trưởng của <strong className="text-emerald-600">{seed?.SeedName || 'cây trồng'}</strong> là <strong>{growthDays} ngày/vụ</strong>. Thời gian thuê đất được khớp chính xác theo vụ, không làm tròn tháng.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {[
                    {
                      val: 1,
                      title: '1 Vụ Thu Hoạch',
                      days: `${growthDays} ngày`,
                      discount: 'Chuẩn theo vụ',
                      badge: 'Phổ biến',
                    },
                    {
                      val: 2,
                      title: '2 Vụ Liên Tiếp',
                      days: `${growthDays * 2} ngày`,
                      discount: 'Giảm 5% phí',
                      badge: 'Tiết kiệm',
                    },
                    {
                      val: 3,
                      title: '3 Vụ Trọn Năm',
                      days: `${growthDays * 3} ngày`,
                      discount: 'Giảm 10% phí',
                      badge: 'Ưu đãi cao',
                    },
                  ].map((item) => (
                    <button
                      key={item.val}
                      type="button"
                      onClick={() => setCycles(item.val)}
                      className={`p-4 rounded-2xl border-2 text-center transition-all flex flex-col justify-between ${
                        cycles === item.val
                          ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 ring-2 ring-emerald-500/20 shadow-md'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <span className="text-xs font-semibold text-slate-400 block">{item.badge}</span>
                      <span className="text-base font-black block my-1">{item.title}</span>
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 block">
                        {item.days}
                      </span>
                      <span className="text-[10px] text-slate-500 mt-1 block">
                        {item.discount}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Timeline dates preview */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Ngày bắt đầu:</span>
                    <strong className="text-slate-800 dark:text-slate-200">{formatDateVN(now)}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Thu hoạch đợt 1:</span>
                    <strong className="text-emerald-600 dark:text-emerald-400">{formatDateVN(firstHarvestDate)}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Ngày kết thúc hợp đồng:</span>
                    <strong className="text-slate-800 dark:text-slate-200">{formatDateVN(contractEndDate)}</strong>
                  </div>
                </div>
              </div>

              {/* 2. Phương thức thanh toán Sandbox */}
              <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-emerald-500" /> Chọn Cổng Thanh Toán Sandbox
                  </h3>
                  <Badge variant="warning" size="sm">MÔ PHỎNG AN TOÀN</Badge>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Hệ thống sử dụng cổng thanh toán thử nghiệm (Sandbox), bạn không bị trừ tiền thật khi bấm thanh toán.
                </p>

                <div className="space-y-3">
                  {/* MoMo */}
                  <label
                    onClick={() => setPaymentMethod('MOMO')}
                    className={`flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                      paymentMethod === 'MOMO'
                        ? 'border-pink-500 bg-pink-50/40 dark:bg-pink-950/20 ring-2 ring-pink-500/20'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-pink-600 text-white flex items-center justify-center font-black text-lg">
                        M
                      </div>
                      <div>
                        <span className="font-extrabold text-sm text-slate-900 dark:text-white block">Ví Điện Tử MoMo (Sandbox)</span>
                        <span className="text-xs text-slate-500">Xác nhận thanh toán tức thì qua App MoMo</span>
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'MOMO' ? 'border-pink-500 bg-pink-500 text-white' : 'border-slate-300'}`}>
                      {paymentMethod === 'MOMO' && <Check className="w-3 h-3" />}
                    </div>
                  </label>

                  {/* VNPAY */}
                  <label
                    onClick={() => setPaymentMethod('VNPAY')}
                    className={`flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                      paymentMethod === 'VNPAY'
                        ? 'border-blue-500 bg-blue-50/40 dark:bg-blue-950/20 ring-2 ring-blue-500/20'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-lg">
                        V
                      </div>
                      <div>
                        <span className="font-extrabold text-sm text-slate-900 dark:text-white block">Cổng VNPAY (Sandbox)</span>
                        <span className="text-xs text-slate-500">Quét mã VNPAY-QR hoặc Thẻ ATM nội địa</span>
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'VNPAY' ? 'border-blue-500 bg-blue-500 text-white' : 'border-slate-300'}`}>
                      {paymentMethod === 'VNPAY' && <Check className="w-3 h-3" />}
                    </div>
                  </label>

                  {/* QR Banking */}
                  <label
                    onClick={() => setPaymentMethod('QR_BANK')}
                    className={`flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                      paymentMethod === 'QR_BANK'
                        ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-lg">
                        <QrCode className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="font-extrabold text-sm text-slate-900 dark:text-white block">Chuyển Khoản Tự Động (VietQR)</span>
                        <span className="text-xs text-slate-500">Mã QR tự động khớp lệnh chuyển tiền 24/7</span>
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'QR_BANK' ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-300'}`}>
                      {paymentMethod === 'QR_BANK' && <Check className="w-3 h-3" />}
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Right: Order Summary Breakdown & Action */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-white dark:bg-slate-900 p-6 sm:p-7 rounded-3xl border-2 border-emerald-500/80 shadow-xl space-y-6">
                <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">Chi Tiết Hợp Đồng Canh Tác</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Tính phí minh bạch theo ngày sinh trưởng thực tế ({totalRentalDays} ngày)
                  </p>
                </div>

                {/* Items */}
                <div className="space-y-4 text-xs">
                  {/* Plot Item */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-emerald-500 shrink-0" />
                      <div>
                        <span className="font-extrabold text-slate-800 dark:text-slate-200 block">
                          Ô đất {plot?.PlotCode || 'PLOT_A01'} ({plot?.SizeM2 || 15} m²)
                        </span>
                        <span className="text-slate-400">
                          {totalRentalDays} ngày thuê đất ({formatVND(Math.round(plotDailyRate))}/ngày)
                        </span>
                      </div>
                    </div>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {formatVND(rentalFee)}
                    </span>
                  </div>

                  {/* Seed Item */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Sprout className="w-4 h-4 text-emerald-500 shrink-0" />
                      <div>
                        <span className="font-extrabold text-slate-800 dark:text-slate-200 block">
                          Giống {seed?.SeedName || 'Hạt giống'} ({cycles} vụ)
                        </span>
                        <span className="text-slate-400">
                          Chu kỳ: {growthDays} ngày/vụ • ~{Math.round((plot?.SizeM2 || 15) * (seed?.ExpectedYieldKgPerM2 || 3))} kg/vụ
                        </span>
                      </div>
                    </div>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {formatVND(totalSeedFee)}
                    </span>
                  </div>

                  {/* Care Package Item */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-emerald-500 shrink-0" />
                      <div>
                        <span className="font-extrabold text-slate-800 dark:text-slate-200 block">
                          {carePackage?.PackageName || 'Gói Chăm Sóc'}
                        </span>
                        <span className="text-slate-400">
                          {totalRentalDays} ngày dịch vụ ({formatVND(Math.round(packageDailyRate))}/ngày)
                        </span>
                      </div>
                    </div>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {formatVND(careFee)}
                    </span>
                  </div>

                  {/* Discount Item if any */}
                  {discountAmount > 0 && (
                    <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 font-bold pt-2 border-t border-slate-100 dark:border-slate-800">
                      <span className="flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5" /> Ưu đãi thuê nhiều vụ (-{discountRate * 100}%):
                      </span>
                      <span>-{formatVND(discountAmount)}</span>
                    </div>
                  )}

                  {/* Final Total */}
                  <div className="pt-4 border-t border-slate-200 dark:border-slate-700 flex items-baseline justify-between">
                    <div>
                      <span className="text-xs font-semibold text-slate-500 block">Tổng thanh toán ({totalRentalDays} ngày):</span>
                      <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                        {formatVND(finalTotal)}
                      </span>
                    </div>
                    <Badge variant="success" size="sm">MIỄN PHÍ VẬN CHUYỂN ĐỢT 1</Badge>
                  </div>
                </div>

                {/* Commitments */}
                <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-xs text-emerald-800 dark:text-emerald-300 space-y-1">
                  <p className="font-bold flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Cam Kết Nông Nghiệp Hữu Cơ
                  </p>
                  <p className="leading-relaxed">
                    Theo dõi trực tiếp quá trình gieo trồng qua Camera 1080p và nhận nhật ký chăm sóc hàng tuần trên ứng dụng.
                  </p>
                </div>

                {/* Submit button */}
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full justify-center shadow-xl shadow-emerald-500/25 py-4 font-black text-base"
                  disabled={isProcessing}
                  onClick={handleConfirmPayment}
                >
                  {isProcessing ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Đang Kích Hoạt Hợp Đồng...</span>
                    </div>
                  ) : (
                    `Xác Nhận & Kích Hoạt Vụ (${formatVND(finalTotal)})`
                  )}
                </Button>

                <p className="text-[11px] text-center text-slate-400">
                  Bằng việc bấm xác nhận, bạn đồng ý với Điều khoản dịch vụ và Chính sách canh tác của PlotFarm.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}


export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-600 gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
          <p className="text-sm font-semibold">Đang tải thông tin thanh toán...</p>
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
