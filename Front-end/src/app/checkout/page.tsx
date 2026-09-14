'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  Check
} from 'lucide-react';
import Header from '@/components/Header';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent } from '@/components/ui/Card';
import { useAuthStore } from '@/store/useAuthStore';

export default function CheckoutPage() {
  const router = useRouter();
  const { user, token, isAuthenticated, initAuth } = useAuthStore();

  const [rentalConfig, setRentalConfig] = useState<any>(null);
  const [durationMonths, setDurationMonths] = useState<number>(1);
  const [paymentMethod, setPaymentMethod] = useState<'MOMO' | 'VNPAY' | 'QR_BANK' | 'ATM'>('MOMO');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [paymentSuccess, setPaymentSuccess] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    initAuth();
    // Load config from localStorage
    const saved = localStorage.getItem('pending_rental');
    if (saved) {
      try {
        setRentalConfig(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }
  }, [initAuth]);

  // Pricing
  const plotBasePrice = 450000;
  const seedPrice = 45000;
  const packagePrice = 450000;

  const discountRate = durationMonths === 3 ? 0.05 : durationMonths === 6 ? 0.1 : 0;
  const subtotal = (plotBasePrice + packagePrice) * durationMonths + seedPrice;
  const discountAmount = Math.round(((plotBasePrice + packagePrice) * durationMonths) * discountRate);
  const finalTotal = subtotal - discountAmount;

  const formatVND = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  const handleConfirmPayment = async () => {
    if (!isAuthenticated) {
      router.push('/login?callbackUrl=/checkout');
      return;
    }

    if (!rentalConfig?.plotId) {
      setErrorMessage('Không tìm thấy thông tin ô đất đã chọn. Vui lòng chọn lại trên Bản đồ thuê đất!');
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
          plotId: rentalConfig.plotId,
          seedId: rentalConfig.seedId || 1,
          carePackageId: rentalConfig.packageId || 2,
          durationMonths: durationMonths,
          paymentMethod: paymentMethod,
        }),
      });

      const data = await res.json();
      if (data.success && data.data) {
        setPaymentSuccess(data.data);
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
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Cổng Thanh Toán Sandbox Bảo Mật
            </span>
          </div>
        </div>

        {/* Success View after payment */}
        {paymentSuccess ? (
          <div className="max-w-2xl mx-auto bg-white dark:bg-slate-900 p-8 sm:p-12 rounded-3xl border-2 border-emerald-500 shadow-2xl text-center space-y-6 animate-scale-up">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/30">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <span className="text-xs font-extrabold text-emerald-600 uppercase tracking-wider">
                Giao Dịch Thành Công 100%
              </span>
              <h2 className="text-3xl font-black text-slate-900 dark:text-white">
                Chúc Mừng Bạn Đã Sở Hữu Ô Đất!
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                Mùa vụ canh tác của bạn đã chính thức được kích hoạt. Đội ngũ kỹ sư PlotFarm đang chuẩn bị đất và hạt giống để bắt đầu gieo trồng!
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
                <span className="font-bold text-slate-800 dark:text-slate-200">{paymentSuccess.plotCode} (10 m²)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Giống cây đăng ký:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{paymentSuccess.seedName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Gói chăm sóc:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{paymentSuccess.packageName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Phương thức thanh toán:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">{paymentMethod} (Sandbox)</span>
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
                  Vào Xem Vườn Của Tôi Ngay
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          /* Normal Checkout Flow */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left: Duration & Payment Options */}
            <div className="lg:col-span-7 space-y-6">
              {/* Alert error if any */}
              {errorMessage && (
                <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 flex items-center gap-3 text-red-700 dark:text-red-300 text-xs">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <span className="font-semibold">{errorMessage}</span>
                </div>
              )}

              {/* 1. Chọn thời hạn thuê */}
              <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
                <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-emerald-500" /> Chọn Thời Hạn Canh Tác
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Thuê dài hạn giúp rau có đủ thời gian phát triển và nhận ưu đãi giảm giá dịch vụ
                </p>

                <div className="grid grid-cols-3 gap-3">
                  {[
                    { months: 1, label: '1 Tháng', discount: 'Chuẩn' },
                    { months: 3, label: '3 Tháng', discount: 'Giảm 5%' },
                    { months: 6, label: '6 Tháng', discount: 'Giảm 10%' },
                  ].map((item) => (
                    <button
                      key={item.months}
                      onClick={() => setDurationMonths(item.months)}
                      className={`p-4 rounded-2xl border-2 text-center transition-all ${
                        durationMonths === item.months
                          ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-200 font-extrabold shadow-sm'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <span className="text-base font-black block">{item.label}</span>
                      <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 block mt-0.5">
                        {item.discount}
                      </span>
                    </button>
                  ))}
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
                  Hệ thống sử dụng cổng thanh toán thử nghiệm (Sandbox), bạn không bị trừ tiền thật khi bấm thanh toán
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
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">Chi Tiết Hợp Đồng Thuê</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Hợp đồng canh tác nông nghiệp số chuẩn VietGAP
                  </p>
                </div>

                {/* Items */}
                <div className="space-y-4 text-xs">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-emerald-500 shrink-0" />
                      <div>
                        <span className="font-extrabold text-slate-800 dark:text-slate-200 block">
                          Ô đất {rentalConfig?.plotCode || 'PLOT_A01'} (10 m²)
                        </span>
                        <span className="text-slate-400">{durationMonths} tháng canh tác</span>
                      </div>
                    </div>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {formatVND(plotBasePrice * durationMonths)}
                    </span>
                  </div>

                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Sprout className="w-4 h-4 text-teal-500 shrink-0" />
                      <div>
                        <span className="font-extrabold text-slate-800 dark:text-slate-200 block">
                          Giống cây: {rentalConfig?.seedName || 'Xà lách xoong Đà Lạt'}
                        </span>
                        <span className="text-slate-400">Hạt giống thuần chủng F1</span>
                      </div>
                    </div>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {formatVND(seedPrice)}
                    </span>
                  </div>

                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-cyan-500 shrink-0" />
                      <div>
                        <span className="font-extrabold text-slate-800 dark:text-slate-200 block">
                          {rentalConfig?.packageName || 'Gói Hữu Cơ Nâng Cao (Organic Pro)'}
                        </span>
                        <span className="text-slate-400">{durationMonths} tháng chăm sóc 100%</span>
                      </div>
                    </div>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {formatVND(packagePrice * durationMonths)}
                    </span>
                  </div>

                  {discountAmount > 0 && (
                    <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 font-bold pt-2 border-t border-slate-100 dark:border-slate-800">
                      <span>Ưu đãi thuê dài hạn ({Math.round(discountRate * 100)}%):</span>
                      <span>-{formatVND(discountAmount)}</span>
                    </div>
                  )}

                  <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Tổng Thanh Toán</span>
                      <span className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
                        {formatVND(finalTotal)}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium text-right max-w-[120px] block">
                      Đã bao gồm thuế và bảo hiểm mùa vụ
                    </span>
                  </div>
                </div>

                {/* Submit Action */}
                <Button
                  variant="primary"
                  size="lg"
                  disabled={isProcessing}
                  onClick={handleConfirmPayment}
                  leftIcon={isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Lock className="w-5 h-5" />}
                  className="w-full font-black py-4 text-base shadow-xl shadow-emerald-500/25 bg-emerald-600 hover:bg-emerald-500 text-white"
                >
                  {isProcessing ? 'Đang Xử Lý Giao Dịch Sandbox...' : `Xác Nhận Thanh Toán (${paymentMethod})`}
                </Button>

                <p className="text-[11px] text-center text-slate-400 flex items-center justify-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  Mô phỏng Sandbox • Không phát sinh cước phí thực tế
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
