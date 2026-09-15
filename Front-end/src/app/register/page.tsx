'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  User,
  Mail,
  Phone,
  Lock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Sprout,
  Eye,
  EyeOff,
  Sparkles,
  Camera,
  Activity,
  Truck,
  Leaf
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { Button } from '@/components/ui/Button';

export default function RegisterPage() {
  const router = useRouter();
  const { register, isLoading, error: serverError } = useAuthStore();

  // Form State
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [clientError, setClientError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // Field change handler
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    setClientError(null);
    useAuthStore.setState({ error: null });
  };

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  // Password Strength Calculation
  const passwordStrength = useMemo(() => {
    const p = formData.password;
    if (!p) return { score: 0, label: '', color: 'bg-slate-200 dark:bg-slate-700' };
    if (p.length < 8) return { score: 1, label: 'Yếu (Tối thiểu 8 ký tự)', color: 'bg-red-500' };

    let score = 1;
    if (/[A-Z]/.test(p)) score += 1;
    if (/[0-9]/.test(p)) score += 1;
    if (/[^A-Za-z0-9]/.test(p)) score += 1;

    if (score <= 2) return { score: 2, label: 'Trung bình', color: 'bg-amber-500' };
    return { score: 3, label: 'Mạnh & An toàn', color: 'bg-emerald-500' };
  }, [formData.password]);

  // Validation Logic
  const validationErrors = useMemo(() => {
    const errors: Record<string, string> = {};

    if (!formData.fullName.trim()) {
      errors.fullName = 'Họ và tên không được để trống';
    } else if (formData.fullName.trim().length > 100) {
      errors.fullName = 'Họ tên không được vượt quá 100 ký tự';
    }

    if (!formData.email.trim()) {
      errors.email = 'Email không được để trống';
    } else if (formData.email.trim().length > 150) {
      errors.email = 'Email không được vượt quá 150 ký tự';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errors.email = 'Định dạng email không hợp lệ (ví dụ: ten@domain.com)';
    }

    const cleanPhone = formData.phoneNumber.replace(/[\s.-]/g, '');
    if (cleanPhone && !/^\+?[0-9]{9,15}$/.test(cleanPhone)) {
      errors.phoneNumber = 'Số điện thoại phải gồm 9-15 chữ số, có thể bắt đầu bằng +';
    }

    if (!formData.password) {
      errors.password = 'Mật khẩu không được để trống';
    } else if (formData.password.length < 8) {
      errors.password = 'Mật khẩu phải có ít nhất 8 ký tự';
    } else if (!formData.password.trim()) {
      errors.password = 'Mật khẩu không được chỉ chứa khoảng trắng';
    } else if (new TextEncoder().encode(formData.password).length > 72) {
      errors.password = 'Mật khẩu không được vượt quá 72 byte UTF-8';
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Vui lòng xác nhận lại mật khẩu';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Mật khẩu xác nhận không khớp';
    }

    if (!formData.agreeTerms) {
      errors.agreeTerms = 'Bạn phải đồng ý với Điều khoản và Chính sách';
    }

    return errors;
  }, [formData]);

  const isValid = Object.keys(validationErrors).length === 0;

  // Handle Form Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Mark all touched
    setTouched({
      fullName: true,
      email: true,
      phoneNumber: true,
      password: true,
      confirmPassword: true,
      agreeTerms: true,
    });

    if (!isValid) {
      const firstErr = Object.values(validationErrors)[0];
      setClientError(firstErr);
      return;
    }

    const cleanPhone = formData.phoneNumber.replace(/[\s.-]/g, '');
    const payload = {
      fullName: formData.fullName.trim(),
      email: formData.email.trim().toLowerCase(),
      phoneNumber: cleanPhone || undefined,
      password: formData.password,
    };

    const success = await register(payload);
    if (success) {
      setIsSuccess(true);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col relative overflow-hidden font-sans">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-emerald-500/15 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-green-500/15 blur-[120px] pointer-events-none" />

      {/* Top Navigation Bar */}
      <header className="relative z-50 p-6 flex justify-between items-center max-w-7xl mx-auto w-full shrink-0">
        <Link href="/" className="flex items-center gap-3 group cursor-pointer">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-green-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform duration-200">
            <Sprout className="w-5 h-5" />
          </div>
          <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-emerald-600 to-green-500 bg-clip-text text-transparent">
            PlotFarm
          </span>
          <span className="hidden sm:inline-block px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            Smart Farm
          </span>
        </Link>

        <div className="text-sm text-slate-600 dark:text-slate-400">
          Đã có tài khoản?{' '}
          <Link href="/login" className="font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 hover:underline cursor-pointer transition-colors">
            Đăng nhập ngay
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 pb-16 relative z-10">
        <div className="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">

          {/* Left Column: Value Proposition & Platform Highlights */}
          <div className="hidden lg:flex lg:col-span-5 flex-col space-y-6 pr-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-semibold w-fit">
              <Sprout className="w-3.5 h-3.5" /> Nền Tảng Thuê Đất & Canh Tác Trực Tuyến
            </div>

            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
              Sở hữu mảnh vườn xanh riêng của bạn chỉ trong <span className="text-emerald-600 dark:text-emerald-400">vài phút</span>
            </h1>

            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Đăng ký tài khoản để khám phá bản đồ ô đất, theo dõi hành trình cây trồng qua Camera 24/7 và nhận nông sản hữu cơ tươi ngon ngay tại nhà.
            </p>

            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 backdrop-blur-sm shadow-sm">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <Camera className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">Live Camera Trực Tiếp</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Giám sát ô đất của bạn mọi lúc, mọi nơi với video trực tuyến 24/7.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 backdrop-blur-sm shadow-sm">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">Theo Dõi Nhiệt Độ & Độ Ẩm</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Nắm bắt nhiệt độ thời tiết và độ ẩm luống rau dễ dàng ngay trên ứng dụng.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 backdrop-blur-sm shadow-sm">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">Thu Hoạch Giao Tận Cửa</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Đóng gói chuẩn VietGAP và giao nông sản tươi sạch tận nhà bạn.</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-6 pt-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
              <span className="flex items-center gap-1.5"><Leaf className="w-4 h-4 text-emerald-500" /> 100% Nông sản hữu cơ</span>
              <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-emerald-500" /> Bảo mật dữ liệu tuyệt đối</span>
            </div>
          </div>

          {/* Right Column: Registration Card */}
          <div className="lg:col-span-7">
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-2xl relative">

              {isSuccess ? (
                /* Registration Success State */
                <div className="text-center space-y-6 py-6 animate-fade-in">
                  <div className="w-16 h-16 mx-auto rounded-3xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/10">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                      Đăng Ký Tài Khoản Thành Công!
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 max-w-sm mx-auto">
                      Chào mừng <span className="font-semibold text-emerald-600 dark:text-emerald-400">{formData.fullName}</span> gia nhập cộng đồng nông dân số PlotFarm.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-400 space-y-1">
                    <p>Email đăng nhập: <strong className="text-slate-800 dark:text-slate-200">{formData.email}</strong></p>
                    <p>Vai trò hệ thống: <strong className="text-emerald-600 dark:text-emerald-400">Khách Hàng (Customer)</strong></p>
                  </div>

                  <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
                    <Button
                      variant="outline"
                      size="md"
                      onClick={() => router.push('/')}
                    >
                      Về Trang Chủ
                    </Button>
                    <Button
                      variant="primary"
                      size="md"
                      rightIcon={<ArrowRight className="w-4 h-4" />}
                      onClick={() => router.push('/login')}
                    >
                      Đăng Nhập Ngay
                    </Button>
                  </div>
                </div>
              ) : (
                /* Registration Form State */
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                      Tạo Tài Khoản Mới
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                      Điền thông tin bên dưới để bắt đầu trải nghiệm canh tác nông trại thông minh.
                    </p>
                  </div>

                  {/* Server Error Alert Banner */}
                  {serverError && (
                    <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 flex items-start gap-3 text-red-700 dark:text-red-300 text-xs sm:text-sm animate-shake">
                      <AlertCircle className="w-5 h-5 shrink-0 text-red-500 mt-0.5" />
                      <div className="flex-1">
                        <span className="font-bold block">Lỗi Đăng Ký</span>
                        <span>{serverError}</span>
                      </div>
                    </div>
                  )}

                  {/* Client Validation Alert Banner */}
                  {clientError && (
                    <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 flex items-center gap-2.5 text-amber-800 dark:text-amber-300 text-xs animate-fade-in">
                      <AlertCircle className="w-4 h-4 shrink-0 text-amber-500" />
                      <span>{clientError}</span>
                    </div>
                  )}

                  {/* Register Form */}
                  <form onSubmit={handleSubmit} className="space-y-4" noValidate>

                    {/* Full Name */}
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                        Họ và tên <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                          <User className="w-4 h-4" />
                        </div>
                        <input
                          type="text"
                          name="fullName"
                          placeholder="Ví dụ: Nguyễn Văn An"
                          value={formData.fullName}
                          onChange={handleChange}
                          onBlur={() => handleBlur('fullName')}
                          disabled={isLoading}
                          className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm transition-all duration-200 outline-none
                            bg-white dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 placeholder:text-slate-400
                            ${
                              touched.fullName && validationErrors.fullName
                                ? 'border-red-500 focus:ring-2 focus:ring-red-500/20'
                                : 'border-slate-200 dark:border-slate-700 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10'
                            }`}
                        />
                      </div>
                      {touched.fullName && validationErrors.fullName && (
                        <p className="text-xs text-red-500 font-medium pl-1">{validationErrors.fullName}</p>
                      )}
                    </div>

                    {/* Email & Phone side by side on desktop */}
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-4">
                      {/* Email */}
                      <div className="sm:col-span-7 space-y-1">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                          Email <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                            <Mail className="w-4 h-4" />
                          </div>
                          <input
                            type="email"
                            name="email"
                            placeholder="ten@domain.com"
                            value={formData.email}
                            onChange={handleChange}
                            onBlur={() => handleBlur('email')}
                            disabled={isLoading}
                            className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm transition-all duration-200 outline-none
                              bg-white dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 placeholder:text-slate-400
                              ${
                                touched.email && validationErrors.email
                                  ? 'border-red-500 focus:ring-2 focus:ring-red-500/20'
                                  : 'border-slate-200 dark:border-slate-700 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10'
                              }`}
                          />
                        </div>
                        {touched.email && validationErrors.email && (
                          <p className="text-xs text-red-500 font-medium pl-1">{validationErrors.email}</p>
                        )}
                      </div>

                      {/* Phone Number */}
                      <div className="sm:col-span-5 space-y-1">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                          Số điện thoại <span className="text-slate-400 font-normal lowercase">(tùy chọn)</span>
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                            <Phone className="w-4 h-4" />
                          </div>
                          <input
                            type="tel"
                            name="phoneNumber"
                            placeholder="0912345678"
                            value={formData.phoneNumber}
                            onChange={handleChange}
                            onBlur={() => handleBlur('phoneNumber')}
                            disabled={isLoading}
                            className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm transition-all duration-200 outline-none
                              bg-white dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 placeholder:text-slate-400
                              ${
                                touched.phoneNumber && validationErrors.phoneNumber
                                  ? 'border-red-500 focus:ring-2 focus:ring-red-500/20'
                                  : 'border-slate-200 dark:border-slate-700 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10'
                              }`}
                          />
                        </div>
                        {touched.phoneNumber && validationErrors.phoneNumber && (
                          <p className="text-xs text-red-500 font-medium pl-1">{validationErrors.phoneNumber}</p>
                        )}
                      </div>
                    </div>

                    {/* Password */}
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                        Mật khẩu <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                          <Lock className="w-4 h-4" />
                        </div>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          name="password"
                          placeholder="Tối thiểu 8 ký tự..."
                          value={formData.password}
                          onChange={handleChange}
                          onBlur={() => handleBlur('password')}
                          disabled={isLoading}
                          className={`w-full pl-10 pr-11 py-2.5 rounded-xl border text-sm transition-all duration-200 outline-none
                            bg-white dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 placeholder:text-slate-400
                            ${
                              touched.password && validationErrors.password
                                ? 'border-red-500 focus:ring-2 focus:ring-red-500/20'
                                : 'border-slate-200 dark:border-slate-700 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10'
                            }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>

                      {/* Password Strength Indicator */}
                      {formData.password && (
                        <div className="pt-1.5 space-y-1">
                          <div className="flex gap-1.5 h-1.5 w-full">
                            <div className={`h-full flex-1 rounded-full transition-all duration-300 ${passwordStrength.score >= 1 ? passwordStrength.color : 'bg-slate-200 dark:bg-slate-700'}`} />
                            <div className={`h-full flex-1 rounded-full transition-all duration-300 ${passwordStrength.score >= 2 ? passwordStrength.color : 'bg-slate-200 dark:bg-slate-700'}`} />
                            <div className={`h-full flex-1 rounded-full transition-all duration-300 ${passwordStrength.score >= 3 ? passwordStrength.color : 'bg-slate-200 dark:bg-slate-700'}`} />
                          </div>
                          <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400">
                            <span>Độ mạnh mật khẩu:</span>
                            <span className="font-semibold">{passwordStrength.label}</span>
                          </div>
                        </div>
                      )}

                      {touched.password && validationErrors.password && (
                        <p className="text-xs text-red-500 font-medium pl-1">{validationErrors.password}</p>
                      )}
                    </div>

                    {/* Confirm Password */}
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                        Xác nhận mật khẩu <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                          <ShieldCheck className="w-4 h-4" />
                        </div>
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          name="confirmPassword"
                          placeholder="Nhập lại mật khẩu vừa nhập..."
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          onBlur={() => handleBlur('confirmPassword')}
                          disabled={isLoading}
                          className={`w-full pl-10 pr-11 py-2.5 rounded-xl border text-sm transition-all duration-200 outline-none
                            bg-white dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 placeholder:text-slate-400
                            ${
                              touched.confirmPassword && validationErrors.confirmPassword
                                ? 'border-red-500 focus:ring-2 focus:ring-red-500/20'
                                : 'border-slate-200 dark:border-slate-700 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10'
                            }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                        >
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {touched.confirmPassword && validationErrors.confirmPassword && (
                        <p className="text-xs text-red-500 font-medium pl-1">{validationErrors.confirmPassword}</p>
                      )}
                    </div>

                    {/* Terms and Conditions */}
                    <div className="pt-2">
                      <label className="flex items-start gap-2.5 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          name="agreeTerms"
                          checked={formData.agreeTerms}
                          onChange={handleChange}
                          disabled={isLoading}
                          className="mt-0.5 w-4 h-4 rounded text-emerald-600 border-slate-300 dark:border-slate-700 focus:ring-emerald-500 focus:ring-offset-0"
                        />
                        <span className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                          Tôi đồng ý với{' '}
                          <a href="#" className="text-emerald-600 dark:text-emerald-400 hover:underline font-semibold">
                            Điều khoản dịch vụ
                          </a>{' '}
                          và{' '}
                          <a href="#" className="text-emerald-600 dark:text-emerald-400 hover:underline font-semibold">
                            Chính sách bảo mật
                          </a>{' '}
                          của PlotFarm.
                        </span>
                      </label>
                      {touched.agreeTerms && validationErrors.agreeTerms && (
                        <p className="text-xs text-red-500 font-medium pt-1 pl-6">{validationErrors.agreeTerms}</p>
                      )}
                    </div>

                    {/* Submit Button */}
                    <div className="pt-2">
                      <Button
                        type="submit"
                        variant="primary"
                        size="lg"
                        isLoading={isLoading}
                        className="w-full text-base font-semibold py-3 shadow-emerald-600/30"
                        rightIcon={<ArrowRight className="w-4 h-4" />}
                      >
                        {isLoading ? 'Đang Khởi Tạo Tài Khoản...' : 'Hoàn Tất Đăng Ký'}
                      </Button>
                    </div>
                  </form>

                  {/* Quick Login link inside Card */}
                  <div className="text-center pt-2 pb-1 border-t border-slate-100 dark:border-slate-800">
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Đã có tài khoản?{' '}
                      <Link href="/login" className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer">
                        Đăng nhập ngay tại đây
                      </Link>
                    </p>
                  </div>

                  {/* Footer note */}
                  <p className="text-center text-xs text-slate-500 dark:text-slate-400 pt-2">
                    Bằng việc đăng ký, bạn sẽ được tự động cấp quyền tài khoản Khách hàng (Customer) trên hệ thống PlotFarm.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
