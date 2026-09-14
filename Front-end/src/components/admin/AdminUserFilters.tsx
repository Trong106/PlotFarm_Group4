'use client';

import React from 'react';
import { Search, RefreshCw, UserPlus, Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAdminUserStore, UserRole, UserStatus } from '@/store/useAdminUserStore';

export const AdminUserFilters: React.FC = () => {
  const {
    searchQuery,
    roleFilter,
    statusFilter,
    setSearchQuery,
    setRoleFilter,
    setStatusFilter,
    resetFilters,
    fetchUsers,
    isLoading,
    setAddModalOpen,
  } = useAdminUserStore();

  const isFiltered = searchQuery !== '' || roleFilter !== 'ALL' || statusFilter !== 'ALL';

  return (
    <div className="bg-slate-800/80 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-slate-700/80 shadow-xl space-y-4">
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên, email, số điện thoại..."
            className="w-full pl-10 pr-10 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all shadow-inner"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filters Group */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Role Filter */}
          <div className="flex items-center gap-2 bg-slate-900/90 px-3 py-2 border border-slate-700 rounded-xl text-xs text-slate-300">
            <Filter className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="font-medium text-slate-400 hidden sm:inline">Chức vụ:</span>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as 'ALL' | UserRole)}
              className="bg-transparent text-slate-100 font-semibold focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-slate-800 text-slate-100">Tất cả vai trò</option>
              <option value="Admin" className="bg-slate-800 text-slate-100">Quản trị viên (Admin)</option>
              <option value="Staff" className="bg-slate-800 text-slate-100">Nhân viên (Staff)</option>
              <option value="Customer" className="bg-slate-800 text-slate-100">Khách hàng (Customer)</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2 bg-slate-900/90 px-3 py-2 border border-slate-700 rounded-xl text-xs text-slate-300">
            <span className="font-medium text-slate-400 hidden sm:inline">Trạng thái:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'ALL' | UserStatus)}
              className="bg-transparent text-slate-100 font-semibold focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-slate-800 text-slate-100">Tất cả trạng thái</option>
              <option value="ACTIVE" className="bg-slate-800 text-emerald-400">Hoạt động (ACTIVE)</option>
              <option value="LOCKED" className="bg-slate-800 text-rose-400">Bị khóa (LOCKED)</option>
              <option value="PENDING" className="bg-slate-800 text-amber-400">Chờ duyệt (PENDING)</option>
            </select>
          </div>

          {/* Reset Filters */}
          {isFiltered && (
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="text-xs text-slate-400 hover:text-rose-400 border border-slate-700"
            >
              Xóa bộ lọc
            </Button>
          )}

          {/* Refresh Button */}
          <Button
            variant="secondary"
            size="sm"
            onClick={fetchUsers}
            isLoading={isLoading}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
            className="text-xs"
          >
            Làm mới
          </Button>

          {/* Add User Button */}
          <Button
            variant="primary"
            size="sm"
            onClick={() => setAddModalOpen(true)}
            leftIcon={<UserPlus className="w-4 h-4" />}
            className="text-xs font-semibold shadow-lg"
          >
            Thêm Tài Khoản
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AdminUserFilters;
