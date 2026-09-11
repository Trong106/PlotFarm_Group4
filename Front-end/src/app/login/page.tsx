'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Sprout,
  Sparkles,
  ArrowRight,
  Camera,
  Activity,
  Truck,
  AlertCircle,
  CheckCircle2,
  UserCheck,
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { Button } from '@/components/ui/Button';

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading, error: serverError, isAuthenticated, user } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [clientError, setClientError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setClientError(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setClientError('Vui lòng nhập địa chỉ email');
      return;
    }

    if (!password) {
      setClientError('Vui lòng nhập mật khẩu');
      return;
    }

    const success = await login(trimmedEmail, password);
    if (success) {
      router.push('/');
    }
  };

  const handleQuickFill = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setClientError(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col relative overflow-hidden font-sans">
      {/* Background Glow Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-emerald-500/15 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-green-500/15 blur-[120px] pointer-events-none" />

      {/* Top Header Navigation - relative z-30 to ensure it is never covered */}
      <header className="relative z-30 w-full max-w-7xl mx-auto p-6 flex justify-between items-center">
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

        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
          <span>Chưa có tài khoản?</span>
          <Link
            href="/register"
            className="font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 transition-all underline underline-offset-4 cursor-pointer hover:opacity-90 active:scale-95"
          >
            Đăng ký ngay
          </Link>
        </div>
      </header>

      {/* Main Content Layout */}
      <main className="flex-1 flex items-center justify-center max-w-6xl w-full mx-auto px-4 py-8 sm:px-6 lg:px-8 z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center w-full">

          {/* Left Column: Brand Showcase (Desktop only) */}
          <div className="hidden lg:flex lg:col-span-5 flex-col space-y-8 pr-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-semibold w-fit">
              <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
              Hệ Thống Nông Trại Số Hóa PlotFarm
            </div>

            <div className="space-y-4">
              <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-[1.2]">
                Chào mừng trở lại với{' '}
                <span className="bg-gradient-to-r from-emerald-600 to-green-500 bg-clip-text text-transparent">
                  mảnh vườn thông minh
                </span>
              </h1>
              <p className="text-base text-slate-600 dark:text-slate-400 leading-relaxed">
                Đăng nhập để theo dõi trực tiếp hình ảnh ô đất qua Camera 24/7, cập nhật nhật ký chăm sóc từ kỹ thuật viên và kiểm tra lịch thu hoạch nông sản.
              </p>
            </div>

            {/* Feature Highlights */}
            <div className="space-y-4 pt-2">
              <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 shadow-sm backdrop-blur-sm">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <Camera className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Live Camera Trực Tuyến 24/7</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Giám sát quá trình sinh trưởng của cây trồng theo thời gian thực.</p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 shadow-sm backdrop-blur-sm">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Nhật Ký Canh Tác Minh Bạch</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Xem ảnh tưới tiêu, bón phân hữu cơ và bắt sâu được kỹ thuật viên cập nhật hàng ngày.</p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 shadow-sm backdrop-blur-sm">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Giao Nông Sản Tận Bàn Ăn</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Rau củ thu hoạch tươi sống được đóng gói và vận chuyển thẳng về địa chỉ nhà bạn.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Glassmorphic Login Card */}
          <div className="lg:col-span-7">
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-3xl shadow-2xl p-6 sm:p-10 space-y-6">

              {/* Form Title */}
              <div className="space-y-1.5 text-center sm:text-left">
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  Đăng Nhập Tài Khoản
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                  Nhập thông tin xác thực để truy cập bảng điều khiển PlotFarm.
                </p>
              </div>

              {/* Authenticated banner if already logged in */}
              {isAuthenticated && user && (
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-200 space-y-2">
                  <div className="flex items-center gap-2 text-sm font-bold text-emerald-700 dark:text-emerald-300">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    Bạn Đang Đăng Nhập: {user.fullName} ({user.role})
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Bạn có thể tiếp tục sử dụng hệ thống hoặc truy cập trang chủ ngay.
                  </p>
                  <div className="pt-1">
                    <Button variant="primary" size="sm" onClick={() => router.push('/')} rightIcon={<ArrowRight className="w-4 h-4" />}>
                      Đến Trang Chủ PlotFarm
                    </Button>
                  </div>
                </div>
              )}

              {/* Error Banner */}
              {(clientError || serverError) && (
                <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-400 flex items-start gap-3 text-xs font-semibold animate-fade-in">
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-sm">Đăng Nhập Thất Bại</p>
                    <p className="mt-0.5 leading-relaxed">{clientError || serverError}</p>
                  </div>
                </div>
              )}

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email Field */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Địa chỉ Email <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      name="email"
                      placeholder="vidu@plotfarm.vn"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setClientError(null);
                      }}
                      disabled={isLoading}
                      autoComplete="email"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm transition-all duration-200 outline-none
                        bg-white dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 placeholder:text-slate-400
                        border-slate-200 dark:border-slate-700 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Mật khẩu <span className="text-red-500">*</span>
                    </label>
                    <a href="#" className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline">
                      Quên mật khẩu?
                    </a>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      placeholder="Nhập mật khẩu..."
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setClientError(null);
                      }}
                      disabled={isLoading}
                      autoComplete="current-password"
                      className="w-full pl-10 pr-11 py-2.5 rounded-xl border text-sm transition-all duration-200 outline-none
                        bg-white dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 placeholder:text-slate-400
                        border-slate-200 dark:border-slate-700 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Remember Me */}
                <div className="pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-600 dark:text-slate-400">
                    <input
                      type="checkbox"
                      defaultChecked
                      className="w-4 h-4 rounded text-emerald-600 border-slate-300 dark:border-slate-700 focus:ring-emerald-500"
                    />
                    <span>Ghi nhớ phiên đăng nhập (Lưu Cookie & LocalStorage)</span>
                  </label>
                </div>

                {/* Submit Button */}
                <div className="pt-2">
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    isLoading={isLoading}
                    className="w-full text-base font-semibold py-3 shadow-emerald-600/30"
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    {isLoading ? 'Đang Xác Thực...' : 'Đăng Nhập Vào PlotFarm'}
                  </Button>
                </div>
              </form>

              {/* Quick Demo Credentials Assistant */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-emerald-500" /> Tài khoản Demo kiểm thử nhanh (1 chạm):
                  </span>
                  <span className="text-[11px] text-slate-400">Bấm để tự điền</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                  {/* Customer */}
                  <button
                    type="button"
                    onClick={() => handleQuickFill('binh.customer@plotfarm.vn', 'Customer@2026!')}
                    className="p-2.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:border-emerald-500/40 text-left border border-slate-200 dark:border-slate-700 transition-all group"
                  >
                    <div className="font-bold text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                      Khách Hàng
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">binh.customer@plotfarm.vn</div>
                    <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">Customer@2026!</div>
                  </button>

                  {/* Staff */}
                  <button
                    type="button"
                    onClick={() => handleQuickFill('khoa.staff@plotfarm.vn', 'Staff@2026!')}
                    className="p-2.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:border-emerald-500/40 text-left border border-slate-200 dark:border-slate-700 transition-all group"
                  >
                    <div className="font-bold text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                      Kỹ Thuật Viên
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">khoa.staff@plotfarm.vn</div>
                    <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">Staff@2026!</div>
                  </button>

                  {/* Admin */}
                  <button
                    type="button"
                    onClick={() => handleQuickFill('admin@plotfarm.vn', 'Admin@2026!')}
                    className="p-2.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:border-emerald-500/40 text-left border border-slate-200 dark:border-slate-700 transition-all group"
                  >
                    <div className="font-bold text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                      Quản Trị Viên
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">admin@plotfarm.vn</div>
                    <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">Admin@2026!</div>
                  </button>
                </div>
              </div>

              {/* Footer Switch Link */}
              <p className="text-center text-xs text-slate-500 dark:text-slate-400 pt-2">
                Chưa có tài khoản PlotFarm?{' '}
                <Link
                  href="/register"
                  className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                >
                  Đăng ký tài khoản mới
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
