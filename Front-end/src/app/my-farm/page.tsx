'use client';

import React from 'react';
import Link from 'next/link';
import { Sprout, Trees, ShieldCheck, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/context/AuthContext';

export default function MyFarmPage() {
  const { user, logout, isLoading } = useAuth();

  return (
    <div className="min-h-screen bg-[#FAF7F2] dark:bg-[#0F140D] text-slate-800 dark:text-slate-100 transition-colors duration-300 p-6 sm:p-12">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header Navigation */}
        <div className="flex items-center justify-between">
          <Link href="/">
            <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Về Trang Chủ
            </Button>
          </Link>

          <Badge variant="success" dot icon={<ShieldCheck className="w-3.5 h-3.5" />}>
            Đã Được Bảo Vệ Bởi Middleware & Auth Context
          </Badge>
        </div>

        {/* Main Content Card */}
        <Card variant="glass" className="border-emerald-500/30">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-gradient-to-tr from-brand-600 to-emerald-500 text-white shadow-lg">
                <Trees className="w-7 h-7" />
              </div>
              <div>
                <CardTitle className="text-2xl font-extrabold">Nông Trại Của Tôi (/my-farm)</CardTitle>
                <CardDescription>Trang cá nhân quản lý các ô đất nông nghiệp của bạn</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 rounded-2xl bg-brand-500/10 border border-brand-500/30 text-brand-900 dark:text-brand-200 flex items-start gap-3 text-xs">
              <CheckCircle2 className="w-5 h-5 text-brand-600 dark:text-brand-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-sm">Truy Cập Thành Công & Giữ Trạng Thái Đăng Nhập!</p>
                <p className="mt-0.5 leading-relaxed">
                  Next.js Middleware kiểm tra Cookie xác thực, Auth Context duy trì phiên đăng nhập xuyên suốt khi F5 hoặc chuyển trang.
                </p>
              </div>
            </div>

            {isLoading ? (
              <div className="p-8 rounded-2xl bg-white/60 dark:bg-soil-950/60 border border-slate-200 dark:border-soil-900 flex flex-col items-center justify-center gap-3 text-slate-500">
                <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
                <p className="text-xs font-medium">Đang tải thông tin phiên người dùng...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-white dark:bg-soil-950 border border-slate-200 dark:border-soil-900 space-y-1">
                  <span className="text-xs text-slate-500 font-semibold">Tên Tài Khoản:</span>
                  <p className="font-bold text-slate-800 dark:text-slate-100">{user?.fullName || 'Người Dùng PlotFarm'}</p>
                </div>
                <div className="p-4 rounded-2xl bg-white dark:bg-soil-950 border border-slate-200 dark:border-soil-900 space-y-1">
                  <span className="text-xs text-slate-500 font-semibold">Email Đăng Nhập:</span>
                  <p className="font-bold text-slate-800 dark:text-slate-100">{user?.email || 'user@plotfarm.vn'}</p>
                </div>
                <div className="p-4 rounded-2xl bg-white dark:bg-soil-950 border border-slate-200 dark:border-soil-900 space-y-1">
                  <span className="text-xs text-slate-500 font-semibold">Vai Trò (Role):</span>
                  <p className="font-bold text-emerald-600 dark:text-emerald-400">{user?.role || 'Customer'}</p>
                </div>
                <div className="p-4 rounded-2xl bg-white dark:bg-soil-950 border border-slate-200 dark:border-soil-900 space-y-1">
                  <span className="text-xs text-slate-500 font-semibold">Số Điện Thoại:</span>
                  <p className="font-bold text-slate-800 dark:text-slate-100">{user?.phoneNumber || 'Chưa cập nhật'}</p>
                </div>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <Button variant="danger" onClick={logout} leftIcon={<Sprout className="w-4 h-4" />}>
                Đăng Xuất Phiên Làm Việc
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
