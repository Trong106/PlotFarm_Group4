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
  UserPlus,
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { Button } from '@/components/ui/Button';

export default function RegisterPage() {
  const router = useRouter();
  const { register, isLoading, error: serverError } = useAuthStore();

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    setClientError(null);
  };

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

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

    if (formData.phoneNumber.trim() && !/^\+?[0-9]{9,15}$/.test(formData.phoneNumber.trim())) {
      errors.phoneNumber = 'Số điện thoại gồm 9-15 chữ số';
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
      errors.confirmPassword = 'Mật khẩu xác nhận không trùng khớp';
    }

    if (!formData.agreeTerms) {
      errors.agreeTerms = 'Bạn cần đồng ý với Điều khoản dịch vụ';
    }

    return errors;
  }, [formData]);

  const isValid = Object.keys(validationErrors).length === 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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

    const payload = {
      fullName: formData.fullName.trim(),
      email: formData.email.trim().toLowerCase(),
      phoneNumber: formData.phoneNumber.trim() || undefined,
      password: formData.password,
    };

    const success = await register(payload);
    if (success) {
      setIsSuccess(true);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-between relative overflow-hidden font-sans">
      {/* Background Ambient Glows */}
      <div className="absolute top-[-15%] left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full bg-emerald-500/15 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[500px] h-[400px] rounded-full bg-green-500/10 blur-[130px] pointer-events-none" />

      {/* Top Header Navigation */}
      <header className="relative z-30 w-full max-w-5xl mx-auto px-6 py-6 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2.5 group cursor-pointer">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-green-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform duration-200">
            <Sprout className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-xl text-slate-900 dark:text-white tracking-tight">PlotFarm</span>
            <span className="text-[11px] ml-2 px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-300/40">
              Smart Farm
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
          <span>Đã có tài khoản?</span>
          <Link
            href="/login"
            className="font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 transition-colors underline underline-offset-4 cursor-pointer hover:opacity-90 active:scale-95"
          >
            Đăng nhập ngay
          </Link>
        </div>
      </header>

      {/* Centered Single Card Container */}
      <main className="flex-1 flex items-center justify-center px-4 py-8 sm:px-6 z-10">
        <div className="w-full max-w-xl">
          {/* Glassmorphic Card */}
          <div className="bg-white/85 dark:bg-slate-900/85 backdrop-blur-2xl border border-slate-200/80 dark:border-slate-800/80 rounded-3xl shadow-2xl shadow-emerald-950/5 dark:shadow-emerald-950/20 p-7 sm:p-9 space-y-6">

            {/* Header / Brand Icon */}
            <div className="text-center space-y-2">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-tr from-emerald-600 to-green-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/25">
                <UserPlus className="w-6 h-6" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                Tạo Tài Khoản Mới
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Điền thông tin bên dưới để bắt đầu trải nghiệm canh tác nông trại thông minh
              </p>
            </div>

            {/* Success State */}
            {isSuccess ? (
              <div className="p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/30 text-center space-y-4 animate-scale-in">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Đăng Ký Thành Công!</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 max-w-sm mx-auto">
                    Tài khoản của bạn đã được khởi tạo. Bạn có thể đăng nhập ngay để bắt đầu chọn ô đất.
                  </p>
                </div>
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5">
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => router.push('/login')}
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    Đến Trang Đăng Nhập
                  </Button>
                  <Button variant="outline" size="md" onClick={() => router.push('/')}>
                    Về Trang Chủ
                  </Button>
                </div>
              </div>
            ) : (
              /* Form */
              <>
                {/* Error Banner */}
                {(clientError || serverError) && (
                  <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-400 flex items-start gap-2.5 text-xs font-semibold animate-fade-in text-left">
                    <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Đăng ký chưa thành công</p>
                      <p className="mt-0.5 text-[11px] leading-relaxed font-normal">{clientError || serverError}</p>
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4 text-left">
                  {/* Full Name & Phone Number (2 cols) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {/* Full Name */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                        Họ và Tên <span className="text-red-500">*</span>
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
                        <p className="text-[11px] text-red-500 font-medium pl-1">{validationErrors.fullName}</p>
                      )}
                    </div>

                    {/* Phone Number */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                        Số Điện Thoại <span className="text-slate-400 lowercase font-normal">(tùy chọn)</span>
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
                        <p className="text-[11px] text-red-500 font-medium pl-1">{validationErrors.phoneNumber}</p>
                      )}
                    </div>
                  </div>

                  {/* Email */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Địa chỉ Email <span className="text-red-500">*</span>
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
                      <p className="text-[11px] text-red-500 font-medium pl-1">{validationErrors.email}</p>
                    )}
                  </div>

                  {/* Password & Confirm Password (2 cols) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {/* Password */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
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
                        <div className="pt-1 space-y-1">
                          <div className="flex gap-1 h-1.5 w-full">
                            <div className={`h-full flex-1 rounded-full transition-all duration-300 ${passwordStrength.score >= 1 ? passwordStrength.color : 'bg-slate-200 dark:bg-slate-700'}`} />
                            <div className={`h-full flex-1 rounded-full transition-all duration-300 ${passwordStrength.score >= 2 ? passwordStrength.color : 'bg-slate-200 dark:bg-slate-700'}`} />
                            <div className={`h-full flex-1 rounded-full transition-all duration-300 ${passwordStrength.score >= 3 ? passwordStrength.color : 'bg-slate-200 dark:bg-slate-700'}`} />
                          </div>
                          <div className="flex justify-between text-[10px] text-slate-500 dark:text-slate-400">
                            <span>Độ mạnh mật khẩu:</span>
                            <span className="font-semibold">{passwordStrength.label}</span>
                          </div>
                        </div>
                      )}

                      {touched.password && validationErrors.password && (
                        <p className="text-[11px] text-red-500 font-medium pl-1">{validationErrors.password}</p>
                      )}
                    </div>

                    {/* Confirm Password */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                        Xác nhận mật khẩu <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                          <ShieldCheck className="w-4 h-4" />
                        </div>
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          name="confirmPassword"
                          placeholder="Nhập lại mật khẩu..."
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
                        <p className="text-[11px] text-red-500 font-medium pl-1">{validationErrors.confirmPassword}</p>
                      )}
                    </div>
                  </div>

                  {/* Terms and Conditions */}
                  <div className="pt-1">
                    <label className="flex items-start gap-2.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        name="agreeTerms"
                        checked={formData.agreeTerms}
                        onChange={handleChange}
                        disabled={isLoading}
                        className="mt-0.5 w-4 h-4 rounded text-emerald-600 border-slate-300 dark:border-slate-700 focus:ring-emerald-500"
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
                      <p className="text-[11px] text-red-500 font-medium pt-1 pl-6">{validationErrors.agreeTerms}</p>
                    )}
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2">
                    <Button
                      type="submit"
                      variant="primary"
                      size="lg"
                      isLoading={isLoading}
                      className="w-full text-sm sm:text-base font-semibold py-3 shadow-lg shadow-emerald-600/25"
                      rightIcon={<ArrowRight className="w-4 h-4" />}
                    >
                      {isLoading ? 'Đang Khởi Tạo Tài Khoản...' : 'Hoàn Tất Đăng Ký'}
                    </Button>
                  </div>
                </form>

                {/* Footer switch link */}
                <p className="text-center text-xs text-slate-500 dark:text-slate-400 pt-1">
                  Đã có tài khoản PlotFarm?{' '}
                  <Link
                    href="/login"
                    className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                  >
                    Đăng nhập ngay
                  </Link>
                </p>
              </>
            )}
          </div>
        </div>
      </main>

      {/* Footer Trust Badges */}
      <footer className="relative z-30 py-4 text-center text-xs text-slate-400 dark:text-slate-600 flex items-center justify-center gap-4 flex-wrap">
        <span className="flex items-center gap-1">
          <Sprout className="w-3.5 h-3.5 text-emerald-500" /> 100% Nông sản hữu cơ
        </span>
        <span>•</span>
        <span className="flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Xác thực JWT / SSL bảo mật
        </span>
        <span>•</span>
        <span>© 2026 PlotFarm</span>
      </footer>
    </div>
  );
}
