'use client';

import React from 'react';
import {
  Eye,
  Edit3,
  Lock,
  Unlock,
  Shield,
  User,
  ChevronLeft,
  ChevronRight,
  Users,
  SearchX,
  Loader2,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useAdminUserStore, AdminUser } from '@/store/useAdminUserStore';
import { toast } from '@/store/useToastStore';

export const AdminUserTable: React.FC = () => {
  const {
    users,
    searchQuery,
    roleFilter,
    statusFilter,
    currentPage,
    pageSize,
    isLoading,
    setCurrentPage,
    setPageSize,
    setSelectedUser,
    setDetailModalOpen,
    setEditModalOpen,
    toggleLockUser,
  } = useAdminUserStore();

  // Filter Logic
  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      u.fullName.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.phoneNumber && u.phoneNumber.includes(q)) ||
      u.userId.toString().includes(q);

    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    const matchesStatus = statusFilter === 'ALL' || u.status === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  // Pagination Logic
  const totalItems = filteredUsers.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const validCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (validCurrentPage - 1) * pageSize;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + pageSize);

  const handleToggleLock = (user: AdminUser) => {
    toggleLockUser(user.userId);
    if (user.status === 'LOCKED') {
      toast.success(`Đã mở khóa tài khoản ${user.fullName}`, 'Mở khóa tài khoản');
    } else {
      toast.warning(`Đã khóa tài khoản ${user.fullName}`, 'Khóa tài khoản');
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'Admin':
        return (
          <Badge variant="danger" size="sm" icon={<Shield className="w-3 h-3" />}>
            Admin
          </Badge>
        );
      case 'Staff':
        return (
          <Badge variant="info" size="sm" icon={<User className="w-3 h-3" />}>
            Staff
          </Badge>
        );
      default:
        return (
          <Badge variant="neutral" size="sm">
            Customer
          </Badge>
        );
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <Badge variant="success" size="sm" dot>
            Hoạt động
          </Badge>
        );
      case 'LOCKED':
        return (
          <Badge variant="danger" size="sm" dot>
            Bị khóa
          </Badge>
        );
      case 'PENDING':
        return (
          <Badge variant="warning" size="sm" dot>
            Chờ duyệt
          </Badge>
        );
      default:
        return <Badge variant="neutral" size="sm">{status}</Badge>;
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="bg-slate-800/90 backdrop-blur-md rounded-2xl border border-slate-700/80 shadow-2xl overflow-hidden flex flex-col">
      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-slate-200 text-xs">
          {/* Table Header */}
          <thead className="bg-slate-900/90 text-slate-400 font-semibold border-b border-slate-700/80 uppercase tracking-wider text-[11px]">
            <tr>
              <th className="py-3.5 px-4 sm:px-6">Người Dùng</th>
              <th className="py-3.5 px-4">Thông Tin Liên Hệ</th>
              <th className="py-3.5 px-4">Vai Trò</th>
              <th className="py-3.5 px-4">Trạng Thái</th>
              <th className="py-3.5 px-4 hidden md:table-cell">Ngày Tạo</th>
              <th className="py-3.5 px-4 text-right pr-6">Hành Động</th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-slate-800/80">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="py-16 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
                    <p className="text-xs font-medium">Đang tải danh sách người dùng...</p>
                  </div>
                </td>
              </tr>
            ) : paginatedUsers.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-16 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-3 max-w-sm mx-auto">
                    <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-slate-500">
                      <SearchX className="w-8 h-8" />
                    </div>
                    <p className="font-bold text-slate-200 text-sm">Không tìm thấy người dùng phù hợp</p>
                    <p className="text-xs text-slate-400">
                      Thử thay đổi từ khóa tìm kiếm hoặc điều chỉnh bộ lọc chức vụ, trạng thái.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedUsers.map((user) => (
                <tr
                  key={user.userId}
                  className="hover:bg-slate-700/40 transition-colors group"
                >
                  {/* User Profile */}
                  <td className="py-3.5 px-4 sm:px-6">
                    <div className="flex items-center gap-3">
                      <img
                        src={user.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
                        alt={user.fullName}
                        className="w-9 h-9 rounded-xl object-cover border border-slate-700 shrink-0 shadow-sm"
                      />
                      <div className="space-y-0.5">
                        <p className="font-bold text-slate-100 group-hover:text-emerald-400 transition-colors">
                          {user.fullName}
                        </p>
                        <p className="text-[10px] text-slate-400 font-mono">ID: #{user.userId}</p>
                      </div>
                    </div>
                  </td>

                  {/* Contact Info */}
                  <td className="py-3.5 px-4">
                    <div className="space-y-0.5">
                      <p className="font-medium text-slate-200">{user.email}</p>
                      <p className="text-[11px] text-slate-400 font-mono">
                        {user.phoneNumber || 'Chưa có SĐT'}
                      </p>
                    </div>
                  </td>

                  {/* Role */}
                  <td className="py-3.5 px-4">{getRoleBadge(user.role)}</td>

                  {/* Status */}
                  <td className="py-3.5 px-4">{getStatusBadge(user.status)}</td>

                  {/* Created Date */}
                  <td className="py-3.5 px-4 hidden md:table-cell text-slate-400 font-mono text-[11px]">
                    {formatDate(user.createdAt)}
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-right pr-6">
                    <div className="flex items-center justify-end gap-1.5">
                      {/* View Detail */}
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setDetailModalOpen(true);
                        }}
                        title="Xem chi tiết"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-slate-700/80 transition-all border border-transparent hover:border-slate-600"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {/* Edit Role & Status */}
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setEditModalOpen(true);
                        }}
                        title="Đổi vai trò / trạng thái"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-sky-400 hover:bg-slate-700/80 transition-all border border-transparent hover:border-slate-600"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      {/* Toggle Lock */}
                      <button
                        onClick={() => handleToggleLock(user)}
                        title={user.status === 'LOCKED' ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}
                        className={`p-1.5 rounded-lg transition-all border border-transparent hover:border-slate-600 ${
                          user.status === 'LOCKED'
                            ? 'text-rose-400 hover:bg-rose-500/20'
                            : 'text-slate-400 hover:text-rose-400 hover:bg-slate-700/80'
                        }`}
                      >
                        {user.status === 'LOCKED' ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="px-4 sm:px-6 py-4 bg-slate-900/80 border-t border-slate-700/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
        {/* Count Info & Page Size */}
        <div className="flex flex-wrap items-center gap-4 text-slate-400">
          <div className="flex items-center gap-1.5">
            <Users className="w-4 h-4 text-emerald-400" />
            <span>
              Hiển thị <strong className="text-white">{totalItems > 0 ? startIndex + 1 : 0}</strong> -{' '}
              <strong className="text-white">{Math.min(startIndex + pageSize, totalItems)}</strong> trong số{' '}
              <strong className="text-white">{totalItems}</strong> tài khoản
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span>Hiển thị mỗi trang:</span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="bg-slate-800 border border-slate-700 rounded-lg text-slate-200 px-2 py-1 font-semibold focus:outline-none cursor-pointer"
            >
              <option value={6}>6</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>

        {/* Page Switcher */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            disabled={validCurrentPage <= 1}
            onClick={() => setCurrentPage(validCurrentPage - 1)}
            leftIcon={<ChevronLeft className="w-4 h-4" />}
            className="text-xs"
          >
            Trước
          </Button>

          <div className="px-3 py-1 bg-slate-800 rounded-lg border border-slate-700 text-slate-300 font-mono text-xs">
            Trang <strong className="text-emerald-400">{validCurrentPage}</strong> / {totalPages}
          </div>

          <Button
            variant="ghost"
            size="sm"
            disabled={validCurrentPage >= totalPages}
            onClick={() => setCurrentPage(validCurrentPage + 1)}
            rightIcon={<ChevronRight className="w-4 h-4" />}
            className="text-xs"
          >
            Sau
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AdminUserTable;
