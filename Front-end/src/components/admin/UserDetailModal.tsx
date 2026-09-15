'use client';

import React from 'react';
import { Mail, Phone, Calendar, Shield, Lock, Unlock, Edit3, Trash2, User } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useAdminUserStore } from '@/store/useAdminUserStore';
import { toast } from '@/store/useToastStore';

export const UserDetailModal: React.FC = () => {
  const {
    selectedUser,
    isDetailModalOpen,
    setDetailModalOpen,
    setEditModalOpen,
    toggleLockUser,
    deleteUser,
  } = useAdminUserStore();

  if (!selectedUser) return null;

  const handleToggleLock = () => {
    toggleLockUser(selectedUser.userId);
    const newStatus = selectedUser.status === 'LOCKED' ? 'ACTIVE' : 'LOCKED';
    if (newStatus === 'LOCKED') {
      toast.warning(`Đã khóa tài khoản ${selectedUser.fullName}`, 'Khóa tài khoản');
    } else {
      toast.success(`Đã mở khóa tài khoản ${selectedUser.fullName}`, 'Mở khóa tài khoản');
    }
  };

  const handleDelete = () => {
    if (confirm(`Bạn có chắc chắn muốn xóa tài khoản "${selectedUser.fullName}" khỏi hệ thống?`)) {
      deleteUser(selectedUser.userId);
      toast.error(`Đã xóa tài khoản ${selectedUser.fullName}`, 'Xóa tài khoản');
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'Admin':
        return <Badge variant="danger" icon={<Shield className="w-3 h-3" />} className="font-bold">Quản trị viên (Admin)</Badge>;
      case 'Staff':
        return <Badge variant="info" icon={<User className="w-3 h-3" />} className="font-bold">Nhân viên (Staff)</Badge>;
      default:
        return <Badge variant="neutral" icon={<User className="w-3 h-3" />} className="font-medium">Khách hàng (Customer)</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge variant="success" dot className="font-semibold">Đang hoạt động</Badge>;
      case 'LOCKED':
        return <Badge variant="danger" dot className="font-semibold">Tài khoản bị khóa</Badge>;
      case 'PENDING':
        return <Badge variant="warning" dot className="font-semibold">Chờ duyệt</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  const formattedDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <Modal
      isOpen={isDetailModalOpen}
      onClose={() => setDetailModalOpen(false)}
      title="Chi Tiết Tài Khoản Người Dùng"
      maxWidth="lg"
      footer={
        <div className="flex flex-wrap items-center justify-between w-full gap-2">
          <Button
            variant="danger"
            size="sm"
            onClick={handleDelete}
            leftIcon={<Trash2 className="w-4 h-4" />}
            className="text-xs"
          >
            Xóa Tài Khoản
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant={selectedUser.status === 'LOCKED' ? 'primary' : 'outline'}
              size="sm"
              onClick={handleToggleLock}
              leftIcon={selectedUser.status === 'LOCKED' ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
              className="text-xs font-semibold"
            >
              {selectedUser.status === 'LOCKED' ? 'Mở Khóa' : 'Khóa Tài Khoản'}
            </Button>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setDetailModalOpen(false);
                setEditModalOpen(true);
              }}
              leftIcon={<Edit3 className="w-4 h-4" />}
              className="text-xs font-semibold"
            >
              Cập Nhật Phân Quyền
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-6 text-slate-800 dark:text-slate-200">
        {/* User Card Header */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 p-4 rounded-3xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
          <img
            src={selectedUser.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
            alt={selectedUser.fullName}
            className="w-20 h-20 rounded-2xl object-cover border-2 border-slate-200 dark:border-slate-700 shadow-md"
          />
          <div className="space-y-1.5 text-center sm:text-left flex-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">{selectedUser.fullName}</h3>
              <span className="text-xs font-mono text-slate-500 dark:text-slate-400 bg-slate-200/70 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-300/60 dark:border-slate-700">
                ID: #{selectedUser.userId}
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
              {getRoleBadge(selectedUser.role)}
              {getStatusBadge(selectedUser.status)}
            </div>
          </div>
        </div>

        {/* Detailed Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-1">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-semibold">
              <Mail className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Địa chỉ Email:</span>
            </div>
            <p className="font-bold text-slate-900 dark:text-slate-100 text-sm break-all">{selectedUser.email}</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-1">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-semibold">
              <Phone className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Số điện thoại:</span>
            </div>
            <p className="font-bold text-slate-900 dark:text-slate-100 text-sm">
              {selectedUser.phoneNumber || 'Chưa cập nhật'}
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-1">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-semibold">
              <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Ngày tham gia hệ thống:</span>
            </div>
            <p className="font-bold text-slate-900 dark:text-slate-100 text-sm">
              {formattedDate(selectedUser.createdAt)}
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-1">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-semibold">
              <Shield className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Cập nhật gần nhất:</span>
            </div>
            <p className="font-bold text-slate-900 dark:text-slate-100 text-sm">
              {selectedUser.updatedAt ? formattedDate(selectedUser.updatedAt) : 'Chưa có chỉnh sửa'}
            </p>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default UserDetailModal;
