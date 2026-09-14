'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Sprout,
  Mail,
  Lock,
  LogIn,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Trees,
  Sun,
  KeyRound,
  ArrowRight,
  HelpCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { useAuthStore } from '@/store/useAuthStore';

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading, error, isAuthenticated, token, user } = useAuthStore();

  const [email, setEmail] = useState('admin@plotfarm.vn');
  const [password, setPassword] = useState('password123');
  const [formError, setFormError] = useState('');
  const [saveTokenStatus, setSaveTokenStatus] = useState<string | null>(null);

  // If already authenticated, show status or redirect option
  useEffect(() => {
    if (isAuthenticated && token) {
      setSaveTokenStatus(`Token JWT đã được lưu vào LocalStorage & Cookie thành công!`);
    }
  }, [isAuthenticated, token]);

  const validateForm = () => {
    if (!email.trim()) {
      setFormError('Vui lòng nhập địa chỉ Email!');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setFormError('Định dạng Email không hợp lệ (ví dụ: user@domain.com)!');
      return false;
    }
    if (!password) {
      setFormError('Vui lòng nhập Mật khẩu!');
      return false;
    }
    if (password.length < 4) {
      setFormError('Mật khẩu phải từ 4 ký tự trở lên!');
      return false;
    }
    setFormError('');
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const success = await login(email, password);
    if (success) {
      setSaveTokenStatus('JWT Token từ API Express đã được nhận và lưu vào Cookie / LocalStorage!');
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-[#FAF7F2] dark:bg-[#0F140D] text-slate-800 dark:text-slate-100 transition-colors duration-300">
      {/* Left Column: Branding & Green/Brown Farm Theme (Visible on md and larger) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-soil-900 via-soil-800 to-brand-950 p-12 flex-col justify-between overflow-hidden shadow-2xl">
        {/* Decorative background glows */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-brand-500/20 rounded-full blur-3xl pointer-events-none -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-soil-500/20 rounded-full blur-3xl pointer-events-none translate-x-1/3 translate-y-1/3" />

        {/* Top Header Branding */}
        <div className="relative z-10 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="p-3 rounded-2xl bg-gradient-to-tr from-brand-600 to-emerald-500 text-white shadow-lg shadow-brand-600/30 group-hover:scale-105 transition-transform">
              <Sprout className="w-7 h-7" />
            </div>
            <div>
              <span className="font-extrabold text-2xl tracking-tight text-white flex items-center gap-2">
                PlotFarm
              </span>
              <p className="text-xs text-soil-200/80 font-medium">Nền tảng quản lý nông trại & cho thuê đất trồng</p>
            </div>
          </Link>

          <Badge variant="success" dot size="sm">
            Ready for Next.js
          </Badge>
        </div>

        {/* Center Hero Banner Text */}
        <div className="relative z-10 my-auto space-y-6 max-w-lg">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-soil-700/60 border border-soil-600/50 text-soil-100 text-xs font-semibold backdrop-blur-md">
            <Trees className="w-4 h-4 text-brand-400" /> Hệ Thống Quản Lý Nông Trại Thông Minh
          </div>

          <h1 className="text-4xl xl:text-5xl font-black text-white leading-tight tracking-tight">
            Quản Lý Ô Đất & Nông Nông Nghiệp <span className="bg-clip-text text-transparent bg-gradient-to-r from-brand-400 to-emerald-300">Tối Ưu</span>
          </h1>

          <p className="text-soil-200/90 text-sm xl:text-base leading-relaxed">
            Đăng nhập để theo dõi tiến độ canh tác, cập nhật WBS dự án, lập kế hoạch thu hoạch và quản lý hợp đồng cho thuê đất dễ dàng.
          </p>

          {/* Feature Highlights Grid */}
          <div className="grid grid-cols-2 gap-4 pt-4">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <div className="flex items-center gap-2 text-brand-300 text-xs font-bold mb-1">
                <ShieldCheck className="w-4 h-4" /> Bảo Mật JWT Token
              </div>
              <p className="text-xs text-soil-300">Tự động mã hóa & lưu an toàn vào Cookie & LocalStorage.</p>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <div className="flex items-center gap-2 text-brand-300 text-xs font-bold mb-1">
                <Sun className="w-4 h-4 text-amber-400" /> Đồng Bộ Realtime
              </div>
              <p className="text-xs text-soil-300">Kết nối trực tiếp API Express Server cổng 5000.</p>
            </div>
          </div>
        </div>

        {/* Footer info inside Left Hero */}
        <div className="relative z-10 pt-6 border-t border-soil-700/50 flex items-center justify-between text-xs text-soil-300">
          <span>Hệ thống quản lý nông trại thông minh</span>
          <span>Next.js 14 + Tailwind CSS</span>
        </div>
      </div>

      {/* Right Column: Interactive Login Form Panel */}
      <div className="w-full lg:w-1/2 flex flex-col justify-between p-6 sm:p-12 xl:p-16 overflow-y-auto">
        {/* Mobile Header Logo */}
        <div className="flex lg:hidden items-center justify-between mb-8">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-brand-600 text-white">
              <Sprout className="w-5 h-5" />
            </div>
            <span className="font-extrabold text-xl text-soil-900 dark:text-white">PlotFarm</span>
          </Link>
        </div>

        {/* Login Form Container */}
        <div className="max-w-md w-full mx-auto my-auto space-y-8">
          {/* Header text */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-1 rounded-md bg-soil-100 dark:bg-soil-950 text-soil-800 dark:text-soil-200 text-xs font-bold border border-soil-300/60 dark:border-soil-800">
                🌱 Tông màu Xanh Lá & Nâu Đất
              </span>
            </div>
            <h2 className="text-3xl font-extrabold text-soil-950 dark:text-white tracking-tight">
              Đăng Nhập Tài Khoản
            </h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Nhập thông tin để truy cập bảng điều khiển hệ thống PlotFarm.
            </p>
          </div>
          {/* Authenticated Success Banner */}
          {isAuthenticated && (
            <div className="p-4 rounded-2xl bg-brand-500/10 border border-brand-500/30 text-brand-900 dark:text-brand-200 space-y-2">
              <div className="flex items-center gap-2 text-sm font-bold text-brand-700 dark:text-brand-300">
                <CheckCircle2 className="w-5 h-5 text-brand-600 dark:text-brand-400 shrink-0" />
                Đã Đăng Nhập Thành Công!
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Xin chào <strong>{user?.fullName}</strong> ({user?.email}) - Chức vụ: <span className="font-bold text-brand-600 dark:text-brand-400">{user?.role}</span>
              </p>
              {token && (
                <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-900/80 font-mono text-[11px] break-all border border-brand-200 dark:border-brand-900">
                  <span className="font-bold text-soil-700 dark:text-soil-400">JWT Token: </span>
                  <span className="text-slate-700 dark:text-slate-300">{token.substring(0, 45)}...</span>
                </div>
              )}
              <div className="pt-1 flex gap-2">
                <Button variant="primary" size="sm" onClick={() => router.push('/')} leftIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                  Trang Chủ PlotFarm
                </Button>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {(formError || error) && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-400 flex items-start gap-3 text-xs font-semibold">
              <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-sm">Có Lỗi Xảy Ra</p>
                <p className="mt-0.5 leading-relaxed">{formError || error}</p>
              </div>
            </div>
          )}

          {/* Notification status for cookie saving */}
          {saveTokenStatus && !formError && !error && (
            <div className="p-3 rounded-xl bg-soil-100 dark:bg-soil-950/80 border border-soil-300 dark:border-soil-800 text-soil-800 dark:text-soil-200 text-xs font-medium flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-brand-600 dark:text-brand-400 shrink-0" />
              <span>{saveTokenStatus}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Địa chỉ Email"
              type="email"
              placeholder="nhap.email@domain.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setFormError('');
              }}
              leftIcon={<Mail className="w-4 h-4 text-soil-600 dark:text-soil-400" />}
              autoComplete="email"
            />

            <Input
              label="Mật Khẩu"
              isPassword
              placeholder="••••••••"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setFormError('');
              }}
              leftIcon={<Lock className="w-4 h-4 text-soil-600 dark:text-soil-400" />}
              autoComplete="current-password"
            />

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 cursor-pointer text-slate-600 dark:text-slate-400">
                <input
                  type="checkbox"
                  defaultChecked
                  className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300 dark:border-slate-700"
                />
                Ghi nhớ phiên đăng nhập (Cookie 7 ngày)
              </label>

              <a href="#" className="font-semibold text-brand-700 hover:text-brand-600 dark:text-brand-400 hover:underline">
                Quên mật khẩu?
              </a>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              className="w-full bg-gradient-to-r from-brand-600 via-emerald-600 to-soil-700 hover:from-brand-500 hover:to-soil-600 text-white font-bold py-3.5 rounded-2xl shadow-lg shadow-brand-700/20"
              leftIcon={<LogIn className="w-5 h-5" />}
            >
              Đăng Nhập Hệ Thống PlotFarm
            </Button>
          </form>

          {/* Quick Demo Credentials Assistant */}
          <div className="p-4 rounded-2xl bg-white dark:bg-soil-950 border border-slate-200 dark:border-soil-900 space-y-2 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-soil-900 dark:text-soil-200">
              <HelpCircle className="w-4 h-4 text-brand-600" /> Tài khoản kiểm thử nhanh (Demo Accounts):
            </div>
            <div className="grid grid-cols-2 gap-2 text-slate-600 dark:text-slate-400 font-mono text-[11px]">
              <button
                type="button"
                onClick={() => {
                  setEmail('admin@plotfarm.vn');
                  setPassword('password123');
                }}
                className="p-2 rounded-xl bg-slate-50 dark:bg-soil-900/60 hover:bg-brand-50 dark:hover:bg-soil-800 text-left border border-slate-200 dark:border-soil-800 transition-colors"
              >
                <div className="font-bold text-slate-800 dark:text-slate-200">Admin/Chủ Nông Trại</div>
                <div className="text-[10px] text-slate-500">admin@plotfarm.vn</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setEmail('farmer@plotfarm.vn');
                  setPassword('farmer123');
                }}
                className="p-2 rounded-xl bg-slate-50 dark:bg-soil-900/60 hover:bg-brand-50 dark:hover:bg-soil-800 text-left border border-slate-200 dark:border-soil-800 transition-colors"
              >
                <div className="font-bold text-slate-800 dark:text-slate-200">Nông Dân Thuê Đất</div>
                <div className="text-[10px] text-slate-500">farmer@plotfarm.vn</div>
              </button>
            </div>
          </div>

          {/* Link to Register */}
          <div className="text-center text-xs text-slate-500 dark:text-slate-400 pt-2">
            Chưa có tài khoản PlotFarm?{' '}
            <Link href="/register" className="font-bold text-soil-800 dark:text-soil-200 hover:text-brand-600 dark:hover:text-brand-400 hover:underline">
              Đăng ký ngay
            </Link>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="text-center text-xs text-slate-400 dark:text-slate-600 pt-8">
          © 2026 PlotFarm. Tất cả quyền được bảo lưu.
        </div>
      </div>
    </div>
  );
}
