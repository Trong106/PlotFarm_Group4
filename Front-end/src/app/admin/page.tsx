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
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/context/AuthContext';
import { useAdminUserStore } from '@/store/useAdminUserStore';

import AdminUserFilters from '@/components/admin/AdminUserFilters';
import AdminUserTable from '@/components/admin/AdminUserTable';
import UserDetailModal from '@/components/admin/UserDetailModal';
import EditUserModal from '@/components/admin/EditUserModal';
import AddUserModal from '@/components/admin/AddUserModal';

export default function AdminDashboardPage() {
  const { user, logout, isLoading: isAuthLoading } = useAuth();
  const { users, fetchUsers } = useAdminUserStore();

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Statistics calculation
  const totalCount = users.length;
  const activeCount = users.filter((u) => u.status === 'ACTIVE').length;
  const lockedCount = users.filter((u) => u.status === 'LOCKED').length;
  const staffCount = users.filter((u) => u.role === 'Staff' || u.role === 'Admin').length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-8 lg:p-12 selection:bg-emerald-500 selection:text-slate-950">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Top Header Navigation Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-3xl border border-slate-800 backdrop-blur-lg">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
                Về Trang Chủ
              </Button>
            </Link>
            <Badge variant="danger" dot icon={<Lock className="w-3.5 h-3.5" />}>
              Khu Vực Quản Trị Hệ Thống (/admin)
            </Badge>
          </div>

          <div className="flex items-center gap-3">
            {isAuthLoading ? (
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                <span>Kiểm tra phiên làm việc...</span>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-bold text-white">
                    {user?.fullName || 'Quản trị viên PlotFarm'}
                  </p>
                  <p className="text-[10px] text-emerald-400 font-mono">
                    {user?.email || 'admin@plotfarm.vn'} • {user?.role || 'Admin'}
                  </p>
                </div>
                <Button variant="danger" size="sm" onClick={logout} className="text-xs">
                  Đăng Xuất
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Dashboard Title & Quick Stats Section */}
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
                  <span className="p-2.5 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 shadow-lg shadow-emerald-500/20 text-white inline-flex">
                    <ShieldCheck className="w-7 h-7" />
                  </span>
                  Quản Lý Tài Khoản Người Dùng
                </h1>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-2">
                Hệ thống quản trị tài khoản dành cho Admin: xem danh sách, lọc, phân quyền và kiểm soát quyền truy cập hệ thống PlotFarm.
              </p>
            </div>

            <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 px-3.5 py-2 rounded-2xl text-emerald-300 text-xs self-start md:self-auto">
              <Server className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Dữ liệu đồng bộ realtime qua Admin Store & RESTful APIs</span>
            </div>
          </div>

          {/* Metric Stats Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Users Card */}
            <Card variant="glass" className="border-slate-800 hover:border-slate-700 transition-all">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-400">Tổng Số Tài Khoản</p>
                  <h3 className="text-2xl font-extrabold text-white mt-1">{totalCount}</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-emerald-400" /> Hệ thống PlotFarm DB
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Users className="w-6 h-6" />
                </div>
              </CardContent>
            </Card>

            {/* Active Users Card */}
            <Card variant="glass" className="border-slate-800 hover:border-slate-700 transition-all">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-400">Đang Hoạt Động</p>
                  <h3 className="text-2xl font-extrabold text-emerald-400 mt-1">{activeCount}</h3>
                  <p className="text-[11px] text-emerald-400/80 mt-0.5 font-medium">
                    {totalCount ? Math.round((activeCount / totalCount) * 100) : 0}% tổng tài khoản
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <UserCheck className="w-6 h-6" />
                </div>
              </CardContent>
            </Card>

            {/* Locked Users Card */}
            <Card variant="glass" className="border-slate-800 hover:border-slate-700 transition-all">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-400">Tài Khoản Bị Khóa</p>
                  <h3 className="text-2xl font-extrabold text-rose-400 mt-1">{lockedCount}</h3>
                  <p className="text-[11px] text-rose-400/80 mt-0.5 font-medium">
                    Bị vi phạm hoặc hạn chế
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  <UserX className="w-6 h-6" />
                </div>
              </CardContent>
            </Card>

            {/* Staff / Admin Team Card */}
            <Card variant="glass" className="border-slate-800 hover:border-slate-700 transition-all">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-400">Đội Ngũ Nhân Viên / Admin</p>
                  <h3 className="text-2xl font-extrabold text-sky-400 mt-1">{staffCount}</h3>
                  <p className="text-[11px] text-sky-400/80 mt-0.5 font-medium">
                    Quản trị & vận hành
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
                  <ShieldCheck className="w-6 h-6" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Main Content Area: Filters + Users Table */}
        <div className="space-y-4">
          <AdminUserFilters />
          <AdminUserTable />
        </div>
      </div>

      {/* Interactive Modals */}
      <UserDetailModal />
      <EditUserModal />
      <AddUserModal />
    </div>
  );
}
