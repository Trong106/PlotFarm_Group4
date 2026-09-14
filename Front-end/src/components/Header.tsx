'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Sprout,
  Sun,
  Moon,
  LogIn,
  UserPlus,
  LogOut,
  User,
  Trees,
  ChevronDown,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useAuthStore } from '@/store/useAuthStore';

export default function Header() {
  const pathname = usePathname();
  const { user, isAuthenticated, logout, initAuth } = useAuthStore();
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    initAuth();

    // Check system or saved preference
    const isDark =
      document.documentElement.classList.contains('dark') ||
      localStorage.getItem('theme') === 'dark' ||
      (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);

    if (isDark) {
      document.documentElement.classList.add('dark');
      setTheme('dark');
    } else {
      document.documentElement.classList.remove('dark');
      setTheme('light');
    }
  }, [initAuth]);

  // Click outside to close profile dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleTheme = () => {
    if (theme === 'light') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setTheme('dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setTheme('light');
    }
  };

  const handleLogout = () => {
    setIsDropdownOpen(false);
    logout();
  };

  const navLinks = [
    { href: '/', label: 'Trang Chủ' },
    { href: '/#features', label: 'Tính Năng' },
    { href: '/#pricing', label: 'Bảng Giá Gói Trồng' },
    { href: '/#about', label: 'Về PlotFarm' },
  ];

  // Helper to extract initials for avatar
  const getInitials = (name?: string) => {
    if (!name) return 'PF';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  // Role detection
  const resolvedRole = user?.role || (user?.roleId === 1 ? 'Admin' : user?.roleId === 2 ? 'Staff' : 'Customer');
  const isAdmin = Boolean(
    user && (
      resolvedRole.toLowerCase() === 'admin' ||
      user.roleId === 1 ||
      user.email === 'admin@plotfarm.vn'
    )
  );
  const displayRole = isAdmin ? 'ADMIN' : (resolvedRole || 'CUSTOMER');

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo & Brand */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform duration-300">
            <Sprout className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-black text-xl tracking-tight bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 dark:from-emerald-400 dark:via-teal-300 dark:to-emerald-500 bg-clip-text text-transparent">
              PlotFarm
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 -mt-1 font-medium hidden sm:block">
              Nông trại số thông minh
            </span>
          </div>
        </Link>

        {/* Center Navigation */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-100/60 dark:bg-slate-900/60 p-1 rounded-full border border-slate-200/60 dark:border-slate-800/60">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right Action Items */}
        <div className="flex items-center gap-3">
          {/* Active Status Badge */}
          <div className="hidden md:block">
            <Badge variant="success" dot size="sm">
              Realtime Active
            </Badge>
          </div>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            aria-label="Chuyển đổi giao diện sáng tối"
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all shadow-sm focus:outline-none"
            title="Chuyển chế độ sáng / tối"
          >
            {theme === 'light' ? (
              <Moon className="w-4 h-4 text-slate-700" />
            ) : (
              <Sun className="w-4 h-4 text-amber-400" />
            )}
          </button>

          {/* User Auth Dropdown Navigation */}
          {isAuthenticated && user ? (
            <div className="relative" ref={dropdownRef}>
              {/* User Trigger Button */}
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className={`flex items-center gap-2.5 p-1.5 pl-3 rounded-2xl border transition-all duration-200 focus:outline-none ${
                  isDropdownOpen
                    ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-bold leading-tight text-slate-900 dark:text-slate-100 max-w-[140px] truncate">
                    {user.fullName || user.email}
                  </p>
                  <span className={`text-[10px] font-extrabold uppercase tracking-wider ${
                    isAdmin ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
                  }`}>
                    {displayRole}
                  </span>
                </div>

                {/* User Avatar Circle */}
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-extrabold text-xs flex items-center justify-center shadow-sm shrink-0">
                  {getInitials(user.fullName)}
                </div>

                {/* Dropdown Chevron */}
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                    isDropdownOpen ? 'rotate-180 text-emerald-600 dark:text-emerald-400' : ''
                  }`}
                />
              </button>

              {/* Floating Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                  {/* Menu User Header */}
                  <div className="p-4 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/40">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-extrabold text-sm flex items-center justify-center shadow-md">
                        {getInitials(user.fullName)}
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                          {user.fullName || 'Người dùng'}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
                        <div className="mt-1">
                          <span className={`inline-block px-2 py-0.5 text-[9px] font-bold uppercase rounded-md border ${
                            isAdmin
                              ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30 font-black'
                              : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                          }`}>
                            {displayRole}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Navigation Links */}
                  <div className="p-1.5 space-y-0.5">
                    {/* Hồ sơ của tôi (My Profile) */}
                    <Link
                      href="/profile"
                      onClick={() => setIsDropdownOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                        pathname === '/profile' || pathname === '/my-profile'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70'
                      }`}
                    >
                      <User className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>Hồ sơ của tôi</span>
                    </Link>

                    {/* Mùa vụ của tôi (My Farm) */}
                    <Link
                      href="/my-farm"
                      onClick={() => setIsDropdownOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                        pathname === '/my-farm'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70'
                      }`}
                    >
                      <Trees className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                      <span>Mùa vụ của tôi</span>
                    </Link>

                    {/* Dashboard Admin (Chỉ hiển thị khi role là ADMIN) */}
                    {isAdmin && (
                      <Link
                        href="/admin"
                        onClick={() => setIsDropdownOpen(false)}
                        className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                          pathname === '/admin'
                            ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                            : 'text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-300/40 dark:border-rose-700/40'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <ShieldCheck className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                          <span>Quản trị hệ thống</span>
                        </div>
                        <span className="px-1.5 py-0.5 text-[9px] font-black uppercase rounded bg-rose-600 text-white shadow-xs">
                          ADMIN
                        </span>
                      </Link>
                    )}
                  </div>

                  {/* Divider & Logout Action */}
                  <div className="p-1.5 border-t border-slate-100 dark:border-slate-800/80">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Đăng xuất</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Unauthenticated Action Buttons */
            <div className="flex items-center gap-2">
              <Link href="/register">
                <Button variant="outline" size="sm" leftIcon={<UserPlus className="w-3.5 h-3.5" />}>
                  Đăng Ký
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="primary" size="sm" leftIcon={<LogIn className="w-3.5 h-3.5" />}>
                  Đăng Nhập
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
