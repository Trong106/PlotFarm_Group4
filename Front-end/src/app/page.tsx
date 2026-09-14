'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Sprout,
  Video,
  Truck,
  MapPin,
  Sparkles,
  Award,
  ArrowRight,
  Clock,
  Check,
  ShieldCheck,
  Leaf,
  Activity,
  Trees,
} from 'lucide-react';
import Header from '@/components/Header';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { useAuthStore } from '@/store/useAuthStore';

interface CropInfo {
  name: string;
  category: string;
  growthDays: string;
  yieldKg: string;
  price: string;
  badge: string;
  badgeVariant: 'success' | 'warning' | 'info' | 'danger';
  description: string;
}

export default function LandingPage() {
  const { isAuthenticated, initAuth } = useAuthStore();
  const [selectedCropModal, setSelectedCropModal] = useState<CropInfo | null>(null);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  // Danh mục hạt giống tiêu biểu
  const featuredCrops: CropInfo[] = [
    {
      name: 'Cải Xoăn Kale Thủy Canh',
      category: 'Rau Ăn Lá',
      growthDays: '45-50 ngày',
      yieldKg: '8-12 kg / vụ',
      price: '180.000đ / luống',
      badge: 'Bán chạy nhất',
      badgeVariant: 'success',
      description: 'Siêu thực phẩm giàu vitamin C, canxi và chất chống oxy hóa. Canh tác chuẩn hữu cơ không hóa chất độc hại.',
    },
    {
      name: 'Cà Chua Bi Cherry Đỏ',
      category: 'Rau Ăn Quả',
      growthDays: '60-70 ngày',
      yieldKg: '15-20 kg / vụ',
      price: '220.000đ / luống',
      badge: 'Mọng nước, ngọt thanh',
      badgeVariant: 'warning',
      description: 'Giống cà chua bi ngọt lịm, chăm sóc cẩn thận dưới giàn che và hệ thống tưới nhỏ giọt tự động 24/7.',
    },
    {
      name: 'Xà Lách Romaine Hữu Cơ',
      category: 'Rau Ăn Lá',
      growthDays: '35-40 ngày',
      yieldKg: '10-14 kg / vụ',
      price: '150.000đ / luống',
      badge: 'Thu hoạch nhanh',
      badgeVariant: 'info',
      description: 'Lá xanh giòn ngọt, hoàn hảo cho món salad gia đình. Cây phát triển nhanh, xanh tốt và thích ứng tốt với thời tiết mát mẻ.',
    },
    {
      name: 'Dưa Leo Baby Siêu Trái',
      category: 'Rau Ăn Quả',
      growthDays: '40-45 ngày',
      yieldKg: '18-25 kg / vụ',
      price: '190.000đ / luống',
      badge: 'Năng suất cao',
      badgeVariant: 'success',
      description: 'Trái nhỏ giòn ngọt, vỏ mỏng không hạt. Thu hoạch liên tục 3 đợt mỗi vụ và giao tươi ngay trong ngày.',
    },
  ];

  // 4 Bước từ thuê đất đến nhận rau
  const workflowSteps = [
    {
      step: '01',
      title: 'Chọn Ô Đất & Giống Rau',
      description: 'Lựa chọn vị trí ô đất mong muốn trên bản đồ trang trại 3D, chọn hạt giống phù hợp mùa vụ và sở thích ẩm thực gia đình.',
      icon: <MapPin className="w-6 h-6 text-emerald-500" />,
      tag: 'Bản đồ trực quan',
    },
    {
      step: '02',
      title: 'Đăng Ký Gói Canh Tác',
      description: 'Đội ngũ kỹ thuật viên giàu kinh nghiệm tại trang trại bắt đầu làm đất, gieo hạt, bón phân hữu cơ và bắt sâu hàng ngày.',
      icon: <Sprout className="w-6 h-6 text-teal-500" />,
      tag: 'Quy trình chuẩn VietGAP',
    },
    {
      step: '03',
      title: 'Giám Sát Sinh Trưởng 24/7',
      description: 'Theo dõi tiến trình sinh trưởng từng ngày qua Camera trực tiếp và nhận thông báo cập nhật độ ẩm, nhiệt độ theo thời gian thực.',
      icon: <Video className="w-6 h-6 text-cyan-500" />,
      tag: 'Camera quan sát & Nhiệt độ',
    },
    {
      step: '04',
      title: 'Thu Hoạch & Giao Tận Bếp',
      description: 'Khi rau đạt độ chín ngon nhất, trang trại thu hoạch vào sáng sớm, đóng gói tiêu chuẩn và vận chuyển hỏa tốc đến bàn ăn gia đình.',
      icon: <Truck className="w-6 h-6 text-emerald-600" />,
      tag: 'Tươi ngon trong ngày',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col font-sans transition-colors duration-300">
      <Header />

      <main className="flex-1 space-y-24 pb-24">
        {/* ========================================================================= */}
        {/* 1. HERO SECTION: GIỚI THIỆU MÔ HÌNH CLOUD FARMING */}
        {/* ========================================================================= */}
        <section className="relative overflow-hidden pt-12 sm:pt-20 lg:pt-28 pb-12">
          {/* Ambient Glows */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[350px] bg-emerald-500/15 dark:bg-emerald-500/10 blur-[130px] rounded-full pointer-events-none" />
          <div className="absolute top-1/3 right-10 w-[450px] h-[300px] bg-teal-500/15 dark:bg-teal-500/10 blur-[120px] rounded-full pointer-events-none" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-100/70 dark:bg-emerald-950/60 border border-emerald-400/30 text-emerald-800 dark:text-emerald-300 text-xs sm:text-sm font-semibold shadow-sm backdrop-blur-md">
              <Sparkles className="w-4 h-4 text-emerald-500" />
              Nền Tảng Nông Nghiệp Kỹ Thuật Số Chuẩn VietGAP Đầu Tiên Tại Việt Nam
            </div>

            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.15] max-w-5xl mx-auto">
              Thuê Đất Trồng Rau Online,{' '}
              <span className="bg-gradient-to-r from-emerald-600 via-teal-500 to-green-500 bg-clip-text text-transparent">
                Nhận Rau Sạch Tận Nhà
              </span>
            </h1>

            <p className="text-base sm:text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed">
              Trải nghiệm sở hữu ô đất nông nghiệp thực tế ngay trên điện thoại của bạn. Đội ngũ kỹ sư chăm sóc tận tâm hàng ngày,
              camera livestream 24/7 và nông sản tươi sạch giao tận bàn ăn gia đình bạn.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              <Link href={isAuthenticated ? '/my-farm' : '/register'}>
                <Button
                  variant="primary"
                  size="lg"
                  className="shadow-xl shadow-emerald-500/25 group font-bold text-base px-8 py-3.5"
                  rightIcon={<ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
                >
                  {isAuthenticated ? 'Vào Khu Vườn Của Tôi' : 'Thuê Ô Đất Ngay Bây Giờ'}
                </Button>
              </Link>

              <a href="#quy-trinh">
                <Button variant="outline" size="lg" className="font-semibold text-base px-8 py-3.5">
                  Xem 4 Bước Hoạt Động
                </Button>
              </a>
            </div>

            {/* Metrics Counter Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 pt-10 border-t border-slate-200/80 dark:border-slate-800/80 max-w-4xl mx-auto">
              <div className="p-4 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800/70 backdrop-blur-sm">
                <p className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">500+</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Ô đất đang canh tác</p>
              </div>

              <div className="p-4 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800/70 backdrop-blur-sm">
                <p className="text-2xl sm:text-3xl font-black text-teal-600 dark:text-teal-400">24/7</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Camera quan sát 24/7</p>
              </div>

              <div className="p-4 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800/70 backdrop-blur-sm">
                <p className="text-2xl sm:text-3xl font-black text-blue-600 dark:text-blue-400">100%</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Hữu cơ không hóa chất</p>
              </div>

              <div className="p-4 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800/70 backdrop-blur-sm">
                <p className="text-2xl sm:text-3xl font-black text-amber-500">2-4 Giờ</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Giao rau sau thu hoạch</p>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 2. SECTION: MÔ HÌNH CLOUD FARMING HOẠT ĐỘNG NHƯ THẾ NÀO */}
        {/* ========================================================================= */}
        <section id="mo-hinh" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-24">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <Badge variant="success" size="sm" className="font-bold">
              Mô Hình Đột Phá
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Cloud Farming Là Gì?
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base leading-relaxed">
              Chúng tôi xóa bỏ mọi rào cản về diện tích đất, thời gian chăm sóc và kỹ thuật canh tác, giúp bạn tận hưởng trọn vẹn niềm vui có vườn rau riêng.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card variant="glass" className="hover:-translate-y-1 transition-all duration-300 border-emerald-500/20">
              <CardHeader className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                  <MapPin className="w-6 h-6" />
                </div>
                <CardTitle className="text-lg font-bold text-slate-900 dark:text-slate-100">Ô Đất Số Hóa</CardTitle>
                <CardDescription className="text-xs leading-relaxed">
                  Mỗi ô đất trên hệ thống được định danh tọa độ GPS thực tế tại nông trại Củ Chi với đầy đủ thông số thổ nhưỡng.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card variant="glass" className="hover:-translate-y-1 transition-all duration-300 border-teal-500/20">
              <CardHeader className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-teal-100 dark:bg-teal-950/80 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold">
                  <Sprout className="w-6 h-6" />
                </div>
                <CardTitle className="text-lg font-bold text-slate-900 dark:text-slate-100">Kỹ Sư Canh Tác Tận Tâm</CardTitle>
                <CardDescription className="text-xs leading-relaxed">
                  Nông dân giàu kinh nghiệm trực tiếp tưới tiêu, bón phân hữu cơ và tỉa cành bắt sâu sinh học theo tiêu chuẩn VietGAP.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card variant="glass" className="hover:-translate-y-1 transition-all duration-300 border-cyan-500/20">
              <CardHeader className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-cyan-100 dark:bg-cyan-950/80 text-cyan-600 dark:text-cyan-400 flex items-center justify-center font-bold">
                  <Video className="w-6 h-6" />
                </div>
                <CardTitle className="text-lg font-bold text-slate-900 dark:text-slate-100">Camera Quan Sát 24/7</CardTitle>
                <CardDescription className="text-xs leading-relaxed">
                  Quan sát trực tiếp luống rau qua Camera 24/7 và theo dõi nhiệt độ môi trường bất kỳ lúc nào ngay trên điện thoại.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card variant="glass" className="hover:-translate-y-1 transition-all duration-300 border-green-500/20">
              <CardHeader className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-green-100 dark:bg-green-950/80 text-green-600 dark:text-green-400 flex items-center justify-center font-bold">
                  <Truck className="w-6 h-6" />
                </div>
                <CardTitle className="text-lg font-bold text-slate-900 dark:text-slate-100">Giao Rau Tận Cửa</CardTitle>
                <CardDescription className="text-xs leading-relaxed">
                  Rau được thu hoạch sáng sớm, khử khuẩn ozone, đóng gói cẩn thận và giao tận cửa nhà bạn chỉ trong 2-4 tiếng.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 3. SECTION: 4 BƯỚC TỪ THUÊ ĐẤT ĐẾN NHẬN RAU TẬN BẾP */}
        {/* ========================================================================= */}
        <section id="quy-trinh" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-24">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <Badge variant="info" size="sm" className="font-bold">
              Quy Trình Khép Kín
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              4 Bước Sở Hữu Mảnh Vườn Xanh Của Riêng Bạn
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base">
              Chỉ với vài thao tác đơn giản trên website, bạn đã có ngay một ô đất trồng rau sạch được chăm sóc bởi đội ngũ chuyên nghiệp.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
            {workflowSteps.map((step, idx) => (
              <div
                key={step.step}
                className="relative flex flex-col p-6 rounded-3xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800/80 shadow-lg hover:shadow-xl transition-all duration-300 group"
              >
                {/* Step badge top right */}
                <span className="absolute top-6 right-6 text-3xl font-black text-slate-200 dark:text-slate-800 group-hover:text-emerald-500/20 transition-colors">
                  {step.step}
                </span>

                {/* Icon Container */}
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  {step.icon}
                </div>

                <Badge variant="neutral" size="sm" className="w-fit mb-3 text-emerald-700 dark:text-emerald-300">
                  {step.tag}
                </Badge>

                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">
                  {step.title}
                </h3>

                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed flex-1">
                  {step.description}
                </p>

                {/* Bottom Step Indicator */}
                <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  <Check className="w-4 h-4 text-emerald-500" />
                  <span>Bước {idx + 1}/4 Hoàn tất</span>
                </div>
              </div>
            ))}
          </div>

          {/* CTA Banner inside Workflow Section */}
          <div className="mt-12 text-center">
            <Link href={isAuthenticated ? '/my-farm' : '/register'}>
              <Button variant="primary" size="lg" className="shadow-lg shadow-emerald-500/20">
                Bắt Đầu Ngay Với Ô Đất Đầu Tiên
              </Button>
            </Link>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 4. SECTION: DANH MỤC NÔNG SẢN TIÊU BIỂU */}
        {/* ========================================================================= */}
        <section id="giong-rau" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-24">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-12">
            <div>
              <Badge variant="warning" size="sm" className="font-bold mb-2">
                Nông Sản Mùa Vụ
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Giống Rau Sạch Khuyên Dùng
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-1">
                Các giống rau được chọn lọc kỹ càng, thích nghi tối ưu với khí hậu và cho năng suất cao nhất.
              </p>
            </div>

            <Link href={isAuthenticated ? '/my-farm' : '/register'}>
              <Button variant="outline" size="sm" rightIcon={<ArrowRight className="w-4 h-4" />}>
                Xem Toàn Bộ Hạt Giống
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredCrops.map((crop) => (
              <Card
                key={crop.name}
                variant="glass"
                className="overflow-hidden border-slate-200 dark:border-slate-800 flex flex-col justify-between hover:border-emerald-500/50 transition-colors"
              >
                <div className="p-6 space-y-4">
                  <div className="flex justify-between items-start">
                    <Badge variant={crop.badgeVariant} size="sm">
                      {crop.badge}
                    </Badge>
                    <span className="text-xs font-semibold text-slate-400">{crop.category}</span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{crop.name}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                      {crop.description}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/60 space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-600 dark:text-slate-300">
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-emerald-500" /> Thời gian:</span>
                      <span className="font-semibold">{crop.growthDays}</span>
                    </div>
                    <div className="flex justify-between text-slate-600 dark:text-slate-300">
                      <span className="flex items-center gap-1"><Sprout className="w-3.5 h-3.5 text-teal-500" /> Sản lượng:</span>
                      <span className="font-semibold">{crop.yieldKg}</span>
                    </div>
                  </div>
                </div>

                <CardContent className="pt-0 pb-6">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full text-xs font-semibold"
                    onClick={() => setSelectedCropModal(crop)}
                  >
                    Xem Chi Tiết Giống
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 5. SECTION: CAM KẾT CHẤT LƯỢNG & BẢO HIỂM MÙA VỤ */}
        {/* ========================================================================= */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-slate-900 via-[#0a121e] to-emerald-950/80 text-white border border-emerald-500/20 shadow-2xl relative overflow-hidden">
            <div className="max-w-3xl space-y-6 relative z-10">
              <Badge variant="success" size="sm" className="font-bold">
                Chính Sách Bảo Vệ Quyền Lợi Khách Hàng
              </Badge>

              <h2 className="text-2xl sm:text-4xl font-black tracking-tight">
                Cam Kết Nông Nghiệp Xanh & Bảo Hiểm Rủi Ro Mùa Vụ
              </h2>

              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                Nông nghiệp không thể tránh khỏi các yếu tố thiên nhiên bất thường. Tại PlotFarm, nếu mùa vụ của bạn bị ảnh hưởng do sâu bệnh hoặc thời tiết bất lợi,
                hệ thống cam kết <strong>tự động gieo lại lứa rau mới hoàn toàn miễn phí</strong> và gia hạn hợp đồng thuê đất cho bạn.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 text-xs">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                  <p className="font-bold text-emerald-400 text-sm">Gieo Lại Miễn Phí</p>
                  <p className="text-slate-400">Tự động kích hoạt khi có sự cố sâu hại hoặc cây chết</p>
                </div>
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                  <p className="font-bold text-teal-400 text-sm">Đền Bù Sản Lượng</p>
                  <p className="text-slate-400">Bảo đảm tối thiểu 80% sản lượng rau cam kết ban đầu</p>
                </div>
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                  <p className="font-bold text-cyan-400 text-sm">Minh Bạch Tuyệt Đối</p>
                  <p className="text-slate-400">Xem ảnh nghiệm thu thực tế từ kỹ thuật viên phụ trách</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 6. CALL TO ACTION CUỐI TRANG */}
        {/* ========================================================================= */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-tr from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/20 border border-emerald-500/20 shadow-lg space-y-6">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Sẵn Sàng Sở Hữu Mảnh Vườn Xanh Của Riêng Bạn?
            </h2>
            <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base max-w-2xl mx-auto">
              Tham gia cộng đồng hơn 500 hộ gia đình đang chủ động nguồn rau sạch hữu cơ mỗi ngày cùng PlotFarm.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              <Link href={isAuthenticated ? '/my-farm' : '/register'}>
                <Button variant="primary" size="lg" className="font-bold px-8 shadow-lg shadow-emerald-500/25">
                  {isAuthenticated ? 'Truy Cập Ô Đất Canh Tác' : 'Đăng Ký Tài Khoản Ngay'}
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* ========================================================================= */}
      {/* 7. FOOTER CHUYÊN NGHIỆP */}
      {/* ========================================================================= */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-3 md:col-span-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-white flex items-center justify-center font-black">
                  PF
                </div>
                <span className="font-extrabold text-lg text-slate-900 dark:text-slate-100">PlotFarm</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm leading-relaxed">
                Nền tảng cho thuê ô đất nông nghiệp kỹ thuật số và canh tác nông sản sạch trực tuyến hàng đầu Việt Nam.
                Đem thiên nhiên xanh tươi về tới từng bữa cơm gia đình bạn.
              </p>
            </div>

            <div className="space-y-2 text-xs">
              <p className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Khám Phá</p>
              <ul className="space-y-1.5 text-slate-500 dark:text-slate-400">
                <li>
                  <a href="#mo-hinh" className="hover:text-emerald-500 transition-colors">Mô hình Cloud Farming</a>
                </li>
                <li>
                  <a href="#quy-trinh" className="hover:text-emerald-500 transition-colors">Quy trình 4 bước</a>
                </li>
                <li>
                  <a href="#giong-rau" className="hover:text-emerald-500 transition-colors">Danh mục giống rau sạch</a>
                </li>
                <li>
                  <Link href="/my-farm" className="hover:text-emerald-500 transition-colors">Khu vườn của tôi</Link>
                </li>
              </ul>
            </div>

            <div className="space-y-2 text-xs">
              <p className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Hỗ Trợ & Liên Hệ</p>
              <ul className="space-y-1.5 text-slate-500 dark:text-slate-400">
                <li>Hotline: 1900 888 999 (24/7)</li>
                <li>Email: hotro@plotfarm.vn</li>
                <li>Trang trại: Khu Nông nghiệp Công nghệ cao Củ Chi, TP. Hồ Chí Minh</li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
            © {new Date().getFullYear()} PlotFarm Team 4. Bảo lưu mọi quyền.
          </div>
        </div>
      </footer>

      {/* Modal Chi Tiết Giống Rau */}
      <Modal
        isOpen={Boolean(selectedCropModal)}
        onClose={() => setSelectedCropModal(null)}
        title={selectedCropModal?.name || 'Chi Tiết Hạt Giống'}
        footer={
          <Button variant="primary" size="sm" onClick={() => setSelectedCropModal(null)}>
            Đóng
          </Button>
        }
      >
        {selectedCropModal && (
          <div className="space-y-4 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <span className="font-bold text-emerald-600 dark:text-emerald-400">{selectedCropModal.category}</span>
              <Badge variant={selectedCropModal.badgeVariant} size="sm">
                {selectedCropModal.badge}
              </Badge>
            </div>
            <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
              {selectedCropModal.description}
            </p>
            <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/80 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Chu kỳ sinh trưởng:</span>
                <span className="font-semibold text-slate-900 dark:text-white">{selectedCropModal.growthDays}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Sản lượng dự kiến:</span>
                <span className="font-semibold text-slate-900 dark:text-white">{selectedCropModal.yieldKg}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Chi phí hạt giống & gieo trồng:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">{selectedCropModal.price}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Tiêu chuẩn canh tác:</span>
                <span className="font-semibold text-slate-900 dark:text-white">VietGAP / 100% Organic</span>
              </div>
            </div>
            <div className="pt-2">
              <Link href={isAuthenticated ? '/my-farm' : '/register'} className="block">
                <Button variant="primary" size="sm" className="w-full">
                  Chọn Trồng Giống Này
                </Button>
              </Link>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
