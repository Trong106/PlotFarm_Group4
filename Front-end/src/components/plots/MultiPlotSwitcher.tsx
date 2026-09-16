'use client';

import React, { useState } from 'react';
import { Sprout, ChevronDown, Check, Layers, Sliders, Calendar, Sparkles } from 'lucide-react';

export interface CultivationPlotItem {
  CultivationId: number;
  PlotCode: string;
  SeedName: string;
  SeedImageUrl: string;
  ProgressPercent: number;
  CultivationStatus: string;
  ExpectedHarvestDate: string;
  Category?: string;
  SizeM2?: number;
}

interface MultiPlotSwitcherProps<T extends CultivationPlotItem = CultivationPlotItem> {
  cultivations: T[];
  selectedItem: T;
  onSelectPlot: (plot: T) => void;
}

export function MultiPlotSwitcher<T extends CultivationPlotItem = CultivationPlotItem>({
  cultivations,
  selectedItem,
  onSelectPlot,
}: MultiPlotSwitcherProps<T>) {
  const [viewMode, setViewMode] = useState<'tabs' | 'dropdown'>('tabs');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  if (!cultivations || cultivations.length === 0) return null;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 space-y-3.5 shadow-sm transition-all">
      {/* Top Switcher Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center font-bold">
            <Layers className="w-4 h-4" />
          </span>
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
              Bộ Chuyển Đổi Ô Đất (Multi-plot Switcher)
            </h3>
            <p className="text-[11px] text-slate-500">
              Bạn đang sở hữu <strong>{cultivations.length} ô đất</strong> canh tác tại nông trại PlotFarm
            </p>
          </div>
        </div>

        {/* View Mode Toggle (Tabs vs Dropdown) */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl shrink-0">
          <button
            onClick={() => setViewMode('tabs')}
            className={`px-3 py-1 rounded-lg text-xs font-extrabold transition-all ${
              viewMode === 'tabs'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Thẻ Tabs
          </button>
          <button
            onClick={() => setViewMode('dropdown')}
            className={`px-3 py-1 rounded-lg text-xs font-extrabold transition-all ${
              viewMode === 'dropdown'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Menu Xổ (Dropdown)
          </button>
        </div>
      </div>

      {/* MODE 1: TABS VIEW */}
      {viewMode === 'tabs' && (
        <div className="flex items-center gap-3 overflow-x-auto pb-1 custom-scrollbar">
          {cultivations.map((item) => {
            const isSelected = selectedItem.CultivationId === item.CultivationId;
            return (
              <button
                key={item.CultivationId}
                onClick={() => onSelectPlot(item)}
                className={`relative px-4 py-3 rounded-2xl text-xs font-extrabold transition-all shrink-0 flex items-center gap-3 border text-left ${
                  isSelected
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-emerald-500 shadow-md shadow-emerald-600/25 scale-[1.02]'
                    : 'bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 border-slate-200/80 dark:border-slate-700/60 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {/* Seed Image Avatar */}
                <div className="w-9 h-9 rounded-xl overflow-hidden shrink-0 border border-white/20 bg-white shadow-sm">
                  <img src={item.SeedImageUrl} alt={item.SeedName} className="w-full h-full object-cover" />
                </div>

                <div className="space-y-0.5 min-w-[110px]">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-xs font-black">{item.PlotCode}</span>
                    {item.CultivationStatus === 'READY_TO_HARVEST' && (
                      <span className={`px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase ${isSelected ? 'bg-amber-400 text-amber-950' : 'bg-amber-100 text-amber-800'}`}>
                        Thu hoạch
                      </span>
                    )}
                  </div>
                  <p className={`text-[11px] font-bold truncate max-w-[130px] ${isSelected ? 'text-emerald-100' : 'text-slate-500'}`}>
                    {item.SeedName}
                  </p>
                </div>

                {/* Progress Circle / Badge */}
                <div className={`px-2 py-1 rounded-xl text-[10px] font-extrabold shrink-0 ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                }`}>
                  {item.ProgressPercent}%
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* MODE 2: DROPDOWN VIEW */}
      {viewMode === 'dropdown' && (
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen((prev) => !prev)}
            className="w-full p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-100 hover:bg-slate-100 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl overflow-hidden shrink-0 border border-emerald-500">
                <img src={selectedItem.SeedImageUrl} alt={selectedItem.SeedName} className="w-full h-full object-cover" />
              </div>
              <div className="text-left">
                <span className="font-mono text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                  {selectedItem.PlotCode}
                </span>
                <span className="mx-2 text-slate-400">•</span>
                <span>{selectedItem.SeedName} ({selectedItem.ProgressPercent}% tiến độ)</span>
              </div>
            </div>
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {isDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 z-30 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden py-1 max-h-60 overflow-y-auto custom-scrollbar animate-in fade-in">
              {cultivations.map((item) => {
                const isSelected = selectedItem.CultivationId === item.CultivationId;
                return (
                  <button
                    key={item.CultivationId}
                    onClick={() => {
                      onSelectPlot(item);
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full px-4 py-3 text-left text-xs font-bold flex items-center justify-between transition-colors ${
                      isSelected
                        ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg overflow-hidden shrink-0">
                        <img src={item.SeedImageUrl} alt={item.SeedName} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <span className="font-mono font-extrabold">{item.PlotCode}</span> - {item.SeedName}
                        <span className="text-[10px] text-slate-400 block font-normal">Tỉ lệ sinh trưởng: {item.ProgressPercent}%</span>
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-emerald-600" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MultiPlotSwitcher;
