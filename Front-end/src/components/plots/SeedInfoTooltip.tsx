'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Info, HelpCircle, Clock, TrendingUp, Sun, Sprout, Sparkles, X } from 'lucide-react';

export interface SeedAnalyticsInfo {
  SeedName: string;
  GrowthDurationDays: number;
  ExpectedYieldKgPerM2: number;
  Season?: string;
  SuitableSoilType?: string;
  Category?: string;
}

export interface SeedInfoTooltipProps {
  seed: SeedAnalyticsInfo;
  className?: string;
  buttonVariant?: 'icon' | 'badge' | 'button';
  label?: string;
}

export const SeedInfoTooltip: React.FC<SeedInfoTooltipProps> = ({
  seed,
  className = '',
  buttonVariant = 'icon',
  label,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close popover when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const seasonText = seed.Season || 'Quanh năm';
  const soilText = seed.SuitableSoilType || 'Đất thịt nhẹ, giàu dinh dưỡng';

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      {/* Trigger Button */}
      {buttonVariant === 'icon' && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen((prev) => !prev);
          }}
          onMouseEnter={() => setIsOpen(true)}
          onMouseLeave={() => setIsOpen(false)}
          aria-label={`Xem thông số sinh trưởng & mùa vụ của ${seed.SeedName}`}
          className="p-1 rounded-full text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-950/60 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors inline-flex items-center justify-center"
        >
          <Info className="w-4 h-4" />
        </button>
      )}

      {buttonVariant === 'badge' && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen((prev) => !prev);
          }}
          aria-label={`Xem thông số sinh trưởng & mùa vụ của ${seed.SeedName}`}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-900 border border-emerald-300 dark:border-emerald-700 transition-all shadow-xs"
        >
          <Sparkles className="w-3 h-3 text-amber-500 animate-pulse" />
          <span>{label || 'Thông số sinh trưởng & Mùa vụ'}</span>
          <Info className="w-3 h-3 text-emerald-600 dark:text-emerald-400 ml-0.5" />
        </button>
      )}

      {buttonVariant === 'button' && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen((prev) => !prev);
          }}
          aria-label={`Xem thông số sinh trưởng & mùa vụ của ${seed.SeedName}`}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 hover:border-emerald-500 hover:text-emerald-600 transition-all shadow-xs"
        >
          <HelpCircle className="w-3.5 h-3.5 text-emerald-600" />
          <span>{label || 'Gợi ý mùa vụ'}</span>
        </button>
      )}

      {/* Floating Tooltip / Popover Content */}
      {isOpen && (
        <div
          role="tooltip"
          onClick={(e) => e.stopPropagation()}
          className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 sm:w-80 p-4 rounded-2xl bg-white dark:bg-slate-900 border-2 border-emerald-500/80 shadow-2xl backdrop-blur-md text-left text-slate-800 dark:text-slate-100 animate-in fade-in zoom-in-95 duration-150"
        >
          {/* Popover Arrow */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1.5 border-8 border-transparent border-t-emerald-500" />

          {/* Header */}
          <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                <Sparkles className="w-4 h-4 text-amber-500" />
              </div>
              <div>
                <h6 className="text-xs font-black uppercase text-slate-900 dark:text-white leading-tight">
                  Thông Số Sinh Trưởng & Mùa Vụ
                </h6>
                <p className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                  {seed.SeedName}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Metrics List */}
          <div className="space-y-2.5 text-xs">
            {/* 1. Thời gian sinh trưởng */}
            <div className="p-2 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-900 flex items-start gap-2.5">
              <div className="p-1.5 rounded-lg bg-emerald-500 text-white shrink-0 mt-0.5 shadow-xs">
                <Clock className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700 dark:text-slate-300 text-[11px]">
                    Thời gian sinh trưởng trung bình:
                  </span>
                  <span className="font-black text-emerald-700 dark:text-emerald-300 text-xs">
                    {seed.GrowthDurationDays} ngày
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">
                  Chu kỳ từ khi gieo mầm tới lúc thu hoạch rộ.
                </p>
              </div>
            </div>

            {/* 2. Năng suất chuẩn */}
            <div className="p-2 rounded-xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-900 flex items-start gap-2.5">
              <div className="p-1.5 rounded-lg bg-blue-500 text-white shrink-0 mt-0.5 shadow-xs">
                <TrendingUp className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700 dark:text-slate-300 text-[11px]">
                    Năng suất chuẩn:
                  </span>
                  <span className="font-black text-blue-700 dark:text-blue-300 text-xs">
                    ~{seed.ExpectedYieldKgPerM2} kg/m²
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">
                  Ước tính sản lượng trung bình trên mỗi mét vuông.
                </p>
              </div>
            </div>

            {/* 3. Mùa vụ thích hợp nhất */}
            <div className="p-2 rounded-xl bg-amber-50/60 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-900 flex items-start gap-2.5">
              <div className="p-1.5 rounded-lg bg-amber-500 text-white shrink-0 mt-0.5 shadow-xs">
                <Sun className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700 dark:text-slate-300 text-[11px]">
                    Mùa vụ thích hợp nhất:
                  </span>
                  <span className="font-black text-amber-700 dark:text-amber-300 text-xs">
                    {seasonText}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">
                  Thời điểm thời tiết tối ưu cho sự phát triển của cây.
                </p>
              </div>
            </div>

            {/* 4. Thổ nhưỡng (tùy chọn) */}
            {soilText && (
              <div className="p-2 rounded-xl bg-teal-50/60 dark:bg-teal-950/40 border border-teal-200/60 dark:border-teal-900 flex items-start gap-2.5">
                <div className="p-1.5 rounded-lg bg-teal-600 text-white shrink-0 mt-0.5 shadow-xs">
                  <Sprout className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-700 dark:text-slate-300 text-[11px]">
                      Loại đất tối ưu:
                    </span>
                    <span className="font-bold text-teal-700 dark:text-teal-300 text-[11px] truncate">
                      {soilText}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 text-center font-medium">
            💡 Dữ liệu gợi ý được tính toán bởi PlotFarm Analytics
          </div>
        </div>
      )}
    </div>
  );
};

export default SeedInfoTooltip;
