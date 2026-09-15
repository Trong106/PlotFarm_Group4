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
  Bell,
  CheckCheck,
  Clock,
  Sparkles,
  Leaf,
  Truck,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useAuthStore } from '@/store/useAuthStore';
import api from '@/lib/axios';

interface NotificationItem {
  NotificationId: number;
  UserId: number;
  Title: string;
  Message: string;
  Type: string;
  RelatedId?: number;
  IsRead: boolean;
  CreatedAt: string;
}

export default function Header() {
  const pathname = usePathname();
  const { user, isAuthenticated, logout, initAuth } = useAuthStore();
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoadingNotifs, setIsLoadingNotifs] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

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

  // Click outside handlers
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Fetch unread count on login or mount
  useEffect(() => {
    if (!isAuthenticated) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) return;

    const fetchCount = async () => {
      try {
        const { data } = await api.get('/notifications/unread-count');
        if (data.success && data.data?.unreadCount !== undefined) {
          setUnreadCount(data.data.unreadCount);
        }
      } catch (err) {
        console.error('Failed to fetch unread notifications count:', err);
      }
    };

    fetchCount();
    const interval = setInterval(fetchCount, 30000); // 30s polling
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  // Fetch full notifications list when opening dropdown
  const handleToggleNotif = async () => {
    if (isNotifOpen) {
      setIsNotifOpen(false);
      return;
    }

    setIsNotifOpen(true);
    setIsDropdownOpen(false);

    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) return;

    try {
      setIsLoadingNotifs(true);
      const { data } = await api.get('/notifications');
      if (data.success && Array.isArray(data.data)) {
        setNotifications(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setIsLoadingNotifs(false);
    }
  };

  const handleMarkAsRead = async (id: number) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) return;

    try {
      await api.patch(`/notifications/${id}/read`);

      setNotifications((prev) =>
        prev.map((n) => (n.NotificationId === id ? { ...n, IsRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark notification read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) return;

    try {
      await api.patch('/notifications/read-all');

      setNotifications((prev) => prev.map((n) => ({ ...n, IsRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all read:', err);
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const handleLogout = () => {
    setIsDropdownOpen(false);
    setIsNotifOpen(false);
    logout('/login');
  };

  const isAdmin = user?.role === 'Admin' || user?.roleId === 1;
  const isStaff = user?.role === 'Staff' || user?.roleId === 2;
  const displayRole = isAdmin ? 'Quản Trị Viên' : isStaff ? 'Kỹ Thuật Viên' : 'Khách Hàng';

  const navLinks = isAdmin
    ? [
        { href: '/admin', label: 'Bảng Quản Trị' },
        { href: '/plots', label: 'Bản Đồ Nông Trại' },
        { href: '/profile', label: 'Hồ Sơ' },
      ]
    : isStaff
    ? [
        { href: '/staff', label: 'Trạm Kỹ Thuật Viên' },
        { href: '/plots', label: 'Bản Đồ Nông Trại' },
        { href: '/profile', label: 'Hồ Sơ' },
      ]
    : [
        { href: '/', label: 'Trang Chủ' },
        { href: '/plots', label: 'Bản Đồ Đất' },
        ...(isAuthenticated ? [{ href: '/my-farm', label: 'Nông Trại Của Tôi' }] : []),
        ...(isAuthenticated ? [{ href: '/profile', label: 'Hồ Sơ' }] : []),
      ];

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const formatTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMins < 1) return 'Vừa xong';
      if (diffMins < 60) return `${diffMins} phút trước`;
      if (diffHours < 24) return `${diffHours} giờ trước`;
      if (diffDays < 7) return `${diffDays} ngày trước`;
      return date.toLocaleDateString('vi-VN');
    } catch {
      return dateStr;
    }
  };

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'HARVEST':
        return <Leaf className="w-4 h-4 text-amber-500" />;
      case 'CARE':
        return <Sparkles className="w-4 h-4 text-emerald-500" />;
      case 'DELIVERY':
        return <Truck className="w-4 h-4 text-blue-500" />;
      default:
        return <CheckCircle2 className="w-4 h-4 text-purple-500" />;
    }
  };

// Role already defined above

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand / Logo */}
        <Link href={isAdmin ? '/admin' : isStaff ? '/staff' : '/'} className="flex items-center gap-2 group shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
            <Sprout className="w-5 h-5 text-white" />
          </div>
          <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-800 dark:from-emerald-400 dark:to-teal-300 bg-clip-text text-transparent">
            PlotFarm
          </span>
          
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3.5 py-1.5 rounded-full text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/60 dark:hover:bg-slate-800/60'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right Actions: Theme Toggle + Notification Bell + Auth */}
        <div className="flex items-center gap-2.5">
          {/* Theme Switcher Button */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Đổi giao diện sáng/tối"
          >
            {theme === 'light' ? (
              <Moon className="w-4 h-4 text-slate-600" />
            ) : (
              <Sun className="w-4 h-4 text-amber-400" />
            )}
          </button>

          {/* Notification Bell (Visible when Authenticated) */}
          {isAuthenticated && (
            <div className="relative" ref={notifRef}>
              <button
                onClick={handleToggleNotif}
                className={`relative p-2 rounded-xl transition-all ${
                  isNotifOpen
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 ring-2 ring-emerald-500/20'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                title="Thông báo"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-rose-500 text-[10px] font-black text-white shadow-sm ring-2 ring-white dark:ring-slate-900 animate-pulse">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Popover Dropdown */}
              {isNotifOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                  {/* Header */}
                  <div className="p-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/60 dark:bg-slate-950/40">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                        Thông Báo
                      </h4>
                      {unreadCount > 0 && (
                        <span className="px-1.5 py-0.5 text-[10px] font-extrabold rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
                          {unreadCount} mới
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllAsRead}
                        className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 flex items-center gap-1"
                      >
                        <CheckCheck className="w-3.5 h-3.5" />
                        Đã đọc tất cả
                      </button>
                    )}
                  </div>

                  {/* List */}
                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                    {isLoadingNotifs ? (
                      <div className="p-6 text-center text-xs text-slate-500">Đang tải thông báo...</div>
                    ) : notifications.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-500 dark:text-slate-400 space-y-1">
                        <Bell className="w-6 h-6 mx-auto text-slate-400 opacity-50 mb-2" />
                        <p className="font-semibold">Bạn không có thông báo nào</p>
                      </div>
                    ) : (
                      notifications.slice(0, 8).map((notif) => (
                        <div
                          key={notif.NotificationId}
                          onClick={() => !notif.IsRead && handleMarkAsRead(notif.NotificationId)}
                          className={`p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer flex gap-3 items-start ${
                            !notif.IsRead ? 'bg-emerald-50/40 dark:bg-emerald-950/20' : ''
                          }`}
                        >
                          <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0 mt-0.5">
                            {getNotifIcon(notif.Type)}
                          </div>
                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-center justify-between gap-1">
                              <p className={`text-xs truncate ${!notif.IsRead ? 'font-black text-slate-900 dark:text-white' : 'font-semibold text-slate-700 dark:text-slate-300'}`}>
                                {notif.Title}
                              </p>
                              {!notif.IsRead && (
                                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                              )}
                            </div>
                            <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                              {notif.Message}
                            </p>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-1 pt-0.5">
                              <Clock className="w-3 h-3" /> {formatTime(notif.CreatedAt)}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

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
                    {/* Hồ sơ cá nhân */}
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
                      <span>{isAdmin ? 'Hồ sơ cá nhân' : isStaff ? 'Hồ sơ kỹ thuật viên' : 'Hồ sơ của tôi'}</span>
                    </Link>

                    {/* Mùa vụ của tôi (Chỉ hiển thị cho Khách Hàng) */}
                    {!isAdmin && !isStaff && (
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
                        <span>Nông trại của tôi</span>
                      </Link>
                    )}

                    {/* Cổng Nhân Viên Kỹ Thuật (Hiển thị cho Staff hoặc Admin) */}
                    {(isStaff || isAdmin) && (
                      <Link
                        href="/staff"
                        onClick={() => setIsDropdownOpen(false)}
                        className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                          pathname === '/staff'
                            ? 'bg-teal-500/15 text-teal-600 dark:text-teal-400 border border-teal-500/30'
                            : 'text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/40 hover:bg-teal-100 dark:hover:bg-teal-900/60 border border-teal-300/40 dark:border-teal-700/40'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Sprout className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                          <span>Cổng Nhân Viên Kỹ Thuật</span>
                        </div>
                        <span className="px-1.5 py-0.5 text-[9px] font-black uppercase rounded bg-teal-600 text-white shadow-xs">
                          STAFF
                        </span>
                      </Link>
                    )}

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
