'use client';

import React, { useState, useEffect } from 'react';
import { User, Phone, MapPin, Building, Home, CheckCircle2, Loader2, Edit3, PlusCircle } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAddressStore, AddressInput, UserAddress } from '@/store/useAddressStore';

interface AddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialData?: UserAddress | null;
}

export const AddressModal: React.FC<AddressModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialData,
}) => {
  const { createAddress, updateAddress, isSubmitting } = useAddressStore();
  const isEditMode = Boolean(initialData);

  const [formData, setFormData] = useState<AddressInput>({
    recipientName: '',
    phoneNumber: '',
    province: 'TP. Hồ Chí Minh',
    district: '',
    ward: '',
    addressLine: '',
    isDefault: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData && isOpen) {
      setFormData({
        recipientName: initialData.recipientName || '',
        phoneNumber: initialData.phoneNumber || '',
        province: initialData.province || 'TP. Hồ Chí Minh',
        district: initialData.district || '',
        ward: initialData.ward || '',
        addressLine: initialData.addressLine || '',
        isDefault: Boolean(initialData.isDefault),
      });
    } else if (!initialData && isOpen) {
      setFormData({
        recipientName: '',
        phoneNumber: '',
        province: 'TP. Hồ Chí Minh',
        district: '',
        ward: '',
        addressLine: '',
        isDefault: false,
      });
    }
    setErrors({});
  }, [initialData, isOpen]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.recipientName.trim()) {
      newErrors.recipientName = 'Vui lòng nhập họ và tên người nhận';
    } else if (formData.recipientName.trim().length > 100) {
      newErrors.recipientName = 'Họ tên không được vượt quá 100 ký tự';
    }

    const phoneClean = formData.phoneNumber.trim().replace(/[\s.-]/g, '');
    if (!phoneClean) {
      newErrors.phoneNumber = 'Vui lòng nhập số điện thoại người nhận';
    } else if (!/^(03|05|07|08|09)[0-9]{8}$/.test(phoneClean)) {
      newErrors.phoneNumber = 'Số điện thoại không hợp lệ (phải gồm 10 số, đầu số 03, 05, 07, 08, 09)';
    }

    if (!formData.addressLine.trim()) {
      newErrors.addressLine = 'Vui lòng nhập số nhà, tên đường chi tiết';
    } else if (formData.addressLine.trim().length > 255) {
      newErrors.addressLine = 'Địa chỉ chi tiết không được vượt quá 255 ký tự';
    }

    if (!formData.ward.trim()) {
      newErrors.ward = 'Vui lòng nhập phường/xã';
    }

    if (!formData.province.trim()) {
      newErrors.province = 'Vui lòng nhập tỉnh/thành phố';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    let ok = false;
    if (isEditMode && initialData) {
      ok = await updateAddress(initialData.addressId, formData);
    } else {
      ok = await createAddress(formData);
    }

    if (ok) {
      setErrors({});
      onClose();
      if (onSuccess) onSuccess();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? 'Chỉnh Sửa Địa Chỉ Nhận Nông Sản' : 'Thêm Địa Chỉ Nhận Nông Sản Mới'}
      maxWidth="lg"
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose} disabled={isSubmitting}>
            Hủy Bỏ
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSubmit}
            disabled={isSubmitting}
            leftIcon={
              isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isEditMode ? (
                <Edit3 className="w-4 h-4" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )
            }
          >
            {isSubmitting ? 'Đang Lưu...' : isEditMode ? 'Cập Nhật Địa Chỉ' : 'Lưu Địa Chỉ'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-left">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Địa chỉ này sẽ được dùng để giao rau củ tươi sạch thu hoạch từ ô đất canh tác của bạn về tận nhà.
        </p>

        {/* Recipient & Phone */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <Input
            label="Tên Người Nhận *"
            placeholder="Ví dụ: Nguyễn Văn An"
            leftIcon={<User className="w-4 h-4" />}
            value={formData.recipientName}
            onChange={(e) => setFormData({ ...formData, recipientName: e.target.value })}
            error={errors.recipientName}
            disabled={isSubmitting}
          />

          <Input
            label="Số Điện Thoại (10 số) *"
            placeholder="Ví dụ: 0901234567"
            leftIcon={<Phone className="w-4 h-4" />}
            value={formData.phoneNumber}
            onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
            error={errors.phoneNumber}
            disabled={isSubmitting}
          />
        </div>

        {/* Province & District */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <Input
            label="Tỉnh / Thành Phố *"
            placeholder="Ví dụ: TP. Hồ Chí Minh"
            leftIcon={<Building className="w-4 h-4" />}
            value={formData.province}
            onChange={(e) => setFormData({ ...formData, province: e.target.value })}
            error={errors.province}
            disabled={isSubmitting}
          />

          <Input
            label="Quận / Huyện"
            placeholder="Ví dụ: Quận 1, Bình Thạnh..."
            leftIcon={<Building className="w-4 h-4" />}
            value={formData.district || ''}
            onChange={(e) => setFormData({ ...formData, district: e.target.value })}
            error={errors.district}
            disabled={isSubmitting}
          />
        </div>

        {/* Ward & Detail Address */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <Input
            label="Phường / Xã *"
            placeholder="Ví dụ: Phường Bến Nghé"
            leftIcon={<MapPin className="w-4 h-4" />}
            value={formData.ward}
            onChange={(e) => setFormData({ ...formData, ward: e.target.value })}
            error={errors.ward}
            disabled={isSubmitting}
          />

          <Input
            label="Số Nhà, Tên Đường *"
            placeholder="Ví dụ: 123 Nguyễn Huệ"
            leftIcon={<Home className="w-4 h-4" />}
            value={formData.addressLine}
            onChange={(e) => setFormData({ ...formData, addressLine: e.target.value })}
            error={errors.addressLine}
            disabled={isSubmitting}
          />
        </div>

        {/* Is Default Checkbox */}
        <div className="pt-2">
          <label className="flex items-center gap-3 p-3 rounded-2xl bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 cursor-pointer hover:bg-emerald-500/10 transition-colors">
            <input
              type="checkbox"
              checked={formData.isDefault}
              onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
              className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-900"
              disabled={isSubmitting}
            />
            <div className="text-xs">
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                Đặt làm địa chỉ nhận rau mặc định
              </span>
              <p className="text-slate-500 dark:text-slate-400">
                Khi thu hoạch nông sản hoàn tất, hệ thống sẽ ưu tiên gửi về địa chỉ này.
              </p>
            </div>
          </label>
        </div>
      </form>
    </Modal>
  );
};

export default AddressModal;
