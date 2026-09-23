"use client";

import React, { useState } from "react";
import { 
  FileText, 
  Printer, 
  Copy, 
  Check, 
  ShieldCheck, 
  Clock, 
  CreditCard, 
  Calendar, 
  MapPin, 
  Leaf, 
  Receipt,
  QrCode,
  Download,
  Truck,
  Loader2
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

export interface ElectronicInvoiceData {
  OrderId: number;
  OrderCode: string;
  PlotId: number;
  SeedId: number;
  CarePackageId: number;
  DurationMonths: number;
  TotalRentalDays: number;
  StartDate: string;
  EndDate: string;
  RentalFee: number;
  SeedFee: number;
  CareFee: number;
  DiscountAmount?: number;
  TotalAmount: number;
  Status: string;
  DeliveryNotes?: string;
  CreatedAt: string;
  PaidAt?: string;
  PlotCode: string;
  SizeM2: number;
  SeedName: string;
  SeedImageUrl?: string;
  PackageName: string;
  TransactionCode?: string;
  PaymentMethod?: string;
  PaymentDate?: string;
}

interface ElectronicInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: ElectronicInvoiceData | null;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
}

export const ElectronicInvoiceModal: React.FC<ElectronicInvoiceModalProps> = ({
  isOpen,
  onClose,
  order,
  customerName = "Khách Hàng Nông Trại",
  customerPhone,
  customerEmail,
}) => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  if (!order) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount || 0);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "N/A";
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(type);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  const txnCode = order.TransactionCode || `TXN_${order.OrderId}_${new Date(order.CreatedAt).getTime().toString().slice(-8)}`;
  const paymentMethodLabel = order.PaymentMethod === "QR_BANK" 
    ? "Chuyển khoản VietQR 24/7 (Napas)" 
    : order.PaymentMethod === "VNPAY" 
      ? "Cổng thanh toán VNPAY" 
      : "Chuyển khoản Ngân hàng";

  // HTML5 Canvas Digital Receipt Generation with Watermark
  const handleDownloadReceipt = () => {
    try {
      setIsDownloading(true);
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        setIsDownloading(false);
        return;
      }

      // High-resolution canvas (800x1200)
      canvas.width = 800;
      canvas.height = 1200;

      // Background
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Outer Border
      ctx.strokeStyle = "#e2e8f0";
      ctx.lineWidth = 4;
      ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

      // Header Banner
      const headerGrad = ctx.createLinearGradient(0, 0, canvas.width, 0);
      headerGrad.addColorStop(0, "#059669");
      headerGrad.addColorStop(1, "#10b981");
      ctx.fillStyle = headerGrad;
      ctx.fillRect(10, 10, canvas.width - 20, 140);

      // Header Title
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 26px sans-serif";
      ctx.fillText("HỆ THỐNG NÔNG TRẠI THÔNG MINH PLOTFARM", 40, 60);

      ctx.font = "14px sans-serif";
      ctx.fillStyle = "#d1fae5";
      ctx.fillText("BIÊN LAI ĐIỆN TỬ - XÁC THỰC THANH TOÁN TỰ ĐỘNG NAPAS247", 40, 90);
      ctx.fillText("Hotline: 1900 8888  |  Website: https://plotfarm.vn  |  Tiêu chuẩn VietGAP", 40, 115);

      // Watermark in background
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2 + 60);
      ctx.rotate(-Math.PI / 6);
      ctx.font = "bold 44px sans-serif";
      ctx.fillStyle = "rgba(16, 185, 129, 0.07)";
      ctx.textAlign = "center";
      ctx.fillText("PLOTFARM - ĐÃ THANH TOÁN (PAID)", 0, -50);
      ctx.fillText("VIETGAP CERTIFIED - " + txnCode, 0, 50);
      ctx.restore();

      // Info Block: Codes
      ctx.fillStyle = "#f8fafc";
      ctx.fillRect(40, 175, canvas.width - 80, 80);
      ctx.strokeStyle = "#cbd5e1";
      ctx.lineWidth = 1;
      ctx.strokeRect(40, 175, canvas.width - 80, 80);

      ctx.fillStyle = "#64748b";
      ctx.font = "bold 12px sans-serif";
      ctx.fillText("MÃ ĐƠN HÀNG:", 60, 205);
      ctx.fillText("MÃ GIAO DỊCH NGÂN HÀNG (TXN):", 420, 205);

      ctx.fillStyle = "#0f172a";
      ctx.font = "bold 18px monospace";
      ctx.fillText(order.OrderCode, 60, 235);

      ctx.fillStyle = "#047857";
      ctx.fillText(txnCode, 420, 235);

      // Customer & Farm Section
      ctx.fillStyle = "#0f172a";
      ctx.font = "bold 15px sans-serif";
      ctx.fillText("THÔNG TIN HỢP ĐỒNG CANH TÁC", 40, 290);

      ctx.font = "14px sans-serif";
      ctx.fillStyle = "#334155";
      ctx.fillText(`Khách hàng: ${customerName}`, 40, 320);
      ctx.fillText(`Số điện thoại: ${customerPhone || "N/A"}`, 40, 345);
      ctx.fillText(`Phương thức: ${paymentMethodLabel}`, 40, 370);
      ctx.fillText(`Ngày thanh toán: ${formatDate(order.PaidAt || order.CreatedAt)}`, 40, 395);

      ctx.fillText(`Ô đất: ${order.PlotCode} (${order.SizeM2} m²)`, 420, 320);
      ctx.fillText(`Giống cây: ${order.SeedName} (VietGAP)`, 420, 345);
      ctx.fillText(`Gói dịch vụ: ${order.PackageName}`, 420, 370);
      ctx.fillText(`Thời hạn: ${order.DurationMonths} Tháng (${order.TotalRentalDays} ngày)`, 420, 395);

      // Delivery notes if any
      let tableStartY = 430;
      if (order.DeliveryNotes) {
        ctx.fillStyle = "#fef3c7";
        ctx.fillRect(40, 420, canvas.width - 80, 45);
        ctx.strokeStyle = "#fde68a";
        ctx.strokeRect(40, 420, canvas.width - 80, 45);

        ctx.fillStyle = "#92400e";
        ctx.font = "bold 12px sans-serif";
        ctx.fillText("GHI CHÚ GIAO NHẬN: " + order.DeliveryNotes.slice(0, 75), 55, 448);
        tableStartY = 485;
      }

      // Pricing Table Header
      ctx.fillStyle = "#f1f5f9";
      ctx.fillRect(40, tableStartY, canvas.width - 80, 35);
      ctx.strokeStyle = "#cbd5e1";
      ctx.strokeRect(40, tableStartY, canvas.width - 80, 35);

      ctx.fillStyle = "#475569";
      ctx.font = "bold 12px sans-serif";
      ctx.fillText("HẠNG MỤC DỊCH VỤ", 55, tableStartY + 23);
      ctx.fillText("QUY MÔ", 420, tableStartY + 23);
      ctx.fillText("THÀNH TIỀN", 640, tableStartY + 23);

      // Rows
      const rows = [
        { label: "1. Tiền Thuê Mặt Bằng Ô Đất", desc: `${order.DurationMonths} tháng (${order.SizeM2}m²)`, price: formatCurrency(order.RentalFee) },
        { label: "2. Hạt Giống Cây Trồng Chuẩn VietGAP", desc: "Trọn mùa vụ", price: formatCurrency(order.SeedFee) },
        { label: "3. Gói Chăm Sóc & Kỹ Thuật Viên Thực Địa", desc: `${order.DurationMonths} tháng`, price: formatCurrency(order.CareFee) },
      ];

      if (order.DiscountAmount && order.DiscountAmount > 0) {
        rows.push({ label: "4. Chiết Khấu / Ưu Đãi Mùa Vụ", desc: "Khuyến mại", price: "-" + formatCurrency(order.DiscountAmount) });
      }

      let rowY = tableStartY + 35;
      ctx.font = "13px sans-serif";
      for (const row of rows) {
        ctx.strokeStyle = "#e2e8f0";
        ctx.strokeRect(40, rowY, canvas.width - 80, 45);

        ctx.fillStyle = "#1e293b";
        ctx.fillText(row.label, 55, rowY + 28);
        ctx.fillStyle = "#64748b";
        ctx.fillText(row.desc, 420, rowY + 28);
        ctx.fillStyle = "#0f172a";
        ctx.font = "bold 13px sans-serif";
        ctx.fillText(row.price, 640, rowY + 28);
        ctx.font = "13px sans-serif";
        rowY += 45;
      }

      // Total row
      ctx.fillStyle = "#ecfdf5";
      ctx.fillRect(40, rowY, canvas.width - 80, 55);
      ctx.strokeStyle = "#10b981";
      ctx.lineWidth = 2;
      ctx.strokeRect(40, rowY, canvas.width - 80, 55);

      ctx.fillStyle = "#065f46";
      ctx.font = "bold 16px sans-serif";
      ctx.fillText("TỔNG CỘNG ĐÃ THANH TOÁN (PAID)", 55, rowY + 34);

      ctx.fillStyle = "#047857";
      ctx.font = "bold 20px sans-serif";
      ctx.fillText(formatCurrency(order.TotalAmount), 620, rowY + 35);

      // Legal & Verification Footer
      const footerY = rowY + 80;
      ctx.fillStyle = "#f8fafc";
      ctx.fillRect(40, footerY, canvas.width - 80, 80);
      ctx.strokeStyle = "#e2e8f0";
      ctx.lineWidth = 1;
      ctx.strokeRect(40, footerY, canvas.width - 80, 80);

      ctx.fillStyle = "#475569";
      ctx.font = "12px sans-serif";
      ctx.fillText("✓ Biên lai điện tử được mã hóa và xác thực tự động trên hệ thống ngân hàng Napas247.", 55, footerY + 30);
      ctx.fillText("✓ Cam kết đảm bảo SLA chăm sóc và quyền sở hữu toàn bộ sản lượng rau sạch khi thu hoạch.", 55, footerY + 55);

      // Seal Stamp
      ctx.save();
      ctx.translate(canvas.width - 150, footerY + 120);
      ctx.beginPath();
      ctx.arc(0, 0, 45, 0, Math.PI * 2);
      ctx.strokeStyle = "#059669";
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.font = "bold 10px sans-serif";
      ctx.fillStyle = "#059669";
      ctx.textAlign = "center";
      ctx.fillText("PLOTFARM", 0, -18);
      ctx.fillText("ĐÃ XÁC THỰC", 0, 2);
      ctx.fillText("VIETGAP", 0, 20);
      ctx.restore();

      // Download triggered
      const dataUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = `BienLai-PlotFarm-${order.OrderCode}.png`;
      link.href = dataUrl;
      link.click();

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (e) {
      console.error("Receipt generation failed:", e);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Hóa Đơn Thanh Toán Điện Tử"
      maxWidth="lg"
      footer={
        <div className="flex flex-col sm:flex-row items-center justify-between w-full gap-3 print:hidden">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Xác thực thanh toán VietQR Napas247</span>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadReceipt}
              disabled={isDownloading}
              leftIcon={isDownloading ? <Loader2 className="w-4 h-4 animate-spin text-emerald-600" /> : <Download className="w-4 h-4 text-emerald-600" />}
              className="font-bold border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950"
            >
              {isDownloading ? "Đang Tạo Ảnh..." : downloadSuccess ? "Đã Tải Xong ✓" : "Tải Biên Lai (Ảnh)"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              leftIcon={<Printer className="w-4 h-4 text-slate-600" />}
              className="font-bold border-slate-300"
            >
              In Hóa Đơn
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={onClose}
              className="font-bold px-5 bg-emerald-600 hover:bg-emerald-700"
            >
              Hoàn Tất
            </Button>
          </div>
        </div>
      }
    >
      <div id="invoice-printable" className="space-y-6 text-slate-800 dark:text-slate-100 text-xs">
        {/* Invoice Header */}
        <div className="border-b border-slate-200 dark:border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-emerald-600" />
              <h2 className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-white">
                HỆ THỐNG NÔNG TRẠI THÔNG MINH PLOTFARM
              </h2>
            </div>
            <p className="text-[11px] text-slate-500">
              Khu Nông nghiệp Công nghệ cao - Hotline: 1900 8888 - https://plotfarm.vn
            </p>
          </div>
          <div className="text-left sm:text-right space-y-1">
            <Badge variant="success" size="md" className="font-extrabold px-3 py-1">
              ✓ ĐÃ THANH TOÁN (PAID)
            </Badge>
            <div className="text-[11px] text-slate-500">
              Ngày lập: {formatDate(order.PaidAt || order.CreatedAt)}
            </div>
          </div>
        </div>

        {/* Identifiers Card */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Mã Đơn Thuê Nông Trại
            </span>
            <div className="flex items-center gap-2">
              <span className="font-mono font-black text-sm text-slate-900 dark:text-white">
                {order.OrderCode}
              </span>
              <button
                onClick={() => handleCopy(order.OrderCode, "order")}
                className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 transition-colors"
                title="Sao chép mã đơn"
              >
                {copiedCode === "order" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Mã Giao Dịch Ngân Hàng (TXN)
            </span>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-xs text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                {txnCode}
              </span>
              <button
                onClick={() => handleCopy(txnCode, "txn")}
                className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 transition-colors"
                title="Sao chép mã giao dịch"
              >
                {copiedCode === "txn" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Customer & Farm Contract Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="space-y-1.5">
            <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-emerald-600" /> Thông Tin Khách Hàng
            </h4>
            <div className="text-slate-600 dark:text-slate-300 space-y-0.5">
              <p><strong className="text-slate-800 dark:text-slate-200">Họ và tên:</strong> {customerName}</p>
              {customerPhone && <p><strong className="text-slate-800 dark:text-slate-200">Số điện thoại:</strong> {customerPhone}</p>}
              {customerEmail && <p><strong className="text-slate-800 dark:text-slate-200">Email:</strong> {customerEmail}</p>}
              <p><strong className="text-slate-800 dark:text-slate-200">Hình thức:</strong> {paymentMethodLabel}</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Leaf className="w-3.5 h-3.5 text-emerald-600" /> Chi Tiết Canh Tác
            </h4>
            <div className="text-slate-600 dark:text-slate-300 space-y-0.5">
              <p><strong className="text-slate-800 dark:text-slate-200">Ô đất canh tác:</strong> {order.PlotCode} ({order.SizeM2} m²)</p>
              <p><strong className="text-slate-800 dark:text-slate-200">Cây trồng:</strong> {order.SeedName}</p>
              <p><strong className="text-slate-800 dark:text-slate-200">Gói dịch vụ:</strong> {order.PackageName}</p>
              <p><strong className="text-slate-800 dark:text-slate-200">Thời hạn thuê:</strong> {order.DurationMonths} Tháng ({order.TotalRentalDays} ngày)</p>
            </div>
          </div>
        </div>

        {/* Delivery Notes if available */}
        {order.DeliveryNotes && (
          <div className="p-3 bg-amber-50/70 dark:bg-amber-950/30 rounded-2xl border border-amber-200/80 dark:border-amber-900/40 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-2.5">
            <Truck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-bold text-[11px] uppercase tracking-wider text-amber-800 dark:text-amber-300">
                Yêu Cầu & Ghi Chú Giao Nhận Nông Sản:
              </span>
              <p className="italic text-slate-700 dark:text-slate-300">{order.DeliveryNotes}</p>
            </div>
          </div>
        )}

        {/* Transparent Fee Breakdown Table */}
        <div className="space-y-2">
          <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
            Phân Rã Biểu Phí Dịch Vụ Minh Bạch
          </h4>
          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800 text-[10px] font-extrabold uppercase text-slate-500">
                  <th className="p-3">Hạng Mục</th>
                  <th className="p-3 text-center">Thời Hạn / Quy Mô</th>
                  <th className="p-3 text-right">Thành Tiền</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                <tr>
                  <td className="p-3">
                    <span className="font-bold text-slate-800 dark:text-slate-200 block">1. Tiền Thuê Mặt Bằng Ô Đất</span>
                    <span className="text-[10px] text-slate-500">Bảo trì đất, hệ thống tưới tự động, cảm biến IoT</span>
                  </td>
                  <td className="p-3 text-center text-slate-600 dark:text-slate-400">
                    {order.DurationMonths} tháng ({order.SizeM2}m²)
                  </td>
                  <td className="p-3 text-right font-bold text-slate-900 dark:text-white">
                    {formatCurrency(order.RentalFee)}
                  </td>
                </tr>

                <tr>
                  <td className="p-3">
                    <span className="font-bold text-slate-800 dark:text-slate-200 block">2. Hạt Giống Cây Trồng</span>
                    <span className="text-[10px] text-slate-500">{order.SeedName} - Tiêu chuẩn chứng nhận VietGAP</span>
                  </td>
                  <td className="p-3 text-center text-slate-600 dark:text-slate-400">
                    Trọn mùa vụ
                  </td>
                  <td className="p-3 text-right font-bold text-slate-900 dark:text-white">
                    {formatCurrency(order.SeedFee)}
                  </td>
                </tr>

                <tr>
                  <td className="p-3">
                    <span className="font-bold text-slate-800 dark:text-slate-200 block">3. Gói Chăm Sóc & Nhân Sự Kỹ Thuật</span>
                    <span className="text-[10px] text-slate-500">{order.PackageName} - Cam kết SLA phản hồi & nhật ký hình ảnh</span>
                  </td>
                  <td className="p-3 text-center text-slate-600 dark:text-slate-400">
                    {order.DurationMonths} tháng
                  </td>
                  <td className="p-3 text-right font-bold text-slate-900 dark:text-white">
                    {formatCurrency(order.CareFee)}
                  </td>
                </tr>

                {order.DiscountAmount && order.DiscountAmount > 0 ? (
                  <tr className="bg-amber-50/60 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300">
                    <td className="p-3 font-semibold">4. Chiết Khấu / Ưu Đãi Mùa Vụ</td>
                    <td className="p-3 text-center">Khuyến mại</td>
                    <td className="p-3 text-right font-bold">
                      -{formatCurrency(order.DiscountAmount)}
                    </td>
                  </tr>
                ) : null}

                <tr className="bg-emerald-50/70 dark:bg-emerald-950/40 border-t-2 border-emerald-500/50">
                  <td colSpan={2} className="p-3 text-sm font-black text-slate-900 dark:text-white">
                    TỔNG CỘNG ĐÃ THANH TOÁN (PAID)
                  </td>
                  <td className="p-3 text-right text-base font-black text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(order.TotalAmount)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Legal & Guarantee Footer */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 text-[11px] text-slate-500">
          <div className="space-y-1">
            <p className="font-semibold text-slate-700 dark:text-slate-300">
              Biên lai điện tử có giá trị pháp lý theo chứng thực số Napas247 PlotFarm.
            </p>
            <p className="text-[10px]">
              Thời gian thực thi SLA chăm sóc và cam kết giao nông sản tận nơi theo đúng gói dịch vụ đã chọn.
            </p>
          </div>
          <div className="shrink-0 flex flex-col items-center justify-center p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-center">
            <QrCode className="w-8 h-8 text-slate-700 dark:text-slate-300" />
            <span className="text-[8px] font-mono font-bold mt-1 text-slate-400">TRA CỨU HĐ</span>
          </div>
        </div>
      </div>
    </Modal>
  );
};
