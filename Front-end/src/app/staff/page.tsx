'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Sprout,
  CheckCircle2,
  Clock,
  AlertCircle,
  Calendar,
  Layers,
  Sparkles,
  Camera,
  MapPin,
  ClipboardList,
  ShieldCheck,
  RefreshCw,
  Send,
  Loader2,
  Check,
  ChevronRight,
  Eye,
  Info,
  Droplets,
  Activity
} from 'lucide-react';
import Header from '@/components/Header';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent } from '@/components/ui/Card';
import { useAuthStore } from '@/store/useAuthStore';

interface AssignedArea {
  AssignmentId: number;
  StaffId: number;
  AreaId: number;
  AreaCode: string;
  AreaName: string;
  SoilType: string;
  Shift: string;
  AssignedDate: string;
  Notes?: string;
}

interface PlotInfo {
  PlotId: number;
  PlotCode: string;
  AreaName: string;
  Status: string;
  SizeM2: number;
  SoilPH: number;
  StandardHumidity: number;
}

interface CultivationItem {
  CultivationId: number;
  PlotCode: string;
  SeedName: string;
  ProgressPercent: number;
  CultivationStatus: string;
  StartDate: string;
  ExpectedHarvestDate: string;
}

export default function StaffPortalPage() {
  const router = useRouter();
  const { user, token, isAuthenticated, initAuth } = useAuthStore();

  const [activeTab, setActiveTab] = useState<'plots' | 'requests' | 'add_log'>('plots');
  const [assignments, setAssignments] = useState<AssignedArea[]>([]);
  const [plots, setPlots] = useState<PlotInfo[]>([]);
  const [cultivations, setCultivations] = useState<CultivationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // New Log Form
  const [selectedCultivationId, setSelectedCultivationId] = useState<number | ''>('');
  const [activityType, setActivityType] = useState('TUOI_NUOC');
  const [logTitle, setLogTitle] = useState('');
  const [logNotes, setLogNotes] = useState('');
  const [logImageUrl, setLogImageUrl] = useState('https://images.unsplash.com/photo-1585320806297-9794b3e4eeae');
  const [plantHealth, setPlantHealth] = useState('KHOE_MANH');
  const [isSubmittingLog, setIsSubmittingLog] = useState(false);
  const [logSuccessMsg, setLogSuccessMsg] = useState<string | null>(null);

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
      if (role !== 'staff' && role !== 'admin' && user.roleId !== 2 && user.roleId !== 1) {
        router.replace('/my-farm');
      }
    }
  }, [user, token, router]);

  const fetchData = useCallback(async () => {
    if (!token) return;
    try {
      setIsLoading(true);

      // 1. Fetch plots
      const plotsRes = await fetch('http://localhost:5000/api/plots/grid');
      const plotsData = await plotsRes.json();
      if (plotsData.success && Array.isArray(plotsData.data)) {
        setPlots(plotsData.data);
      }

      // 2. Fetch staff assignments
      const assignRes = await fetch('http://localhost:5000/api/admin/staff-assignments', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (assignRes.ok) {
        const assignData = await assignRes.json();
        if (assignData.success && Array.isArray(assignData.data)) {
          // If staff, filter by their own assignments (or show all if admin)
          const myAssignments = user?.role === 'Admin' 
            ? assignData.data 
            : assignData.data.filter((a: any) => a.StaffId === user?.userId);
          setAssignments(myAssignments);
        }
      }

      // 3. Fetch all active cultivations
      const cultRes = await fetch('http://localhost:5000/api/cultivations', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (cultRes.ok) {
        const cultData = await cultRes.json();
        if (cultData.success && Array.isArray(cultData.data)) {
          setCultivations(cultData.data);
          if (cultData.data.length > 0 && !selectedCultivationId) {
            setSelectedCultivationId(cultData.data[0].CultivationId);
          }
        }
      }
    } catch (err) {
      console.error('Failed to load staff data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [token, user, selectedCultivationId]);

  useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [token, fetchData]);

  const handleSubmitLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCultivationId || !logTitle.trim()) {
      alert('Vui lòng chọn ô đất và nhập tiêu đề nhật ký');
      return;
    }

    try {
      setIsSubmittingLog(true);
      setLogSuccessMsg(null);

      const res = await fetch(`http://localhost:5000/api/cultivations/${selectedCultivationId}/logs`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          activityType,
          title: logTitle.trim(),
          notes: logNotes.trim(),
          imageUrl: logImageUrl.trim() || null,
          videoUrl: null,
          plantHealthStatus: plantHealth,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setLogSuccessMsg('Đã đăng nhật ký kỹ thuật và đồng bộ thông báo tới khách hàng thành công!');
        setLogTitle('');
        setLogNotes('');
        setTimeout(() => setLogSuccessMsg(null), 5000);
      } else {
        alert(data.message || 'Gửi nhật ký thất bại');
      }
    } catch (err) {
      console.error('Error submitting log:', err);
      alert('Có lỗi xảy ra khi gửi nhật ký');
    } finally {
      setIsSubmittingLog(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Banner Top */}
        <div className="rounded-3xl bg-gradient-to-r from-teal-800 via-emerald-800 to-slate-900 text-white p-6 sm:p-8 shadow-xl relative overflow-hidden">
          <div className="absolute right-[-40px] bottom-[-40px] w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-bold border border-teal-500/30">
                <Sprout className="w-3.5 h-3.5" />
                CỔNG KỸ THUẬT VIÊN NÔNG TRẠI
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                Xin chào, {user?.fullName || 'Kỹ Thuật Viên'}!
              </h1>
              <p className="text-sm text-teal-100/80 max-w-xl">
                Trực tiếp theo dõi các phân khu phụ trách, ghi nhận quá trình sinh trưởng của rau và phản hồi yêu cầu chăm sóc từ khách hàng.
              </p>
            </div>

            {/* Quick Stats Banner */}
            <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 shrink-0">
              <div className="text-center px-3 border-r border-white/10">
                <p className="text-xs text-teal-200 font-medium">Phân khu gán</p>
                <p className="text-xl font-extrabold text-white">{assignments.length} Khu</p>
              </div>
              <div className="text-center px-3 border-r border-white/10">
                <p className="text-xs text-teal-200 font-medium">Ô đang trồng</p>
                <p className="text-xl font-extrabold text-emerald-300">{cultivations.length} Ô</p>
              </div>
              <div className="text-center px-3">
                <p className="text-xs text-teal-200 font-medium">Tổng ô đất</p>
                <p className="text-xl font-extrabold text-white">{plots.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Assigned Areas List */}
        <div className="space-y-3">
          <h2 className="text-lg font-extrabold flex items-center gap-2">
            <MapPin className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            Phân Khu Được Giao Phụ Trách
          </h2>
          {assignments.length === 0 ? (
            <Card className="border-dashed border-slate-300 dark:border-slate-800">
              <CardContent className="p-6 text-center text-slate-500 text-sm">
                Bạn chưa được chỉ định phân khu cụ thể. Vui lòng liên hệ Admin để gán phân khu quản lý.
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {assignments.map((item) => (
                <div
                  key={item.AssignmentId}
                  className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 text-xs font-black rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200/60">
                      {item.AreaCode}
                    </span>
                    <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {item.Shift || 'Toàn thời gian'}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-base">{item.AreaName}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Loại đất: {item.SoilType || 'Đất đỏ bazan hữu cơ'}</p>
                  </div>
                  {item.Notes && (
                    <p className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-950/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                      📌 {item.Notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6">
          <button
            onClick={() => setActiveTab('plots')}
            className={`pb-3 text-sm font-bold border-b-2 transition-all ${
              activeTab === 'plots'
                ? 'border-teal-600 text-teal-600 dark:text-teal-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Ô Đất Đang Canh Tác ({cultivations.length})
          </button>
          <button
            onClick={() => setActiveTab('add_log')}
            className={`pb-3 text-sm font-bold border-b-2 transition-all ${
              activeTab === 'add_log'
                ? 'border-teal-600 text-teal-600 dark:text-teal-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Ghi Nhật Ký Đồng Ruộng
          </button>
        </div>

        {/* Tab 1: Ô đất đang canh tác */}
        {activeTab === 'plots' && (
          <div className="space-y-4">
            {isLoading ? (
              <div className="p-12 text-center text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-teal-600" />
                Đang tải dữ liệu canh tác...
              </div>
            ) : cultivations.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-slate-500">
                  Hiện chưa có ô đất nào trong tình trạng gieo trồng cần xử lý.
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {cultivations.map((cult) => (
                  <div
                    key={cult.CultivationId}
                    className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 hover:border-teal-500/50 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
                          {cult.PlotCode}
                        </span>
                        <span className="px-2 py-0.5 text-[10px] font-extrabold rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/50">
                          {cult.CultivationStatus}
                        </span>
                      </div>
                      <span className="text-xs font-bold text-slate-500">
                        {cult.ProgressPercent}% Chu kỳ
                      </span>
                    </div>

                    <div className="space-y-1">
                      <p className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <Sprout className="w-4 h-4 text-emerald-500" />
                        {cult.SeedName}
                      </p>
                      <p className="text-xs text-slate-500 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" /> Gieo trồng: {new Date(cult.StartDate).toLocaleDateString('vi-VN')}
                      </p>
                      <p className="text-xs text-slate-500 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-amber-500" /> Thu hoạch dự kiến: {new Date(cult.ExpectedHarvestDate).toLocaleDateString('vi-VN')}
                      </p>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 transition-all duration-500"
                          style={{ width: `${cult.ProgressPercent}%` }}
                        />
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedCultivationId(cult.CultivationId);
                          setActiveTab('add_log');
                        }}
                        className="w-full text-xs font-bold text-teal-600 border-teal-200 dark:border-teal-800 hover:bg-teal-50 dark:hover:bg-teal-950/40"
                      >
                        Ghi nhật ký ô này
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Ghi nhật ký đồng ruộng */}
        {activeTab === 'add_log' && (
          <Card className="border-slate-200/80 dark:border-slate-800 shadow-sm max-w-3xl">
            <CardContent className="p-6 sm:p-8">
              <form onSubmit={handleSubmitLog} className="space-y-6">
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <ClipboardList className="w-5 h-5 text-teal-600" />
                    Đăng Tải Nhật Ký Chăm Sóc Hiện Trường
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Cập nhật các hoạt động kỹ thuật (tưới nước, bón phân, phòng bệnh). Thông tin sẽ hiển thị trực tiếp trên dòng thời gian khách hàng.
                  </p>
                </div>

                {logSuccessMsg && (
                  <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700/50 text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    {logSuccessMsg}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Chọn ô đất */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Chọn ô đất gieo trồng *
                    </label>
                    <select
                      value={selectedCultivationId}
                      onChange={(e) => setSelectedCultivationId(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-semibold focus:ring-2 focus:ring-teal-500 outline-none"
                    >
                      {cultivations.map((c) => (
                        <option key={c.CultivationId} value={c.CultivationId}>
                          {c.PlotCode} - {c.SeedName} ({c.ProgressPercent}%)
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Loại công việc */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Hành động kỹ thuật *
                    </label>
                    <select
                      value={activityType}
                      onChange={(e) => setActivityType(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-semibold focus:ring-2 focus:ring-teal-500 outline-none"
                    >
                      <option value="TUOI_NUOC">Tưới nước ẩm gốc rau</option>
                      <option value="BON_PHAN">Bón phân hữu cơ vi sinh</option>
                      <option value="BAT_SAU_TIA_LA">Tỉa lá úa & Bắt sâu thủ công</option>
                      <option value="DO_DO_PH_DAT">Đo đạc chỉ số pH và độ ẩm đất</option>
                      <option value="KIEM_TRA_DINH_KY">Kiểm tra sinh trưởng định kỳ</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Tình trạng sức khỏe */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Tình trạng rau củ *
                    </label>
                    <select
                      value={plantHealth}
                      onChange={(e) => setPlantHealth(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-semibold focus:ring-2 focus:ring-teal-500 outline-none"
                    >
                      <option value="KHOE_MANH">Khỏe mạnh - Đang vươn lá tốt</option>
                      <option value="CAN_THEO_DOI">Cần theo dõi thêm dinh dưỡng</option>
                      <option value="PHAT_TRIEN_NHANH">Phát triển nhanh - Chuẩn bị thu hoạch</option>
                    </select>
                  </div>

                  {/* Tiêu đề ngắn */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Tiêu đề công việc *
                    </label>
                    <input
                      type="text"
                      value={logTitle}
                      onChange={(e) => setLogTitle(e.target.value)}
                      placeholder="Ví dụ: Bổ sung vi sinh hữu cơ sáng sớm"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                    />
                  </div>
                </div>

                {/* Ghi chú chi tiết */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Ghi chú chi tiết quá trình chăm sóc
                  </label>
                  <textarea
                    rows={3}
                    value={logNotes}
                    onChange={(e) => setLogNotes(e.target.value)}
                    placeholder="Mô tả các công việc đã thực hiện trên ô đất, tình trạng lá, độ ẩm thực tế..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                  />
                </div>

                {/* Link hình ảnh */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Hình ảnh chụp thực tế (URL)
                  </label>
                  <input
                    type="text"
                    value={logImageUrl}
                    onChange={(e) => setLogImageUrl(e.target.value)}
                    placeholder="Nhập URL ảnh chụp vườn rau"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-teal-500 outline-none font-mono text-xs"
                  />
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={isSubmittingLog}
                    leftIcon={isSubmittingLog ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    className="bg-teal-600 hover:bg-teal-700 text-white font-bold"
                  >
                    {isSubmittingLog ? 'Đang gửi nhật ký...' : 'Xác Nhận & Cập Nhật'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
