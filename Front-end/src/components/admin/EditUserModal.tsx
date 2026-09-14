'use client';

import React, { useState, useEffect } from 'react';
import { Shield, CheckCircle, AlertTriangle } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useAdminUserStore, UserRole, UserStatus } from '@/store/useAdminUserStore';
import { toast } from '@/store/useToastStore';

export const EditUserModal: React.FC = () => {
  const {
    selectedUser,
    isEditModalOpen,
    setEditModalOpen,
    updateUserRoleAndStatus,
  } = useAdminUserStore();

  const [role, setRole] = useState<UserRole>('Customer');
  const [status, setStatus] = useState<UserStatus>('ACTIVE');

  useEffect(() => {
    if (selectedUser) {
      setRole(selectedUser.role);
      setStatus(selectedUser.status);
    }
  }, [selectedUser]);

  if (!selectedUser) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserRoleAndStatus(selectedUser.userId, role, status);
    toast.success(`Đã cập nhật tài khoản ${selectedUser.fullName} thành công!`, 'Cập nhật phân quyền');
    setEditModalOpen(false);
  };

  return (
    <Modal
      isOpen={isEditModalOpen}
      onClose={() => setEditModalOpen(false)}
      title="Phân Quyền & Trạng Thái Tài Khoản"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-5 text-slate-800 dark:text-slate-200">
        <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800">
          <img
            src={selectedUser.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
            alt={selectedUser.fullName}
            className="w-12 h-12 rounded-xl object-cover border border-slate-300 dark:border-slate-700"
          />
          <div>
            <h4 className="font-bold text-slate-900 dark:text-white text-sm">{selectedUser.fullName}</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">{selectedUser.email}</p>
          </div>
        </div>

        {/* Select Role */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Chọn Vai Trò / Phân Quyền (Role):
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {[
              { id: 'Admin' as UserRole, label: 'Quản trị (Admin)', desc: 'Toàn quyền hệ thống', color: 'border-rose-500/50 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300' },
              { id: 'Staff' as UserRole, label: 'Nhân viên (Staff)', desc: 'Chăm sóc nông trại', color: 'border-sky-500/50 bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300' },
              { id: 'Customer' as UserRole, label: 'Khách hàng', desc: 'Thuê đất & mua sắm', color: 'border-emerald-500/50 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300' },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setRole(item.id)}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  role === item.id
                    ? `${item.color} ring-2 ring-emerald-500 shadow-xs font-bold`
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-800/80 text-slate-600 dark:text-slate-400'
                }`}
              >
                <div className="font-bold text-xs flex items-center justify-between">
                  <span>{item.label}</span>
                  {role === item.id && <CheckCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />}
                </div>
                <p className="text-[10px] opacity-80 mt-0.5">{item.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Select Status */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Trạng Thái Tài Khoản (Status):
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {[
              { id: 'ACTIVE' as UserStatus, label: 'Hoạt động', desc: 'Có thể đăng nhập', icon: CheckCircle, color: 'text-emerald-600 dark:text-emerald-400' },
              { id: 'LOCKED' as UserStatus, label: 'Khóa tài khoản', desc: 'Cấm truy cập', icon: AlertTriangle, color: 'text-rose-600 dark:text-rose-400' },
              { id: 'PENDING' as UserStatus, label: 'Chờ kích hoạt', desc: 'Xác minh thông tin', icon: Shield, color: 'text-amber-600 dark:text-amber-400' },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setStatus(item.id)}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  status === item.id
                    ? 'border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white ring-2 ring-emerald-500 shadow-xs font-bold'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-800/80 text-slate-600 dark:text-slate-400'
                }`}
              >
                <div className="font-bold text-xs flex items-center justify-between">
                  <span className={status === item.id ? item.color : ''}>{item.label}</span>
                  <item.icon className={`w-3.5 h-3.5 ${status === item.id ? item.color : 'opacity-40'}`} />
                </div>
                <p className="text-[10px] opacity-80 mt-0.5">{item.desc}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setEditModalOpen(false)}
            className="text-xs"
          >
            Hủy Bỏ
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            className="text-xs font-bold"
          >
            Lưu Thay Đổi
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default EditUserModal;
