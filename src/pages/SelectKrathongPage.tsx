import React, { useState } from 'react';
import { Sparkles, Check, ArrowRight, ArrowLeft, Info, Feather, ShieldCheck } from 'lucide-react';
import { KRATHONG_OPTIONS, KrathongArt } from '../components/krathongs/KrathongArt';
import { KrathongTypeId } from '../types';

import { soundService } from '../services/soundService';

interface SelectKrathongPageProps {
  selectedKrathong: KrathongTypeId;
  onSelect: (type: KrathongTypeId) => void;
  onNext: () => void;
  onBack: () => void;
}

export const SelectKrathongPage: React.FC<SelectKrathongPageProps> = ({
  selectedKrathong,
  onSelect,
  onNext,
  onBack,
}) => {
  const currentOption = KRATHONG_OPTIONS.find(k => k.id === selectedKrathong) || KRATHONG_OPTIONS[0];

  const handleChooseKrathong = (id: KrathongTypeId) => {
    soundService.playKrathongSelect();
    onSelect(id);
    onNext();
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Step Indicator */}
      <div className="flex items-center justify-center gap-2 text-xs font-semibold">
        <span className="w-6 h-6 rounded-full bg-cyan-500 text-white flex items-center justify-center">1</span>
        <span className="text-cyan-300">เลือกกระทง</span>
        <span className="text-slate-600">———</span>
        <span className="w-6 h-6 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center">2</span>
        <span className="text-slate-400">เขียนคำอธิษฐาน</span>
        <span className="text-slate-600">———</span>
        <span className="w-6 h-6 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center">3</span>
        <span className="text-slate-400">ลอยสู่แม่น้ำตาปี</span>
      </div>

      {/* Header */}
      <div className="text-center space-y-2 max-w-2xl mx-auto">
        <h1 className="font-heading font-bold text-2xl sm:text-4xl text-white">
          เลือกกระทงดิจิทัลประจำปี ๒๕๖๙
        </h1>
        <p className="text-sm text-slate-300">
          กดเลือกกระทงที่คุณชื่นชอบ ระบบจะเด้งไปหน้าเขียนคำอธิษฐานทันทีโดยไม่ต้องเลื่อนหา (ผสานอัตลักษณ์ กปภ. และสายน้ำตาปี สวยงาม ไร้ขยะในแม่น้ำ)
        </p>
      </div>

      {/* Main Grid: Selection Carousel / Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {KRATHONG_OPTIONS.map(item => {
          const isSelected = item.id === selectedKrathong;
          return (
            <div
              key={item.id}
              onClick={() => handleChooseKrathong(item.id)}
              className={`relative cursor-pointer rounded-2xl p-4 transition-all duration-200 flex flex-col items-center text-center group hover:scale-[1.03] active:scale-98 ${
                isSelected
                  ? 'bg-gradient-to-b from-[#073B66] to-[#0a4878] border-2 border-amber-400 shadow-xl shadow-amber-950/40 ring-2 ring-amber-400/30'
                  : 'bg-slate-900/70 hover:bg-slate-900 border border-cyan-500/25 hover:border-cyan-400/60'
              }`}
            >
              {/* Badge */}
              <div className="absolute top-2.5 right-2.5">
                {isSelected ? (
                  <span className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center shadow">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </span>
                ) : (
                  <span className="text-[10px] text-sky-300/80 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-500/20">
                    {item.badge}
                  </span>
                )}
              </div>

              {/* Krathong Art Preview */}
              <div className="w-28 h-28 my-3 flex items-center justify-center group-hover:scale-105 transition-transform">
                <KrathongArt type={item.id} size={110} animateFlame={isSelected} />
              </div>

              <div className="mt-1">
                <h3 className={`font-heading font-bold text-sm ${isSelected ? 'text-amber-300' : 'text-white'}`}>
                  {item.name}
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{item.nameEn}</p>
              </div>

              <div className="mt-3 w-full">
                <span
                  className={`block w-full py-2 rounded-xl text-xs font-bold transition-all shadow-md ${
                    isSelected
                      ? 'bg-amber-400 text-slate-950 hover:bg-amber-300'
                      : 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white hover:from-cyan-500 hover:to-blue-500 group-hover:shadow-cyan-950/50'
                  }`}
                >
                  เลือกกระทงนี้ทันที →
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Detailed Highlight of Selected Krathong */}
      <div className="bg-gradient-to-r from-[#073B66]/90 via-[#0a4878]/80 to-[#073B66]/90 rounded-3xl p-6 sm:p-8 border border-amber-400/40 shadow-2xl">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          
          {/* Large Krathong Visual */}
          <div className="md:col-span-5 flex flex-col items-center justify-center p-4">
            <div className="relative w-52 h-52 sm:w-64 sm:h-64 flex items-center justify-center">
              <div className="absolute inset-0 bg-amber-400/10 rounded-full blur-2xl animate-pulse" />
              <div className="animate-float-gentle">
                <KrathongArt type={currentOption.id} size={230} animateFlame={true} />
              </div>
            </div>
            <div className="mt-2 text-xs text-amber-300 font-medium flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>ภาพกราฟิกความละเอียดสูง (SVG) คมชัดทุกขนาดหน้าจอ</span>
            </div>
          </div>

          {/* Details & Attributes */}
          <div className="md:col-span-7 space-y-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-semibold border border-amber-400/30">
                <span>{currentOption.badge}</span>
              </div>
              <h2 className="font-heading font-bold text-2xl sm:text-3xl text-white">
                {currentOption.name}
              </h2>
              <p className="text-xs text-cyan-200">{currentOption.nameEn}</p>
            </div>

            <p className="text-sm text-slate-200 leading-relaxed">
              {currentOption.description}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-slate-950/50 border border-cyan-500/20">
                <div className="text-xs text-slate-400 flex items-center gap-1.5 mb-1">
                  <Feather className="w-3.5 h-3.5 text-cyan-400" />
                  <span>วัสดุและแรงบันดาลใจ</span>
                </div>
                <div className="text-xs font-medium text-slate-200">
                  {currentOption.materials}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/50 border border-cyan-500/20">
                <div className="text-xs text-slate-400 flex items-center gap-1.5 mb-1">
                  <Info className="w-3.5 h-3.5 text-amber-400" />
                  <span>ความหมายอันเป็นมงคล</span>
                </div>
                <div className="text-xs font-medium text-amber-200">
                  {currentOption.symbolism}
                </div>
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center gap-4 pt-4">
              <button
                onClick={onBack}
                className="py-3 px-5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-medium text-sm flex items-center gap-2 border border-slate-700 transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>กลับหน้าแรก</span>
              </button>

              <button
                onClick={onNext}
                className="flex-1 py-3 px-6 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-heading font-bold text-base flex items-center justify-center gap-2 shadow-xl shadow-amber-950/40 transition-all hover:scale-102 active:scale-98"
              >
                <span>ยืนยันการเลือกกระทงนี้</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};
