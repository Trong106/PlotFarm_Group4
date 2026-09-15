'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Users,
  UserCheck,
  UserX,
  ShieldCheck,
  ArrowLeft,
  Lock,
  Loader2,
  Sparkles,
  Server,
  LogOut,
  UserCheck2,
  LayoutDashboard,
  ShoppingCart,
  MapPin,
  DollarSign,
  TrendingUp,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Camera,
  RefreshCw,
  AlertTriangle,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useAuthStore } from '@/store/useAuthStore';
import { useAdminUserStore } from '@/store/useAdminUserStore';

import AdminUserFilters from '@/components/admin/AdminUserFilters';
import AdminUserTable from '@/components/admin/AdminUserTable';
import UserDetailModal from '@/components/admin/UserDetailModal';
import EditUserModal from '@/components/admin/EditUserModal';
import AddUserModal from '@/components/admin/AddUserModal';

interface OrderItem {
  OrderId: number;
  OrderCode: string;
  UserId: number;
  FullName: string;
  Email: string;
  PlotCode: string;
  SeedName: string;
  PackageName: string;
  TotalAmount: number;
  Status: string;
  CreatedAt: string;
  PaidAt?: string;
  DurationMonths?: number;
}

interface PlotItem {
  PlotId: number;
  PlotCode: string;
  AreaName?: string;
  RowNum: number;
  ColNum: number;
  SizeM2: number;
  SoilPH: number;
  StandardHumidity: number;
  BasePricePerMonth: number;
  Status: string;
  CameraCode?: string;
  CameraName?: string;
}

export default function AdminDashboardPage() {
  const { user, logout, isLoading: isAuthLoading, initAuth } = useAuthStore();
  const { users, fetchUsers } = useAdminUserStore();

  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'orders' | 'plots'>('overview');

  // Orders State
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('ALL');

  // Plots State
  const [plots, setPlots] = useState<PlotItem[]>([]);
  const [isLoadingPlots, setIsLoadingPlots] = useState(false);
  const [isUpdatingPlot, setIsUpdatingPlot] = useState<number | null>(null);

  useEffect(() => {
    initAuth();
    fetchUsers();
    fetchOrdersData();
    fetchPlotsData();
  }, [initAuth, fetchUsers]);

  const fetchOrdersData = async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) return;
    try {
      setIsLoadingOrders(true);
      const res = await fetch('http://localhost:5000/api/orders', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setOrders(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch admin orders:', err);
    } finally {
      setIsLoadingOrders(false);
    }
  };

  const fetchPlotsData = async () => {
    try {
      setIsLoadingPlots(true);
      const res = await fetch('http://localhost:5000/api/plots/grid');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setPlots(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch plots:', err);
    } finally {
      setIsLoadingPlots(false);
    }
  };

  const handleUpdatePlotStatus = async (plotId: number, newStatus: string) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) return;
    try {
      setIsUpdatingPlot(plotId);
      const res = await fetch(`http://localhost:5000/api/plots/${plotId}/status`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setPlots((prev) =>
          prev.map((p) => (p.PlotId === plotId ? { ...p, Status: newStatus } : p))
        );
      } else {
        alert(data.message || 'Cập nhật thất bại');
      }
    } catch (err) {
      console.error('Error updating plot status:', err);
    } finally {
      setIsUpdatingPlot(null);
    }
  };

  // User Statistics
  const totalCount = users.length;
  const activeCount = users.filter((u) => u.status === 'ACTIVE').length;
  const lockedCount = users.filter((u) => u.status === 'LOCKED').length;
  const staffCount = users.filter((u) => u.role === 'Staff' || u.role === 'Admin').length;
  const activePercentage = totalCount ? Math.round((activeCount / totalCount) * 100) : 0;

  // Order & Revenue Statistics
  const totalRevenue = orders
    .filter((o) => o.Status === 'PAID')
    .reduce((sum, o) => sum + (Number(o.TotalAmount) || 0), 0);
  const paidOrdersCount = orders.filter((o) => o.Status === 'PAID').length;
  const rentedPlotsCount = plots.filter((p) => p.Status === 'RENTED').length;
  const availablePlotsCount = plots.filter((p) => p.Status === 'AVAILABLE').length;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      (o.OrderCode || '').toLowerCase().includes(orderSearch.toLowerCase()) ||
      (o.FullName || '').toLowerCase().includes(orderSearch.toLowerCase()) ||
      (o.PlotCode || '').toLowerCase().includes(orderSearch.toLowerCase());
    const matchesStatus = orderStatusFilter === 'ALL' || o.Status === orderStatusFilter;
    return matchesSearch && matchesStatus;
  });

  // Access Control check
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600 dark:text-emerald-400" />
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
          Đang xác thực thông tin tài khoản quản trị...
        </p>
      </div>
    );
  }

  const isAdmin = user?.role === 'Admin' || user?.roleId === 1;

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-rose-200 dark:border-rose-900/50 shadow-xl rounded-3xl overflow-hidden">
          <CardContent className="p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto shadow-inner">
              <Lock className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">
              Quyền Truy Cập Bị Từ Chối (403)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Khu vực này chỉ dành riêng cho Quản Trị Viên (Admin) của hệ thống PlotFarm. Bạn không có quyền truy cập vào bảng điều khiển này.
            </p>
            <div className="pt-2 flex justify-center gap-3">
              <Link href="/">
                <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
                  Về Trang Chủ
                </Button>
              </Link>
              <Button variant="danger" size="sm" onClick={logout}>
                Đăng Xuất
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Admin Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 hover:text-emerald-600 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors shadow-xs"
              title="Về trang chủ"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg text-emerald-600 dark:text-emerald-400">
                  PlotFarm
                </span>
                <span className="px-2 py-0.5 text-[10px] font-black uppercase rounded-md bg-rose-600 text-white shadow-xs">
                  ADMIN PORTAL
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Trung tâm quản trị dữ liệu & vận hành hệ thống nông trại thông minh
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="flex items-center gap-2 justify-end">
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  {user?.fullName || 'Quản Trị Viên PlotFarm'}
                </p>
                <span className="px-1.5 py-0.2 text-[9px] font-black uppercase rounded bg-rose-500 text-white">
                  ADMIN
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                {user?.email || 'admin@plotfarm.vn'}
              </p>
            </div>
            <Button
              variant="danger"
              size="sm"
              onClick={logout}
              leftIcon={<LogOut className="w-3.5 h-3.5" />}
              className="text-xs shadow-sm"
            >
              Đăng Xuất
            </Button>
          </div>
        </header>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200 dark:border-slate-800">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'overview'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Tổng Quan & Doanh Thu</span>
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'orders'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Quản Lý Đơn Thuê ({orders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('plots')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'plots'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>Quản Lý Ô Đất & Camera ({plots.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'users'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Quản Lý Người Dùng ({users.length})</span>
          </button>
        </div>

        {/* ================= TAB 1: OVERVIEW ================= */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <TrendingUp className="w-6 h-6 text-emerald-500" /> Báo Cáo Hoạt Động & Chỉ Số KPI
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Tổng hợp số liệu thời gian thực từ cơ sở dữ liệu PlotFarm SQL Server
                </p>
              </div>

              <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 px-3.5 py-2 rounded-2xl text-emerald-700 dark:text-emerald-300 text-xs font-medium self-start md:self-auto shadow-xs">
                <Server className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 animate-pulse" />
                <span>Hệ thống cơ sở dữ liệu sẵn sàng</span>
              </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
              {/* Total Revenue */}
              <Card className="bg-white dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 shadow-sm rounded-3xl overflow-hidden group">
                <CardContent className="p-5 flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Tổng Doanh Thu Đã Thu
                    </p>
                    <h3 className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(totalRevenue)}
                    </h3>
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Từ {paidOrdersCount} đơn thanh toán
                    </p>
                  </div>
                  <div className="w-13 h-13 p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/40 shadow-inner">
                    <DollarSign className="w-6 h-6" />
                  </div>
                </CardContent>
              </Card>

              {/* Total Orders */}
              <Card className="bg-white dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 shadow-sm rounded-3xl overflow-hidden group">
                <CardContent className="p-5 flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Tổng Số Đơn Thuê Đất
                    </p>
                    <h3 className="text-3xl font-black text-blue-600 dark:text-blue-400">
                      {orders.length}
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                      Bao gồm gói hạt giống & chăm sóc
                    </p>
                  </div>
                  <div className="w-13 h-13 p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/40 shadow-inner">
                    <ShoppingCart className="w-6 h-6" />
                  </div>
                </CardContent>
              </Card>

              {/* Rented Plots */}
              <Card className="bg-white dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 shadow-sm rounded-3xl overflow-hidden group">
                <CardContent className="p-5 flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Ô Đất Đang Canh Tác
                    </p>
                    <h3 className="text-3xl font-black text-amber-600 dark:text-amber-400">
                      {rentedPlotsCount} / {plots.length}
                    </h3>
                    <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                      Tỷ lệ lấp đầy: {plots.length ? Math.round((rentedPlotsCount / plots.length) * 100) : 0}%
                    </p>
                  </div>
                  <div className="w-13 h-13 p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/40 shadow-inner">
                    <MapPin className="w-6 h-6" />
                  </div>
                </CardContent>
              </Card>

              {/* Total Users */}
              <Card className="bg-white dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 shadow-sm rounded-3xl overflow-hidden group">
                <CardContent className="p-5 flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Tài Khoản Khách Hàng
                    </p>
                    <h3 className="text-3xl font-black text-purple-600 dark:text-purple-400">
                      {users.filter((u) => u.role === 'Customer').length}
                    </h3>
                    <p className="text-[11px] text-purple-600 dark:text-purple-400 font-medium">
                      Tổng {totalCount} tài khoản toàn hệ thống
                    </p>
                  </div>
                  <div className="w-13 h-13 p-3.5 rounded-2xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-900/40 shadow-inner">
                    <Users className="w-6 h-6" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Summary Tables */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Orders Card */}
              <Card className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <ShoppingCart className="w-4 h-4 text-emerald-600" /> Đơn Thuê Mới Nhất
                  </h3>
                  <button
                    onClick={() => setActiveTab('orders')}
                    className="text-xs text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-1"
                  >
                    Xem tất cả <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {orders.slice(0, 5).map((order) => (
                    <div key={order.OrderId} className="p-4 flex items-center justify-between text-xs hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">
                          {order.OrderCode} • {order.PlotCode}
                        </p>
                        <p className="text-slate-500 dark:text-slate-400">
                          {order.FullName} • {order.SeedName}
                        </p>
                      </div>
                      <div className="text-right space-y-1">
                        <p className="font-black text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(order.TotalAmount)}
                        </p>
                        <Badge variant={order.Status === 'PAID' ? 'success' : 'warning'} size="sm">
                          {order.Status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Plot Status Quick View */}
              <Card className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-emerald-600" /> Trạng Thái 15 Ô Đất
                  </h3>
                  <button
                    onClick={() => setActiveTab('plots')}
                    className="text-xs text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-1"
                  >
                    Quản lý ô đất <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="p-4 grid grid-cols-5 gap-2.5">
                  {plots.map((plot) => (
                    <div
                      key={plot.PlotId}
                      className={`p-2.5 rounded-xl border text-center text-xs space-y-1 ${
                        plot.Status === 'RENTED'
                          ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-400'
                          : plot.Status === 'AVAILABLE'
                          ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-400'
                          : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <p className="font-black text-[11px]">{plot.PlotCode.replace('PLOT_', '')}</p>
                      <span className="text-[9px] font-bold uppercase block">
                        {plot.Status === 'RENTED' ? 'Đang Thuê' : plot.Status === 'AVAILABLE' ? 'Trống' : plot.Status}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* ================= TAB 2: ORDERS ================= */}
        {activeTab === 'orders' && (
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <ShoppingCart className="w-6 h-6 text-emerald-500" /> Danh Sách Đơn Thuê Đất & Dịch Vụ
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Kiểm soát chi tiết các đơn hàng, người đặt thuê, gói chăm sóc và doanh thu thu được
                </p>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={fetchOrdersData}
                leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isLoadingOrders ? 'animate-spin' : ''}`} />}
              >
                Làm Mới
              </Button>
            </div>

            {/* Filter Bar */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row gap-3 items-center justify-between">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Tìm mã đơn, tên khách, mã ô..."
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center gap-1.5 self-end sm:self-auto">
                <span className="text-xs text-slate-500 font-semibold mr-1">Trạng thái:</span>
                {['ALL', 'PAID', 'PENDING', 'CANCELLED'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setOrderStatusFilter(st)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                      orderStatusFilter === st
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    {st === 'ALL' ? 'Tất Cả' : st}
                  </button>
                ))}
              </div>
            </div>

            {/* Orders Table */}
            <Card className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="p-4">Mã Đơn</th>
                      <th className="p-4">Khách Hàng</th>
                      <th className="p-4">Ô Đất & Cây Trồng</th>
                      <th className="p-4">Gói Chăm Sóc</th>
                      <th className="p-4 text-right">Tổng Tiền</th>
                      <th className="p-4 text-center">Trạng Thái</th>
                      <th className="p-4">Ngày Đặt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {isLoadingOrders ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-500">
                          <Loader2 className="w-6 h-6 animate-spin mx-auto text-emerald-500 mb-2" />
                          Đang tải danh sách đơn thuê...
                        </td>
                      </tr>
                    ) : filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-500">
                          Không tìm thấy đơn hàng nào phù hợp
                        </td>
                      </tr>
                    ) : (
                      filteredOrders.map((order) => (
                        <tr key={order.OrderId} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="p-4 font-mono font-bold text-slate-900 dark:text-white">
                            {order.OrderCode}
                          </td>
                          <td className="p-4">
                            <p className="font-bold text-slate-900 dark:text-white">{order.FullName}</p>
                            <p className="text-[11px] text-slate-500">{order.Email}</p>
                          </td>
                          <td className="p-4">
                            <span className="font-extrabold text-emerald-600 dark:text-emerald-400 mr-1">
                              {order.PlotCode}
                            </span>
                            • {order.SeedName}
                          </td>
                          <td className="p-4 text-slate-600 dark:text-slate-300">
                            {order.PackageName || 'Cơ bản'}
                          </td>
                          <td className="p-4 text-right font-black text-emerald-600 dark:text-emerald-400">
                            {formatCurrency(order.TotalAmount)}
                          </td>
                          <td className="p-4 text-center">
                            <Badge variant={order.Status === 'PAID' ? 'success' : 'warning'} size="sm">
                              {order.Status}
                            </Badge>
                          </td>
                          <td className="p-4 text-slate-500">
                            {new Date(order.CreatedAt).toLocaleDateString('vi-VN')}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* ================= TAB 3: PLOTS & CAMERAS ================= */}
        {activeTab === 'plots' && (
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <MapPin className="w-6 h-6 text-emerald-500" /> Quản Lý 15 Ô Đất & Camera Thực Địa
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Kiểm tra tình trạng đất, liên kết mã camera và điều chỉnh trạng thái ô đất
                </p>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={fetchPlotsData}
                leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isLoadingPlots ? 'animate-spin' : ''}`} />}
              >
                Làm Mới
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {plots.map((plot) => (
                <Card
                  key={plot.PlotId}
                  className={`bg-white dark:bg-slate-900 rounded-3xl border transition-all p-5 space-y-3.5 shadow-sm ${
                    plot.Status === 'RENTED'
                      ? 'border-rose-200 dark:border-rose-900/40'
                      : plot.Status === 'AVAILABLE'
                      ? 'border-emerald-200 dark:border-emerald-900/40'
                      : 'border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-black text-sm text-slate-900 dark:text-white">
                        {plot.PlotCode.replace('PLOT_', '')}
                      </div>
                      <div>
                        <h4 className="font-black text-sm text-slate-900 dark:text-white">
                          Ô {plot.PlotCode}
                        </h4>
                        <span className="text-[10px] text-slate-500">
                          Hàng {plot.RowNum}, Cột {plot.ColNum} • {plot.SizeM2}m²
                        </span>
                      </div>
                    </div>
                    <Badge
                      variant={
                        plot.Status === 'RENTED'
                          ? 'danger'
                          : plot.Status === 'AVAILABLE'
                          ? 'success'
                          : 'warning'
                      }
                      size="sm"
                    >
                      {plot.Status}
                    </Badge>
                  </div>

                  {/* Camera Info */}
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                      <Camera className="w-3.5 h-3.5 text-emerald-500" />
                      {plot.CameraName || `Camera Ô ${plot.PlotCode}`}
                    </span>
                    <span className="font-mono text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                      {plot.CameraCode || 'CAM_P' + plot.PlotId}
                    </span>
                  </div>

                  {/* Price & Soil Info */}
                  <div className="grid grid-cols-2 gap-2 text-center text-xs">
                    <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                      <span className="text-[10px] text-slate-400 block">Giá thuê</span>
                      <span className="font-bold text-emerald-600">{formatCurrency(plot.BasePricePerMonth)}</span>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                      <span className="text-[10px] text-slate-400 block">pH / Độ ẩm</span>
                      <span className="font-bold text-slate-700 dark:text-slate-300">{plot.SoilPH} / {plot.StandardHumidity}%</span>
                    </div>
                  </div>

                  {/* Action Change Status */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5">
                    <span className="text-[11px] text-slate-500 font-medium">Đổi trạng thái:</span>
                    <div className="flex gap-1">
                      {plot.Status !== 'AVAILABLE' && (
                        <button
                          disabled={isUpdatingPlot === plot.PlotId}
                          onClick={() => handleUpdatePlotStatus(plot.PlotId, 'AVAILABLE')}
                          className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 text-[10px] font-bold transition-colors"
                        >
                          Sẵn sàng
                        </button>
                      )}
                      {plot.Status !== 'MAINTENANCE' && (
                        <button
                          disabled={isUpdatingPlot === plot.PlotId}
                          onClick={() => handleUpdatePlotStatus(plot.PlotId, 'MAINTENANCE')}
                          className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 text-[10px] font-bold transition-colors"
                        >
                          Bảo trì
                        </button>
                      )}
                      {plot.Status !== 'FALLOWING' && (
                        <button
                          disabled={isUpdatingPlot === plot.PlotId}
                          onClick={() => handleUpdatePlotStatus(plot.PlotId, 'FALLOWING')}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 text-[10px] font-bold transition-colors"
                        >
                          Cải tạo
                        </button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* ================= TAB 4: USERS (PRESERVED COMPLETE CRUD) ================= */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-400 shadow-lg shadow-emerald-500/20 text-white inline-flex">
                    <ShieldCheck className="w-7 h-7" />
                  </div>
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                      Quản Lý Tài Khoản Người Dùng
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                      Hệ thống quản trị tài khoản dành cho Admin: xem danh sách, tìm kiếm, lọc vai trò và kiểm soát quyền truy cập hệ thống PlotFarm.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Metric Stats Overview Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
              <Card className="bg-white dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-md transition-all rounded-3xl overflow-hidden group">
                <CardContent className="p-5 flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Tổng Số Tài Khoản
                    </p>
                    <h3 className="text-3xl font-black text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {totalCount}
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 font-medium">
                      <Sparkles className="w-3 h-3 text-blue-500" /> Hệ thống PlotFarm DB
                    </p>
                  </div>
                  <div className="w-13 h-13 p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/40 shadow-inner group-hover:scale-110 transition-transform">
                    <Users className="w-6 h-6" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-md transition-all rounded-3xl overflow-hidden group">
                <CardContent className="p-5 flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Đang Hoạt Động
                    </p>
                    <h3 className="text-3xl font-black text-emerald-600 dark:text-emerald-400 group-hover:text-emerald-500 transition-colors">
                      {activeCount}
                    </h3>
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                      <UserCheck2 className="w-3 h-3" /> {activePercentage}% tổng tài khoản
                    </p>
                  </div>
                  <div className="w-13 h-13 p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/40 shadow-inner group-hover:scale-110 transition-transform">
                    <UserCheck className="w-6 h-6" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-md transition-all rounded-3xl overflow-hidden group">
                <CardContent className="p-5 flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Tài Khoản Bị Khóa
                    </p>
                    <h3 className="text-3xl font-black text-rose-600 dark:text-rose-400 group-hover:text-rose-500 transition-colors">
                      {lockedCount}
                    </h3>
                    <p className="text-[11px] text-rose-600 dark:text-rose-400 font-medium">
                      {lockedCount === 0 ? 'Không có tài khoản bị khóa' : 'Bị vi phạm hoặc hạn chế'}
                    </p>
                  </div>
                  <div className="w-13 h-13 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40 shadow-inner group-hover:scale-110 transition-transform">
                    <UserX className="w-6 h-6" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-md transition-all rounded-3xl overflow-hidden group">
                <CardContent className="p-5 flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Đội Ngũ Nhân Viên & Admin
                    </p>
                    <h3 className="text-3xl font-black text-violet-600 dark:text-violet-400 group-hover:text-violet-500 transition-colors">
                      {staffCount}
                    </h3>
                    <p className="text-[11px] text-violet-600 dark:text-violet-400 font-medium">
                      Quản trị & vận hành hệ thống
                    </p>
                  </div>
                  <div className="w-13 h-13 p-3.5 rounded-2xl bg-violet-50 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400 border border-violet-200 dark:border-violet-900/40 shadow-inner group-hover:scale-110 transition-transform">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filter & Search Toolbar */}
            <AdminUserFilters />

            {/* User Data Table */}
            <AdminUserTable />
          </div>
        )}
      </div>

      {/* Modals for Admin User Management */}
      <UserDetailModal />
      <EditUserModal />
      <AddUserModal />
    </div>
  );
}
