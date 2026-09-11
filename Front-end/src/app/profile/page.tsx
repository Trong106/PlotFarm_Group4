'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  User,
  ShieldCheck,
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Edit3,
  Loader2,
  Plus,
  Trash2,
  Star,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Package,
  RotateCcw,
  Lock,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { useAuthStore } from '@/store/useAuthStore';
import { useAddressStore, UserAddress } from '@/store/useAddressStore';
import Header from '@/components/Header';
import { AddressModal } from '@/components/profile/AddressModal';

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: isAuthLoading, initAuth, fetchProfile, updateProfile } = useAuthStore();
  const { addresses, isLoading: isAddressLoading, isSubmitting: isAddressSubmitting, fetchAddresses, setDefaultAddress, deleteAddress } = useAddressStore();

  // Profile editing state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Address modal state
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Initialize auth and fetch data
  useEffect(() => {
    initAuth();
  }, [initAuth]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchProfile();
      fetchAddresses();
    }
  }, [isAuthenticated, fetchProfile, fetchAddresses]);

  // Sync form inputs with user profile
  useEffect(() => {
    if (user) {
      setFullName(user.fullName || '');
      setPhoneNumber(user.phoneNumber || '');
    }
  }, [user]);

  // Handle Profile Update
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    const trimmedName = fullName.trim();
    if (!trimmedName) {
      errors.fullName = 'Họ và tên không được để trống';
    } else if (trimmedName.length > 100) {
      errors.fullName = 'Họ và tên tối đa 100 ký tự';
    }

    const trimmedPhone = phoneNumber.trim();
    if (trimmedPhone && !/^\+?[0-9]{9,15}$/.test(trimmedPhone)) {
      errors.phoneNumber = 'Số điện thoại gồm 9-15 chữ số';
    }

    if (Object.keys(errors).length > 0) {
      setProfileErrors(errors);
      return;
    }

    setProfileErrors({});
    setIsSavingProfile(true);

    const ok = await updateProfile({
      fullName: trimmedName,
      phoneNumber: trimmedPhone || null,
    });

    setIsSavingProfile(false);
    if (ok) {
      setIsEditingProfile(false);
    }
  };

  const handleCancelEditProfile = () => {
    if (user) {
      setFullName(user.fullName || '');
      setPhoneNumber(user.phoneNumber || '');
    }
    setProfileErrors({});
    setIsEditingProfile(false);
  };

  // Handle Delete Address confirmation
  const handleDeleteAddress = async (addressId: number) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa địa chỉ nhận rau này không?')) {
      setDeletingId(addressId);
      await deleteAddress(addressId);
      setDeletingId(null);
    }
  };

  const getRoleBadgeVariant = (role?: string) => {
    switch (role?.toLowerCase()) {
      case 'admin':
        return 'danger';
      case 'staff':
        return 'warning';
      default:
        return 'info';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#080d16] text-slate-900 dark:text-slate-100 transition-colors duration-300 pb-16">
      <Header />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Navigation & Status bar */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link href="/">
            <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Quay Lại Trang Chủ
            </Button>
          </Link>

          <div className="flex items-center gap-2.5">
            <Badge variant="success" dot icon={<ShieldCheck className="w-3.5 h-3.5" />}>
              Xác thực SSL / JWT Bảo mật
            </Badge>
          </div>
        </div>

        {/* Auth check: If not authenticated */}
        {!isAuthLoading && !isAuthenticated && (
          <Card variant="glass" className="border-amber-500/30 p-8 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <AlertCircle className="w-8 h-8" />
            </div>
            <CardTitle className="text-xl font-bold">Vui Lòng Đăng Nhập</CardTitle>
            <CardDescription className="max-w-md mx-auto">
              Bạn cần đăng nhập tài khoản để truy cập hồ sơ cá nhân và quản lý sổ địa chỉ nhận nông sản.
            </CardDescription>
            <div>
              <Link href="/login">
                <Button variant="primary" size="md">
                  Đến Trang Đăng Nhập
                </Button>
              </Link>
            </div>
          </Card>
        )}

        {/* When authenticated */}
        {(isAuthenticated || isAuthLoading) && (
          <>
            {/* 1. HERO PROFILE OVERVIEW CARD */}
            <Card variant="glass" className="border-emerald-500/30 overflow-hidden shadow-xl shadow-emerald-500/5">
              <CardHeader className="bg-gradient-to-r from-emerald-900/40 via-slate-900/40 to-teal-900/40 border-b border-slate-200/80 dark:border-slate-800/80 p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
                  <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
                    {/* Avatar Initials */}
                    <div className="relative group">
                      <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-400 text-white font-black text-3xl flex items-center justify-center shadow-2xl ring-4 ring-emerald-500/30 group-hover:scale-105 transition-transform duration-300">
                        {user?.fullName ? user.fullName.substring(0, 2).toUpperCase() : 'PF'}
                      </div>
                      <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900 flex items-center justify-center">
                        <Sparkles className="w-3.5 h-3.5 text-white" />
                      </span>
                    </div>

                    {/* Name & Role */}
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                        <CardTitle className="text-2xl sm:text-3xl font-black tracking-tight">
                          {user?.fullName || 'Người dùng PlotFarm'}
                        </CardTitle>
                        <Badge
                          variant={getRoleBadgeVariant(user?.role)}
                          size="sm"
                          className="uppercase font-bold tracking-wider"
                        >
                          {user?.role || 'Customer'}
                        </Badge>
                        <Badge variant="success" size="sm" dot>
                          {user?.status || 'ACTIVE'}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-emerald-500" />
                          {user?.email || 'email@plotfarm.vn'}
                        </span>
                        {user?.phoneNumber && (
                          <span className="flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-emerald-500" />
                            {user.phoneNumber}
                          </span>
                        )}
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                          Thành viên PlotFarm
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Quick Edit Profile Button */}
                  {!isEditingProfile && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditingProfile(true)}
                      leftIcon={<Edit3 className="w-4 h-4" />}
                      className="shrink-0"
                    >
                      Đổi Tên & SĐT
                    </Button>
                  )}
                </div>
              </CardHeader>

              {/* 2. PROFILE EDIT FORM OR VIEW INFO */}
              <CardContent className="p-6 sm:p-8">
                {isEditingProfile ? (
                  <form onSubmit={handleSaveProfile} className="space-y-6 animate-fade-in">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                      <div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                          <Edit3 className="w-4 h-4 text-emerald-500" /> Chỉnh Sửa Thông Tin Cá Nhân
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Cập nhật họ tên và số điện thoại liên hệ nhận thông báo mùa vụ
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {/* Full Name */}
                      <Input
                        label="Họ và Tên *"
                        placeholder="Nhập họ và tên đầy đủ"
                        leftIcon={<User className="w-4 h-4" />}
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        error={profileErrors.fullName}
                        disabled={isSavingProfile}
                      />

                      {/* Phone Number */}
                      <Input
                        label="Số Điện Thoại"
                        placeholder="Ví dụ: 0901234567"
                        leftIcon={<Phone className="w-4 h-4" />}
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        error={profileErrors.phoneNumber}
                        helperText="Dùng để nhận tin nhắn SMS khi nông sản được thu hoạch và giao hàng"
                        disabled={isSavingProfile}
                      />

                      {/* Email (Read only) */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold tracking-wider text-slate-700 dark:text-slate-300 uppercase flex items-center justify-between">
                          <span>Email Tài Khoản</span>
                          <span className="text-[10px] text-slate-400 lowercase font-normal flex items-center gap-1">
                            <Lock className="w-3 h-3" /> không thể đổi
                          </span>
                        </label>
                        <div className="relative flex items-center">
                          <div className="absolute left-3.5 text-slate-400 flex items-center">
                            <Mail className="w-4 h-4" />
                          </div>
                          <input
                            type="text"
                            value={user?.email || ''}
                            disabled
                            className="w-full py-2.5 pl-10 pr-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/80 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 text-sm cursor-not-allowed outline-none"
                          />
                        </div>
                      </div>

                      {/* Role & Permissions (Read only) */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold tracking-wider text-slate-700 dark:text-slate-300 uppercase">
                          Vai Trò & Quyền Hạn
                        </label>
                        <div className="py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/80 dark:bg-slate-900/50 flex items-center justify-between">
                          <span className="text-sm font-semibold capitalize text-slate-700 dark:text-slate-300">
                            {user?.role || 'Khách hàng'}
                          </span>
                          <Badge variant={getRoleBadgeVariant(user?.role)} size="sm">
                            {user?.role || 'Customer'}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center justify-end gap-3 pt-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleCancelEditProfile}
                        disabled={isSavingProfile}
                        leftIcon={<RotateCcw className="w-4 h-4" />}
                      >
                        Hủy Bỏ
                      </Button>
                      <Button
                        type="submit"
                        variant="primary"
                        size="sm"
                        disabled={isSavingProfile}
                        leftIcon={
                          isSavingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />
                        }
                      >
                        {isSavingProfile ? 'Đang Lưu...' : 'Lưu Thay Đổi'}
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800/80 space-y-1.5 hover:border-emerald-500/30 transition-colors">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-emerald-500" /> Họ và tên
                      </p>
                      <p className="text-base font-bold text-slate-800 dark:text-slate-200">
                        {user?.fullName || 'Chưa cập nhật họ tên'}
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800/80 space-y-1.5 hover:border-emerald-500/30 transition-colors">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-emerald-500" /> Email tài khoản
                      </p>
                      <p className="text-base font-bold text-slate-800 dark:text-slate-200">
                        {user?.email || 'Chưa cập nhật'}
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800/80 space-y-1.5 hover:border-emerald-500/30 transition-colors">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-emerald-500" /> Số điện thoại liên hệ
                      </p>
                      <p className="text-base font-bold text-slate-800 dark:text-slate-200">
                        {user?.phoneNumber || (
                          <span className="text-sm font-normal text-slate-400 italic">Chưa liên kết số điện thoại</span>
                        )}
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800/80 space-y-1.5 hover:border-emerald-500/30 transition-colors">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-emerald-500" /> Số lượng địa chỉ đã lưu
                      </p>
                      <p className="text-base font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                        <span>{addresses.length} địa chỉ</span>
                        {addresses.some((a) => a.isDefault) && (
                          <Badge variant="success" size="sm">
                            Đã có địa chỉ mặc định
                          </Badge>
                        )}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 3. HARVEST SHIPPING ADDRESS BOOK */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
                    <MapPin className="w-6 h-6 text-emerald-500" /> Sổ Địa Chỉ Nhận Nông Sản Thu Hoạch
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                    Địa chỉ nhận rau củ quả thu hoạch từ các ô đất canh tác trực tuyến của bạn
                  </p>
                </div>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setIsAddressModalOpen(true)}
                  leftIcon={<Plus className="w-4 h-4" />}
                  className="shadow-lg shadow-emerald-500/20 shrink-0"
                >
                  Thêm Địa Chỉ Mới
                </Button>
              </div>

              {/* State A: Loading Skeleton */}
              {isAddressLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
                  {[1, 2].map((i) => (
                    <div
                      key={i}
                      className="p-6 rounded-3xl bg-white/50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 space-y-4"
                    >
                      <div className="flex items-center justify-between">
                        <div className="h-5 w-36 bg-slate-200 dark:bg-slate-800 rounded-lg" />
                        <div className="h-5 w-20 bg-slate-200 dark:bg-slate-800 rounded-lg" />
                      </div>
                      <div className="space-y-2">
                        <div className="h-4 w-48 bg-slate-200 dark:bg-slate-800 rounded" />
                        <div className="h-4 w-full bg-slate-200 dark:bg-slate-800 rounded" />
                      </div>
                      <div className="pt-2 flex justify-end gap-2">
                        <div className="h-8 w-24 bg-slate-200 dark:bg-slate-800 rounded-xl" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : addresses.length === 0 ? (
                /* State B: Empty State Card */
                <Card variant="glass" className="border-dashed border-2 border-slate-300 dark:border-slate-700/80 p-8 sm:p-12 text-center">
                  <div className="max-w-md mx-auto space-y-4">
                    <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-emerald-500/10 via-teal-500/10 to-emerald-500/20 text-emerald-500 flex items-center justify-center shadow-inner">
                      <Package className="w-10 h-10 animate-bounce" />
                    </div>
                    <div className="space-y-1.5">
                      <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">
                        Chưa có địa chỉ nhận rau nào
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                        Thêm địa chỉ giao hàng ngay để hệ thống tự động vận chuyển nông sản sạch về tận nhà bạn khi mùa vụ đến ngày thu hoạch!
                      </p>
                    </div>
                    <div className="pt-2">
                      <Button
                        variant="primary"
                        size="md"
                        onClick={() => setIsAddressModalOpen(true)}
                        leftIcon={<Plus className="w-4 h-4" />}
                      >
                        Thêm Địa Chỉ Đầu Tiên
                      </Button>
                    </div>
                  </div>
                </Card>
              ) : (
                /* State C: Grid of Address Cards */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {addresses.map((address: UserAddress) => (
                    <Card
                      key={address.addressId}
                      variant="glass"
                      className={`relative overflow-hidden transition-all duration-300 hover:shadow-lg ${
                        address.isDefault
                          ? 'border-emerald-500/60 ring-2 ring-emerald-500/20 bg-gradient-to-br from-emerald-950/20 via-slate-900/60 to-teal-950/20'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <CardContent className="p-5 sm:p-6 space-y-4">
                        {/* Header: Name and default badge */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-base text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                                <User className="w-4 h-4 text-emerald-500" />
                                {address.recipientName}
                              </span>
                              {address.isDefault && (
                                <Badge variant="success" size="sm" icon={<Star className="w-3 h-3 fill-emerald-500" />}>
                                  Mặc Định
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                              <Phone className="w-3.5 h-3.5 text-emerald-500" />
                              {address.phoneNumber}
                            </p>
                          </div>
                        </div>

                        {/* Detailed address */}
                        <div className="p-3.5 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/60 space-y-1 text-xs">
                          <p className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                            Địa chỉ giao nông sản
                          </p>
                          <p className="font-medium text-slate-800 dark:text-slate-200 leading-relaxed">
                            {address.addressLine}
                          </p>
                          <p className="text-slate-500 dark:text-slate-400">
                            {[address.ward, address.district, address.province].filter(Boolean).join(', ')}
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-between pt-1 border-t border-slate-200/50 dark:border-slate-800/50 text-xs">
                          <div>
                            {!address.isDefault && (
                              <button
                                type="button"
                                onClick={() => setDefaultAddress(address.addressId)}
                                disabled={isAddressSubmitting}
                                className="font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 flex items-center gap-1 transition-colors disabled:opacity-50"
                              >
                                <Star className="w-3.5 h-3.5" /> Đặt làm mặc định
                              </button>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleDeleteAddress(address.addressId)}
                              disabled={deletingId === address.addressId || isAddressSubmitting}
                              className="p-1.5 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                              title="Xóa địa chỉ"
                            >
                              {deletingId === address.addressId ? (
                                <Loader2 className="w-4 h-4 animate-spin text-red-500" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {/* Add Address Modal */}
      <AddressModal
        isOpen={isAddressModalOpen}
        onClose={() => setIsAddressModalOpen(false)}
        onSuccess={() => setIsAddressModalOpen(false)}
      />
    </div>
  );
}
