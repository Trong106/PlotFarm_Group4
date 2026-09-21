'use client';

import React, { useEffect, useState, useMemo, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Copy,
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
  PlusCircle,
  Sprout,
  Package,
  Calendar,
  Lock,
  ArrowRight,
  Loader2,
  Check,
  Video,
  Scale,
  RefreshCw,
  Edit3,
  ExternalLink
} from 'lucide-react';
import Header from '@/components/Header';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent } from '@/components/ui/Card';
import { useAuthStore } from '@/store/useAuthStore';
import { useAddressStore, UserAddress } from '@/store/useAddressStore';
import { toast } from '@/store/useToastStore';
import { AddressModal } from '@/components/profile/AddressModal';

interface PlotData {
  PlotId: number;
  PlotCode: string;
  AreaName?: string;
  SizeM2: number;
  SoilPH: number;
  StandardHumidity: number;
  BasePricePerMonth: number;
  Status?: string;
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
  const [paymentMethod, setPaymentMethod] = useState<'MOMO' | 'VNPAY' | 'QR_BANK' | 'ATM'>('QR_BANK');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Address Book Synchronization & In-Checkout Address Management
  const { addresses, fetchAddresses, setDefaultAddress } = useAddressStore();
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState<boolean>(false);
  const [isAddressSelectorOpen, setIsAddressSelectorOpen] = useState<boolean>(false);
  const [editingAddress, setEditingAddress] = useState<UserAddress | null>(null);

  // Active delivery address
  const activeAddress = useMemo(() => {
    if (selectedAddressId) {
      const found = addresses.find((a) => a.addressId === selectedAddressId);
      if (found) return found;
    }
    return addresses.find((a) => a.isDefault) || addresses[0] || null;
  }, [addresses, selectedAddressId]);

  // VietQR Dynamic Modal & 15-Minute Reservation Timer
  const [isQRModalOpen, setIsQRModalOpen] = useState<boolean>(false);
  const [countdownSeconds, setCountdownSeconds] = useState<number>(15 * 60); // 15 mins (900s)
  const [reservationStatus, setReservationStatus] = useState<'IDLE' | 'RESERVED' | 'CONFLICT' | 'EXPIRED'>('IDLE');
  const [reservationError, setReservationError] = useState<string | null>(null);
  const [isVerifyingTransfer, setIsVerifyingTransfer] = useState<boolean>(false);
  const [transactionRef, setTransactionRef] = useState<string>('');

  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  // Sinh mã giao dịch khớp lệnh VietQR
  useEffect(() => {
    if (plot) {
      const cleanCode = plot.PlotCode.replace(/[^a-zA-Z0-9]/g, '');
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      setTransactionRef(`PF${cleanCode}_${randomSuffix}`);
    }
  }, [plot]);

  // Khóa độc quyền ô đất 15 phút (BR-10)
  const handleReservePlot = useCallback(async (targetPlotId: number) => {
    try {
      const authToken = token || localStorage.getItem('plotfarm_token');
      if (!authToken) return false;

      const res = await fetch('http://localhost:5000/api/plots/reserve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ plotId: targetPlotId }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setReservationStatus('RESERVED');
        setReservationError(null);
        setCountdownSeconds(15 * 60);
        return true;
      } else {
        setReservationStatus('CONFLICT');
        setReservationError(data.message || 'Ô đất đang có khách hàng khác giữ chỗ độc quyền trong 15 phút.');
        toast.error(data.message || 'Ô đất đang có người khác giữ chỗ độc quyền.', 'Giữ chỗ thất bại');
        return false;
      }
    } catch (err: any) {
      console.warn('[Checkout] Lỗi gọi API giữ chỗ:', err);
      return false;
    }
  }, [token]);

  // Hủy giữ chỗ ô đất khi hết giờ hoặc hủy giao dịch

  const handleReleasePlot = useCallback(async (targetPlotId: number) => {
    try {
      const authToken = token || localStorage.getItem('plotfarm_token');
      if (!authToken) return;

      await fetch('http://localhost:5000/api/plots/release', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ plotId: targetPlotId }),
      });
      setReservationStatus('EXPIRED');
    } catch (err) {
      console.warn('[Checkout] Lỗi giải phóng ô đất:', err);
    }
  }, [token]);

  // 15-Minute Countdown Timer
  useEffect(() => {
    if (!isQRModalOpen && reservationStatus !== 'RESERVED') return;
    const timer = setInterval(() => {
      setCountdownSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          if (plot?.PlotId) {
            handleReleasePlot(plot.PlotId);
          }
          setReservationStatus('EXPIRED');
          toast.error('Đã hết hạn 15 phút giữ chỗ ô đất. Vui lòng giữ chỗ lại để tiếp tục!', 'Hết Hạn Giữ Chỗ');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isQRModalOpen, reservationStatus, plot, handleReleasePlot]);

  const formatCountdown = (totalSec: number) => {
    const minutes = Math.floor(totalSec / 60);
    const seconds = totalSec % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`Đã sao chép ${label} vào clipboard!`, 'Sao chép thành công');
  };

  const [paymentSuccess, setPaymentSuccess] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Role Guard: Prevent Admin & Staff from placing customer orders
  useEffect(() => {
    if (user) {
      const role = (user.role || user.roleName || '').toLowerCase();
      if (role === 'admin' || user.roleId === 1) {
        router.replace('/admin');
      } else if (role === 'staff' || user.roleId === 2) {
        router.replace('/staff');
      }
    }
  }, [user, router]);

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

        if (selectedPlot) {
          setPlot(selectedPlot);
          // Tự động kích hoạt khóa giữ chỗ 15 phút cho ô đất này
          handleReservePlot(selectedPlot.PlotId);
        }
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
  }, [initAuth, searchParams, handleReservePlot]);

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

  // URL VietQR chính thức Napas 247
  const vietQrUrl = useMemo(() => {
    if (!finalTotal || !transactionRef) return '';
    return `https://img.vietqr.io/image/vietcombank-999888666888-compact2.png?amount=${finalTotal}&addInfo=${encodeURIComponent(transactionRef)}&accountName=PLOTFARM%20AGRI%20TECH`;
  }, [finalTotal, transactionRef]);

  // Khớp lệnh thanh toán VietQR & Kích hoạt canh tác
  const handleConfirmTransferComplete = async () => {
    if (!plot) return;

    // Nếu đã hết hạn giữ chỗ
    if (countdownSeconds <= 0 || reservationStatus === 'EXPIRED') {
      toast.error('Thời gian 15 phút giữ chỗ đã kết thúc. Vui lòng giữ chỗ lại trước khi xác nhận thanh toán.', 'Hết Hạn');
      return;
    }

    setIsVerifyingTransfer(true);
    try {
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
          paymentMethod: 'QR_BANK',
        }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        localStorage.removeItem('pending_rental');
        setIsVerifyingTransfer(false);
        setIsQRModalOpen(false);
        setPaymentSuccess({
          ...data.data,
          growthDays,
          totalRentalDays,
          cycles,
          firstHarvestDate: formatDateVN(firstHarvestDate),
          contractEndDate: formatDateVN(contractEndDate),
        });
        toast.success(
          `Thanh toán VietQR thành công! Ô đất ${plot.PlotCode} đã kích hoạt canh tác.`,
          'Khớp Lệnh Thành Công'
        );
      } else {
        setIsVerifyingTransfer(false);
        toast.error(data.message || 'Khớp lệnh chuyển khoản thất bại. Vui lòng thử lại!', 'Thất Bại');
      }
    } catch (err) {
      console.warn('Backend order placement via VietQR failed:', err);
      setIsVerifyingTransfer(false);
      toast.error('Lỗi kết nối máy chủ khi xác minh thanh toán.', 'Lỗi');
    }
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

    // Kiểm tra xung đột giữ chỗ
    if (reservationStatus === 'CONFLICT') {
      toast.error('Ô đất đang được khách hàng khác giữ chỗ. Vui lòng chọn ô đất khác!', 'Ô đất đang bị khóa');
      return;
    }

    // Nếu thời gian giữ chỗ hết hạn, gia hạn giữ chỗ lại
    if (countdownSeconds <= 0 || reservationStatus === 'EXPIRED') {
      const ok = await handleReservePlot(plot.PlotId);
      if (!ok) return;
    }

    // VietQR Flow: Trigger dynamic QR code modal with 15-minute reservation timer
    if (paymentMethod === 'QR_BANK') {
      setIsQRModalOpen(true);
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
            {reservationStatus === 'RESERVED' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                Khóa độc quyền ô đất: <strong className="font-mono ml-1">{formatCountdown(countdownSeconds)}</strong>
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Thanh Toán Theo Chu Kỳ Sinh Trưởng Thực Tế
            </span>
          </div>
        </div>

        {/* Banner cảnh báo xung đột giữ chỗ ô đất nếu có khách khác đặt */}
        {reservationStatus === 'CONFLICT' && (
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <div>
                <span className="font-black text-sm block">Ô đất {plot?.PlotCode} đang được khách hàng khác giữ chỗ!</span>
                <p className="opacity-90 mt-0.5">{reservationError || 'Ô đất đang bị khóa độc quyền 15 phút. Bạn vui lòng chọn ô đất khác đang sẵn sàng.'}</p>
              </div>
            </div>
            <Link href="/plots">
              <Button variant="danger" size="sm" className="shrink-0 font-bold">
                Chọn Ô Đất Khác Trên Bản Đồ
              </Button>
            </Link>
          </div>
        )}

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
                Giao Dịch Thành Công 100% (Khớp Lệnh VietQR)
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
                <span className="text-slate-500">Mã giao dịch VietQR:</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  {paymentSuccess.transactionCode || transactionRef}
                </span>
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
              {activeAddress && (
                <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-700">
                  <span className="text-slate-500">Địa chỉ nhận nông sản:</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200 text-right max-w-xs">
                    {activeAddress.recipientName} ({activeAddress.phoneNumber}) - {activeAddress.addressLine}, {activeAddress.ward}, {activeAddress.province}
                  </span>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <Link href="/my-farm">
                <Button variant="primary" size="lg" className="w-full sm:w-auto shadow-xl shadow-emerald-500/30">
                  Vào Trang Nông Trại Của Tôi Ngay
                </Button>
              </Link>
              <Link href="/profile">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  Xem Lịch Sử Đơn Thuê
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Main 2-Column Form */}
        {!isLoading && !paymentSuccess && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left: Configuration Steps */}
            <div className="lg:col-span-7 space-y-6">
              {/* 1. Chọn chu kỳ canh tác */}
              <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-emerald-500" /> 1. Chọn Số Vụ Canh Tác
                  </h3>
                  <Badge variant="success" size="sm">
                    {seed?.SeedName || 'Cây trồng'} ({growthDays} ngày/vụ)
                  </Badge>
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Thời hạn hợp đồng gắn liền trực tiếp với chu kỳ sinh trưởng của hạt giống đã chọn.
                </p>

                <div className="grid grid-cols-3 gap-3">
                  {[
                    {
                      val: 1,
                      title: '1 Vụ Trồng',
                      days: `${growthDays} ngày`,
                      discount: 'Giá chuẩn',
                      badge: 'Cơ bản',
                    },
                    {
                      val: 2,
                      title: '2 Vụ Canh Tác',
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

                {/* Timeline preview */}
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
                    <span className="text-slate-400 block text-[11px]">Kết thúc hợp đồng:</span>
                    <strong className="text-slate-800 dark:text-slate-200">{formatDateVN(contractEndDate)}</strong>
                  </div>
                </div>
              </div>

              {/* 2. Địa chỉ nhận nông sản khi thu hoạch (Việc làm 2) */}
              <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-emerald-500" /> 2. Địa Chỉ Nhận Nông Sản Khi Thu Hoạch
                  </h3>
                  <div className="flex items-center gap-2">
                    {addresses.length > 1 && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        onClick={() => setIsAddressSelectorOpen(true)}
                      >
                        Đổi Địa Chỉ ({addresses.length})
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={() => {
                        setEditingAddress(null);
                        setIsAddressModalOpen(true);
                      }}
                      leftIcon={<PlusCircle className="w-3.5 h-3.5" />}
                    >
                      Thêm Mới
                    </Button>
                  </div>
                </div>

                {activeAddress ? (
                  <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 flex items-start justify-between gap-3">
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-white text-sm">
                          {activeAddress.recipientName}
                        </span>
                        <span className="font-mono text-emerald-700 dark:text-emerald-400 font-semibold">
                          ({activeAddress.phoneNumber})
                        </span>
                        {activeAddress.isDefault && (
                          <Badge variant="success" size="sm">Mặc Định</Badge>
                        )}
                      </div>
                      <p className="text-slate-600 dark:text-slate-300">
                        {activeAddress.addressLine}, {activeAddress.ward}, {activeAddress.district ? `${activeAddress.district}, ` : ''}{activeAddress.province}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingAddress(activeAddress);
                          setIsAddressModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900 text-slate-500 hover:text-emerald-700 transition-colors"
                        title="Chỉnh sửa địa chỉ"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 ml-1" />
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-800/50 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="text-xs text-amber-800 dark:text-amber-300 text-center sm:text-left">
                      <p className="font-bold">Bạn chưa có địa chỉ giao nhận nông sản!</p>
                      <p className="opacity-80 mt-0.5">Vui lòng thêm địa chỉ nhận hàng để PlotFarm giao rau sạch tận nhà khi đến kỳ thu hoạch.</p>
                    </div>
                    <Button
                      variant="primary"
                      size="sm"
                      className="text-xs shrink-0 font-bold"
                      onClick={() => {
                        setEditingAddress(null);
                        setIsAddressModalOpen(true);
                      }}
                    >
                      + Thêm Địa Chỉ Ngay
                    </Button>
                  </div>
                )}
              </div>

              {/* 3. Phương thức thanh toán */}
              <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-emerald-500" /> 3. Phương Thức Thanh Toán
                  </h3>
                  <Badge variant="warning" size="sm">VIETQR ĐẾM NGƯỢC 15 PHÚT</Badge>
                </div>

                <div className="space-y-3">
                  {/* VietQR Bank */}
                  <label
                    onClick={() => setPaymentMethod('QR_BANK')}
                    className={`flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                      paymentMethod === 'QR_BANK'
                        ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20 ring-2 ring-emerald-500/20 shadow-sm'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black">
                        <QrCode className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                          Mã VietQR Động (Khuyên dùng)
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-2 py-0.5 rounded-full font-bold">
                            Tự động 24/7
                          </span>
                        </span>
                        <span className="text-xs text-slate-500">Khóa giữ chỗ 15 phút, quét mã thanh toán tức thì mọi ngân hàng</span>
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'QR_BANK' ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-300'}`}>
                      {paymentMethod === 'QR_BANK' && <Check className="w-3 h-3" />}
                    </div>
                  </label>

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
                        <span className="font-extrabold text-sm text-slate-900 dark:text-white block">Ví Điện Tử MoMo</span>
                        <span className="text-xs text-slate-500">Xác nhận thanh toán tức thì qua App MoMo</span>
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'MOMO' ? 'border-pink-500 bg-pink-500 text-white' : 'border-slate-300'}`}>
                      {paymentMethod === 'MOMO' && <Check className="w-3 h-3" />}
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Right: Order Summary Breakdown & Action */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-white dark:bg-slate-900 p-6 sm:p-7 rounded-3xl border-2 border-emerald-500/80 shadow-xl space-y-6 sticky top-6">
                <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-black text-slate-900 dark:text-white">Chi Tiết Hợp Đồng Canh Tác</h3>
                    {reservationStatus === 'RESERVED' && (
                      <span className="text-[11px] font-mono font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/80 px-2 py-0.5 rounded-lg border border-amber-200 dark:border-amber-800">
                        {formatCountdown(countdownSeconds)}
                      </span>
                    )}
                  </div>
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
                  disabled={isProcessing || reservationStatus === 'CONFLICT'}
                  onClick={handleConfirmPayment}
                >
                  {isProcessing ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Đang Kích Hoạt Hợp Đồng...</span>
                    </div>
                  ) : paymentMethod === 'QR_BANK' ? (
                    `Quét Mã VietQR (${formatVND(finalTotal)})`
                  ) : (
                    `Xác Nhận & Kích Hoạt Vụ (${formatVND(finalTotal)})`
                  )}
                </Button>

                {errorMessage && (
                  <p className="text-xs text-rose-500 font-semibold text-center bg-rose-50 dark:bg-rose-950/50 p-2.5 rounded-xl border border-rose-200">
                    {errorMessage}
                  </p>
                )}

                <p className="text-[11px] text-center text-slate-400">
                  Bằng việc bấm xác nhận, bạn đồng ý với Điều khoản dịch vụ và Chính sách canh tác của PlotFarm.
                </p>
              </div>
            </div>
          </div>
        )}

      {/* Address creation / edit modal in checkout */}
      <AddressModal
        isOpen={isAddressModalOpen}
        initialData={editingAddress}
        onClose={() => {
          setIsAddressModalOpen(false);
          setEditingAddress(null);
        }}
        onSuccess={() => {
          fetchAddresses();
          setIsAddressModalOpen(false);
          setEditingAddress(null);
          toast.success('Đã lưu địa chỉ nhận nông sản thành công!', 'Sổ Địa Chỉ');
        }}
      />

      {/* Address selection modal when user has multiple addresses */}
      <Modal
        isOpen={isAddressSelectorOpen}
        onClose={() => setIsAddressSelectorOpen(false)}
        title="Chọn Địa Chỉ Giao Nhận Nông Sản"
        maxWidth="md"
        footer={
          <div className="flex items-center justify-between w-full">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsAddressSelectorOpen(false);
                setEditingAddress(null);
                setIsAddressModalOpen(true);
              }}
              leftIcon={<PlusCircle className="w-3.5 h-3.5" />}
            >
              Thêm Địa Chỉ Mới
            </Button>
            <Button variant="primary" size="sm" onClick={() => setIsAddressSelectorOpen(false)}>
              Hoàn Tất
            </Button>
          </div>
        }
      >
        <div className="space-y-3 text-left max-h-96 overflow-y-auto pr-1">
          {addresses.map((addr) => {
            const isSelected = activeAddress?.addressId === addr.addressId;
            return (
              <div
                key={addr.addressId}
                onClick={() => {
                  setSelectedAddressId(addr.addressId);
                }}
                className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex items-start justify-between gap-3 ${
                  isSelected
                    ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-white text-sm">
                      {addr.recipientName}
                    </span>
                    <span className="font-mono text-slate-500">
                      ({addr.phoneNumber})
                    </span>
                    {addr.isDefault && (
                      <Badge variant="success" size="sm">Mặc định</Badge>
                    )}
                  </div>
                  <p className="text-slate-600 dark:text-slate-300">
                    {addr.addressLine}, {addr.ward}, {addr.district ? `${addr.district}, ` : ''}{addr.province}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {!addr.isDefault && (
                    <button
                      type="button"
                      onClick={async (e) => {
                        e.stopPropagation();
                        await setDefaultAddress(addr.addressId);
                      }}
                      className="text-[11px] text-emerald-600 hover:underline font-semibold"
                    >
                      Đặt mặc định
                    </button>
                  )}
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    isSelected ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-300'
                  }`}>
                    {isSelected && <Check className="w-3 h-3" />}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Modal>

      {/* VIETQR DYNAMIC PAYMENT MODAL WITH 15-MINUTE RESERVATION COUNTDOWN */}
      <Modal
        isOpen={isQRModalOpen}
        onClose={() => setIsQRModalOpen(false)}
        title="Thanh Toán Tự Động Qua Mã VietQR"
        maxWidth="lg"
        footer={
          <div className="flex flex-col sm:flex-row items-center justify-between w-full gap-3">
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Clock className="w-4 h-4 text-amber-500" />
              <span>
                Thời gian giữ ô đất còn:{' '}
                <strong className={`font-mono font-bold ${countdownSeconds < 180 ? 'text-rose-600 animate-pulse' : 'text-amber-600 dark:text-amber-400'}`}>
                  {formatCountdown(countdownSeconds)}
                </strong>
              </span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              {countdownSeconds <= 0 && plot && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleReservePlot(plot.PlotId)}
                  leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                  className="text-amber-600 border-amber-300"
                >
                  Giữ Chỗ Lại 15 Phút
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsQRModalOpen(false)}
                disabled={isVerifyingTransfer}
              >
                Đóng
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirmTransferComplete}
                disabled={isVerifyingTransfer || countdownSeconds <= 0}
                leftIcon={isVerifyingTransfer ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                className="font-black shadow-lg shadow-emerald-500/25 px-5"
              >
                {isVerifyingTransfer ? 'Đang Khớp Lệnh Ngân Hàng...' : 'Tôi Đã Chuyển Khoản'}
              </Button>
            </div>
          </div>
        }
      >
        <div className="space-y-4 text-left">
          {/* Reservation Countdown Alert */}
          <div className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 text-xs ${
            countdownSeconds < 180
              ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200'
              : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-300'
          }`}>
            <div className="flex items-center gap-2">
              <Clock className={`w-4 h-4 ${countdownSeconds < 180 ? 'text-rose-600' : 'text-amber-600'} animate-pulse`} />
              <span>
                Ô đất <strong className="font-bold text-slate-900 dark:text-white">{plot?.PlotCode || 'PLOT_A01'}</strong> đang được khóa giữ chỗ độc quyền trong:
              </span>
            </div>
            <span className={`font-mono font-black text-sm px-2.5 py-0.5 rounded-lg ${
              countdownSeconds < 180
                ? 'bg-rose-200 text-rose-900 dark:bg-rose-900 dark:text-rose-100'
                : 'bg-amber-200/80 dark:bg-amber-900/80 text-amber-900 dark:text-amber-100'
            }`}>
              {formatCountdown(countdownSeconds)}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
            {/* Left: Dynamic QR Box */}
            <div className="md:col-span-5 flex flex-col items-center justify-center p-4 rounded-3xl bg-white dark:bg-slate-900 border-2 border-emerald-500/40 shadow-inner">
              <div className="relative p-2 bg-white rounded-2xl shadow-md border border-slate-100">
                {vietQrUrl ? (
                  <div className="relative">
                    <img
                      src={vietQrUrl}
                      alt="Mã VietQR Chuyển Khoản"
                      className="w-48 h-auto max-h-56 object-contain rounded-xl mx-auto"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        const el = document.getElementById('qr-fallback');
                        if (el) el.style.display = 'flex';
                      }}
                    />
                    <div
                      id="qr-fallback"
                      style={{ display: 'none' }}
                      className="w-44 h-44 bg-slate-50 rounded-xl flex-col items-center justify-center border-2 border-dashed border-emerald-400 p-2 text-center"
                    >
                      <QrCode className="w-20 h-20 text-emerald-700 mx-auto" />
                      <span className="text-[10px] font-bold text-emerald-800 mt-2 block">VIETQR NAPAS 247</span>
                    </div>
                  </div>
                ) : (
                  <div className="w-44 h-44 bg-slate-50 rounded-xl flex flex-col items-center justify-center border-2 border-dashed border-emerald-400 p-2 text-center">
                    <QrCode className="w-20 h-20 text-emerald-700" />
                    <span className="text-[10px] font-bold text-emerald-800 mt-2">VIETQR NAPAS 247</span>
                  </div>
                )}
              </div>
              <p className="text-[11px] text-slate-400 text-center mt-2">
                Mở App Ngân Hàng quét mã để chuyển khoản chính xác tự động
              </p>
            </div>

            {/* Right: Transfer Details */}
            <div className="md:col-span-7 space-y-2.5 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Ngân hàng thụ hưởng:</span>
                  <span className="font-extrabold text-slate-800 dark:text-slate-100">Vietcombank (CN TP.HCM)</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Chủ tài khoản:</span>
                  <span className="font-extrabold text-slate-800 dark:text-slate-100 uppercase">PLOTFARM AGRI TECH</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Số tài khoản:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 text-sm">999888666888</span>
                    <button
                      type="button"
                      onClick={() => handleCopyText('999888666888', 'Số tài khoản')}
                      className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-500 hover:text-emerald-600 transition-colors"
                      title="Sao chép"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-1.5 border-t border-slate-200 dark:border-slate-700">
                  <span className="text-slate-500">Số tiền chính xác:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-black text-emerald-600 dark:text-emerald-400 text-base">
                      {formatVND(finalTotal)}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyText(String(finalTotal), 'Số tiền')}
                      className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-500 hover:text-emerald-600 transition-colors"
                      title="Sao chép"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-1.5 border-t border-slate-200 dark:border-slate-700">
                  <span className="text-slate-500">Nội dung chuyển tiền:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-black text-amber-600 dark:text-amber-400 text-xs bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800">
                      {transactionRef}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyText(transactionRef, 'Nội dung chuyển tiền')}
                      className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-500 hover:text-emerald-600 transition-colors"
                      title="Sao chép"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2 p-2.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 text-blue-800 dark:text-blue-300 text-[11px] leading-relaxed">
                <AlertCircle className="w-4 h-4 shrink-0 text-blue-500 mt-0.5" />
                <span>
                  Hệ thống ngân hàng đối soát giao dịch tự động. Sau khi chuyển tiền xong, bạn bấm <strong>&quot;Tôi Đã Chuyển Khoản&quot;</strong> để kích hoạt hợp đồng canh tác ngay!
                </span>
              </div>
            </div>
          </div>
        </div>
      </Modal>

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
