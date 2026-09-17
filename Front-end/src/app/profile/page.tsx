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
  ShoppingCart,
  KeyRound,
  ExternalLink,
  Sprout,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { useAuthStore } from '@/store/useAuthStore';
import { useAddressStore, UserAddress } from '@/store/useAddressStore';
import Header from '@/components/Header';
import { AddressModal } from '@/components/profile/AddressModal';
import api from '@/lib/axios';

interface MyOrder {
  OrderId: number;
  OrderCode: string;
  PlotId: number;
  SeedId: number;
  CarePackageId: number;
  DurationMonths: number;
  TotalRentalDays: number;
  StartDate: string;
  EndDate: string;
  RentalFee: number;
  SeedFee: number;
  CareFee: number;
  TotalAmount: number;
  Status: string;
  CreatedAt: string;
  PlotCode: string;
  SizeM2: number;
  SeedName: string;
  SeedImageUrl?: string;
  PackageName: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: isAuthLoading, error: authError, initAuth, fetchProfile, updateProfile } = useAuthStore();
  const { addresses, isLoading: isAddressLoading, isSubmitting: isAddressSubmitting, fetchAddresses, setDefaultAddress, deleteAddress } = useAddressStore();

  const [activeTab, setActiveTab] = useState<'info' | 'orders' | 'security' | 'admin_portal' | 'staff_tasks'>('info');
  const isAdmin = user?.role === 'Admin' || user?.roleId === 1;
  const isStaff = user?.role === 'Staff' || user?.roleId === 2;

  // Profile editing state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileFeedback, setProfileFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Address modal state
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<UserAddress | null>(null);
  const [addressFeedback, setAddressFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Order History state
  const [orders, setOrders] = useState<MyOrder[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);

  // Change Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [passwordFeedback, setPasswordFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchProfile();
      fetchAddresses();
      fetchMyOrders();
    }
  }, [isAuthenticated, fetchProfile, fetchAddresses]);

  useEffect(() => {
    if (user) {
      setFullName(user.fullName || '');
      setPhoneNumber(user.phoneNumber || '');
    }
  }, [user]);

  const fetchMyOrders = async () => {
    const token = typeof window !== 'undefined' ? (localStorage.getItem('token') || localStorage.getItem('plotfarm_token')) : null;
    if (!token) return;

    try {
      setIsLoadingOrders(true);
      const { data } = await api.get('/orders/my');
      if (data.success && Array.isArray(data.data)) {
        setOrders(data.data);
      }
    } catch (err) {
      console.error('Failed to load my orders:', err);
    } finally {
      setIsLoadingOrders(false);
    }
  };

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
      const saved = await updateProfile({
        fullName: fullName.trim(),
        phoneNumber: phoneNumber.trim() ? phoneNumber.trim().replace(/[\s.-]/g, '') : undefined,
      });
      if (!saved) {
        setProfileFeedback({ type: 'error', message: useAuthStore.getState().error || 'Không thể lưu thông tin. Vui lòng thử lại.' });
        return;
      }
      setProfileFeedback({
        type: 'success',
        message: 'Cập nhật thông tin cá nhân thành công!',
      });
      setIsEditingProfile(false);
      setTimeout(() => setProfileFeedback(null), 3500);
    } catch (err: any) {
      setProfileFeedback({
        type: 'error',
        message: err.message || 'Không thể lưu thông tin. Vui lòng thử lại.',
      });
    } finally {
      setIsSavingProfile(false);
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

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordErrors({});
    setPasswordFeedback(null);

    const errors: Record<string, string> = {};
    if (!currentPassword) {
      errors.currentPassword = 'Vui lòng nhập mật khẩu hiện tại';
    }
    if (!newPassword) {
      errors.newPassword = 'Vui lòng nhập mật khẩu mới';
    } else if (newPassword.length < 6) {
      errors.newPassword = 'Mật khẩu mới phải có ít nhất 6 ký tự';
    }
    if (newPassword !== confirmPassword) {
      errors.confirmPassword = 'Mật khẩu xác nhận không trùng khớp';
    }

    if (Object.keys(errors).length > 0) {
      setPasswordErrors(errors);
      return;
    }

    const token = typeof window !== 'undefined' ? (localStorage.getItem('token') || localStorage.getItem('plotfarm_token')) : null;
    if (!token) return;

    try {
      setIsSavingPassword(true);
      const { data } = await api.post('/users/me/change-password', { currentPassword, newPassword });
      if (data.success) {
        setPasswordFeedback({
          type: 'success',
          message: 'Đổi mật khẩu thành công! Hãy ghi nhớ mật khẩu mới của bạn.',
        });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => setPasswordFeedback(null), 4000);
      } else {
        setPasswordFeedback({
          type: 'error',
          message: data.message || 'Đổi mật khẩu thất bại',
        });
      }
    } catch (err: any) {
      setPasswordFeedback({
        type: 'error',
        message: err.response?.data?.message || err.message || 'Lỗi hệ thống khi đổi mật khẩu',
      });
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleSetDefault = async (addressId: number) => {
    try {
      await setDefaultAddress(addressId);
      setAddressFeedback({
        type: 'success',
        message: 'Đã thiết lập địa chỉ mặc định!',
      });
      setTimeout(() => setAddressFeedback(null), 3000);
    } catch (err: any) {
      setAddressFeedback({
        type: 'error',
        message: err.message || 'Không thể cập nhật địa chỉ mặc định',
      });
    }
  };

  const handleDeleteAddress = async (addressId: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa địa chỉ này?')) return;
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
        message: err.message || 'Không thể xóa địa chỉ này',
      });
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  const getRoleBadgeVariant = (roleName?: string) => {
    switch (roleName) {
      case 'Admin':
        return 'danger';
      case 'Staff':
        return 'warning';
      default:
        return 'success';
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  if (isAuthLoading && !user) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600 dark:text-emerald-400" />
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
          Đang tải thông tin hồ sơ người dùng...
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <Header />
        <div className="max-w-md mx-auto mt-20 p-6 text-center">
          <Card className="p-8 shadow-xl rounded-3xl border border-slate-200 dark:border-slate-800">
            <Lock className="w-12 h-12 mx-auto text-emerald-600 mb-4" />
            <h2 className="text-xl font-black mb-2 text-slate-900 dark:text-white">
              Yêu Cầu Đăng Nhập
            </h2>
            <p className="text-xs text-slate-500 mb-6">
              Vui lòng đăng nhập để xem thông tin cá nhân và lịch sử đơn hàng của bạn.
            </p>
            <Link href="/login">
              <Button variant="primary" className="w-full">
                Đăng Nhập Ngay
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    );
  }

  const displayRole = isAdmin ? 'Admin' : isStaff ? 'Staff' : 'Khách Hàng';

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <Header />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
        {/* Top Back and Navigation Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 hover:text-emerald-600 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors shadow-xs"
              title="Về trang chủ"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                Tài Khoản & Hồ Sơ Cá Nhân
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Quản lý thông tin tài khoản, đơn hàng đã thuê và sổ địa chỉ nhận nông sản
              </p>
            </div>
          </div>

          <Link href="/my-farm">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Sprout className="w-4 h-4 text-emerald-600" />}
              className="bg-white dark:bg-slate-900 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50"
            >
              Đến Nông Trại Của Tôi
            </Button>
          </Link>
        </div>

        {/* Global Feedback Banner */}
        {authError && (
          <div role="alert" className="p-4 rounded-2xl bg-rose-50 text-rose-800 flex items-center justify-between gap-3">
            <span>{authError}</span>
            <Button variant="outline" size="sm" onClick={() => void fetchProfile()} disabled={isAuthLoading}>
              Thử lại
            </Button>
          </div>
        )}
        {profileFeedback && (
          <div
            className={`p-4 rounded-2xl text-xs font-semibold flex items-center gap-2.5 animate-in fade-in duration-200 ${
              profileFeedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                : 'bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
            }`}
          >
            {profileFeedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{profileFeedback.message}</span>
          </div>
        )}

        {/* Role-adaptive Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('info')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'info'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
            }`}
          >
            <User className="w-4 h-4" />
            <span>{isAdmin ? 'Hồ Sơ Quản Trị Viên' : isStaff ? 'Hồ Sơ Kỹ Thuật Viên' : 'Hồ Sơ & Sổ Địa Chỉ'}</span>
          </button>

          {/* Tab dành riêng cho Customer: Đơn hàng */}
          {!isAdmin && !isStaff && (
            <button
              onClick={() => setActiveTab('orders')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === 'orders'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
              }`}
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Lịch Sử Đơn Thuê ({orders.length})</span>
            </button>
          )}

          {/* Tab dành riêng cho Admin: Quyền hạn hệ thống */}
          {isAdmin && (
            <button
              onClick={() => setActiveTab('admin_portal')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === 'admin_portal'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Quyền Hạn Quản Trị Hệ Thống</span>
            </button>
          )}

          {/* Tab dành riêng cho Staff: Phân khu & Nhiệm vụ */}
          {isStaff && (
            <button
              onClick={() => setActiveTab('staff_tasks')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === 'staff_tasks'
                  ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-950/30'
              }`}
            >
              <Sprout className="w-4 h-4" />
              <span>Nhiệm Vụ Kỹ Thuật Hiện Trường</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab('security')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'security'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>Đổi Mật Khẩu</span>
          </button>
        </div>

        {/* ================= TAB 1: PROFILE INFO & ADDRESS BOOK ================= */}
        {activeTab === 'info' && (
          <div className="space-y-8">
            {/* User Profile Card */}
            <Card className="rounded-3xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-sm bg-white dark:bg-slate-900">
              <div className="p-6 sm:p-8 bg-gradient-to-br from-slate-50 via-emerald-50/20 to-teal-50/30 dark:from-slate-900 dark:via-slate-900/90 dark:to-slate-950 border-b border-slate-200/70 dark:border-slate-800">
                <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
                  <div className="flex flex-col sm:flex-row items-center sm:items-center gap-5 text-center sm:text-left">
                    <div className="relative">
                      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-black text-2xl sm:text-3xl flex items-center justify-center shadow-lg shadow-emerald-600/20">
                        {getInitials(user?.fullName)}
                      </div>
                      <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900 flex items-center justify-center">
                        <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                          {user?.fullName || 'Người Dùng PlotFarm'}
                        </h2>
                        <Badge variant={getRoleBadgeVariant(displayRole)} size="sm">
                          {displayRole}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-0.5">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-xs">
                          <Mail className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>{user?.email}</span>
                        </span>
                        {user?.phoneNumber && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-xs">
                            <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>{user.phoneNumber}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    {!isEditingProfile && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEditingProfile(true)}
                        leftIcon={<Edit3 className="w-4 h-4" />}
                        className="bg-white hover:bg-emerald-50 text-emerald-800 dark:bg-slate-800 dark:text-emerald-300 font-bold border-emerald-300"
                      >
                        Đổi Tên & SĐT
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Form editing profile */}
              {isEditingProfile && (
                <div className="p-6 sm:p-8 bg-white dark:bg-slate-900">
                  <form onSubmit={handleSaveProfile} className="space-y-6">
                    <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <Edit3 className="w-4 h-4 text-emerald-500" /> Cập Nhật Thông Tin Cá Nhân
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <Input
                        label="Họ và Tên *"
                        placeholder="Nhập họ và tên đầy đủ"
                        leftIcon={<User className="w-4 h-4" />}
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        error={profileErrors.fullName}
                        disabled={isSavingProfile}
                      />

                      <Input
                        label="Số Điện Thoại"
                        placeholder="Ví dụ: 0901234567"
                        leftIcon={<Phone className="w-4 h-4" />}
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        error={profileErrors.phoneNumber}
                        disabled={isSavingProfile}
                      />
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleCancelEditProfile}
                        disabled={isSavingProfile}
                      >
                        Hủy Bỏ
                      </Button>
                      <Button
                        type="submit"
                        variant="primary"
                        size="sm"
                        disabled={isSavingProfile}
                        isLoading={isSavingProfile}
                      >
                        Lưu Thay Đổi
                      </Button>
                    </div>
                  </form>
                </div>
              )}
            </Card>

            {/* Address Book Section (Chỉ hiển thị cho Khách Hàng) */}
            {!isAdmin && !isStaff && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-emerald-500" /> Sổ Địa Chỉ Giao Nông Sản
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Địa chỉ nhận rau sạch khi thu hoạch vụ mùa từ trang trại PlotFarm
                  </p>
                </div>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => { setEditingAddress(null); setIsAddressModalOpen(true); }}
                  leftIcon={<Plus className="w-4 h-4" />}
                  className="bg-emerald-600 text-white text-xs font-bold"
                >
                  Thêm Địa Chỉ Mới
                </Button>
              </div>

              {addressFeedback && (
                <div
                  className={`p-3.5 rounded-2xl text-xs font-semibold flex items-center gap-2 ${
                    addressFeedback.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{addressFeedback.message}</span>
                </div>
              )}

              {isAddressLoading ? (
                <div className="p-8 text-center text-xs text-slate-500">Đang tải địa chỉ...</div>
              ) : addresses.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 border-2 border-dashed border-emerald-200 dark:border-slate-800 p-8 text-center rounded-3xl space-y-3">
                  <Package className="w-10 h-10 mx-auto text-emerald-500" />
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">Chưa có địa chỉ nào</h4>
                  <p className="text-xs text-slate-500">Thêm địa chỉ giao nhận để nhận rau sạch tận nhà khi thu hoạch.</p>
                  <Button variant="primary" size="sm" onClick={() => setIsAddressModalOpen(true)}>
                    Thêm Ngay
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {addresses.map((addr) => (
                    <Card key={addr.addressId} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 space-y-3 shadow-sm">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-black text-sm text-slate-900 dark:text-white">{addr.recipientName}</span>
                            {addr.isDefault && (
                              <Badge variant="success" size="sm">Mặc Định</Badge>
                            )}
                          </div>
                          <span className="text-xs text-slate-500 font-mono">{addr.phoneNumber}</span>
                        </div>
                        <button
                          onClick={() => handleDeleteAddress(addr.addressId)}
                          className="text-slate-400 hover:text-rose-500 p-1 rounded-lg"
                          title="Xóa địa chỉ"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <p className="text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl">
                        {addr.addressLine}, {addr.ward}, {addr.district}, {addr.province}
                      </p>

                      {!addr.isDefault && (
                        <Button variant="outline" size="sm" onClick={() => handleSetDefault(addr.addressId)} className="text-xs">
                          Đặt làm mặc định
                        </Button>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </div>
            )}
          </div>
        )}

        {/* ================= TAB 2: ORDER HISTORY ================= */}
        {activeTab === 'orders' && (
          <div className="space-y-5">
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-emerald-500" /> Lịch Sử Đơn Thuê Đất & Gói Chăm Sóc
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Danh sách các hợp đồng thuê luống đất, giống rau và dịch vụ chăm sóc đã thanh toán
              </p>
            </div>

            {isLoadingOrders ? (
              <div className="p-12 text-center text-xs text-slate-500">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-emerald-500 mb-2" />
                Đang tải lịch sử đơn hàng...
              </div>
            ) : orders.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center space-y-4 shadow-sm">
                <ShoppingCart className="w-12 h-12 mx-auto text-slate-300" />
                <div>
                  <h4 className="font-black text-base text-slate-900 dark:text-white">Bạn chưa có đơn thuê nào</h4>
                  <p className="text-xs text-slate-500 mt-1">Hãy khám phá bản đồ ô đất và chọn giống cây để bắt đầu vụ rau đầu tiên!</p>
                </div>
                <Link href="/plots">
                  <Button variant="primary" size="sm" leftIcon={<Sprout className="w-4 h-4" />}>
                    Khám Phá Ô Đất Ngay
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <Card key={order.OrderId} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                    <div className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
                      <div>
                        <div className="flex items-center gap-2.5">
                          <span className="font-mono font-black text-sm text-slate-900 dark:text-white">
                            {order.OrderCode}
                          </span>
                          <Badge variant={order.Status === 'PAID' ? 'success' : 'warning'} size="sm">
                            {order.Status === 'PAID' ? 'Đã Thanh Toán' : order.Status}
                          </Badge>
                        </div>
                        <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-1">
                          <Clock className="w-3 h-3" /> Ngày đặt: {new Date(order.CreatedAt).toLocaleDateString('vi-VN')}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-[11px] text-slate-400 block">Tổng tiền thanh toán</span>
                        <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(order.TotalAmount)}
                        </span>
                      </div>
                    </div>

                    <div className="p-5 sm:p-6 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Ô Đất Thuê</span>
                        <p className="font-bold text-slate-900 dark:text-white text-sm">{order.PlotCode}</p>
                        <p className="text-slate-500">Diện tích: {order.SizeM2}m²</p>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Giống Cây & Gói</span>
                        <p className="font-bold text-slate-900 dark:text-white text-sm">{order.SeedName}</p>
                        <p className="text-slate-500">{order.PackageName}</p>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Thời Hạn Thuê</span>
                        <p className="font-bold text-slate-900 dark:text-white text-sm">{order.DurationMonths} Tháng ({order.TotalRentalDays} ngày)</p>
                        <Link href="/my-farm" className="inline-flex items-center gap-1 text-emerald-600 font-bold hover:underline pt-1">
                          Vào xem nông trại <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 3: CHANGE PASSWORD ================= */}
        {activeTab === 'security' && (
          <div className="max-w-xl mx-auto space-y-5">
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-emerald-500" /> Đổi Mật Khẩu Tài Khoản
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Cập nhật mật khẩu định kỳ để bảo vệ tài khoản và dữ liệu mùa vụ của bạn
              </p>
            </div>

            {passwordFeedback && (
              <div
                className={`p-4 rounded-2xl text-xs font-semibold flex items-center gap-2.5 ${
                  passwordFeedback.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                {passwordFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{passwordFeedback.message}</span>
              </div>
            )}

            <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm">
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block mb-1">
                    Mật khẩu hiện tại *
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Nhập mật khẩu hiện tại"
                    className="w-full px-4 py-2.5 text-xs rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  {passwordErrors.currentPassword && (
                    <p className="text-[11px] text-rose-500 mt-1">{passwordErrors.currentPassword}</p>
                  )}
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block mb-1">
                    Mật khẩu mới * (ít nhất 6 ký tự)
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Nhập mật khẩu mới"
                    className="w-full px-4 py-2.5 text-xs rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  {passwordErrors.newPassword && (
                    <p className="text-[11px] text-rose-500 mt-1">{passwordErrors.newPassword}</p>
                  )}
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block mb-1">
                    Xác nhận mật khẩu mới *
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Nhập lại mật khẩu mới"
                    className="w-full px-4 py-2.5 text-xs rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  {passwordErrors.confirmPassword && (
                    <p className="text-[11px] text-rose-500 mt-1">{passwordErrors.confirmPassword}</p>
                  )}
                </div>

                <div className="pt-2">
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    className="w-full font-bold bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                    disabled={isSavingPassword}
                    isLoading={isSavingPassword}
                  >
                    Xác Nhận Đổi Mật Khẩu
                  </Button>
                </div>
              </form>
            </Card>
          </div>
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
