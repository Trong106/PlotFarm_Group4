import { create } from 'zustand';
import api from '@/lib/axios';

export type UserRole = 'Admin' | 'Staff' | 'Customer';
export type UserStatus = 'ACTIVE' | 'LOCKED' | 'PENDING';

export interface AdminUser {
  userId: number;
  fullName: string;
  email: string;
  phoneNumber?: string;
  avatarUrl?: string;
  roleId: number;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  updatedAt?: string;
}

const INITIAL_MOCK_USERS: AdminUser[] = [
  {
    userId: 1,
    fullName: 'Âu Lương Thành Trọng',
    email: 'trong.leader@plotfarm.vn',
    phoneNumber: '0901234567',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    roleId: 1,
    role: 'Admin',
    status: 'ACTIVE',
    createdAt: '2026-01-10T08:00:00Z',
  },
  {
    userId: 2,
    fullName: 'Nguyễn Bùi Nghiệp',
    email: 'nghiep.dev@plotfarm.vn',
    phoneNumber: '0912345678',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    roleId: 2,
    role: 'Staff',
    status: 'ACTIVE',
    createdAt: '2026-01-12T09:30:00Z',
  },
  {
    userId: 3,
    fullName: 'Trần Minh Đức',
    email: 'duc.dev@plotfarm.vn',
    phoneNumber: '0923456789',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    roleId: 2,
    role: 'Staff',
    status: 'ACTIVE',
    createdAt: '2026-01-15T14:20:00Z',
  },
  {
    userId: 4,
    fullName: 'Phạm Minh Tuấn',
    email: 'tuan.dev@plotfarm.vn',
    phoneNumber: '0934567890',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    roleId: 2,
    role: 'Staff',
    status: 'ACTIVE',
    createdAt: '2026-01-18T11:15:00Z',
  },
  {
    userId: 5,
    fullName: 'Lê Hoàng Kim',
    email: 'kim.hoang@gmail.com',
    phoneNumber: '0988776655',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    roleId: 3,
    role: 'Customer',
    status: 'ACTIVE',
    createdAt: '2026-02-01T10:00:00Z',
  },
  {
    userId: 6,
    fullName: 'Phan Thanh Hải',
    email: 'hai.phan@yahoo.com',
    phoneNumber: '0977665544',
    avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
    roleId: 3,
    role: 'Customer',
    status: 'LOCKED',
    createdAt: '2026-02-05T16:45:00Z',
  },
  {
    userId: 7,
    fullName: 'Vũ Thị Minh Anh',
    email: 'minhanh.vu@gmail.com',
    phoneNumber: '0966554433',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    roleId: 3,
    role: 'Customer',
    status: 'PENDING',
    createdAt: '2026-02-10T08:12:00Z',
  },
  {
    userId: 8,
    fullName: 'Đỗ Văn Thành',
    email: 'thanh.do@hotmail.com',
    phoneNumber: '0955443322',
    avatarUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80',
    roleId: 3,
    role: 'Customer',
    status: 'ACTIVE',
    createdAt: '2026-02-14T15:30:00Z',
  },
  {
    userId: 9,
    fullName: 'Bùi Phương Thảo',
    email: 'thao.bui@gmail.com',
    phoneNumber: '0944332211',
    avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    roleId: 3,
    role: 'Customer',
    status: 'ACTIVE',
    createdAt: '2026-02-20T09:05:00Z',
  },
  {
    userId: 10,
    fullName: 'Hoàng Quốc Khánh',
    email: 'khanh.hoang@outlook.com',
    phoneNumber: '0933221100',
    avatarUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
    roleId: 3,
    role: 'Customer',
    status: 'LOCKED',
    createdAt: '2026-02-25T13:40:00Z',
  },
];

interface AdminUserStoreState {
  users: AdminUser[];
  searchQuery: string;
  roleFilter: 'ALL' | UserRole;
  statusFilter: 'ALL' | UserStatus;
  currentPage: number;
  pageSize: number;

  isLoading: boolean;

  // Selected User & Modal states
  selectedUser: AdminUser | null;
  isDetailModalOpen: boolean;
  isEditModalOpen: boolean;
  isAddModalOpen: boolean;

  // Actions
  setSearchQuery: (query: string) => void;
  setRoleFilter: (role: 'ALL' | UserRole) => void;
  setStatusFilter: (status: 'ALL' | UserStatus) => void;
  setCurrentPage: (page: number) => void;
  setPageSize: (size: number) => void;
  resetFilters: () => void;

  setSelectedUser: (user: AdminUser | null) => void;
  setDetailModalOpen: (open: boolean) => void;
  setEditModalOpen: (open: boolean) => void;
  setAddModalOpen: (open: boolean) => void;

  fetchUsers: () => Promise<void>;
  toggleLockUser: (userId: number) => void;
  updateUserRoleAndStatus: (userId: number, role: UserRole, status: UserStatus) => void;
  addUser: (userData: Omit<AdminUser, 'userId' | 'createdAt' | 'roleId'>) => void;
  deleteUser: (userId: number) => void;
}

export const useAdminUserStore = create<AdminUserStoreState>((set) => ({
  users: INITIAL_MOCK_USERS,
  searchQuery: '',
  roleFilter: 'ALL',
  statusFilter: 'ALL',
  currentPage: 1,
  pageSize: 6,
  isLoading: false,

  selectedUser: null,
  isDetailModalOpen: false,
  isEditModalOpen: false,
  isAddModalOpen: false,

  setSearchQuery: (searchQuery) => set({ searchQuery, currentPage: 1 }),
  setRoleFilter: (roleFilter) => set({ roleFilter, currentPage: 1 }),
  setStatusFilter: (statusFilter) => set({ statusFilter, currentPage: 1 }),
  setCurrentPage: (currentPage) => set({ currentPage }),
  setPageSize: (pageSize) => set({ pageSize, currentPage: 1 }),
  resetFilters: () => set({ searchQuery: '', roleFilter: 'ALL', statusFilter: 'ALL', currentPage: 1 }),

  setSelectedUser: (selectedUser) => set({ selectedUser }),
  setDetailModalOpen: (isDetailModalOpen) => set({ isDetailModalOpen }),
  setEditModalOpen: (isEditModalOpen) => set({ isEditModalOpen }),
  setAddModalOpen: (isAddModalOpen) => set({ isAddModalOpen }),

  fetchUsers: async () => {
    set({ isLoading: true });
    try {
      const res = await api.get('/users');
      const payload = res.data?.data || res.data;
      const dataList = Array.isArray(payload?.users) ? payload.users : (Array.isArray(payload) ? payload : null);
      if (Array.isArray(dataList) && dataList.length > 0) {
        set({ users: dataList, isLoading: false });
        return;
      }
    } catch {
      // Fallback gracefully to mock data if backend is offline or empty
    }
    setTimeout(() => {
      set({ isLoading: false });
    }, 300);
  },

  toggleLockUser: (userId) => {
    set((state) => ({
      users: state.users.map((u) => {
        if (u.userId === userId) {
          const newStatus: UserStatus = u.status === 'LOCKED' ? 'ACTIVE' : 'LOCKED';
          return { ...u, status: newStatus, updatedAt: new Date().toISOString() };
        }
        return u;
      }),
    }));
  },

  updateUserRoleAndStatus: (userId, role, status) => {
    const roleIdMap: Record<UserRole, number> = { Admin: 1, Staff: 2, Customer: 3 };
    set((state) => ({
      users: state.users.map((u) => {
        if (u.userId === userId) {
          return {
            ...u,
            role,
            roleId: roleIdMap[role],
            status,
            updatedAt: new Date().toISOString(),
          };
        }
        return u;
      }),
    }));
  },

  addUser: (userData) => {
    const roleIdMap: Record<UserRole, number> = { Admin: 1, Staff: 2, Customer: 3 };
    const newUser: AdminUser = {
      userId: Date.now(),
      fullName: userData.fullName,
      email: userData.email,
      phoneNumber: userData.phoneNumber,
      avatarUrl: userData.avatarUrl || `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80`,
      roleId: roleIdMap[userData.role],
      role: userData.role,
      status: userData.status,
      createdAt: new Date().toISOString(),
    };

    set((state) => ({
      users: [newUser, ...state.users],
      isAddModalOpen: false,
    }));
  },

  deleteUser: (userId) => {
    set((state) => ({
      users: state.users.filter((u) => u.userId !== userId),
      isDetailModalOpen: false,
      selectedUser: null,
    }));
  },
}));
