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
  ShieldCheck,
  Radio,
  Wifi,
  WifiOff,
  Terminal,
  RefreshCw,
  Send,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import Header from '@/components/Header';
import { useAuthStore } from '@/store/useAuthStore';
import { useUIStore } from '@/store/useUIStore';
import { useSocketStore } from '@/store/useSocketStore';
import { toast } from '@/store/useToastStore';

export default function Home() {
  const { theme, toggleTheme, isDemoModalOpen, setDemoModalOpen, activeTab, setActiveTab } = useUIStore();
  const { user, isAuthenticated, isLoading, error, login, logout } = useAuthStore();
  const {
    isConnected: isSocketConnected,
    isConnecting: isSocketConnecting,
    socketId,
    identifiedUser,
    latency,
    logs: socketLogs,
    connectSocket,
    disconnectSocket,
    sendPing,
    executeAdminAction,
    checkWhoAmI,
    clearLogs,
  } = useSocketStore();

  const [btnLoading, setBtnLoading] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [inputError, setInputError] = useState('');
  const [loginEmail, setLoginEmail] = useState('admin@plotfarm.vn');
  const [loginPass, setLoginPass] = useState('password123');
  const [customSocketToken, setCustomSocketToken] = useState('');

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
      <Header />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Main Banner */}
        <div className="relative rounded-3xl p-8 mb-8 overflow-hidden bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 text-white shadow-2xl border border-emerald-500/20">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold mb-4">
              <Sparkles className="w-3.5 h-3.5" /> Đồng bộ hệ thống hoàn tất
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3">
              Hệ Thống PlotFarm Integrated Client & Server
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
          <button
            onClick={() => setActiveTab('socket')}
            className={`flex items-center gap-2 px-5 py-3 border-b-2 font-semibold text-sm transition-all whitespace-nowrap ${
              activeTab === 'socket'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Radio className="w-4 h-4" />
            3. Phân Quyền Role-based Realtime (Socket.IO)
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
                  <p className="text-emerald-400 font-bold mb-2">{'// REST API Payload Response:'}</p>
                  {isAuthenticated ? (
                    <pre className="whitespace-pre-wrap">{JSON.stringify(user, null, 2)}</pre>
                  ) : (
                    <p className="text-slate-500">{'// Chưa đăng nhập. Hãy nhập Email & Mật khẩu để gọi API thật.'}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* TAB 3: ROLE-BASED & JWT SOCKET.IO GATEWAY */}
        {activeTab === 'socket' && (
          <div className="space-y-8 animate-fade-in">
            {/* Realtime Status Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card variant="glass" className="p-4">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Trạng thái Kết nối</span>
                <div className="flex items-center gap-2 mt-2">
                  <span
                    className={`w-3 h-3 rounded-full ${
                      isSocketConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                    }`}
                  />
                  <span className="font-bold text-sm">
                    {isSocketConnected ? 'ĐÃ KẾT NỐI' : isSocketConnecting ? 'ĐANG KẾT NỐI...' : 'ĐÃ NGẮT'}
                  </span>
                </div>
              </Card>

              <Card variant="glass" className="p-4">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Socket Client ID</span>
                <p className="font-mono text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-2 truncate">
                  {socketId || '--'}
                </p>
              </Card>

              <Card variant="glass" className="p-4">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Vai trò Được Định Danh</span>
                <div className="mt-1">
                  <Badge
                    variant={
                      identifiedUser?.role === 'Admin'
                        ? 'danger'
                        : identifiedUser?.role === 'Staff'
                        ? 'warning'
                        : identifiedUser?.role === 'Customer'
                        ? 'success'
                        : 'neutral'
                    }
                    size="sm"
                  >
                    {identifiedUser?.role || 'GUEST (Khách)'}
                  </Badge>
                </div>
              </Card>

              <Card variant="glass" className="p-4">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Độ Trễ Khứ Hồi (RTT)</span>
                <p className="font-mono text-base font-extrabold text-blue-500 mt-1">
                  {latency !== null ? `${latency} ms` : '-- ms'}
                </p>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Connection Controls & Token Input */}
              <Card variant="glass">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Radio className="w-5 h-5 text-emerald-500" />
                    Kết Nối Realtime Gateway & JWT Token
                  </CardTitle>
                  <CardDescription>
                    Middleware Socket.IO tự động giải mã JWT để định danh người dùng và xếp room theo vai trò
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">
                      JWT Token xác thực (Tùy chọn hoặc tự lấy khi đã login)
                    </label>
                    <input
                      type="text"
                      className="w-full px-3.5 py-2 rounded-xl text-xs font-mono border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="Để trống để dùng Token đang đăng nhập hoặc kết nối kiểu Khách vãng lai..."
                      value={customSocketToken}
                      onChange={(e) => setCustomSocketToken(e.target.value)}
                    />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {isAuthenticated && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const token = localStorage.getItem('token') || '';
                          setCustomSocketToken(token);
                          toast.info('Đã điền Token của tài khoản hiện tại', 'JWT Token');
                        }}
                      >
                        Dùng Token Hiện Tại ({user?.role})
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setCustomSocketToken('');
                        toast.info('Đã xóa token, kết nối sẽ ở vai trò Guest', 'Guest Mode');
                      }}
                    >
                      Xóa Token (Chế độ Khách)
                    </Button>
                  </div>

                  <div className="flex flex-wrap gap-3 pt-2">
                    {isSocketConnected ? (
                      <Button
                        variant="danger"
                        onClick={disconnectSocket}
                        leftIcon={<WifiOff className="w-4 h-4" />}
                      >
                        Ngắt Kết Nối Socket
                      </Button>
                    ) : (
                      <Button
                        variant="primary"
                        isLoading={isSocketConnecting}
                        onClick={async () => {
                          await connectSocket(customSocketToken.trim() || undefined);
                        }}
                        leftIcon={<Wifi className="w-4 h-4" />}
                      >
                        Kết Nối Socket.IO
                      </Button>
                    )}

                    <Button
                      variant="outline"
                      disabled={!isSocketConnected}
                      onClick={async () => {
                        await sendPing();
                      }}
                      leftIcon={<Activity className="w-4 h-4" />}
                    >
                      Ping RTT
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Role-based Authorization Interactive Tester */}
              <Card variant="glass">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-blue-500" />
                    Phân Quyền Role-Based Realtime
                  </CardTitle>
                  <CardDescription>
                    Kiểm tra phân quyền server Socket.IO dựa trên vai trò giải mã từ Token
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  {/* Identity Detail Box */}
                  <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Định danh Client:</span>
                      <Badge
                        variant={
                          identifiedUser?.role === 'Admin'
                            ? 'danger'
                            : identifiedUser?.role === 'Staff'
                            ? 'warning'
                            : identifiedUser?.role === 'Customer'
                            ? 'success'
                            : 'neutral'
                        }
                      >
                        {identifiedUser?.role || 'Chưa định danh'}
                      </Badge>
                    </div>
                    <div>
                      <span className="text-slate-500">User ID: </span>
                      <span className="font-bold">{identifiedUser?.userId ?? 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Họ tên / Email: </span>
                      <span className="font-semibold">
                        {identifiedUser?.fullName || identifiedUser?.email || (identifiedUser?.isAnonymous ? 'Khách Vãng Lai' : 'N/A')}
                      </span>
                    </div>
                  </div>

                  {/* Role Actions */}
                  <div className="space-y-3">
                    <Button
                      variant="secondary"
                      className="w-full justify-start text-xs"
                      disabled={!isSocketConnected}
                      onClick={async () => {
                        await checkWhoAmI();
                      }}
                      leftIcon={<RefreshCw className="w-4 h-4" />}
                    >
                      1. Gọi Sự Kiện &quot;whoami&quot; (Xác Minh Lại Định Danh)
                    </Button>

                    <Button
                      variant="primary"
                      className="w-full justify-start text-xs bg-amber-600 hover:bg-amber-700 text-white"
                      disabled={!isSocketConnected}
                      onClick={async () => {
                        await executeAdminAction('BAT_HE_THONG_TUOI_TIEU_TOAN_KHU');
                      }}
                      leftIcon={<ShieldCheck className="w-4 h-4" />}
                    >
                      2. Thao Tác Yêu Cầu Quyền Quản Trị (Admin/Staff Only)
                    </Button>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed italic">
                    * Ghi chú: Nếu bạn kết nối với vai trò <strong>Customer</strong> hoặc <strong>Guest</strong>, thao tác quản trị trên sẽ bị Server từ chối ngay với mã lỗi <strong>403 Forbidden</strong> và hiển thị Toast Cảnh báo.
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Realtime Event Stream Terminal Viewer */}
            <Card variant="glass">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Terminal className="w-4 h-4 text-emerald-500" />
                    Nhật Ký Sự Kiện Realtime (Realtime Event Console)
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Theo dõi trực tiếp các gói tin gửi/nhận, bắt lỗi và phản hồi định danh
                  </CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={clearLogs} leftIcon={<Trash2 className="w-3.5 h-3.5" />}>
                  Xóa Log
                </Button>
              </CardHeader>
              <CardContent>
                <div className="p-4 rounded-2xl bg-slate-950 font-mono text-xs text-slate-200 h-64 overflow-y-auto space-y-2 border border-slate-800 shadow-inner">
                  {socketLogs.length === 0 ? (
                    <p className="text-slate-500 italic">{'// Chưa có sự kiện nào. Hãy bấm "Kết Nối Socket.IO" để bắt đầu.'}</p>
                  ) : (
                    socketLogs.map((log) => (
                      <div key={log.id} className="flex items-start gap-2 leading-relaxed">
                        <span className="text-slate-500 shrink-0">[{log.time}]</span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                            log.type === 'connect'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : log.type === 'error'
                              ? 'bg-rose-950 text-rose-400 border border-rose-800'
                              : log.type === 'pong'
                              ? 'bg-blue-950 text-blue-400 border border-blue-800'
                              : 'bg-amber-950 text-amber-400 border border-amber-800'
                          }`}
                        >
                          {log.type.toUpperCase()}
                        </span>
                        <span className="text-slate-300">{log.message}</span>
                      </div>
                    ))
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
            Đây là component <strong className="text-emerald-600 dark:text-emerald-400">Modal</strong> dùng chung cho dự án PlotFarm.
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
