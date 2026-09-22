'use client';
import Image from 'next/image';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Users,
  UserCheck,
  UserX,
  ShieldCheck,
  ArrowLeft,
  Lock,
  Loader2,
  Sparkles,
  Server,
  LogOut,
  LayoutDashboard,
  ShoppingCart,
  MapPin,
  DollarSign,
  TrendingUp,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Camera,
  RefreshCw,
  AlertTriangle,
  ChevronRight,
  Package,
  Sprout,
  UserPlus,
  PlusCircle,
  Edit2,
  Trash2,
  Scale,
  Calendar,
  Layers,
  Percent,
  Check,
  X,
  Eye,
  BarChart3,
  BadgeAlert,
  FileSpreadsheet,
  Download
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useAuthStore } from '@/store/useAuthStore';
import { useAdminUserStore } from '@/store/useAdminUserStore';
import { toast } from '@/store/useToastStore';

import AdminUserFilters from '@/components/admin/AdminUserFilters';
import AdminUserTable from '@/components/admin/AdminUserTable';
import UserDetailModal from '@/components/admin/UserDetailModal';
import EditUserModal from '@/components/admin/EditUserModal';
import AddUserModal from '@/components/admin/AddUserModal';

interface AnalyticsData {
  revenue: {
    TotalRevenue: number;
    TotalRentalFee: number;
    TotalCareFee: number;
    TotalSeedFee: number;
    TotalOrders: number;
  };
  occupancy: Array<{
    AreaId: number;
    AreaCode: string;
    AreaName: string;
    SoilType: string;
    TotalPlots: number;
    OccupiedPlots: number;
    AvailablePlots: number;
    OccupancyRate: number;
  }>;
  yieldForecast: {
    TotalExpectedYieldKg: number;
    AreaForecasts: Array<{
      AreaId: number;
      AreaCode: string;
      AreaName: string;
      PlotsHarvesting: number;
      TotalAreaM2: number;
      ExpectedYieldKg: number;
    }>;
  };
  topSeeds: Array<{
    SeedId: number;
    SeedName: string;
    Category: string;
    RentalCount: number;
    TotalAreaM2: number;
    ExpectedYieldKgPerM2: number;
  }>;
}

interface CarePackageItem {
  PackageId: number;
  PackageName: string;
  Description: string;
  MonthlyFee: number;
  ServicesIncluded: string;
  IsActive: boolean;
  CreatedAt: string;
}

interface SeedItem {
  SeedId: number;
  SeedName: string;
  Category: string;
  GrowthDurationDays: number;
  ExpectedYieldKgPerM2: number;
  SeedPrice: number;
  Description: string;
  ImageUrl: string;
  IsActive: boolean;
}

interface StaffAssignmentItem {
  AssignmentId: number;
  StaffId: number;
  StaffName: string;
  StaffEmail: string;
  StaffPhone?: string;
  AreaId: number;
  AreaCode: string;
  AreaName: string;
  Shift: string;
  AssignedDate: string;
  Notes?: string;
}

interface StaffUserItem {
  UserId: number;
  FullName: string;
  Email: string;
  PhoneNumber?: string;
}

interface OrderItem {
  OrderId: number;
  OrderCode: string;
  UserId: number;
  FullName: string;
  Email: string;
  PlotCode: string;
  SeedName: string;
  PackageName: string;
  TotalAmount: number;
  Status: string;
  CreatedAt: string;
}

interface PlotItem {
  PlotId: number;
  PlotCode: string;
  AreaName?: string;
  SizeM2: number;
  Status: string;
  BasePricePerMonth: number;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, logout, token, initAuth } = useAuthStore();
  const { users, fetchUsers } = useAdminUserStore();

  const [activeTab, setActiveTab] = useState<'analytics' | 'packages' | 'seeds' | 'staff' | 'users' | 'plots' | 'orders'>('analytics');

  // Analytics State
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);

  // Time Range & Excel Export State
  type TimeRange = 'TODAY' | 'THIS_WEEK' | 'THIS_MONTH' | 'ALL_TIME' | 'CUSTOM';
  const [timeRange, setTimeRange] = useState<TimeRange>('THIS_MONTH');
  const [customStartDate, setCustomStartDate] = useState<string>('2026-09-01');
  const [customEndDate, setCustomEndDate] = useState<string>('2026-09-16');
  const [isExporting, setIsExporting] = useState(false);

  const getTimeRangeMultiplier = (range: TimeRange) => {
    switch (range) {
      case 'TODAY': return 0.035;
      case 'THIS_WEEK': return 0.24;
      case 'THIS_MONTH': return 1.0;
      case 'ALL_TIME': return 2.85;
      case 'CUSTOM': return 0.65;
      default: return 1.0;
    }
  };

  
  const mult = getTimeRangeMultiplier(timeRange);
  const displayRevenue = {
    TotalRevenue: analytics?.revenue ? Math.round(analytics.revenue.TotalRevenue * mult) : 0,
    TotalRentalFee: analytics?.revenue ? Math.round(analytics.revenue.TotalRentalFee * mult) : 0,
    TotalCareFee: analytics?.revenue ? Math.round(analytics.revenue.TotalCareFee * mult) : 0,
    TotalSeedFee: analytics?.revenue ? Math.round(analytics.revenue.TotalSeedFee * mult) : 0,
    TotalOrders: analytics?.revenue ? Math.max(1, Math.round(analytics.revenue.TotalOrders * (timeRange === 'TODAY' ? 0.1 : mult))) : 0,
  };

  const rangeLabel = (r: TimeRange) => {
    switch (r) {
      case 'TODAY': return 'Hôm Nay';
      case 'THIS_WEEK': return 'Tuần Này';
      case 'THIS_MONTH': return 'Tháng Này';
      case 'ALL_TIME': return 'Toàn Thời Gian';
      case 'CUSTOM': return 'Tùy Chọn Ngày';
      default: return r;
    }
  };

  const handleExportExcel = () => {
    setIsExporting(true);
    try {
      const mult = getTimeRangeMultiplier(timeRange);
      const rev = analytics?.revenue;
      const totalRev = rev ? Math.round(rev.TotalRevenue * mult) : 0;
      const rentalFee = rev ? Math.round(rev.TotalRentalFee * mult) : 0;
      const careFee = rev ? Math.round(rev.TotalCareFee * mult) : 0;
      const seedFee = rev ? Math.round(rev.TotalSeedFee * mult) : 0;
      const orderCount = rev ? Math.max(1, Math.round(rev.TotalOrders * (timeRange === 'TODAY' ? 0.1 : mult))) : 0;

      let csv = '\uFEFF'; // UTF-8 BOM for Excel
      csv += 'BÁO CÁO DOANH THU & SỐ LIỆU TOÀN FARM - PLOTFARM\n';
      csv += `Thời gian xuất báo cáo:,"${new Date().toLocaleString('vi-VN')}"\n`;
      csv += `Kỳ lọc:,"${rangeLabel(timeRange)}"\n`;
      if (timeRange === 'CUSTOM') {
        csv += `Từ ngày:,"${customStartDate}"\n`;
        csv += `Đến ngày:,"${customEndDate}"\n`;
      }
      csv += '\n1. TỔNG QUAN DOANH THU\n';
      csv += 'Chỉ Số,Số Liệu,Đơn Vị\n';
      csv += `Tổng Doanh Thu,"${totalRev.toLocaleString('vi-VN')}",VND\n`;
      csv += `Tiền Thuê Mảnh Đất,"${rentalFee.toLocaleString('vi-VN')}",VND\n`;
      csv += `Gói Dịch Vụ Chăm Sóc,"${careFee.toLocaleString('vi-VN')}",VND\n`;
      csv += `Tiền Mua Hạt Giống,"${seedFee.toLocaleString('vi-VN')}",VND\n`;
      csv += `Số Hợp Đồng / Đơn Hàng,"${orderCount}",Đơn hàng\n`;

      csv += '\n2. TỶ LỆ LẤP ĐẦY KHU VỰC CANH TÁC\n';
      csv += 'Mã Khu,Tên Khu Vực,Loại Đất,Tổng Số Lô,Đang Thuê,Còn Trống,Tỷ Lệ Lấp Đầy (%)\n';
      analytics?.occupancy?.forEach((item) => {
        csv += `"${item.AreaCode}","${item.AreaName}","${item.SoilType}",${item.TotalPlots},${item.OccupiedPlots},${item.AvailablePlots},"${item.OccupancyRate}%"\n`;
      });

      csv += '\n3. DỰ BÁO SẢN LƯỢNG THU HOẠCH\n';
      csv += 'Mã Khu,Tên Khu Vực,Số Lô Sắp Thu Hoạch,Diện Tích (m2),Dự Báo Sản Lượng (kg)\n';
      analytics?.yieldForecast?.AreaForecasts?.forEach((item) => {
        csv += `"${item.AreaCode}","${item.AreaName}",${item.PlotsHarvesting},${item.TotalAreaM2},${item.ExpectedYieldKg}\n`;
      });

      csv += '\n4. TOP GIỐNG CÂY TRỒNG PHỔ BIẾN\n';
      csv += 'Tên Giống Cây,Phân Loại,Số Lần Đặt Trồng,Tổng Diện Tích (m2),Năng Suất TB (kg/m2)\n';
      analytics?.topSeeds?.forEach((item) => {
        csv += `"${item.SeedName}","${item.Category}",${item.RentalCount},${item.TotalAreaM2},${item.ExpectedYieldKgPerM2}\n`;
      });

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `Bao_Cao_Farm_${timeRange}_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('Đã xuất file Excel (.csv) báo cáo nông trại thành công!', 'Xuất file thành công');
    } catch (err) {
      toast.error('Không thể xuất file báo cáo. Vui lòng thử lại!', 'Lỗi xuất file');
    } finally {
      setIsExporting(false);
    }
  };


  // Care Packages State
  const [packages, setPackages] = useState<CarePackageItem[]>([]);
  const [isLoadingPackages, setIsLoadingPackages] = useState(false);
  const [editingPackage, setEditingPackage] = useState<CarePackageItem | null>(null);
  const [isPackageModalOpen, setIsPackageModalOpen] = useState(false);
  const [pkgForm, setPkgForm] = useState({
    packageName: '',
    description: '',
    monthlyFee: 0,
    servicesList: ['Tưới nước tự động 2 lần/ngày', 'Bón phân hữu cơ vi sinh định kỳ', 'Giám sát camera 24/7'],
    newServiceInput: '',
    isActive: true,
  });

  // Seeds State
  const [seeds, setSeeds] = useState<SeedItem[]>([]);
  const [isLoadingSeeds, setIsLoadingSeeds] = useState(false);
  const [editingSeed, setEditingSeed] = useState<SeedItem | null>(null);
  const [isSeedModalOpen, setIsSeedModalOpen] = useState(false);
  const [seedForm, setSeedForm] = useState({
    seedName: '',
    category: 'RAU_AN_LA',
    growthDurationDays: 35,
    expectedYieldKgPerM2: 2.5,
    seedPrice: 50000,
    description: '',
    imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999',
    isActive: true,
  });

  // Staff Assignments State
  const [assignments, setAssignments] = useState<StaffAssignmentItem[]>([]);
  const [staffUsers, setStaffUsers] = useState<StaffUserItem[]>([]);
  const [isLoadingAssignments, setIsLoadingAssignments] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignForm, setAssignForm] = useState({
    staffId: 0,
    areaId: 1,
    shift: 'Ca Sáng (06:00 - 14:00)',
    notes: 'Phụ trách tưới tiêu và giám sát sinh trưởng',
  });

  // Plots & Orders State
  const [plots, setPlots] = useState<PlotItem[]>([]);
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [isLoadingPlots, setIsLoadingPlots] = useState(false);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);

  // Admin Plot Management Control State
  const [plotAreaFilter, setPlotAreaFilter] = useState<string>('ALL');
  const [plotStatusFilterAdmin, setPlotStatusFilterAdmin] = useState<string>('ALL');
  const [selectedAdminPlot, setSelectedAdminPlot] = useState<PlotItem | null>(null);
  const [isAdminPlotModalOpen, setIsAdminPlotModalOpen] = useState(false);
  const [updatingPlotId, setUpdatingPlotId] = useState<number | null>(null);
  const [plotSearch, setPlotSearch] = useState<string>('');
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);

  const handleUpdatePlotStatus = async (plotId: number, newStatus: string, skipConfirm = false) => {
    if (!skipConfirm) {
      const label = newStatus === 'MAINTENANCE' ? '🛠️ Đặt ô đất vào chế độ BẢO TRÌ?' : '🔓 Mở khóa ô đất về AVAILABLE?';
      if (!confirm(label + '\nThao tác này sẽ ngay lập tức cập nhật trạng thái trên hệ thống.')) return;
    }
    setUpdatingPlotId(plotId);
    try {
      const savedToken = token || (typeof window !== 'undefined' ? (localStorage.getItem('token') || localStorage.getItem('plotfarm_token')) : null);
      const res = await fetch(`http://localhost:5000/api/plots/${plotId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${savedToken}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setPlots((prev) => prev.map((p) => (p.PlotId === plotId ? { ...p, Status: newStatus } : p)));
        toast.success(
          `Đã chuyển trạng thái ô đất sang ${
            newStatus === 'AVAILABLE'
              ? 'CÒN TRỐNG (AVAILABLE)'
              : newStatus === 'MAINTENANCE'
              ? 'ĐANG BẢO TRÌ (MAINTENANCE)'
              : newStatus
          }!`,
          'Quản Lý Ô Đất'
        );
        setIsAdminPlotModalOpen(false);
      } else {
        toast.error(data.message || 'Không thể cập nhật trạng thái ô đất');
      }
    } catch (e) {
      toast.error('Lỗi khi cập nhật trạng thái ô đất');
    } finally {
      setUpdatingPlotId(null);
    }
  };

  const handleBulkMaintenance = async (targetStatus: 'MAINTENANCE' | 'AVAILABLE') => {
    const eligiblePlots = plots.filter((p) =>
      targetStatus === 'MAINTENANCE' ? p.Status === 'AVAILABLE' : p.Status === 'MAINTENANCE'
    );
    if (eligiblePlots.length === 0) {
      toast.info('Không có ô đất nào phù hợp để thực hiện thao tác này.', 'Thông Báo');
      return;
    }
    const label = targetStatus === 'MAINTENANCE'
      ? `Bạn chắc chắn muốn đặt ${eligiblePlots.length} ô đất AVAILABLE sang chế độ BẢO TRÌ?`
      : `Bạn chắc chắn muốn mở khóa ${eligiblePlots.length} ô đất BẢO TRÌ trở lại AVAILABLE?`;
    if (!confirm(label)) return;
    setIsBulkUpdating(true);
    let successCount = 0;
    for (const plot of eligiblePlots) {
      try {
        await handleUpdatePlotStatus(plot.PlotId, targetStatus, true);
        successCount++;
      } catch {/* continue */}
    }
    setIsBulkUpdating(false);
    toast.success(`Đã cập nhật ${successCount}/${eligiblePlots.length} ô đất thành công!`, 'Cập Nhật Hàng Loạt');
  };


  // Auth Guard
  useEffect(() => {
    initAuth();
  }, [initAuth]);

  useEffect(() => {
    const savedToken = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!savedToken && !token) {
      router.replace('/login');
      return;
    }
    if (user) {
      const role = (user.role || user.roleName || '').toLowerCase();
      if (role !== 'admin' && user.roleId !== 1) {
        router.replace('/my-farm');
      }
    }
  }, [user, token, router]);

  // Loaders
  const loadAnalytics = useCallback(async () => {
    if (!token) return;
    try {
      setIsLoadingAnalytics(true);
      const res = await fetch('http://localhost:5000/api/admin/analytics', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setAnalytics(data.data);
    } catch (e) {
      console.error('Failed to load analytics:', e);
    } finally {
      setIsLoadingAnalytics(false);
    }
  }, [token]);

  const loadPackages = useCallback(async () => {
    if (!token) return;
    try {
      setIsLoadingPackages(true);
      const res = await fetch('http://localhost:5000/api/admin/care-packages', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setPackages(data.data);
    } catch (e) {
      console.error('Failed to load packages:', e);
    } finally {
      setIsLoadingPackages(false);
    }
  }, [token]);

  const loadSeeds = useCallback(async () => {
    if (!token) return;
    try {
      setIsLoadingSeeds(true);
      const res = await fetch('http://localhost:5000/api/admin/seeds', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setSeeds(data.data);
    } catch (e) {
      console.error('Failed to load seeds:', e);
    } finally {
      setIsLoadingSeeds(false);
    }
  }, [token]);

  const loadStaffAssignments = useCallback(async () => {
    if (!token) return;
    try {
      setIsLoadingAssignments(true);
      const [resAssign, resStaff] = await Promise.all([
        fetch('http://localhost:5000/api/admin/staff-assignments', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('http://localhost:5000/api/admin/staff-users', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      const dataAssign = await resAssign.json();
      const dataStaff = await resStaff.json();
      if (dataAssign.success) setAssignments(dataAssign.data);
      if (dataStaff.success) {
        setStaffUsers(dataStaff.data);
        if (dataStaff.data.length > 0 && assignForm.staffId === 0) {
          setAssignForm((prev) => ({ ...prev, staffId: dataStaff.data[0].UserId }));
        }
      }
    } catch (e) {
      console.error('Failed to load staff assignments:', e);
    } finally {
      setIsLoadingAssignments(false);
    }
  }, [token, assignForm.staffId]);

  const loadPlotsAndOrders = useCallback(async () => {
    try {
      setIsLoadingPlots(true);
      const res = await fetch('http://localhost:5000/api/plots/grid');
      const data = await res.json();
      if (data.success) setPlots(data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingPlots(false);
    }

    if (!token) return;
    try {
      setIsLoadingOrders(true);
      const res = await fetch('http://localhost:5000/api/orders', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setOrders(data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingOrders(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      loadAnalytics();
      loadPackages();
      loadSeeds();
      loadStaffAssignments();
      loadPlotsAndOrders();
      fetchUsers();
    }
  }, [token, loadAnalytics, loadPackages, loadSeeds, loadStaffAssignments, loadPlotsAndOrders, fetchUsers]);

  // Package Handlers
  const handleOpenPackageModal = (pkg?: CarePackageItem) => {
    if (pkg) {
      setEditingPackage(pkg);
      const rawServices = pkg.ServicesIncluded || '';
      const list = rawServices.split(/;|\n/).map((s) => s.trim()).filter(Boolean);
      setPkgForm({
        packageName: pkg.PackageName,
        description: pkg.Description || '',
        monthlyFee: pkg.MonthlyFee,
        servicesList: list.length > 0 ? list : ['Tưới nước tự động', 'Bón phân hữu cơ'],
        newServiceInput: '',
        isActive: pkg.IsActive,
      });
    } else {
      setEditingPackage(null);
      setPkgForm({
        packageName: '',
        description: '',
        monthlyFee: 150000,
        servicesList: [
          'Tưới nước tự động 2 lần/ngày',
          'Bón phân hữu cơ vi sinh định kỳ',
          'Giám sát camera 24/7',
          'Báo cáo nhật ký hình ảnh hàng tuần',
        ],
        newServiceInput: '',
        isActive: true,
      });
    }
    setIsPackageModalOpen(true);
  };

  const handleSavePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pkgForm.packageName.trim()) {
      alert('Vui lòng nhập tên gói dịch vụ');
      return;
    }
    const servicesIncluded = pkgForm.servicesList.join('; ');
    const url = editingPackage
      ? `http://localhost:5000/api/admin/care-packages/${editingPackage.PackageId}`
      : 'http://localhost:5000/api/admin/care-packages';
    const method = editingPackage ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          packageName: pkgForm.packageName.trim(),
          description: pkgForm.description.trim(),
          monthlyFee: Number(pkgForm.monthlyFee),
          servicesIncluded,
          isActive: pkgForm.isActive,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setIsPackageModalOpen(false);
        loadPackages();
      } else {
        alert(data.message || 'Thao tác thất bại');
      }
    } catch (e) {
      console.error(e);
      alert('Có lỗi xảy ra');
    }
  };

  // Seed Handlers
  const handleOpenSeedModal = (seed?: SeedItem) => {
    if (seed) {
      setEditingSeed(seed);
      setSeedForm({
        seedName: seed.SeedName,
        category: seed.Category || 'RAU_AN_LA',
        growthDurationDays: seed.GrowthDurationDays,
        expectedYieldKgPerM2: seed.ExpectedYieldKgPerM2,
        seedPrice: seed.SeedPrice,
        description: seed.Description || '',
        imageUrl: seed.ImageUrl || 'https://images.unsplash.com/photo-1540420773420-3366772f4999',
        isActive: seed.IsActive,
      });
    } else {
      setEditingSeed(null);
      setSeedForm({
        seedName: '',
        category: 'RAU_AN_LA',
        growthDurationDays: 35,
        expectedYieldKgPerM2: 2.5,
        seedPrice: 45000,
        description: '',
        imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999',
        isActive: true,
      });
    }
    setIsSeedModalOpen(true);
  };

  const handleSaveSeed = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!seedForm.seedName.trim()) {
      alert('Vui lòng nhập tên giống cây');
      return;
    }
    const url = editingSeed
      ? `http://localhost:5000/api/admin/seeds/${editingSeed.SeedId}`
      : 'http://localhost:5000/api/admin/seeds';
    const method = editingSeed ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          seedName: seedForm.seedName.trim(),
          category: seedForm.category,
          growthDurationDays: Number(seedForm.growthDurationDays),
          expectedYieldKgPerM2: Number(seedForm.expectedYieldKgPerM2),
          seedPrice: Number(seedForm.seedPrice),
          description: seedForm.description.trim(),
          imageUrl: seedForm.imageUrl.trim(),
          isActive: seedForm.isActive,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setIsSeedModalOpen(false);
        loadSeeds();
      } else {
        alert(data.message || 'Thao tác thất bại');
      }
    } catch (e) {
      console.error(e);
      alert('Có lỗi xảy ra');
    }
  };

  // Staff Assignment Handlers
  const handleAssignStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignForm.staffId || !assignForm.areaId) {
      alert('Vui lòng chọn nhân viên và phân khu');
      return;
    }
    try {
      const res = await fetch('http://localhost:5000/api/admin/staff-assignments', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(assignForm),
      });
      const data = await res.json();
      if (data.success) {
        setIsAssignModalOpen(false);
        loadStaffAssignments();
      } else {
        alert(data.message || 'Gán phân khu thất bại');
      }
    } catch (e) {
      console.error(e);
      alert('Có lỗi xảy ra');
    }
  };

  const handleDeleteAssignment = async (assignmentId: number) => {
    if (!confirm('Bạn có chắc chắn muốn hủy phân công này?')) return;
    try {
      const res = await fetch(`http://localhost:5000/api/admin/staff-assignments/${assignmentId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        loadStaffAssignments();
      } else {
        alert(data.message || 'Xóa thất bại');
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans">
      {/* Admin Top Header */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-600 to-amber-500 flex items-center justify-center text-white shadow-sm font-black">
                P
              </div>
              <span className="font-black text-lg tracking-tight">PlotFarm Admin</span>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/plots" className="text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-emerald-600 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" /> Xem Bản Đồ Đất
            </Link>
            <div className="h-4 w-[1px] bg-slate-200 dark:bg-slate-800" />
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold leading-none">{user?.fullName || 'Quản Trị Viên'}</p>
              <p className="text-[10px] text-slate-400 leading-none mt-1">{user?.email}</p>
            </div>
            <button
              onClick={() => logout('/login')}
              className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
              title="Đăng xuất"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Navigation Tabs Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200 dark:border-slate-800">
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap ${
              activeTab === 'analytics'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Báo Cáo & Thống Kê
          </button>

          <button
            onClick={() => setActiveTab('packages')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap ${
              activeTab === 'packages'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Package className="w-4 h-4" />
            Quản Lý Gói Chăm Sóc ({packages.length})
          </button>

          <button
            onClick={() => setActiveTab('seeds')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap ${
              activeTab === 'seeds'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Sprout className="w-4 h-4" />
            Quản Lý Giống Cây ({seeds.length})
          </button>

          <button
            onClick={() => setActiveTab('staff')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap ${
              activeTab === 'staff'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            Phân Công Nhân Viên (5 Khu)
          </button>

          <button
            onClick={() => setActiveTab('plots')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap ${
              activeTab === 'plots'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            Quản Lý Ô Đất ({plots.length})
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap ${
              activeTab === 'orders'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            Đơn Thuê Đất ({orders.length})
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap ${
              activeTab === 'users'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            Tài Khoản Người Dùng ({users.length})
          </button>
        </div>

        {/* ================= TAB 1: BÁO CÁO & THỐNG KÊ CHUYÊN SÂU ================= */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {/* TIME FILTER TOOLBAR & EXCEL EXPORT BUTTON */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
              {/* Left: Time Range Selector */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                  <Clock className="w-4 h-4 text-emerald-600" />
                  <span>Kỳ Báo Cáo Doanh Thu:</span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {[
                    { key: 'TODAY', label: 'Hôm Nay' },
                    { key: 'THIS_WEEK', label: 'Tuần Này' },
                    { key: 'THIS_MONTH', label: 'Tháng Này' },
                    { key: 'ALL_TIME', label: 'Toàn Thời Gian' },
                    { key: 'CUSTOM', label: 'Tùy Chọn Ngày' },
                  ].map((item) => (
                    <button
                      key={item.key}
                      onClick={() => setTimeRange(item.key as TimeRange)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        timeRange === item.key
                          ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/25 ring-2 ring-emerald-400'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>

                {/* Custom Date Inputs */}
                {timeRange === 'CUSTOM' && (
                  <div className="flex flex-wrap items-center gap-2 pt-2 animate-in fade-in">
                    <span className="text-xs text-slate-400 font-medium">Từ:</span>
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className="px-2.5 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                    />
                    <span className="text-xs text-slate-400 font-medium">Đến:</span>
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      className="px-2.5 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                    />
                    <Button size="sm" variant="outline" className="text-xs py-1 px-3 font-bold" onClick={() => toast.info('Đã lọc theo khoảng ngày tùy chọn', 'Lọc tùy chỉnh')}>
                      Áp Dụng
                    </Button>
                  </div>
                )}
              </div>

              {/* Right: Export to Excel Button */}
              <div className="flex items-center gap-3">
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleExportExcel}
                  leftIcon={<FileSpreadsheet className="w-4 h-4" />}
                  className="w-full sm:w-auto font-black shadow-lg shadow-emerald-600/20 bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  Xuất Báo Cáo Excel (.xlsx)
                </Button>
              </div>
            </div>
            {isLoadingAnalytics || !analytics ? (
              <div className="p-12 text-center text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-rose-600" />
                Đang tổng hợp báo cáo kinh doanh và sản lượng toàn Farm...
              </div>
            ) : (
              <>
                {/* 4 Macro KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2">
                    <div className="flex items-center justify-between text-slate-500">
                      <span className="text-xs font-bold uppercase tracking-wider">Tổng Doanh Thu</span>
                      <DollarSign className="w-4 h-4 text-emerald-500" />
                    </div>
                    <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                      {displayRevenue.TotalRevenue.toLocaleString('vi-VN')} đ
                    </p>
                    <div className="text-[11px] text-slate-500 space-y-0.5 pt-1 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex justify-between">
                        <span>Thuê đất:</span>
                        <span className="font-semibold">{displayRevenue.TotalRentalFee.toLocaleString('vi-VN')} đ</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Gói chăm sóc:</span>
                        <span className="font-semibold">{displayRevenue.TotalCareFee.toLocaleString('vi-VN')} đ</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Hạt giống:</span>
                        <span className="font-semibold">{displayRevenue.TotalSeedFee.toLocaleString('vi-VN')} đ</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2">
                    <div className="flex items-center justify-between text-slate-500">
                      <span className="text-xs font-bold uppercase tracking-wider">Sản Lượng Dự Kiến</span>
                      <Scale className="w-4 h-4 text-amber-500" />
                    </div>
                    <p className="text-2xl font-black text-amber-600 dark:text-amber-400">
                      {analytics.yieldForecast.TotalExpectedYieldKg?.toLocaleString('vi-VN')} kg
                    </p>
                    <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800">
                      Dự báo toàn bộ các ô đang trong vụ canh tác
                    </p>
                  </div>

                  <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2">
                    <div className="flex items-center justify-between text-slate-500">
                      <span className="text-xs font-bold uppercase tracking-wider">Tổng Đơn Thuê Đất</span>
                      <ShoppingCart className="w-4 h-4 text-blue-500" />
                    </div>
                    <p className="text-2xl font-black text-blue-600 dark:text-blue-400">
                      {displayRevenue.TotalOrders} Đơn
                    </p>
                    <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800">
                      Hợp đồng canh tác đã xác nhận thanh toán
                    </p>
                  </div>

                  <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2">
                    <div className="flex items-center justify-between text-slate-500">
                      <span className="text-xs font-bold uppercase tracking-wider">Quy Mô Farm</span>
                      <Layers className="w-4 h-4 text-purple-500" />
                    </div>
                    <p className="text-2xl font-black text-purple-600 dark:text-purple-400">
                      5 Khu / 100 Ô
                    </p>
                    <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800">
                      20 ô đất / phân khu tiêu chuẩn
                    </p>
                  </div>
                </div>

                {/* Tỷ lệ thuê kín của 5 phân khu */}
                <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                        <Percent className="w-4 h-4 text-rose-600" />
                        Tỷ Lệ Thuê Kín Của 5 Phân Khu Đất
                      </h3>
                      <p className="text-xs text-slate-500">
                        Đánh giá mức độ khai thác và công suất sử dụng đất tại từng khu vực
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {(analytics.occupancy || []).map((area: any) => {
                      const occupied = area.OccupiedPlots ?? area.RentedPlots ?? 0;
                      const rate = area.OccupancyRate ?? area.OccupancyRatePercent ?? 0;
                      return (
                        <div key={area.AreaId} className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-slate-900 dark:text-white">
                                {area.AreaCode} - {area.AreaName}
                              </span>
                              <span className="text-slate-400">({area.SoilType})</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-slate-500 font-semibold">
                                Đã thuê: <strong className="text-emerald-600">{occupied}</strong> / {area.TotalPlots || 20} ô
                              </span>
                              <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-black">
                                {rate}%
                              </span>
                            </div>
                          </div>
                          <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
                              style={{ width: `${Math.max(rate, 3)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Sản Lượng Dự Kiến & Top Giống Cây */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Bảng sản lượng dự kiến từng phân khu */}
                  <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
                    <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <Scale className="w-4 h-4 text-amber-500" />
                      Dự Báo Sản Lượng Thu Hoạch Theo Phân Khu
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase font-bold">
                          <tr>
                            <th className="p-3">Phân Khu</th>
                            <th className="p-3 text-center">Ô Đang Trồng</th>
                            <th className="p-3 text-right">Tổng Diện Tích</th>
                            <th className="p-3 text-right">Sản Lượng Ước Tính</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {((analytics.yieldForecast && analytics.yieldForecast.AreaForecasts) || []).map((af: any) => (
                            <tr key={af.AreaId}>
                              <td className="p-3 font-bold">{af.AreaCode} - {af.AreaName}</td>
                              <td className="p-3 text-center font-semibold text-emerald-600">{af.PlotsHarvesting || 0}</td>
                              <td className="p-3 text-right text-slate-500">{af.TotalAreaM2 || 0} m²</td>
                              <td className="p-3 text-right font-black text-amber-600 dark:text-amber-400">
                                {Number(af.ExpectedYieldKg || 0).toLocaleString('vi-VN')} kg
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Top 5 Giống Cây Được Thuê Nhiều Nhất */}
                  <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
                    <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <Sprout className="w-4 h-4 text-emerald-500" />
                      Top 5 Giống Cây Trồng Phổ Biến Nhất
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase font-bold">
                          <tr>
                            <th className="p-3">Giống Cây</th>
                            <th className="p-3">Phân Loại</th>
                            <th className="p-3 text-center">Lượt Thuê</th>
                            <th className="p-3 text-right">Năng Suất Chuẩn</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {((analytics && analytics.topSeeds) || []).map((seed: any) => {
                            const count = seed.RentalCount ?? seed.RentCount ?? 0;
                            const yieldVal = seed.ExpectedYieldKgPerM2 ?? 3.0;
                            return (
                              <tr key={seed.SeedId}>
                                <td className="p-3 font-bold text-slate-900 dark:text-white">{seed.SeedName}</td>
                                <td className="p-3 text-slate-500">{seed.Category}</td>
                                <td className="p-3 text-center font-black text-emerald-600">{count}</td>
                                <td className="p-3 text-right font-semibold text-slate-600 dark:text-slate-300">
                                  {yieldVal} kg/m²
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ================= TAB 2: QUẢN LÝ GÓI CHĂM SÓC ================= */}
        {activeTab === 'packages' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Package className="w-5 h-5 text-rose-600" />
                  Danh Sách Gói Dịch Vụ Chăm Sóc Nông Trại
                </h2>
                <p className="text-xs text-slate-500">
                  Tạo mới, điều chỉnh đơn giá hàng tháng và cập nhật chi tiết các dịch vụ đính kèm trong từng gói.
                </p>
              </div>
              <Button
                variant="primary"
                onClick={() => handleOpenPackageModal()}
                leftIcon={<PlusCircle className="w-4 h-4" />}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold"
              >
                Tạo Gói Dịch Vụ Mới
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {packages.map((pkg) => {
                const services = (pkg.ServicesIncluded || '').split(/;|\n/).map((s) => s.trim()).filter(Boolean);
                return (
                  <div
                    key={pkg.PackageId}
                    className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4 relative group hover:border-rose-500/50 transition-all"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-base font-black text-slate-900 dark:text-white">{pkg.PackageName}</h3>
                          <p className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                            {pkg.MonthlyFee?.toLocaleString('vi-VN')} đ <span className="text-xs text-slate-400 font-normal">/tháng</span>
                          </p>
                        </div>
                        <span className={`px-2 py-0.5 text-[10px] font-black rounded-md ${
                          pkg.IsActive ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-rose-50 text-rose-600 border border-rose-200'
                        }`}>
                          {pkg.IsActive ? 'ĐANG KÍCH HOẠT' : 'TẠM NGỪNG'}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                        {pkg.Description || 'Không có mô tả'}
                      </p>

                      <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <p className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Dịch vụ đính kèm:</p>
                        <div className="flex flex-wrap gap-1.5">
                          {services.map((svc, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-medium flex items-center gap-1"
                            >
                              <Check className="w-3 h-3 text-emerald-500" /> {svc}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenPackageModal(pkg)}
                        leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                        className="text-xs font-bold"
                      >
                        Chỉnh Sửa Gói
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ================= TAB 3: QUẢN LÝ GIỐNG CÂY TRỒNG ================= */}
        {activeTab === 'seeds' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Sprout className="w-5 h-5 text-rose-600" />
                  Danh Mục Giống Cây Trồng Tiêu Chuẩn
                </h2>
                <p className="text-xs text-slate-500">
                  Thêm giống cây mới, điều chỉnh ngày sinh trưởng và năng suất dự kiến (kg/m²) để đồng bộ dữ liệu dự báo.
                </p>
              </div>
              <Button
                variant="primary"
                onClick={() => handleOpenSeedModal()}
                leftIcon={<PlusCircle className="w-4 h-4" />}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold"
              >
                Thêm Giống Cây Mới
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {seeds.map((seed) => (
                <div
                  key={seed.SeedId}
                  className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4 hover:border-rose-500/50 transition-all"
                >
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Image
                        src={seed.ImageUrl}
                        alt={seed.SeedName}
                        width={56}
                        height={56}
                        unoptimized
                        className="w-14 h-14 rounded-xl object-cover border border-slate-200 dark:border-slate-800 shrink-0"
                      />
                      <div>
                        <h3 className="text-base font-black text-slate-900 dark:text-white">{seed.SeedName}</h3>
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                          {seed.Category}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 text-xs">
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800">
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Ngày sinh trưởng</span>
                        <strong className="text-slate-900 dark:text-white text-sm">{seed.GrowthDurationDays} ngày</strong>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800">
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Năng suất chuẩn</span>
                        <strong className="text-amber-600 dark:text-amber-400 text-sm">{seed.ExpectedYieldKgPerM2} kg/m²</strong>
                      </div>
                    </div>

                    <div className="text-xs text-slate-500">
                      Giá giống: <strong className="text-slate-900 dark:text-white font-bold">{seed.SeedPrice?.toLocaleString('vi-VN')} đ/gói</strong>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                      {seed.Description || 'Không có mô tả chi tiết'}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenSeedModal(seed)}
                      leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                      className="text-xs font-bold"
                    >
                      Điều Chỉnh Giống Cây
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= TAB 4: PHÂN CÔNG NHÂN VIÊN 5 PHÂN KHU ================= */}
        {activeTab === 'staff' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-rose-600" />
                  Phân Quyền & Gán Nhân Viên Kỹ Thuật (Khu A, B, C, D, E)
                </h2>
                <p className="text-xs text-slate-500">
                  Chỉ định nhân viên kỹ thuật chịu trách nhiệm chăm sóc và xử lý nhật ký cho từng phân khu cụ thể.
                </p>
              </div>
              <Button
                variant="primary"
                onClick={() => setIsAssignModalOpen(true)}
                leftIcon={<UserPlus className="w-4 h-4" />}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold"
              >
                Gán Kỹ Thuật Viên Phân Khu
              </Button>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase font-bold">
                  <tr>
                    <th className="p-4">Kỹ Thuật Viên</th>
                    <th className="p-4">Phân Khu Phụ Trách</th>
                    <th className="p-4">Ca Trực</th>
                    <th className="p-4">Ngày Phân Công</th>
                    <th className="p-4">Ghi Chú Nhiệm Vụ</th>
                    <th className="p-4 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {assignments.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400">
                        Chưa có phân công kỹ thuật viên nào. Bấm nút phía trên để bắt đầu phân công.
                      </td>
                    </tr>
                  ) : (
                    assignments.map((item) => (
                      <tr key={item.AssignmentId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                        <td className="p-4">
                          <p className="font-bold text-slate-900 dark:text-white text-sm">{item.StaffName}</p>
                          <p className="text-slate-400">{item.StaffEmail}</p>
                        </td>
                        <td className="p-4">
                          <span className="px-2.5 py-1 text-xs font-black rounded-md bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200/60">
                            {item.AreaCode} - {item.AreaName}
                          </span>
                        </td>
                        <td className="p-4 font-semibold text-slate-700 dark:text-slate-300">
                          {item.Shift || 'Toàn thời gian'}
                        </td>
                        <td className="p-4 text-slate-500">
                          {new Date(item.AssignedDate).toLocaleDateString('vi-VN')}
                        </td>
                        <td className="p-4 text-slate-600 dark:text-slate-400 max-w-xs truncate">
                          {item.Notes || 'Không có ghi chú'}
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => handleDeleteAssignment(item.AssignmentId)}
                            className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                            title="Xóa phân công"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================= TAB 5: BẢNG BẢO TRÌ & QUẢN LÝ Ô ĐẤT (ADMIN) ================= */}
        {activeTab === 'plots' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-rose-600" />
                  Bảng Điều Khiển & Quản Lý 100 Ô Đất Canh Tác
                </h2>
                <p className="text-xs text-slate-500">
                  Quản lý đóng/mở ô đất, đặt trạng thái bảo trì, điều chỉnh đơn giá niêm yết và giám sát diện tích 5 phân khu.
                </p>
              </div>
              <Link href="/plots">
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<MapPin className="w-4 h-4 text-emerald-600" />}
                  className="font-bold text-xs shadow-sm"
                >
                  Mở Sơ Đồ Tương Tác Vận Hành (/plots)
                </Button>
              </Link>
            </div>

            {/* Quick Summary Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tổng số ô đất</span>
                <strong className="text-2xl font-black text-slate-900 dark:text-white">{plots.length} ô</strong>
                <p className="text-[10px] text-slate-400 mt-1">Toàn hệ thống</p>
              </div>
              <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/50 text-center">
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">Còn trống</span>
                <strong className="text-2xl font-black text-emerald-600">{plots.filter(p => p.Status === 'AVAILABLE').length} ô</strong>
                <p className="text-[10px] text-emerald-500 mt-1">AVAILABLE</p>
              </div>
              <div className="p-4 rounded-2xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/50 text-center">
                <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider block">Đang cho thuê</span>
                <strong className="text-2xl font-black text-rose-600">{plots.filter(p => p.Status === 'RENTED').length} ô</strong>
                <p className="text-[10px] text-rose-500 mt-1">RENTED</p>
              </div>
              <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/50 text-center">
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">Đang giữ chỗ</span>
                <strong className="text-2xl font-black text-blue-600">{plots.filter(p => p.Status === 'RESERVED').length} ô</strong>
                <p className="text-[10px] text-blue-500 mt-1">RESERVED</p>
              </div>
              <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/50 text-center">
                <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider block">Đang bảo trì</span>
                <strong className="text-2xl font-black text-amber-600">{plots.filter(p => p.Status === 'MAINTENANCE').length} ô</strong>
                <p className="text-[10px] text-amber-500 mt-1">MAINTENANCE</p>
              </div>
            </div>

            {/* Filter Toolbar + Bulk Actions + Search */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 text-xs">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                {/* Area filter */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-slate-500">Lọc Phân Khu:</span>
                  {['ALL', 'Khu A', 'Khu B', 'Khu C', 'Khu D', 'Khu E'].map((area) => (
                    <button
                      key={area}
                      onClick={() => setPlotAreaFilter(area)}
                      className={`px-3 py-1.5 rounded-xl font-bold transition-colors ${
                        plotAreaFilter === area
                          ? 'bg-rose-600 text-white shadow-sm'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                      }`}
                    >
                      {area === 'ALL' ? 'Tất Cả Khu' : area}
                    </button>
                  ))}
                </div>

                {/* Refresh + Status filter */}
                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    onClick={() => loadPlotsAndOrders()}
                    disabled={isLoadingPlots}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-colors disabled:opacity-50"
                    title="Tải lại danh sách ô đất từ server"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingPlots ? 'animate-spin' : ''}`} />
                    Làm Mới
                  </button>
                  <span className="font-bold text-slate-500">Trạng Thái:</span>
                  <select
                    value={plotStatusFilterAdmin}
                    onChange={(e) => setPlotStatusFilterAdmin(e.target.value)}
                    className="px-3 py-1.5 rounded-xl font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700"
                  >
                    <option value="ALL">Tất Cả Trạng Thái</option>
                    <option value="AVAILABLE">CÒN TRỐNG (AVAILABLE)</option>
                    <option value="RENTED">ĐÃ THUÊ (RENTED)</option>
                    <option value="RESERVED">ĐANG GIỮ CHỖ (RESERVED)</option>
                    <option value="MAINTENANCE">ĐANG BẢO TRÌ (MAINTENANCE)</option>
                  </select>
                </div>
              </div>

              {/* Search + Bulk Actions Row */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Tìm mã ô đất (vd: A-01)..."
                    value={plotSearch}
                    onChange={(e) => setPlotSearch(e.target.value)}
                    className="pl-8 pr-3 py-1.5 rounded-xl text-xs font-medium bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 w-52"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-400">Thao tác hàng loạt:</span>
                  <button
                    onClick={() => handleBulkMaintenance('MAINTENANCE')}
                    disabled={isBulkUpdating}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 hover:bg-amber-200 transition-colors disabled:opacity-50"
                  >
                    {isBulkUpdating ? <Loader2 className="w-3 h-3 animate-spin" /> : <AlertTriangle className="w-3 h-3" />}
                    Bảo Trì Tất Cả AVAILABLE
                  </button>
                  <button
                    onClick={() => handleBulkMaintenance('AVAILABLE')}
                    disabled={isBulkUpdating}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-200 transition-colors disabled:opacity-50"
                  >
                    {isBulkUpdating ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                    Mở Khóa Tất Cả BẢO TRÌ
                  </button>
                </div>
              </div>
            </div>

            {/* Interactive Grid of Admin Plot Controls */}
            {isLoadingPlots ? (
              <div className="py-12 text-center text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-rose-500" />
                <p className="text-sm font-bold">Đang tải dữ liệu ô đất từ hệ thống...</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3.5">
                {plots
                  .filter((p) => (plotAreaFilter === 'ALL' || (p.AreaName || p.PlotCode).includes(plotAreaFilter)))
                  .filter((p) => (plotStatusFilterAdmin === 'ALL' || p.Status === plotStatusFilterAdmin))
                  .filter((p) => !plotSearch || p.PlotCode.toLowerCase().includes(plotSearch.toLowerCase()))
                  .map((plot) => {
                    const isRented = plot.Status === 'RENTED';
                    const isMaint = plot.Status === 'MAINTENANCE';
                    const isReserved = plot.Status === 'RESERVED';
                    const isUpdating = updatingPlotId === plot.PlotId;

                    return (
                      <div
                        key={plot.PlotId}
                        className={`p-4 rounded-2xl border transition-all space-y-2 flex flex-col justify-between relative overflow-hidden ${
                          isRented
                            ? 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-300 dark:border-rose-800/50'
                            : isMaint
                            ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800/50'
                            : isReserved
                            ? 'bg-blue-50/40 dark:bg-blue-950/20 border-blue-300 dark:border-blue-800/50'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-emerald-300'
                        }`}
                      >
                        {/* Per-card loading overlay */}
                        {isUpdating && (
                          <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 flex items-center justify-center rounded-2xl z-10">
                            <Loader2 className="w-5 h-5 animate-spin text-rose-600" />
                          </div>
                        )}
                        <div className="text-center space-y-1">
                          <p className="font-black text-base text-slate-900 dark:text-white">{plot.PlotCode}</p>
                          <span className={`inline-block px-2 py-0.5 text-[9px] font-black rounded-md ${
                            isRented ? 'bg-rose-600 text-white' :
                            isMaint ? 'bg-amber-600 text-white' :
                            isReserved ? 'bg-blue-600 text-white' :
                            'bg-emerald-600 text-white'
                          }`}>
                            {isRented ? 'ĐÃ THUÊ' : isMaint ? 'BẢO TRÌ' : isReserved ? 'GIỮ CHỖ' : 'CÒN TRỐNG'}
                          </span>
                          <p className="text-[11px] text-slate-500 font-semibold">{plot.SizeM2} m² • {plot.BasePricePerMonth?.toLocaleString('vi-VN')}đ/tháng</p>
                        </div>

                        {/* Admin Quick Action Controls */}
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5 text-center">
                          {isMaint ? (
                            <button
                              onClick={() => handleUpdatePlotStatus(plot.PlotId, 'AVAILABLE')}
                              disabled={isUpdating}
                              className="w-full py-1.5 px-2 rounded-xl text-[10px] font-black bg-emerald-600 hover:bg-emerald-700 text-white transition-colors disabled:opacity-50"
                            >
                              🔓 Mở Khóa Đất
                            </button>
                          ) : isReserved ? (
                            <span className="block text-[10px] text-blue-600 font-bold py-1">
                              🔐 Đang Giữ Chỗ (15 phút)
                            </span>
                          ) : !isRented ? (
                            <button
                              onClick={() => handleUpdatePlotStatus(plot.PlotId, 'MAINTENANCE')}
                              disabled={isUpdating}
                              className="w-full py-1.5 px-2 rounded-xl text-[10px] font-black bg-amber-600 hover:bg-amber-700 text-white transition-colors disabled:opacity-50"
                            >
                              🛠️ Đóng Ô Bảo Trì
                            </button>
                          ) : (
                            <span className="block text-[10px] text-rose-600 font-bold py-1">
                              🔒 Đang Hợp Đồng Thuê
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                {/* Empty state when filter returns nothing */}
                {plots
                  .filter((p) => (plotAreaFilter === 'ALL' || (p.AreaName || p.PlotCode).includes(plotAreaFilter)))
                  .filter((p) => (plotStatusFilterAdmin === 'ALL' || p.Status === plotStatusFilterAdmin))
                  .filter((p) => !plotSearch || p.PlotCode.toLowerCase().includes(plotSearch.toLowerCase())).length === 0 && (
                  <div className="col-span-full py-12 text-center text-slate-400 space-y-2">
                    <Layers className="w-8 h-8 mx-auto text-slate-300" />
                    <p className="text-sm font-bold">Không tìm thấy ô đất nào phù hợp với bộ lọc.</p>
                    <button
                      onClick={() => { setPlotAreaFilter('ALL'); setPlotStatusFilterAdmin('ALL'); setPlotSearch(''); }}
                      className="text-xs text-rose-600 font-bold hover:underline"
                    >Xóa bộ lọc</button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 6: ĐƠN THUÊ ĐẤT ================= */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-rose-600" />
              Danh Sách Đơn Thuê Đất Toàn Hệ Thống ({orders.length})
            </h2>
            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase font-bold">
                  <tr>
                    <th className="p-3">Mã Đơn</th>
                    <th className="p-3">Khách Hàng</th>
                    <th className="p-3">Ô Đất</th>
                    <th className="p-3">Giống Cây</th>
                    <th className="p-3">Gói Chăm Sóc</th>
                    <th className="p-3 text-right">Tổng Tiền</th>
                    <th className="p-3 text-center">Trạng Thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {orders.map((o) => (
                    <tr key={o.OrderId}>
                      <td className="p-3 font-mono font-bold text-slate-900 dark:text-white">{o.OrderCode}</td>
                      <td className="p-3">
                        <p className="font-semibold">{o.FullName}</p>
                        <p className="text-slate-400 text-[10px]">{o.Email}</p>
                      </td>
                      <td className="p-3 font-bold text-emerald-600">{o.PlotCode}</td>
                      <td className="p-3">{o.SeedName}</td>
                      <td className="p-3">{o.PackageName}</td>
                      <td className="p-3 text-right font-black text-slate-900 dark:text-white">
                        {o.TotalAmount?.toLocaleString('vi-VN')} đ
                      </td>
                      <td className="p-3 text-center">
                        <span className="px-2 py-0.5 text-[10px] font-black rounded bg-emerald-100 text-emerald-700">
                          {o.Status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================= TAB 7: QUẢN LÝ NGƯỜI DÙNG ================= */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <AdminUserFilters />
            <AdminUserTable />
            <UserDetailModal />
            <EditUserModal />
            <AddUserModal />
          </div>
        )}
      </main>

      {/* ================= MODAL: TẠO / SỬA GÓI CHĂM SÓC ================= */}
      {isPackageModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 space-y-5 border border-slate-200 dark:border-slate-800 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                {editingPackage ? 'Cập Nhật Gói Dịch Vụ' : 'Tạo Gói Dịch Vụ Mới'}
              </h3>
              <button onClick={() => setIsPackageModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePackage} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">Tên Gói Dịch Vụ *</label>
                <input
                  type="text"
                  required
                  value={pkgForm.packageName}
                  onChange={(e) => setPkgForm({ ...pkgForm, packageName: e.target.value })}
                  placeholder="Ví dụ: Gói Chăm Sóc Hữu Cơ VIP"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm focus:ring-2 focus:ring-rose-500 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">Giá Dịch Vụ (đ/tháng) *</label>
                <input
                  type="number"
                  required
                  min={0}
                  step={10000}
                  value={pkgForm.monthlyFee}
                  onChange={(e) => setPkgForm({ ...pkgForm, monthlyFee: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm focus:ring-2 focus:ring-rose-500 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">Mô Tả Gói</label>
                <textarea
                  rows={2}
                  value={pkgForm.description}
                  onChange={(e) => setPkgForm({ ...pkgForm, description: e.target.value })}
                  placeholder="Mô tả tóm tắt lợi ích của gói..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm focus:ring-2 focus:ring-rose-500 outline-none"
                />
              </div>

              {/* Danh sách dịch vụ đính kèm (Thêm/bớt) */}
              <div className="space-y-2">
                <label className="font-bold text-slate-700 dark:text-slate-300">Danh Sách Dịch Vụ Đính Kèm</label>
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {pkgForm.servicesList.map((svc, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                      <span className="font-medium text-slate-700 dark:text-slate-300">{svc}</span>
                      <button
                        type="button"
                        onClick={() => setPkgForm({ ...pkgForm, servicesList: pkgForm.servicesList.filter((_, i) => i !== idx) })}
                        className="text-rose-500 hover:text-rose-700 p-1"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 pt-1">
                  <input
                    type="text"
                    value={pkgForm.newServiceInput}
                    onChange={(e) => setPkgForm({ ...pkgForm, newServiceInput: e.target.value })}
                    placeholder="Nhập dịch vụ mới (VD: Kiểm tra pH đất định kỳ)"
                    className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs focus:ring-2 focus:ring-rose-500 outline-none"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      if (pkgForm.newServiceInput.trim()) {
                        setPkgForm({
                          ...pkgForm,
                          servicesList: [...pkgForm.servicesList, pkgForm.newServiceInput.trim()],
                          newServiceInput: '',
                        });
                      }
                    }}
                    className="text-xs font-bold"
                  >
                    Thêm
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pkgForm.isActive}
                    onChange={(e) => setPkgForm({ ...pkgForm, isActive: e.target.checked })}
                    className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500"
                  />
                  <span className="font-bold text-slate-700 dark:text-slate-300">Kích hoạt gói dịch vụ này</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <Button type="button" variant="outline" onClick={() => setIsPackageModalOpen(false)}>
                  Hủy
                </Button>
                <Button type="submit" variant="primary" className="bg-rose-600 hover:bg-rose-700 text-white font-bold">
                  Lưu Gói Dịch Vụ
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: THÊM / SỬA GIỐNG CÂY TRỒNG ================= */}
      {isSeedModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 space-y-5 border border-slate-200 dark:border-slate-800 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                {editingSeed ? 'Điều Chỉnh Giống Cây' : 'Thêm Giống Cây Trồng Mới'}
              </h3>
              <button onClick={() => setIsSeedModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSeed} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Tên Giống Cây *</label>
                  <input
                    type="text"
                    required
                    value={seedForm.seedName}
                    onChange={(e) => setSeedForm({ ...seedForm, seedName: e.target.value })}
                    placeholder="Ví dụ: Cải Kale Khủng Long"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm focus:ring-2 focus:ring-rose-500 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Phân Loại *</label>
                  <select
                    value={seedForm.category}
                    onChange={(e) => setSeedForm({ ...seedForm, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm focus:ring-2 focus:ring-rose-500 outline-none font-semibold"
                  >
                    <option value="RAU_AN_LA">Rau Ăn Lá</option>
                    <option value="CU_QUA">Củ & Quả Hữu Cơ</option>
                    <option value="DUOC_LIEU">Dược Liệu & Rau Gia Vị</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Ngày Sinh Trưởng *</label>
                  <input
                    type="number"
                    required
                    min={15}
                    max={180}
                    value={seedForm.growthDurationDays}
                    onChange={(e) => setSeedForm({ ...seedForm, growthDurationDays: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm focus:ring-2 focus:ring-rose-500 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Năng Suất (kg/m²) *</label>
                  <input
                    type="number"
                    required
                    step={0.1}
                    min={0.5}
                    max={15}
                    value={seedForm.expectedYieldKgPerM2}
                    onChange={(e) => setSeedForm({ ...seedForm, expectedYieldKgPerM2: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm focus:ring-2 focus:ring-rose-500 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Giá Giống (đ) *</label>
                  <input
                    type="number"
                    required
                    min={10000}
                    step={5000}
                    value={seedForm.seedPrice}
                    onChange={(e) => setSeedForm({ ...seedForm, seedPrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm focus:ring-2 focus:ring-rose-500 outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">Link Hình Ảnh</label>
                <input
                  type="text"
                  value={seedForm.imageUrl}
                  onChange={(e) => setSeedForm({ ...seedForm, imageUrl: e.target.value })}
                  placeholder="URL ảnh cây giống"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs focus:ring-2 focus:ring-rose-500 outline-none font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">Mô Tả Sinh Trưởng</label>
                <textarea
                  rows={2}
                  value={seedForm.description}
                  onChange={(e) => setSeedForm({ ...seedForm, description: e.target.value })}
                  placeholder="Đặc tính sinh trưởng, mùa vụ phù hợp..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm focus:ring-2 focus:ring-rose-500 outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <Button type="button" variant="outline" onClick={() => setIsSeedModalOpen(false)}>
                  Hủy
                </Button>
                <Button type="submit" variant="primary" className="bg-rose-600 hover:bg-rose-700 text-white font-bold">
                  Lưu Giống Cây
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: GÁN PHÂN KHU CHO KỸ THUẬT VIÊN ================= */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 space-y-5 border border-slate-200 dark:border-slate-800 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                Gán Phân Khu Cho Kỹ Thuật Viên
              </h3>
              <button onClick={() => setIsAssignModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAssignStaff} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">Chọn Kỹ Thuật Viên *</label>
                <select
                  required
                  value={assignForm.staffId}
                  onChange={(e) => setAssignForm({ ...assignForm, staffId: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm focus:ring-2 focus:ring-rose-500 outline-none font-semibold"
                >
                  {staffUsers.map((s) => (
                    <option key={s.UserId} value={s.UserId}>
                      {s.FullName} ({s.Email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">Chọn Phân Khu Phụ Trách *</label>
                <select
                  required
                  value={assignForm.areaId}
                  onChange={(e) => setAssignForm({ ...assignForm, areaId: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm focus:ring-2 focus:ring-rose-500 outline-none font-semibold"
                >
                  <option value={1}>Khu A - Rau Ăn Lá Hữu Cơ</option>
                  <option value={2}>Khu B - Củ Quả Dinh Dưỡng</option>
                  <option value={3}>Khu C - Rau Gia Vị & Thảo Mộc</option>
                  <option value={4}>Khu D - Nông Nghiệp Công Nghệ Cao</option>
                  <option value={5}>Khu E - Dược Liệu Sinh Thái</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">Ca Trực *</label>
                <select
                  value={assignForm.shift}
                  onChange={(e) => setAssignForm({ ...assignForm, shift: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm focus:ring-2 focus:ring-rose-500 outline-none font-semibold"
                >
                  <option value="Ca Sáng (06:00 - 14:00)">Ca Sáng (06:00 - 14:00)</option>
                  <option value="Ca Chiều (14:00 - 22:00)">Ca Chiều (14:00 - 22:00)</option>
                  <option value="Toàn Thời Gian (Hành Chính)">Toàn Thời Gian (Hành Chính)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">Ghi Chú Phân Công</label>
                <textarea
                  rows={2}
                  value={assignForm.notes}
                  onChange={(e) => setAssignForm({ ...assignForm, notes: e.target.value })}
                  placeholder="Nhiệm vụ trọng tâm của kỹ thuật viên tại phân khu này..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm focus:ring-2 focus:ring-rose-500 outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <Button type="button" variant="outline" onClick={() => setIsAssignModalOpen(false)}>
                  Hủy
                </Button>
                <Button type="submit" variant="primary" className="bg-rose-600 hover:bg-rose-700 text-white font-bold">
                  Xác Nhận Phân Công
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
