'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, ArrowLeft, Lock, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/context/AuthContext';

export default function AdminDashboardPage() {
  const { user, logout, isLoading } = useAuth();

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6 sm:p-12">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header Navigation */}
        <div className="flex items-center justify-between">
          <Link href="/">
            <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Về Trang Chủ
            </Button>
          </Link>

          <Badge variant="danger" dot icon={<Lock className="w-3.5 h-3.5" />}>
            Khu Vực Quản Trị Hệ Thống (/admin)
          </Badge>
        </div>

        {/* Main Content Card */}
        <Card variant="glass" className="border-rose-500/30">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-gradient-to-tr from-rose-600 to-amber-500 text-white shadow-lg">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <div>
                <CardTitle className="text-2xl font-extrabold text-white">Bảng Điều Khiển Admin (/admin)</CardTitle>
                <CardDescription className="text-slate-400">Đường dẫn bảo mật cấp cao quản lý toàn bộ hệ thống PlotFarm</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-start gap-3 text-xs">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-sm">Xác Thực Thành Công Qua Middleware & Auth Context!</p>
                <p className="mt-0.5 leading-relaxed">
                  Next.js Middleware và Auth Context bảo vệ tuyến đường và duy trì trạng thái phiên đăng nhập ngay cả khi F5 hoặc chuyển trang.
                </p>
              </div>
            </div>

            {isLoading ? (
              <div className="p-8 rounded-2xl bg-slate-800/60 border border-slate-700 flex flex-col items-center justify-center gap-3 text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
                <p className="text-xs font-medium">Đang kiểm tra và duy trì phiên đăng nhập...</p>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-slate-800 border border-slate-700 space-y-2 text-xs">
                <p className="text-slate-400">Thông tin Admin đang đăng nhập:</p>
                <p className="font-bold text-white">
                  {user?.fullName || 'Quản trị viên'} ({user?.email || 'admin@plotfarm.vn'}) - Chức vụ:{' '}
                  <span className="text-emerald-400 font-semibold">{user?.role || 'Admin'}</span>
                </p>
                {user?.phoneNumber && (
                  <p className="text-slate-400">Số điện thoại: <span className="text-slate-200">{user.phoneNumber}</span></p>
                )}
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <Button variant="danger" onClick={logout}>
                Đăng Xuất Admin
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
