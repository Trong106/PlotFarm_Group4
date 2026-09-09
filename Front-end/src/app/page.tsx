'use client';

import React, { useState, useEffect } from 'react';
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
  LogOut,
  RefreshCw,
  Database,
  Code2,
  LayoutGrid,
  Sparkles,
  ExternalLink,
  Layers,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { useAuthStore } from '@/store/useAuthStore';
import { useUIStore } from '@/store/useUIStore';

export default function Home() {
  const { theme, toggleTheme, isDemoModalOpen, setDemoModalOpen, activeTab, setActiveTab } = useUIStore();
  const {
    user,
    isAuthenticated,
    usersList,
    rolesList,
    isLoading,
    error,
    login,
    logout,
    fetchUsers,
    fetchRoles,
  } = useAuthStore();

  const [btnLoading, setBtnLoading] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [inputError, setInputError] = useState('');
  const isMockMode = process.env.NEXT_PUBLIC_USE_MOCK !== 'false';

  useEffect(() => {
    // Initial fetch on mount for testing
    fetchUsers();
    fetchRoles();
  }, [fetchUsers, fetchRoles]);

  const handleSimulatedSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) {
      setInputError('Vui lòng nhập tên ô đất hoặc thông tin!');
      return;
    }
    setInputError('');
    setBtnLoading(true);
    setTimeout(() => {
      setBtnLoading(false);
      alert(`Đã gửi dữ liệu thành công: "${inputValue}"`);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#080d16] text-slate-900 dark:text-slate-100 transition-colors duration-300">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-emerald-600 to-green-500 text-white shadow-md shadow-emerald-500/20">
              <Sprout className="w-6 h-6 animate-pulse-slow" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-teal-500 dark:from-emerald-400 dark:to-teal-300">
                  PlotFarm
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  Team 4
                </span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                Phan Minh Tuấn - Front-end Base & State Module
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Mock Mode Status Indicator */}
            <Badge variant={isMockMode ? 'warning' : 'success'} dot>
              {isMockMode ? 'Mock Data Active' : 'Real Backend Connected'}
            </Badge>

            {/* Dark Mode Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all shadow-sm"
              title="Chuyển chế độ sáng / tối"
            >
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>

            {/* Auth Quick Status */}
            {isAuthenticated ? (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
                <img
                  src={user?.AvatarUrl}
                  alt={user?.FullName}
                  className="w-8 h-8 rounded-full border border-emerald-500/40 object-cover"
                />
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-bold leading-tight">{user?.FullName}</p>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                    {user?.RoleName}
                  </span>
                </div>
                <Button variant="ghost" size="sm" onClick={logout} title="Đăng xuất">
                  <LogOut className="w-4 h-4 text-rose-500" />
                </Button>
              </div>
            ) : (
              <Button
                variant="primary"
                size="sm"
                leftIcon={<UserCheck className="w-4 h-4" />}
                onClick={() => login()}
                isLoading={isLoading}
              >
                Đăng nhập Demo
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Banner Section */}
        <div className="relative rounded-3xl p-8 mb-8 overflow-hidden bg-gradient-to-r from-emerald-900 via-slate-900 to-teal-950 text-white shadow-2xl border border-emerald-500/20">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold mb-4">
              <Sparkles className="w-3.5 h-3.5" /> Thành phần Công việc Phần 4 - Phan Minh Tuấn
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3">
              Base UI Components & Zustand State with Mock API Layer
            </h1>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-6">
              Hệ thống giao diện được chuẩn hóa bằng Next.js + Tailwind CSS, tích hợp State Management (Zustand) và Axios Client với chế độ Mock Data thông minh. Sẵn sàng thay thế sang Backend thật của đồng đội chỉ bằng 1 thao tác cấu hình.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button
                variant="primary"
                onClick={() => setDemoModalOpen(true)}
                leftIcon={<Layers className="w-4 h-4" />}
              >
                Mở Modal Demo
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  fetchUsers();
                  fetchRoles();
                }}
                leftIcon={<RefreshCw className="w-4 h-4" />}
              >
                Tải lại Mock Data
              </Button>
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
            1. Base UI Components (Chức năng 1)
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
            2. Zustand State Management (Chức năng 2)
          </button>
          <button
            onClick={() => setActiveTab('mock-api')}
            className={`flex items-center gap-2 px-5 py-3 border-b-2 font-semibold text-sm transition-all whitespace-nowrap ${
              activeTab === 'mock-api'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Database className="w-4 h-4" />
            3. Axios Instance & Mock API (Chức năng 2)
          </button>
        </div>

        {/* TAB 1: BASE UI COMPONENTS SHOWCASE */}
        {activeTab === 'components' && (
          <div className="space-y-8 animate-fade-in">
            {/* BUTTONS SHOWCASE */}
            <Card variant="glass">
              <CardHeader>
                <CardTitle>Button Components</CardTitle>
                <CardDescription>Các biến thể của Button: primary, secondary, outline, ghost, danger và trạng thái loading</CardDescription>
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
                  <Button variant="primary" isLoading>Đang tải</Button>
                  <Button variant="primary" disabled>Disabled</Button>
                </div>
              </CardContent>
            </Card>

            {/* BADGES SHOWCASE */}
            <Card variant="glass">
              <CardHeader>
                <CardTitle>Badge Components (Nhãn trạng thái)</CardTitle>
                <CardDescription>Các loại nhãn hiển thị trạng thái ô đất, người dùng, vai trò với hiệu ứng chấm pulse nhấp nháy</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-4">
                <Badge variant="success" dot icon={<CheckCircle2 className="w-3.5 h-3.5" />}>
                  Đang hoạt động (Active)
                </Badge>
                <Badge variant="warning" dot icon={<AlertTriangle className="w-3.5 h-3.5" />}>
                  Chờ duyệt (Pending)
                </Badge>
                <Badge variant="danger" dot>
                  Đã khóa (Locked)
                </Badge>
                <Badge variant="info" icon={<Info className="w-3.5 h-3.5" />}>
                  Thông tin Staff
                </Badge>
                <Badge variant="neutral">Mặc định Neutral</Badge>
              </CardContent>
            </Card>

            {/* INPUTS & FORM SHOWCASE */}
            <Card variant="glass">
              <CardHeader>
                <CardTitle>Input Components & Form Interactive</CardTitle>
                <CardDescription>Ô nhập liệu hỗ trợ label, icon prefix/suffix, ẩn/hiện password và thông báo lỗi</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSimulatedSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    label="Tên Ô Đất Canh Tác"
                    placeholder="Ví dụ: Ô đất Rau Sạch A-12"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    error={inputError}
                    leftIcon={<Sprout className="w-4 h-4" />}
                    helperText="Nhập tên ô đất để tạo mới thử nghiệm"
                  />
                  <Input
                    label="Email Người Thuê"
                    placeholder="nhap.email@domain.com"
                    leftIcon={<Mail className="w-4 h-4" />}
                    defaultValue="tuan.customer@gmail.com"
                  />
                  <Input
                    label="Mật Khẩu Xác Nhận"
                    placeholder="••••••••"
                    isPassword
                    leftIcon={<Lock className="w-4 h-4" />}
                    defaultValue="password123"
                  />
                  <div className="flex items-end">
                    <Button type="submit" variant="primary" className="w-full" isLoading={btnLoading}>
                      Gửi Dữ Liệu Thử Nghiệm
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {/* TAB 2: ZUSTAND STATE MANAGEMENT DEMO */}
        {activeTab === 'state' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
            <Card variant="glass">
              <CardHeader>
                <CardTitle>Zustand Auth Store State</CardTitle>
                <CardDescription>Quản lý toàn bộ trạng thái Đăng nhập / Đăng xuất & User Profile trong ứng dụng</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <p className="text-xs font-semibold uppercase text-slate-500 mb-2">Trạng thái hiện tại:</p>
                  <div className="space-y-2 text-sm">
                    <p><strong>Xác thực (isAuthenticated):</strong> {isAuthenticated ? '✅ Đã đăng nhập' : '❌ Chưa đăng nhập'}</p>
                    <p><strong>Tên người dùng:</strong> {user ? user.FullName : 'N/A'}</p>
                    <p><strong>Email:</strong> {user ? user.Email : 'N/A'}</p>
                    <p><strong>Vai trò (Role):</strong> {user ? user.RoleName : 'N/A'}</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  {isAuthenticated ? (
                    <Button variant="danger" onClick={logout} leftIcon={<LogOut className="w-4 h-4" />}>
                      Đăng xuất (Reset Store)
                    </Button>
                  ) : (
                    <Button variant="primary" onClick={() => login()} isLoading={isLoading} leftIcon={<UserCheck className="w-4 h-4" />}>
                      Đăng nhập làm Phan Minh Tuấn
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card variant="glass">
              <CardHeader>
                <CardTitle>Zustand UI Store State</CardTitle>
                <CardDescription>Quản lý Theme, Modal và trạng thái giao diện toàn cục</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <p className="text-xs font-semibold uppercase text-slate-500 mb-2">Thông số UI Store:</p>
                  <div className="space-y-2 text-sm">
                    <p><strong>Theme:</strong> {theme === 'dark' ? '🌙 Dark Mode' : '☀️ Light Mode'}</p>
                    <p><strong>Modal Demo Status:</strong> {isDemoModalOpen ? 'Đang mở' : 'Đang đóng'}</p>
                    <p><strong>Tab Hiện Tại:</strong> {activeTab}</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button variant="secondary" onClick={toggleTheme}>
                    Đổi Theme ({theme === 'light' ? 'Sang Dark' : 'Sang Light'})
                  </Button>
                  <Button variant="outline" onClick={() => setDemoModalOpen(true)}>
                    Mở Modal Qua Zustand
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* TAB 3: AXIOS MOCK API DEMO */}
        {activeTab === 'mock-api' && (
          <div className="space-y-8 animate-fade-in">
            <Card variant="glass">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Axios Instance & Mock Data Adapter</CardTitle>
                  <CardDescription>
                    Hệ thống gọi API giả lập dữ liệu bảng Users và Roles theo chuẩn SQL Database
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<RefreshCw className="w-4 h-4" />}
                  onClick={() => {
                    fetchUsers();
                    fetchRoles();
                  }}
                  isLoading={isLoading}
                >
                  Tải lại API
                </Button>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Mode Switch Notice Box */}
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 flex items-start gap-3">
                  <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-xs sm:text-sm leading-relaxed">
                    <strong className="font-bold">Cách chuyển sang kết nối Backend thật khi đồng đội hoàn thành:</strong>
                    <br />
                    Mở file <code className="px-1.5 py-0.5 rounded bg-amber-200/50 dark:bg-amber-900/50">.env.local</code> và sửa{' '}
                    <code className="px-1.5 py-0.5 rounded bg-amber-200/50 dark:bg-amber-900/50">NEXT_PUBLIC_USE_MOCK=false</code>.
                    Axios sẽ lập tức chuyển sang gọi API trực tiếp tới Backend Express <code className="px-1.5 py-0.5 rounded bg-amber-200/50 dark:bg-amber-900/50">http://localhost:5000/api</code>!
                  </div>
                </div>

                {/* Users List Table Mock */}
                <div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-2">
                    <Database className="w-4 h-4 text-emerald-500" />
                    Bảng Mock Users (Dữ liệu từ API GET /users):
                  </h4>
                  <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                    <table className="w-full text-left text-xs sm:text-sm">
                      <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-semibold">
                        <tr>
                          <th className="p-3">ID</th>
                          <th className="p-3">Họ và Tên</th>
                          <th className="p-3">Email</th>
                          <th className="p-3">Vai Trò</th>
                          <th className="p-3">Trạng Thái</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                        {usersList.map((u) => (
                          <tr key={u.UserId} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                            <td className="p-3 font-mono text-slate-500">#{u.UserId}</td>
                            <td className="p-3 font-semibold flex items-center gap-2">
                              <img src={u.AvatarUrl} alt={u.FullName} className="w-6 h-6 rounded-full object-cover" />
                              {u.FullName}
                            </td>
                            <td className="p-3 text-slate-600 dark:text-slate-400">{u.Email}</td>
                            <td className="p-3 font-medium text-emerald-600 dark:text-emerald-400">{u.RoleName}</td>
                            <td className="p-3">
                              <Badge variant={u.Status === 'ACTIVE' ? 'success' : 'warning'} size="sm">
                                {u.Status}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Roles List Table Mock */}
                <div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-2">
                    <Database className="w-4 h-4 text-sky-500" />
                    Bảng Mock Roles (Dữ liệu từ API GET /roles):
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {rolesList.map((r) => (
                      <div
                        key={r.RoleId}
                        className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-sm text-emerald-600 dark:text-emerald-400">
                            Role #{r.RoleId}: {r.RoleName}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{r.Description}</p>
                      </div>
                    ))}
                  </div>
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
        title="Cửa Sổ Modal Thử Nghiệm (Base UI Component)"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDemoModalOpen(false)}>
              Hủy
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                alert('Đã xác nhận thao tác từ Modal!');
                setDemoModalOpen(false);
              }}
            >
              Xác Nhận
            </Button>
          </>
        }
      >
        <div className="space-y-4 text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
          <p>
            Đây là component <strong className="text-emerald-600 dark:text-emerald-400">Modal</strong> được cắt chuẩn hóa cho dự án PlotFarm.
          </p>
          <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800/80 space-y-2">
            <h5 className="font-bold text-slate-900 dark:text-slate-100 text-xs uppercase tracking-wider">Tính năng tích hợp:</h5>
            <ul className="list-disc pl-5 text-xs space-y-1 text-slate-600 dark:text-slate-300">
              <li>Lớp nền mờ thủy tinh (Backdrop Blur glassmorphism)</li>
              <li>Animation xuất hiện mượt mà (scale-in)</li>
              <li>Hỗ trợ phím <kbd className="px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-700 font-mono">Esc</kbd> và click bên ngoài để đóng</li>
              <li>Khóa cuộn trang (body scroll lock) tự động</li>
            </ul>
          </div>
        </div>
      </Modal>
    </div>
  );
}
