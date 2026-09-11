'use client';

import React from 'react';
import Link from 'next/link';
import { User, ShieldCheck, ArrowLeft, Mail, Phone, Calendar, MapPin, Edit3, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useAuthStore } from '@/store/useAuthStore';
import Header from '@/components/Header';

export default function ProfilePage() {
  const { user, isLoading } = useAuthStore();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#080d16] text-slate-900 dark:text-slate-100 transition-colors duration-300">
      <Header />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Navigation & Header */}
        <div className="flex items-center justify-between">
          <Link href="/">
            <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Quay Lại Trang Chủ
            </Button>
          </Link>

          <Badge variant="success" dot icon={<ShieldCheck className="w-3.5 h-3.5" />}>
            Xác thực tài khoản chuẩn SSL/JWT
          </Badge>
        </div>

        {/* User Profile Overview Card */}
        <Card variant="glass" className="border-emerald-500/30 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-emerald-900/30 via-slate-900/30 to-teal-900/30 border-b border-slate-200 dark:border-slate-800 pb-6">
            <div className="flex flex-col sm:flex-row items-center gap-5">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-black text-2xl flex items-center justify-center shadow-xl ring-4 ring-emerald-500/20">
                {user?.fullName ? user.fullName.substring(0, 2).toUpperCase() : 'PF'}
              </div>
              <div className="text-center sm:text-left space-y-1">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <CardTitle className="text-2xl font-extrabold">{user?.fullName || 'Người dùng PlotFarm'}</CardTitle>
                  <Badge variant="info" size="sm" className="uppercase font-bold">
                    {user?.role || 'Customer'}
                  </Badge>
                </div>
                <CardDescription className="flex items-center justify-center sm:justify-start gap-2 text-xs">
                  <Mail className="w-3.5 h-3.5" /> {user?.email || 'chua-cap-nhat@plotfarm.vn'}
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6 space-y-6">
            {isLoading ? (
              <div className="p-8 flex flex-col items-center justify-center gap-3 text-slate-500">
                <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
                <p className="text-xs font-medium">Đang tải dữ liệu hồ sơ cá nhân...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-2">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-emerald-500" /> Họ và tên
                  </p>
                  <p className="text-sm font-semibold">{user?.fullName || 'Chưa cập nhật'}</p>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-2">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-emerald-500" /> Email liên hệ
                  </p>
                  <p className="text-sm font-semibold">{user?.email || 'Chưa cập nhật'}</p>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-2">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-emerald-500" /> Số điện thoại
                  </p>
                  <p className="text-sm font-semibold">{user?.phoneNumber || 'Chưa cập nhật số điện thoại'}</p>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-2">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-500" /> Sổ địa chỉ mặc định
                  </p>
                  <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 italic">
                    Chức năng cập nhật sổ địa chỉ đang được khởi tạo...
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
