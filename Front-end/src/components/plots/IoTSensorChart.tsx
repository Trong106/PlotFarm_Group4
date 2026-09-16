'use client';

import React, { useState } from 'react';
import { Thermometer, Droplets, Activity, Clock, Info, CheckCircle2 } from 'lucide-react';

interface SensorDataPoint {
  time: string; // e.g., '00:00', '03:00'
  temp: number; // °C
  humidity: number; // %
}

interface IoTSensorChartProps {
  plotCode: string;
  seedName?: string;
}

// Generates realistic mock 24h data based on plotCode for consistent simulation
const generate24hData = (plotCode: string): SensorDataPoint[] => {
  const baseTemp = 24.5;
  const baseHum = 72;
  const times = ['00:00', '02:00', '04:00', '06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00', '24:00'];
  
  // Seed pseudo-random offset from plotCode length/chars
  const offset = (plotCode.charCodeAt(plotCode.length - 1) || 5) % 3;

  return times.map((t, idx) => {
    // Peak temperature during midday (12:00 - 14:00)
    let tempVariation = Math.sin((idx / (times.length - 1)) * Math.PI) * 5; // up to +5°C midday
    let humVariation = -Math.sin((idx / (times.length - 1)) * Math.PI) * 12; // humidity dips midday

    const temp = Number((baseTemp + tempVariation + (offset * 0.4) + (Math.sin(idx) * 0.5)).toFixed(1));
    const humidity = Math.min(95, Math.max(55, Math.round(baseHum + humVariation - (offset * 1.5) + (Math.cos(idx) * 2))));

    return { time: t, temp, humidity };
  });
};

export const IoTSensorChart: React.FC<IoTSensorChartProps> = ({ plotCode, seedName }) => {
  const data = generate24hData(plotCode);
  const [activeMetric, setActiveMetric] = useState<'both' | 'temp' | 'humidity'>('both');
  const [hoveredPoint, setHoveredPoint] = useState<{ point: SensorDataPoint; index: number; x: number; yTemp: number; yHum: number } | null>(null);

  // Min & Max calculations
  const temps = data.map((d) => d.temp);
  const hums = data.map((d) => d.humidity);
  
  const minTemp = Math.min(...temps);
  const maxTemp = Math.max(...temps);
  const avgTemp = (temps.reduce((a, b) => a + b, 0) / temps.length).toFixed(1);

  const minHum = Math.min(...hums);
  const maxHum = Math.max(...hums);
  const avgHum = Math.round(hums.reduce((a, b) => a + b, 0) / hums.length);

  // Chart Dimensions
  const width = 600;
  const height = 220;
  const paddingLeft = 40;
  const paddingRight = 20;
  const paddingTop = 25;
  const paddingBottom = 35;

  const chartW = width - paddingLeft - paddingRight;
  const chartH = height - paddingTop - paddingBottom;

  // Scale ranges
  const tempMinScale = 18;
  const tempMaxScale = 35;
  const humMinScale = 40;
  const humMaxScale = 100;

  // Mapping functions
  const getX = (index: number) => paddingLeft + (index / (data.length - 1)) * chartW;
  const getYTemp = (val: number) => paddingTop + chartH - ((val - tempMinScale) / (tempMaxScale - tempMinScale)) * chartH;
  const getYHum = (val: number) => paddingTop + chartH - ((val - humMinScale) / (humMaxScale - humMinScale)) * chartH;

  // Generate SVG path commands with smooth quadratic bezier curves
  const createPath = (points: { x: number; y: number }[]) => {
    if (points.length === 0) return '';
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const curr = points[i];
      const next = points[i + 1];
      const cpX = (curr.x + next.x) / 2;
      d += ` C ${cpX} ${curr.y}, ${cpX} ${next.y}, ${next.x} ${next.y}`;
    }
    return d;
  };

  const tempPoints = data.map((d, i) => ({ x: getX(i), y: getYTemp(d.temp) }));
  const humPoints = data.map((d, i) => ({ x: getX(i), y: getYHum(d.humidity) }));

  const tempPathD = createPath(tempPoints);
  const humPathD = createPath(humPoints);

  // Closed area paths for gradient backgrounds
  const tempAreaD = `${tempPathD} L ${tempPoints[tempPoints.length - 1].x} ${height - paddingBottom} L ${tempPoints[0].x} ${height - paddingBottom} Z`;
  const humAreaD = `${humPathD} L ${humPoints[humPoints.length - 1].x} ${height - paddingBottom} L ${humPoints[0].x} ${height - paddingBottom} Z`;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 space-y-4 shadow-sm transition-all">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-black text-base sm:text-lg text-slate-900 dark:text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-500 animate-pulse" />
              Biểu Đồ Biến Thiên Cảm Biến IoT 24 Giờ
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              {plotCode}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Lịch sử nhiệt độ đất và độ ẩm không khí thu thập từ trạm đo thực địa
          </p>
        </div>

        {/* Metric Selector Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl shrink-0">
          <button
            onClick={() => setActiveMetric('both')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              activeMetric === 'both'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Tất Cả
          </button>
          <button
            onClick={() => setActiveMetric('temp')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
              activeMetric === 'temp'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40'
            }`}
          >
            <Thermometer className="w-3.5 h-3.5" /> Nhiệt Độ
          </button>
          <button
            onClick={() => setActiveMetric('humidity')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
              activeMetric === 'humidity'
                ? 'bg-cyan-500 text-white shadow-sm'
                : 'text-cyan-600 dark:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-950/40'
            }`}
          >
            <Droplets className="w-3.5 h-3.5" /> Độ Ẩm
          </button>
        </div>
      </div>

      {/* Summary Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-3 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40">
          <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider block">
            Nhiệt Độ TB (24h)
          </span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-lg font-black text-slate-900 dark:text-white">{avgTemp}°C</span>
            <span className="text-[10px] text-slate-500">({minTemp} - {maxTemp}°C)</span>
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-cyan-50/70 dark:bg-cyan-950/20 border border-cyan-200/60 dark:border-cyan-900/40">
          <span className="text-[10px] font-bold text-cyan-700 dark:text-cyan-400 uppercase tracking-wider block">
            Độ Ẩm TB (24h)
          </span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-lg font-black text-slate-900 dark:text-white">{avgHum}%</span>
            <span className="text-[10px] text-slate-500">({minHum} - {maxHum}%)</span>
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40">
          <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">
            Chuẩn VietGAP
          </span>
          <span className="text-xs font-extrabold text-emerald-700 dark:text-emerald-300 block mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> 22°C - 28°C / 65-85%
          </span>
        </div>

        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
            Tần Suất Đo
          </span>
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block mt-1 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-slate-400" /> Cập nhật mỗi 2 giờ
          </span>
        </div>
      </div>

      {/* SVG Chart Container */}
      <div className="relative w-full aspect-[2.6/1] min-h-[200px] select-none">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full overflow-visible"
          onMouseLeave={() => setHoveredPoint(null)}
        >
          <defs>
            {/* Temperature Gradient */}
            <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
            </linearGradient>

            {/* Humidity Gradient */}
            <linearGradient id="humGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines & Y Axis labels */}
          {[0, 0.33, 0.66, 1].map((ratio, idx) => {
            const y = paddingTop + ratio * chartH;
            const tempVal = Math.round(tempMaxScale - ratio * (tempMaxScale - tempMinScale));
            const humVal = Math.round(humMaxScale - ratio * (humMaxScale - humMinScale));
            return (
              <g key={idx}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={width - paddingRight}
                  y2={y}
                  stroke="currentColor"
                  className="text-slate-200 dark:text-slate-800"
                  strokeDasharray="4 4"
                  strokeWidth="1"
                />
                <text
                  x={paddingLeft - 8}
                  y={y + 3}
                  textAnchor="end"
                  className="text-[10px] font-bold fill-slate-400"
                >
                  {activeMetric === 'humidity' ? `${humVal}%` : `${tempVal}°C`}
                </text>
              </g>
            );
          })}

          {/* X Axis Time Labels */}
          {data.map((d, i) => {
            const x = getX(i);
            return (
              <text
                key={i}
                x={x}
                y={height - 10}
                textAnchor="middle"
                className="text-[10px] font-bold fill-slate-400"
              >
                {d.time}
              </text>
            );
          })}

          {/* Area Fills */}
          {(activeMetric === 'both' || activeMetric === 'temp') && (
            <path d={tempAreaD} fill="url(#tempGradient)" />
          )}

          {(activeMetric === 'both' || activeMetric === 'humidity') && (
            <path d={humAreaD} fill="url(#humGradient)" />
          )}

          {/* Line Curves */}
          {(activeMetric === 'both' || activeMetric === 'temp') && (
            <path
              d={tempPathD}
              fill="none"
              stroke="#f59e0b"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {(activeMetric === 'both' || activeMetric === 'humidity') && (
            <path
              d={humPathD}
              fill="none"
              stroke="#06b6d4"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Data Points */}
          {data.map((d, i) => {
            const x = getX(i);
            const yTemp = getYTemp(d.temp);
            const yHum = getYHum(d.humidity);
            const isHovered = hoveredPoint?.index === i;

            return (
              <g key={i}>
                {/* Transparent hover capture column */}
                <rect
                  x={x - chartW / (data.length * 2)}
                  y={paddingTop}
                  width={chartW / data.length}
                  height={chartH}
                  fill="transparent"
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredPoint({ point: d, index: i, x, yTemp, yHum })}
                />

                {/* Vertical guide line on hover */}
                {isHovered && (
                  <line
                    x1={x}
                    y1={paddingTop}
                    x2={x}
                    y2={height - paddingBottom}
                    stroke="#10b981"
                    strokeWidth="1.5"
                    strokeDasharray="3 3"
                  />
                )}

                {/* Temperature Point */}
                {(activeMetric === 'both' || activeMetric === 'temp') && (
                  <circle
                    cx={x}
                    cy={yTemp}
                    r={isHovered ? 6 : 3.5}
                    className={`transition-all ${
                      isHovered
                        ? 'fill-amber-500 stroke-white stroke-2'
                        : 'fill-amber-500'
                    }`}
                  />
                )}

                {/* Humidity Point */}
                {(activeMetric === 'both' || activeMetric === 'humidity') && (
                  <circle
                    cx={x}
                    cy={yHum}
                    r={isHovered ? 6 : 3.5}
                    className={`transition-all ${
                      isHovered
                        ? 'fill-cyan-500 stroke-white stroke-2'
                        : 'fill-cyan-500'
                    }`}
                  />
                )}
              </g>
            );
          })}
        </svg>

        {/* Hover Tooltip overlay */}
        {hoveredPoint && (
          <div
            className="absolute z-20 pointer-events-none bg-slate-900/95 dark:bg-slate-950/95 text-white text-xs p-2.5 rounded-xl shadow-xl border border-slate-700 backdrop-blur-sm -translate-x-1/2 -translate-y-full mb-3 transition-all duration-150"
            style={{
              left: `${(hoveredPoint.x / width) * 100}%`,
              top: `${(Math.min(hoveredPoint.yTemp, hoveredPoint.yHum) / height) * 100}%`,
            }}
          >
            <div className="font-extrabold text-emerald-400 border-b border-slate-800 pb-1 mb-1 text-[11px] flex items-center justify-between gap-3">
              <span>Thì giờ: {hoveredPoint.point.time}</span>
              <span className="text-[10px] text-slate-400">#{hoveredPoint.index + 1}</span>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-4 text-amber-300">
                <span className="flex items-center gap-1">
                  <Thermometer className="w-3 h-3" /> Nhiệt độ đất:
                </span>
                <strong className="font-mono">{hoveredPoint.point.temp} °C</strong>
              </div>
              <div className="flex items-center justify-between gap-4 text-cyan-300">
                <span className="flex items-center gap-1">
                  <Droplets className="w-3 h-3" /> Độ ẩm không khí:
                </span>
                <strong className="font-mono">{hoveredPoint.point.humidity} %</strong>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
        <span className="flex items-center gap-1">
          <Info className="w-3.5 h-3.5 text-slate-400" />
          Rê chuột vào các điểm trên đồ thị để xem chi tiết thông số theo thời gian.
        </span>
        <div className="flex items-center gap-3 font-semibold">
          <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> Nhiệt Độ (°C)
          </span>
          <span className="flex items-center gap-1 text-cyan-600 dark:text-cyan-400">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 inline-block" /> Độ Ẩm (%)
          </span>
        </div>
      </div>
    </div>
  );
};

export default IoTSensorChart;
