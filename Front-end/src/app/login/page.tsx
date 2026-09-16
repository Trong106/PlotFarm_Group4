'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Mail,
  Lock,
  ArrowRight,
  Sprout,
  Eye,
  EyeOff,
  Sparkles,
  Camera,
  Activity,
  Truck,
  Leaf,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  UserCheck,
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { Button } from '@/components/ui/Button';

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading, error: serverError, isAuthenticated, user, clearError } = useAuthStore();

  useEffect(() => {
    clearError();
    return clearError;
  }, [clearError]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [clientError, setClientError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // If already logged in, redirect to appropriate destination
  useEffect(() => {
    if (isAuthenticated && user) {
      setIsSuccess(true);
      const timer = setTimeout(() => {
        const userRole = (user.role || '').toLowerCase();
        if (userRole === 'admin') {
          router.push('/admin');
        } else if (userRole === 'staff') {
          router.push('/staff');
        } else {
          router.push('/my-farm');
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, user, router]);

  // Quick Account Autofill for seamless testing
  const selectQuickAccount = (quickEmail: string, quickPass: string) => {
    setEmail(quickEmail);
    setPassword(quickPass);
    setClientError(null);
  };

  // Validation
  const validateForm = () => {
    if (!email.trim()) {
      setClientError('Vui lòng nhập địa chỉ Email');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setClientError('Định dạng email không hợp lệ (ví dụ: user@domain.com)');
      return false;
    }
    if (!password) {
      setClientError('Vui lòng nhập mật khẩu');
      return false;
    }
    if (password.length < 4) {
      setClientError('Mật khẩu phải từ 4 ký tự trở lên');
      return false;
    }
    setClientError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const success = await login(email.trim().toLowerCase(), password);
    if (success) {
      setIsSuccess(true);
      const currentUser = useAuthStore.getState().user;
      const userRole = (currentUser?.role || '').toLowerCase();
      setTimeout(() => {
        if (userRole === 'admin') {
          router.push('/admin');
        } else if (userRole === 'staff') {
          router.push('/staff');
        } else {
          router.push('/my-farm');
        }
      }, 800);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col relative overflow-hidden font-sans">
      {/* Ambient Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-emerald-500/15 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-green-500/15 blur-[120px] pointer-events-none" />

      {/* Top Navigation Bar */}
      <header className="relative z-50 p-6 flex justify-between items-center max-w-7xl mx-auto w-full shrink-0">
        <Link href="/" className="flex items-center gap-3 group cursor-pointer">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-green-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform duration-200">
            <Sprout className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-xl text-slate-900 dark:text-white tracking-tight">PlotFarm</span>
            <span className="text-xs ml-2 px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-300/40">
              Smart Farm
            </span>
          </div>
        </Link>

        <div className="text-sm text-slate-600 dark:text-slate-400">
          Chưa có tài khoản?{' '}
          <Link
            href="/register"
            className="font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 transition-colors underline underline-offset-4 cursor-pointer"
          >
            Đăng ký ngay
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl w-full mx-auto px-4 py-8 sm:px-6 lg:px-8 relative z-10 flex-1 flex items-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

          {/* Left Column: Brand Showcase (Desktop only - Đồng bộ với trang Đăng ký) */}
          <div className="hidden lg:flex lg:col-span-5 flex-col space-y-8 pr-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-semibold w-fit">
              <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
              Nền Tảng Thuê Đất & Canh Tác Trực Tuyến
            </div>

            <div className="space-y-4">
              <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-[1.2]">
                Chào mừng bạn trở lại với{' '}
                <span className="bg-gradient-to-r from-emerald-600 to-green-500 bg-clip-text text-transparent">
                  Khu Vườn Của Bạn
                </span>
              </h1>
              <p className="text-base text-slate-600 dark:text-slate-400 leading-relaxed">
                Đăng nhập tài khoản để xem vườn rau qua Camera 24/7, theo dõi nhiệt độ sinh trưởng và nhận nông sản tươi sạch giao tận nhà.
              </p>
            </div>

            {/* Feature Highlights (3 thẻ tính năng đồng bộ tuyệt đối với trang đăng ký) */}
            <div className="space-y-4 pt-2">
              <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 shadow-sm backdrop-blur-sm">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <Camera className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Live Camera Trực Tiếp</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Giám sát ô đất của bạn mọi lúc, mọi nơi với video trực tuyến 24/7.</p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 shadow-sm backdrop-blur-sm">
                <div className="w-9 h-9 rounded-xl bg-green-100 dark:bg-green-950/80 text-green-600 dark:text-green-400 flex items-center justify-center shrink-0">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Theo Dõi Nhiệt Độ & Độ Ẩm</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Nắm bắt nhiệt độ thời tiết và độ ẩm luống rau dễ dàng ngay trên ứng dụng.</p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 shadow-sm backdrop-blur-sm">
                <div className="w-9 h-9 rounded-xl bg-teal-100 dark:bg-teal-950/80 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Thu Hoạch Giao Tận Cửa</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Đóng gói chuẩn VietGAP và giao nông sản tươi sạch tận nhà bạn.</p>
                </div>
              </div>
            </div>

            {/* Social Proof */}
            <div className="flex items-center gap-6 pt-4 border-t border-slate-200 dark:border-slate-800/80 text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-1.5 font-medium">
                <Leaf className="w-4 h-4 text-emerald-500" />
                <span>100% Nông sản hữu cơ</span>
              </div>
              <div className="flex items-center gap-1.5 font-medium">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>Bảo mật dữ liệu tuyệt đối</span>
              </div>
            </div>
          </div>

          {/* Right Column: Login Card */}
          <div className="lg:col-span-7">
            <div className="bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 shadow-2xl backdrop-blur-xl rounded-3xl p-8 sm:p-10 transition-all duration-300 space-y-6">

              {/* SUCCESS VIEW */}
              {isSuccess ? (
                <div className="py-8 text-center space-y-6 animate-fade-in">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto ring-8 ring-emerald-50 dark:ring-emerald-950/40">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                      Đăng Nhập Thành Công!
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                      Chào mừng <strong className="text-emerald-600 dark:text-emerald-400">{user?.fullName || 'bạn'}</strong> đã quay trở lại PlotFarm. Đang chuyển hướng vào hệ thống...
                    </p>
                  </div>

                  <div className="pt-2">
                    <Button
                      variant="primary"
                      size="lg"
                      className="w-full sm:w-auto px-8"
                      rightIcon={<ArrowRight className="w-4 h-4" />}
                      onClick={() => router.push('/my-farm')}
                    >
                      Đến Bảng Điều Khiển Ngay
                    </Button>
                  </div>
                </div>
              ) : (
                /* FORM VIEW */
                <div className="space-y-6">
                  {/* Header */}
                  <div className="space-y-1.5">
                    <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                      Đăng Nhập Hệ Thống
                    </h2>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Điền email và mật khẩu để quản lý ô đất nông nghiệp của bạn.
                    </p>
                  </div>

                  {/* Server Error Alert Banner */}
                  {serverError && (
                    <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 flex items-start gap-3 text-red-700 dark:text-red-300 text-xs sm:text-sm animate-shake">
                      <AlertCircle className="w-5 h-5 shrink-0 text-red-500 mt-0.5" />
                      <div className="flex-1">
                        <span className="font-semibold block">Đăng Nhập Thất Bại</span>
                        <span>{serverError}</span>
                      </div>
                    </div>
                  )}

                  {/* Client Validation Alert Banner */}
                  {clientError && (
                    <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 flex items-center gap-2.5 text-amber-800 dark:text-amber-300 text-xs animate-fade-in">
                      <AlertCircle className="w-4 h-4 shrink-0 text-amber-500" />
                      <span>{clientError}</span>
                    </div>
                  )}

                  {/* Quick Select Account Bar */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800/80 space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                      <span className="font-semibold flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                        <UserCheck className="w-3.5 h-3.5 text-emerald-500" /> Chọn nhanh tài khoản:
                      </span>
                      <span className="text-[11px] text-slate-400">Tự động điền 1 chạm</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => selectQuickAccount('binh.customer@plotfarm.vn', 'Customer@2026!')}
                        className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-700/80 border border-slate-200 dark:border-slate-600/80 text-xs font-medium text-slate-700 dark:text-slate-200 hover:border-emerald-500 hover:text-emerald-600 transition-colors text-center truncate shadow-sm"
                      >
                        Khách Hàng
                      </button>
                      <button
                        type="button"
                        onClick={() => selectQuickAccount('khoa.staff@plotfarm.vn', 'Staff@2026!')}
                        className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-700/80 border border-slate-200 dark:border-slate-600/80 text-xs font-medium text-slate-700 dark:text-slate-200 hover:border-teal-500 hover:text-teal-600 transition-colors text-center truncate shadow-sm"
                      >
                        Nhân Viên
                      </button>
                      <button
                        type="button"
                        onClick={() => selectQuickAccount('admin@plotfarm.vn', 'Admin@2026!')}
                        className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-700/80 border border-slate-200 dark:border-slate-600/80 text-xs font-medium text-slate-700 dark:text-slate-200 hover:border-blue-500 hover:text-blue-600 transition-colors text-center truncate shadow-sm"
                      >
                        Quản Trị Viên
                      </button>
                    </div>
                  </div>

                  {/* Login Form */}
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Email Field */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Email đăng nhập <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                          <Mail className="w-4 h-4" />
                        </div>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => {
                            setEmail(e.target.value);
                            setClientError(null);
                          }}
                          placeholder="ten@domain.com"
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                        />
                      </div>
                    </div>

                    {/* Password Field */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                          Mật khẩu <span className="text-red-500">*</span>
                        </label>
                        <a
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            alert('Tính năng khôi phục mật khẩu qua Email đang được chuẩn bị.');
                          }}
                          className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline"
                        >
                          Quên mật khẩu?
                        </a>
                      </div>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                          <Lock className="w-4 h-4" />
                        </div>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => {
                            setPassword(e.target.value);
                            setClientError(null);
                          }}
                          placeholder="Nhập mật khẩu..."
                          className="w-full pl-10 pr-10 py-2.5 rounded-xl text-sm bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Remember me */}
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="checkbox"
                        id="rememberMe"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                      />
                      <label htmlFor="rememberMe" className="text-xs text-slate-600 dark:text-slate-400 select-none cursor-pointer">
                        Ghi nhớ phiên đăng nhập trên thiết bị này
                      </label>
                    </div>

                    {/* Submit Button */}
                    <div className="pt-2">
                      <Button
                        type="submit"
                        variant="primary"
                        size="lg"
                        className="w-full text-base font-bold shadow-lg shadow-emerald-600/25 group"
                        disabled={isLoading}
                        rightIcon={<ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
                      >
                        {isLoading ? 'Đang Đăng Nhập...' : 'Đăng Nhập Vào Hệ Thống'}
                      </Button>
                    </div>
                  </form>

                  {/* Bottom Register Switch */}
                  <div className="pt-4 border-t border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400">
                    Chưa có tài khoản PlotFarm?{' '}
                    <Link
                      href="/register"
                      className="font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 transition-colors underline underline-offset-4"
                    >
                      Đăng ký tài khoản mới ngay
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
