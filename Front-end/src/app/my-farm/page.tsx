'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Sprout,
  Video,
  Sun,
  Droplets,
  Thermometer,
  Calendar,
  Clock,
  CheckCircle2,
  Camera,
  Maximize2,
  RefreshCw,
  Sparkles,
  MapPin,
  ArrowRight,
  Package,
  Layers,
  Activity,
  AlertCircle,
  Loader2,
  Eye,
  Sliders,
  ChevronRight,
  ShieldCheck,
  Send,
  Truck,
  PlusCircle,
  FileText,
  HelpCircle,
  X,
  Phone,
  UserCheck,
  CheckCircle,
  Info,
  QrCode,
  Moon,
  CloudSun,
  Wind
} from 'lucide-react';
import Header from '@/components/Header';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent } from '@/components/ui/Card';
import { useAuthStore } from '@/store/useAuthStore';
import { useAddressStore } from '@/store/useAddressStore';

interface CultivationItem {
  CultivationId: number;
  OrderId: number;
  PlotId: number;
  SeedId: number;
  StartDate: string;
  ExpectedHarvestDate: string;
  ProgressPercent: number;
  CultivationStatus: string;
  PlotCode: string;
  SizeM2: number;
  SoilPH: number;
  StandardHumidity: number;
  BasePricePerMonth: number;
  SeedName: string;
  Category: string;
  GrowthDurationDays: number;
  ExpectedYieldKgPerM2: number;
  SeedImageUrl: string;
  PackageName: string;
  MonthlyFee: number;
  ServicesIncluded: string;
  OrderCode: string;
  TotalAmount: number;
  PaidAt: string;
  DurationMonths: number;
  CameraCode?: string;
  CameraName?: string;
  StreamUrl?: string;
  CameraStatus?: string;
}

interface CultivationLogItem {
  LogId: number;
  CultivationId: number;
  StaffId: number;
  LogDate: string;
  ActivityType: string;
  Title: string;
  Notes: string;
  ImageUrl: string | null;
  VideoUrl: string | null;
  PlantHealthStatus: string;
  CreatedAt: string;
  StaffName?: string;
}

interface CareRequestItem {
  RequestId: number;
  CultivationId: number;
  ServiceType: string;
  CustomerNote: string;
  Status: string;
  ResultNote?: string | null;
  ResultImageUrl?: string | null;
  RequestedAt: string;
  CompletedAt?: string | null;
  PlotCode?: string;
  SeedName?: string;
  StaffName?: string;
}

interface DeliveryItem {
  DeliveryId: number;
  HarvestRequestId: number;
  RecipientName: string;
  PhoneNumber: string;
  DeliveryAddress: string;
  CarrierName: string;
  TrackingCode: string;
  ShippingFee: number;
  DeliveryStatus: string;
  ShippedAt?: string | null;
  DeliveredAt?: string | null;
  ProofImageUrl?: string | null;
  HarvestType: string;
  RequestDate: string;
  CustomerNote?: string;
  CultivationId: number;
  PlotCode: string;
  SeedName: string;
  ExpectedYieldKgPerM2: number;
  SizeM2: number;
}

export default function MyFarmPage() {
  const router = useRouter();
  const { user, token, isAuthenticated, initAuth } = useAuthStore();
  const { addresses, fetchAddresses } = useAddressStore();

  const [cultivations, setCultivations] = useState<CultivationItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<CultivationItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Active Tab
  const [activeTab, setActiveTab] = useState<'timeline' | 'care' | 'delivery'>('timeline');

  // Day 2 Data States
  const [logs, setLogs] = useState<CultivationLogItem[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [careRequests, setCareRequests] = useState<CareRequestItem[]>([]);
  const [deliveries, setDeliveries] = useState<DeliveryItem[]>([]);

  // Modals
  const [isCareModalOpen, setIsCareModalOpen] = useState(false);
  const [isHarvestModalOpen, setIsHarvestModalOpen] = useState(false);
  const [isNewLogModalOpen, setIsNewLogModalOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Care Request Form
  const [careServiceType, setCareServiceType] = useState('BÓN PHÂN HỮU CƠ BỔ SUNG');
  const [careNote, setCareNote] = useState('');
  const [isSubmittingCare, setIsSubmittingCare] = useState(false);

  // Harvest Request Form
  const [harvestType, setHarvestType] = useState<'GIAO_TAN_NOI' | 'NHAN_TAI_VUON' | 'TANG_TU_THIEN'>('GIAO_TAN_NOI');
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [harvestNote, setHarvestNote] = useState('');
  const [isSubmittingHarvest, setIsSubmittingHarvest] = useState(false);

  // New Log Form
  const [newLogActivity, setNewLogActivity] = useState('TUOI_NUOC');
  const [newLogTitle, setNewLogTitle] = useState('');
  const [newLogNotes, setNewLogNotes] = useState('');
  const [newLogImageUrl, setNewLogImageUrl] = useState('https://images.unsplash.com/photo-1585320806297-9794b3e4eeae');
  const [isSubmittingLog, setIsSubmittingLog] = useState(false);

  // Live sensor mock states with subtle fluctuations
  const [temperature, setTemperature] = useState(26.8);
  const [humidity, setHumidity] = useState(74);
  const [lightLux, setLightLux] = useState(860);
  const [liveTime, setLiveTime] = useState('');
  const [cameraAngle, setCameraAngle] = useState<'Góc Toàn Cảnh' | 'Cận Cảnh Gốc Rau'>('Góc Toàn Cảnh');
  const [isNightVision, setIsNightVision] = useState(false);
  const [isRefreshingStream, setIsRefreshingStream] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  // Realtime clock
  // Role Guard: Redirect Admin & Staff away from customer farming page
  useEffect(() => {
    if (user) {
      const role = (user.role || user.roleName || '').toLowerCase();
      if (role === 'admin' || user.roleId === 1) {
        router.replace('/admin');
      } else if (role === 'staff' || user.roleId === 2) {
        router.replace('/staff');
      }
    }
  }, [user, router]);

  useEffect(() => {
    initAuth();

    const updateClock = () => {
      const now = new Date();
      setLiveTime(
        now.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
          ' ' +
          now.toLocaleTimeString('vi-VN')
      );
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, [initAuth]);

  // Top 4 Summary Stats
  const activePlotsCount = cultivations.length;
  const growingCyclesCount = cultivations.filter((c) => c.CultivationStatus === 'GROWING').length;
  const readyToHarvestCount = cultivations.filter((c) => Number(c.ProgressPercent) >= 90).length;
  const pendingRequestsCount =
    careRequests.filter((r) => r.Status !== 'COMPLETED').length +
    deliveries.filter((d) => d.DeliveryStatus !== 'DELIVERED').length;

  const getHarvestCountdown = (expectedHarvestDateStr: string) => {
    if (!expectedHarvestDateStr) return 'Đang cập nhật';
    const target = new Date(expectedHarvestDateStr).getTime();
    const now = Date.now();
    const diff = target - now;
    if (diff <= 0) return 'Đã đến ngày thu hoạch';
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    return `Còn ${days} ngày ${hours} giờ`;
  };

  // Minor sensor fluctuation for lively feel
  useEffect(() => {
    const sensorInterval = setInterval(() => {
      setTemperature((prev) => Number((26.0 + Math.random() * 1.5).toFixed(1)));
      setHumidity((prev) => Math.floor(72 + Math.random() * 5));
      setLightLux((prev) => Math.floor(840 + Math.random() * 40));
    }, 4000);
    return () => clearInterval(sensorInterval);
  }, []);

  // Fetch cultivations
  const fetchMyFarm = useCallback(async () => {
    try {
      setIsLoading(true);
      const authToken = token || (typeof window !== 'undefined' ? (localStorage.getItem('token') || localStorage.getItem('plotfarm_token')) : null);
      if (!authToken) {
        setIsLoading(false);
        return;
      }

      const res = await fetch('http://localhost:5000/api/cultivations/my-farm', {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      const data = await res.json();
      if (data.success && data.data) {
        setCultivations(data.data);
        if (data.data.length > 0) {
          setSelectedItem(data.data[0]);
        }
      }
    } catch (err) {
      console.error('Error loading my farm:', err);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchMyFarm();
  }, [fetchMyFarm]);

  // Fetch User Addresses when opening harvest modal
  useEffect(() => {
    if (token) {
      fetchAddresses();
    }
  }, [token, fetchAddresses]);

  // Set default address details if available
  useEffect(() => {
    if (addresses.length > 0) {
      const defaultAddr = addresses.find((a) => a.isDefault) || addresses[0];
      if (defaultAddr) {
        setRecipientName(defaultAddr.recipientName || user?.fullName || '');
        setRecipientPhone(defaultAddr.phoneNumber || user?.phoneNumber || '');
        const full = [defaultAddr.addressLine, defaultAddr.ward, defaultAddr.district, defaultAddr.province]
          .filter(Boolean)
          .join(', ');
        setDeliveryAddress(full);
      }
    } else if (user) {
      setRecipientName(user.fullName || '');
      setRecipientPhone(user.phoneNumber || '');
    }
  }, [addresses, user]);

  // Fetch Logs when selectedItem changes
  const fetchLogs = useCallback(async (cultivationId: number) => {
    try {
      setIsLoadingLogs(true);
      const authToken = token || (typeof window !== 'undefined' ? (localStorage.getItem('token') || localStorage.getItem('plotfarm_token')) : null);
      const res = await fetch(`http://localhost:5000/api/cultivations/${cultivationId}/logs`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      const data = await res.json();
      if (data.success && data.data) {
        setLogs(data.data);
      }
    } catch (err) {
      console.error('Error loading logs:', err);
    } finally {
      setIsLoadingLogs(false);
    }
  }, [token]);

  // Fetch Care Requests & Deliveries
  const fetchCareAndDeliveries = useCallback(async () => {
    try {
      const authToken = token || (typeof window !== 'undefined' ? (localStorage.getItem('token') || localStorage.getItem('plotfarm_token')) : null);
      if (!authToken) return;

      const [careRes, delRes] = await Promise.all([
        fetch('http://localhost:5000/api/cultivations/care-requests/my', {
          headers: { Authorization: `Bearer ${authToken}` },
        }),
        fetch('http://localhost:5000/api/cultivations/deliveries/my', {
          headers: { Authorization: `Bearer ${authToken}` },
        }),
      ]);

      const careData = await careRes.json();
      if (careData.success && careData.data) {
        setCareRequests(careData.data);
      }

      const delData = await delRes.json();
      if (delData.success && delData.data) {
        setDeliveries(delData.data);
      }
    } catch (err) {
      console.error('Error fetching care and deliveries:', err);
    }
  }, [token]);

  useEffect(() => {
    if (selectedItem) {
      fetchLogs(selectedItem.CultivationId);
      fetchCareAndDeliveries();
    }
  }, [selectedItem, fetchLogs, fetchCareAndDeliveries]);

  // Submit Care Request
  const handleSubmitCareRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    try {
      setIsSubmittingCare(true);
      const authToken = token || localStorage.getItem('plotfarm_token');
      const res = await fetch('http://localhost:5000/api/cultivations/care-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          cultivationId: selectedItem.CultivationId,
          serviceType: careServiceType,
          customerNote: careNote,
        }),
      });

      const data = await res.json();
      if (data.success) {
        alert('Gửi yêu cầu chăm sóc thành công! Kỹ thuật viên PlotFarm đã tiếp nhận yêu cầu.');
        setIsCareModalOpen(false);
        setCareNote('');
        fetchCareAndDeliveries();
      } else {
        alert(data.message || 'Không thể gửi yêu cầu');
      }
    } catch (err) {
      alert('Đã xảy ra lỗi khi gửi yêu cầu chăm sóc');
    } finally {
      setIsSubmittingCare(false);
    }
  };

  // Submit Harvest Request
  const handleSubmitHarvestRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    try {
      setIsSubmittingHarvest(true);
      const authToken = token || localStorage.getItem('plotfarm_token');
      const res = await fetch('http://localhost:5000/api/cultivations/harvest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          cultivationId: selectedItem.CultivationId,
          harvestType,
          recipientName,
          phoneNumber: recipientPhone,
          deliveryAddress,
          customerNote: harvestNote,
        }),
      });

      const data = await res.json();
      if (data.success) {
        alert('Đã tạo đơn yêu cầu thu hoạch thành công! Mã đơn vận chuyển đã được khởi tạo.');
        setIsHarvestModalOpen(false);
        fetchMyFarm();
        fetchCareAndDeliveries();
        setActiveTab('delivery');
      } else {
        alert(data.message || 'Không thể gửi yêu cầu thu hoạch');
      }
    } catch (err) {
      alert('Đã xảy ra lỗi khi gửi yêu cầu thu hoạch');
    } finally {
      setIsSubmittingHarvest(false);
    }
  };

  // Submit New Log
  const handleSubmitNewLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem || !newLogTitle) return;

    try {
      setIsSubmittingLog(true);
      const authToken = token || localStorage.getItem('plotfarm_token');
      const res = await fetch(`http://localhost:5000/api/cultivations/${selectedItem.CultivationId}/logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          activityType: newLogActivity,
          title: newLogTitle,
          notes: newLogNotes,
          imageUrl: newLogImageUrl,
          plantHealthStatus: 'EXCELLENT',
        }),
      });

      const data = await res.json();
      if (data.success) {
        alert('Thêm ghi chú nhật ký thành công!');
        setIsNewLogModalOpen(false);
        setNewLogTitle('');
        setNewLogNotes('');
        fetchLogs(selectedItem.CultivationId);
      } else {
        alert(data.message || 'Lỗi thêm nhật ký');
      }
    } catch (err) {
      alert('Lỗi kết nối khi thêm nhật ký');
    } finally {
      setIsSubmittingLog(false);
    }
  };

  const formatVND = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const formatDateTime = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return (
      d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
      ' ' +
      d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    );
  };

  const getActivityBadge = (type: string) => {
    switch (type) {
      case 'TUOI_NUOC':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300">💧 Tưới Nước</span>;
      case 'BON_PHAN':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">🌱 Bón Phân Hữu Cơ</span>;
      case 'TIA_CANH':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-lime-100 text-lime-800 dark:bg-lime-950 dark:text-lime-300">✂️ Tỉa Dặm Cành</span>;
      case 'KIEM_TRA_SAU_BENH':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">🔍 Kiểm Tra VietGAP</span>;
      case 'NAY_MAM':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300">🌱 Nảy Mầm Đều</span>;
      case 'GIEO_HAT':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300">🌾 Gieo Hạt</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300">📝 Hoạt Động Vườn</span>;
    }
  };

  const getHealthBadge = (health: string) => {
    if (health === 'EXCELLENT' || health === 'TOT') {
      return <Badge variant="success" size="sm" dot>Phát Triển Xuất Sắc</Badge>;
    }
    if (health === 'HEALTHY' || health === 'ON_DINH') {
      return <Badge variant="info" size="sm" dot>Khỏe Mạnh Ổn Định</Badge>;
    }
    return <Badge variant="warning" size="sm" dot>Cần Tăng Cường Chăm Sóc</Badge>;
  };

  const getCareStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <Badge variant="success" size="sm">Đã Hoàn Thành</Badge>;
      case 'IN_PROGRESS':
        return <Badge variant="info" size="sm">Đang Xử Lý</Badge>;
      case 'REJECTED':
        return <Badge variant="danger" size="sm">Từ Chối</Badge>;
      default:
        return <Badge variant="warning" size="sm">Đang Chờ Kỹ Thuật Viên</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col font-sans transition-colors duration-300">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Top bar */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
              <span className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
                <Sprout className="w-5 h-5" />
              </span>
              Khu Đất Của Tôi (My Farm Dashboard)
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Giám sát tiến độ sinh trưởng, theo dõi trực tiếp qua Camera 24/7 và kiểm soát thông số nông trại
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/plots">
              <Button variant="outline" size="sm" leftIcon={<Layers className="w-4 h-4 text-emerald-600" />}>
                Bản Đồ Thuê Thêm Đất
              </Button>
            </Link>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> IoT & Camera Live Sync
            </span>
          </div>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="py-24 text-center space-y-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <Loader2 className="w-10 h-10 animate-spin text-emerald-500 mx-auto" />
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
              Đang kết nối camera luống rau và đọc cảm biến nông trại...
            </p>
          </div>
        )}

        {/* Empty State: If user has no active cultivations */}
        {!isLoading && cultivations.length === 0 && (
          <div className="bg-white dark:bg-slate-900 p-8 sm:p-14 rounded-3xl border-2 border-dashed border-emerald-300 dark:border-slate-800 text-center space-y-6 max-w-2xl mx-auto shadow-sm">
            <div className="w-20 h-20 rounded-3xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center mx-auto">
              <Sprout className="w-10 h-10" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                Bạn Chưa Có Ô Đất Canh Tác Nào
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                Hãy lựa chọn ô đất yêu thích trên bản đồ 3D nông trại PlotFarm và bắt đầu trải nghiệm gieo trồng nguồn rau hữu cơ sạch ngay hôm nay!
              </p>
            </div>
            <div className="pt-2">
              <Link href="/plots">
                <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-lg shadow-emerald-600/30">
                  Khám Phá Bản Đồ Ô Đất & Đặt Thuê Ngay <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Active Cultivations Dashboard */}
        {!isLoading && cultivations.length > 0 && selectedItem && (
          <div className="space-y-8">
            {/* Plot Switcher (if user owns multiple plots) */}
            {cultivations.length > 1 && (
              <div className="flex items-center gap-3 overflow-x-auto pb-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider shrink-0">Ô đất của bạn:</span>
                {cultivations.map((item) => (
                  <button
                    key={item.CultivationId}
                    onClick={() => setSelectedItem(item)}
                    className={`px-4 py-2 rounded-2xl text-xs font-extrabold transition-all shrink-0 flex items-center gap-2 ${
                      selectedItem.CultivationId === item.CultivationId
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                        : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <Sprout className="w-3.5 h-3.5" />
                    <span>{item.PlotCode} - {item.SeedName}</span>
                  </button>
                ))}
              </div>
            )}

            {/* TOP 4 KPI SUMMARY METRICS */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center font-black text-lg">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Ô Đất Đang Thuê</span>
                  <span className="text-xl font-black text-slate-900 dark:text-white">{activePlotsCount} ô chuẩn</span>
                </div>
              </div>

              <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-teal-100 dark:bg-teal-950 text-teal-600 flex items-center justify-center font-black text-lg">
                  <Sprout className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Vụ Đang Canh Tác</span>
                  <span className="text-xl font-black text-teal-600 dark:text-teal-400">{growingCyclesCount} mùa vụ</span>
                </div>
              </div>

              <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-600 flex items-center justify-center font-black text-lg">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Sẵn Sàng Thu Hoạch</span>
                  <span className="text-xl font-black text-amber-600 dark:text-amber-400">{readyToHarvestCount} vụ chín</span>
                </div>
              </div>

              <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-blue-100 dark:bg-blue-950 text-blue-600 flex items-center justify-center font-black text-lg">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Yêu Cầu Đang Xử Lý</span>
                  <span className="text-xl font-black text-blue-600 dark:text-blue-400">{pendingRequestsCount} yêu cầu</span>
                </div>
              </div>
            </div>

            {/* 1. HERO CULTIVATION OVERVIEW CARD */}
            <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-emerald-200/90 dark:border-slate-800 shadow-sm space-y-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-start sm:items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-md shrink-0 border-2 border-emerald-500">
                    <img
                      src={selectedItem.SeedImageUrl}
                      alt={selectedItem.SeedName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                        {selectedItem.PlotCode}: {selectedItem.SeedName}
                      </h2>
                      {selectedItem.CultivationStatus === 'READY_TO_HARVEST' ? (
                        <Badge variant="success" size="sm" dot>SẴN SÀNG THU HOẠCH</Badge>
                      ) : (
                        <Badge variant="success" size="sm" dot>ĐANG CANH TÁC</Badge>
                      )}
                      <Badge variant="info" size="sm">{selectedItem.Category}</Badge>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Gói chăm sóc: <span className="font-bold text-slate-700 dark:text-slate-300">{selectedItem.PackageName}</span> • Diện tích: <span className="font-bold text-slate-700 dark:text-slate-300">{selectedItem.SizeM2} m²</span>
                    </p>
                  </div>
                </div>

                {/* Quick actions & harvest button */}
                <div className="flex flex-wrap items-center gap-2.5">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-emerald-300 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950 font-bold"
                    onClick={() => setIsQrModalOpen(true)}
                  >
                    <QrCode className="w-4 h-4 mr-1.5 text-emerald-600" />
                    Mã QR VietGAP
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950 text-amber-700 dark:text-amber-300 font-bold"
                    onClick={() => setIsCareModalOpen(true)}
                  >
                    <Sparkles className="w-4 h-4 mr-1.5 text-amber-500" />
                    Yêu Cầu Chăm Sóc Đột Xuất
                  </Button>

                  <Button
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md shadow-emerald-600/20"
                    onClick={() => setIsHarvestModalOpen(true)}
                  >
                    <Package className="w-4 h-4 mr-1.5" />
                    Yêu Cầu Thu Hoạch & Giao Hàng
                  </Button>
                </div>
              </div>

              {/* Progress Bar & Growth Stages */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-emerald-500" />
                    Tiến độ mùa vụ: <span className="text-emerald-600 font-extrabold">{selectedItem.ProgressPercent}%</span>
                  </span>
                  <span className="text-slate-500 text-xs">Dự kiến thu hoạch: {formatDate(selectedItem.ExpectedHarvestDate)}</span>
                </div>

                <div className="w-full h-3.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-200 dark:border-slate-700">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 via-teal-500 to-green-500 rounded-full transition-all duration-1000 shadow-sm"
                    style={{ width: `${selectedItem.ProgressPercent}%` }}
                  />
                </div>

                <div className="grid grid-cols-5 text-center text-[10px] sm:text-xs font-semibold text-slate-400 pt-1">
                  <span className={selectedItem.ProgressPercent >= 15 ? 'text-emerald-600 font-bold' : ''}>1. Chuẩn Bị Đất</span>
                  <span className={selectedItem.ProgressPercent >= 35 ? 'text-emerald-600 font-bold' : ''}>2. Gieo Hạt & Ủ Mầm</span>
                  <span className={selectedItem.ProgressPercent >= 65 ? 'text-emerald-600 font-bold' : ''}>3. Cây Con Phát Triển</span>
                  <span className={selectedItem.ProgressPercent >= 90 ? 'text-emerald-600 font-bold' : ''}>4. Sinh Trưởng Mạnh</span>
                  <span className={selectedItem.ProgressPercent >= 100 ? 'text-emerald-600 font-bold' : ''}>5. Sẵn Sàng Thu Hoạch</span>
                </div>

                {Number(selectedItem.ProgressPercent) >= 90 && (
                  <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white flex items-center justify-between gap-3 text-xs shadow-md animate-fade-in">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-100 flex-shrink-0" />
                      <span>
                        <strong>Ô đất đã đạt chất lượng thu hoạch chuẩn VietGAP!</strong> Bạn có thể bấm nút &quot;Yêu Cầu Thu Hoạch & Giao Hàng&quot; để nhận rau tươi tận nhà.
                      </span>
                    </div>
                    <Badge variant="warning" size="sm" className="bg-white text-emerald-900 border-none font-bold">
                      ĐÃ ĐẠT ĐỘ NGỌT
                    </Badge>
                  </div>
                )}
              </div>
            </div>

            {/* 2. CAMERA 24/7 & SENSOR WIDGETS */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left 7 Cols: Live Camera Stream */}
              <div className="lg:col-span-7 space-y-4">
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm space-y-4 p-5 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
                      <span className="text-xs font-black text-red-600 uppercase tracking-wider">
                        ● LIVE CAM 24/7 - {selectedItem.CameraName || `CAMERA #${selectedItem.PlotId}`} ({selectedItem.CameraCode || selectedItem.PlotCode})
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setIsNightVision((prev) => !prev)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all ${
                          isNightVision
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                        }`}
                        title="Bật/Tắt chế độ quan sát hồng ngoại ban đêm"
                      >
                        <Moon className="w-3 h-3" />
                        {isNightVision ? 'Hồng Ngoại BẬT' : 'Chế Độ Đêm (IR)'}
                      </button>

                      <button
                        onClick={() => {
                          setIsRefreshingStream(true);
                          setTimeout(() => setIsRefreshingStream(false), 600);
                        }}
                        disabled={isRefreshingStream}
                        className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 transition-colors"
                        title="Thử lại kết nối Camera"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingStream ? 'animate-spin text-emerald-600' : ''}`} />
                      </button>

                      <Badge variant="success" size="sm">1080P HD</Badge>
                      <button
                        onClick={() => setCameraAngle((prev) => (prev === 'Góc Toàn Cảnh' ? 'Cận Cảnh Gốc Rau' : 'Góc Toàn Cảnh'))}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 text-[11px] font-bold text-slate-600 dark:text-slate-300 transition-colors"
                      >
                        {cameraAngle}
                      </button>
                    </div>
                  </div>

                  {/* Camera Video Player Box */}
                  <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-slate-950 shadow-inner group">
                    <img
                      src="https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=1200&q=80"
                      alt="Camera Feed"
                      className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ${
                        isNightVision ? 'grayscale contrast-125 brightness-90 hue-rotate-90' : ''
                      }`}
                    />
                    {isNightVision && (
                      <div className="absolute top-10 left-3 px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-500 text-[10px] font-mono font-bold text-emerald-400">
                        IR NIGHT VISION • ACTIVE
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 pointer-events-none" />

                    {/* Top HUD */}
                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between text-white text-xs font-mono drop-shadow">
                      <span className="bg-black/40 px-2 py-0.5 rounded backdrop-blur-sm">
                        {selectedItem.CameraCode || `CAM-${selectedItem.PlotCode}`} • {selectedItem.CameraName || selectedItem.PlotCode} • GPS: 11.9404° N, 108.4583° E
                      </span>
                      <span className="bg-black/40 px-2 py-0.5 rounded backdrop-blur-sm">
                        {liveTime}
                      </span>
                    </div>

                    {/* Bottom HUD Controls */}
                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-600/80 backdrop-blur-sm text-[11px] font-bold">
                          <Video className="w-3.5 h-3.5" /> Trực Tiếp
                        </span>
                        <span className="text-[11px] text-white/80 hidden sm:inline">
                          FPS: 30 • Bitrate: 4.2 Mbps
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => alert('Ảnh chụp luống rau đã được lưu vào bộ nhớ tạm')}
                          className="bg-white/20 hover:bg-white/40 text-white p-1.5 rounded-lg backdrop-blur-sm transition-colors"
                          title="Chụp ảnh màn hình"
                        >
                          <Camera className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => alert('Chế độ toàn màn hình camera đã kích hoạt')}
                          className="bg-white/20 hover:bg-white/40 text-white p-1.5 rounded-lg backdrop-blur-sm transition-colors"
                          title="Phóng to toàn màn hình"
                        >
                          <Maximize2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
                    Tín hiệu camera truyền hình trực tiếp độ trễ thấp từ nông trại hữu cơ thông minh PlotFarm
                  </p>
                </div>
              </div>

              {/* Right 5 Cols: Live Sensor Telemetry */}
              <div className="lg:col-span-5 space-y-4">
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-5 shadow-sm">
                  {/*  Microclimate */}
                  <div className="p-3.5 rounded-2xl bg-gradient-to-r from-sky-50 to-emerald-50 dark:from-sky-950/30 dark:to-emerald-950/30 border border-sky-200 dark:border-sky-900/40 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-sky-900 dark:text-sky-300 flex items-center gap-1.5">
                        <CloudSun className="w-4 h-4 text-sky-600" /> Vi Khí Hậu Nhà Màng Nông Trại
                      </span>
                      <span className="text-[10px] font-bold text-slate-500">19°C • Mát Mẻ</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-600 dark:text-slate-300">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Độ ẩm khí:</span>
                        <strong>82% ẩm</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Chỉ số UV:</span>
                        <strong className="text-emerald-600 font-bold">3 (An toàn)</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Phun sương:</span>
                        <strong>Tự động</strong>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                    <h3 className="font-black text-lg text-slate-900 dark:text-white flex items-center gap-2">
                      <Activity className="w-5 h-5 text-emerald-500" /> Cảm Biến Môi Trường Luống Đất
                    </h3>
                    <Badge variant="warning" size="sm">CHỜ KẾT NỐI IoT</Badge>
                  </div>

                  {/* 4 Sensor Cards */}
                  <div className="grid grid-cols-2 gap-3.5">
                    {/* Temperature */}
                    <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 space-y-1">
                      <div className="flex items-center justify-between text-amber-700 dark:text-amber-400">
                        <span className="text-[11px] font-extrabold uppercase tracking-wider">Nhiệt Độ Đất</span>
                        <Thermometer className="w-4 h-4" />
                      </div>
                      <p className="text-2xl font-black text-slate-900 dark:text-white">{temperature} °C</p>
                      <span className="text-[10px] font-semibold text-emerald-600 block">Lý tưởng (24 - 28°C)</span>
                    </div>

                    {/* Humidity */}
                    <div className="p-4 rounded-2xl bg-cyan-50/60 dark:bg-cyan-950/20 border border-cyan-200/80 dark:border-cyan-900/40 space-y-1">
                      <div className="flex items-center justify-between text-cyan-700 dark:text-cyan-400">
                        <span className="text-[11px] font-extrabold uppercase tracking-wider">Độ Ẩm Không Khí</span>
                        <Droplets className="w-4 h-4" />
                      </div>
                      <p className="text-2xl font-black text-slate-900 dark:text-white">{humidity} %</p>
                      <span className="text-[10px] font-semibold text-emerald-600 block">Đủ ẩm (Hệ thống ngắt)</span>
                    </div>

                    {/* Light */}
                    <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-900/40 space-y-1">
                      <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400">
                        <span className="text-[11px] font-extrabold uppercase tracking-wider">Ánh Sáng</span>
                        <Sun className="w-4 h-4" />
                      </div>
                      <p className="text-2xl font-black text-slate-900 dark:text-white">{lightLux} Lux</p>
                      <span className="text-[10px] font-semibold text-emerald-600 block">Quang hợp tối ưu</span>
                    </div>

                    {/* Soil pH */}
                    <div className="p-4 rounded-2xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-200/80 dark:border-purple-900/40 space-y-1">
                      <div className="flex items-center justify-between text-purple-700 dark:text-purple-400">
                        <span className="text-[11px] font-extrabold uppercase tracking-wider">Độ pH Thổ Nhưỡng</span>
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <p className="text-2xl font-black text-slate-900 dark:text-white">{selectedItem.SoilPH}</p>
                      <span className="text-[10px] font-semibold text-emerald-600 block">Trung tính giàu mùn</span>
                    </div>
                  </div>

                  {/* IoT Connection Status Notice */}
                  <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 flex items-center gap-3">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping shrink-0" />
                    <p className="text-xs text-amber-800 dark:text-amber-300 font-medium">
                      Trạng thái: Trạm cảm biến IoT thực địa đang chờ kết nối và đồng bộ thông số...
                    </p>
                  </div>

                  {/* Harvest Yield Expectation */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-semibold">Sản lượng dự kiến tối thiểu:</span>
                      <span className="font-extrabold text-slate-900 dark:text-white">
                        {selectedItem.ExpectedYieldKgPerM2 * selectedItem.SizeM2} kg rau sạch
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-semibold">Đơn vị giao hàng liên kết:</span>
                      <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                        Giao Hàng Tiết Kiệm (GHTK) Xe Lạnh
                      </span>
                    </div>
                  </div>

                  <div className="pt-1">
                    <Link href="/profile" className="block">
                      <Button variant="ghost" size="sm" className="w-full justify-between text-xs text-slate-500 font-semibold">
                        <span className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-slate-400" /> Sổ Địa Chỉ Giao Hàng Của Bạn
                        </span>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. DAY 2 INTERACTIVE TABS: TIMELINE, CARE REQUESTS, DELIVERY TRACKING */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              {/* Tab Navigation Header */}
              <div className="flex items-center border-b border-slate-200 dark:border-slate-800 px-6 pt-4 gap-4 overflow-x-auto">
                <button
                  onClick={() => setActiveTab('timeline')}
                  className={`pb-4 text-sm font-extrabold flex items-center gap-2 transition-all border-b-2 shrink-0 ${
                    activeTab === 'timeline'
                      ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                      : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <Clock className="w-4 h-4" />
                  Báo Cáo Chăm Sóc Thực Địa ({logs.length})
                </button>

                <button
                  onClick={() => setActiveTab('care')}
                  className={`pb-4 text-sm font-extrabold flex items-center gap-2 transition-all border-b-2 shrink-0 ${
                    activeTab === 'care'
                      ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                      : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  Yêu Cầu Chăm Sóc Đột Xuất ({careRequests.length})
                </button>

                <button
                  onClick={() => setActiveTab('delivery')}
                  className={`pb-4 text-sm font-extrabold flex items-center gap-2 transition-all border-b-2 shrink-0 ${
                    activeTab === 'delivery'
                      ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                      : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <Truck className="w-4 h-4 text-blue-500" />
                  Theo Dõi Giao Hàng & Thu Hoạch ({deliveries.length})
                </button>
              </div>

              {/* TAB 1: CULTIVATION JOURNAL TIMELINE */}
              {activeTab === 'timeline' && (
                <div className="p-6 sm:p-8 space-y-6">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                        <Clock className="w-5 h-5 text-teal-600" />
                        Báo Cáo Chăm Sóc Từ Kỹ Thuật Viên
                      </h3>
                      <p className="text-xs text-slate-500">
                        Hình ảnh chụp thực tế và báo cáo chăm sóc do kỹ thuật viên phụ trách luống {selectedItem.PlotCode} cập nhật sau mỗi ca làm việc
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => fetchLogs(selectedItem.CultivationId)}
                        leftIcon={<RefreshCw className="w-3.5 h-3.5 text-slate-500" />}
                        className="font-bold text-xs"
                      >
                        Làm Mới
                      </Button>
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => setIsCareModalOpen(true)}
                        leftIcon={<Sparkles className="w-3.5 h-3.5 text-white" />}
                        className="font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        Gửi Yêu Cầu Chăm Sóc Riêng
                      </Button>
                    </div>
                  </div>

                  {isLoadingLogs && (
                    <div className="py-12 text-center text-slate-500">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto text-emerald-500" />
                      <p className="text-xs mt-2 font-semibold">Đang tải lịch sử nhật ký...</p>
                    </div>
                  )}

                  {!isLoadingLogs && logs.length === 0 && (
                    <div className="py-12 text-center text-slate-500 space-y-2 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                      <Clock className="w-8 h-8 text-slate-400 mx-auto" />
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Chưa có báo cáo chăm sóc nào từ kỹ thuật viên</p>
                      <p className="text-xs text-slate-400 max-w-md mx-auto">
                        Đội ngũ kỹ thuật viên nông trại đang chăm sóc luống rau của bạn và sẽ sớm cập nhật hình ảnh, thông số thực tế sau ca làm việc.
                      </p>
                      <div className="pt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setIsCareModalOpen(true)}
                          leftIcon={<Sparkles className="w-3.5 h-3.5 text-amber-500" />}
                          className="text-xs font-bold"
                        >
                          Cần Kỹ Thuật Viên Chăm Sóc Ngay? Gửi Yêu Cầu
                        </Button>
                      </div>
                    </div>
                  )}

                  {!isLoadingLogs && logs.length > 0 && (
                    <div className="relative pl-6 sm:pl-8 space-y-8 before:absolute before:left-2 sm:before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-emerald-200 dark:before:bg-emerald-900">
                      {logs.map((log) => (
                        <div key={log.LogId} className="relative group">
                          {/* Dot on line */}
                          <div className="absolute -left-[27px] sm:-left-[31px] top-1.5 w-4 h-4 rounded-full bg-emerald-500 border-4 border-white dark:border-slate-900 shadow-sm group-hover:scale-125 transition-transform" />

                          <div className="bg-slate-50/70 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 space-y-3 transition-all hover:shadow-sm">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                {getActivityBadge(log.ActivityType)}
                                <span className="text-xs font-semibold text-slate-400">
                                  {formatDateTime(log.LogDate)}
                                </span>
                              </div>
                              {getHealthBadge(log.PlantHealthStatus)}
                            </div>

                            <div>
                              <h4 className="font-extrabold text-base text-slate-900 dark:text-white">
                                {log.Title}
                              </h4>
                              {log.Notes && (
                                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                                  {log.Notes}
                                </p>
                              )}
                            </div>

                            {/* Image evidence */}
                            {log.ImageUrl && (
                              <div className="pt-2">
                                <div
                                  className="w-36 h-28 sm:w-48 sm:h-36 rounded-xl overflow-hidden cursor-pointer shadow-sm hover:opacity-90 transition-opacity border border-slate-200 dark:border-slate-700"
                                  onClick={() => setPreviewImage(log.ImageUrl)}
                                >
                                  <img
                                    src={log.ImageUrl}
                                    alt={log.Title}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              </div>
                            )}

                            <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-200/60 dark:border-slate-700/40">
                              <span className="flex items-center gap-1.5">
                                <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                                Người thực hiện: <strong className="text-slate-600 dark:text-slate-300">{log.StaffName || 'Kỹ thuật viên PlotFarm'}</strong>
                              </span>
                              <span>Mã ghi chép: #{log.LogId}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: CARE REQUESTS */}
              {activeTab === 'care' && (
                <div className="p-6 sm:p-8 space-y-6">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-black text-slate-900 dark:text-white">
                        Yêu Cầu Chăm Sóc Đột Xuất (Care Requests)
                      </h3>
                      <p className="text-xs text-slate-500">
                        Gửi chỉ thị bổ sung phân bón, nhổ cỏ hoặc tưới tiêu trực tiếp cho người làm vườn
                      </p>
                    </div>

                    <Button
                      size="sm"
                      className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs"
                      onClick={() => setIsCareModalOpen(true)}
                    >
                      <Sparkles className="w-4 h-4 mr-1.5" /> Gửi Yêu Cầu Chăm Sóc Mới
                    </Button>
                  </div>

                  {careRequests.length === 0 ? (
                    <div className="py-12 text-center text-slate-500 space-y-2 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                      <Sparkles className="w-8 h-8 text-amber-500 mx-auto" />
                      <p className="text-sm font-bold">Bạn chưa có yêu cầu chăm sóc nào đang chờ xử lý</p>
                      <p className="text-xs text-slate-400">Nhấn nút bên trên để chỉ định nhân viên chăm sóc luống rau theo ý bạn.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {careRequests.map((req) => (
                        <div
                          key={req.RequestId}
                          className="bg-slate-50/80 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                              {req.ServiceType}
                            </span>
                            {getCareStatusBadge(req.Status)}
                          </div>

                          {req.CustomerNote && (
                            <div className="bg-white dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200/60 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-300">
                              <strong className="text-slate-800 dark:text-slate-100 block mb-0.5">Lời nhắn của bạn:</strong>
                              {req.CustomerNote}
                            </div>
                          )}

                          {req.ResultNote && (
                            <div className="bg-emerald-50 dark:bg-emerald-950/30 p-3 rounded-xl border border-emerald-200 dark:border-emerald-800/40 text-xs text-emerald-800 dark:text-emerald-300">
                              <strong className="block mb-0.5">Phản hồi từ kỹ thuật viên:</strong>
                              {req.ResultNote}
                            </div>
                          )}

                          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                            <span>Thời gian gửi: {formatDateTime(req.RequestedAt)}</span>
                            <span>Mã: #{req.RequestId}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: DELIVERY TRACKING */}
              {activeTab === 'delivery' && (
                <div className="p-6 sm:p-8 space-y-6">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-black text-slate-900 dark:text-white">
                        Theo Dõi Vận Chuyển Nông Sản (Delivery Tracking)
                      </h3>
                      <p className="text-xs text-slate-500">
                        Theo dõi hành trình rau hữu cơ từ lúc cắt tại vườn canh tác đến khi giao tới bàn ăn gia đình
                      </p>
                    </div>

                    <Button
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                      onClick={() => setIsHarvestModalOpen(true)}
                    >
                      <Package className="w-4 h-4 mr-1.5" /> Tạo Đơn Thu Hoạch Mới
                    </Button>
                  </div>

                  {deliveries.length === 0 ? (
                    <div className="py-12 text-center text-slate-500 space-y-2 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                      <Truck className="w-8 h-8 text-blue-500 mx-auto" />
                      <p className="text-sm font-bold">Chưa có đơn vận chuyển thu hoạch nào</p>
                      <p className="text-xs text-slate-400">
                        Khi rau đạt độ trưởng thành, bạn có thể bấm nút yêu cầu thu hoạch để nhận rau sạch tận nhà!
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {deliveries.map((del) => {
                        const stepIndex =
                          del.DeliveryStatus === 'DELIVERED'
                            ? 4
                            : del.DeliveryStatus === 'SHIPPING'
                            ? 3
                            : del.DeliveryStatus === 'PACKING'
                            ? 2
                            : 1;

                        return (
                          <div
                            key={del.DeliveryId}
                            className="bg-slate-50/80 dark:bg-slate-800/40 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-6"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-700">
                              <div>
                                <div className="flex items-center gap-2.5">
                                  <span className="font-mono text-sm font-extrabold text-emerald-600 bg-emerald-100 dark:bg-emerald-950 px-2.5 py-1 rounded-lg">
                                    {del.TrackingCode}
                                  </span>
                                  <Badge variant="info" size="sm">{del.CarrierName}</Badge>
                                </div>
                                <p className="text-xs text-slate-500 mt-1">
                                  Sản phẩm: <strong>{del.SeedName}</strong> • Sản lượng ước tính: <strong>{del.SizeM2 * del.ExpectedYieldKgPerM2} kg</strong>
                                </p>
                              </div>

                              <div className="text-right">
                                <span className="text-xs font-bold text-slate-400 block">Ngày yêu cầu:</span>
                                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                  {formatDateTime(del.RequestDate)}
                                </span>
                              </div>
                            </div>

                            {/* 4-Step Stepper */}
                            <div className="py-2">
                              <div className="grid grid-cols-4 gap-2 text-center">
                                {/* Step 1 */}
                                <div className="space-y-2">
                                  <div
                                    className={`w-8 h-8 rounded-full mx-auto flex items-center justify-center font-bold text-xs transition-colors ${
                                      stepIndex >= 1
                                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/30'
                                        : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                                    }`}
                                  >
                                    1
                                  </div>
                                  <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                                    Thu Hoạch
                                  </p>
                                  <span className="text-[10px] text-slate-400 block">Tại vườn</span>
                                </div>

                                {/* Step 2 */}
                                <div className="space-y-2">
                                  <div
                                    className={`w-8 h-8 rounded-full mx-auto flex items-center justify-center font-bold text-xs transition-colors ${
                                      stepIndex >= 2
                                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/30'
                                        : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                                    }`}
                                  >
                                    2
                                  </div>
                                  <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                                    Đóng Gói Khử Khuẩn
                                  </p>
                                  <span className="text-[10px] text-slate-400 block">Tiêu chuẩn VietGAP</span>
                                </div>

                                {/* Step 3 */}
                                <div className="space-y-2">
                                  <div
                                    className={`w-8 h-8 rounded-full mx-auto flex items-center justify-center font-bold text-xs transition-colors ${
                                      stepIndex >= 3
                                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/30'
                                        : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                                    }`}
                                  >
                                    3
                                  </div>
                                  <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                                    Đang Vận Chuyển
                                  </p>
                                  <span className="text-[10px] text-slate-400 block">Xe lạnh GHTK</span>
                                </div>

                                {/* Step 4 */}
                                <div className="space-y-2">
                                  <div
                                    className={`w-8 h-8 rounded-full mx-auto flex items-center justify-center font-bold text-xs transition-colors ${
                                      stepIndex >= 4
                                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/30'
                                        : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                                    }`}
                                  >
                                    4
                                  </div>
                                  <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                                    Đã Giao Tận Bàn Ăn
                                  </p>
                                  <span className="text-[10px] text-slate-400 block">Hoàn tất</span>
                                </div>
                              </div>
                            </div>

                            {/* Delivery Detail Box */}
                            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                              <div>
                                <span className="text-slate-400 block font-semibold">Người nhận:</span>
                                <strong className="text-slate-800 dark:text-slate-200">
                                  {del.RecipientName} • {del.PhoneNumber}
                                </strong>
                              </div>

                              <div>
                                <span className="text-slate-400 block font-semibold">Địa chỉ giao:</span>
                                <span className="text-slate-700 dark:text-slate-300">
                                  {del.DeliveryAddress}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* MODAL 1: GỬI YÊU CẦU CHĂM SÓC */}
      {isCareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 max-w-lg w-full space-y-6 shadow-2xl relative">
            <button
              onClick={() => setIsCareModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                Gửi Yêu Cầu Chăm Sóc Đột Xuất
              </h3>
              <p className="text-xs text-slate-500">
                Chỉ định kỹ thuật viên nông trại thực hiện bổ sung cho ô đất {selectedItem?.PlotCode}
              </p>
            </div>

            <form onSubmit={handleSubmitCareRequest} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                  Loại Dịch Vụ Cần Làm:
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    { id: 'BÓN PHÂN HỮU CƠ BỔ SUNG', title: '🌿 Bón Thêm Phân Trùn Quế & Vi Sinh', desc: 'Tăng cường chất dinh dưỡng kích thích ra rễ' },
                    { id: 'TƯỚI NƯỚC BỔ SUNG', title: '💧 Tưới Phun Sương Tăng Cường', desc: 'Bổ sung độ ẩm luống đất khi thời tiết hanh khô' },
                    { id: 'NHỔ CỎ BẮT SÂU THỦ CÔNG', title: '🐛 Nhổ Cỏ Dại & Bắt Sâu Bọ Thủ Công', desc: 'Đảm bảo 100% không dùng thuốc trừ sâu hóa học' },
                    { id: 'CHỤP ẢNH CẬN CẢNH', title: '📸 Chụp Ảnh Cận Cảnh Gốc Rau & Tán Lá', desc: 'Kỹ thuật viên chụp gửi ảnh chất lượng cao' },
                  ].map((srv) => (
                    <div
                      key={srv.id}
                      onClick={() => setCareServiceType(srv.id)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col gap-0.5 ${
                        careServiceType === srv.id
                          ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                      }`}
                    >
                      <span className="text-xs font-bold text-slate-900 dark:text-white">{srv.title}</span>
                      <span className="text-[11px] text-slate-400">{srv.desc}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                  Ghi chú hoặc dặn dò kỹ thuật viên:
                </label>
                <textarea
                  value={careNote}
                  onChange={(e) => setCareNote(e.target.value)}
                  placeholder="Ví dụ: Nhờ bạn xới nhẹ đất quanh gốc và kiểm tra giúp mình xem có sâu non ở mặt dưới lá không nhé..."
                  rows={3}
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-[11px] text-amber-800 dark:text-amber-300 flex items-start gap-2">
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  Yêu cầu chăm sóc đã bao gồm trong gói chăm sóc <strong>{selectedItem?.PackageName}</strong> (Miễn phí phụ phí phát sinh).
                </span>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsCareModalOpen(false)}>
                  Hủy Bỏ
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmittingCare}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  {isSubmittingCare ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Xác Nhận Gửi Yêu Cầu'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: YÊU CẦU THU HOẠCH & GIAO HÀNG */}
      {isHarvestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 max-w-lg w-full space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsHarvestModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Package className="w-5 h-5 text-emerald-600" />
                Yêu Cầu Thu Hoạch Nông Sản
              </h3>
              <p className="text-xs text-slate-500">
                Thu hoạch đợt rau sạch từ ô đất {selectedItem?.PlotCode} ({selectedItem?.SeedName})
              </p>
            </div>

            <form onSubmit={handleSubmitHarvestRequest} className="space-y-4">
              {/* Harvest Type */}
              <div className="space-y-2">
                <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                  Hình Thức Nhận Rau:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'GIAO_TAN_NOI', label: '🚚 Giao Tận Nhà' },
                    { id: 'NHAN_TAI_VUON', label: '🏡 Nhận Tại Vườn' },
                    { id: 'TANG_TU_THIEN', label: '❤️ Tặng Từ Thiện' },
                  ].map((type) => (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => setHarvestType(type.id as any)}
                      className={`p-2.5 rounded-xl border text-xs font-bold text-center transition-all ${
                        harvestType === type.id
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 shadow-sm'
                          : 'border-slate-200 dark:border-slate-800 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Yield Estimate */}
              <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 text-xs space-y-1">
                <div className="flex justify-between font-bold text-emerald-900 dark:text-emerald-200">
                  <span>Sản lượng thu hoạch dự kiến:</span>
                  <span className="text-sm">{(selectedItem?.SizeM2 || 12) * (selectedItem?.ExpectedYieldKgPerM2 || 2.5)} kg</span>
                </div>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                  Rau được cắt tươi vào sáng sớm, đóng gói khử trùng và gửi xe lạnh GHTK.
                </p>
              </div>

              {/* Recipient info */}
              {harvestType === 'GIAO_TAN_NOI' && (
                <div className="space-y-3 pt-1">
                  {/* Quick Address Picker */}
                  {addresses.length > 0 && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 block">
                        Chọn nhanh từ sổ địa chỉ của bạn:
                      </label>
                      <div className="flex gap-2 overflow-x-auto pb-1">
                        {addresses.map((addr) => (
                          <button
                            key={addr.addressId}
                            type="button"
                            onClick={() => {
                              setRecipientName(addr.recipientName);
                              setRecipientPhone(addr.phoneNumber);
                              const full = [addr.addressLine, addr.ward, addr.district, addr.province].filter(Boolean).join(', ');
                              setDeliveryAddress(full);
                            }}
                            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-[11px] font-semibold bg-slate-50 dark:bg-slate-800 hover:bg-emerald-50 shrink-0 text-left"
                          >
                            <span className="font-bold text-slate-800 dark:text-white block">{addr.recipientName}</span>
                            <span className="text-slate-500 text-[10px] truncate max-w-[160px] block">{addr.addressLine}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-[11px] font-bold text-slate-500 block">Tên người nhận:</label>
                      <input
                        type="text"
                        required
                        value={recipientName}
                        onChange={(e) => setRecipientName(e.target.value)}
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-500 block">Số điện thoại:</label>
                      <input
                        type="text"
                        required
                        value={recipientPhone}
                        onChange={(e) => setRecipientPhone(e.target.value)}
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-500 block">Địa chỉ nhận rau sạch:</label>
                    <input
                      type="text"
                      required
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành"
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="text-[11px] font-bold text-slate-500 block">Ghi chú giao hàng:</label>
                <input
                  type="text"
                  value={harvestNote}
                  onChange={(e) => setHarvestNote(e.target.value)}
                  placeholder="Ví dụ: Giao vào giờ hành chính, gọi trước 15 phút..."
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsHarvestModalOpen(false)}>
                  Đóng
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmittingHarvest}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  {isSubmittingHarvest ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Tạo Đơn Thu Hoạch & Giao Hàng'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: IMAGE PREVIEW */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-3xl w-full rounded-2xl overflow-hidden shadow-2xl border border-white/20">
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full hover:bg-black/80"
            >
              <X className="w-5 h-5" />
            </button>
            <img src={previewImage} alt="Preview" className="w-full max-h-[80vh] object-contain bg-black" />
          </div>
        </div>
      )}
    </div>
  );
}
