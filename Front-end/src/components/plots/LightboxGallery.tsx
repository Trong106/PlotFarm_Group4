'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCw,
  RefreshCw,
  UserCheck,
  Calendar,
  Sparkles,
  Download,
  CheckCircle2
} from 'lucide-react';

export interface LightboxImageItem {
  id: number | string;
  url: string;
  title: string;
  date?: string;
  staffName?: string;
  plantHealth?: string;
  notes?: string;
}

interface LightboxGalleryProps {
  images: LightboxImageItem[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onSelectIndex: (index: number) => void;
}

export const LightboxGallery: React.FC<LightboxGalleryProps> = ({
  images,
  currentIndex,
  isOpen,
  onClose,
  onSelectIndex,
}) => {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotation, setRotation] = useState(0);

  const currentImage = images[currentIndex];

  const handlePrev = useCallback(() => {
    if (images.length === 0) return;
    const newIdx = (currentIndex - 1 + images.length) % images.length;
    onSelectIndex(newIdx);
    setZoomLevel(1);
    setRotation(0);
  }, [currentIndex, images.length, onSelectIndex]);

  const handleNext = useCallback(() => {
    if (images.length === 0) return;
    const newIdx = (currentIndex + 1) % images.length;
    onSelectIndex(newIdx);
    setZoomLevel(1);
    setRotation(0);
  }, [currentIndex, images.length, onSelectIndex]);

  // Keyboard Navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handlePrev, handleNext, onClose]);

  if (!isOpen || !currentImage) return null;

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(3, Number((prev + 0.25).toFixed(2))));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(0.5, Number((prev - 0.25).toFixed(2))));
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);
  const handleReset = () => {
    setZoomLevel(1);
    setRotation(0);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return (
      d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
      ' ' +
      d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-between bg-black/90 backdrop-blur-md animate-in fade-in select-none">
      {/* Top Header Controls Bar */}
      <div className="flex items-center justify-between px-4 sm:px-8 py-4 bg-gradient-to-b from-black/80 to-transparent z-10">
        {/* Title & Metadata */}
        <div className="space-y-0.5 max-w-xl text-white">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-600 text-white">
              Ảnh Thực Địa #{currentIndex + 1} / {images.length}
            </span>
            {currentImage.plantHealth && (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-teal-950 border border-teal-500 text-teal-300">
                {currentImage.plantHealth === 'EXCELLENT' || currentImage.plantHealth === 'TOT'
                  ? 'Phát Triển Xuất Sắc'
                  : 'Sức Khỏe Đạt Standard'}
              </span>
            )}
          </div>
          <h3 className="text-sm sm:text-base font-bold text-slate-100 truncate">
            {currentImage.title}
          </h3>
          <div className="flex items-center gap-4 text-xs text-slate-400">
            {currentImage.date && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-emerald-400" /> {formatDate(currentImage.date)}
              </span>
            )}
            {currentImage.staffName && (
              <span className="flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5 text-emerald-400" /> Phụ trách: {currentImage.staffName}
              </span>
            )}
          </div>
        </div>

        {/* Toolbar Controls */}
        <div className="flex items-center gap-2 text-white">
          <div className="flex items-center gap-1 bg-white/10 p-1 rounded-2xl backdrop-blur-md">
            <button
              onClick={handleZoomOut}
              className="p-2 hover:bg-white/20 rounded-xl transition-colors text-slate-200"
              title="Thu nhỏ (Zoom Out)"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono font-bold px-1 w-10 text-center">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              className="p-2 hover:bg-white/20 rounded-xl transition-colors text-slate-200"
              title="Phóng to (Zoom In)"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={handleRotate}
              className="p-2 hover:bg-white/20 rounded-xl transition-colors text-slate-200"
              title="Xoay ảnh 90 độ"
            >
              <RotateCw className="w-4 h-4" />
            </button>
            <button
              onClick={handleReset}
              className="p-2 hover:bg-white/20 rounded-xl transition-colors text-slate-200 text-xs font-semibold"
              title="Đặt lại kích thước"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => window.open(currentImage.url, '_blank')}
            className="p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-colors"
            title="Mở ảnh gốc trong tab mới"
          >
            <Download className="w-4 h-4" />
          </button>

          <button
            onClick={onClose}
            className="p-2.5 rounded-2xl bg-red-600/80 hover:bg-red-600 text-white shadow-lg transition-colors ml-2"
            title="Đóng Lightbox (ESC)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Image Viewer Stage */}
      <div className="relative flex-1 flex items-center justify-center overflow-hidden px-4 py-2">
        {/* Left Arrow */}
        {images.length > 1 && (
          <button
            onClick={handlePrev}
            className="absolute left-4 sm:left-8 z-20 p-3.5 rounded-full bg-black/60 hover:bg-emerald-600 text-white backdrop-blur-md transition-all border border-white/10 shadow-2xl group"
            title="Ảnh trước (Mũi tên Trái)"
          >
            <ChevronLeft className="w-6 h-6 group-hover:-translate-x-0.5 transition-transform" />
          </button>
        )}

        {/* Image Display */}
        <div className="relative max-w-5xl max-h-full flex items-center justify-center overflow-auto p-4 transition-transform duration-300 ease-out">
          <img
            src={currentImage.url}
            alt={currentImage.title}
            className="max-h-[75vh] w-auto object-contain rounded-2xl shadow-2xl transition-all duration-300 border border-white/10"
            style={{
              transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
            }}
          />
        </div>

        {/* Right Arrow */}
        {images.length > 1 && (
          <button
            onClick={handleNext}
            className="absolute right-4 sm:right-8 z-20 p-3.5 rounded-full bg-black/60 hover:bg-emerald-600 text-white backdrop-blur-md transition-all border border-white/10 shadow-2xl group"
            title="Ảnh tiếp theo (Mũi tên Phải)"
          >
            <ChevronRight className="w-6 h-6 group-hover:translate-x-0.5 transition-transform" />
          </button>
        )}
      </div>

      {/* Bottom Thumbnail Strip */}
      {images.length > 1 && (
        <div className="px-6 py-4 bg-gradient-to-t from-black/90 via-black/60 to-transparent z-10">
          <div className="flex items-center justify-center gap-3 overflow-x-auto max-w-4xl mx-auto py-1 custom-scrollbar">
            {images.map((img, idx) => (
              <button
                key={img.id}
                onClick={() => {
                  onSelectIndex(idx);
                  setZoomLevel(1);
                  setRotation(0);
                }}
                className={`relative w-16 h-12 sm:w-20 sm:h-14 rounded-xl overflow-hidden shrink-0 transition-all border-2 ${
                  currentIndex === idx
                    ? 'border-emerald-500 scale-105 shadow-lg shadow-emerald-500/40 ring-2 ring-emerald-400'
                    : 'border-white/20 opacity-50 hover:opacity-100'
                }`}
              >
                <img src={img.url} alt={img.title} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LightboxGallery;
