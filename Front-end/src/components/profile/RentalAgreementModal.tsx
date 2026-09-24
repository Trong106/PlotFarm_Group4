"use client";

import React, { useState } from "react";
import { 
  FileText, 
  Printer, 
  Copy, 
  Check, 
  ShieldCheck, 
  Calendar, 
  MapPin, 
  Leaf, 
  Download,
  Truck,
  Loader2,
  ScrollText,
  AlertCircle,
  Clock,
  Sparkles,
  Award
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ElectronicInvoiceData } from "./ElectronicInvoiceModal";

interface RentalAgreementModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: ElectronicInvoiceData | null;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
}

export const RentalAgreementModal: React.FC<RentalAgreementModalProps> = ({
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
    });
  };

  const agreementCode = `HDDT-${order.OrderCode}`;
  const signedDate = formatDate(order.PaidAt || order.CreatedAt);

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(type);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  // HTML5 Canvas E-Agreement Export with Watermark
  const handleDownloadAgreement = () => {
    try {
      setIsDownloading(true);
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        setIsDownloading(false);
        return;
      }

      // High-resolution canvas (800x1350)
      canvas.width = 800;
      canvas.height = 1350;

      // Background
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Outer Border
      ctx.strokeStyle = "#0284c7";
      ctx.lineWidth = 4;
      ctx.strokeRect(12, 12, canvas.width - 24, canvas.height - 24);

      // Header Banner
      const headerGrad = ctx.createLinearGradient(0, 0, canvas.width, 0);
      headerGrad.addColorStop(0, "#0369a1");
      headerGrad.addColorStop(1, "#0284c7");
      ctx.fillStyle = headerGrad;
      ctx.fillRect(12, 12, canvas.width - 24, 130);

      // Header Text
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 22px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM", canvas.width / 2, 45);
      ctx.font = "italic 14px sans-serif";
      ctx.fillText("Độc lập - Tự do - Hạnh phúc", canvas.width / 2, 70);

      ctx.font = "bold 16px sans-serif";
      ctx.fillStyle = "#e0f2fe";
      ctx.fillText("THỎA THUẬN DỊCH VỤ THUÊ ĐẤT & CANH TÁC HỮU CƠ PLOTFARM", canvas.width / 2, 110);

      ctx.textAlign = "left";

      // Watermark in background
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(-Math.PI / 6);
      ctx.font = "bold 42px sans-serif";
      ctx.fillStyle = "rgba(2, 132, 199, 0.06)";
      ctx.textAlign = "center";
      ctx.fillText("PLOTFARM - HỢP ĐỒNG ĐIỆN TỬ HỢP LỆ", 0, -60);
      ctx.fillText("E-CONTRACT VERIFIED - " + agreementCode, 0, 40);
      ctx.restore();

      // Agreement metadata block
      ctx.fillStyle = "#f0f9ff";
      ctx.fillRect(40, 160, canvas.width - 80, 65);
      ctx.strokeStyle = "#bae6fd";
      ctx.lineWidth = 1;
      ctx.strokeRect(40, 160, canvas.width - 80, 65);

      ctx.fillStyle = "#0369a1";
      ctx.font = "bold 13px sans-serif";
      ctx.fillText(`MÃ THỎA THUẬN: ${agreementCode}`, 60, 190);
      ctx.fillText(`NGÀY KÝ ĐIỆN TỬ: ${signedDate}`, 450, 190);
      ctx.font = "12px sans-serif";
      ctx.fillStyle = "#475569";
      ctx.fillText(`Căn cứ Luật Trồng trọt số 31/2018/QH14 & Quy chuẩn Nông nghiệp Hữu cơ Việt Nam`, 60, 212);

      // Section 1: The Parties
      ctx.fillStyle = "#0f172a";
      ctx.font = "bold 14px sans-serif";
      ctx.fillText("I. CÁC BÊN THAM GIA THỎA THUẬN", 40, 255);

      // Party A
      ctx.fillStyle = "#f8fafc";
      ctx.fillRect(40, 270, 350, 120);
      ctx.strokeRect(40, 270, 350, 120);
      ctx.fillStyle = "#0369a1";
      ctx.font = "bold 12px sans-serif";
      ctx.fillText("BÊN A: BÊN CHO THUÊ & QUẢN LÝ CANH TÁC", 50, 290);
      ctx.fillStyle = "#334155";
      ctx.font = "11px sans-serif";
      ctx.fillText("CÔNG TY CỔ PHẦN NÔNG NGHIỆP CÔNG NGHỆ CAO PLOTFARM", 50, 310);
      ctx.fillText("Mã số thuế: 0317896888", 50, 330);
      ctx.fillText("Trụ sở: Khu Công Nghệ Cao, TP. Thủ Đức, TP.HCM", 50, 350);
      ctx.fillText("Hotline vận hành: 1900 8888  |  Email: contact@plotfarm.vn", 50, 370);

      // Party B
      ctx.fillStyle = "#f8fafc";
      ctx.fillRect(410, 270, 350, 120);
      ctx.strokeRect(410, 270, 350, 120);
      ctx.fillStyle = "#047857";
      ctx.font = "bold 12px sans-serif";
      ctx.fillText("BÊN B: BÊN THUÊ ĐẤT & SỞ HỮU NÔNG SẢN", 420, 290);
      ctx.fillStyle = "#334155";
      ctx.font = "11px sans-serif";
      ctx.fillText(`Khách hàng: ${customerName}`, 420, 310);
      ctx.fillText(`Số điện thoại: ${customerPhone || "Cập nhật qua tài khoản"}`, 420, 330);
      ctx.fillText(`Email: ${customerEmail || "N/A"}`, 420, 350);
      ctx.fillText(`Địa chỉ: Giao tận nơi theo thỏa thuận đơn hàng`, 420, 370);

      // Section 2: Subject & Specs
      ctx.fillStyle = "#0f172a";
      ctx.font = "bold 14px sans-serif";
      ctx.fillText("II. THÔNG SỐ ĐỐI TƯỢNG CANH TÁC & THỜI HẠN THUÊ", 40, 420);

      ctx.fillStyle = "#f8fafc";
      ctx.fillRect(40, 435, canvas.width - 80, 95);
      ctx.strokeRect(40, 435, canvas.width - 80, 95);

      ctx.fillStyle = "#1e293b";
      ctx.font = "12px sans-serif";
      ctx.fillText(`• Vị trí ô đất: Lô ${order.PlotCode}  |  Diện tích: ${order.SizeM2} m²`, 55, 460);
      ctx.fillText(`• Giống cây trồng đăng ký: ${order.SeedName} (100% Non-GMO, thuần chuẩn)`, 55, 485);
      ctx.fillText(`• Gói kỹ thuật chăm sóc: ${order.PackageName}`, 55, 510);

      ctx.fillText(`• Thời hạn thuê đất: ${order.DurationMonths} Tháng (${order.TotalRentalDays} ngày)`, 450, 460);
      ctx.fillText(`• Bắt đầu: ${formatDate(order.StartDate)}`, 450, 485);
      ctx.fillText(`• Dự kiến kết thúc: ${formatDate(order.EndDate)}`, 450, 510);

      // Section 3: Core Terms (4 điều khoản cốt lõi)
      ctx.fillStyle = "#0f172a";
      ctx.font = "bold 14px sans-serif";
      ctx.fillText("III. BỐN ĐIỀU KHOẢN CỐT LÕI MINH BẠCH", 40, 560);

      const terms = [
        {
          title: "Điều 1 (Thời hạn canh tác & Bàn giao đất):",
          desc: "Bên A có trách nhiệm bàn giao ô đất sạch, khử khuẩn vi sinh và triển khai gieo trồng trong 24h sau khi thanh toán. Bên B được cấp quyền giám sát 24/7 qua camera IoT và nhật ký thực địa."
        },
        {
          title: "Điều 2 (Cam kết chất lượng sạch hữu cơ 100%):",
          desc: "Bên A cam kết 100% quy trình canh tác áp dụng tiêu chuẩn hữu cơ vi sinh, phân trùn quế, chế phẩm sinh học thảo mộc xua côn trùng; nói KHÔNG với phân bón hóa học và thuốc trừ sâu độc hại."
        },
        {
          title: "Điều 3 (Bảo hiểm rủi ro thời tiết & Bảo vệ năng suất):",
          desc: "Trường hợp thiên tai bất khả kháng (bão lũ, sâu bệnh bất khả kháng) làm hao hụt > 30% sản lượng, Bên A kích hoạt bảo hiểm gieo trồng lại miễn phí hoặc bù đắp từ kho nông sản sạch dự phòng."
        },
        {
          title: "Điều 4 (Quy cách thu hoạch & Bàn giao tận nơi):",
          desc: `Nông sản thu hoạch lúc sáng sớm tươi mới nhất, sơ chế đóng thùng chuẩn an toàn VSTP. Giao trực tiếp theo ghi chú: "${order.DeliveryNotes ? order.DeliveryNotes.slice(0, 50) : "Giao tận tay khách hàng trong vòng 6-12h sau thu hoạch"}".`
        }
      ];

      let termY = 585;
      terms.forEach((t, idx) => {
        ctx.fillStyle = "#0369a1";
        ctx.font = "bold 12px sans-serif";
        ctx.fillText(`${idx + 1}. ${t.title}`, 45, termY);

        ctx.fillStyle = "#334155";
        ctx.font = "11px sans-serif";
        ctx.fillText(t.desc.slice(0, 110), 60, termY + 20);
        if (t.desc.length > 110) {
          ctx.fillText(t.desc.slice(110, 220), 60, termY + 38);
          termY += 58;
        } else {
          termY += 44;
        }
      });

      // Section 4: Value & Payment Status
      ctx.fillStyle = "#f0fdf4";
      ctx.fillRect(40, termY + 10, canvas.width - 80, 65);
      ctx.strokeStyle = "#bbf7d0";
      ctx.strokeRect(40, termY + 10, canvas.width - 80, 65);

      ctx.fillStyle = "#166534";
      ctx.font = "bold 13px sans-serif";
      ctx.fillText(`TỔNG GIÁ TRỊ HỢP ĐỒNG: ${formatCurrency(order.TotalAmount)}`, 60, termY + 38);
      ctx.fillText(`TRẠNG THÁI: ĐÃ THANH TOÁN (PAID)`, 450, termY + 38);
      ctx.font = "11px sans-serif";
      ctx.fillText(`Bao gồm: Thuê đất (${formatCurrency(order.RentalFee)}) + Hạt giống (${formatCurrency(order.SeedFee)}) + Chăm sóc (${formatCurrency(order.CareFee)})`, 60, termY + 60);

      // Section 5: Electronic Signatures
      const signY = termY + 105;
      ctx.fillStyle = "#0f172a";
      ctx.font = "bold 13px sans-serif";
      ctx.textAlign = "center";

      ctx.fillText("ĐẠI DIỆN BÊN A (PLOTFARM)", 200, signY);
      ctx.font = "italic 11px sans-serif";
      ctx.fillStyle = "#64748b";
      ctx.fillText("(Ký số & Đóng dấu điện tử)", 200, signY + 18);

      // Official Stamp graphic
      ctx.strokeStyle = "#dc2626";
      ctx.lineWidth = 2;
      ctx.strokeRect(110, signY + 30, 180, 65);
      ctx.fillStyle = "#dc2626";
      ctx.font = "bold 10px sans-serif";
      ctx.fillText("CÔNG TY CP PLOTFARM", 200, signY + 52);
      ctx.fillText("ĐÃ KÝ ĐIỆN TỬ HỢP LỆ", 200, signY + 68);
      ctx.font = "italic 9px sans-serif";
      ctx.fillText(signedDate, 200, signY + 84);

      // Customer
      ctx.fillStyle = "#0f172a";
      ctx.font = "bold 13px sans-serif";
      ctx.fillText("ĐẠI DIỆN BÊN B (BÊN THUÊ)", 600, signY);
      ctx.font = "italic 11px sans-serif";
      ctx.fillStyle = "#64748b";
      ctx.fillText("(Xác thực trực tuyến qua tài khoản)", 600, signY + 18);

      ctx.strokeStyle = "#059669";
      ctx.lineWidth = 2;
      ctx.strokeRect(510, signY + 30, 180, 65);
      ctx.fillStyle = "#059669";
      ctx.font = "bold 11px sans-serif";
      ctx.fillText(customerName, 600, signY + 55);
      ctx.font = "italic 9px sans-serif";
      ctx.fillText("XÁC NHẬN HỢP ĐỒNG", 600, signY + 75);

      // Trigger download
      canvas.toBlob((blob) => {
        if (!blob) {
          setIsDownloading(false);
          return;
        }
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `ThoaThuan-PlotFarm-${order.OrderCode}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setIsDownloading(false);
        setDownloadSuccess(true);
        setTimeout(() => setDownloadSuccess(false), 3000);
      });
    } catch {
      setIsDownloading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Thỏa Thuận Dịch Vụ Thuê Đất & Canh Tác Nông Nghiệp"
      maxWidth="xl"
      footer={
        <div className="flex flex-col sm:flex-row items-center justify-between w-full gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-sky-600" />
            <span>Thỏa thuận điện tử có giá trị pháp lý theo Nghị định 52/2013/NĐ-CP</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              leftIcon={<Printer className="w-3.5 h-3.5" />}
              className="text-xs"
            >
              In Thỏa Thuận
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleDownloadAgreement}
              disabled={isDownloading}
              leftIcon={
                isDownloading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : downloadSuccess ? (
                  <Check className="w-3.5 h-3.5 text-emerald-200" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )
              }
              className="text-xs bg-sky-600 hover:bg-sky-700 font-bold"
            >
              {isDownloading ? "Đang xuất bản lưu..." : downloadSuccess ? "Đã Tải Thỏa Thuận!" : "Tải Văn Bản (Ảnh)"}
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose} className="text-xs">
              Đóng
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-5 text-slate-800 dark:text-slate-100 print:text-black">
        {/* National Banner / Formal Title */}
        <div className="text-center p-4 rounded-2xl bg-gradient-to-r from-sky-50 via-indigo-50 to-blue-50 dark:from-slate-900 dark:via-sky-950/40 dark:to-slate-900 border border-sky-100 dark:border-sky-900/50">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-100 dark:bg-sky-900/60 text-sky-800 dark:text-sky-300 text-xs font-bold mb-2">
            <ScrollText className="w-3.5 h-3.5" />
            HỢP ĐỒNG ĐIỆN TỬ CHÍNH THỨC
          </div>
          <h2 className="text-base sm:text-lg font-black tracking-wide text-sky-900 dark:text-sky-100 uppercase">
            THỎA THUẬN DỊCH VỤ THUÊ ĐẤT & CANH TÁC HỮU CƠ
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 italic">
            Cộng hòa Xã hội Chủ nghĩa Việt Nam — Độc lập - Tự do - Hạnh phúc
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 mt-3 pt-3 border-t border-sky-200/60 dark:border-sky-800/40 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500">Mã thỏa thuận:</span>
              <span className="font-mono font-bold text-sky-700 dark:text-sky-300 bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-sky-200 dark:border-sky-700">
                {agreementCode}
              </span>
              <button
                type="button"
                onClick={() => handleCopy(agreementCode, "code")}
                className="p-1 hover:bg-sky-100 dark:hover:bg-slate-700 rounded text-slate-400 hover:text-sky-600 transition-colors"
                title="Sao chép mã"
              >
                {copiedCode === "code" ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
              <Calendar className="w-3.5 h-3.5 text-sky-600" />
              <span>Ngày ký điện tử: <strong>{signedDate}</strong></span>
            </div>
            <Badge variant="success" className="text-[11px] font-bold">
              ĐÃ XÁC LẬP & CÓ HIỆU LỰC
            </Badge>
          </div>
        </div>

        {/* The Parties: A & B */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Party A */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5">
            <div className="flex items-center gap-1.5 text-sky-700 dark:text-sky-400 font-bold uppercase text-[11px]">
              <ShieldCheck className="w-4 h-4" />
              BÊN A: BÊN CHO THUÊ & QUẢN LÝ
            </div>
            <div className="font-bold text-slate-900 dark:text-slate-100">
              CÔNG TY CỔ PHẦN NÔNG NGHIỆP CÔNG NGHỆ CAO PLOTFARM
            </div>
            <div className="text-slate-600 dark:text-slate-400">
              Mã số thuế: <strong>0317896888</strong> (Sở KH&ĐT TP.HCM)
            </div>
            <div className="text-slate-600 dark:text-slate-400">
              Trụ sở: Khu Công Nghệ Cao, TP. Thủ Đức, TP. Hồ Chí Minh
            </div>
            <div className="text-slate-600 dark:text-slate-400">
              Hotline tiếp nhận: <strong>1900 8888</strong> | Email: contact@plotfarm.vn
            </div>
          </div>

          {/* Party B */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5">
            <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-bold uppercase text-[11px]">
              <Leaf className="w-4 h-4" />
              BÊN B: BÊN THUÊ & SỞ HỮU NÔNG SẢN
            </div>
            <div className="font-bold text-slate-900 dark:text-slate-100">
              {customerName}
            </div>
            <div className="text-slate-600 dark:text-slate-400">
              Số điện thoại: <strong>{customerPhone || "Cập nhật qua hệ thống"}</strong>
            </div>
            <div className="text-slate-600 dark:text-slate-400">
              Email đăng ký: <strong>{customerEmail || "N/A"}</strong>
            </div>
            <div className="text-slate-600 dark:text-slate-400">
              Phương thức giao nhận: Nông sản giao tận nơi theo yêu cầu đơn hàng
            </div>
          </div>
        </div>

        {/* Plot & Crop Specifications */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-xs space-y-3">
          <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-emerald-600" />
            ĐỐI TƯỢNG CANH TÁC & THỜI HẠN THUÊ
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-slate-400 block text-[11px]">Ô đất canh tác</span>
              <strong className="text-slate-800 dark:text-slate-200 text-sm">
                Lô {order.PlotCode} ({order.SizeM2} m²)
              </strong>
            </div>
            <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-slate-400 block text-[11px]">Giống cây trồng</span>
              <strong className="text-emerald-600 dark:text-emerald-400 text-sm">
                {order.SeedName}
              </strong>
            </div>
            <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-slate-400 block text-[11px]">Gói chăm sóc</span>
              <strong className="text-slate-800 dark:text-slate-200 text-sm">
                {order.PackageName}
              </strong>
            </div>
            <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-slate-400 block text-[11px]">Thời hạn hợp đồng</span>
              <strong className="text-sky-600 dark:text-sky-400 text-sm">
                {order.DurationMonths} Tháng ({order.TotalRentalDays} ngày)
              </strong>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between text-slate-500 pt-1 text-[11px] border-t border-slate-200/60 dark:border-slate-700/60">
            <span>Ngày kích hoạt canh tác: <strong>{formatDate(order.StartDate)}</strong></span>
            <span>Ngày dự kiến bàn giao vụ mùa: <strong>{formatDate(order.EndDate)}</strong></span>
          </div>
        </div>

        {/* 4 Core Terms */}
        <div className="space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase text-slate-700 dark:text-slate-300">
            <Award className="w-4 h-4 text-sky-600" />
            BỐN ĐIỀU KHOẢN CỐT LÕI MINH BẠCH
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {/* Term 1 */}
            <div className="p-3.5 rounded-2xl bg-sky-50/60 dark:bg-sky-950/20 border border-sky-100 dark:border-sky-900/40 space-y-1">
              <div className="font-bold text-sky-900 dark:text-sky-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-sky-600" />
                1. Thời hạn canh tác & Bàn giao đất
              </div>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-[11px]">
                Bên A có trách nhiệm bàn giao ô đất sạch, khử trùng vi sinh và triển khai gieo trồng trong <strong>24 giờ</strong> sau khi Bên B hoàn tất thanh toán. Bên B được cấp quyền giám sát 24/7 qua camera IoT và nhật ký số thực địa.
              </p>
            </div>

            {/* Term 2 */}
            <div className="p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 space-y-1">
              <div className="font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                <Leaf className="w-3.5 h-3.5 text-emerald-600" />
                2. Cam kết chuẩn sạch hữu cơ 100%
              </div>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-[11px]">
                Bên A cam kết 100% quy trình canh tác áp dụng tiêu chuẩn hữu cơ vi sinh, phân trùn quế, chế phẩm sinh học thảo mộc xua côn trùng; <strong>tuyệt đối không</strong> dùng thuốc trừ sâu hóa học hay chất kích thích tăng trưởng độc hại.
              </p>
            </div>

            {/* Term 3 */}
            <div className="p-3.5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40 space-y-1">
              <div className="font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                3. Bảo hiểm rủi ro thiên tai & Bảo vệ năng suất
              </div>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-[11px]">
                Trường hợp thiên tai bất khả kháng (bão lũ, sâu bệnh bất khả kháng) làm hao hụt <strong>&gt; 30%</strong> sản lượng tiêu chuẩn, Bên A kích hoạt gói <strong>tái gieo trồng miễn phí 100%</strong> hoặc bù đắp từ kho dự phòng hữu cơ của nông trại.
              </p>
            </div>

            {/* Term 4 */}
            <div className="p-3.5 rounded-2xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/40 space-y-1">
              <div className="font-bold text-purple-900 dark:text-purple-300 flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-purple-600" />
                4. Quy cách thu hoạch & Bàn giao tận nơi
              </div>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-[11px]">
                Nông sản thu hoạch lúc sáng sớm tươi mới nhất, sơ chế đóng thùng chuẩn an toàn thực phẩm. Giao trực tiếp đến tay khách hàng trong vòng <strong>6-12 giờ</strong> sau thu hoạch theo địa chỉ và ghi chú giao nhận đã đăng ký.
              </p>
            </div>
          </div>
        </div>

        {/* Delivery Note if specified */}
        {order.DeliveryNotes && (
          <div className="flex items-start gap-2 p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs">
            <Truck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong className="text-amber-900 dark:text-amber-200 block">Ghi chú giao nhận nông sản của khách hàng:</strong>
              <span className="text-amber-800 dark:text-amber-300 italic">{order.DeliveryNotes}</span>
            </div>
          </div>
        )}

        {/* Total Value & Status */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div>
            <span className="text-slate-500 block">Tổng giá trị hợp đồng trọn gói:</span>
            <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
              {formatCurrency(order.TotalAmount)}
            </span>
          </div>
          <div className="text-right sm:text-right">
            <Badge variant="success" className="font-bold">
              ĐÃ THANH TOÁN (PAID)
            </Badge>
            <span className="text-[11px] text-slate-400 block mt-0.5">
              Mã giao dịch đối soát: {order.TransactionCode || `TXN_${order.OrderCode}`}
            </span>
          </div>
        </div>

        {/* Digital Signatures Box */}
        <div className="p-4 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 grid grid-cols-2 gap-4 text-center text-xs">
          <div className="space-y-2">
            <span className="font-bold text-slate-700 dark:text-slate-300 block">ĐẠI DIỆN BÊN A (PLOTFARM)</span>
            <div className="inline-block p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-[10px] font-bold">
              <ShieldCheck className="w-5 h-5 mx-auto mb-1 text-rose-600" />
              <div>CÔNG TY CP PLOTFARM</div>
              <div className="text-[9px] font-mono">CHỨNG THỰC ĐIỆN TỬ HỢP LỆ</div>
              <div className="text-[8px] italic">{signedDate}</div>
            </div>
          </div>

          <div className="space-y-2">
            <span className="font-bold text-slate-700 dark:text-slate-300 block">ĐẠI DIỆN BÊN B (BÊN THUÊ)</span>
            <div className="inline-block p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
              <Check className="w-5 h-5 mx-auto mb-1 text-emerald-600" />
              <div>{customerName}</div>
              <div className="text-[9px] font-mono">XÁC NHẬN QUA HỆ THỐNG</div>
              <div className="text-[8px] italic">XÁC LẬP THÀNH CÔNG</div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};
export default RentalAgreementModal;
