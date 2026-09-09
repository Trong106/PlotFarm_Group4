export interface Role {
  RoleId: number;
  RoleName: 'Admin' | 'Staff' | 'Customer';
  Description: string;
}

export interface User {
  UserId: number;
  RoleId: number;
  RoleName?: string;
  FullName: string;
  Email: string;
  PhoneNumber: string;
  AvatarUrl: string;
  Status: 'ACTIVE' | 'LOCKED' | 'PENDING';
  CreatedAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export const MOCK_ROLES: Role[] = [
  { RoleId: 1, RoleName: 'Admin', Description: 'Quản trị viên toàn hệ thống PlotFarm' },
  { RoleId: 2, RoleName: 'Staff', Description: 'Nhân viên quản lý nông trại và hỗ trợ kỹ thuật' },
  { RoleId: 3, RoleName: 'Customer', Description: 'Khách hàng thuê ô đất và mua nông sản' },
];

export const MOCK_USERS: User[] = [
  {
    UserId: 1,
    RoleId: 1,
    RoleName: 'Admin',
    FullName: 'Âu Lương Thành Trọng',
    Email: 'trong.admin@plotfarm.vn',
    PhoneNumber: '0901234567',
    AvatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    Status: 'ACTIVE',
    CreatedAt: '2026-01-10 08:30:00',
  },
  {
    UserId: 2,
    RoleId: 2,
    RoleName: 'Staff',
    FullName: 'Trần Mạnh Đức',
    Email: 'duc.staff@plotfarm.vn',
    PhoneNumber: '0912345678',
    AvatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    Status: 'ACTIVE',
    CreatedAt: '2026-01-15 09:15:00',
  },
  {
    UserId: 3,
    RoleId: 3,
    RoleName: 'Customer',
    FullName: 'Phan Minh Tuấn',
    Email: 'tuan.customer@gmail.com',
    PhoneNumber: '0987654321',
    AvatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    Status: 'ACTIVE',
    CreatedAt: '2026-02-01 14:20:00',
  },
  {
    UserId: 4,
    RoleId: 3,
    RoleName: 'Customer',
    FullName: 'Nguyễn Bảo Nghiệp',
    Email: 'nghiep.customer@gmail.com',
    PhoneNumber: '0977112233',
    AvatarUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80',
    Status: 'PENDING',
    CreatedAt: '2026-02-10 11:00:00',
  },
];
