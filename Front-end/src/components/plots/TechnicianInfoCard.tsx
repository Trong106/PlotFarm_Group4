'use client';

import React from 'react';
import { UserCheck, Phone, ShieldCheck, Award, Star, MessageSquare, CheckCircle2, Clock } from 'lucide-react';

interface TechnicianInfoCardProps {
  staffName?: string;
  plotCode: string;
  seedName?: string;
  phone?: string;
}

export const TechnicianInfoCard: React.FC<TechnicianInfoCardProps> = ({
  staffName = 'Trần Minh Tuấn',
  plotCode,
  seedName,
  phone = '0900000002'
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 space-y-4 shadow-sm font-sans transition-all">
      {/* Header Badge */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <span className="text-xs font-black text-emerald-800 dark:text-emerald-300 uppercase tracking-wider flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" /> Kỹ Thuật Viên Phụ Trách Ô Đất
        </span>
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300/40">
          ● Đang Trực Ca Nông Trại
        </span>
      </div>

      {/* Main Profile Body */}
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="relative shrink-0">
          <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl overflow-hidden border-2 border-emerald-500 shadow-md bg-slate-100 dark:bg-slate-800">
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80"
              alt={staffName}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="absolute -bottom-1 -right-1 bg-emerald-600 text-white p-1 rounded-full shadow" title="Chứng chỉ Kỹ sư Nông nghiệp VietGAP">
            <Award className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Profile Info */}
        <div className="space-y-1.5 flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-base sm:text-lg font-black text-slate-900 dark:text-white truncate">
              {staffName}
            </h4>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md border border-amber-200/50">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> 4.9/5 (120+ Đánh Giá)
            </span>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
            Chuyên viên Nông nghiệp Hữu cơ VietGAP • <strong className="text-emerald-600 dark:text-emerald-400">3+ năm kinh nghiệm</strong>
          </p>

          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
            Phụ trách trực tiếp quy trình gieo mầm, chăm bón vi sinh và kiểm soát chỉ số môi trường cho luống <strong className="text-slate-700 dark:text-slate-200">{plotCode}</strong> ({seedName || 'Rau sạch'}).
          </p>
        </div>
      </div>

      {/* Qualifications & Quick Actions Bar */}
      <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-bold text-[11px]">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Lịch trình gần nhất: Kiểm tra sâu bệnh & đo độ ẩm 08:30 hôm nay</span>
          </div>
          <div className="flex items-center gap-2 text-slate-500 text-[10px]">
            <Clock className="w-3 h-3 text-slate-400 shrink-0" />
            <span>Thời gian trực ca: 07:00 - 17:00 hàng ngày (Thứ 2 - Chủ Nhật)</span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <a
            href={`tel:${phone.replace(/\s+/g, '')}`}
            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Phone className="w-3.5 h-3.5" /> Gọi Kỹ Thuật Viên
          </a>
          <button
            onClick={() => alert(`Đã gửi yêu cầu kết nối Zalo trực tiếp với kỹ thuật viên ${staffName}`)}
            className="px-3 py-1.5 rounded-xl bg-sky-50 dark:bg-sky-950/40 hover:bg-sky-100 text-sky-700 dark:text-sky-300 border border-sky-200/60 font-bold text-xs flex items-center gap-1.5 transition-colors"
          >
            <MessageSquare className="w-3.5 h-3.5" /> Nhắn Zalo
          </button>
        </div>
      </div>
    </div>
  );
};

export default TechnicianInfoCard;
