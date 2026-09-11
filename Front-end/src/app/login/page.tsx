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
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  UserCheck,
  ShieldCheck,
  Sparkles,
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-between relative overflow-hidden font-sans">
      {/* Background Ambient Glows */}
      <div className="absolute top-[-15%] left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full bg-emerald-500/15 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[500px] h-[400px] rounded-full bg-green-500/10 blur-[130px] pointer-events-none" />

      {/* Top Navigation Bar */}
      <header className="relative z-30 w-full max-w-5xl mx-auto px-6 py-6 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2.5 group cursor-pointer">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-green-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform duration-200">
            <Sprout className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-xl text-slate-900 dark:text-white tracking-tight">PlotFarm</span>
            <span className="text-[11px] ml-2 px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-300/40">
              Smart Farm
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
          <span>Chưa có tài khoản?</span>
          <Link
            href="/register"
            className="font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 transition-all underline underline-offset-4 cursor-pointer hover:opacity-90 active:scale-95"
          >
            Đăng ký ngay
          </Link>
        </div>
      </header>

      {/* Centered Single Card Container */}
      <main className="flex-1 flex items-center justify-center px-4 py-8 sm:px-6 z-10">
        <div className="w-full max-w-md">
          {/* Glassmorphic Card */}
          <div className="bg-white/85 dark:bg-slate-900/85 backdrop-blur-2xl border border-slate-200/80 dark:border-slate-800/80 rounded-3xl shadow-2xl shadow-emerald-950/5 dark:shadow-emerald-950/20 p-7 sm:p-9 space-y-6">

            {/* Header / Brand Icon */}
            <div className="text-center space-y-2">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-tr from-emerald-600 to-green-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/25">
                <Sparkles className="w-6 h-6" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                Đăng Nhập Tài Khoản
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Truy cập nền tảng quản lý ô đất & canh tác thông minh
              </p>
            </div>

            {/* Authenticated Banner */}
            {isAuthenticated && user && (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-200 space-y-2 text-left animate-fade-in">
                <div className="flex items-center gap-2 text-sm font-bold text-emerald-700 dark:text-emerald-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  Đang đăng nhập: {user.fullName} ({user.role})
                </div>
                <div className="pt-1 flex justify-end">
                  <Button variant="primary" size="sm" onClick={() => router.push('/')} rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                    Đến Trang Chủ
                  </Button>
                </div>
              </div>
            )}

            {/* Error Banner */}
            {(clientError || serverError) && (
              <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-400 flex items-start gap-2.5 text-xs font-semibold animate-fade-in text-left">
                <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Đăng nhập thất bại</p>
                  <p className="mt-0.5 text-[11px] leading-relaxed font-normal">{clientError || serverError}</p>
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4 text-left">
              {/* Email */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
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

              {/* Password */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Mật khẩu <span className="text-red-500">*</span>
                  </label>
                  <a href="#" className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline">
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
              <div className="pt-0.5">
                <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-600 dark:text-slate-400">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="w-4 h-4 rounded text-emerald-600 border-slate-300 dark:border-slate-700 focus:ring-emerald-500"
                  />
                  <span>Ghi nhớ phiên đăng nhập (Cookie 7 ngày)</span>
                </label>
              </div>

              {/* Submit Button */}
              <div className="pt-1.5">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  isLoading={isLoading}
                  className="w-full text-sm sm:text-base font-semibold py-3 shadow-lg shadow-emerald-600/25"
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  {isLoading ? 'Đang Xác Thực...' : 'Đăng Nhập Vào PlotFarm'}
                </Button>
              </div>
            </form>

            {/* Quick Demo Credentials Assistant (1-Click Fill) */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 space-y-2 text-xs">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-500" /> Tài khoản Demo kiểm thử nhanh:
                </span>
                <span className="text-[10px] text-slate-400">1 chạm</span>
              </div>

              <div className="grid grid-cols-3 gap-1.5 text-[11px]">
                {/* Customer */}
                <button
                  type="button"
                  onClick={() => handleQuickFill('binh.customer@plotfarm.vn', 'Customer@2026!')}
                  className="p-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:border-emerald-500/40 text-center border border-slate-200 dark:border-slate-700 transition-all group"
                >
                  <div className="font-bold text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 text-[11px]">
                    Khách Hàng
                  </div>
                  <div className="text-[9px] text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">Customer</div>
                </button>

                {/* Staff */}
                <button
                  type="button"
                  onClick={() => handleQuickFill('khoa.staff@plotfarm.vn', 'Staff@2026!')}
                  className="p-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:border-emerald-500/40 text-center border border-slate-200 dark:border-slate-700 transition-all group"
                >
                  <div className="font-bold text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 text-[11px]">
                    Kỹ Thuật
                  </div>
                  <div className="text-[9px] text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">Staff</div>
                </button>

                {/* Admin */}
                <button
                  type="button"
                  onClick={() => handleQuickFill('admin@plotfarm.vn', 'Admin@2026!')}
                  className="p-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:border-emerald-500/40 text-center border border-slate-200 dark:border-slate-700 transition-all group"
                >
                  <div className="font-bold text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 text-[11px]">
                    Quản Trị
                  </div>
                  <div className="text-[9px] text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">Admin</div>
                </button>
              </div>
            </div>

            {/* Footer switch link */}
            <p className="text-center text-xs text-slate-500 dark:text-slate-400 pt-1">
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
      </main>

      {/* Footer Trust Badges */}
      <footer className="relative z-30 py-4 text-center text-xs text-slate-400 dark:text-slate-600 flex items-center justify-center gap-4 flex-wrap">
        <span className="flex items-center gap-1">
          <Sprout className="w-3.5 h-3.5 text-emerald-500" /> 100% Nông sản hữu cơ
        </span>
        <span>•</span>
        <span className="flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Xác thực JWT / SSL bảo mật
        </span>
        <span>•</span>
        <span>© 2026 PlotFarm</span>
      </footer>
    </div>
  );
}
