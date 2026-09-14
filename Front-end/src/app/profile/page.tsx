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
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
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
  const [profileFeedback, setProfileFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Address modal state
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [addressFeedback, setAddressFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchProfile();
      fetchAddresses();
    }
  }, [isAuthenticated, fetchProfile, fetchAddresses]);

  useEffect(() => {
    if (user) {
      setFullName(user.fullName || '');
      setPhoneNumber(user.phoneNumber || '');
    }
  }, [user]);

  // Handle saving profile info
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileErrors({});
    setProfileFeedback(null);

    const errors: Record<string, string> = {};
    if (!fullName.trim()) {
      errors.fullName = 'Họ và tên không được để trống';
    } else if (fullName.trim().length < 2) {
      errors.fullName = 'Họ và tên phải có ít nhất 2 ký tự';
    }

    if (phoneNumber && !/^0[0-9]{9}$/.test(phoneNumber.trim().replace(/[\s.-]/g, ''))) {
      errors.phoneNumber = 'Số điện thoại không hợp lệ (10 số, bắt đầu bằng số 0)';
    }

    if (Object.keys(errors).length > 0) {
      setProfileErrors(errors);
      return;
    }

    try {
      setIsSavingProfile(true);
      await updateProfile({
        fullName: fullName.trim(),
        phoneNumber: phoneNumber.trim() ? phoneNumber.trim().replace(/[\s.-]/g, '') : undefined,
      });
      setProfileFeedback({
        type: 'success',
        message: 'Cập nhật thông tin hồ sơ thành công!',
      });
      setIsEditingProfile(false);
    } catch (err: any) {
      setProfileFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Không thể cập nhật hồ sơ. Vui lòng thử lại!',
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleCancelEditProfile = () => {
    setIsEditingProfile(false);
    setProfileErrors({});
    if (user) {
      setFullName(user.fullName || '');
      setPhoneNumber(user.phoneNumber || '');
    }
  };

  const handleSetDefault = async (addressId: number) => {
    try {
      await setDefaultAddress(addressId);
      setAddressFeedback({
        type: 'success',
        message: 'Đã đặt địa chỉ làm mặc định!',
      });
      setTimeout(() => setAddressFeedback(null), 3000);
    } catch (err: any) {
      setAddressFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Không thể đặt mặc định. Vui lòng thử lại!',
      });
    }
  };

  const handleDeleteAddress = async (addressId: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa địa chỉ nhận rau này không?')) return;
    try {
      await deleteAddress(addressId);
      setAddressFeedback({
        type: 'success',
        message: 'Đã xóa địa chỉ thành công!',
      });
      setTimeout(() => setAddressFeedback(null), 3000);
    } catch (err: any) {
      setAddressFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Không thể xóa địa chỉ. Vui lòng thử lại!',
      });
    }
  };

  // Determine user role badge display
  const rawRole = (user?.roleName || user?.role || 'Customer').toString().toLowerCase();
  const isAdmin = rawRole.includes('admin') || user?.roleId === 1 || user?.email === 'admin@plotfarm.vn';
  const displayRole = isAdmin ? 'Admin' : rawRole.includes('staff') || user?.roleId === 2 ? 'Staff' : 'Customer';

  const getRoleBadgeVariant = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin':
        return 'danger';
      case 'staff':
        return 'warning';
      default:
        return 'success';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/50 via-slate-50 to-slate-50 dark:from-[#09121d] dark:via-[#080d16] dark:to-[#080d16] text-slate-900 dark:text-slate-100 transition-colors duration-300 pb-20 selection:bg-emerald-500 selection:text-white">
      <Header />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Navigation & Security status bar */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link href="/">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<ArrowLeft className="w-4 h-4" />}
              className="bg-white dark:bg-slate-800/90 font-bold border-slate-200 dark:border-slate-700 shadow-xs hover:border-emerald-500 hover:text-emerald-600 transition-all"
            >
              Quay Lại Trang Chủ
            </Button>
          </Link>

          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100/80 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300/60 dark:border-emerald-800/60 shadow-xs">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              Xác thực SSL / JWT Bảo mật
            </span>
          </div>
        </div>

        {/* Auth check: If not authenticated */}
        {!isAuthLoading && !isAuthenticated && (
          <Card className="border border-amber-200 dark:border-amber-500/30 p-8 text-center space-y-4 bg-white dark:bg-slate-900 rounded-3xl shadow-md">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white">Vui Lòng Đăng Nhập</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
              Bạn cần đăng nhập tài khoản để truy cập hồ sơ cá nhân và quản lý sổ địa chỉ nhận nông sản.
            </p>
            <div>
              <Link href="/login">
                <Button variant="primary" size="md" className="font-bold shadow-md shadow-emerald-500/20">
                  Đến Trang Đăng Nhập
                </Button>
              </Link>
            </div>
          </Card>
        )}

        {/* When authenticated */}
        {(isAuthenticated || isAuthLoading) && (
          <>
            {/* Feedback Alerts */}
            {profileFeedback && (
              <div
                className={`p-4 rounded-2xl flex items-center gap-3 animate-fade-in shadow-xs border ${
                  profileFeedback.type === 'success'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 border-emerald-300 dark:border-emerald-800'
                    : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 border-rose-300 dark:border-rose-800'
                }`}
              >
                {profileFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                )}
                <span className="text-sm font-semibold">{profileFeedback.message}</span>
              </div>
            )}

            {addressFeedback && (
              <div
                className={`p-4 rounded-2xl flex items-center gap-3 animate-fade-in shadow-xs border ${
                  addressFeedback.type === 'success'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 border-emerald-300 dark:border-emerald-800'
                    : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 border-rose-300 dark:border-rose-800'
                }`}
              >
                {addressFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                )}
                <span className="text-sm font-semibold">{addressFeedback.message}</span>
              </div>
            )}

            {/* Quick Admin Navigation (Only visible for Admin) */}
            {isAdmin && (
              <div className="p-5 rounded-3xl bg-gradient-to-r from-rose-50 via-amber-50 to-emerald-50 dark:from-rose-950/40 dark:via-amber-950/30 dark:to-emerald-950/40 border border-rose-200 dark:border-rose-500/30 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 animate-fade-in">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-rose-500 text-white flex items-center justify-center font-black text-xl shadow-md shadow-rose-500/30 shrink-0">
                    ⚡
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-black text-slate-900 dark:text-white">
                        Khu Vực Quản Trị Hệ Thống (Admin Portal)
                      </h3>
                      <Badge variant="danger" size="sm">ADMIN ACCESS</Badge>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                      Tài khoản của bạn có đặc quyền Quản trị viên (Admin). Truy cập bảng điều khiển để quản lý người dùng và phân quyền.
                    </p>
                  </div>
                </div>
                <Link href="/admin" className="shrink-0 w-full sm:w-auto">
                  <Button variant="danger" size="md" rightIcon={<ArrowRight className="w-4 h-4" />} className="w-full sm:w-auto font-bold shadow-md shadow-rose-500/20">
                    Truy Cập Trang Admin
                  </Button>
                </Link>
              </div>
            )}

            {/* 1. HERO PROFILE OVERVIEW CARD - THIẾT KẾ SÁNG, SẮC NÉT, RÕ RÀNG */}
            <div className="bg-white dark:bg-slate-900 border border-emerald-200/80 dark:border-slate-800 rounded-3xl shadow-lg shadow-emerald-500/5 overflow-hidden transition-all">
              {/* Banner trên: Gradient xanh tươi sáng, dịu mắt, độ tương phản tuyệt vời */}
              <div className="bg-gradient-to-r from-emerald-100/80 via-teal-50/70 to-emerald-50 dark:from-emerald-950/40 dark:via-slate-900/80 dark:to-teal-950/40 border-b border-emerald-100 dark:border-slate-800 p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
                  <div className="flex flex-col sm:flex-row items-center gap-5 sm:gap-6 text-center sm:text-left">
                    {/* Avatar Initials với viền trắng và bóng đổ nổi bật */}
                    <div className="relative group shrink-0">
                      <div className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-500 text-white font-black text-3xl flex items-center justify-center shadow-lg shadow-emerald-500/25 ring-4 ring-white dark:ring-slate-800 group-hover:scale-105 transition-transform duration-300">
                        {user?.fullName ? user.fullName.substring(0, 2).toUpperCase() : 'PF'}
                      </div>
                      <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900 flex items-center justify-center shadow-xs">
                        <Sparkles className="w-3.5 h-3.5 text-white" />
                      </span>
                    </div>

                    {/* Name, Role & Contact Pills */}
                    <div className="space-y-2.5">
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                          {user?.fullName || 'Người dùng PlotFarm'}
                        </h1>
                        <Badge
                          variant={getRoleBadgeVariant(displayRole)}
                          size="sm"
                          className="uppercase font-extrabold tracking-wider shadow-xs"
                        >
                          {displayRole}
                        </Badge>
                        <Badge variant="success" size="sm" dot className="font-bold shadow-xs">
                          {user?.status || 'ACTIVE'}
                        </Badge>
                      </div>

                      {/* Contact & Member info as clean, modern badges */}
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-0.5">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-xs">
                          <Mail className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span>{user?.email || 'email@plotfarm.vn'}</span>
                        </span>
                        {user?.phoneNumber && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-xs">
                            <Phone className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            <span>{user.phoneNumber}</span>
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-xs">
                          <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span>Thành viên PlotFarm</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Quick Edit Profile Button */}
                  <div className="shrink-0">
                    {!isEditingProfile && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEditingProfile(true)}
                        leftIcon={<Edit3 className="w-4 h-4" />}
                        className="bg-white hover:bg-emerald-50 text-emerald-800 dark:bg-slate-800 dark:text-emerald-300 dark:hover:bg-slate-700 font-bold border-emerald-300 dark:border-emerald-700 shadow-xs hover:border-emerald-500 transition-all"
                      >
                        Đổi Tên & SĐT
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Card Body: Form chỉnh sửa HOẶC 4 thẻ thông tin nổi bật */}
              <div className="p-6 sm:p-8 bg-white dark:bg-slate-900">
                {isEditingProfile ? (
                  <form onSubmit={handleSaveProfile} className="space-y-6 animate-fade-in">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                      <div>
                        <h3 className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                          <Edit3 className="w-4 h-4 text-emerald-500" /> Chỉnh Sửa Thông Tin Cá Nhân
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
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
                        <label className="text-xs font-bold tracking-wider text-slate-700 dark:text-slate-300 uppercase flex items-center justify-between">
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
                            className="w-full py-2.5 pl-10 pr-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-100/90 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 text-sm cursor-not-allowed outline-none font-medium"
                          />
                        </div>
                      </div>

                      {/* Role & Permissions (Read only) */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold tracking-wider text-slate-700 dark:text-slate-300 uppercase">
                          Vai Trò & Quyền Hạn
                        </label>
                        <div className="py-2.5 px-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-100/90 dark:bg-slate-900/50 flex items-center justify-between">
                          <span className="text-sm font-semibold capitalize text-slate-700 dark:text-slate-300">
                            {isAdmin
                              ? 'Quản trị viên hệ thống (Admin)'
                              : displayRole === 'Staff'
                              ? 'Kỹ thuật viên trang trại (Staff)'
                              : 'Khách hàng thành viên (Customer)'}
                          </span>
                          <Badge variant={getRoleBadgeVariant(displayRole)} size="sm">
                            {displayRole}
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
                  /* 4 Thẻ thông tin tài khoản: Nền trắng sáng, viền sắc nét, icon màu rực rỡ, độ tương phản cao */
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Họ và tên */}
                    <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-200/90 dark:border-slate-800 shadow-xs hover:border-emerald-400 hover:shadow-sm transition-all group">
                      <div className="flex items-center gap-3.5">
                        <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 flex items-center justify-center shrink-0 border border-emerald-200 dark:border-emerald-800">
                          <User className="w-5 h-5" />
                        </div>
                        <div className="space-y-0.5 min-w-0">
                          <p className="text-[11px] font-extrabold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider">
                            Họ và tên
                          </p>
                          <p className="text-base sm:text-lg font-black text-slate-900 dark:text-white truncate">
                            {user?.fullName || 'Chưa cập nhật họ tên'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Email tài khoản */}
                    <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-blue-200/90 dark:border-slate-800 shadow-xs hover:border-blue-400 hover:shadow-sm transition-all group">
                      <div className="flex items-center gap-3.5">
                        <div className="w-11 h-11 rounded-2xl bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 flex items-center justify-center shrink-0 border border-blue-200 dark:border-blue-800">
                          <Mail className="w-5 h-5" />
                        </div>
                        <div className="space-y-0.5 min-w-0">
                          <p className="text-[11px] font-extrabold text-blue-800 dark:text-blue-400 uppercase tracking-wider">
                            Email tài khoản
                          </p>
                          <p className="text-base sm:text-lg font-black text-slate-900 dark:text-white truncate">
                            {user?.email || 'Chưa cập nhật'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Số điện thoại liên hệ */}
                    <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-amber-200/90 dark:border-slate-800 shadow-xs hover:border-amber-400 hover:shadow-sm transition-all group">
                      <div className="flex items-center gap-3.5">
                        <div className="w-11 h-11 rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 flex items-center justify-center shrink-0 border border-amber-200 dark:border-amber-800">
                          <Phone className="w-5 h-5" />
                        </div>
                        <div className="space-y-0.5 min-w-0">
                          <p className="text-[11px] font-extrabold text-amber-800 dark:text-amber-400 uppercase tracking-wider">
                            Số điện thoại liên hệ
                          </p>
                          <p className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                            {user?.phoneNumber ? (
                              user.phoneNumber
                            ) : (
                              <span className="inline-flex items-center text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-2.5 py-1 rounded-lg border border-amber-200 dark:border-amber-800">
                                Chưa liên kết số điện thoại
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Số lượng địa chỉ đã lưu */}
                    <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-purple-200/90 dark:border-slate-800 shadow-xs hover:border-purple-400 hover:shadow-sm transition-all group">
                      <div className="flex items-center gap-3.5">
                        <div className="w-11 h-11 rounded-2xl bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 flex items-center justify-center shrink-0 border border-purple-200 dark:border-purple-800">
                          <MapPin className="w-5 h-5" />
                        </div>
                        <div className="space-y-0.5 min-w-0">
                          <p className="text-[11px] font-extrabold text-purple-800 dark:text-purple-400 uppercase tracking-wider">
                            Số lượng địa chỉ đã lưu
                          </p>
                          <div className="flex items-center gap-2">
                            <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                              {addresses.length} địa chỉ
                            </span>
                            {addresses.some((a) => a.isDefault) && (
                              <Badge variant="success" size="sm">
                                Đã có mặc định
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 2. SỔ ĐỊA CHỈ NHẬN NÔNG SẢN THU HOẠCH */}
            <div className="space-y-4 pt-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 flex items-center justify-center">
                      <MapPin className="w-5 h-5" />
                    </span>
                    Sổ Địa Chỉ Nhận Nông Sản Thu Hoạch
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 font-medium">
                    Địa chỉ nhận rau củ quả thu hoạch từ các ô đất canh tác trực tuyến của bạn
                  </p>
                </div>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setIsAddressModalOpen(true)}
                  leftIcon={<Plus className="w-4 h-4" />}
                  className="shadow-md shadow-emerald-500/20 shrink-0 font-bold bg-emerald-600 hover:bg-emerald-500 text-white"
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
                      className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4"
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
                /* State B: Empty State Card - SÁNG SỦA, GỌN GÀNG, ĐẸP MẮT */
                <div className="bg-white dark:bg-slate-900 border-2 border-dashed border-emerald-200 dark:border-slate-800 p-8 sm:p-12 text-center rounded-3xl shadow-sm">
                  <div className="max-w-md mx-auto space-y-4">
                    <div className="w-18 h-18 mx-auto rounded-3xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-sm border border-emerald-200/80 dark:border-emerald-800/40 p-4">
                      <Package className="w-10 h-10" />
                    </div>
                    <div className="space-y-1.5">
                      <h3 className="text-lg font-black text-slate-900 dark:text-white">
                        Chưa có địa chỉ nhận rau nào
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                        Thêm địa chỉ giao hàng ngay để hệ thống tự động vận chuyển nông sản sạch về tận nhà bạn khi mùa vụ đến ngày thu hoạch!
                      </p>
                    </div>
                    <div className="pt-2">
                      <Button
                        variant="primary"
                        size="md"
                        onClick={() => setIsAddressModalOpen(true)}
                        leftIcon={<Plus className="w-4 h-4" />}
                        className="font-bold shadow-md shadow-emerald-500/25 bg-emerald-600 hover:bg-emerald-500 text-white"
                      >
                        Thêm Địa Chỉ Đầu Tiên
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                /* State C: Grid of Address Cards */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {addresses.map((address: UserAddress) => (
                    <Card
                      key={address.addressId}
                      className={`relative overflow-hidden transition-all duration-300 rounded-3xl shadow-sm hover:shadow-md ${
                        address.isDefault
                          ? 'border-2 border-emerald-500 bg-white dark:bg-slate-900 ring-2 ring-emerald-500/15'
                          : 'border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <CardContent className="p-5 sm:p-6 space-y-4">
                        {/* Header: Name and default badge */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-black text-base text-slate-900 dark:text-white flex items-center gap-1.5">
                                <User className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                {address.recipientName}
                              </span>
                              {address.isDefault && (
                                <Badge variant="success" size="sm" icon={<Star className="w-3 h-3 fill-emerald-500" />}>
                                  Mặc Định
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                              <Phone className="w-3.5 h-3.5 text-slate-400" />
                              {address.phoneNumber}
                            </p>
                          </div>

                          {/* Quick Delete */}
                          <button
                            onClick={() => handleDeleteAddress(address.addressId)}
                            disabled={isAddressSubmitting}
                            className="text-slate-400 hover:text-rose-500 p-1.5 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                            title="Xóa địa chỉ này"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Detailed Address String */}
                        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-1">
                          <p className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-start gap-2">
                            <MapPin className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                            <span>
                              {address.addressLine}, {address.ward}, {address.district}, {address.province}
                            </span>
                          </p>
                        </div>

                        {/* Actions: Set as default */}
                        <div className="flex items-center justify-between pt-1">
                          {!address.isDefault ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSetDefault(address.addressId)}
                              disabled={isAddressSubmitting}
                              leftIcon={<Star className="w-3.5 h-3.5 text-amber-500" />}
                              className="text-xs font-semibold"
                            >
                              Đặt Làm Mặc Định
                            </Button>
                          ) : (
                            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Địa chỉ giao nhận chính
                            </span>
                          )}
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

      {/* Address creation modal */}
      <AddressModal
        isOpen={isAddressModalOpen}
        onClose={() => setIsAddressModalOpen(false)}
        onSuccess={() => {
          setAddressFeedback({
            type: 'success',
            message: 'Đã thêm địa chỉ giao nhận mới thành công!',
          });
          setTimeout(() => setAddressFeedback(null), 3000);
        }}
      />
    </div>
  );
}
