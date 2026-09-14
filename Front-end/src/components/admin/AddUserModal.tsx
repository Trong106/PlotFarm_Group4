'use client';

import React, { useState } from 'react';
import { User, Mail, Phone, Lock, Shield } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useAdminUserStore, UserRole, UserStatus } from '@/store/useAdminUserStore';
import { toast } from '@/store/useToastStore';

export const AddUserModal: React.FC = () => {
  const { isAddModalOpen, setAddModalOpen, addUser } = useAdminUserStore();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [role, setRole] = useState<UserRole>('Customer');
  const [status, setStatus] = useState<UserStatus>('ACTIVE');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) {
      toast.error('Vui lòng điền đầy đủ Họ tên và Email', 'Thiếu thông tin');
      return;
    }

    addUser({
      fullName: fullName.trim(),
      email: email.trim(),
      phoneNumber: phoneNumber.trim() || undefined,
      role,
      status,
    });

    toast.success(`Đã cấp tài khoản thành công cho ${fullName}!`, 'Thêm người dùng');

    // Reset form
    setFullName('');
    setEmail('');
    setPhoneNumber('');
    setPassword('');
    setRole('Customer');
    setStatus('ACTIVE');
  };

  return (
    <Modal
      isOpen={isAddModalOpen}
      onClose={() => setAddModalOpen(false)}
      title="Cấp Tài Khoản Người Dùng Mới"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-slate-800 dark:text-slate-200">
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Họ và Tên (*):</label>
          <div className="relative">
            <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="VD: Nguyễn Văn A"
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-2xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Địa chỉ Email (*):</label>
          <div className="relative">
            <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="VD: nguyenvana@gmail.com"
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-2xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Số Điện Thoại:</label>
            <div className="relative">
              <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="VD: 0912345678"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-2xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Mật Khẩu Ban Đầu:</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Tự động tạo nếu bỏ trống"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-2xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Gán Phân Quyền (Role):</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-2xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
            >
              <option value="Customer">Khách hàng (Customer)</option>
              <option value="Staff">Nhân viên nông trại (Staff)</option>
              <option value="Admin">Quản trị viên (Admin)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Trạng Thái Ban Đầu:</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as UserStatus)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-2xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
            >
              <option value="ACTIVE">Hoạt động ngay (ACTIVE)</option>
              <option value="PENDING">Chờ xác thực (PENDING)</option>
              <option value="LOCKED">Khóa tạm thời (LOCKED)</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setAddModalOpen(false)}
            className="text-xs"
          >
            Hủy Bỏ
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            leftIcon={<Shield className="w-3.5 h-3.5" />}
            className="text-xs font-bold"
          >
            Tạo Tài Khoản
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default AddUserModal;
