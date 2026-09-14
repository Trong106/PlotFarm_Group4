'use client';

import React, { useEffect } from 'react';
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

export default function AdminDashboardPage() {
  const { user, logout, isLoading: isAuthLoading, initAuth } = useAuthStore();
  const { users, fetchUsers } = useAdminUserStore();

  useEffect(() => {
    initAuth();
    fetchUsers();
  }, [initAuth, fetchUsers]);

  // Statistics calculation
  const totalCount = users.length;
  const activeCount = users.filter((u) => u.status === 'ACTIVE').length;
  const lockedCount = users.filter((u) => u.status === 'LOCKED').length;
  const staffCount = users.filter((u) => u.role === 'Staff' || u.role === 'Admin').length;
  const activePercentage = totalCount ? Math.round((activeCount / totalCount) * 100) : 0;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#080d16] text-slate-900 dark:text-slate-100 transition-colors duration-300 p-4 sm:p-6 lg:p-8 selection:bg-emerald-500 selection:text-white">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Top Header Navigation Bar */}
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white/90 dark:bg-slate-900/90 p-4 sm:p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm backdrop-blur-xl">
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/">
              <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
                Về Trang Chủ
              </Button>
            </Link>
            <Badge variant="danger" dot icon={<Lock className="w-3.5 h-3.5" />}>
              Khu Vực Quản Trị Hệ Thống (/admin)
            </Badge>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            {isAuthLoading ? (
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
                <span>Đang đồng bộ phiên...</span>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="text-right">
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
                <Button variant="danger" size="sm" onClick={logout} leftIcon={<LogOut className="w-3.5 h-3.5" />} className="text-xs shadow-sm">
                  Đăng Xuất
                </Button>
              </div>
            )}
          </div>
        </header>

        {/* Dashboard Title & Quick Stats Section */}
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-400 shadow-lg shadow-emerald-500/20 text-white inline-flex">
                  <ShieldCheck className="w-7 h-7" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                    Quản Lý Tài Khoản Người Dùng
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Hệ thống quản trị tài khoản dành cho Admin: xem danh sách, tìm kiếm, lọc vai trò và kiểm soát quyền truy cập hệ thống PlotFarm.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 px-3.5 py-2 rounded-2xl text-emerald-700 dark:text-emerald-300 text-xs font-medium self-start md:self-auto shadow-xs">
              <Server className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 animate-pulse" />
              <span>Dữ liệu đồng bộ realtime qua RESTful APIs</span>
            </div>
          </div>

          {/* Metric Stats Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {/* Total Users Card */}
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

            {/* Active Users Card */}
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

            {/* Locked Users Card */}
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

            {/* Staff & Admin Card */}
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
        </div>

        {/* Filter & Search Toolbar */}
        <AdminUserFilters />

        {/* User Data Table */}
        <AdminUserTable />
      </div>

      {/* Modals for Admin User Management */}
      <UserDetailModal />
      <EditUserModal />
      <AddUserModal />
    </div>
  );
}
