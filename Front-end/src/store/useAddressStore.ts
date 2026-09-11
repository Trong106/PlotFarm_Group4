import { create } from 'zustand';
import api from '@/lib/axios';
import { toast } from '@/store/useToastStore';

export interface UserAddress {
  addressId: number;
  userId: number;
  recipientName: string;
  phoneNumber: string;
  addressLine: string;
  ward: string;
  district: string | null;
  province: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt?: string | null;
}

export interface AddressInput {
  recipientName: string;
  phoneNumber: string;
  addressLine: string;
  ward: string;
  district?: string | null;
  province: string;
  isDefault?: boolean;
}

interface AddressState {
  addresses: UserAddress[];
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  fetchAddresses: () => Promise<void>;
  createAddress: (data: AddressInput) => Promise<boolean>;
  updateAddress: (addressId: number, data: Partial<AddressInput>) => Promise<boolean>;
  deleteAddress: (addressId: number) => Promise<boolean>;
  setDefaultAddress: (addressId: number) => Promise<boolean>;
}

export const useAddressStore = create<AddressState>((set, get) => ({
  addresses: [],
  isLoading: false,
  isSubmitting: false,
  error: null,

  fetchAddresses: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.get('/users/me/addresses');
      const data = res.data.data || res.data || [];
      set({ addresses: Array.isArray(data) ? data : [], isLoading: false });
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Không thể tải sổ địa chỉ.';
      set({ error: msg, isLoading: false });
    }
  },

  createAddress: async (data: AddressInput) => {
    set({ isSubmitting: true, error: null });
    try {
      await api.post('/users/me/addresses', {
        recipientName: data.recipientName.trim(),
        phoneNumber: data.phoneNumber.trim(),
        addressLine: data.addressLine.trim(),
        ward: data.ward.trim(),
        district: data.district?.trim() || null,
        province: data.province.trim(),
        isDefault: Boolean(data.isDefault),
      });

      await get().fetchAddresses();
      set({ isSubmitting: false });
      toast.success('Đã thêm địa chỉ nhận rau thành công!', 'Sổ địa chỉ');
      return true;
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Thêm địa chỉ thất bại.';
      set({ isSubmitting: false, error: msg });
      toast.error(msg, 'Lỗi tạo địa chỉ');
      return false;
    }
  },

  updateAddress: async (addressId: number, data: Partial<AddressInput>) => {
    set({ isSubmitting: true, error: null });
    try {
      await api.patch(`/users/me/addresses/${addressId}`, data);
      await get().fetchAddresses();
      set({ isSubmitting: false });
      toast.success('Đã cập nhật địa chỉ thành công!', 'Sổ địa chỉ');
      return true;
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Cập nhật địa chỉ thất bại.';
      set({ isSubmitting: false, error: msg });
      toast.error(msg, 'Lỗi cập nhật');
      return false;
    }
  },

  deleteAddress: async (addressId: number) => {
    set({ isSubmitting: true, error: null });
    try {
      await api.delete(`/users/me/addresses/${addressId}`);
      await get().fetchAddresses();
      set({ isSubmitting: false });
      toast.success('Đã xóa địa chỉ thành công!', 'Sổ địa chỉ');
      return true;
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Không thể xóa địa chỉ.';
      set({ isSubmitting: false, error: msg });
      toast.error(msg, 'Lỗi xóa địa chỉ');
      return false;
    }
  },

  setDefaultAddress: async (addressId: number) => {
    set({ isSubmitting: true, error: null });
    try {
      await api.patch(`/users/me/addresses/${addressId}`, { isDefault: true });
      await get().fetchAddresses();
      set({ isSubmitting: false });
      toast.success('Đã đặt làm địa chỉ mặc định!', 'Sổ địa chỉ');
      return true;
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Không thể đặt mặc định.';
      set({ isSubmitting: false, error: msg });
      toast.error(msg, 'Lỗi thao tác');
      return false;
    }
  },
}));

export default useAddressStore;
