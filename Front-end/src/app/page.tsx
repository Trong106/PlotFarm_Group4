'use client';
import Link from "next/link";

import React, { useState } from 'react';
import {
  Sprout,
  Sun,
  Moon,
  CheckCircle2,
  AlertTriangle,
  Info,
  Lock,
  Mail,
  UserCheck,
  UserPlus,
  LogOut,
  Code2,
  LayoutGrid,
  Sparkles,
  Layers,
  Activity,
  Server,
  Zap,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { useAuthStore } from '@/store/useAuthStore';
import { useUIStore } from '@/store/useUIStore';

export default function Home() {
  const { theme, toggleTheme, isDemoModalOpen, setDemoModalOpen, activeTab, setActiveTab } = useUIStore();
  const { user, isAuthenticated, isLoading, error, login, logout } = useAuthStore();

  const [btnLoading, setBtnLoading] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [inputError, setInputError] = useState('');
  const [loginEmail, setLoginEmail] = useState('admin@plotfarm.vn');
  const [loginPass, setLoginPass] = useState('password123');

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) {
      setInputError('Vui lòng nhập thông tin tên ô đất!');
      return;
    }
    setInputError('');
    setBtnLoading(true);
    setTimeout(() => {
      setBtnLoading(false);
      alert(`Đã lưu thành công: "${inputValue}"`);
    }, 800);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(loginEmail, loginPass);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#080d16] text-slate-900 dark:text-slate-100 transition-colors duration-300">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-emerald-600 to-green-500 text-white shadow-md shadow-emerald-500/20">
              <Sprout className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-teal-500 dark:from-emerald-400 dark:to-teal-300">
                  PlotFarm
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300/40">
                  Team 4
                </span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                Nền tảng quản lý nông trại thông minh & cho thuê đất trồng
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Real Backend Active Badge */}
            <Badge variant="success" dot size="sm">
              REST API Realtime Active
            </Badge>

            {/* Dark Mode Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all shadow-sm"
              title="Chuyển chế độ sáng / tối"
            >
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>

            {/* Register Button in Navbar */}
            {!isAuthenticated && (
              <Link href="/register">
                <Button variant="outline" size="sm" leftIcon={<UserPlus className="w-3.5 h-3.5" />}>
                  Đăng Ký
                </Button>
              </Link>
            )}

            {/* Auth User Profile Indicator */}
            {isAuthenticated ? (
              <div className="flex items-center gap-3 pl-3 border-l border-slate-200 dark:border-slate-800">
                <div className="text-right">
                  <p className="text-xs font-bold leading-tight">{user?.fullName}</p>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold uppercase">
                    {user?.role}
                  </span>
                </div>
                <Button variant="ghost" size="sm" onClick={logout} title="Đăng xuất">
                  <LogOut className="w-4 h-4 text-rose-500" />
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Main Banner */}
        <div className="relative rounded-3xl p-8 mb-8 overflow-hidden bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 text-white shadow-2xl border border-emerald-500/20">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold mb-4">
              <Sparkles className="w-3.5 h-3.5" /> Đồng bộ nhánh Main hoàn tất (Trọng - Đức - Nghiệp - Tuấn)
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3">
              Hệ Thống PlotFarm Team 4 Integrated Client & Server
            </h1>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-6">
              Front-end Next.js App Router chuẩn hóa với bộ Base UI Components, Zustand Store, Socket.IO Gateway và RESTful API backend thực tế.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button variant="primary" onClick={() => setDemoModalOpen(true)} leftIcon={<Layers className="w-4 h-4" />}>
                Mở Modal Demo UI
              </Button>
              <a href="http://localhost:5000/" target="_blank" rel="noreferrer">
                <Button variant="secondary" leftIcon={<Server className="w-4 h-4" />}>
                  Swagger API Docs (Cổng 5000)
                </Button>
              </a>
              <Link href="/register">
                <Button variant="outline" className="bg-white/10 hover:bg-white/20 border-white/30 text-white" leftIcon={<UserPlus className="w-4 h-4" />}>
                  Đăng Ký Tài Khoản (Ngày 6)
                </Button>
              </Link>
              <a href="http://localhost:5000/socket-test" target="_blank" rel="noreferrer">
                <Button variant="outline" leftIcon={<Activity className="w-4 h-4" />}>
                  Kiểm thử Socket.IO Realtime
                </Button>
              </a>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 mb-8 overflow-x-auto">
          <button
            onClick={() => setActiveTab('components')}
            className={`flex items-center gap-2 px-5 py-3 border-b-2 font-semibold text-sm transition-all whitespace-nowrap ${
              activeTab === 'components'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            1. Bộ Base UI Components
          </button>
          <button
            onClick={() => setActiveTab('state')}
            className={`flex items-center gap-2 px-5 py-3 border-b-2 font-semibold text-sm transition-all whitespace-nowrap ${
              activeTab === 'state'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Code2 className="w-4 h-4" />
            2. Kết Nối Express REST API Thật
          </button>
        </div>

        {/* TAB 1: BASE UI COMPONENTS */}
        {activeTab === 'components' && (
          <div className="space-y-8 animate-fade-in">
            <Card variant="glass">
              <CardHeader>
                <CardTitle>Button Components</CardTitle>
                <CardDescription>Bộ Button được cắt chuẩn hóa cho toàn dự án</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-wrap items-center gap-3">
                  <Button variant="primary">Primary Button</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="outline">Outline</Button>
                  <Button variant="ghost">Ghost</Button>
                  <Button variant="danger">Danger</Button>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Button variant="primary" size="sm">Small</Button>
                  <Button variant="primary" size="md">Medium</Button>
                  <Button variant="primary" size="lg">Large</Button>
                  <Button variant="primary" isLoading>Đang xử lý</Button>
                </div>
              </CardContent>
            </Card>

            <Card variant="glass">
              <CardHeader>
                <CardTitle>Badge Status Components</CardTitle>
                <CardDescription>Nhãn trạng thái ô đất, thu hoạch và người dùng</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-4">
                <Badge variant="success" dot icon={<CheckCircle2 className="w-3.5 h-3.5" />}>
                  Đang hoạt động (ACTIVE)
                </Badge>
                <Badge variant="warning" dot icon={<AlertTriangle className="w-3.5 h-3.5" />}>
                  Chờ duyệt (PENDING)
                </Badge>
                <Badge variant="danger" dot>
                  Đã khóa (LOCKED)
                </Badge>
                <Badge variant="info" icon={<Info className="w-3.5 h-3.5" />}>
                  Thông tin Staff
                </Badge>
                <Badge variant="neutral">Mặc định Neutral</Badge>
              </CardContent>
            </Card>

            <Card variant="glass">
              <CardHeader>
                <CardTitle>Input Components</CardTitle>
                <CardDescription>Ô nhập dữ liệu hỗ trợ label, icon và ẩn/hiện password</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleFormSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    label="Tên Ô Đất"
                    placeholder="Nhập tên ô đất canh tác..."
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    error={inputError}
                    leftIcon={<Sprout className="w-4 h-4" />}
                  />
                  <Input
                    label="Mật Khẩu Thử Nghiệm"
                    placeholder="••••••••"
                    isPassword
                    leftIcon={<Lock className="w-4 h-4" />}
                    defaultValue="password123"
                  />
                  <div className="md:col-span-2 flex justify-end">
                    <Button type="submit" variant="primary" isLoading={btnLoading}>
                      Lưu Thử Nghiệm
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {/* TAB 2: REAL REST API INTEGRATION */}
        {activeTab === 'state' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
            {/* Express Auth API Form */}
            <Card variant="glass">
              <CardHeader>
                <CardTitle>Đăng Nhập REST API Thật (Express Server)</CardTitle>
                <CardDescription>Gọi trực tiếp API POST /api/auth/login trên cổng 5000</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <Input
                    label="Email Tài Khoản"
                    placeholder="nhap.email@domain.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    leftIcon={<Mail className="w-4 h-4" />}
                  />
                  <Input
                    label="Mật Khẩu"
                    placeholder="••••••••"
                    isPassword
                    value={loginPass}
                    onChange={(e) => setLoginPass(e.target.value)}
                    leftIcon={<Lock className="w-4 h-4" />}
                  />

                  {error && (
                    <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs font-semibold">
                      {error}
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    {isAuthenticated ? (
                      <Button variant="danger" onClick={logout} className="w-full" leftIcon={<LogOut className="w-4 h-4" />}>
                        Đăng Xuất
                      </Button>
                    ) : (
                      <Button variant="primary" type="submit" isLoading={isLoading} className="w-full" leftIcon={<UserCheck className="w-4 h-4" />}>
                        Đăng Nhập API Thật
                      </Button>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Current Auth Response Viewer */}
            <Card variant="glass">
              <CardHeader>
                <CardTitle>Phiên Đăng Nhập & User Profile Payload</CardTitle>
                <CardDescription>Dữ liệu phản hồi thực tế nhận từ Express Backend & SQL Server</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="p-4 rounded-xl bg-slate-900 text-slate-100 font-mono text-xs overflow-x-auto leading-relaxed border border-slate-800">
                  <p className="text-emerald-400 font-bold mb-2">// REST API Payload Response:</p>
                  {isAuthenticated ? (
                    <pre className="whitespace-pre-wrap">{JSON.stringify(user, null, 2)}</pre>
                  ) : (
                    <p className="text-slate-500">// Chưa đăng nhập. Hãy nhập Email & Mật khẩu để gọi API thật.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      {/* Global Interactive Demo Modal */}
      <Modal
        isOpen={isDemoModalOpen}
        onClose={() => setDemoModalOpen(false)}
        title="Cửa Sổ Modal (Base UI Component)"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDemoModalOpen(false)}>
              Đóng
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                alert('Đã xác nhận từ Modal UI!');
                setDemoModalOpen(false);
              }}
            >
              Đồng Ý
            </Button>
          </>
        }
      >
        <div className="space-y-4 text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
          <p>
            Đây là component <strong className="text-emerald-600 dark:text-emerald-400">Modal</strong> dùng chung cho dự án PlotFarm Team 4.
          </p>
          <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800/80 space-y-2">
            <h5 className="font-bold text-slate-900 dark:text-slate-100 text-xs uppercase tracking-wider">Tính năng:</h5>
            <ul className="list-disc pl-5 text-xs space-y-1 text-slate-600 dark:text-slate-300">
              <li>Backdrop blur glassmorphic mờ mịn</li>
              <li>Animation scale-in mượt mà</li>
              <li>Hỗ trợ phím Esc & click bên ngoài đóng cửa sổ</li>
            </ul>
          </div>
        </div>
      </Modal>
    </div>
  );
}
